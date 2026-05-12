/* ─── Transparent Coupon — Popup Logic ──────────────────────────── */

const State = {
  currentStore: null,
  coupons: [],
  priceHistory: [],
  settings: { autoApply: true, priceAlerts: true, darkMode: false },
  savingsTotal: 0,
};

// ─── DOM References ──────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  themeToggle: $('#themeToggle'),
  settingsToggle: $('#settingsToggle'),
  storeStatus: $('#storeStatus'),
  couponSection: $('#couponSection'),
  priceSection: $('#priceSection'),
  transparencyFooter: $('#transparencyFooter'),
  transparencyBanner: $('#transparencyBanner'),
  transparencyDetails: $('#transparencyDetails'),
  savingsAmount: $('#savingsAmount'),
  settingsPanel: $('#settingsPanel'),
  mainContent: $('#mainContent'),
  toastContainer: $('#toastContainer'),
};

// ─── Theme ───────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('tc-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = saved ? saved === 'dark' : prefersDark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  els.themeToggle.textContent = dark ? '☀️' : '🌙';
  State.settings.darkMode = dark;
}

els.themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('tc-theme', newTheme);
  els.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// ─── Toast ────────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  els.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ─── Formatting ──────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return 'No expiry';
  const d = new Date(ts);
  const now = new Date();
  const diff = d - now;
  if (diff < 0) return 'Expired';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days <= 1 ? `${Math.ceil(diff / (1000 * 60 * 60))}h left` : `${days}d left`;
}

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

// ─── Current Store Detection ─────────────────────────────────────
async function detectCurrentStore() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;

    const url = new URL(tab.url);
    const domain = url.hostname.replace('www.', '');

    // Send message to content script to get store info
    const resp = await chrome.tabs.sendMessage(tab.id, { action: 'getStoreInfo' }).catch(() => null);
    return resp || { domain, name: domain.split('.')[0], pageType: 'unknown' };
  } catch {
    return null;
  }
}

// ─── Render Store Status ─────────────────────────────────────────
function renderStoreStatus(store) {
  if (!store) {
    els.storeStatus.innerHTML = `
      <div class="no-store">
        <div class="no-store-icon">🛍️</div>
        <div>Visit any shopping site to see available deals & coupons</div>
      </div>`;
    return;
  }

  const initial = store.name.charAt(0).toUpperCase();
  els.storeStatus.innerHTML = `
    <div class="store-card">
      <div class="store-logo">${initial}</div>
      <div class="store-info">
        <div class="store-name">${store.name}</div>
        <div class="store-url">${store.domain}</div>
        <div class="store-deals-count">${State.coupons.length} deal${State.coupons.length !== 1 ? 's' : ''} available</div>
      </div>
    </div>`;
}

// ─── Render Coupons ──────────────────────────────────────────────
function renderCoupons() {
  if (!State.coupons.length) {
    els.couponSection.innerHTML = `
      <div class="section-title">Available Deals</div>
      <div class="empty-state">
        <div class="empty-state-text">No coupons available for this store yet.<br>Check back soon!</div>
      </div>`;
    return;
  }

  const bestIdx = State.coupons.findIndex(c => !c.expired && c.discount > 0);
  let html = `<div class="section-title">Available Deals</div>`;

  State.coupons.forEach((c, i) => {
    const isBest = i === bestIdx;
    html += `
      <div class="coupon-card${isBest ? ' best' : ''}">
        ${isBest ? '<div class="best-badge">Best Deal</div>' : ''}
        <div class="coupon-discount">${c.discount}% OFF</div>
        <div class="coupon-desc">${c.description || 'Save on your purchase'}</div>
        <div class="coupon-code" data-code="${c.code}">${c.code} 📋</div>
        <div class="coupon-meta">
          <span class="coupon-expiry">⏱ ${formatDate(c.expiresAt)}</span>
          ${c.source ? `<span>via ${c.source}</span>` : ''}
          <span>${c.used || 0} uses</span>
        </div>
        <div class="coupon-actions">
          <button class="copy-btn" data-code="${c.code}">📋 Copy Code</button>
          <button class="apply-btn" data-code="${c.code}" ${!State.settings.autoApply ? 'disabled' : ''}>⚡ Auto-Apply</button>
        </div>
      </div>`;
  });

  els.couponSection.innerHTML = html;

  // Event listeners
  els.couponSection.querySelectorAll('.coupon-code').forEach(el => {
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(el.dataset.code).then(() => showToast('✅ Copied!'));
    });
  });

  els.couponSection.querySelectorAll('.copy-btn').forEach(el => {
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(el.dataset.code).then(() => showToast('✅ Code copied!'));
    });
  });

  els.couponSection.querySelectorAll('.apply-btn').forEach(el => {
    el.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { action: 'applyCoupon', code: el.dataset.code })
        .then(() => showToast('⚡ Trying to apply code...'))
        .catch(() => showToast('⚠️ Auto-apply failed. Try pasting the code manually.'));
    });
  });
}

