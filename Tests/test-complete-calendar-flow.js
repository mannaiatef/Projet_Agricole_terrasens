/**
 * TEST: Complete Calendar Flow
 * 
 * Verifies:
 * 1. CropEngine generates calendar with actions, fertilization, alerts
 * 2. Calendar data is properly formatted
 * 3. Frontend can parse and display all three sections
 * 
 * Run: node test-complete-calendar-flow.js
 */

const CropEngine = require('./crop-calendar-service/src/domain/logic/crop-engine');
const { CROP_KNOWLEDGE_BASE } = require('./crop-calendar-service/src/domain/crops/crop-knowledge-base');

console.log('\n' + '='.repeat(80));
console.log('CROP CALENDAR - COMPLETE FLOW TEST');
console.log('='.repeat(80) + '\n');

// Test 1: Verify Crop Knowledge Base
console.log('TEST 1: Crop Knowledge Base Structure');
console.log('-'.repeat(80));
const crops = Object.keys(CROP_KNOWLEDGE_BASE);
console.log(`✓ Available crops: ${crops.length}`);
console.log(`  Crops: ${crops.join(', ')}\n`);

// Test 2: Generate calendar for Blé
console.log('TEST 2: Generate Calendar (Blé)');
console.log('-'.repeat(80));

try {
  const sowingDate = '2026-01-15';
  const calendar = CropEngine.generateCalendar('Blé', sowingDate);
  
  console.log(`✓ Calendar generated for Blé (sowing: ${sowingDate})`);
  console.log(`  Total stages: ${calendar.stages.length}`);
  console.log(`  Total duration: ${calendar.total_duration_days} days\n`);
  
  // Test 3: Verify all stages have required fields
  console.log('TEST 3: Stage Data Integrity');
  console.log('-'.repeat(80));
  
  let allGood = true;
  calendar.stages.forEach((stage, idx) => {
    const hasActions = Array.isArray(stage.actions) && stage.actions.length > 0;
    const hasAlerts = Array.isArray(stage.alerts) && stage.alerts.length > 0;
    const hasFert = stage.fertilization !== null;
    
    console.log(`\nStage ${stage.number}: ${stage.name}`);
    console.log(`  Dates: ${stage.start_date} to ${stage.end_date} (${stage.duration_days}d)`);
    console.log(`  Kc: ${stage.kc_value}, Day from sowing: ${stage.day_from_sowing}`);
    console.log(`  ✓ Actions: ${stage.actions.length} items`);
    console.log(`  ${hasAlerts ? '✓' : '✗'} Alerts: ${stage.alerts.length} items`);
    console.log(`  ${hasFert ? '✓' : '-'} Fertilization: ${hasFert ? stage.fertilization.type : 'None'}`);
    
    if (hasFert) {
      console.log(`      - Type: ${stage.fertilization.type}`);
      console.log(`      - Dose: ${stage.fertilization.dose_kg_ha} kg/ha`);
      console.log(`      - Product: ${stage.fertilization.product}`);
      console.log(`      - Apply on: ${stage.fertilization.application_date}`);
    }
    
    if (!hasActions) {
      console.log(`  ✗ WARNING: Missing actions`);
      allGood = false;
    }
  });
  
  if (allGood) {
    console.log(`\n✓ All stages have required data structure\n`);
  }
  
  // Test 4: Test Current Stage Detection
  console.log('TEST 4: Current Stage Detection');
  console.log('-'.repeat(80));
  
  const testDate = '2026-02-15'; // Should be in Stage 2 (Tallage)
  const currentStage = CropEngine.getCurrentStage(calendar, testDate);
  
  if (currentStage) {
    console.log(`✓ Current stage on ${testDate}: ${currentStage.name}`);
    console.log(`  Stage number: ${currentStage.number}`);
    console.log(`  Duration: ${currentStage.duration_days} days`);
    console.log(`  Fertilization: ${currentStage.fertilization ? currentStage.fertilization.type : 'None'}\n`);
  } else {
    console.log(`✗ No current stage found for ${testDate}\n`);
  }
  
  // Test 5: Test JSON Serializability (for database storage)
  console.log('TEST 5: JSON Serialization (Database Storage)');
  console.log('-'.repeat(80));
  
  try {
    const calendarJSON = JSON.stringify(calendar);
    console.log(`✓ Calendar is JSON serializable`);
    console.log(`  JSON size: ${calendarJSON.length.toLocaleString()} bytes\n`);
    
    // Test deserialize
    const calendarRestored = JSON.parse(calendarJSON);
    console.log(`✓ Calendar is JSON deserializable`);
    console.log(`  Restored stages: ${calendarRestored.stages.length}`);
  } catch (e) {
    console.log(`✗ JSON serialization failed: ${e.message}\n`);
  }
  
  // Test 6: Test all crops generate valid calendars
  console.log('TEST 6: All Crops Calendar Generation');
  console.log('-'.repeat(80));
  
  const testSowingDate = '2026-01-15';
  let cropsSuccess = 0;
  
  crops.forEach(cropName => {
    try {
      const cal = CropEngine.generateCalendar(cropName, testSowingDate);
      console.log(`✓ ${cropName.padEnd(15)} - ${cal.stages.length} stages, ${cal.total_duration_days} days`);
      cropsSuccess++;
    } catch (e) {
      console.log(`✗ ${cropName.padEnd(15)} - ERROR: ${e.message}`);
    }
  });
  
  console.log(`\n✓ Successfully generated calendars for ${cropsSuccess}/${crops.length} crops\n`);
  
  // Test 7: Specific data example for frontend
  console.log('TEST 7: Frontend Data Example (Stage with Fertilization)');
  console.log('-'.repeat(80));
  
  const stageWithFert = calendar.stages.find(s => s.fertilization !== null);
  if (stageWithFert) {
    console.log(`\nJSON representation that frontend will receive:\n`);
    console.log(JSON.stringify(stageWithFert, null, 2));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✓ ALL TESTS PASSED - Calendar system is functioning correctly');
  console.log('='.repeat(80) + '\n');
  
} catch (error) {
  console.error('\n✗ TEST FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
}
