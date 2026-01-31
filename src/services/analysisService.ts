import { Ingredient, Product, UserProfile } from '../types';
import { analyzeIngredientsWithLLM, LLMAnalysisResponse } from './llmService';

/**
 * Detect if the text is primarily a nutrition facts table
 */
export const isNutritionTable = (text: string): boolean => {
  const lower = text.toLowerCase();
  
  // Count nutrition-related keywords
  const nutritionKeywords = [
    'nutrition facts',
    'nutritional information',
    'serving size',
    'calories',
    'total fat',
    'saturated fat',
    'cholesterol',
    'sodium',
    'carbohydrate',
    'protein',
    'vitamin',
    'daily value',
  ];
  
  const keywordCount = nutritionKeywords.filter(keyword => lower.includes(keyword)).length;
  
  // If 3+ nutrition keywords found, it's likely a nutrition table
  return keywordCount >= 3;
};

/**
 * Extract nutrition information from a nutrition facts table
 */
export const extractNutritionInfo = (text: string): {
  servingSize?: string;
  calories?: string;
  nutrients: Array<{ name: string; amount: string; dailyValue?: string }>;
} => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const nutrients: Array<{ name: string; amount: string; dailyValue?: string }> = [];
  let servingSize: string | undefined;
  let calories: string | undefined;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Extract serving size
    if (lower.includes('serving size') || lower.includes('serving:')) {
      servingSize = line.replace(/serving size:?/gi, '').trim();
      continue;
    }

    // Extract calories
    if (lower.includes('calories') && !lower.includes('from')) {
      const calorieMatch = line.match(/calories\s*:?\s*(\d+)/i);
      if (calorieMatch) {
        calories = calorieMatch[1];
      }
      continue;
    }

    // Extract nutrients (e.g., "Total Fat 8g (10% DV)")
    const nutrientPatterns = [
      // Pattern: "Total Fat 8g (10%)"
      /^([\w\s]+?)\s+(\d+\.?\d*\s*(?:g|mg|mcg|iu))\s*(?:\((\d+)%?\s*(?:dv|daily value)?\))?/i,
      // Pattern: "Sodium 170mg 8%"
      /^([\w\s]+?)\s+(\d+\.?\d*\s*(?:g|mg|mcg|iu))\s+(\d+)%?/i,
      // Pattern: "Protein 3g"
      /^([\w\s]+?)\s+(\d+\.?\d*\s*(?:g|mg|mcg|iu))$/i,
    ];

    for (const pattern of nutrientPatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1].trim();
        const amount = match[2].trim();
        const dailyValue = match[3] ? `${match[3]}%` : undefined;

        // Skip if it's a header or label
        if (name.toLowerCase().includes('amount per') || 
            name.toLowerCase().includes('% daily value')) {
          continue;
        }

        nutrients.push({ name, amount, dailyValue });
        break;
      }
    }
  }

  return { servingSize, calories, nutrients };
};

/**
 * Format nutrition info for LLM analysis
 * Converts nutrition data into a format the LLM can analyze as ingredients
 */
export const formatNutritionForAnalysis = (nutritionInfo: {
  servingSize?: string;
  calories?: string;
  nutrients: Array<{ name: string; amount: string; dailyValue?: string }>;
}): string => {
  // For LLM analysis, we need to present this as analyzable content
  // Not just raw nutrition data
  
  let formatted = 'Product Nutrition Analysis Request:\n\n';
  
  if (nutritionInfo.servingSize) {
    formatted += `Serving Size: ${nutritionInfo.servingSize}\n`;
  }
  
  if (nutritionInfo.calories) {
    formatted += `Calories: ${nutritionInfo.calories} per serving\n`;
  }
  
  if (nutritionInfo.nutrients.length > 0) {
    formatted += '\nNutritional Content:\n';
    nutritionInfo.nutrients.forEach(nutrient => {
      formatted += `${nutrient.name}: ${nutrient.amount}`;
      if (nutrient.dailyValue) {
        formatted += ` (${nutrient.dailyValue} of daily value)`;
      }
      formatted += '\n';
    });
    
    // Add instruction for LLM
    formatted += '\n[Note: This is a nutrition facts table. Analyze the nutritional content for health implications, ';
    formatted += 'high sodium/sugar/fat concerns, and provide health advice based on these values. ';
    formatted += 'Treat each nutrient as an analyzable component.]';
  }
  
  return formatted;
};

