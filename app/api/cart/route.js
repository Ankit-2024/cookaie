import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { parseCartBody } from '@/lib/validation';

// ─── Mock NLP Normalization Catalog ──────────────────────────────────────────
// Maps common ingredient keywords → realistic Swiggy Instamart SKU data.
// When the real API key arrives, this entire file gets replaced by the live
// integration in a single swap — the response shape is identical.

const SKU_CATALOG = {
  // ── Proteins ─────────────────────────────────────────────────────────────
  chicken:    { skuId: 'IM-PRO-40821', name: 'Fresho Chicken Curry Cut (Bone-In) 500g',       price: 199, mrp: 230, unit: '500 g',  category: 'Meat & Seafood',   thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/chicken_curry_cut_500g' },
  mutton:     { skuId: 'IM-PRO-40835', name: 'Fresho Goat Curry Cut (Bone-In) 500g',          price: 649, mrp: 700, unit: '500 g',  category: 'Meat & Seafood',   thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/mutton_curry_cut_500g' },
  egg:        { skuId: 'IM-PRO-40850', name: 'Fresho Farm Eggs - Pack of 6',                  price: 54,  mrp: 60,  unit: '6 pcs',  category: 'Meat & Seafood',   thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/farm_eggs_6pcs' },
  fish:       { skuId: 'IM-PRO-40862', name: 'Fresho Rohu Fish Curry Cut 500g',               price: 189, mrp: 220, unit: '500 g',  category: 'Meat & Seafood',   thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/rohu_curry_cut_500g' },
  prawn:      { skuId: 'IM-PRO-40878', name: 'Fresho Prawns (Medium) Cleaned 250g',           price: 249, mrp: 299, unit: '250 g',  category: 'Meat & Seafood',   thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/prawns_medium_250g' },
  paneer:     { skuId: 'IM-DRY-51203', name: 'Amul Fresh Malai Paneer 200g',                  price: 90,  mrp: 99,  unit: '200 g',  category: 'Dairy',            thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/amul_paneer_200g' },
  tofu:       { skuId: 'IM-DRY-51210', name: 'Nutrela Soya Tofu 200g',                        price: 45,  mrp: 50,  unit: '200 g',  category: 'Dairy',            thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/nutrela_tofu_200g' },

  // ── Produce ──────────────────────────────────────────────────────────────
  onion:      { skuId: 'IM-VEG-60101', name: 'Fresho Onion (Loose) 1kg',                      price: 39,  mrp: 45,  unit: '1 kg',   category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/onion_loose_1kg' },
  tomato:     { skuId: 'IM-VEG-60115', name: 'Fresho Tomato - Hybrid (Loose) 500g',           price: 24,  mrp: 30,  unit: '500 g',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/tomato_hybrid_500g' },
  potato:     { skuId: 'IM-VEG-60120', name: 'Fresho Potato (Loose) 1kg',                     price: 33,  mrp: 40,  unit: '1 kg',   category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/potato_loose_1kg' },
  garlic:     { skuId: 'IM-VEG-60130', name: 'Fresho Garlic (Loose) 100g',                    price: 18,  mrp: 25,  unit: '100 g',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/garlic_loose_100g' },
  ginger:     { skuId: 'IM-VEG-60135', name: 'Fresho Ginger (Loose) 100g',                    price: 15,  mrp: 22,  unit: '100 g',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/ginger_loose_100g' },
  capsicum:   { skuId: 'IM-VEG-60140', name: 'Fresho Capsicum Green (Loose) 250g',            price: 22,  mrp: 30,  unit: '250 g',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/capsicum_green_250g' },
  lemon:      { skuId: 'IM-VEG-60155', name: 'Fresho Lemon (Loose) 4 pcs',                    price: 16,  mrp: 20,  unit: '4 pcs',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/lemon_loose_4pcs' },
  carrot:     { skuId: 'IM-VEG-60162', name: 'Fresho Carrot - Ooty (Loose) 500g',             price: 37,  mrp: 45,  unit: '500 g',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/carrot_ooty_500g' },
  spinach:    { skuId: 'IM-VEG-60170', name: 'Fresho Spinach (Palak) 1 Bunch',                price: 15,  mrp: 20,  unit: '1 bunch', category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/spinach_bunch' },
  coriander:  { skuId: 'IM-VEG-60175', name: 'Fresho Coriander Leaves 100g',                  price: 10,  mrp: 15,  unit: '100 g',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/coriander_100g' },
  mint:       { skuId: 'IM-VEG-60180', name: 'Fresho Mint Leaves (Pudina) 100g',              price: 10,  mrp: 12,  unit: '100 g',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/mint_100g' },
  pea:        { skuId: 'IM-VEG-60185', name: 'Fresho Green Peas (Shelled) 200g',              price: 30,  mrp: 38,  unit: '200 g',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/green_peas_200g' },
  mushroom:   { skuId: 'IM-VEG-60190', name: 'Fresho Button Mushroom 200g',                   price: 42,  mrp: 50,  unit: '200 g',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/mushroom_button_200g' },
  broccoli:   { skuId: 'IM-VEG-60196', name: 'Fresho Broccoli 1 pc (approx. 300g)',           price: 62,  mrp: 75,  unit: '1 pc',   category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/broccoli_1pc' },
  corn:       { skuId: 'IM-VEG-60200', name: 'Fresho Sweet Corn 2 pcs',                       price: 40,  mrp: 50,  unit: '2 pcs',  category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/sweet_corn_2pcs' },
  cabbage:    { skuId: 'IM-VEG-60205', name: 'Fresho Cabbage (Loose) 1 pc',                   price: 28,  mrp: 35,  unit: '1 pc',   category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/cabbage_1pc' },
  cauliflower: { skuId: 'IM-VEG-60210', name: 'Fresho Cauliflower (Gobi) 1 pc',               price: 35,  mrp: 42,  unit: '1 pc',   category: 'Fruits & Vegetables', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/cauliflower_1pc' },

  // ── Dairy ────────────────────────────────────────────────────────────────
  milk:       { skuId: 'IM-DRY-51101', name: 'Amul Taaza Toned Fresh Milk 1L',                price: 60,  mrp: 60,  unit: '1 L',    category: 'Dairy',            thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/amul_taaza_1l' },
  butter:     { skuId: 'IM-DRY-51120', name: 'Amul Butter 100g',                              price: 56,  mrp: 57,  unit: '100 g',  category: 'Dairy',            thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/amul_butter_100g' },
  cheese:     { skuId: 'IM-DRY-51135', name: 'Amul Cheese Slices 200g (10 Slices)',            price: 120, mrp: 130, unit: '200 g',  category: 'Dairy',            thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/amul_cheese_slices_200g' },
  cream:      { skuId: 'IM-DRY-51140', name: 'Amul Fresh Cream 200ml',                        price: 65,  mrp: 68,  unit: '200 ml', category: 'Dairy',            thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/amul_cream_200ml' },
  curd:       { skuId: 'IM-DRY-51150', name: 'Nestle a+ Curd (Dahi) 400g',                    price: 38,  mrp: 42,  unit: '400 g',  category: 'Dairy',            thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/nestle_curd_400g' },
  yogurt:     { skuId: 'IM-DRY-51155', name: 'Epigamia Greek Yogurt - Natural 90g',           price: 45,  mrp: 50,  unit: '90 g',   category: 'Dairy',            thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/epigamia_yogurt_90g' },
  ghee:       { skuId: 'IM-DRY-51160', name: 'Amul Cow Ghee 500ml Jar',                       price: 315, mrp: 330, unit: '500 ml', category: 'Dairy',            thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/amul_ghee_500ml' },

  // ── Staples & Grains ────────────────────────────────────────────────────
  rice:       { skuId: 'IM-STP-70201', name: 'India Gate Basmati Rice - Classic 1kg',          price: 185, mrp: 199, unit: '1 kg',   category: 'Staples',          thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/india_gate_basmati_1kg' },
  flour:      { skuId: 'IM-STP-70210', name: 'Aashirvaad Shudh Chakki Atta 1kg',              price: 56,  mrp: 62,  unit: '1 kg',   category: 'Staples',          thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/aashirvaad_atta_1kg' },
  maida:      { skuId: 'IM-STP-70215', name: 'Rajdhani Select Maida 500g',                    price: 32,  mrp: 38,  unit: '500 g',  category: 'Staples',          thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/rajdhani_maida_500g' },
  bread:      { skuId: 'IM-STP-70220', name: 'Harvest Gold White Bread 400g',                  price: 42,  mrp: 45,  unit: '400 g',  category: 'Staples',          thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/harvest_gold_400g' },
  pasta:      { skuId: 'IM-STP-70230', name: 'Barilla Penne Rigate 500g',                     price: 159, mrp: 175, unit: '500 g',  category: 'Staples',          thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/barilla_penne_500g' },
  noodle:     { skuId: 'IM-STP-70235', name: 'Ching\'s Hakka Noodles 600g',                   price: 105, mrp: 115, unit: '600 g',  category: 'Staples',          thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/chings_noodles_600g' },
  sugar:      { skuId: 'IM-STP-70240', name: 'Uttam Sugar Crystal 1kg',                        price: 46,  mrp: 50,  unit: '1 kg',   category: 'Staples',          thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/uttam_sugar_1kg' },
  salt:       { skuId: 'IM-STP-70250', name: 'Tata Iodised Salt 1kg',                         price: 24,  mrp: 25,  unit: '1 kg',   category: 'Staples',          thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/tata_salt_1kg' },

  // ── Oils & Condiments ───────────────────────────────────────────────────
  oil:        { skuId: 'IM-OIL-80301', name: 'Fortune Refined Sunflower Oil 1L',               price: 139, mrp: 155, unit: '1 L',    category: 'Oils & Condiments', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/fortune_sunflower_1l' },
  'olive oil': { skuId: 'IM-OIL-80310', name: 'Figaro Extra Virgin Olive Oil 250ml',          price: 299, mrp: 350, unit: '250 ml', category: 'Oils & Condiments', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/figaro_olive_250ml' },
  vinegar:    { skuId: 'IM-OIL-80320', name: 'American Garden Apple Cider Vinegar 473ml',      price: 225, mrp: 260, unit: '473 ml', category: 'Oils & Condiments', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/ag_acv_473ml' },
  'soy sauce': { skuId: 'IM-OIL-80330', name: 'Ching\'s Dark Soy Sauce 210g',                 price: 68,  mrp: 75,  unit: '210 g',  category: 'Oils & Condiments', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/chings_soy_210g' },
  ketchup:    { skuId: 'IM-OIL-80335', name: 'Kissan Fresh Tomato Ketchup 500g',              price: 105, mrp: 115, unit: '500 g',  category: 'Oils & Condiments', thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/kissan_ketchup_500g' },

  // ── Spices ──────────────────────────────────────────────────────────────
  turmeric:   { skuId: 'IM-SPC-90401', name: 'Everest Turmeric Powder 100g',                  price: 40,  mrp: 45,  unit: '100 g',  category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/everest_turmeric_100g' },
  'chilli':   { skuId: 'IM-SPC-90410', name: 'Everest Kashmirilal Chilli Powder 100g',        price: 62,  mrp: 72,  unit: '100 g',  category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/everest_chilli_100g' },
  cumin:      { skuId: 'IM-SPC-90420', name: 'MDH Deggi Mirch Cumin Powder 100g',             price: 55,  mrp: 60,  unit: '100 g',  category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/mdh_cumin_100g' },
  cinnamon:   { skuId: 'IM-SPC-90430', name: 'Catch Cinnamon Sticks 50g',                     price: 60,  mrp: 68,  unit: '50 g',   category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/catch_cinnamon_50g' },
  pepper:     { skuId: 'IM-SPC-90440', name: 'Catch Black Pepper Powder 50g',                 price: 79,  mrp: 90,  unit: '50 g',   category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/catch_pepper_50g' },
  'garam masala': { skuId: 'IM-SPC-90450', name: 'MDH Garam Masala 100g',                     price: 80,  mrp: 90,  unit: '100 g',  category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/mdh_garam_masala_100g' },
  'biryani masala': { skuId: 'IM-SPC-90455', name: 'Shan Biryani Masala 60g',                 price: 75,  mrp: 85,  unit: '60 g',   category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/shan_biryani_60g' },
  'coriander powder': { skuId: 'IM-SPC-90460', name: 'Everest Dhaniya Powder 100g',           price: 36,  mrp: 42,  unit: '100 g',  category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/everest_dhaniya_100g' },
  bay:        { skuId: 'IM-SPC-90470', name: 'Catch Bay Leaf (Tej Patta) 25g',                price: 30,  mrp: 35,  unit: '25 g',   category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/catch_bay_leaf_25g' },
  cardamom:   { skuId: 'IM-SPC-90475', name: 'Catch Green Cardamom (Elaichi) 25g',            price: 120, mrp: 135, unit: '25 g',   category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/catch_cardamom_25g' },
  clove:      { skuId: 'IM-SPC-90480', name: 'Catch Cloves (Laung) 25g',                      price: 85,  mrp: 95,  unit: '25 g',   category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/catch_cloves_25g' },
  saffron:    { skuId: 'IM-SPC-90490', name: 'Baby Brand Saffron (Kesar) 1g',                 price: 150, mrp: 175, unit: '1 g',    category: 'Spices',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/saffron_1g' },

  // ── Baking ──────────────────────────────────────────────────────────────
  'baking powder': { skuId: 'IM-BAK-11501', name: 'Weikfield Baking Powder 100g',             price: 40,  mrp: 48,  unit: '100 g',  category: 'Baking',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/weikfield_bp_100g' },
  'baking soda':   { skuId: 'IM-BAK-11505', name: 'Tata Sampann Baking Soda 100g',            price: 22,  mrp: 25,  unit: '100 g',  category: 'Baking',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/tata_baking_soda_100g' },
  'cocoa':         { skuId: 'IM-BAK-11510', name: 'Hershey\'s Cocoa Powder 225g',              price: 285, mrp: 310, unit: '225 g',  category: 'Baking',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/hersheys_cocoa_225g' },
  'vanilla':       { skuId: 'IM-BAK-11515', name: 'Bluebird Vanilla Essence 20ml',             price: 33,  mrp: 38,  unit: '20 ml',  category: 'Baking',           thumbnail: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/bluebird_vanilla_20ml' },
};

// Sorted longest-first so "olive oil" matches before "oil", "soy sauce" before "sauce", etc.
const CATALOG_KEYS = Object.keys(SKU_CATALOG).sort((a, b) => b.length - a.length);

// ─── NLP Normalization (Mock) ────────────────────────────────────────────────

/**
 * Simulates an NLP normalization step:
 *  1. Strips quantities, units and filler words from the raw ingredient string
 *  2. Fuzzy-matches against the catalog
 *  3. Returns the best SKU match or a generated fallback
 */
function normalizeIngredient(rawItem) {
  const cleaned = rawItem
    .toLowerCase()
    .replace(/\d+\s*(g|gm|gms|gram|grams|kg|kgs|ml|l|litre|litres|liter|liters|oz|lb|lbs|cup|cups|tbsp|tsp|teaspoon|tablespoon|pcs|pieces|piece|pack|packs|standard|approx|fresh|organic|boneless|bone-in|chopped|sliced|diced|minced|powdered|ground|crushed|whole|dried|raw|refined|extra\s*virgin|peeled|cleaned|loose)\b/gi, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Try to find the best catalog match (longest key that appears in the cleaned string)
  const matchKey = CATALOG_KEYS.find((key) => cleaned.includes(key));

  return matchKey || null;
}

/**
 * Simulate network + NLP processing delay (800–1800ms).
 */
function simulateLatency() {
  const delay = 800 + Math.floor(Math.random() * 1000);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request) {
  // ── 1. Rate Limiting (checked before body parsing) ──────────────────────
  try {
    const { success, limit, remaining, reset } = await applyRateLimit(request);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  } catch (rateLimitError) {
    // If Redis is unreachable, log and proceed (fail-open).
    // In production you may choose fail-closed instead.
    console.warn('[POST /api/cart] Rate limiter unavailable:', rateLimitError.message);
  }

  // ── 2. Schema Validation (Zod) ─────────────────────────────────────────
  let ingredients;
  try {
    const body = await request.json();
    const parsed = parseCartBody(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error },
        { status: 400 }
      );
    }

    ingredients = parsed.data.ingredients;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400 }
    );
  }

  try {
    // 2. Simulate NLP normalization latency
    await simulateLatency();

    // 3. Map each ingredient to a catalog SKU
    let totalEstimatedPrice = 0;
    const matchedItems = [];
    const unavailableItems = [];

    for (const ingredient of ingredients) {
      const rawName = ingredient.item || '';
      const matchKey = normalizeIngredient(rawName);

      if (matchKey) {
        const sku = SKU_CATALOG[matchKey];
        totalEstimatedPrice += sku.price;

        matchedItems.push({
          originalQuery: rawName,
          requestedAmount: ingredient.amount || '',
          skuId: sku.skuId,
          matchedSku: sku.name,
          unit: sku.unit,
          price: sku.price,
          mrp: sku.mrp,
          discount: sku.mrp > sku.price ? `${Math.round(((sku.mrp - sku.price) / sku.mrp) * 100)}% off` : null,
          category: sku.category,
          thumbnailUrl: sku.thumbnail,
          inStock: true,
          quantity: 1,
        });
      } else {
        // Unknown ingredient — generate a realistic fallback
        const fallbackPrice = 20 + Math.floor(Math.random() * 130);
        const fallbackMrp = fallbackPrice + Math.floor(Math.random() * 20) + 5;
        const titleCased = rawName.replace(/\b\w/g, (c) => c.toUpperCase());
        const fallbackSkuId = `IM-GEN-${(99000 + Math.floor(Math.random() * 900))}`;

        totalEstimatedPrice += fallbackPrice;

        matchedItems.push({
          originalQuery: rawName,
          requestedAmount: ingredient.amount || '',
          skuId: fallbackSkuId,
          matchedSku: `${titleCased} (Nearest Match)`,
          unit: '1 pack',
          price: fallbackPrice,
          mrp: fallbackMrp,
          discount: `${Math.round(((fallbackMrp - fallbackPrice) / fallbackMrp) * 100)}% off`,
          category: 'General',
          thumbnailUrl: `https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_256/generic_grocery_item`,
          inStock: true,
          quantity: 1,
        });
      }
    }

    // 4. Build mock cart metadata
    const cartId = `IM-CART-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const deliveryFee = totalEstimatedPrice > 499 ? 0 : 25;
    const platformFee = 5;
    const grandTotal = totalEstimatedPrice + deliveryFee + platformFee;

    // 5. Return Swiggy-shaped response
    return NextResponse.json({
      status: 'success',
      cartId,
      matchedItems,
      unavailableItems,
      totalEstimatedPrice,
      pricing: {
        itemTotal: totalEstimatedPrice,
        deliveryFee,
        platformFee,
        grandTotal,
        currency: 'INR',
        freeDeliveryThreshold: 499,
      },
      delivery: {
        estimatedMinutes: 10 + Math.floor(Math.random() * 8),
        slot: 'Express Delivery',
        storeId: 'INSTA-BLR-HSR-042',
        storeName: 'Instamart HSR Layout',
      },
      checkoutUrl: `https://www.swiggy.com/instamart/checkout?cartId=${cartId}`,
      _meta: {
        mock: true,
        version: '1.0.0',
        note: 'This is a simulated response. Replace with live Swiggy Builders Club API when the key is provisioned.',
      },
    });
  } catch (error) {
    console.error('[POST /api/cart] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
