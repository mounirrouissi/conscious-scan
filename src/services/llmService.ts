/**
 * LLM Service for Ingredient Analysis
 * Uses Cloudflare Worker to securely analyze product ingredients
 */

import { UserProfile } from '../types';

/**
 * Types for LLM response
 */
export interface LLMIngredient {
  name: string;
  category: string;
  description: string;
  healthRating: 'safe' | 'caution' | 'warning' | 'danger';
  concerns: string[];
  benefits: string[];
  isVegan: boolean;
  isNatural: boolean;
  tags?: string[];
}

export interface LLMIssue {
  ingredient: string;
  tags: string[];
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  explanation: string;
  advice: string;
}

export interface LLMAnalysisResponse {
  product: {
    name: string;
    category: string;
  };
  ingredients: LLMIngredient[];
  issues: LLMIssue[];
  overall_rating: number;
  letter_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score_breakdown: {
    allergy_risk: number;
    toxicological_concerns: number;
    nutrition_or_usage: number;
    user_priority_alignment: number;
  };
  personalized_warnings: string[];
  personalized_advice: string[];
  summary: {
    main_takeaway: string;
    recommended_next_steps: string[];
  };
  confidence: number;
  disclaimer: string;
}

/**
 * Call the unified Cloudflare Worker to analyze ingredients
 */
export async function analyzeIngredientsWithLLM(
  productName: string,
  productCategory: string,
  rawIngredients: string,
  userProfile?: UserProfile,
  country?: string
): Promise<LLMAnalysisResponse> {
  const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://purepick-api-proxy.mounirrouissi2.workers.dev';

  try {
    console.log('Starting LLM analysis with worker URL:', WORKER_URL);
    console.log('Request payload:', {
      route: 'analysis',
      productName,
      productCategory,
      rawIngredients: rawIngredients.substring(0, 100) + '...', // Log first 100 chars
      userProfile,
      country,
    });

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'analysis',
        productName,
        productCategory,
        rawIngredients,
        userProfile,
        country,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('LLM Response status:', response.status);
    console.log('LLM Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error response text:', errorText);
      throw new Error(`Worker API error: ${response.status} - ${errorText}`);
    }

    // Get response as text first to check if it's valid JSON
    const responseText = await response.text();
    console.log('LLM Response text length:', responseText.length);
    console.log('LLM Response first 200 chars:', responseText.substring(0, 200));
    console.log('LLM Response last 200 chars:', responseText.substring(Math.max(0, responseText.length - 200)));

    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from worker');
    }

    let analysis: LLMAnalysisResponse;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text that failed to parse:', responseText);

      // Improved JSON salvaging logic
      let fixedJson = responseText.trim();

      // Remove any trailing junk or incomplete properties
      fixedJson = fixedJson.replace(/,\s*"[^"]*":?\s*$/, ''); // Remove incomplete "key":
      fixedJson = fixedJson.replace(/,\s*$/, '');            // Remove trailing comma

      // Close open structures
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;

      for (let i = 0; i < (openBrackets - closeBrackets); i++) {
        fixedJson += ']';
      }
      for (let i = 0; i < (openBraces - closeBraces); i++) {
        fixedJson += '}';
      }

      try {
        console.log('Attempting to parse fixed JSON (len: ' + fixedJson.length + ')');
        analysis = JSON.parse(fixedJson);
        console.log('Successfully parsed fixed JSON');
      } catch (secondParseError: any) {
        console.error('Failed to parse fixed JSON:', secondParseError);
        throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    }

    console.log('LLM Analysis successful, response keys:', Object.keys(analysis));

    // Ensure all required fields are present with defaults
    const completeAnalysis: LLMAnalysisResponse = {
      product: {
        name: analysis.product?.name || productName,
        category: analysis.product?.category || productCategory,
      },
      ingredients: analysis.ingredients || [],
      issues: analysis.issues || [],
      overall_rating: analysis.overall_rating || 50,
      letter_grade: analysis.letter_grade || 'C',
      score_breakdown: analysis.score_breakdown || {
        allergy_risk: 50,
        toxicological_concerns: 50,
        nutrition_or_usage: 50,
        user_priority_alignment: 50,
      },
      personalized_warnings: analysis.personalized_warnings || [],
      personalized_advice: analysis.personalized_advice || ['Analysis incomplete - please try scanning again'],
      summary: analysis.summary || {
        main_takeaway: 'Analysis was incomplete',
        recommended_next_steps: ['Try scanning again with better lighting'],
      },
      confidence: analysis.confidence || 0.5,
      disclaimer: analysis.disclaimer || 'This analysis was incomplete due to processing limitations.',
    };

    return completeAnalysis;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('LLM request timed out after 30 seconds');
      throw new Error('Analysis timed out - please try again');
    }
    console.error('Cloudflare Worker Analysis Error:', error);
    throw error;
  }
}
