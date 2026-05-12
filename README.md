# Transparent Coupon — Honest Deals

A **privacy-first, transparent** Chrome extension that finds and applies coupon codes automatically.

Built after the PayPal Honey scandal destroyed user trust in coupon extensions.

**No dark patterns. No affiliate link hijacking. Full transparency.**

## Features

- 🔍 **Auto-detect stores** — Knows 1000+ e-commerce sites
- 💰 **Find coupon codes** — Best deals shown first
- ⚡ **Auto-apply coupons** — Fill coupon codes with one click
- 📉 **Price history** — Track price changes over time
- 🔒 **Privacy first** — No tracking, no data collection
- 🌙 **Dark mode** — Easy on the eyes

## How We Make Money

We add our affiliate tag to shopping links. **You pay the same price.** We earn a small commission from the store. That's it. No hidden fees, no link hijacking, no dark patterns.

## Installation

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `transparent-coupon/` folder

## Development

```bash
# Build icon variants
# 16x16, 48x48, 128x128 PNG icons needed in /icons/

# Load unpacked extension:
# chrome://extensions/ → Load unpacked → select this directory
```

## Architecture

```
src/
├── background/
│   └── service-worker.js   # Coupon refresh, affiliate links, alarms
├── content/
│   ├── cart-check.js       # Detect shopping sites & cart contents
│   ├── auto-apply.js       # Auto-fill coupon codes on checkout
│   └── auto-apply.css      # Floating badge styles
├── popup/
│   ├── popup.html          # Popup UI
│   ├── popup.js            # Popup logic
│   └── popup.css           # Popup styles
└── lib/
    ├── affiliate.js        # Transparent affiliate link generation
    ├── coupon-engine.js    # Coupon matching logic
    ├── price-history.js    # Price tracking
    ├── store-detector.js   # Store detection
    └── themes.js           # Dark/light theme
```

## License

MIT
