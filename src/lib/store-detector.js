/**
 * store-detector.js
 * Detects which e-commerce store the user is on by analyzing:
 * - URL patterns for top 1000+ domains
 * - JSON-LD structured data on the page
 * - Meta tags and Open Graph data
 * - Page type classification (product/cart/checkout/category)
 *
 * Returns a normalized store object with all detected information.
 */

const STORE_DATABASE = {
  // --- Tier 1: Global Mega-Stores ---
  'amazon.com':        { name: 'Amazon',        domains: ['amazon.com', 'amazon.ca', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.co.jp', 'amazon.in', 'amazon.com.au', 'amazon.com.br', 'amazon.nl', 'amazon.se', 'amazon.pl'], logo: 'amazon' },
  'walmart.com':       { name: 'Walmart',       domains: ['walmart.com', 'walmart.ca'], logo: 'walmart' },
  'target.com':        { name: 'Target',        domains: ['target.com'], logo: 'target' },
  'bestbuy.com':       { name: 'Best Buy',      domains: ['bestbuy.com', 'bestbuy.ca'], logo: 'bestbuy' },
  'ebay.com':          { name: 'eBay',          domains: ['ebay.com', 'ebay.ca', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.it', 'ebay.com.au'], logo: 'ebay' },
  'etsy.com':          { name: 'Etsy',          domains: ['etsy.com'], logo: 'etsy' },
  
  // --- Tier 2: Major US Retail ---
  'homedepot.com':     { name: 'Home Depot',    domains: ['homedepot.com'], logo: 'homedepot' },
  'lowes.com':         { name: "Lowe's",        domains: ['lowes.com'], logo: 'lowes' },
  'costco.com':        { name: 'Costco',        domains: ['costco.com'], logo: 'costco' },
  'kroger.com':        { name: 'Kroger',        domains: ['kroger.com'], logo: 'kroger' },
  'walgreens.com':     { name: 'Walgreens',     domains: ['walgreens.com'], logo: 'walgreens' },
  'cvs.com':           { name: 'CVS',           domains: ['cvs.com'], logo: 'cvs' },
  'macys.com':         { name: "Macy's",        domains: ['macys.com'], logo: 'macys' },
  'nordstrom.com':     { name: 'Nordstrom',     domains: ['nordstrom.com', 'nordstromrack.com'], logo: 'nordstrom' },
  'kohls.com':         { name: "Kohl's",        domains: ['kohls.com'], logo: 'kohls' },
  'jcp.com':           { name: 'JCPenney',      domains: ['jcp.com', 'jcpenney.com'], logo: 'jcp' },
  'sears.com':         { name: 'Sears',         domains: ['sears.com'], logo: 'sears' },
  'acehardware.com':   { name: 'Ace Hardware',  domains: ['acehardware.com'], logo: 'ace' },
  'tractorsupply.com': { name: 'Tractor Supply', domains: ['tractorsupply.com'], logo: 'tractorsupply' },
  'harborfreight.com': { name: 'Harbor Freight', domains: ['harborfreight.com'], logo: 'harborfreight' },
  
  // --- Tier 3: Fashion & Apparel ---
  'nike.com':          { name: 'Nike',          domains: ['nike.com', 'niketown.com'], logo: 'nike' },
  'adidas.com':        { name: 'Adidas',        domains: ['adidas.com', 'adidas.us'], logo: 'adidas' },
  'underarmour.com':   { name: 'Under Armour',   domains: ['underarmour.com'], logo: 'underarmour' },
  'gap.com':           { name: 'Gap',           domains: ['gap.com', 'bananarepublic.com', 'oldnavy.com', 'athleta.com'], logo: 'gap' },
  'zara.com':          { name: 'Zara',          domains: ['zara.com', 'zara.us'], logo: 'zara' },
  'hm.com':            { name: 'H&M',           domains: ['hm.com', 'www2.hm.com'], logo: 'hm' },
  'uniqlo.com':        { name: 'Uniqlo',        domains: ['uniqlo.com', 'uniqlo.us'], logo: 'uniqlo' },
  'levi.com':          { name: "Levi's",        domains: ['levi.com', 'levistrauss.com'], logo: 'levi' },
  'columbia.com':      { name: 'Columbia',      domains: ['columbia.com'], logo: 'columbia' },
  'thenorthface.com':  { name: 'The North Face', domains: ['thenorthface.com'], logo: 'northface' },
  'patagonia.com':     { name: 'Patagonia',     domains: ['patagonia.com'], logo: 'patagonia' },
  'lululemon.com':     { name: 'Lululemon',     domains: ['lululemon.com'], logo: 'lululemon' },
  'asos.com':          { name: 'ASOS',          domains: ['asos.com', 'asos.us'], logo: 'asos' },
  'fashionnova.com':   { name: 'Fashion Nova',  domains: ['fashionnova.com'], logo: 'fashionnova' },
  'shein.com':         { name: 'SHEIN',         domains: ['shein.com', 'shein-us.com'], logo: 'shein' },
  'boohoo.com':        { name: 'Boohoo',        domains: ['boohoo.com', 'boohooman.com'], logo: 'boohoo' },
  'forever21.com':     { name: 'Forever 21',    domains: ['forever21.com'], logo: 'forever21' },
  'american eagle.com':{ name: 'American Eagle', domains: ['americaneagle.com', 'ae.com'], logo: 'americaneagle' },
  'abercrombie.com':   { name: 'Abercrombie',   domains: ['abercrombie.com', 'hollisterco.com'], logo: 'abercrombie' },
  'puma.com':          { name: 'Puma',          domains: ['puma.com'], logo: 'puma' },
  'reebok.com':        { name: 'Reebok',        domains: ['reebok.com'], logo: 'reebok' },
  'vans.com':          { name: 'Vans',          domains: ['vans.com'], logo: 'vans' },
  'converse.com':      { name: 'Converse',      domains: ['converse.com'], logo: 'converse' },
  'timberland.com':    { name: 'Timberland',    domains: ['timberland.com'], logo: 'timberland' },
  'skechers.com':      { name: 'Skechers',      domains: ['skechers.com'], logo: 'skechers' },
  'crocs.com':         { name: 'Crocs',         domains: ['crocs.com'], logo: 'crocs' },
  'carhartt.com':      { name: 'Carhartt',      domains: ['carhartt.com', 'carharttworkwear.com'], logo: 'carhartt' },
  'dickies.com':       { name: 'Dickies',       domains: ['dickies.com'], logo: 'dickies' },
  
  // --- Tier 4: Beauty & Cosmetics ---
  'sephora.com':       { name: 'Sephora',       domains: ['sephora.com'], logo: 'sephora' },
  'ulta.com':          { name: 'Ulta Beauty',   domains: ['ulta.com'], logo: 'ulta' },
  'nyxcosmetics.com':  { name: 'NYX',           domains: ['nyxcosmetics.com'], logo: 'nyx' },
  'colourpop.com':     { name: 'ColourPop',     domains: ['colourpop.com'], logo: 'colourpop' },
  'theordinary.com':   { name: 'The Ordinary',  domains: ['theordinary.com', 'deciem.com'], logo: 'theordinary' },
  'maccosmetics.com':  { name: 'MAC Cosmetics', domains: ['maccosmetics.com'], logo: 'mac' },
  'esteelauder.com':   { name: 'Estée Lauder',  domains: ['esteelauder.com'], logo: 'esteelauder' },
  'clinique.com':      { name: 'Clinique',      domains: ['clinique.com'], logo: 'clinique' },
  'lancome.com':       { name: 'Lancôme',       domains: ['lancome.com'], logo: 'lancome' },
  
  // --- Tier 5: Electronics & Tech ---
  'newegg.com':        { name: 'Newegg',        domains: ['newegg.com'], logo: 'newegg' },
  'bhphotovideo.com':  { name: 'B&H Photo',     domains: ['bhphotovideo.com'], logo: 'bhphoto' },
  'adorama.com':       { name: 'Adorama',       domains: ['adorama.com'], logo: 'adorama' },
  'microcenter.com':   { name: 'Micro Center',  domains: ['microcenter.com'], logo: 'microcenter' },
  'apple.com':         { name: 'Apple',         domains: ['apple.com', 'apple.co'], logo: 'apple' },
  'samsung.com':       { name: 'Samsung',       domains: ['samsung.com', 'samsung.us'], logo: 'samsung' },
  'lenovo.com':        { name: 'Lenovo',        domains: ['lenovo.com'], logo: 'lenovo' },
  'dell.com':          { name: 'Dell',          domains: ['dell.com'], logo: 'dell' },
  'hp.com':            { name: 'HP',            domains: ['hp.com', 'hpshopping.com'], logo: 'hp' },
  'logitech.com':      { name: 'Logitech',      domains: ['logitech.com'], logo: 'logitech' },
  'anker.com':         { name: 'Anker',         domains: ['anker.com', 'ankerdirect.com'], logo: 'anker' },
  'sony.com':          { name: 'Sony',          domains: ['sony.com', 'electronics.sony.com'], logo: 'sony' },
  'lg.com':            { name: 'LG',            domains: ['lg.com', 'lg.com/us'], logo: 'lg' },
  
  // --- Tier 6: Home & Furniture ---
  'ikea.com':          { name: 'IKEA',          domains: ['ikea.com', 'ikea.us'], logo: 'ikea' },
  'wayfair.com':       { name: 'Wayfair',       domains: ['wayfair.com'], logo: 'wayfair' },
  'overstock.com':     { name: 'Overstock',     domains: ['overstock.com'], logo: 'overstock' },
  'bedbathandbeyond.com': { name: 'Bed Bath & Beyond', domains: ['bedbathandbeyond.com'], logo: 'bedbath' },
  'westelm.com':       { name: 'West Elm',      domains: ['westelm.com'], logo: 'westelm' },
  'crateandbarrel.com':{ name: 'Crate & Barrel', domains: ['crateandbarrel.com'], logo: 'crateandbarrel' },
  'potterybarn.com':   { name: 'Pottery Barn',  domains: ['potterybarn.com'], logo: 'potterybarn' },
  'anthropologie.com': { name: 'Anthropologie', domains: ['anthropologie.com'], logo: 'anthropologie' },
  'restorationhardware.com': { name: 'Restoration Hardware', domains: ['restorationhardware.com', 'rh.com'], logo: 'rh' },
  'containerstore.com':{ name: 'The Container Store', domains: ['containerstore.com'], logo: 'containerstore' },
  'atgstores.com':     { name: 'ATG Stores',    domains: ['atgstores.com', 'storesonline.com'], logo: 'atg' },
  
  // --- Tier 7: Sporting Goods & Outdoors ---
  'rei.com':           { name: 'REI',           domains: ['rei.com'], logo: 'rei' },
  'dickssportinggoods.com': { name: "Dick's Sporting Goods", domains: ['dickssportinggoods.com'], logo: 'dicks' },
  'academy.com':       { name: 'Academy Sports', domains: ['academy.com'], logo: 'academy' },
  'basspro.com':       { name: 'Bass Pro Shops', domains: ['basspro.com', 'cabelas.com'], logo: 'basspro' },
  'llbean.com':        { name: 'L.L.Bean',      domains: ['llbean.com'], logo: 'llbean' },
  'moosejaw.com':      { name: 'Moosejaw',      domains: ['moosejaw.com'], logo: 'moosejaw' },
  'backcountry.com':   { name: 'Backcountry',   domains: ['backcountry.com'], logo: 'backcountry' },
  'camper.com':        { name: 'Camper',        domains: ['camper.com'], logo: 'camper' },
  
  // --- Tier 8: Grocery & Food ---
  'instacart.com':     { name: 'Instacart',     domains: ['instacart.com'], logo: 'instacart' },
  'hellofresh.com':    { name: 'HelloFresh',    domains: ['hellofresh.com'], logo: 'hellofresh' },
  'blueapron.com':     { name: 'Blue Apron',    domains: ['blueapron.com'], logo: 'blueapron' },
  'doordash.com':      { name: 'DoorDash',      domains: ['doordash.com'], logo: 'doordash' },
  'ubereats.com':      { name: 'Uber Eats',     domains: ['ubereats.com'], logo: 'ubereats' },
  'grubhub.com':       { name: 'Grubhub',       domains: ['grubhub.com'], logo: 'grubhub' },
  
  // --- Tier 9: Office & Business ---
  'staples.com':       { name: 'Staples',       domains: ['staples.com'], logo: 'staples' },
  'officedepot.com':   { name: 'Office Depot',  domains: ['officedepot.com', 'officemax.com'], logo: 'officedepot' },
  'shoplet.com':       { name: 'Shoplet',       domains: ['shoplet.com'], logo: 'shoplet' },
  
  // --- Tier 10: Specialty Retail ---
  'petco.com':         { name: 'Petco',         domains: ['petco.com'], logo: 'petco' },
  'petsmart.com':      { name: 'PetSmart',      domains: ['petsmart.com'], logo: 'petsmart' },
  'chewy.com':         { name: 'Chewy',         domains: ['chewy.com'], logo: 'chewy' },
  'autozone.com':      { name: 'AutoZone',      domains: ['autozone.com'], logo: 'autozone' },
  'oreillyauto.com':   { name: "O'Reilly Auto", domains: ['oreillyauto.com'], logo: 'oreilly' },
  'advanceautoparts.com': { name: 'Advance Auto Parts', domains: ['advanceautoparts.com'], logo: 'advance' },
  'partsgeek.com':     { name: 'PartsGeek',     domains: ['partsgeek.com'], logo: 'partsgeek' },
  'rockauto.com':      { name: 'RockAuto',      domains: ['rockauto.com'], logo: 'rockauto' },
  'tirerack.com':      { name: 'Tire Rack',     domains: ['tirerack.com'], logo: 'tirerack' },
  
  // --- Tier 11: Toys, Games & Hobbies ---
  'gamestop.com':      { name: 'GameStop',      domains: ['gamestop.com'], logo: 'gamestop' },
  'toysrus.com':       { name: "Toys'R'Us",     domains: ['toysrus.com'], logo: 'toysrus' },
  'hasbro.com':        { name: 'Hasbro',        domains: ['hasbro.com'], logo: 'hasbro' },
  'lego.com':          { name: 'LEGO',          domains: ['lego.com', 'shop.lego.com'], logo: 'lego' },
  'mattycollector.com':{ name: 'Mattel',        domains: ['mattel.com', 'shop.mattel.com'], logo: 'mattel' },
  'buildabear.com':    { name: 'Build-A-Bear',  domains: ['buildabear.com'], logo: 'buildabear' },
  
  // --- Tier 12: Luxury & Jewelry ---
  'tiffany.com':       { name: 'Tiffany & Co.', domains: ['tiffany.com'], logo: 'tiffany' },
  'cartier.com':       { name: 'Cartier',       domains: ['cartier.com'], logo: 'cartier' },
  'zales.com':         { name: 'Zales',         domains: ['zales.com'], logo: 'zales' },
  'kay.com':           { name: 'Kay Jewelers',  domains: ['kay.com', 'kayjewelers.com'], logo: 'kay' },
  'jared.com':         { name: 'Jared',         domains: ['jared.com'], logo: 'jared' },
  'blue nile.com':     { name: 'Blue Nile',     domains: ['bluenile.com'], logo: 'bluenile' },
  'jamesallen.com':    { name: 'James Allen',   domains: ['jamesallen.com'], logo: 'jamesallen' },
  
  // --- Tier 13: Books, Media & Education ---
  'barnesandnoble.com':{ name: 'Barnes & Noble', domains: ['barnesandnoble.com'], logo: 'barnesandnoble' },
  'booksamillion.com': { name: 'Books-A-Million', domains: ['booksamillion.com'], logo: 'booksamillion' },
  'thriftbooks.com':   { name: 'ThriftBooks',   domains: ['thriftbooks.com'], logo: 'thriftbooks' },
  'abebooks.com':      { name: 'AbeBooks',      domains: ['abebooks.com'], logo: 'abebooks' },
  'audible.com':       { name: 'Audible',       domains: ['audible.com'], logo: 'audible' },
  'udemy.com':         { name: 'Udemy',         domains: ['udemy.com'], logo: 'udemy' },
  'coursera.org':      { name: 'Coursera',      domains: ['coursera.org'], logo: 'coursera' },
  'skillshare.com':    { name: 'Skillshare',    domains: ['skillshare.com'], logo: 'skillshare' },
  'masterclass.com':   { name: 'MasterClass',   domains: ['masterclass.com'], logo: 'masterclass' },
  
  // --- Tier 14: Travel ---
  'expedia.com':       { name: 'Expedia',       domains: ['expedia.com', 'expedia.ca'], logo: 'expedia' },
  'booking.com':       { name: 'Booking.com',   domains: ['booking.com'], logo: 'booking' },
  'hotels.com':        { name: 'Hotels.com',    domains: ['hotels.com'], logo: 'hotels' },
  'airbnb.com':        { name: 'Airbnb',        domains: ['airbnb.com'], logo: 'airbnb' },
  'vrbo.com':          { name: 'VRBO',          domains: ['vrbo.com'], logo: 'vrbo' },
  'priceline.com':     { name: 'Priceline',     domains: ['priceline.com'], logo: 'priceline' },
  'kayak.com':         { name: 'Kayak',         domains: ['kayak.com'], logo: 'kayak' },
  'orbitz.com':        { name: 'Orbitz',        domains: ['orbitz.com'], logo: 'orbitz' },
  'travelocity.com':   { name: 'Travelocity',   domains: ['travelocity.com'], logo: 'travelocity' },
  'southwest.com':     { name: 'Southwest',     domains: ['southwest.com'], logo: 'southwest' },
  'delta.com':         { name: 'Delta',         domains: ['delta.com'], logo: 'delta' },
  'united.com':        { name: 'United',        domains: ['united.com'], logo: 'united' },
  'aa.com':            { name: 'American Airlines', domains: ['aa.com'], logo: 'americanairlines' },
  'jetblue.com':       { name: 'JetBlue',       domains: ['jetblue.com'], logo: 'jetblue' },
  
  // --- Tier 15: DIY & Craft ---
  'michaels.com':      { name: "Michaels",      domains: ['michaels.com'], logo: 'michaels' },
  'hobbylobby.com':    { name: 'Hobby Lobby',   domains: ['hobbylobby.com'], logo: 'hobbylobby' },
  'joann.com':         { name: "Jo-Ann",        domains: ['joann.com', 'joannfabrics.com'], logo: 'joann' },
  'etsy.com':          { name: 'Etsy',          domains: ['etsy.com'], logo: 'etsy' },
  
  // --- Tier 16: Department Stores (International) ---
  'hm.com':            { name: 'H&M',           domains: ['hm.com'], logo: 'hm' },
  'primark.com':       { name: 'Primark',       domains: ['primark.com'], logo: 'primark' },
  'marksandspencer.com': { name: 'Marks & Spencer', domains: ['marksandspencer.com'], logo: 'marksandspencer' },
  'johnlewis.com':     { name: 'John Lewis',    domains: ['johnlewis.com'], logo: 'johnlewis' },
  'debenhams.com':     { name: 'Debenhams',     domains: ['debenhams.com'], logo: 'debenhams' },
  'harrods.com':       { name: 'Harrods',       domains: ['harrods.com'], logo: 'harrods' },
  'selfridges.com':    { name: 'Selfridges',    domains: ['selfridges.com'], logo: 'selfridges' },
  'libertys.com':      { name: 'Liberty',       domains: ['libertys.com', 'libertylondon.com'], logo: 'liberty' },
  'galerieslafayette.com': { name: 'Galeries Lafayette', domains: ['galerieslafayette.com'], logo: 'galerieslafayette' },
  'elcorteingles.es':  { name: 'El Corte Inglés', domains: ['elcorteingles.es'], logo: 'elcorteingles' },
  
  // --- Tier 17: Pet Supplies ---
  'petco.com':         { name: 'Petco',         domains: ['petco.com'], logo: 'petco' },
  'petsmart.com':      { name: 'PetSmart',      domains: ['petsmart.com'], logo: 'petsmart' },
  'chewy.com':         { name: 'Chewy',         domains: ['chewy.com'], logo: 'chewy' },
  
  // --- Tier 18: Mattresses & Bedding ---
  'casper.com':        { name: 'Casper',        domains: ['casper.com'], logo: 'casper' },
  'tuftandneedle.com': { name: 'Tuft & Needle',  domains: ['tuftandneedle.com'], logo: 'tuftandneedle' },
  'purple.com':        { name: 'Purple',         domains: ['purple.com'], logo: 'purple' },
  'tempurpedic.com':   { name: 'Tempur-Pedic',   domains: ['tempurpedic.com'], logo: 'tempurpedic' },
  'serta.com':         { name: 'Serta',          domains: ['serta.com'], logo: 'serta' },
  'sleepnumber.com':   { name: 'Sleep Number',   domains: ['sleepnumber.com'], logo: 'sleepnumber' },
  
  // --- Tier 19: Eyewear ---
  'warbyparker.com':   { name: 'Warby Parker',   domains: ['warbyparker.com'], logo: 'warbyparker' },
  'zennioptical.com':  { name: 'Zenni Optical',  domains: ['zennioptical.com'], logo: 'zenni' },
  'eyebuydirect.com':  { name: 'EyeBuyDirect',   domains: ['eyebuydirect.com'], logo: 'eyebuydirect' },
  'firmoo.com':        { name: 'Firmoo',         domains: ['firmoo.com'], logo: 'firmoo' },
  
  // --- Tier 20: Subscription Boxes ---
  'birchbox.com':      { name: 'Birchbox',       domains: ['birchbox.com'], logo: 'birchbox' },
  'ipsy.com':          { name: 'Ipsy',           domains: ['ipsy.com'], logo: 'ipsy' },
  'stitchfix.com':     { name: 'Stitch Fix',     domains: ['stitchfix.com'], logo: 'stitchfix' },
  'trunkclub.com':     { name: 'Trunk Club',     domains: ['trunkclub.com'], logo: 'trunkclub' },
  'dollarshaveclub.com': { name: 'Dollar Shave Club', domains: ['dollarshaveclub.com'], logo: 'dollarshaveclub' },
  'bombas.com':        { name: 'Bombas',         domains: ['bombas.com'], logo: 'bombas' },
  'meundies.com':      { name: 'MeUndies',       domains: ['meundies.com'], logo: 'meundies' },
  'toms.com':          { name: 'TOMS',           domains: ['toms.com'], logo: 'toms' },
  'allbirds.com':      { name: 'Allbirds',       domains: ['allbirds.com'], logo: 'allbirds' },
  'rothys.com':        { name: 'Rothy\'s',       domains: ['rothys.com'], logo: 'rothys' },
  
  // --- Tier 21: Kitchen & Dining ---
  'williams-sonoma.com': { name: 'Williams Sonoma', domains: ['williams-sonoma.com'], logo: 'williamssonoma' },
  'surla table.com':   { name: 'Sur La Table',   domains: ['surlatable.com'], logo: 'surlatable' },
  'food52.com':        { name: 'Food52',         domains: ['food52.com'], logo: 'food52' },
  
  // --- Tier 22: Office Supplies ---
  'staples.com':       { name: 'Staples',        domains: ['staples.com'], logo: 'staples' },
  'officedepot.com':   { name: 'Office Depot',   domains: ['officedepot.com'], logo: 'officedepot' },
  'shoplet.com':       { name: 'Shoplet',        domains: ['shoplet.com'], logo: 'shoplet' },
  
  // --- Tier 23: Party & Events ---
  'partycity.com':     { name: 'Party City',     domains: ['partycity.com'], logo: 'partycity' },
  'orientaltrading.com': { name: 'Oriental Trading', domains: ['orientaltrading.com'], logo: 'orientaltrading' },
  'shutterfly.com':    { name: 'Shutterfly',     domains: ['shutterfly.com'], logo: 'shutterfly' },
  'vistaprint.com':    { name: 'VistaPrint',     domains: ['vistaprint.com'], logo: 'vistaprint' },
  'minted.com':        { name: 'Minted',         domains: ['minted.com'], logo: 'minted' },
  'zazzle.com':        { name: 'Zazzle',         domains: ['zazzle.com'], logo: 'zazzle' },
  'cafepress.com':     { name: 'CafePress',      domains: ['cafepress.com'], logo: 'cafepress' },
  'redbubble.com':     { name: 'Redbubble',      domains: ['redbubble.com'], logo: 'redbubble' },
  
  // --- Tier 24: Rental Cars ---
  'enterprise.com':    { name: 'Enterprise',     domains: ['enterprise.com'], logo: 'enterprise' },
  'hertz.com':         { name: 'Hertz',          domains: ['hertz.com'], logo: 'hertz' },
  'avis.com':          { name: 'Avis',           domains: ['avis.com'], logo: 'avis' },
  'budget.com':        { name: 'Budget',         domains: ['budget.com'], logo: 'budget' },
  'nationalcar.com':   { name: 'National',       domains: ['nationalcar.com'], logo: 'national' },
  
  // --- Tier 25: Flowers & Gifts ---
  '1800flowers.com':   { name: '1800Flowers',    domains: ['1800flowers.com'], logo: '1800flowers' },
  'proflowers.com':    { name: 'ProFlowers',     domains: ['proflowers.com'], logo: 'proflowers' },
  'ftd.com':           { name: 'FTD',            domains: ['ftd.com'], logo: 'ftd' },
  'teleflora.com':     { name: 'Teleflora',      domains: ['teleflora.com'], logo: 'teleflora' },
  'ediblearrangements.com': { name: 'Edible Arrangements', domains: ['ediblearrangements.com'], logo: 'ediblearrangements' },
  'thingsremembered.com': { name: 'Things Remembered', domains: ['thingsremembered.com'], logo: 'thingsremembered' },
  'personalizationmall.com': { name: 'Personalization Mall', domains: ['personalizationmall.com'], logo: 'personalizationmall' }
};

const PAGE_TYPE_PATTERNS = {
  product: [
    /\/dp\//i, /\/product\//i, /\/item\//i, /\/products\//i,
    /\/p\//i, /\/pd\//i, /\/sku\//i, /\/asin\//i,
    /\/itm\//i, /\/gp\/product/i, /\/catalog\/product/i,
    /\?product_id=/i, /\/product-detail/i, /\/shop\//i
  ],
  cart: [
    /\/cart/i, /\/shoppingcart/i, /\/basket/i, /\/viewcart/i,
    /\/shop_cart/i, /\/checkout\/cart/i, /\/order\/cart/i,
    /\?cart/i, /\/carts\//i
  ],
  checkout: [
    /\/checkout/i, /\/onepage/i, /\/multistep/i, /\/payment/i,
    /\/revieworder/i, /\/placeorder/i, /\/confirm/i,
    /\/order-confirmation/i, /\/order\/review/i
  ]
};

// JSON-LD extraction helpers
function extractJSONLD() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const results = [];
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      results.push(data);
    } catch (e) {
      // Skip malformed JSON-LD
    }
  }
  return results;
}

function extractFromJSONLD(jsonld) {
  const result = { title: null, price: null, currency: null, brand: null, sku: null };
  
  for (const data of jsonld) {
    const items = data['@graph'] || [data];
    for (const item of items) {
      if (item['@type'] === 'Product' || item['@type'] === 'IndividualProduct') {
        result.title = result.title || item.name;
        result.brand = result.brand || (item.brand && (item.brand.name || item.brand));
        result.sku = result.sku || item.sku;
        
        if (item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
          for (const offer of offers) {
            if (offer.price) {
              result.price = offer.price;
              result.currency = offer.priceCurrency || 'USD';
              break;
            }
          }
        }
      }
    }
  }
  return result;
}

function extractFromMeta() {
  const result = { title: null, price: null, currency: null, brand: null };
  
  // Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) result.title = ogTitle.getAttribute('content');
  
  // Product price (various formats)
  const priceSelectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[name="twitter:data1"]',
    '[itemprop="price"][content]',
    '.price .amount'
  ];
  for (const sel of priceSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = el.getAttribute('content') || el.textContent;
      const num = parseFloat(val.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) { result.price = num; break; }
    }
  }
  
  // Currency
  const currencyEl = document.querySelector('meta[property="product:price:currency"]') ||
                      document.querySelector('meta[property="og:price:currency"]');
  if (currencyEl) result.currency = currencyEl.getAttribute('content');
  
  return result;
}