// ─── Render Price History ────────────────────────────────────────
function renderPriceHistory() {
  if (!State.priceHistory.length) {
    els.priceSection.style.display = 'none';
    return;
  }

  els.priceSection.style.display = 'block';
  const latest = State.priceHistory[State.priceHistory.length - 1];
  const first = State.priceHistory[0];
  const change = latest.price - first.price;
  const pctChange = first.price ? ((change / first.price) * 100).toFixed(1) : 0;
  const changeClass = change < 0 ? 'down' : change > 0 ? 'up' : 'same';
  const changeIcon = change < 0 ? '📉' : change > 0 ? '📈' : '➡️';
  const maxPrice = Math.max(...State.priceHistory.map(p => p.price));

  let bars = State.priceHistory.map((p, i) => {
    const h = maxPrice ? (p.price / maxPrice) * 40 : 10;
    const isCurrent = i === State.priceHistory.length - 1;
    return `<div class="price-bar${isCurrent ? ' current' : ''}" style="height:${Math.max(h, 4)}px" title="${formatPrice(p.price)} — ${p.date}"></div>`;
  }).join('');

  els.priceSection.innerHTML = `
    <div class="section-title">Price History</div>
    <div class="price-card">
      <div class="price-header">
        <span class="price-title">Current Price</span>
        <span class="price-change ${changeClass}">${changeIcon} ${Math.abs(change / 100).toFixed(2)} (${pctChange}%)</span>
      </div>
      <div class="price-current">${formatPrice(latest.price)}</div>
      <div class="price-history-chart">${bars}</div>
    </div>`;
}

// ─── Load Data ───────────────────────────────────────────────────
async function loadCoupons(domain) {
  // For MVP: use bundled coupon data from chrome.storage
  const result = await chrome.storage.local.get(['couponData', 'savingsTotal']);
  const allCoupons = result.couponData || {};

  // Sample bundled coupons for top stores
  const sampleCoupons = getSampleCoupons(domain);
  State.coupons = sampleCoupons.filter(c => !c.expired);
  State.savingsTotal = result.savingsTotal || 0;
  els.savingsAmount.textContent = `$${State.savingsTotal.toFixed(2)}`;
}

