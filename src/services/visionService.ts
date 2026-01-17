// Google Cloud Vision API Service for OCR
// You'll need to set up your API key in environment variables

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Replace with your actual API key or use environment variable
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || 'AIzaSyAcAOtqiy5pjn61xp36cGKTZ8FhEcGeVUw';

interface VisionResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    labelAnnotations?: Array<{
      description: string;
      score: number;
    }>;
    error?: {
      message: string;
    };
  }>;
}

// Convert image URI to base64
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

// Perform OCR on image to extract text
export const performOCR = async (imageUri: string): Promise<{
  text: string;
  confidence: number;
}> => {
  try {
    const base64Image = await imageToBase64(imageUri);

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    const response = await fetch(`${VISION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: VisionResponse = await response.json();

    if (data.responses[0]?.error) {
      throw new Error(data.responses[0].error.message);
    }

    const textAnnotations = data.responses[0]?.textAnnotations;
    if (textAnnotations && textAnnotations.length > 0) {
      return {
        text: textAnnotations[0].description,
        confidence: 0.9, // Vision API doesn't return confidence for text detection
      };
    }

    return { text: '', confidence: 0 };
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
};

// Classify product image to suggest category
export const classifyProductImage = async (imageUri: string): Promise<{
  suggestedCategory: string;
  labels: string[];
  confidence: number;
}> => {
  try {
    const base64Image = await imageToBase64(imageUri);

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10,
            },
          ],
        },
      ],
    };

    const response = await fetch(`${VISION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: VisionResponse = await response.json();

    if (data.responses[0]?.error) {
      throw new Error(data.responses[0].error.message);
    }

    const labels = data.responses[0]?.labelAnnotations || [];
    const labelDescriptions = labels.map((l) => l.description.toLowerCase());

    // Map labels to product categories
    const categoryMapping: Record<string, string[]> = {
      'Skincare': ['skin care', 'lotion', 'cream', 'moisturizer', 'serum', 'face', 'skincare'],
      'Hair Care': ['shampoo', 'conditioner', 'hair', 'hair care'],
      'Body Care': ['body', 'soap', 'wash', 'shower'],
      'Food & Beverages': ['food', 'drink', 'beverage', 'snack', 'cereal', 'juice'],
      'Household Cleaning': ['cleaning', 'detergent', 'cleaner', 'household'],
      'Baby Products': ['baby', 'infant', 'diaper'],
      'Oral Care': ['toothpaste', 'mouthwash', 'dental', 'oral'],
      'Cosmetics': ['makeup', 'cosmetic', 'lipstick', 'mascara', 'foundation'],
      'Supplements': ['vitamin', 'supplement', 'pill', 'capsule'],
      'Sunscreen': ['sunscreen', 'spf', 'sun protection'],
    };

    let suggestedCategory = 'Uncategorized';
    let highestConfidence = 0;

    for (const [category, keywords] of Object.entries(categoryMapping)) {
      for (const keyword of keywords) {
        const matchingLabel = labels.find((l) => 
          l.description.toLowerCase().includes(keyword)
        );
        if (matchingLabel && matchingLabel.score > highestConfidence) {
          suggestedCategory = category;
          highestConfidence = matchingLabel.score;
        }
      }
    }

    return {
      suggestedCategory,
      labels: labelDescriptions,
      confidence: highestConfidence,
    };
  } catch (error) {
    console.error('Classification Error:', error);
    throw error;
  }
};

// Combined function to analyze product image
export const analyzeProductImage = async (imageUri: string): Promise<{
  extractedText: string;
  suggestedCategory: string;
  labels: string[];
  confidence: number;
}> => {
  try {
    const base64Image = await imageToBase64(imageUri);

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
            {
              type: 'LABEL_DETECTION',
              maxResults: 10,
            },
          ],
        },
      ],
    };

    const response = await fetch(`${VISION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: VisionResponse = await response.json();

    if (data.responses[0]?.error) {
      throw new Error(data.responses[0].error.message);
    }

    const textAnnotations = data.responses[0]?.textAnnotations;
    const labelAnnotations = data.responses[0]?.labelAnnotations || [];

    const extractedText = textAnnotations?.[0]?.description || '';
    const labels = labelAnnotations.map((l) => l.description.toLowerCase());

    // Determine category from labels
    const categoryMapping: Record<string, string[]> = {
      'Skincare': ['skin care', 'lotion', 'cream', 'moisturizer', 'serum', 'face', 'skincare'],
      'Hair Care': ['shampoo', 'conditioner', 'hair', 'hair care'],
      'Body Care': ['body', 'soap', 'wash', 'shower'],
      'Food & Beverages': ['food', 'drink', 'beverage', 'snack', 'cereal', 'juice'],
      'Household Cleaning': ['cleaning', 'detergent', 'cleaner', 'household'],
      'Baby Products': ['baby', 'infant', 'diaper'],
      'Oral Care': ['toothpaste', 'mouthwash', 'dental', 'oral'],
      'Cosmetics': ['makeup', 'cosmetic', 'lipstick', 'mascara', 'foundation'],
      'Supplements': ['vitamin', 'supplement', 'pill', 'capsule'],
      'Sunscreen': ['sunscreen', 'spf', 'sun protection'],
    };

    let suggestedCategory = 'Uncategorized';
    let highestConfidence = 0;

    for (const [category, keywords] of Object.entries(categoryMapping)) {
      for (const keyword of keywords) {
        const matchingLabel = labelAnnotations.find((l) =>
          l.description.toLowerCase().includes(keyword)
        );
        if (matchingLabel && matchingLabel.score > highestConfidence) {
          suggestedCategory = category;
          highestConfidence = matchingLabel.score;
        }
      }
    }

    return {
      extractedText,
      suggestedCategory,
      labels,
      confidence: highestConfidence || 0.5,
    };
  } catch (error) {
    console.error('Image Analysis Error:', error);
    throw error;
  }
};
