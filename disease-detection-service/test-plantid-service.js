const axios = require('axios');

/**
 * Test the PlantID API service
 */
async function testPlantID() {
  console.log('🌿 Testing PlantID API (Free Plant Identification)\n');
  console.log('='.repeat(50));

  // Create a minimal test JPEG image (1x1 pixel)
  const testImageBuffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
    0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
    0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
    0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
    0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
    0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
    0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF,
    0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
    0x00, 0xFB, 0xD6, 0xFF, 0xD9
  ]);

  try {
    console.log('📤 Sending image to PlantID API...\n');
    
    const response = await axios.post(
      'https://plantid.uc.r.appspot.com/api/v2/identification',
      {
        images: [`data:image/jpeg;base64,${testImageBuffer.toString('base64')}`],
        plant_details: ['disease_details']
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );
    
    console.log('✅ PlantID API Response Received\n');
    
    const classificationData = response.data?.result?.classification;
    const suggestions = classificationData?.suggestions || [];
    
    console.log(`📊 Total Suggestions: ${suggestions.length}`);
    
    if (suggestions.length > 0) {
      console.log('\n🌿 Top 3 Plant Matches:');
      suggestions.slice(0, 3).forEach((s, i) => {
        const conf = (s.probability * 100).toFixed(1);
        console.log(`   ${i + 1}. ${s.name} - ${conf}%`);
      });
    } else {
      console.log('⚠️ No plant suggestions found (normal for generic test image)');
    }

    // Check disease data
    const diseaseData = response.data?.result?.disease;
    if (diseaseData) {
      console.log('\n🦠 Disease Suggestions:');
      const diseases = diseaseData.suggestions || [];
      if (diseases.length > 0) {
        diseases.slice(0, 2).forEach(d => {
          console.log(`   • ${d.name || 'Unknown'}`);
        });
      } else {
        console.log('   No diseases detected (normal for healthy/generic image)');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ PlantID API is WORKING and ready for integration!');
    console.log('\nℹ️ About PlantID API:');
    console.log('  • Free to use - no authentication required');
    console.log('  • Identifies 30,000+ plant species');
    console.log('  • Provides disease detection');
    console.log('  • Returns confidence scores');
    
  } catch (error) {
    console.log('❌ Error connecting to PlantID API');
    console.log(`Error: ${error.message}\n`);
    
    if (error.response?.status) {
      console.log(`Status Code: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('⚠️ Troubleshooting:');
    console.log('  1. Check internet connection');
    console.log('  2. Try again in a few seconds');
    console.log('  3. PlantID servers might be temporarily overloaded');
  }
}

testPlantID().catch(console.error);