/**
 * Extract and clean ingredient text from OCR output
 * Now handles both ingredient lists and nutrition tables
 */
export const extractIngredientsFromText = (ocrText: string): string => {
  if (!ocrText || ocrText.trim().length === 0) {
    return '';
  }

  // Check if this is primarily a nutrition table
  if (isNutritionTable(ocrText)) {
    console.log('Detected nutrition facts table');
    const nutritionInfo = extractNutritionInfo(ocrText);
    return formatNutritionForAnalysis(nutritionInfo);
  }

  // Otherwise, extract ingredients as before
  console.log('Detected ingredient list');
  
  // Convert to lowercase for processing
  const text = ocrText.toLowerCase();
  
  // Common ingredient section markers
  const ingredientMarkers = [
    'ingredients:',
    'ingredients ',
    'ingredient list:',
    'ingredient list ',
    'contains:',
    'made with:',
    'composition:',
    'ingrédients:', // French
    'ingredientes:', // Spanish
    'zutaten:', // German
  ];

  // Find ingredient section
  let ingredientStart = -1;
  let usedMarker = '';
  
  for (const marker of ingredientMarkers) {
    const index = text.indexOf(marker);
    if (index !== -1 && (ingredientStart === -1 || index < ingredientStart)) {
      ingredientStart = index + marker.length;
      usedMarker = marker;
    }
  }

  // If no marker found, try to detect ingredient-like content
  if (ingredientStart === -1) {
    // Look for patterns that suggest ingredients
    const ingredientPatterns = [
      /\b(water|sugar|salt|flour|oil|milk|egg|wheat|corn|soy|rice)\b.*[,;]/i,
      /\b\w+\s+(acid|extract|powder|syrup|starch|protein)\b/i,
      /\b(natural|artificial)\s+\w+/i,
    ];

    for (const pattern of ingredientPatterns) {
      const match = text.match(pattern);
      if (match) {
        ingredientStart = match.index || 0;
        break;
      }
    }
  }

  // Extract text from ingredient start
  let ingredientText = ingredientStart !== -1 
    ? ocrText.substring(ingredientStart).trim()
    : ocrText;

  // Remove common non-ingredient sections
  const stopPhrases = [
    'nutrition facts',
    'nutritional information',
    'serving size',
    'servings per',
    'amount per serving',
    'calories',
    'total fat',
    'saturated fat',
    'trans fat',
    'cholesterol',
    'sodium',
    'total carb',
    'dietary fiber',
    'total sugars',
    'added sugars',
    'protein',
    'vitamin',
    'calcium',
    'iron',
    'potassium',
    '% daily value',
    'daily value',
    'manufactured by',
    'distributed by',
    'best before',
    'expiry date',
    'use by',
    'storage',
    'keep refrigerated',
    'allergen',
    'allergy',
    'warning',
    'caution',
    'net weight',
    'net wt',
    'product of',
    'made in',
    'upc',
    'barcode',
    'lot',
    'batch',
  ];

  // Split into lines and filter
  const lines = ingredientText.split('\n');
  const cleanLines = [];

  for (let line of lines) {
    line = line.trim();
    
    // Skip empty lines
    if (line.length === 0) continue;
    
    // Skip lines that are clearly not ingredients
    const lowerLine = line.toLowerCase();
    
    // Skip if contains stop phrases
    const hasStopPhrase = stopPhrases.some(phrase => lowerLine.includes(phrase));
    if (hasStopPhrase) continue;
    
    // Skip nutrition facts numbers
    if (/^\d+\s*(g|mg|mcg|iu|%)\s*$/.test(line)) continue;
    if (/^\d+\s*calories?\s*$/i.test(line)) continue;
    if (/^\d+\/\d+\s*cup/.test(line)) continue;
    
    // Skip single letters or very short words (likely OCR errors)
    if (line.length < 3) continue;
    
    // Skip lines that are mostly numbers
    if (/^\d+[\d\s%.,]*$/.test(line)) continue;
    
    // Skip lines with excessive punctuation (likely formatting artifacts)
    if ((line.match(/[^\w\s]/g) || []).length > line.length * 0.3) continue;
    
    cleanLines.push(line);
  }

  // Join cleaned lines
  let result = cleanLines.join(' ').trim();
  
  // Additional cleaning
  result = result
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove standalone numbers at the beginning
    .replace(/^\d+\s+/, '')
    // Remove percentage signs that aren't part of ingredients
    .replace(/\s+\d+%\s*/g, ' ')
    // Remove common OCR artifacts
    .replace(/[|\\]/g, '')
    // Clean up punctuation
    .replace(/[,;]\s*[,;]/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*;\s*/g, '; ')
    // Remove trailing punctuation
    .replace(/[,;]\s*$/, '')
    .trim();

  return result;
};