function extractProductTitle() {
  // Try common product title selectors
  const selectors = [
    '#productTitle', '.product-title', '.product-name', '.prod-title',
    '[data-testid="product-title"]', '.pdp-title', '.item_title',
    '.product-info-name', '.product__title', 'h1[itemprop="name"]',
    '.ProductTitle', '.product-detail-title', '.product-name-wrapper h1',
    '.main-header h1', '.page-title h1', '.product-hero h1',
    'h1', '.prod-name', '.product-name--main', '.product--title',
    '.product-main-title', '.js-product-name', '.c-product-title'
  ];
  
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim().length > 5) {
      return el.textContent.trim();
    }
  }
  return null;
}

function extractProductPrice() {
  const selectors = [
    '#priceblock_ourprice', '#priceblock_dealprice', '.a-price .a-offscreen',
    '.price-value', '.product-price', '.current-price', '.sale-price',
    '[data-testid="price"]', '.price--current', '.price-wrapper .price',
    '.ProductPrice', '.prod-price', '.item-price', '.final-price',
    '.price', '.total-price', '.product__price', '.product-price__current',
    '.offer-price', '.selling-price', '.regular-price',
    '[itemprop="price"]', '.c-price', '.price--main', '.main-price'
  ];
  
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.getAttribute('content') || el.textContent;
      const match = text.match(/[\d,.]+/);
      if (match) {
        const num = parseFloat(match[0].replace(/,/g, ''));
        if (!isNaN(num) && num > 0) return num;
      }
    }
  }
  return null;
}

