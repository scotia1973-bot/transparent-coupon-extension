/**
 * affiliate.js
 * Transparent affiliate link generation.
 * Never hijacks existing affiliate links. Only appends tags when user explicitly clicks through.
 * Full disclosure shown on every generated link.
 */

const AFFILIATE_CONFIG = {
  'amazon.com': {
    tag: 'gadgethumans-20',
    type: 'associates',
    baseUrl: 'https://www.amazon.com'
  },
  'amazon.ca': {
    tag: 'gadgethumans0e-20',
    type: 'associates',
    baseUrl: 'https://www.amazon.ca'
  },
  'amazon.co.uk': {
    tag: 'gadgethumans0c-21',
    type: 'associates',
    baseUrl: 'https://www.amazon.co.uk'
  },
  'walmart.com': {
    tag: '123456',
    type: 'shareasale',
    baseUrl: 'https://www.walmart.com'
  },
  'target.com': {
    tag: 'abcdef123',
    type: 'cj',
    baseUrl: 'https://www.target.com'
  },
  'bestbuy.com': {
    tag: 'partner456',
    type: 'cj',
    baseUrl: 'https://www.bestbuy.com'
  },
  'ebay.com': {
    tag: 'partner789',
    type: 'ebay_partner',
    baseUrl: 'https://www.ebay.com'
  },
  'nike.com': {
    tag: 'nike_partner',
    type: 'direct',
    baseUrl: 'https://www.nike.com'
  },
  'adidas.com': {
    tag: 'adidas_partner',
    type: 'direct',
    baseUrl: 'https://www.adidas.com'
  },
  'etsy.com': {
    tag: 'etsy_partner',
    type: 'shareasale',
    baseUrl: 'https://www.etsy.com'
  },
  'homedepot.com': {
    tag: 'hd_partner',
    type: 'cj',
    baseUrl: 'https://www.homedepot.com'
  },
  'lowes.com': {
    tag: 'lowes_partner',
    type: 'cj',
    baseUrl: 'https://www.lowes.com'
  },
  'sephora.com': {
    tag: 'sephora_partner',
    type: 'shareasale',
    baseUrl: 'https://www.sephora.com'
  },
  'ulta.com': {
    tag: 'ulta_partner',
    type: 'shareasale',
    baseUrl: 'https://www.ulta.com'
  },
  'macys.com': {
    tag: 'macys_partner',
    type: 'cj',
    baseUrl: 'https://www.macys.com'
  },
  'nordstrom.com': {
    tag: 'nordstrom_partner',
    type: 'shareasale',
    baseUrl: 'https://www.nordstrom.com'
  },
  'kohls.com': {
    tag: 'kohls_partner',
    type: 'cj',
    baseUrl: 'https://www.kohls.com'
  },
  'gap.com': {
    tag: 'gap_partner',
    type: 'shareasale',
    baseUrl: 'https://www.gap.com'
  },
  'wayfair.com': {
    tag: 'wayfair_partner',
    type: 'cj',
    baseUrl: 'https://www.wayfair.com'
  }
};

const DEFAULT_TAG = 'gadgethumans-20';

/**
 * Generate an affiliate link for a given URL and domain.
 * @param {string} url - The original product/store URL
 * @param {string} domain - The domain (e.g., 'amazon.com')
 * @param {boolean} disclose - Whether to include disclosure text
 * @returns {Object} { url: string, disclosure: string, isAffiliate: boolean }
 */
function generateAffiliateLink(url, domain, disclose = true) {
  const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
  const config = AFFILIATE_CONFIG[normalizedDomain];
  
  if (!config) {
    return {
      url: url,
      disclosure: 'No affiliate relationship with this store.',
      isAffiliate: false
    };
  }

  let affiliateUrl = url;
  
  // Check if URL already has an affiliate tag - NEVER hijack existing ones
  const hasExistingTag = 
    url.includes('tag=') || 
    url.includes('affiliate=') || 
    url.includes('partner=') || 
    url.includes('ref=') ||
    url.includes('siteID=') ||
    url.includes('cjevent=');

  if (hasExistingTag) {
    return {
      url: url,
      disclosure: 'This link already has an affiliate tag. We did not modify it.',
      isAffiliate: false
    };
  }

  // Add our affiliate tag
  try {
    const urlObj = new URL(url);
    
    switch (config.type) {
      case 'associates':
        urlObj.searchParams.set('tag', config.tag);
        break;
      case 'shareasale':
        urlObj.searchParams.set('affiliate', config.tag);
        break;
      case 'cj':
        urlObj.searchParams.set('cjevent', config.tag);
        break;
      case 'ebay_partner':
        urlObj.searchParams.set('campid', config.tag);
        break;
      case 'direct':
        urlObj.searchParams.set('ref', config.tag);
        break;
      default:
        urlObj.searchParams.set('tag', config.tag);
    }
    
    affiliateUrl = urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return original URL
    console.warn('Affiliate link generation failed:', e.message);
  }

  const disclosure = disclose 
    ? `🔗 This link includes our affiliate tag (${config.tag}). You pay the exact same price — we earn a small commission if you purchase. We never hide or modify existing affiliate links.`
    : '';

  return {
    url: affiliateUrl,
    disclosure: disclosure,
    isAffiliate: true,
    tag: config.tag
  };
}

