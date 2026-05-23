const CropEngine = require('./src/domain/logic/crop-engine.js');

// Test critical case: Blé wheat sown 2026-01-15
const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');

console.log('\n📅 BLÉ WHEAT TEST CASE');
console.log('========================');
console.log('Crop:', calendar.crop_name);
console.log('Sowing Date:', calendar.sowing_date);
console.log('Total Duration:', calendar.total_duration_days, 'days');
console.log('\nStages:');

calendar.stages.forEach((stage, idx) => {
  console.log(`\n  Stage ${stage.number}: ${stage.name}`);
  console.log(`  Dates: ${stage.start_date} → ${stage.end_date}`);
  console.log(`  Duration: ${stage.duration_days} days`);
});

// Verify Stage 4 critical test case
const stage4 = calendar.stages.find(s => s.number === 4);
if (stage4) {
  console.log('\n✅ CRITICAL TEST VERIFICATION');
  console.log('========================');
  console.log('Stage 4 Name:', stage4.name);
  console.log('Stage 4 Start Date:', stage4.start_date);
  console.log('Stage 4 End Date:', stage4.end_date);
  
  const expectedStart = '2026-03-26';
  const expectedEnd = '2026-04-14';
  
  if (stage4.start_date === expectedStart && stage4.end_date === expectedEnd) {
    console.log('\n✓ STAGE 4 DATES MATCH EXPECTED VALUES');
    console.log('  Expected: 2026-03-26 → 2026-04-14');
    console.log('  Actual:   ' + stage4.start_date + ' → ' + stage4.end_date);
    console.log('\n✓✓✓ CRITICAL TEST PASSED ✓✓✓\n');
  } else {
    console.log('\n✗ STAGE 4 DATES DO NOT MATCH');
    console.log('  Expected: 2026-03-26 → 2026-04-14');
    console.log('  Actual:   ' + stage4.start_date + ' → ' + stage4.end_date);
  }
}