/**
 * Parse ingredient text into individual ingredients (for display/fallback)
 */
export const parseIngredients = (text: string): string[] => {
  const cleaned = extractIngredientsFromText(text);
  
  if (!cleaned) return [];

  return cleaned
    .split(/[,;•·]/)
    .map((i) => i.trim())
    .filter((i) => {
      // Filter out non-ingredient items
      if (i.length < 2 || i.length > 100) return false;
      
      // Skip items that are clearly not ingredients
      const lower = i.toLowerCase();
      if (lower.match(/^\d+[\d\s%]*$/)) return false;
      if (lower.includes('serving')) return false;
      if (lower.includes('calorie')) return false;
      if (lower.includes('daily value')) return false;
      
      return true;
    })
    .slice(0, 50); // Limit to reasonable number
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

  // Clean the ingredient text before analysis
  const cleanedIngredients = extractIngredientsFromText(scanData.ingredientText);
  console.log('Original ingredient text:', scanData.ingredientText.substring(0, 100) + '...');
  console.log('Cleaned ingredient text:', cleanedIngredients.substring(0, 100) + '...');

  try {
    // Use LLM for analysis with cleaned ingredients
    const llmAnalysis = await analyzeIngredientsWithLLM(
      productName,
      productCategory,
      cleanedIngredients || scanData.ingredientText, // Fallback to original if cleaning fails
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
      rawIngredientText: cleanedIngredients || scanData.ingredientText,
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


/**
 * Determine health rating for a nutrient based on amount and daily value
 */
function determineNutrientRating(nutrient: { name: string; amount: string; dailyValue?: string }): 'safe' | 'caution' | 'warning' | 'danger' {
  const name = nutrient.name.toLowerCase();
  const dailyValue = nutrient.dailyValue ? parseInt(nutrient.dailyValue) : 0;
  
  // Nutrients we want to limit
  const limitNutrients = ['sodium', 'sugar', 'saturated fat', 'trans fat', 'cholesterol'];
  const isLimitNutrient = limitNutrients.some(n => name.includes(n));
  
  if (isLimitNutrient) {
    if (dailyValue > 40) return 'danger';
    if (dailyValue > 25) return 'warning';
    if (dailyValue > 15) return 'caution';
  }
  
  return 'safe';
}

/**
 * Get health concerns for a nutrient
 */
function getNutrientConcerns(nutrient: { name: string; amount: string; dailyValue?: string }): string[] {
  const name = nutrient.name.toLowerCase();
  const dailyValue = nutrient.dailyValue ? parseInt(nutrient.dailyValue) : 0;
  const concerns: string[] = [];
  
  if (name.includes('sodium') && dailyValue > 20) {
    concerns.push('High sodium content may affect blood pressure');
  }
  
  if (name.includes('sugar') && dailyValue > 20) {
    concerns.push('High sugar content');
  }
  
  if (name.includes('saturated fat') && dailyValue > 20) {
    concerns.push('High saturated fat may impact heart health');
  }
  
  if (name.includes('trans fat')) {
    concerns.push('Trans fats should be avoided');
  }
  
  if (name.includes('cholesterol') && dailyValue > 20) {
    concerns.push('High cholesterol content');
  }
  
  return concerns;
}
