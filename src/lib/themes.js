/**
 * themes.js
 * Handles dark/light mode switching for the popup UI.
 * Persists user preference in chrome.storage.local.
 */

const THEME_STORAGE_KEY = 'theme_preference';

const LIGHT_THEME = {
  name: 'light',
  colors: {
    // Backgrounds
    bgPrimary: '#ffffff',
    bgSecondary: '#f7f9fc',
    bgCard: '#ffffff',
    bgHover: '#eef3f9',
    bgBadge: '#e8f5e9',
    
    // Text
    textPrimary: '#1a2332',
    textSecondary: '#5a6a7e',
    textMuted: '#8a9aa9',
    textLink: '#0077b6',
    
    // Brand
    brandPrimary: '#00a896',
    brandSecondary: '#0077b6',
    brandAccent: '#02c39a',
    
    // Status
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
    
    // Coupon card
    couponBg: '#ffffff',
    couponBorder: '#e1e8ed',
    couponShadow: 'rgba(0, 0, 0, 0.08)',
    couponDiscountBg: '#e8f5e9',
    couponDiscountText: '#27ae60',
    
    // Borders
    border: '#e1e8ed',
    borderLight: '#f0f3f7',
    
    // Misc
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.4)',
    toggleBg: '#e1e8ed',
    toggleActive: '#00a896',
    inputBg: '#ffffff',
    inputBorder: '#d0d7de'
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    mono: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '50%'
  }
};

const DARK_THEME = {
  name: 'dark',
  colors: {
    bgPrimary: '#0d1117',
    bgSecondary: '#161b22',
    bgCard: '#1c2333',
    bgHover: '#252d3d',
    bgBadge: '#1a3a2a',
    
    textPrimary: '#e6edf3',
    textSecondary: '#8b96a8',
    textMuted: '#6e7b8d',
    textLink: '#58a6ff',
    
    brandPrimary: '#02c39a',
    brandSecondary: '#58a6ff',
    brandAccent: '#00d4aa',
    
    success: '#3fb950',
    warning: '#d29922',
    error: '#f85149',
    info: '#58a6ff',
    
    couponBg: '#1c2333',
    couponBorder: '#30363d',
    couponShadow: 'rgba(0, 0, 0, 0.3)',
    couponDiscountBg: '#1a3a2a',
    couponDiscountText: '#3fb950',
    
    border: '#30363d',
    borderLight: '#21262d',
    
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    toggleBg: '#30363d',
    toggleActive: '#02c39a',
    inputBg: '#161b22',
    inputBorder: '#30363d'
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    mono: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '50%'
  }
};

class ThemeManager {
  constructor() {
    this.currentTheme = LIGHT_THEME;
    this.listeners = [];
  }

  /**
   * Load the saved theme preference.
   */
  async initialize() {
    try {
      const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
      const saved = result[THEME_STORAGE_KEY];
      
      if (saved === 'dark') {
        this.currentTheme = DARK_THEME;
      } else if (saved === 'light' || !saved) {
        this.currentTheme = LIGHT_THEME;
      } else {
        // Auto-detect from system preference
        this.currentTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches 
          ? DARK_THEME : LIGHT_THEME;
      }
    } catch {
      this.currentTheme = LIGHT_THEME;
    }
    
    this._applyTheme();
  }

  /**
   * Toggle between light and dark themes.
   */
  async toggle() {
    if (this.currentTheme.name === 'light') {
      this.currentTheme = DARK_THEME;
      await chrome.storage.local.set({ [THEME_STORAGE_KEY]: 'dark' });
    } else {
      this.currentTheme = LIGHT_THEME;
      await chrome.storage.local.set({ [THEME_STORAGE_KEY]: 'light' });
    }
    
    this._applyTheme();
    this._notifyListeners();
  }

  /**
   * Set a specific theme.
   */
  async setTheme(themeName) {
    if (themeName === 'dark') {
      this.currentTheme = DARK_THEME;
    } else if (themeName === 'light') {
      this.currentTheme = LIGHT_THEME;
    } else {
      // Auto
      this.currentTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches 
        ? DARK_THEME : LIGHT_THEME;
    }
    
    await chrome.storage.local.set({ [THEME_STORAGE_KEY]: themeName });
    this._applyTheme();
    this._notifyListeners();
  }

  /**
   * Get current theme object.
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Check if dark mode is active.
   */
  isDark() {
    return this.currentTheme.name === 'dark';
  }

  /**
   * Register a listener for theme changes.
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Apply theme as CSS custom properties on document root.
   */
  _applyTheme() {
    const root = document.documentElement;
    const t = this.currentTheme;
    
    root.setAttribute('data-theme', t.name);
    
    // Apply all color vars
    for (const [key, value] of Object.entries(t.colors)) {
      root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    }
    
    // Apply font vars
    for (const [key, value] of Object.entries(t.fonts)) {
      root.style.setProperty(`--font-${key}`, value);
    }
    
    // Apply spacing vars
    for (const [key, value] of Object.entries(t.spacing)) {
      root.style.setProperty(`--spacing-${key}`, value);
    }
    
    // Apply border radius vars
    for (const [key, value] of Object.entries(t.borderRadius)) {
      root.style.setProperty(`--radius-${key}`, value);
    }
    
    // Toggle body class
    document.body.classList.toggle('dark-mode', t.name === 'dark');
    document.body.classList.toggle('light-mode', t.name === 'light');
  }

  _notifyListeners() {
    for (const listener of this.listeners) {
      try { listener(this.currentTheme); } catch (e) { /* ignore */ }
    }
  }
}

// Singleton
const themeManager = new ThemeManager();

if (typeof window !== 'undefined') {
  window.ThemeManager = themeManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { themeManager, ThemeManager, LIGHT_THEME, DARK_THEME };
}