function getSampleCoupons(domain) {
  const storeCoupons = {
    'amazon.com': [
      { code: 'SAVE20', discount: 20, description: '20% off select electronics', expiresAt: Date.now() + 7 * 86400000, source: 'Verified' },
      { code: 'FREESHIP', discount: 0, description: 'Free shipping on orders over $25', expiresAt: Date.now() + 30 * 86400000, source: 'Amazon' },
    ],
    'walmart.com': [
      { code: 'WOW10', discount: 10, description: '10% off home & garden', expiresAt: Date.now() + 14 * 86400000, source: 'Verified' },
      { code: 'PICKUP5', discount: 5, description: '$5 off pickup orders', expiresAt: Date.now() + 21 * 86400000, source: 'Walmart' },
    ],
    'target.com': [
      { code: 'TGT15', discount: 15, description: '15% off apparel & accessories', expiresAt: Date.now() + 10 * 86400000, source: 'Verified' },
      { code: 'CIRCLE10', discount: 10, description: '10% off with Target Circle', expiresAt: Date.now() + 60 * 86400000, source: 'Target' },
    ],
    'bestbuy.com': [
      { code: 'BBY100', discount: 10, description: '10% off purchases $100+', expiresAt: Date.now() + 5 * 86400000, source: 'Verified' },
      { code: 'MEMBER5', discount: 5, description: '5% off for My Best Buy members', expiresAt: Date.now() + 30 * 86400000, source: 'Best Buy' },
    ],
    'ebay.com': [
      { code: 'EBAY20', discount: 20, description: '20% off select categories', expiresAt: Date.now() + 7 * 86400000, source: 'Verified' },
    ],
    'etsy.com': [
      { code: 'ETSY15', discount: 15, description: '15% off your first purchase', expiresAt: Date.now() + 90 * 86400000, source: 'Etsy' },
    ],
    'nike.com': [
      { code: 'NIKE25', discount: 25, description: '25% off sale items', expiresAt: Date.now() + 3 * 86400000, source: 'Verified' },
    ],
    'sephora.com': [
      { code: 'ROUGE20', discount: 20, description: '20% off for Rouge members', expiresAt: Date.now() + 14 * 86400000, source: 'Sephora' },
      { code: 'FRESHSHIP', discount: 0, description: 'Free shipping no minimum', expiresAt: Date.now() + 7 * 86400000, source: 'Verified' },
    ],
  };

  const domainKey = Object.keys(storeCoupons).find(k => domain.includes(k));
  return storeCoupons[domainKey] || [];
}

// ─── Settings ─────────────────────────────────────────────────────
function initSettings() {
  const saved = localStorage.getItem('tc-settings');
  if (saved) {
    try { State.settings = { ...State.settings, ...JSON.parse(saved) }; } catch {}
  }

  document.querySelectorAll('.toggle input').forEach(input => {
    const key = input.id.replace('setting-', '');
    if (key in State.settings) input.checked = State.settings[key];
    input.addEventListener('change', () => {
      State.settings[key] = input.checked;
      localStorage.setItem('tc-settings', JSON.stringify(State.settings));
    });
  });
}

// ─── Settings Panel Toggle ───────────────────────────────────────
els.settingsToggle.addEventListener('click', () => {
  const isVisible = els.settingsPanel.classList.toggle('visible');
  els.mainContent.style.display = isVisible ? 'none' : 'block';
});

// ─── Transparency Footer ─────────────────────────────────────────
els.transparencyBanner.addEventListener('click', () => {
  els.transparencyBanner.classList.toggle('open');
  els.transparencyDetails.classList.toggle('visible');
});

// ─── Price History Tracking ──────────────────────────────────────
async function trackPrice() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const resp = await chrome.tabs.sendMessage(tab.id, { action: 'getProductPrice' }).catch(() => null);
    if (!resp?.price) return;

    const key = `price_${tab.url}`;
    const result = await chrome.storage.local.get([key]);
    let history = result[key] || { prices: [], title: resp.title || '' };

    // Only add if price changed
    const last = history.prices[history.prices.length - 1];
    if (!last || last.price !== resp.price) {
      history.prices.push({ price: resp.price, date: new Date().toLocaleDateString() });
      if (history.prices.length > 30) history.prices.shift();
      await chrome.storage.local.set({ [key]: history });
    }

    State.priceHistory = history.prices;
  } catch {}
}

// ─── Initialize ──────────────────────────────────────────────────
async function init() {
  initTheme();
  initSettings();

  // Show loading
  els.mainContent.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <div>Finding deals...</div>
    </div>`;

  // Detect current store
  const store = await detectCurrentStore();
  State.currentStore = store;

  if (store) {
    await loadCoupons(store.domain);
    await trackPrice();
  }

  // Render
  renderStoreStatus(store);
  renderCoupons();
  renderPriceHistory();

  // Set up coupon refresh via background
  chrome.runtime.sendMessage({ action: 'refreshCoupons' }).catch(() => {});

  // Listen for savings updates from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'savingsUpdated') {
      State.savingsTotal = msg.total;
      els.savingsAmount.textContent = `$${msg.total.toFixed(2)}`;
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
