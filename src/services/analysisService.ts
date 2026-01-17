import { Ingredient, Product, UserProfile } from '../types';
import { analyzeIngredientsWithLLM, LLMAnalysisResponse } from './llmService';

/**
 * Parse ingredient text into individual ingredients (for display/fallback)
 */
export const parseIngredients = (text: string): string[] => {
  const cleaned = text
    .toLowerCase()
    .replace(/ingredients:/gi, '')
    .replace(/\n/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned
    .split(/[,;•·]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 1 && i.length < 100);
};

/**
 * Analyze product using LLM and create a Product object
 */
export const createProductFromScan = async (
  scanData: {
    name?: string;
    brand?: string;
    category?: string;
    barcode?: string;
    ingredientText: string;
    imageUri?: string;
  },
  profile: UserProfile
): Promise<Product> => {
  const productName = scanData.name || 'Unknown Product';
  const productCategory = scanData.category || 'Uncategorized';

  try {
    // Use LLM for analysis
    const llmAnalysis = await analyzeIngredientsWithLLM(
      productName,
      productCategory,
      scanData.ingredientText,
      profile
    );

    // Convert LLM response to Product format
    const ingredients: Ingredient[] = llmAnalysis.ingredients.map((ing) => ({
      name: ing.name,
      category: ing.category,
      description: ing.description,
      healthRating: ing.healthRating,
      concerns: ing.concerns,
      benefits: ing.benefits,
      isVegan: ing.isVegan,
      isNatural: ing.isNatural,
    }));

    return {
      id: Date.now().toString(),
      name: llmAnalysis.product.name || productName,
      brand: scanData.brand || 'Unknown Brand',
      category: llmAnalysis.product.category || productCategory,
      imageUri: scanData.imageUri,
      barcode: scanData.barcode,
      ingredients,
      rawIngredientText: scanData.ingredientText,
      overallScore: llmAnalysis.overall_rating,
      letterGrade: llmAnalysis.letter_grade,
      personalizedWarnings: llmAnalysis.personalized_warnings,
      personalizedAdvice: llmAnalysis.personalized_advice,
      scannedAt: new Date(),
    };
  } catch (error) {
    console.error('LLM analysis failed, using fallback:', error);
    // Fallback to basic analysis if LLM fails
    return createProductFallback(scanData, profile);
  }
};

/**
 * Fallback analysis when LLM is unavailable
 */
const createProductFallback = (
  scanData: {
    name?: string;
    brand?: string;
    category?: string;
    barcode?: string;
    ingredientText: string;
    imageUri?: string;
  },
  profile: UserProfile
): Product => {
  const ingredientNames = parseIngredients(scanData.ingredientText);
  
  // Create basic ingredient objects
  const ingredients: Ingredient[] = ingredientNames.map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    category: 'Unknown',
    description: 'Analysis unavailable - please try again later.',
    healthRating: 'caution' as const,
    concerns: ['Unable to analyze - LLM service unavailable'],
    benefits: [],
    isVegan: true,
    isNatural: false,
  }));

  return {
    id: Date.now().toString(),
    name: scanData.name || 'Unknown Product',
    brand: scanData.brand || 'Unknown Brand',
    category: scanData.category || 'Uncategorized',
    imageUri: scanData.imageUri,
    barcode: scanData.barcode,
    ingredients,
    rawIngredientText: scanData.ingredientText,
    overallScore: 50,
    letterGrade: 'C',
    personalizedWarnings: ['Analysis incomplete - AI service temporarily unavailable'],
    personalizedAdvice: ['Try scanning again when connected to the internet'],
    scannedAt: new Date(),
  };
};

/**
 * Compare multiple products (synchronous - uses existing product data)
 */
export const compareProducts = (
  products: Product[],
  profile: UserProfile
) => {
  if (!products || products.length === 0) {
    return {
      products: [],
      rankedOrder: [],
      summary: 'No products to compare',
      differingIngredients: [],
    };
  }

  // Rank by score
  const ranked = [...products].sort((a, b) => b.overallScore - a.overallScore);

  // Find differing ingredients
  const allIngredients = new Map<string, string[]>();
  products.forEach((product) => {
    if (product.ingredients) {
      product.ingredients.forEach((ing) => {
        const existing = allIngredients.get(ing.name) || [];
        if (!existing.includes(product.name)) {
          existing.push(product.name);
          allIngredients.set(ing.name, existing);
        }
      });
    }
  });

  const differingIngredients = Array.from(allIngredients.entries())
    .filter(([_, presentIn]) => presentIn.length < products.length)
    .map(([ingredient, presentIn]) => {
      const product = products.find(p => 
        p.ingredients?.some(i => i.name === ingredient)
      );
      const ing = product?.ingredients?.find(i => i.name === ingredient);
      return {
        ingredient,
        presentIn,
        rating: ing?.healthRating || 'caution' as const,
      };
    });

  // Generate summary
  const best = ranked[0];
  const summary = `${best.name} ranks highest with a score of ${best.overallScore}. ` +
    `It has ${best.personalizedWarnings?.length || 0} warnings based on your profile.`;

  return {
    products,
    rankedOrder: ranked.map((p) => p.id),
    summary,
    differingIngredients,
  };
};
