import { NextResponse } from 'next/server';

// Mock catalog mimicking a quick-commerce inventory
const MOCK_CATALOG = {
  'onion': { sku: 'Organic Red Onions 1kg', price: 60 },
  'chicken': { sku: 'Farm Fresh Chicken Breast 500g', price: 250 },
  'tomato': { sku: 'Local Tomatoes 500g', price: 40 },
  'garlic': { sku: 'Peeled Garlic 100g', price: 30 },
  'milk': { sku: 'Full Cream Milk 1L', price: 65 },
  'egg': { sku: 'Farm Eggs 6 pcs', price: 50 },
  'bread': { sku: 'Whole Wheat Bread 400g', price: 45 },
  'butter': { sku: 'Salted Butter 100g', price: 55 },
  'oil': { sku: 'Refined Sunflower Oil 1L', price: 120 }
};

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.ingredients)) {
      return NextResponse.json(
        { error: 'Invalid request body. "ingredients" array is required.' },
        { status: 400 }
      );
    }

    // Artificial latency of 1500ms to simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let totalEstimatedPrice = 0;
    const matchedItems = body.ingredients.map((ing) => {
      const originalQuery = ing.item || '';
      const normalizedQuery = originalQuery.toLowerCase();
      
      // Attempt to find a match in the mock catalog
      const matchKey = Object.keys(MOCK_CATALOG).find(key => normalizedQuery.includes(key));
      
      let matchedSku;
      let price;
      
      if (matchKey) {
        // Known item mapping
        matchedSku = MOCK_CATALOG[matchKey].sku;
        price = MOCK_CATALOG[matchKey].price;
      } else {
        // Fallback generic SKU generation for unknown items
        // We generate a random price between 20 and 150 for realism
        matchedSku = `Fresh ${originalQuery.charAt(0).toUpperCase() + originalQuery.slice(1)} (Generic)`;
        price = Math.floor(Math.random() * (150 - 20 + 1) + 20);
      }

      totalEstimatedPrice += price;

      return {
        originalQuery,
        matchedSku,
        price,
        found: !!matchKey
      };
    });

    const cartId = `mock-instamart-cart-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      status: "success",
      cartId,
      totalEstimatedPrice,
      currency: "INR",
      matchedItems,
      checkoutUrl: `https://instamart.swiggy.com/mock-checkout/${cartId.split('-').pop()}`
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
