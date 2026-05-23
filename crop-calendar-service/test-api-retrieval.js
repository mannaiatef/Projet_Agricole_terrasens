/**
 * TEST API RETRIEVAL
 * Verify that getCalendarByFarmId returns proper calendar with all data
 */

const mysql = require('mysql2/promise');
const CalendarService = require('./src/services/calendar.service');
const CropEngine = require('./src/domain/logic/crop-engine');
require('dotenv').config();

async function testApiRetrieval() {
  let connection;

  try {
    console.log('\n' + '='.repeat(100));
    console.log('TEST: API Calendar Retrieval with Fixed Queries');
    console.log('='.repeat(100) + '\n');

    // Get test parcelle
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [parcelles] = await connection.query('SELECT id FROM parcelles LIMIT 1');
    const parcelleId = parcelles[0].id;
    const userId = 1; // Test user ID

    console.log(`Testing with parcelle ID: ${parcelleId}\n`);

    // Create a fresh calendar for testing
    console.log('Step 1: Generate new calendar via CropEngine...');
    const calendar = CropEngine.generateCalendar('Tomate', '2026-02-15');
    console.log(`✓ Generated ${calendar.stages.length} stages for Tomate\n`);

    // Verify CropEngine output
    console.log('CropEngine Output Sample:');
    const stage1 = calendar.stages[0];
    console.log(`  Stage 1: ${stage1.name}`);
    console.log(`    - duration: ${stage1.duration_days}d`);
    console.log(`    - kc_value: ${stage1.kc_value}`);
    console.log(`    - actions: ${stage1.actions?.length || 0}`);
    console.log(`    - alerts: ${stage1.alerts?.length || 0}`);
    console.log(`    - fertilization: ${stage1.fertilization ? 'YES' : 'NO'}\n`);

    // Now test CalendarService retrieval for an existing calendar
    console.log('Step 2: Retrieve calendar via service...');

    // CalendarService is already an instance (exported as singleton)
    const service = CalendarService;

    try {
      const retrievedCalendar = await service.getCalendarByFarmId(parcelleId, userId);

      if (!retrievedCalendar) {
        console.log('⚠️  No calendar found for this parcelle. Generating new one...\n');

        // Generate new calendar via service
        try {
          const newCal = await service.generateCalendar(parcelleId, userId, 'Tomate', '2026-02-15');
          console.log(`✓ Calendar generated via service!\n`);
          
          // Now retrieve it
          const retrievedCal = await service.getCalendarByFarmId(parcelleId, userId);
          displayCalenddar(retrievedCal);
        } catch (e) {
          console.log(`Error generating calendar: ${e.message}`);
        }
      } else {
        displayCalenddar(retrievedCalendar);
      }

    } catch (error) {
      console.log(`Error in getCalendarByFarmId: ${error.message}`);
      console.log(error.stack);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function displayCalenddar(calendar) {
  console.log('\n' + '='.repeat(100));
  console.log('RETRIEVED CALENDAR');
  console.log('='.repeat(100));

  console.log(`\nCrop: ${calendar.crop_name}`);
  console.log(`Sowing: ${calendar.sowing_date}`);
  console.log(`Total duration: ${calendar.total_duration_days}d`);
  console.log(`Stages: ${calendar.stages?.length || 0}\n`);

  if (!calendar.stages || calendar.stages.length === 0) {
    console.log('ERROR: Calendar has no stages!');
    console.log(`Calendar object keys: ${Object.keys(calendar).join(', ')}`);
    return;
  }

  console.log('First 3 Stages:');
  calendar.stages.slice(0, 3).forEach((stage, idx) => {
    console.log(`\n${idx + 1}. ${stage.name}`);
    console.log(`   Number: ${stage.number}`);
    console.log(`   Dates: ${stage.start_date} to ${stage.end_date}`);
    console.log(`   Duration: ${stage.duration_days}d, Kc: ${stage.kc_value}`);
    console.log(`   Day from sowing: ${stage.day_from_sowing}`);
    
    console.log(`   📋 Actions: ${Array.isArray(stage.actions) ? stage.actions.length : 'ERROR - NOT ARRAY'}`);
    if (Array.isArray(stage.actions) && stage.actions.length > 0) {
      console.log(`      [0]: "${stage.actions[0].substring(0, 50)}..."`);
    }
    
    console.log(`   ⚠️  Alerts: ${Array.isArray(stage.alerts) ? stage.alerts.length : 'ERROR - NOT ARRAY'}`);
    if (Array.isArray(stage.alerts) && stage.alerts.length > 0) {
      console.log(`      [0]: "${stage.alerts[0].substring(0, 50)}..."`);
    }
    
    console.log(`   🌱 Fertilization: ${stage.fertilization ? 'YES - ' + stage.fertilization.type : 'NO'}`);
  });

  console.log('\n' + '='.repeat(100));
  console.log('✓ Calendar data retrieved successfully!');
  console.log('='.repeat(100) + '\n');
}

testApiRetrieval();
