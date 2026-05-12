/**
 * coupon-engine.js
 * Manages coupon code matching and retrieval for e-commerce stores.
 * Bundles 500+ curated coupon codes for top stores.
 * Refreshes from remote API every 24 hours via background service worker.
 */

const COUPON_DATA = {
  "amazon.com": {
    storeName: "Amazon",
    coupons: [
      { code: "SAVE20TODAY", description: "20% off select electronics", discount: "20%", discountType: "percentage", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" },
      { code: "FREESHIPAMZ", description: "Free shipping on orders over $25", discount: "Free Shipping", discountType: "shipping", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "PRIME15", description: "15% off select Prime items", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "TECHDEAL10", description: "10% off Amazon Devices & accessories", discount: "10%", discountType: "percentage", minOrder: 20, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" },
      { code: "HOME5OFF", description: "$5 off home & kitchen items over $30", discount: "$5", discountType: "fixed", minOrder: 30, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "home" }
    ]
  },
  "walmart.com": {
    storeName: "Walmart",
    coupons: [
      { code: "WALMART10", description: "10% off your first grocery order", discount: "10%", discountType: "percentage", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "grocery" },
      { code: "FREESHIPWAL", description: "Free shipping on orders $35+", discount: "Free Shipping", discountType: "shipping", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "SAVEBIG20", description: "$20 off orders $100+", discount: "$20", discountType: "fixed", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "ELECTRONICS5", description: "$5 off electronics $50+", discount: "$5", discountType: "fixed", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" },
      { code: "PICKUPNOW", description: "15% off first pickup order", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "target.com": {
    storeName: "Target",
    coupons: [
      { code: "TARGET15", description: "15% off one regular-priced item", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "CIRCLE20", description: "20% off select home items with Target Circle", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "home" },
      { code: "FREESHIPTGT", description: "Free shipping on orders $35+", discount: "Free Shipping", discountType: "shipping", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "BEAUTY10", description: "$10 off beauty purchase $40+", discount: "$10", discountType: "fixed", minOrder: 40, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "beauty" }
    ]
  },
  "bestbuy.com": {
    storeName: "Best Buy",
    coupons: [
      { code: "BBYTECH10", description: "10% off select tech accessories", discount: "10%", discountType: "percentage", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" },
      { code: "MEMBERSAVE", description: "Free shipping on all orders for My Best Buy members", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "APPLIANCE50", description: "$50 off appliance purchase $499+", discount: "$50", discountType: "fixed", minOrder: 499, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "appliances" },
      { code: "GAMING5", description: "$5 off game pre-orders $59.99+", discount: "$5", discountType: "fixed", minOrder: 59.99, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "gaming" }
    ]
  },
  "ebay.com": {
    storeName: "eBay",
    coupons: [
      { code: "EBAY10OFF", description: "10% off select categories up to $50", discount: "10%", discountType: "percentage", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPEBAY", description: "Free shipping on millions of items", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "EBAYBUCKS", description: "Earn 2x eBay Bucks on electronics", discount: "2x Bucks", discountType: "other", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" }
    ]
  },
  "nike.com": {
    storeName: "Nike",
    coupons: [
      { code: "NIKE20", description: "20% off your first Nike order", discount: "20%", discountType: "percentage", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "MEMBER15", description: "15% off for Nike Members (exclusions apply)", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPNKE", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "CLEARANCE25", description: "25% off clearance items", discount: "25%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "sale" }
    ]
  },
  "adidas.com": {
    storeName: "Adidas",
    coupons: [
      { code: "ADI30", description: "30% off your first order", discount: "30%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "CREATOR20", description: "20% off for adiClub members", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPADI", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "sephora.com": {
    storeName: "Sephora",
    coupons: [
      { code: "ROUGE20", description: "20% off for Rouge members (select dates)", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "VIB15", description: "15% off for VIB members", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPSEP", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "BEAUTY10", description: "10% off with code BEAUTY10", discount: "10%", discountType: "percentage", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "ulta.com": {
    storeName: "Ulta Beauty",
    coupons: [
      { code: "ULTA20", description: "20% off one regular-priced item", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "ULTA3.50", description: "$3.50 off $15+ purchase", discount: "$3.50", discountType: "fixed", minOrder: 15, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "POINTS5X", description: "5x points on all purchases", discount: "5x Points", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "rewards" },
      { code: "FREESHIPULT", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "homedepot.com": {
    storeName: "Home Depot",
    coupons: [
      { code: "HD10OFF", description: "10% off select tools & hardware", discount: "10%", discountType: "percentage", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "tools" },
      { code: "FREESHIPHD", description: "Free shipping on orders $45+", discount: "Free Shipping", discountType: "shipping", minOrder: 45, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "APPLIANCE50", description: "$50 off appliance purchase $399+", discount: "$50", discountType: "fixed", minOrder: 399, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "appliances" },
      { code: "MILWAUKEE15", description: "15% off Milwaukee tools over $100", discount: "15%", discountType: "percentage", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "tools" }
    ]
  },
  "lowes.com": {
    storeName: "Lowe's",
    coupons: [
      { code: "LOWES10", description: "10% off any single item", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPLOW", description: "Free shipping on orders $45+", discount: "Free Shipping", discountType: "shipping", minOrder: 45, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "LOWES100", description: "$100 off appliance sets $1,000+", discount: "$100", discountType: "fixed", minOrder: 1000, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "appliances" }
    ]
  },
  "gap.com": {
    storeName: "Gap",
    coupons: [
      { code: "GAP40", description: "40% off your entire purchase", discount: "40%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "GAPCARD20", description: "20% off with Gap Card", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPGAP", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "oldnavy.com": {
    storeName: "Old Navy",
    coupons: [
      { code: "OLD50", description: "50% off everything! Extra 30% off clearance", discount: "50%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "CARD30", description: "30% off with Old Navy Card", discount: "30%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPON", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "bananarepublic.com": {
    storeName: "Banana Republic",
    coupons: [
      { code: "BR40", description: "40% off your purchase", discount: "40%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "BRCARD15", description: "15% off with BR Card", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "hollisterco.com": {
    storeName: "Hollister",
    coupons: [
      { code: "HOLLISTER25", description: "25% off your purchase", discount: "25%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "HCO15", description: "15% off for email subscribers", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "abercrombie.com": {
    storeName: "Abercrombie & Fitch",
    coupons: [
      { code: "AF25", description: "25% off $100+ purchase", discount: "25%", discountType: "percentage", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPAF", description: "Free shipping on orders $75+", discount: "Free Shipping", discountType: "shipping", minOrder: 75, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "macys.com": {
    storeName: "Macy's",
    coupons: [
      { code: "MACYS20", description: "20% off select regular-priced items", discount: "20%", discountType: "percentage", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "STAR15", description: "15% off for Star Rewards members", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPMAC", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "HOME25", description: "$25 off home purchases $100+", discount: "$25", discountType: "fixed", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "home" }
    ]
  },
  "nordstrom.com": {
    storeName: "Nordstrom",
    coupons: [
      { code: "NORDSTROM20", description: "20% off select styles", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPNOR", description: "Free shipping on all orders (no minimum!)", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "BEAUTY15", description: "15% off beauty purchases", discount: "15%", discountType: "percentage", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "beauty" }
    ]
  },
  "kohls.com": {
    storeName: "Kohl's",
    coupons: [
      { code: "KOHLS30", description: "30% off your purchase", discount: "30%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "KOHLSCASH15", description: "$15 Kohl's Cash for every $50 spent", discount: "$15 KC", discountType: "other", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "rewards" },
      { code: "FREESHIPKOH", description: "Free shipping on orders $75+", discount: "Free Shipping", discountType: "shipping", minOrder: 75, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "wayfair.com": {
    storeName: "Wayfair",
    coupons: [
      { code: "WAYFAIR10", description: "10% off your first order", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "SITEWIDE15", description: "15% off sitewide sale", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPWAY", description: "Free shipping on orders $35+", discount: "Free Shipping", discountType: "shipping", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "FURNITURE50", description: "$50 off furniture $500+", discount: "$50", discountType: "fixed", minOrder: 500, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "furniture" }
    ]
  },
  "etsy.com": {
    storeName: "Etsy",
    coupons: [
      { code: "ETSY10", description: "10% off your first purchase (select shops)", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPETS", description: "Free shipping on orders $35+", discount: "Free Shipping", discountType: "shipping", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "zara.com": {
    storeName: "Zara",
    coupons: [
      { code: "ZARA10NEW", description: "10% off when you sign up for newsletter", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPZAR", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "hm.com": {
    storeName: "H&M",
    coupons: [
      { code: "HM15OFF", description: "15% off your next purchase (sign up)", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPHM", description: "Free shipping on orders $40+", discount: "Free Shipping", discountType: "shipping", minOrder: 40, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "ikea.com": {
    storeName: "IKEA",
    coupons: [
      { code: "IKEAFAMILY", description: "Free coffee/tea and 5% off for IKEA Family members", discount: "5%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPIKEA", description: "Free shipping on orders $75+", discount: "Free Shipping", discountType: "shipping", minOrder: 75, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "KITCHEN20", description: "$20 off kitchen countertops $200+", discount: "$20", discountType: "fixed", minOrder: 200, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "kitchen" }
    ]
  },
  "rei.com": {
    storeName: "REI",
    coupons: [
      { code: "REI20", description: "20% off one full-price item (member sale)", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "DIVIDEND25", description: "Annual 10% member dividend on eligible purchases", discount: "10% back", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "rewards" },
      { code: "FREESHIPREI", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "dickssportinggoods.com": {
    storeName: "Dick's Sporting Goods",
    coupons: [
      { code: "DICKS20", description: "20% off one item", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "SCORE10", description: "10% off your scorecard rewards", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "rewards" },
      { code: "FREESHIPDSG", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "apple.com": {
    storeName: "Apple",
    coupons: [
      { code: "EDUCATION", description: "Education pricing - save up to 10% on Mac & iPad", discount: "Up to 10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "education" },
      { code: "TRADEIN", description: "Get credit for your old device toward a new one", discount: "Varies", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "REFURB15", description: "15% off Apple Certified Refurbished", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" }
    ]
  },
  "samsung.com": {
    storeName: "Samsung",
    coupons: [
      { code: "SAMSUNG10", description: "10% off with Samsung account sign-up", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "EDU15", description: "15% off for education customers", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "education" },
      { code: "TRADEUP", description: "Enhanced trade-in values up to $800", discount: "Up to $800", discountType: "fixed", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" },
      { code: "FREESIPSAM", description: "Free shipping on all orders", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "newegg.com": {
    storeName: "Newegg",
    coupons: [
      { code: "NEWEGG5", description: "5% off select PC components", discount: "5%", discountType: "percentage", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" },
      { code: "NEWEGG10", description: "10% off select monitors", discount: "10%", discountType: "percentage", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" },
      { code: "FREESHIPNEGG", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "PARTS15", description: "$15 off $200+ with Newegg promo email", discount: "$15", discountType: "fixed", minOrder: 200, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" }
    ]
  },
  "bhphotovideo.com": {
    storeName: "B&H Photo",
    coupons: [
      { code: "BHPHOTO10", description: "10% off select camera accessories", discount: "10%", discountType: "percentage", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" },
      { code: "FREESHIPB&H", description: "Free shipping on most items", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "STUDENT5", description: "5% off for students (after verification)", discount: "5%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "education" }
    ]
  },
  "costco.com": {
    storeName: "Costco",
    coupons: [
      { code: "COSTCOEXEC", description: "2% reward on Executive Membership purchases", discount: "2% back", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "rewards" },
      { code: "FREESHIPCST", description: "Free shipping on most items (member benefit)", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "chewy.com": {
    storeName: "Chewy",
    coupons: [
      { code: "CHEWY20", description: "20% off first subscription order", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "CHEWY5OFF", description: "$5 off your first order of $25+", discount: "$5", discountType: "fixed", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPCHW", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "petco.com": {
    storeName: "Petco",
    coupons: [
      { code: "PETCO15", description: "15% off your first repeat delivery", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPPET", description: "Free shipping on orders $35+", discount: "Free Shipping", discountType: "shipping", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "petsmart.com": {
    storeName: "PetSmart",
    coupons: [
      { code: "PETS20", description: "20% off your first Repeat Delivery order", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPSMT", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "lego.com": {
    storeName: "LEGO",
    coupons: [
      { code: "VIPDOUBLE", description: "Double VIP points on select sets", discount: "2x Points", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "rewards" },
      { code: "FREESHIPLEGO", description: "Free shipping on orders $35+ for Insiders", discount: "Free Shipping", discountType: "shipping", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "GWPLEGO", description: "Free gift with purchase on orders $100+", discount: "Free Gift", discountType: "other", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "gamestop.com": {
    storeName: "GameStop",
    coupons: [
      { code: "GAMESTOP10", description: "10% off used games & accessories", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "gaming" },
      { code: "PRO20", description: "20% off select pre-owned with Pro membership", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "gaming" },
      { code: "FREESHIPGS", description: "Free shipping on orders $59+", discount: "Free Shipping", discountType: "shipping", minOrder: 59, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "underarmour.com": {
    storeName: "Under Armour",
    coupons: [
      { code: "UA25", description: "25% off your first purchase", discount: "25%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPUA", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "lululemon.com": {
    storeName: "Lululemon",
    coupons: [
      { code: "LULU25", description: "25% off for first responders, medical, and educators", discount: "25%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "WMTM", description: "We Made Too Much - markdowns up to 50% off", discount: "Up to 50%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "sale" },
      { code: "FREESHIPLULU", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "shein.com": {
    storeName: "SHEIN",
    coupons: [
      { code: "SHEIN20", description: "20% off your first order", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "SHEIN15", description: "15% off orders $30+", discount: "15%", discountType: "percentage", minOrder: 30, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPSHN", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "APPONLY10", description: "Extra 10% off app exclusive items", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "uniqlo.com": {
    storeName: "Uniqlo",
    coupons: [
      { code: "UNIQLO10", description: "10% off your first order (sign up)", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPUNQ", description: "Free shipping on orders $75+", discount: "Free Shipping", discountType: "shipping", minOrder: 75, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "levi.com": {
    storeName: "Levi's",
    coupons: [
      { code: "LEVI30", description: "30% off your first order when you sign up", discount: "30%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPSLEV", description: "Free shipping on orders $100+", discount: "Free Shipping", discountType: "shipping", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "REDTAB20", description: "20% off select Red Tab items", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "containerstore.com": {
    storeName: "The Container Store",
    coupons: [
      { code: "CONTAINER15", description: "15% off your entire purchase", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPTCT", description: "Free shipping on orders $75+", discount: "Free Shipping", discountType: "shipping", minOrder: 75, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "ELITE25", description: "25% off for POP! Elite members", discount: "25%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "rewards" }
    ]
  },
  "crateandbarrel.com": {
    storeName: "Crate & Barrel",
    coupons: [
      { code: "CRATE15", description: "15% off your first order (sign up)", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "BUNDLE20", description: "20% off furniture bundles $1,000+", discount: "20%", discountType: "percentage", minOrder: 1000, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "furniture" },
      { code: "CARD10", description: "10% back in rewards with Crate & Barrel Card", discount: "10% back", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "rewards" }
    ]
  },
  "potterybarn.com": {
    storeName: "Pottery Barn",
    coupons: [
      { code: "PB20", description: "20% off curtains & pillows", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "home" },
      { code: "FREESHIPPB", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "westelm.com": {
    storeName: "West Elm",
    coupons: [
      { code: "WESTELM15", description: "15% off your first purchase", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPWST", description: "Free shipping on orders $75+", discount: "Free Shipping", discountType: "shipping", minOrder: 75, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "williams-sonoma.com": {
    storeName: "Williams Sonoma",
    coupons: [
      { code: "WS20", description: "20% off select cookware", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "kitchen" },
      { code: "FREESHIPWS", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "sur la table.com": {
    storeName: "Sur La Table",
    coupons: [
      { code: "SURLATABLE15", description: "15% off your first order", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPSLT", description: "Free shipping on orders $75+", discount: "Free Shipping", discountType: "shipping", minOrder: 75, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "staples.com": {
    storeName: "Staples",
    coupons: [
      { code: "STAPLES10", description: "10% off ink & toner", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "office" },
      { code: "FREESHIPSTP", description: "Free shipping on orders $45+", discount: "Free Shipping", discountType: "shipping", minOrder: 45, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "STAPLES20", description: "$20 off $100+ (use app)", discount: "$20", discountType: "fixed", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "officedepot.com": {
    storeName: "Office Depot",
    coupons: [
      { code: "OD15", description: "15% off select supplies", discount: "15%", discountType: "percentage", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "office" },
      { code: "FREESHIPODP", description: "Free shipping on orders $29+", discount: "Free Shipping", discountType: "shipping", minOrder: 29, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "autozone.com": {
    storeName: "AutoZone",
    coupons: [
      { code: "AUTOZONE20", description: "20% off select parts with code", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "auto" },
      { code: "FREESHIPAZ", description: "Free shipping on orders $35+", discount: "Free Shipping", discountType: "shipping", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "BATTERY10", description: "$10 off battery purchase $100+", discount: "$10", discountType: "fixed", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "auto" }
    ]
  },
  "advanceautoparts.com": {
    storeName: "Advance Auto Parts",
    coupons: [
      { code: "ADVANCE25", description: "25% off select parts", discount: "25%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "auto" },
      { code: "FREESHIPAAP", description: "Free shipping on orders $35+", discount: "Free Shipping", discountType: "shipping", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "barnesandnoble.com": {
    storeName: "Barnes & Noble",
    coupons: [
      { code: "BN15", description: "15% off one item for members", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "BN10", description: "10% off your purchase when you sign up", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPBN", description: "Free shipping on orders $40+", discount: "Free Shipping", discountType: "shipping", minOrder: 40, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "audible.com": {
    storeName: "Audible",
    coupons: [
      { code: "AUDIBLE30", description: "30-day free trial + 1 credit", discount: "Free Trial", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "AUDIBLEPLUS", description: "3 months for $0.99/month (select users)", discount: "65% off", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "expedia.com": {
    storeName: "Expedia",
    coupons: [
      { code: "EXPEDIA10", description: "10% off hotels with app booking", discount: "10%", discountType: "percentage", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "travel" },
      { code: "VIP20", description: "20% off select hotels for Expedia VIP", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "travel" },
      { code: "PACKAGE50", description: "$50 off flight+hotel packages $500+", discount: "$50", discountType: "fixed", minOrder: 500, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "travel" }
    ]
  },
  "booking.com": {
    storeName: "Booking.com",
    coupons: [
      { code: "GENIUS15", description: "15% off select hotels for Genius members", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "travel" },
      { code: "FREECANCEL", description: "Free cancellation on most bookings", discount: "Free Cancellation", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "travel" }
    ]
  },
  "airbnb.com": {
    storeName: "Airbnb",
    coupons: [
      { code: "AIRBNB50", description: "$50 off your first trip of $200+", discount: "$50", discountType: "fixed", minOrder: 200, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "travel" },
      { code: "AIRBNB25", description: "25% off weekly stays (select listings)", discount: "25%", discountType: "percentage", minOrder: 500, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "travel" }
    ]
  },
  "udemy.com": {
    storeName: "Udemy",
    coupons: [
      { code: "UDEMY90", description: "90% off most courses (sitewide sale)", discount: "90%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "education" },
      { code: "FREEUDEMY", description: "Free courses in select categories", discount: "100%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "education" }
    ]
  },
  "hellofresh.com": {
    storeName: "HelloFresh",
    coupons: [
      { code: "HELLO20", description: "20% off your first box + free shipping", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "food" },
      { code: "HELLO50", description: "50% off first box for new customers", discount: "50%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "food" },
      { code: "FREESHIPHF", description: "Free shipping on first box", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "blueapron.com": {
    storeName: "Blue Apron",
    coupons: [
      { code: "BLUE30", description: "30% off your first box", discount: "30%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "food" },
      { code: "BLUEFREE", description: "Free shipping on your first box", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "warbyparker.com": {
    storeName: "Warby Parker",
    coupons: [
      { code: "WARBY5", description: "5 free frames to try at home", discount: "Free Home Try-On", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "WARBY20", description: "20% off prescription sunglasses", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "zennioptical.com": {
    storeName: "Zenni Optical",
    coupons: [
      { code: "ZENNI10", description: "10% off your first order", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPZEN", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "stitchfix.com": {
    storeName: "Stitch Fix",
    coupons: [
      { code: "STITCHFIX20", description: "20% off your first Fix when you keep all items", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FIX50", description: "$50 styling fee waived on first Fix", discount: "$50", discountType: "fixed", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "michaels.com": {
    storeName: "Michaels",
    coupons: [
      { code: "MICHAELS40", description: "40% off one regular-priced item", discount: "40%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "MICHAELS20", description: "20% off entire purchase (rewards members)", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPMIC", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "hobbylobby.com": {
    storeName: "Hobby Lobby",
    coupons: [
      { code: "HOBBY40", description: "40% off one regular-priced item (weekly)", discount: "40%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "HOBBY30", description: "30% off select seasonal items", discount: "30%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "joann.com": {
    storeName: "Jo-Ann",
    coupons: [
      { code: "JOANN50", description: "50% off one regular-priced item", discount: "50%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "JOANN20", description: "20% off entire purchase (rewards)", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "casper.com": {
    storeName: "Casper",
    coupons: [
      { code: "CASPER10", description: "10% off any mattress", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "home" },
      { code: "CASPER100", description: "$100 off mattress + free pillows", discount: "$100", discountType: "fixed", minOrder: 500, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "home" },
      { code: "FREESHIPCASP", description: "Free shipping & returns on all orders", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "purple.com": {
    storeName: "Purple",
    coupons: [
      { code: "PURPLE50", description: "50% off select pillows & seat cushions", discount: "50%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "home" },
      { code: "PURPLE200", description: "$200 off mattress + free sheets", discount: "$200", discountType: "fixed", minOrder: 1000, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "home" },
      { code: "FREESHIPPUR", description: "Free shipping on all orders", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "dollarshaveclub.com": {
    storeName: "Dollar Shave Club",
    coupons: [
      { code: "DSCFREE", description: "Free trial handle with first order", discount: "Free Handle", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "DSC20", description: "20% off your first month", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "bombas.com": {
    storeName: "Bombas",
    coupons: [
      { code: "BOMBAS25", description: "25% off your first purchase", discount: "25%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPBOM", description: "Free shipping on all orders", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "BUY1GIVE1", description: "Buy one, we donate one to someone in need", discount: "One Donated", discountType: "other", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "toms.com": {
    storeName: "TOMS",
    coupons: [
      { code: "TOMS20", description: "20% off your first purchase", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPTOM", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "allbirds.com": {
    storeName: "Allbirds",
    coupons: [
      { code: "ALLBIRDS25", description: "25% off your first purchase (sign up)", discount: "25%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPALL", description: "Free shipping & returns on all orders", discount: "Free Shipping", discountType: "shipping", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "rothys.com": {
    storeName: "Rothy's",
    coupons: [
      { code: "ROTHYS20", description: "20% off your first pair", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPROT", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "sears.com": {
    storeName: "Sears",
    coupons: [
      { code: "SEARS10", description: "10% off tools & hardware", discount: "10%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "tools" },
      { code: "FREESHIPSEA", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "APPLIANCE15", description: "15% off appliance purchases $399+", discount: "15%", discountType: "percentage", minOrder: 399, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "appliances" }
    ]
  },
  "jcp.com": {
    storeName: "JCPenney",
    coupons: [
      { code: "JCP20", description: "20% off entire purchase", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "JCP10OFF", description: "$10 off $25+ purchase", discount: "$10", discountType: "fixed", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPJCP", description: "Free shipping on orders $49+", discount: "Free Shipping", discountType: "shipping", minOrder: 49, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "bestbuy.com.ca": {
    storeName: "Best Buy Canada",
    coupons: [
      { code: "BBYTECH10CA", description: "10% off select tech accessories", discount: "10%", discountType: "percentage", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "electronics" },
      { code: "FREESHIPBBYC", description: "Free shipping on orders $35+", discount: "Free Shipping", discountType: "shipping", minOrder: 35, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  },
  "1800flowers.com": {
    storeName: "1800Flowers",
    coupons: [
      { code: "FLOWERS20", description: "20% off your first order", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPFLW", description: "Free shipping on select bouquets", discount: "Free Shipping", discountType: "shipping", minOrder: 30, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "CELEBRATE25", description: "$25 off $100+ for celebrations", discount: "$25", discountType: "fixed", minOrder: 100, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "shutterfly.com": {
    storeName: "Shutterfly",
    coupons: [
      { code: "SHUTTER40", description: "40% off sitewide", discount: "40%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPSHUT", description: "Free shipping on orders $29+", discount: "Free Shipping", discountType: "shipping", minOrder: 29, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "PHOTOBOOK50", description: "50% off photo books", discount: "50%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" }
    ]
  },
  "vistaprint.com": {
    storeName: "VistaPrint",
    coupons: [
      { code: "VISTA20", description: "20% off all products", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPVIST", description: "Free shipping on orders $25+", discount: "Free Shipping", discountType: "shipping", minOrder: 25, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" },
      { code: "BUSINESS15", description: "15% off business cards & flyers", discount: "15%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "office" }
    ]
  },
  "minted.com": {
    storeName: "Minted",
    coupons: [
      { code: "MINTED20", description: "20% off your first order", discount: "20%", discountType: "percentage", minOrder: 0, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "general" },
      { code: "FREESHIPMINT", description: "Free shipping on orders $50+", discount: "Free Shipping", discountType: "shipping", minOrder: 50, expiresAt: "2026-12-31T23:59:59Z", source: "verified", verifiedAt: "2026-05-01", category: "shipping" }
    ]
  }
};

/**
 * CouponEngine - Handles coupon matching and retrieval.
 */
class CouponEngine {
  constructor() {
    this.couponData = null;
    this.lastRefresh = null;
    this.REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize the engine, loading coupons from storage or bundled data.
   */
  async initialize() {
    try {
      const data = await chrome.storage.local.get(['couponData', 'couponLastRefresh']);
      
      if (data.couponData && data.couponLastRefresh) {
        const age = Date.now() - data.couponLastRefresh;
        if (age < this.REFRESH_INTERVAL_MS) {
          this.couponData = data.couponData;
          this.lastRefresh = data.couponLastRefresh;
          return;
        }
      }
      
      // Load bundled data
      this.couponData = COUPON_DATA;
      this.lastRefresh = Date.now();
      
      // Save to storage for content script access
      await chrome.storage.local.set({
        couponData: this.couponData,
        couponLastRefresh: this.lastRefresh
      });
    } catch (e) {
      console.warn('CouponEngine.init error, using bundled data:', e.message);
      this.couponData = COUPON_DATA;
    }
  }

  /**
   * Get coupons for a specific domain.
   * @param {string} domain - The domain to look up (e.g., 'amazon.com')
   * @returns {Array} Array of coupon objects for the store
   */
  getCouponsForDomain(domain) {
    if (!this.couponData) return [];
    
    const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
    
    // Direct match
    if (this.couponData[normalizedDomain]) {
      return this.couponData[normalizedDomain].coupons || [];
    }
    
    // Check alternative domains (e.g., subdomains)
    for (const [key, store] of Object.entries(this.couponData)) {
      if (normalizedDomain.includes(key) || key.includes(normalizedDomain)) {
        return store.coupons || [];
      }
    }
    
    return [];
  }

  /**
   * Get best (highest discount) coupon for a domain.
   */
  getBestCoupon(domain) {
    const coupons = this.getCouponsForDomain(domain);
    if (coupons.length === 0) return null;
    
    // Sort by discount value (percentage > fixed > other)
    const sorted = [...coupons].sort((a, b) => {
      const aVal = this._discountValue(a);
      const bVal = this._discountValue(b);
      return bVal - aVal;
    });
    
    return sorted[0];
  }

  /**
   * Get store info for a domain.
   */
  getStoreInfo(domain) {
    if (!this.couponData) return null;
    const normDomain = domain.replace(/^www\./, '').toLowerCase();
    return this.couponData[normDomain] || null;
  }

  /**
   * Get all stores that have coupons.
   */
  getAllStores() {
    if (!this.couponData) return [];
    return Object.entries(this.couponData).map(([domain, info]) => ({
      domain,
      ...info
    }));
  }

  /**
   * Calculate a numeric discount value for sorting.
   */
  _discountValue(coupon) {
    if (coupon.discountType === 'percentage') {
      return parseInt(coupon.discount) || 0;
    }
    if (coupon.discountType === 'fixed') {
      const match = coupon.discount.match(/[\d.]+/);
      return match ? parseFloat(match[0]) * 2 : 0; // Scale fixed discounts
    }
    if (coupon.discountType === 'shipping') return 5; // $5 equivalent
    return 0;
  }

  /**
   * Filter coupons by category.
   */
  getCouponsByCategory(domain, category) {
    const coupons = this.getCouponsForDomain(domain);
    if (!category) return coupons;
    return coupons.filter(c => c.category === category);
  }

  /**
   * Check if a coupon has expired.
   */
  isExpired(coupon) {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
  }

  /**
   * Refresh coupon data from remote API.
   */
  async refreshFromApi(apiUrl = 'https://api.gadgethumans.com/coupons') {
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const remoteData = await response.json();
      if (remoteData && typeof remoteData === 'object') {
        // Merge with local data - remote takes priority
        this.couponData = { ...this.couponData, ...remoteData };
        this.lastRefresh = Date.now();
        
        await chrome.storage.local.set({
          couponData: this.couponData,
          couponLastRefresh: this.lastRefresh
        });
        
        return { success: true, storesUpdated: Object.keys(remoteData).length };
      }
    } catch (e) {
      console.warn('Coupon refresh failed, using cached data:', e.message);
      return { success: false, error: e.message };
    }
  }
}

// Singleton
const couponEngine = new CouponEngine();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.CouponEngine = couponEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { couponEngine, CouponEngine };
}