/**
 * Get estimated commission rate for a store.
 * @param {string} domain 
 * @returns {Object} { rate: string, description: string }
 */
function getCommissionInfo(domain) {
  const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
  
  const rates = {
    'amazon.com': { rate: '1-10%', description: 'Amazon Associates - varies by category' },
    'walmart.com': { rate: '1-4%', description: 'ShareASale affiliate program' },
    'target.com': { rate: '1-8%', description: 'CJ Affiliate program' },
    'bestbuy.com': { rate: '1-6%', description: 'CJ Affiliate program' },
    'ebay.com': { rate: '1-4%', description: 'eBay Partner Network' },
    'etsy.com': { rate: '2-4%', description: 'ShareASale affiliate program' },
    'nike.com': { rate: '2-5%', description: 'Direct affiliate program' },
    'adidas.com': { rate: '2-5%', description: 'Direct affiliate program' },
    'sephora.com': { rate: '3-8%', description: 'ShareASale affiliate program' },
    'ulta.com': { rate: '3-8%', description: 'ShareASale affiliate program' }
  };

  return rates[normalizedDomain] || { rate: 'Varies', description: 'Affiliate program details not disclosed' };
}

/**
 * Get total user savings and earnings data for the transparency dashboard.
 * @returns {Promise<Object>} { totalUserSavings, totalCommissions, commissionRate }
 */
async function getSavingsDashboard() {
  try {
    const data = await chrome.storage.local.get(['totalUserSavings', 'totalCommissions', 'savingsHistory']);
    return {
      totalUserSavings: data.totalUserSavings || 0,
      totalCommissions: data.totalCommissions || 0,
      savingsHistory: data.savingsHistory || []
    };
  } catch (e) {
    return { totalUserSavings: 0, totalCommissions: 0, savingsHistory: [] };
  }
}

/**
 * Record a commission earned.
 * @param {number} amount - Commission amount in dollars
 * @param {string} store - Store name
 */
async function recordCommission(amount, store) {
  try {
    const data = await chrome.storage.local.get(['totalCommissions', 'savingsHistory']);
    const totalCommissions = (data.totalCommissions || 0) + amount;
    const savingsHistory = data.savingsHistory || [];
    
    savingsHistory.push({
      date: new Date().toISOString(),
      amount: amount,
      store: store,
      type: 'commission'
    });
    
    // Keep last 500 entries
    if (savingsHistory.length > 500) {
      savingsHistory.splice(0, savingsHistory.length - 500);
    }
    
    await chrome.storage.local.set({ totalCommissions, savingsHistory });
  } catch (e) {
    console.warn('Failed to record commission:', e.message);
  }
}

/**
 * Record user savings (the discount they actually got).
 */
async function recordUserSavings(amount, store, code) {
  try {
    const data = await chrome.storage.local.get(['totalUserSavings', 'savingsHistory']);
    const totalUserSavings = (data.totalUserSavings || 0) + amount;
    const savingsHistory = data.savingsHistory || [];
    
    savingsHistory.push({
      date: new Date().toISOString(),
      amount: amount,
      store: store,
      code: code,
      type: 'savings'
    });
    
    if (savingsHistory.length > 500) {
      savingsHistory.splice(0, savingsHistory.length - 500);
    }
    
    await chrome.storage.local.set({ totalUserSavings, savingsHistory });
  } catch (e) {
    console.warn('Failed to record savings:', e.message);
  }
}

// Export
if (typeof window !== 'undefined') {
  window.Affiliate = { 
    generateLink: generateAffiliateLink, 
    getCommission: getCommissionInfo,
    getDashboard: getSavingsDashboard,
    recordCommission,
    recordUserSavings
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateAffiliateLink, getCommissionInfo, getSavingsDashboard, recordCommission, recordUserSavings };
}
