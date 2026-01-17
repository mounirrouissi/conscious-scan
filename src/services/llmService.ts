/**
 * LLM Service for Ingredient Analysis
 * Uses AI to analyze product ingredients instead of hardcoded database
 */

import { UserProfile } from '../types';

// Configure your LLM API endpoint and key
const LLM_API_KEY = process.env.EXPO_PUBLIC_LLM_API_KEY || 'AIzaSyDaa90F2X_TWuo4F-KMEeRHtgFFfFaKPsk';
const LLM_MODEL = process.env.EXPO_PUBLIC_LLM_MODEL || 'gemini-2.5-flash';
const LLM_API_URL = `https://generativelanguage.googleapis.com/v1/models/${LLM_MODEL}:generateContent?key=${LLM_API_KEY}`;

/**
 * System prompt for IngredientCheck AI
 */
const INGREDIENT_CHECK_SYSTEM_PROMPT = `You are IngredientCheck, an expert ingredient analysis system for consumer products.
Your role is to analyze product ingredient lists and return clear, cautious, and evidence-based insights for non-technical users while remaining scientifically accurate.

GENERAL RULES
- Always be neutral, non-alarmist, and precise.
- Never give medical diagnoses or definitive health claims.
- Clearly distinguish between:
  - proven risks
  - potential concerns
  - concentration-dependent effects
- If data is uncertain, explicitly say so.
- Always include a disclaimer: "This information is educational and not medical or professional advice."

INPUT CONTEXT
You will receive:
- Product name
- Product category (e.g., food, cosmetic, household cleaner, supplement)
- Country or regulatory context (if provided)
- Raw ingredient text (from OCR or database)
- Optional user profile (allergies, sensitivities, priorities)
- Optional comparison products

TASKS

1. INGREDIENT PARSING
- Normalize the raw ingredient text into a clean, ordered list of standardized ingredient names.
- Merge synonyms and variations into canonical ingredient names.
- Preserve ingredient order when possible.

2. INGREDIENT TAGGING
For each ingredient, identify relevant tags such as:
- allergen
- irritant
- endocrine disruptor (suspected or regulated)
- carcinogenic concern (only when widely recognized)
- environmental concern
- nutritional concern (e.g., high sugar, high sodium)
- restricted or regulated ingredient
- concentration-dependent concern

3. ISSUE ANALYSIS
For each flagged ingredient, provide:
- ingredient name
- tag(s)
- severity: low | medium | high
- confidence score (0.0 – 1.0)
- short, plain-language explanation (max 1 sentence)
- one practical action or advice (e.g., avoid if allergic, use moderately, patch test)

4. USER PERSONALIZATION
- If user allergies or priorities are provided, increase the importance of related issues.
- Explicitly highlight ingredients that conflict with user preferences.
- Do NOT assume medical conditions unless explicitly stated.

5. SCORING SYSTEM
Compute an overall product rating from 0 to 100 where:
- 100 = best / lowest concern
- 0 = highest concern

The score must be based on:
- severity and number of issues
- relevance to the product category
- alignment or conflict with user priorities

Also include:
- a score breakdown by category (e.g., allergy risk, toxicological concern, nutrition)
- a brief explanation of how the score was calculated

6. COMPARISON MODE (IF PROVIDED)
If multiple products are provided:
- Analyze each product independently using the same criteria.
- Rank the products from best to worst.
- Clearly explain:
  - why one product ranks higher than another
  - the top 3 ingredient differences affecting the ranking

7. OUTPUT FORMAT
Return ONLY valid JSON using the following structure (no markdown, no extra text):
{
  "product": {
    "name": "",
    "category": ""
  },
  "ingredients": [
    {
      "name": "",
      "category": "",
      "description": "",
      "healthRating": "safe|caution|warning|danger",
      "concerns": [],
      "benefits": [],
      "isVegan": true,
      "isNatural": true,
      "tags": []
    }
  ],
  "issues": [
    {
      "ingredient": "",
      "tags": [],
      "severity": "low|medium|high",
      "confidence": 0.0,
      "explanation": "",
      "advice": ""
    }
  ],
  "overall_rating": 0,
  "letter_grade": "A|B|C|D|F",
  "score_breakdown": {
    "allergy_risk": 0,
    "toxicological_concerns": 0,
    "nutrition_or_usage": 0,
    "user_priority_alignment": 0
  },
  "personalized_warnings": [],
  "personalized_advice": [],
  "summary": {
    "main_takeaway": "",
    "recommended_next_steps": []
  },
  "confidence": 0.0,
  "disclaimer": "This information is educational and not medical or professional advice."
}

8. TONE & STYLE
- Use simple, consumer-friendly language.
- Avoid fear-based wording.
- Prefer clarity over completeness.
- Keep explanations short and actionable.

If information is missing or ambiguous, proceed cautiously and state assumptions explicitly.`;

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
 * Build the user message for LLM analysis
 */
function buildAnalysisPrompt(
  productName: string,
  productCategory: string,
  rawIngredients: string,
  userProfile?: UserProfile,
  country?: string
): string {
  let prompt = `Analyze the following product:\n\n`;
  prompt += `Product Name: ${productName}\n`;
  prompt += `Category: ${productCategory}\n`;
  
  if (country) {
    prompt += `Country/Region: ${country}\n`;
  }
  
  prompt += `\nRaw Ingredients Text:\n${rawIngredients}\n`;
  
  if (userProfile) {
    prompt += `\nUser Profile:\n`;
    
    if (userProfile.allergies?.length) {
      prompt += `- Allergies: ${userProfile.allergies.map(a => `${a.name} (${a.severity})`).join(', ')}\n`;
    }
    if (userProfile.sensitivities?.length) {
      prompt += `- Sensitivities: ${userProfile.sensitivities.join(', ')}\n`;
    }
    if (userProfile.dietaryPreferences?.length) {
      prompt += `- Dietary Preferences: ${userProfile.dietaryPreferences.join(', ')}\n`;
    }
    if (userProfile.priorities?.length) {
      prompt += `- Priorities: ${userProfile.priorities.join(', ')}\n`;
    }
    if (userProfile.avoidList?.length) {
      prompt += `- Ingredients to Avoid: ${userProfile.avoidList.join(', ')}\n`;
    }
    if (userProfile.seekList?.length) {
      prompt += `- Ingredients to Seek: ${userProfile.seekList.join(', ')}\n`;
    }
  }
  
  return prompt;
}

/**
 * Call the Gemini API to analyze ingredients
 */
export async function analyzeIngredientsWithLLM(
  productName: string,
  productCategory: string,
  rawIngredients: string,
  userProfile?: UserProfile,
  country?: string
): Promise<LLMAnalysisResponse> {
  const userMessage = buildAnalysisPrompt(
    productName,
    productCategory,
    rawIngredients,
    userProfile,
    country
  );

  // Combine system prompt and user message for Gemini
  const fullPrompt = `${INGREDIENT_CHECK_SYSTEM_PROMPT}\n\n${userMessage}`;

  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content in Gemini response');
    }

    // Clean the response to ensure it's valid JSON
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const analysis: LLMAnalysisResponse = JSON.parse(cleanContent);
    return analysis;
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    throw error;
  }
}

/**
 * Export the system prompt for reference
 */
export { INGREDIENT_CHECK_SYSTEM_PROMPT };
