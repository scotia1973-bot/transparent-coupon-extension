/**
 * cart-check.js
 * Content script that runs on all pages to detect shopping carts and store info.
 * Communicates detected store/page info to the popup and background service worker.
 */

(function() {
  'use strict';

  let currentStore = null;
  let detectedInfo = null;

  /**
   * Get the product image from the page.
   */
  function getProductImage() {
    const selectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '#landingImage',
      '.product-image img',
      '.main-image img',
      '[data-testid="product-image"] img',
      '.product__image img',
      '.pdp-image img',
      '.prod-image img',
      '.gallery-image img',
      '.product-main-image img',
      '.product-image__main img'
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const src = el.getAttribute('content') || el.getAttribute('src') || el.getAttribute('data-src');
        if (src && !src.startsWith('data:') && src.length > 10) return src;
      }
    }
    return null;
  }

  /**
   * Try to extract cart total from the page.
   */
  function detectCartTotal() {
    const selectors = [
      '.cart-total', '#cart-total', '.subtotal', '.cart-subtotal',
      '[data-testid="cart-total"]', '.order-total', '.total-amount',
      '.grand-total', '.cart-price', '.summary-total',
      '.a-price .a-price-whole', '.total-price'
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim();
        const match = text.match(/[\d,.]+/);
        if (match) {
          const num = parseFloat(match[0].replace(/,/g, ''));
          if (!isNaN(num) && num > 0) return num;
        }
      }
    }
    return null;
  }

  /**
   * Detect coupon input fields on the page for auto-apply.
   */
  function detectCouponFields() {
    const selectors = [
      'input[name="coupon"]',
      'input[name="promo"]',
      'input[name="promocode"]',
      'input[name="promo_code"]',
      'input[name="discount"]',
      'input[name="giftcard"]',
      'input[id="coupon"]',
      'input[id="promo"]',
      'input[id="promocode"]',
      'input[id="promo_code"]',
      'input[class*="coupon"]',
      'input[class*="promo"]',
      'input[class*="discount"]',
      'input[placeholder*="coupon" i]',
      'input[placeholder*="promo" i]',
      'input[placeholder*="discount" i]',
      'input[aria-label*="coupon" i]',
      'input[aria-label*="promo" i]',
      'input[aria-label*="discount" i]',
      '.coupon-field input',
      '.promo-field input',
      '.promo-code input',
      '.discount-code input',
      '#gc-asin-form input',  // Amazon gift cards
      '.a-input-text[aria-label*="code"]'
    ];
    
    const fields = [];
    const seen = new Set();
    
    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      for (const el of elements) {
        if (el.offsetParent !== null && !seen.has(el)) {
          seen.add(el);
          fields.push(el);
        }
      }
    }
    
    return fields;
  }

  /**
   * Detect "Apply" button near coupon fields.
   */
  function detectApplyButtons() {
    const selectors = [
      'button[aria-label*="apply" i]',
      'button:has-text("Apply")',
      'button:has-text("Redeem")',
      'button[class*="apply"]',
      'button[class*="redeem"]',
      'input[type="submit"][value*="Apply" i]',
      'input[type="submit"][value*="Redeem" i]',
      'a:has-text("Apply")',
      'span:has-text("Apply") button',
      '[data-testid*="apply"]',
      '[data-action*="apply"]'
    ];
    
    const buttons = [];
    const seen = new Set();
    
    for (const sel of selectors) {
      try {
        const elements = document.querySelectorAll(sel);
        for (const el of elements) {
          if (el.offsetParent !== null && !seen.has(el)) {
            seen.add(el);
            buttons.push(el);
          }
        }
      } catch (e) {
        // Ignore invalid selectors
      }
    }
    
    // Also find buttons near coupon fields
    const couponFields = detectCouponFields();
    for (const field of couponFields) {
      const parent = field.closest('div, form, section');
      if (parent) {
        const btns = parent.querySelectorAll('button, input[type="submit"], a');
        for (const btn of btns) {
          if (!seen.has(btn) && btn.offsetParent !== null) {
            const text = btn.textContent.toLowerCase();
            if (text.includes('apply') || text.includes('redeem') || text.includes('submit') || text.includes('ok')) {
              seen.add(btn);
              buttons.push(btn);
            }
          }
        }
      }
    }
    
    return buttons;
  }

  /**
   * Send detected data to the background script and popup.
   */
  function sendDetectedInfo(info) {
    try {
      // Store in a global for popup access
      window.__transparentCouponInfo = info;
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: 'PAGE_DETECTED',
        data: info
      }).catch(() => {}); // Ignore if popup isn't open
    } catch (e) {
      // Silently fail if extension context is invalid
    }
  }

  /**
   * Main detection run.
   */
  function runDetection() {
    // Use the StoreDetector if available
    if (typeof StoreDetector !== 'undefined' && StoreDetector.detect) {
      const storeInfo = StoreDetector.detect();
      currentStore = storeInfo;
      
      // Also detect cart total and coupon fields
      const couponFields = detectCouponFields();
      const applyButtons = detectApplyButtons();
      
      detectedInfo = {
        ...storeInfo,
        cartTotal: detectCartTotal(),
        hasCouponField: couponFields.length > 0,
        couponFieldCount: couponFields.length,
        hasApplyButton: applyButtons.length > 0,
        couponFields: couponFields.map(f => ({
          id: f.id,
          name: f.name,
          className: f.className,
          placeholder: f.placeholder
        })),
        timestamp: Date.now()
      };
      
      sendDetectedInfo(detectedInfo);
    }
  }

  // Run detection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDetection);
  } else {
    runDetection();
  }

  // Re-run on AJAX navigation (SPA pages)
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(runDetection, 1000); // Wait for page to update
    }
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  // Expose for popup
  window.__cartCheckAPI = {
    getCurrentStore: () => currentStore,
    getDetectedInfo: () => detectedInfo,
    detectCouponFields,
    detectApplyButtons,
    detectCartTotal,
    runDetection
  };

  console.log('[Transparent Coupon] Cart check initialized');
})();
