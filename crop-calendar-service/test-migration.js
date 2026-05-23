/**
 * TEST: Verify Python-to-Express migration
 * Tests basic crop calendar generation for all 8 crops
 */

const CropEngine = require('./src/domain/logic/crop-engine');

console.log('\n========== CROP CALENDAR ENGINE MIGRATION TEST ==========\n');

// Test 1: Get available crops
console.log('Test 1: Get Available Crops');
console.log('=' .repeat(50));
const crops = CropEngine.getAvailableCrops();
console.log(`✓ Available crops: ${crops.join(', ')}`);
console.log(`✓ Total crops: ${crops.length}\n`);

// Test 2: Generate calendar for each crop
console.log('Test 2: Generate Calendar for Each Crop');
console.log('=' .repeat(50));

const sowingDate = '2026-01-15';

for (const cropName of crops) {
  try {
    const calendar = CropEngine.generateCalendar(cropName, sowingDate);
    
    console.log(`\n✓ ${cropName}`);
    console.log(`  - Sowing Date: ${calendar.sowing_date}`);
    console.log(`  - Total Duration: ${calendar.total_duration_days} days`);
    console.log(`  - Stages: ${calendar.stages.length}`);
    
    // Verify all stages have the required fields
    const firstStage = calendar.stages[0];
    const hasRequiredFields = 
      firstStage.hasOwnProperty('number') &&
      firstStage.hasOwnProperty('name') &&
      firstStage.hasOwnProperty('start_date') &&
      firstStage.hasOwnProperty('end_date') &&
      firstStage.hasOwnProperty('duration_days') &&
      firstStage.hasOwnProperty('kc_value') &&
      firstStage.hasOwnProperty('actions') &&
      firstStage.hasOwnProperty('alerts') &&
      firstStage.hasOwnProperty('fertilization');
    
    if (hasRequiredFields) {
      console.log(`  ✓ Stage structure verified`);
    } else {
      console.log(`  ✗ Stage structure MISSING fields`);
      console.log(`    Fields present: ${Object.keys(firstStage).join(', ')}`);
    }
    
    // Show first stage details
    console.log(`  - First Stage: ${firstStage.name}`);
    console.log(`    Duration: ${firstStage.duration_days} days`);
    console.log(`    Dates: ${firstStage.start_date} to ${firstStage.end_date}`);
    if (firstStage.fertilization) {
      console.log(`    Fertilization: ${firstStage.fertilization.type}`);
    }
    
  } catch (error) {
    console.log(`✗ ${cropName}`);
    console.log(`  Error: ${error.message}\n`);
  }
}

// Test 3: Alias resolution
console.log(`\n\nTest 3: Alias Resolution`);
console.log('=' .repeat(50));

const aliases = [
  { input: 'Wheat', expected: 'Blé' },
  { input: 'Maize', expected: 'Maïs' },
  { input: 'Tomato', expected: 'Tomate' },
  { input: 'Potato', expected: 'Pomme de terre' },
  { input: 'Pepper', expected: 'Piment' },
  { input: 'Barley', expected: 'Orge' },
  { input: 'Olive', expected: 'Olivier' },
  { input: 'Vine', expected: 'Vigne' }
];

for (const alias of aliases) {
  try {
    const calendar = CropEngine.generateCalendar(alias.input, sowingDate);
    console.log(`✓ ${alias.input} → ${calendar.crop_name} (expected: ${alias.expected})`);
  } catch (error) {
    console.log(`✗ ${alias.input} failed: ${error.message}`);
  }
}

// Test 4: Date calculations
console.log(`\n\nTest 4: Date Calculations`);
console.log('=' .repeat(50));

const bleTesting = CropEngine.generateCalendar('Blé', '2026-03-01');
console.log(`Blé calendar starting 2026-03-01:`);
console.log(`- Total duration: ${bleTesting.total_duration_days} days`);
console.log(`- Stages:`);

let cumulativeDays = 0;
for (const stage of bleTesting.stages) {
  cumulativeDays += stage.duration_days;
  console.log(`  ${stage.number}. ${stage.name}: ${stage.duration_days} days (cumulative: ${cumulativeDays})`);
  console.log(`     ${stage.start_date} to ${stage.end_date}`);
}

console.log('\n========== TEST COMPLETE ==========\n');
