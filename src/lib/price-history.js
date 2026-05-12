/**
 * price-history.js
 * Tracks product prices over time using chrome.storage.local.
 * Shows price trends, alerts on price drops, and provides price history data.
 */

class PriceHistory {
  constructor() {
    this.storageKey = 'priceHistory';
    this.alertsKey = 'priceAlerts';
    this.data = {};
    this.alerts = {};
  }

  /**
   * Initialize price history from storage.
   */
  async initialize() {
    try {
      const result = await chrome.storage.local.get([this.storageKey, this.alertsKey]);
      this.data = result[this.storageKey] || {};
      this.alerts = result[this.alertsKey] || {};
    } catch (e) {
      console.warn('PriceHistory init error:', e.message);
      this.data = {};
      this.alerts = {};
    }
  }

  /**
   * Record a price observation for a product.
   * @param {Object} product - { url, title, price, currency, store, image }
   */
  async recordPrice(product) {
    if (!product || !product.url || !product.price) return null;

    await this.initialize();

    const normalizedUrl = this._normalizeUrl(product.url);
    
    if (!this.data[normalizedUrl]) {
      this.data[normalizedUrl] = {
        url: product.url,
        title: product.title || 'Unknown Product',
        store: product.store || 'Unknown Store',
        image: product.image || null,
        currency: product.currency || 'USD',
        firstSeen: new Date().toISOString(),
        prices: []
      };
    }

    const entry = this.data[normalizedUrl];
    
    // Update title if we get a better one
    if (product.title && product.title.length > (entry.title || '').length) {
      entry.title = product.title;
    }
    if (product.image) entry.image = product.image;
    
    // Check if we already recorded this price today
    const today = new Date().toISOString().split('T')[0];
    const lastPrice = entry.prices[entry.prices.length - 1];
    
    if (lastPrice && lastPrice.date.startsWith(today) && lastPrice.price === product.price) {
      // Same price today - update timestamp but don't duplicate
      lastPrice.date = new Date().toISOString();
    } else {
      entry.prices.push({
        price: product.price,
        date: new Date().toISOString()
      });
    }

    // Keep only last 365 entries per product
    if (entry.prices.length > 365) {
      entry.prices.splice(0, entry.prices.length - 365);
    }

    await this._save();

    // Check for price drop alerts
    await this._checkAlerts(normalizedUrl, product.price);

    return this.getPriceInfo(normalizedUrl);
  }

  /**
   * Get price info for a product URL.
   * @param {string} url 
   * @returns {Object|null} { currentPrice, lowestPrice, highestPrice, priceChange, percentChange, trend, history }
   */
  getPriceInfo(url) {
    const normalizedUrl = this._normalizeUrl(url);
    const entry = this.data[normalizedUrl];
    if (!entry || !entry.prices || entry.prices.length === 0) return null;

    const prices = entry.prices.map(p => p.price);
    const currentPrice = prices[prices.length - 1];
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const firstPrice = prices[0];
    const priceChange = currentPrice - firstPrice;
    const percentChange = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

    // Calculate trend (last 5 data points vs previous 5)
    const recent5 = prices.slice(-5);
    const older5 = prices.slice(-10, -5);
    const trend = this._calculateTrend(recent5, older5);

    return {
      title: entry.title,
      store: entry.store,
      image: entry.image,
      currency: entry.currency,
      currentPrice,
      lowestPrice,
      highestPrice,
      firstPrice,
      priceChange,
      percentChange: Math.round(percentChange * 100) / 100,
      trend,
      firstSeen: entry.firstSeen,
      priceCount: prices.length,
      history: entry.prices.slice(-50) // Last 50 observations
    };
  }

  /**
   * Set a price drop alert for a product.
   * @param {string} url - Product URL
   * @param {number} targetPrice - Alert when price drops below this
   */
  async setAlert(url, targetPrice) {
    await this.initialize();
    const normalizedUrl = this._normalizeUrl(url);
    
    this.alerts[normalizedUrl] = {
      targetPrice,
      createdAt: new Date().toISOString(),
      triggered: false,
      url
    };

    await this._saveAlerts();
  }

  /**
   * Remove a price alert.
   */
  async removeAlert(url) {
    await this.initialize();
    const normalizedUrl = this._normalizeUrl(url);
    delete this.alerts[normalizedUrl];
    await this._saveAlerts();
  }

  /**
   * Get all active alerts.
   */
  async getAlerts() {
    await this.initialize();
    return Object.entries(this.alerts)
      .filter(([, alert]) => !alert.triggered)
      .map(([key, alert]) => ({ key, ...alert }));
  }

  /**
   * Get all stored price history entries.
   */
  async getAllHistory() {
    await this.initialize();
    return Object.entries(this.data)
      .map(([key, entry]) => ({
        key,
        ...this.getPriceInfo(entry.url)
      }))
      .filter(info => info !== null)
      .sort((a, b) => {
        const aLast = a.history?.[a.history.length - 1]?.date || '';
        const bLast = b.history?.[b.history.length - 1]?.date || '';
        return bLast.localeCompare(aLast);
      });
  }

  /**
   * Clear all price history.
   */
  async clearAll() {
    this.data = {};
    this.alerts = {};
    await this._save();
    await this._saveAlerts();
  }

  /**
   * Check alerts for a product price.
   */
  async _checkAlerts(normalizedUrl, currentPrice) {
    const alert = this.alerts[normalizedUrl];
    if (alert && !alert.triggered && currentPrice <= alert.targetPrice) {
      alert.triggered = true;
      alert.triggeredAt = new Date().toISOString();
      await this._saveAlerts();

      // Notify user via chrome.notifications if available
      try {
        const entry = this.data[normalizedUrl];
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-128.png',
          title: '💰 Price Drop Alert!',
          message: `${entry.title} dropped to $${currentPrice.toFixed(2)}!`,
          priority: 2
        });
      } catch (e) {
        // Notifications may not be available in all contexts
      }
    }
  }

  /**
   * Calculate price trend between two arrays of prices.
   */
  _calculateTrend(recent, older) {
    if (recent.length < 2 || older.length < 2) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const diff = recentAvg - olderAvg;
    
    if (Math.abs(diff) < 0.01) return 'stable';
    if (diff < 0) return 'dropping';
    return 'rising';
  }

  /**
   * Normalize product URLs for consistent keys.
   */
  _normalizeUrl(url) {
    try {
      const u = new URL(url);
      // Remove tracking parameters
      u.searchParams.delete('ref');
      u.searchParams.delete('tag');
      u.searchParams.delete('utm_source');
      u.searchParams.delete('utm_medium');
      u.searchParams.delete('utm_campaign');
      u.searchParams.delete('utm_term');
      u.searchParams.delete('utm_content');
      u.hash = '';
      return u.toString();
    } catch {
      return url;
    }
  }

  async _save() {
    await chrome.storage.local.set({ [this.storageKey]: this.data });
  }

  async _saveAlerts() {
    await chrome.storage.local.set({ [this.alertsKey]: this.alerts });
  }
}

// Singleton
const priceHistory = new PriceHistory();

if (typeof window !== 'undefined') {
  window.PriceHistory = priceHistory;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { priceHistory, PriceHistory };
}