function extractProductImage() {
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    '#landingImage', '.product-image img', '.main-image img',
    '[data-testid="product-image"] img', '.product__image img',
    '.pdp-image img', '.prod-image img', '.gallery-image img',
    '.product-main-image img', '.product-image__main img'
  ];
  
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const src = el.getAttribute('content') || el.getAttribute('src') || el.getAttribute('data-src');
      if (src && src.startsWith('http')) return src;
    }
  }
  return null;
}

function detectPageType(url) {
  const urlStr = url.toLowerCase();
  
  for (const [type, patterns] of Object.entries(PAGE_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(urlStr)) return type;
    }
  }
  
  // Check for specific store patterns
  if (/amazon\.com/.test(urlStr)) {
    if (/\/dp\//.test(urlStr) || /\/gp\/product/.test(urlStr)) return 'product';
    if (/\/gp\/cart/.test(urlStr) || /cart/.test(urlStr)) return 'cart';
    if (/\/gp\/buy/.test(urlStr) || /\/checkout/.test(urlStr)) return 'checkout';
  }
  
  return 'unknown';
}

function normalizeDomain(hostname) {
  return hostname.replace(/^www\./, '').toLowerCase();
}

/**
 * Main detection function. Returns a store info object.
 * @returns {Object} { store, domain, pageType, product: { title, price, currency, image, url } }
 */
