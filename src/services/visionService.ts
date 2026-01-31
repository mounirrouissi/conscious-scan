// Vision Service using unified Cloudflare Worker
// Uses the same worker as LLM service with different route parameter

const WORKER_URL = 'https://purepick-api-proxy.mounirrouissi2.workers.dev';

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

// Perform OCR on image to extract text using unified worker
export const performOCR = async (imageUri: string): Promise<{
  text: string;
  confidence: number;
}> => {
  try {
    console.log('Starting OCR with worker URL:', WORKER_URL);
    const base64Image = await imageToBase64(imageUri);
    console.log('Base64 image length:', base64Image.length);

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'vision',
        image: base64Image,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Vision API error response:', errorData);
      throw new Error(`Vision API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Vision API response:', data);

    if (data.error) {
      throw new Error(data.error);
    }

    // Handle Google Vision API response format
    let extractedText = '';
    if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
      extractedText = data.responses[0].textAnnotations[0]?.description || '';
    } else if (data.text) {
      // Handle simplified format if worker processes it
      extractedText = data.text;
    }

    return {
      text: extractedText,
      confidence: data.confidence || 0.9,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
};

// Classify product image to suggest category using unified worker
export const classifyProductImage = async (imageUri: string): Promise<{
  suggestedCategory: string;
  labels: string[];
  confidence: number;
}> => {
  try {
    const base64Image = await imageToBase64(imageUri);

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'vision',
        image: base64Image,
        task: 'classify', // Optional parameter to specify classification task
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Vision API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Handle Google Vision API response format for classification
    let suggestedCategory = 'Uncategorized';
    let labels = [];
    let confidence = 0.5;

    if (data.responses && data.responses[0] && data.responses[0].labelAnnotations) {
      const labelAnnotations = data.responses[0].labelAnnotations;
      labels = labelAnnotations.map((l) => l.description.toLowerCase());

      // Map labels to product categories
      const categoryMapping = {
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
      confidence = highestConfidence;
    } else if (data.suggestedCategory) {
      // Handle simplified format if worker processes it
      suggestedCategory = data.suggestedCategory;
      labels = data.labels || [];
      confidence = data.confidence || 0.5;
    }

    return {
      suggestedCategory,
      labels,
      confidence,
    };
  } catch (error) {
    console.error('Classification Error:', error);
    throw error;
  }
};

// Combined function to analyze product image using unified worker
export const analyzeProductImage = async (imageUri: string): Promise<{
  extractedText: string;
  suggestedCategory: string;
  labels: string[];
  confidence: number;
}> => {
  try {
    const base64Image = await imageToBase64(imageUri);

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'vision',
        image: base64Image,
        task: 'analyze', // Combined OCR and classification
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Vision API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Handle Google Vision API response format for combined analysis
    let extractedText = '';
    let suggestedCategory = 'Uncategorized';
    let labels = [];
    let confidence = 0.5;

    if (data.responses && data.responses[0]) {
      const response = data.responses[0];
      
      // Extract text
      if (response.textAnnotations && response.textAnnotations[0]) {
        extractedText = response.textAnnotations[0].description;
      }

      // Extract labels and determine category
      if (response.labelAnnotations) {
        const labelAnnotations = response.labelAnnotations;
        labels = labelAnnotations.map((l) => l.description.toLowerCase());

        // Map labels to product categories
        const categoryMapping = {
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
        confidence = highestConfidence || 0.5;
      }
    } else if (data.text || data.suggestedCategory) {
      // Handle simplified format if worker processes it
      extractedText = data.text || '';
      suggestedCategory = data.suggestedCategory || 'Uncategorized';
      labels = data.labels || [];
      confidence = data.confidence || 0.5;
    }

    return {
      extractedText,
      suggestedCategory,
      labels,
      confidence,
    };
  } catch (error) {
    console.error('Image Analysis Error:', error);
    throw error;
  }
};
