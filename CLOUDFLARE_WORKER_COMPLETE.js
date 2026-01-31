// Complete Cloudflare Worker Code for PurePick
// This worker handles both Google Vision API and Gemini API calls

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const { route } = body;

      let result;
      if (route === 'vision') {
        result = await handleVision(body, env);
      } else if (route === 'analysis') {
        result = await handleAnalysis(body, env);
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid route. Use "vision" or "analysis"' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};

// ============= VISION API HANDLER =============
async function handleVision(body, env) {
  const { image } = body;
  
  if (!image) {
    throw new Error('Missing image data');
  }

  const VISION_API_KEY = env.GOOGLE_VISION_API_KEY;
  const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

  const visionPayload = {
    requests: [
      {
        image: { content: image.replace(/^data:image\/\w+;base64,/, '') },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      },
    ],
  };

  const visionResponse = await fetch(visionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visionPayload),
  });

  if (!visionResponse.ok) {
    const errorText = await visionResponse.text();
    throw new Error(`Vision API error: ${errorText}`);
  }

  const visionData = await visionResponse.json();
  const extractedText = visionData.responses?.[0]?.textAnnotations?.[0]?.description || '';

  return {
    extractedText,
    suggestedCategory: detectCategory(extractedText),
  };
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  if (lower.includes('beverage') || lower.includes('drink') || lower.includes('juice')) return 'Beverages';
  if (lower.includes('snack') || lower.includes('chip') || lower.includes('cookie')) return 'Snacks';
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese')) return 'Dairy';
  if (lower.includes('meat') || lower.includes('chicken') || lower.includes('beef')) return 'Meat & Seafood';
  return 'Food & Beverages';
}

// ============= ANALYSIS API HANDLER =============
async function handleAnalysis(body, env) {
  const { productName, rawIngredients, userProfile, productCategory, country } = body;

  if (!rawIngredients) {
    throw new Error('Missing rawIngredients');
  }

  const GEMINI_API_KEY = env.GEMINI_API_KEY;
  
  // Use gemini-1.5-flash for faster responses
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = buildAnalysisPrompt(productName, productCategory, rawIngredients, userProfile, country);

  const geminiPayload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      // Remove response_mime_type - not supported in older API versions
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    let responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean markdown code blocks
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to parse JSON
    let analysisResult;
    try {
      analysisResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText);
      
      // Try to fix common JSON issues
      analysisResult = attemptJsonFix(responseText);
    }

    return analysisResult;
  } catch (error) {
    if (error.name === 'AbortError') {
      // Timeout - return partial analysis
      return createFallbackAnalysis(productName, productCategory, 'timeout');
    }
    throw error;
  }
}

// Attempt to fix malformed JSON
function attemptJsonFix(text) {
  try {
    // Remove trailing commas
    let fixed = text.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unquoted property names (common issue)
    fixed = fixed.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Try to find the last complete object
    const lastBrace = fixed.lastIndexOf('}');
    if (lastBrace > 0) {
      fixed = fixed.substring(0, lastBrace + 1);
    }
    
    return JSON.parse(fixed);
  } catch (e) {
    console.error('Failed to fix JSON:', e);
    // Return fallback if all fixes fail
    return createFallbackAnalysis('Unknown', 'Unknown', 'parse_error');
  }
}

function buildAnalysisPrompt(productName, productCategory, ingredients, userProfile, country) {
  const allergies = userProfile?.allergies?.map(a => a.name).join(', ') || 'None';
  const sensitivities = userProfile?.sensitivities?.join(', ') || 'None';
  const dietary = userProfile?.dietaryPreferences?.join(', ') || 'None';
  const priorities = userProfile?.priorities?.join(', ') || 'None';

  const isNutritionTable = ingredients.toLowerCase().includes('nutrition') && 
                           ingredients.toLowerCase().includes('serving');

  if (isNutritionTable) {
    return `Analyze this nutrition facts table. Return ONLY valid JSON with NO markdown formatting.

Product: ${productName}
Category: ${productCategory}

${ingredients.substring(0, 800)}

User Profile:
- Allergies: ${allergies}
- Sensitivities: ${sensitivities}
- Dietary: ${dietary}
- Priorities: ${priorities}

This is a NUTRITION TABLE. Analyze nutritional values and create concerns for high sodium, sugar, saturated fat, etc.

Return EXACTLY this JSON structure (no extra text):
{
  "product": {"name": "${productName}", "category": "${productCategory}"},
  "ingredients": [
    {"name": "High Sodium", "category": "Nutrient", "healthRating": "warning", "concerns": ["Exceeds daily limit"], "benefits": [], "description": "Contains high sodium", "isNatural": false, "isVegan": true}
  ],
  "issues": [{"ingredient": "Sodium", "tags": ["high-sodium"], "severity": "medium", "confidence": 0.9, "explanation": "High sodium content", "advice": "Limit intake"}],
  "overall_rating": 60,
  "letter_grade": "C",
  "score_breakdown": {"allergy_risk": 100, "toxicological_concerns": 70, "nutrition_or_usage": 50, "user_priority_alignment": 60},
  "personalized_warnings": ["High in sodium"],
  "personalized_advice": ["Consider alternatives"],
  "summary": {"main_takeaway": "Moderate nutrition", "recommended_next_steps": ["Monitor intake"]},
  "confidence": 0.85,
  "disclaimer": "Nutritional analysis"
}`;
  } else {
    return `Analyze this product. Return ONLY valid JSON with NO markdown formatting.

Product: ${productName}
Category: ${productCategory}
Ingredients: ${ingredients.substring(0, 600)}

User Profile:
- Allergies: ${allergies}
- Sensitivities: ${sensitivities}
- Dietary: ${dietary}
- Priorities: ${priorities}

Analyze MAXIMUM 12 ingredients to avoid timeout. Return EXACTLY this JSON (no extra text):
{
  "product": {"name": "${productName}", "category": "${productCategory}"},
  "ingredients": [
    {"name": "Sugar", "category": "Sweetener", "healthRating": "caution", "concerns": ["High glycemic"], "benefits": [], "description": "Common sweetener", "isNatural": true, "isVegan": true}
  ],
  "issues": [],
  "overall_rating": 75,
  "letter_grade": "B",
  "score_breakdown": {"allergy_risk": 80, "toxicological_concerns": 70, "nutrition_or_usage": 75, "user_priority_alignment": 75},
  "personalized_warnings": [],
  "personalized_advice": ["Advice here"],
  "summary": {"main_takeaway": "Summary", "recommended_next_steps": ["Steps"]},
  "confidence": 0.85,
  "disclaimer": "AI analysis"
}`;
  }
}

function createFallbackAnalysis(productName, productCategory, reason) {
  return {
    product: { name: productName, category: productCategory },
    ingredients: [],
    issues: [],
    overall_rating: 50,
    letter_grade: 'C',
    score_breakdown: {
      allergy_risk: 50,
      toxicological_concerns: 50,
      nutrition_or_usage: 50,
      user_priority_alignment: 50,
    },
    personalized_warnings: [],
    personalized_advice: [`Analysis incomplete due to ${reason}`, 'Please rescan the product'],
    summary: {
      main_takeaway: `Analysis incomplete due to ${reason}`,
      recommended_next_steps: ['Rescan the product', 'Check ingredient list manually'],
    },
    confidence: 0.3,
    disclaimer: `Partial analysis due to ${reason}.`,
  };
}
