/**
 * service-worker.js
 * Background service worker for Transparent Coupon extension (Manifest V3).
 * Handles coupon data refresh, tab navigation detection, settings sync,
 * and communication with content scripts and popup.
 */

importScripts('../lib/coupon-engine.js');
importScripts('../lib/price-history.js');
importScripts('../lib/affiliate.js');

// --- Constants ---
const REFRESH_ALARM_NAME = 'coupon-refresh';
const REFRESH_INTERVAL_MINUTES = 1440; // 24 hours
const CLEANUP_ALARM_NAME = 'data-cleanup';
const CLEANUP_INTERVAL_MINUTES = 60; // 1 hour

// --- Initialization ---
async function initialize() {
  console.log('[Transparent Coupon] Service worker initializing...');
  
  // Initialize coupon engine
  await couponEngine.initialize();
  
  // Initialize price history
  await priceHistory.initialize();
  
  // Create alarms
  chrome.alarms.create(REFRESH_ALARM_NAME, {
    periodInMinutes: REFRESH_INTERVAL_MINUTES
  });
  
  chrome.alarms.create(CLEANUP_ALARM_NAME, {
    periodInMinutes: CLEANUP_INTERVAL_MINUTES
  });
  
  // Sync initial settings
  await syncSettings();
  
  // Try remote refresh on startup (silently)
  couponEngine.refreshFromApi().catch(() => {});
  
  console.log('[Transparent Coupon] Service worker initialized');
}

// --- Settings Sync ---
async function syncSettings() {
  const defaults = {
    autoApplyEnabled: true,
    priceAlertsEnabled: true,
    showBadgeOnCart: true,
    storeExclusions: [],
    totalUserSavings: 0,
    totalCommissions: 0,
    savingsHistory: [],
    firstInstallDate: new Date().toISOString()
  };
  
  const data = await chrome.storage.local.get(Object.keys(defaults));
  const needsUpdate = Object.keys(defaults).some(key => data[key] === undefined);
  
  if (needsUpdate) {
    const merged = { ...defaults, ...data };
    await chrome.storage.local.set(merged);
  }
}

// --- Alarm Handlers ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case REFRESH_ALARM_NAME:
      await handleCouponRefresh();
      break;
    case CLEANUP_ALARM_NAME:
      await handleDataCleanup();
      break;
  }
});

async function handleCouponRefresh() {
  console.log('[Transparent Coupon] Refreshing coupon data...');
  const result = await couponEngine.refreshFromApi();
  console.log('[Transparent Coupon] Refresh result:', result);
}

async function handleDataCleanup() {
  try {
    const data = await chrome.storage.local.get(['savingsHistory', 'priceHistory']);
    
    // Clean old savings history (keep last 90 days)
    if (data.savingsHistory && Array.isArray(data.savingsHistory)) {
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const filtered = data.savingsHistory.filter(
        entry => new Date(entry.date).getTime() > cutoff
      );
      if (filtered.length !== data.savingsHistory.length) {
        await chrome.storage.local.set({ savingsHistory: filtered });
      }
    }
    
    // Clean old price history (entries older than 1 year)
    if (data.priceHistory && typeof data.priceHistory === 'object') {
      const cleaned = {};
      const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
      
      for (const [key, entry] of Object.entries(data.priceHistory)) {
        if (entry.prices && Array.isArray(entry.prices)) {
          const recentPrices = entry.prices.filter(
            p => new Date(p.date).getTime() > cutoff
          );
          if (recentPrices.length > 0) {
            cleaned[key] = { ...entry, prices: recentPrices };
          }
        }
      }
      
      await chrome.storage.local.set({ priceHistory: cleaned });
    }
  } catch (e) {
    console.warn('[Transparent Coupon] Cleanup error:', e.message);
  }
}

// --- Tab Navigation Detection ---
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when page completes loading
  if (changeInfo.status !== 'complete' || !tab.url) return;
  
  // Detect if it's a shopping site
  const url = new URL(tab.url);
  const domain = url.hostname.replace(/^www\./, '').toLowerCase();
  
  // Check with store detector
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (typeof StoreDetector !== 'undefined' && StoreDetector.detect) {
          return StoreDetector.detect();
        }
        return { isShoppingSite: false };
      }
    });
    
    const storeInfo = result[0]?.result;
    
    if (storeInfo && storeInfo.isShoppingSite) {
      // Store info for quick access
      await chrome.storage.session.set({
        currentStore: storeInfo,
        lastVisitedStore: {
          ...storeInfo,
          visitedAt: new Date().toISOString()
        }
      });
      
      // If on a product page, track the price
      if (storeInfo.pageType === 'product' && storeInfo.product.price) {
        priceHistory.recordPrice({
          url: storeInfo.product.url || tab.url,
          title: storeInfo.product.title,
          price: storeInfo.product.price,
          currency: storeInfo.product.currency || 'USD',
          store: storeInfo.store,
          image: storeInfo.product.image
        }).catch(() => {});
      }
    }
  } catch (e) {
    // Script injection may fail on restricted pages (chrome:// etc.)
    // This is expected and harmless
  }
});