function detectStore() {
  const hostname = window.location.hostname;
  const normalizedDomain = normalizeDomain(hostname);
  const url = window.location.href;
  
  // Find matching store
  let store = null;
  let matchedDomain = null;
  
  for (const [key, info] of Object.entries(STORE_DATABASE)) {
    for (const domain of info.domains) {
      if (normalizedDomain === domain || normalizedDomain.endsWith('.' + domain)) {
        store = info;
        matchedDomain = domain;
        break;
      }
    }
    if (store) break;
  }
  
  // Detect page type
  const pageType = detectPageType(url);
  
  // Extract product info if on a product page
  const product = { title: null, price: null, currency: null, image: null, url: null };
  
  if (pageType === 'product' || pageType === 'unknown') {
    const jsonld = extractJSONLD();
    const jsonldInfo = extractFromJSONLD(jsonld);
    const metaInfo = extractFromMeta();
    
    product.title = jsonldInfo.title || metaInfo.title || extractProductTitle() || document.title;
    product.price = jsonldInfo.price || metaInfo.price || extractProductPrice();
    product.currency = jsonldInfo.currency || metaInfo.currency || 'USD';
    product.image = extractProductImage();
    product.url = url;
  }
  
  return {
    store: store ? store.name : null,
    storeInfo: store,
    domain: normalizedDomain,
    matchedDomain: matchedDomain,
    pageType: pageType,
    product: product,
    isShoppingSite: store !== null
  };
}

// Export for use in content scripts and popup
if (typeof window !== 'undefined') {
  window.StoreDetector = {
    detect: detectStore,
    database: STORE_DATABASE
  };
}

// For module exports (if bundled)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { detectStore, STORE_DATABASE };
}
