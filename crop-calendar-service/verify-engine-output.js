/**
 * VERIFY CROPENGINE OUTPUT
 */

const CropEngine = require('./src/domain/logic/crop-engine');

console.log('\n' + '='.repeat(80));
console.log('TESTING CROPENGINE OUTPUT');
console.log('='.repeat(80) + '\n');

// Test with Maïs (Maize) as in Calendar ID 1
const calendar = CropEngine.generateCalendar('Maïs', '2026-02-15');

console.log(`Crop: ${calendar.crop_name}`);
console.log(`Sowing: ${calendar.sowing_date}`);
console.log(`Total duration: ${calendar.total_duration_days}d`);
console.log(`Stages count: ${calendar.stages.length}\n`);

calendar.stages.forEach((stage, idx) => {
  console.log(`Stage ${stage.number}: ${stage.name}`);
  console.log(`  Duration: ${stage.duration_days}d, Kc: ${stage.kc_value}`);
  console.log(`  Dates: ${stage.start_date} to ${stage.end_date}`);
  console.log(`  Actions: ${stage.actions?.length || 0}`);
  console.log(`  Alerts: ${stage.alerts?.length || 0}`);
  console.log(`  Fertilization: ${stage.fertilization ? 'YES' : 'NO'}`);
  if (stage.fertilization) {
    console.log(`    - ${stage.fertilization.type}: ${stage.fertilization.dose_kg_ha} kg/ha`);
  }
  console.log('');
});