// --- Message Handling ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle async responses
  const handleMessage = async () => {
    switch (message.type) {
      case 'GET_COUPONS':
        return handleGetCoupons(message, sender);
      
      case 'GET_STORE_INFO':
        return handleGetStoreInfo(message, sender);
      
      case 'GET_PRICE_HISTORY':
        return handleGetPriceHistory(message, sender);
      
      case 'RECORD_PRICE':
        return handleRecordPrice(message, sender);
      
      case 'COUPON_APPLIED':
        return handleCouponApplied(message, sender);
      
      case 'GET_SETTINGS':
        return handleGetSettings(message, sender);
      
      case 'UPDATE_SETTINGS':
        return handleUpdateSettings(message, sender);
      
      case 'PAGE_DETECTED':
        // Content script reported page info
        await chrome.storage.session.set({
          currentStore: message.data
        });
        return { received: true };
      
      case 'GET_AFFILIATE_LINK':
        return handleGetAffiliateLink(message, sender);
      
      case 'GET_DASHBOARD':
        return handleGetDashboard(message, sender);
      
      default:
        return { error: 'Unknown message type' };
    }
  };
  
  // Return promise for async handling
  handleMessage().then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleGetCoupons(message) {
  const domain = message.domain || '';
  const coupons = couponEngine.getCouponsForDomain(domain);
  const storeInfo = couponEngine.getStoreInfo(domain);
  return { coupons, storeInfo };
}

async function handleGetStoreInfo(message) {
  const domain = message.domain || '';
  const storeInfo = couponEngine.getStoreInfo(domain);
  return { storeInfo };
}

async function handleGetPriceHistory(message) {
  const url = message.url || '';
  const info = priceHistory.getPriceInfo(url);
  return { priceInfo: info };
}

async function handleRecordPrice(message) {
  const data = message.data || {};
  const result = await priceHistory.recordPrice(data);
  return { recorded: true, priceInfo: result };
}

async function handleCouponApplied(message) {
  const data = message.data || {};
  
  // If user saved money, estimate savings
  if (data.discount) {
    const savings = parseFloat(data.discount) || 0;
    if (savings > 0) {
      await recordUserSavings(savings, data.domain || 'Unknown', data.code);
    }
  }
  
  return { recorded: true };
}

async function handleGetSettings() {
  const data = await chrome.storage.local.get([
    'autoApplyEnabled',
    'priceAlertsEnabled',
    'showBadgeOnCart',
    'storeExclusions',
    'totalUserSavings',
    'totalCommissions',
    'savingsHistory',
    'firstInstallDate'
  ]);
  return data;
}

async function handleUpdateSettings(message) {
  const updates = message.settings || {};
  await chrome.storage.local.set(updates);
  return { success: true };
}

async function handleGetAffiliateLink(message) {
  const { url, domain } = message;
  const result = generateAffiliateLink(url, domain);
  return result;
}

async function handleGetDashboard() {
  const data = await chrome.storage.local.get([
    'totalUserSavings',
    'totalCommissions',
    'savingsHistory',
    'firstInstallDate'
  ]);
  
  return {
    totalUserSavings: data.totalUserSavings || 0,
    totalCommissions: data.totalCommissions || 0,
    savingsHistory: data.savingsHistory || [],
    firstInstallDate: data.firstInstallDate || new Date().toISOString(),
    storesSupported: couponEngine.getAllStores().length,
    activeCoupons: Object.values(COUPON_DATA).reduce(
      (sum, store) => sum + (store.coupons?.length || 0), 0
    )
  };
}

// --- Extension Lifecycle ---
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First install - show onboarding
    await chrome.storage.local.set({
      firstInstallDate: new Date().toISOString(),
      totalUserSavings: 0,
      totalCommissions: 0,
      savingsHistory: []
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: 'https://transparentcoupon.app/welcome'
    }).catch(() => {}); // Ignore if URL isn't accessible
  }
  
  // Initialize on any install/update
  await initialize();
});

chrome.runtime.onStartup.addListener(async () => {
  await initialize();
});

// Start initialization
initialize().catch(console.error);
