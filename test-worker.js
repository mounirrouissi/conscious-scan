/**
 * Test script for PurePick Cloudflare Worker
 * Run with: node test-worker.js
 */

const WORKER_URL = 'https://purepick-api-proxy.mounirrouissi2.workers.dev/';

async function testWorker() {
  console.log('🧪 Testing PurePick Cloudflare Worker...\n');

  // Test 1: Basic product analysis
  console.log('Test 1: Basic Product Analysis');
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: 'Coca-Cola Classic',
        productCategory: 'Food & Beverages',
        rawIngredients: 'Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine',
        country: 'US'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success!');
      console.log(`   Overall Rating: ${data.overall_rating}/100 (${data.letter_grade})`);
      console.log(`   Ingredients Found: ${data.ingredients?.length || 0}`);
      console.log(`   Warnings: ${data.personalized_warnings?.length || 0}`);
      console.log(`   Advice: ${data.personalized_advice?.length || 0}\n`);
    } else {
      const error = await response.text();
      console.log('❌ Failed:', response.status, error, '\n');
    }
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }

  // Test 2: With user profile
  console.log('Test 2: With User Profile (Allergies)');
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: 'Dove Beauty Bar',
        productCategory: 'Body Care',
        rawIngredients: 'Sodium Lauroyl Isethionate, Stearic Acid, Lauric Acid, Sodium Tallowate, Water, Sodium Isethionate, Cocamidopropyl Betaine, Sodium Stearate, Fragrance, Sodium Chloride, Tetrasodium EDTA, Tetrasodium Etidronate',
        userProfile: {
          allergies: [
            { name: 'Fragrance', severity: 'moderate' }
          ],
          sensitivities: ['Sulfates'],
          dietaryPreferences: ['Vegan'],
          priorities: ['Pregnancy-Safe']
        },
        country: 'US'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success!');
      console.log(`   Overall Rating: ${data.overall_rating}/100 (${data.letter_grade})`);
      console.log(`   Personalized Warnings: ${data.personalized_warnings?.length || 0}`);
      if (data.personalized_warnings?.length > 0) {
        console.log(`   Warning: ${data.personalized_warnings[0]}`);
      }
      console.log(`   Confidence: ${data.confidence || 'N/A'}\n`);
    } else {
      const error = await response.text();
      console.log('❌ Failed:', response.status, error, '\n');
    }
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }

  // Test 3: Error handling (missing fields)
  console.log('Test 3: Error Handling (Missing Fields)');
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: 'Test Product'
        // Missing rawIngredients - should return 400 error
      }),
    });

    if (response.ok) {
      console.log('❌ Should have failed but succeeded');
    } else {
      const error = await response.json();
      console.log('✅ Correctly returned error:', response.status);
      console.log(`   Error message: ${error.error}\n`);
    }
  } catch (error) {
    console.log('✅ Correctly caught error:', error.message, '\n');
  }

  // Test 4: CORS preflight
  console.log('Test 4: CORS Preflight');
  try {
    const response = await fetch(WORKER_URL, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    if (response.ok) {
      console.log('✅ CORS preflight successful');
      console.log(`   Status: ${response.status}`);
      console.log(`   CORS Headers: ${response.headers.get('Access-Control-Allow-Origin')}\n`);
    } else {
      console.log('❌ CORS preflight failed:', response.status, '\n');
    }
  } catch (error) {
    console.log('❌ CORS Error:', error.message, '\n');
  }

  console.log('🎉 Worker testing complete!');
}

// Run the tests
testWorker().catch(console.error);