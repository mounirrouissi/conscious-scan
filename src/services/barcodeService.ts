/**
 * Barcode Lookup Service
 * Uses Open Food Facts API for product information
 */

export interface BarcodeProduct {
  name: string;
  brand: string;
  category: string;
  ingredients: string;
  imageUrl?: string;
  found: boolean;
}

/**
 * Look up product by barcode using Open Food Facts API
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeProduct> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'ConsciousScan/1.0 (contact@example.com)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return {
        name: '',
        brand: '',
        category: '',
        ingredients: '',
        found: false,
      };
    }

    const product = data.product;

    // Extract category from categories hierarchy
    let category = 'Uncategorized';
    if (product.categories_tags && product.categories_tags.length > 0) {
      // Get the most specific category and clean it up
      const rawCategory = product.categories_tags[product.categories_tags.length - 1];
      category = rawCategory
        .replace('en:', '')
        .replace(/-/g, ' ')
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Map to our app categories
    const categoryMapping: Record<string, string> = {
      'beverages': 'Food & Beverages',
      'drinks': 'Food & Beverages',
      'snacks': 'Food & Beverages',
      'cereals': 'Food & Beverages',
      'dairy': 'Food & Beverages',
      'meats': 'Food & Beverages',
      'fruits': 'Food & Beverages',
      'vegetables': 'Food & Beverages',
      'breads': 'Food & Beverages',
      'sweets': 'Food & Beverages',
      'chocolates': 'Food & Beverages',
      'beauty': 'Skincare',
      'cosmetics': 'Cosmetics',
      'shampoos': 'Hair Care',
      'conditioners': 'Hair Care',
      'soaps': 'Body Care',
      'toothpastes': 'Oral Care',
      'baby': 'Baby Products',
      'cleaning': 'Household Cleaning',
      'supplements': 'Supplements',
      'vitamins': 'Supplements',
    };

    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(categoryMapping)) {
      if (lowerCategory.includes(key)) {
        category = value;
        break;
      }
    }

    return {
      name: product.product_name || product.product_name_en || '',
      brand: product.brands || '',
      category,
      ingredients: product.ingredients_text || product.ingredients_text_en || '',
      imageUrl: product.image_front_url || product.image_url,
      found: true,
    };
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return {
      name: '',
      brand: '',
      category: '',
      ingredients: '',
      found: false,
    };
  }
}

/**
 * Search products by name using Open Food Facts API
 */
export async function searchProducts(query: string, limit: number = 10): Promise<BarcodeProduct[]> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`,
      {
        headers: {
          'User-Agent': 'ConsciousScan/1.0 (contact@example.com)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return [];
    }

    return data.products.map((product: any) => ({
      name: product.product_name || product.product_name_en || 'Unknown',
      brand: product.brands || '',
      category: 'Food & Beverages',
      ingredients: product.ingredients_text || product.ingredients_text_en || '',
      imageUrl: product.image_front_small_url || product.image_url,
      found: true,
    }));
  } catch (error) {
    console.error('Product search error:', error);
    return [];
  }
}
