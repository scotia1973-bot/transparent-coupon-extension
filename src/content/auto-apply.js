/**
 * auto-apply.js
 * Content script that detects coupon input fields on cart/checkout pages
 * and provides a floating badge to auto-apply coupon codes.
 * Works on 50+ major e-commerce sites.
 *
 * Features:
 * - Detects coupon input fields by common selectors
 * - Shows a floating badge with best coupon
 * - Auto-fill coupon code on user click
 * - Respects user auto-apply setting
 * - Transparent about what it's doing
 */

(function() {
  'use strict';

  // Prevent duplicate injection
  if (window.__transparentCouponAutoApplyLoaded) return;
  window.__transparentCouponAutoApplyLoaded = true;

  // Inject CSS
  function injectCSS() {
    // Check if already injected
    if (document.getElementById('tc-auto-apply-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'tc-auto-apply-styles';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('src/content/auto-apply.css');
    document.head.appendChild(link);
  }

  // Coupon field selectors for major sites
  const COUPON_SELECTORS = {
    // Generic selectors
    'default': [
      'input[name="coupon"]',
      'input[name="promo"]', 
      'input[name="promocode"]',
      'input[name="promo_code"]',
      'input[name="discount"]',
      'input[id="coupon"]',
      'input[id="promo"]',
      'input[id="promocode"]',
      'input[id="promo_code"]',
      'input[placeholder*="coupon" i]',
      'input[placeholder*="promo" i]',
      'input[placeholder*="discount" i]',
      'input[class*="coupon"]',
      'input[class*="promo"]',
      'input[aria-label*="coupon" i]',
      'input[aria-label*="promo" i]',
      '.coupon-field input',
      '.promo-field input',
      '.promo-code input',
      '.discount-code input'
    ],
    // Site-specific selectors
    'amazon.com': [
      '#gc-asin-form input[name="code"]',
      'input[name="promotionCode"]',
      '.a-input-text[aria-label*="coupon"]',
      '.a-input-text[aria-label*="code"]',
      '#gc-redemption-input'
    ],
    'walmart.com': [
      'input[name="promoCode"]',
      'input[data-testid="promo-code-input"]',
      'input[id="promo-code-input"]',
      '.promo-code-input input',
      '#promo-code-input'
    ],
    'target.com': [
      'input[name="promotionCode"]',
      'input[data-test="promoCode"]',
      '#promoCode',
      '#promo-code-input',
      '.promo-code-input input'
    ],
    'bestbuy.com': [
      'input[name="promotionCode"]',
      'input[id="promo-code-input"]',
      '#promo-code-input',
      '.promo-code-field input'
    ],
    'ebay.com': [
      'input[name="couponcode"]',
      '#coupon-code-input',
      '.coupon-code-input input'
    ],
    'nike.com': [
      'input[name="promoCode"]',
      'input[data-attr="promoCode"]',
      '#promoCode'
    ],
    'adidas.com': [
      'input[name="promocode"]',
      '#promocode',
      '.promo-code-field input'
    ],
    'sephora.com': [
      'input[name="promoCode"]',
      '#promo-code',
      '.promo-code-input input'
    ],
    'ulta.com': [
      'input[name="promoCode"]',
      '#promoCodeInput',
      '.promo-code-input input'
    ]
  };

  // Apply button selectors
  const APPLY_SELECTORS = [
    'button[aria-label*="apply" i]',
    'button[id*="apply"]',
    'button[class*="apply"]',
    'input[type="submit"][value*="Apply" i]',
    'input[type="submit"][value*="Redeem" i]',
    'a[class*="apply"]',
    'span[class*="apply"] button',
    'button:has-text("Apply")',
    'button:has-text("Redeem")',
    '[data-testid*="apply-button"]',
    '[data-action*="apply"]'
  ];

  // State
  let badgeElement = null;
  let isMinimized = false;
  let currentDomain = '';
  let currentCoupons = [];
  let autoApplyEnabled = true;

  /**
   * Initialize the auto-apply feature.
   */
  async function initialize() {
    try {
      injectCSS();
      
      // Get domain
      currentDomain = window.location.hostname.replace(/^www\./, '').toLowerCase();
      
      // Load settings
      const settings = await chrome.storage.local.get(['autoApplyEnabled']);
      autoApplyEnabled = settings.autoApplyEnabled !== false; // Default: true
      
      // Load coupon data
      await loadCoupons();
      
      // Wait for page to settle, then look for coupon fields
      setTimeout(() => {
        const couponField = findCouponField();
        
        if (couponField && currentCoupons.length > 0 && autoApplyEnabled) {
          showFloatingBadge();
        }
      }, 1500);
      
      // Watch for dynamically added coupon fields
      watchForCouponFields();
      
      console.log('[Transparent Coupon] Auto-apply initialized');
    } catch (e) {
      console.warn('[Transparent Coupon] Auto-apply init error:', e.message);
    }
  }

  /**
   * Load coupon data from storage or background.
   */
  async function loadCoupons() {
    try {
      // First try from storage (loaded by background)
      const data = await chrome.storage.local.get('couponData');
      if (data.couponData) {
        // Find coupons for current domain
        const store = data.couponData[currentDomain];
        if (store && store.coupons) {
          currentCoupons = store.coupons;
          return;
        }
        
        // Try alternate domains
        for (const [key, store] of Object.entries(data.couponData)) {
          if (currentDomain.includes(key) || key.includes(currentDomain)) {
            currentCoupons = store.coupons || [];
            return;
          }
        }
      }
      
      // If not found, ask background
      chrome.runtime.sendMessage(
        { type: 'GET_COUPONS', domain: currentDomain },
        (response) => {
          if (response && response.coupons) {
            currentCoupons = response.coupons;
          }
        }
      );
    } catch (e) {
      console.warn('[Transparent Coupon] Load coupons error:', e.message);
    }
  }

  /**
   * Find a coupon input field on the page.
   */
  function findCouponField() {
    // Try site-specific selectors first
    const siteSelectors = COUPON_SELECTORS[currentDomain];
    if (siteSelectors) {
      for (const sel of siteSelectors) {
        try {
          const el = document.querySelector(sel);
          if (el && el.offsetParent !== null) return el;
        } catch (e) {}
      }
    }
    
    // Try default selectors
    for (const sel of COUPON_SELECTORS['default']) {
      try {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) return el;
      } catch (e) {}
    }
    
    return null;
  }

  /**
   * Find the apply button near the coupon field.
   */
  function findApplyButton(couponField) {
    // Try to find button in same parent/container
    if (couponField) {
      const parent = couponField.closest('div, form, section, li, label');
      if (parent) {
        for (const sel of APPLY_SELECTORS) {
          try {
            const btn = parent.querySelector(sel);
            if (btn && btn.offsetParent !== null) return btn;
          } catch (e) {}
        }
        
        // Also check siblings and nearby elements
        const allBtns = parent.querySelectorAll('button, input[type="submit"], a[role="button"]');
        for (const btn of allBtns) {
          const text = (btn.textContent || btn.value || '').toLowerCase();
          if (text.includes('apply') || text.includes('redeem') || text.includes('submit') || text.includes('ok')) {
            if (btn.offsetParent !== null) return btn;
          }
        }
      }
    }
    
    // Fallback: look anywhere on the page
    for (const sel of APPLY_SELECTORS) {
      try {
        const btn = document.querySelector(sel);
        if (btn && btn.offsetParent !== null) return btn;
      } catch (e) {}
    }
    
    return null;
  }

  /**
   * Apply a coupon code to the input field and trigger the apply action.
   */
  async function applyCoupon(code) {
    const couponField = findCouponField();
    if (!couponField) {
      showToast('Could not find coupon field on this page');
      return false;
    }
    
    try {
      // Set the value
      couponField.value = code;
      
      // Trigger input event for frameworks (React, Vue, etc.)
      const inputEvent = new Event('input', { bubbles: true, composed: true });
      couponField.dispatchEvent(inputEvent);
      
      const changeEvent = new Event('change', { bubbles: true, composed: true });
      couponField.dispatchEvent(changeEvent);
      
      // Try to trigger the apply button
      const applyBtn = findApplyButton(couponField);
      if (applyBtn) {
        applyBtn.click();
      } else {
        // Try pressing Enter
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          bubbles: true,
          composed: true
        });
        couponField.dispatchEvent(enterEvent);
      }
      
      // Record the savings attempt
      chrome.runtime.sendMessage({
        type: 'COUPON_APPLIED',
        data: { code, domain: currentDomain, timestamp: Date.now() }
      }).catch(() => {});
      
      // Show success animation on badge
      if (badgeElement) {
        const btn = badgeElement.querySelector('.tc-btn-primary');
        if (btn) {
          btn.textContent = '✅ Applied!';
          btn.className = 'tc-btn tc-btn-success';
          setTimeout(() => {
            if (badgeElement) hideBadge();
          }, 2000);
        }
      }
      
      return true;
    } catch (e) {
      console.warn('[Transparent Coupon] Apply error:', e.message);
      showToast('Failed to apply coupon. Please try manually.');
      return false;
    }
  }

  /**
   * Show the floating badge with coupon info.
   */
  function showFloatingBadge() {
    if (badgeElement) return;
    if (currentCoupons.length === 0) return;
    
    const bestCoupon = currentCoupons[0]; // Already sorted best-first
    
    badgeElement = document.createElement('div');
    badgeElement.className = 'transparent-coupon-badge';
    badgeElement.innerHTML = `
      <div class="tc-card">
        <div class="tc-header">
          <div class="tc-logo">
            <span class="tc-logo-icon">$</span>
            <span>Transparent Coupon</span>
          </div>
          <button class="tc-close" id="tc-close-btn">×</button>
        </div>
        <div class="tc-coupon">
          <div class="tc-discount-badge">
            ${bestCoupon.discount}
            <small>OFF</small>
          </div>
          <div class="tc-details">
            <div class="tc-desc">${bestCoupon.description}</div>
            <div class="tc-store">${currentDomain}</div>
            <div class="tc-expiry">${bestCoupon.expiresAt ? 'Expires: ' + new Date(bestCoupon.expiresAt).toLocaleDateString() : 'No expiry'}</div>
          </div>
        </div>
        <div class="tc-actions">
          <button class="tc-btn tc-btn-primary" id="tc-apply-btn">Apply Code: ${bestCoupon.code}</button>
          <button class="tc-btn tc-btn-secondary" id="tc-copy-btn">Copy</button>
        </div>
        <div class="tc-disclosure">
          💚 Transparent Coupon never hijacks affiliate links. We earn a commission only if you buy — you pay the same price.
        </div>
        <div class="tc-dismiss">
          <button id="tc-dismiss-btn">Don't show again on this site</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(badgeElement);
    
    // Event listeners
    document.getElementById('tc-close-btn').addEventListener('click', hideBadge);
    document.getElementById('tc-apply-btn').addEventListener('click', () => {
      applyCoupon(bestCoupon.code);
    });
    document.getElementById('tc-copy-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(bestCoupon.code);
        const btn = document.getElementById('tc-copy-btn');
        btn.textContent = '✓ Copied!';
        btn.className = 'tc-btn tc-btn-copied';
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.className = 'tc-btn tc-btn-secondary';
        }, 2000);
      } catch (e) {
        showToast('Failed to copy to clipboard');
      }
    });
    document.getElementById('tc-dismiss-btn').addEventListener('click', () => {
      chrome.storage.local.set({ [`dismissed_${currentDomain}`]: true });
      hideBadge();
    });
  }

  /**
   * Hide the floating badge.
   */
  function hideBadge() {
    if (badgeElement) {
      badgeElement.style.transition = 'opacity 0.2s, transform 0.2s';
      badgeElement.style.opacity = '0';
      badgeElement.style.transform = 'translateY(20px) scale(0.95)';
      setTimeout(() => {
        if (badgeElement && badgeElement.parentNode) {
          badgeElement.parentNode.removeChild(badgeElement);
        }
        badgeElement = null;
      }, 200);
    }
  }

  /**
   * Show a simple toast message.
   */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 24px;
      z-index: 2147483647;
      background: #1a2332;
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      animation: tc-slide-up 0.2s ease-out;
      max-width: 300px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.2s';
      toast.style.opacity = '0';
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 200);
    }, 3000);
  }

  /**
   * Watch for dynamically added coupon fields (SPA pages).
   */
  function watchForCouponFields() {
    const observer = new MutationObserver((mutations) => {
      // Check if any coupon-related elements were added
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const hasCouponField = findCouponField();
          if (hasCouponField && !badgeElement && currentCoupons.length > 0 && autoApplyEnabled) {
            // Check if dismissed for this site
            chrome.storage.local.get([`dismissed_${currentDomain}`], (result) => {
              if (!result[`dismissed_${currentDomain}`]) {
                showFloatingBadge();
              }
            });
            break;
          }
        }
      }
    });
    
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expose API
  window.__transparentCouponApply = {
    applyCoupon,
    findCouponField,
    findApplyButton,
    showFloatingBadge,
    hideBadge
  };

})();
