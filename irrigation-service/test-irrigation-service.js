require('dotenv').config();
const IrrigationService = require('./src/services/irrigation.service');
const { initializeDatabase } = require('./src/config/db');

async function testIrrigationService() {
  try {
    console.log('🚀 Initializing database...');
    await initializeDatabase();
    
    console.log('\n📊 Testing IrrigationService.calculateIrrigation(1)...');
    const parcelId = 1;
    
    // This should trigger the full calculation and auto-save
    const recommendation = await IrrigationService.calculateIrrigation(parcelId);
    
    console.log('\n✅ Calculation completed!');
    console.log('Recommendation:', JSON.stringify(recommendation, null, 2));
    
    console.log('\n🔍 Verifying data was saved to database...');
    const history = await IrrigationService.getRecommendationHistory(parcelId, 5);
    console.log(`✅ Found ${history.length} recommendation records for parcel ${parcelId}`);
    if (history.length > 0) {
      console.log('Latest:', JSON.stringify(history[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testIrrigationService();
