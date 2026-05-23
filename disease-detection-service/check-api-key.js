const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.HUGGING_FACE_API_KEY;

async function checkApiKey() {
  console.log('🔍 Testing Hugging Face API Key Validity\n');
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  console.log('='.repeat(50));
  
  // Test 1: Get user info
  console.log('\n1️⃣ Testing User Info Endpoint...');
  try {
    const response = await axios.get('https://huggingface.co/api/whoami', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 10000
    });
    console.log('✅ API Key is valid!');
    console.log('👤 User:', response.data.name);
    console.log('🏢 Organization:', response.data.orcid);
  } catch (error) {
    console.log('❌ Invalid or expired API key');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data)}`);
    }
  }
  
  // Test 2: Check if we can list models
  console.log('\n2️⃣ Testing Model List Endpoint...');
  try {
    const response = await axios.get('https://huggingface.co/api/models?limit=5', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 10000
    });
    console.log('✅ Can list models');
    console.log(`📊 Found ${response.data.length} models in response`);
  } catch (error) {
    console.log('❌ Cannot list models');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
    }
  }
  
  // Test 3: Try a known working model endpoint
  console.log('\n3️⃣ Testing Known Working Model (dino-vitb14)...');
  try {
    // Create minimal test image
    const testImage = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11,
      0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
      0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xFF, 0xD9
    ]);
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/dino-vitb14',
      testImage,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'image/jpeg'
        },
        timeout: 30000
      }
    );
    console.log('✅ API endpoint is working!');
    console.log('Response type:', typeof response.data);
  } catch (error) {
    console.log('❌ API endpoint not working');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${error.response.data?.error || 'Unknown'}`);
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Recommendations:');
  console.log('1. Check if API key is expired (regenerate at hf.co/settings/tokens)');
  console.log('2. Verify model names are public and accessible');
  console.log('3. Check if API key has read-only permissions');
  console.log('4. Try a simple known model like "facebook/dino-vitb14"');
}

checkApiKey();
