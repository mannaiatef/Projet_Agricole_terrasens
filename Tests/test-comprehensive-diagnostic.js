/**
 * COMPREHENSIVE DIAGNOSTIC
 * 
 * This script:
 * 1. Checks database structure
 * 2. Generates a test calendar
 * 3. Saves it to database (simulates backend)
 * 4. Retrieves it the same way the API would
 * 5. Shows what frontend would receive
 * 
 * Run: node test-comprehensive-diagnostic.js
 */

const mysql = require('mysql2/promise');
const CropEngine = require('./crop-calendar-service/src/domain/logic/crop-engine');
require('dotenv').config();

async function runDiagnostic() {
  console.log('\n' + '='.repeat(90));
  console.log('COMPREHENSIVE CALENDAR SYSTEM DIAGNOSTIC');
  console.log('='.repeat(90));

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // STEP 1: Check Schema
    console.log('\n📋 STEP 1: Database Schema Verification');
    console.log('-'.repeat(90));
    
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'calendar_stages'
      AND COLUMN_NAME IN ('actions', 'alerts', 'fertilization')
    `);

    const hasActions = columns.find(c => c.COLUMN_NAME === 'actions');
    const hasAlerts = columns.find(c => c.COLUMN_NAME === 'alerts');
    const hasFertilization = columns.find(c => c.COLUMN_NAME === 'fertilization');

    console.log(`  actions column:       ${hasActions ? '✓ EXISTS (' + hasActions.COLUMN_TYPE + ')' : '✗ MISSING'}`);
    console.log(`  alerts column:        ${hasAlerts ? '✓ EXISTS (' + hasAlerts.COLUMN_TYPE + ')' : '✗ MISSING'}`);
    console.log(`  fertilization column: ${hasFertilization ? '✓ EXISTS (' + hasFertilization.COLUMN_TYPE + ')' : '✗ MISSING'}`);

    if (!hasActions || !hasAlerts || !hasFertilization) {
      console.log('\n⚠️  ISSUE FOUND: Missing JSON columns in calendar_stages table');
      console.log('\nFix by running (in MySQL):');
      if (!hasActions) console.log('  ALTER TABLE calendar_stages ADD COLUMN actions JSON;');
      if (!hasAlerts) console.log('  ALTER TABLE calendar_stages ADD COLUMN alerts JSON;');
      if (!hasFertilization) console.log('  ALTER TABLE calendar_stages ADD COLUMN fertilization JSON;');
    } else {
      console.log('\n✓ All required JSON columns exist');
    }

    // STEP 2: Generate Calendar
    console.log('\n🌱 STEP 2: Generate Calendar (In-Memory)');
    console.log('-'.repeat(90));
    
    const testCalendar = CropEngine.generateCalendar('Tomate', '2026-04-01');
    console.log(`✓ Generated calendar for Tomate (${testCalendar.stages.length} stages)`);
    console.log(`  Stage 1: ${testCalendar.stages[0].name}`);
    console.log(`    - Actions: ${testCalendar.stages[0].actions.length} items`);
    console.log(`    - Alerts: ${testCalendar.stages[0].alerts.length} items`);
    console.log(`    - Fertilization: ${testCalendar.stages[0].fertilization ? 'YES' : 'NO'}`);

    if (testCalendar.stages[0].actions.length === 0) {
      console.log('\n✗ CRITICAL: CropEngine generating empty actions');
    }

    // STEP 3: Check existing calendars
    console.log('\n📊 STEP 3: Examine Existing Calendar Data');
    console.log('-'.repeat(90));

    const [calendars] = await connection.query(`
      SELECT 
        cs.id as cal_id,
        cs.stage_id,
        cs.stage_name,
        cs.start_date,
        (cs.actions IS NOT NULL AND LENGTH(cs.actions) > 0) as has_actions_data,
        (cs.alerts IS NOT NULL AND LENGTH(cs.alerts) > 0) as has_alerts_data,
        (cs.fertilization IS NOT NULL AND LENGTH(cs.fertilization) > 0) as has_fert_data
      FROM calendar_stages cs
      LIMIT 5
    `);

    if (calendars.length === 0) {
      console.log('⚠️  No calendar data found in database');
    } else {
      console.log(`Found ${calendars.length} calendar stages:`);
      
      let withActions = 0, withAlerts = 0, withFert = 0;
      calendars.forEach((stage, idx) => {
        console.log(`\n  Stage ${idx + 1}: ${stage.stage_name}`);
        console.log(`    - Has actions data: ${stage.has_actions_data ? '✓ YES' : '✗ NO'}`);
        console.log(`    - Has alerts data:  ${stage.has_alerts_data ? '✓ YES' : '✗ NO'}`);
        console.log(`    - Has fert data:    ${stage.has_fert_data ? '✓ YES' : '✗ NO'}`);
        
        if (stage.has_actions_data) withActions++;
        if (stage.has_alerts_data) withAlerts++;
        if (stage.has_fert_data) withFert++;
      });

      console.log(`\n  Summary: ${withActions}/${calendars.length} with actions, ${withAlerts}/${calendars.length} with alerts, ${withFert}/${calendars.length} with fertilization`);
      
      if (withActions < calendars.length / 2 && calendars.length > 0) {
        console.log('\n✗ ISSUE: Most stages missing action data - likely LEVEL 2/3 fallback on insert');
      }
    }

    // STEP 4: Test Query (simulating what API does)
    console.log('\n🔍 STEP 4: Simulate API Query');
    console.log('-'.repeat(90));

    const [testQuery] = await connection.query(`
      SELECT 
        cs.id,
        cs.stage_id,
        cs.stage_name as name,
        cs.start_date,
        cs.end_date,
        cs.actions,
        cs.alerts,
        cs.fertilization
      FROM calendar_stages cs
      WHERE cs.calendar_id = (
        SELECT id FROM calendars LIMIT 1
      )
      LIMIT 1
    `);

    if (testQuery.length === 0) {
      console.log('No data to test');
    } else {
      const stage = testQuery[0];
      console.log(`\nStage: ${stage.name}`);
      console.log(`  Raw columns returned:`);
      console.log(`    - actions type: ${typeof stage.actions}`);
      console.log(`    - actions value: ${stage.actions ? '(not null)' : 'NULL'}`);
      
      try {
        if (stage.actions) {
          const parsed = typeof stage.actions === 'string' ? JSON.parse(stage.actions) : stage.actions;
          console.log(`    - actions parsed: Array with ${Array.isArray(parsed) ? parsed.length : '?'} items`);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`      First item: "${parsed[0]}"`);
          }
        }
      } catch (e) {
        console.log(`    ✗ Failed to parse actions: ${e.message}`);
      }
    }

    // STEP 5: Summary & Recommendations
    console.log('\n💡 STEP 5: Diagnosis & Next Steps');
    console.log('-'.repeat(90));

    if (!hasActions || !hasAlerts || !hasFertilization) {
      console.log('\n🔴 PRIMARY ISSUE: Missing Database Columns');
      console.log('   The calendar_stages table is missing JSON columns.');
      console.log('\n   FIX:');
      console.log('   1. Go to your database (MySQL/HeidiSQL)');
      console.log('   2. Run the ALTER TABLE statements shown above');
      console.log('   3. Restart backend: cd crop-calendar-service && npm run dev');
      console.log('   4. Regenerate calendar by re-assigning crop to farm');
    } else if (calendars.length === 0) {
      console.log('\n🟡 SECONDARY ISSUE: No Calendar Data');
      console.log('   Database schema is correct but no calendars exist.');
      console.log('\n   FIX:');
      console.log('   1. Ensure backend is running');
      console.log('   2. Go to frontend, select a farm');
      console.log('   3. Assign a crop to generate calendar');
      console.log('   4. Check backend logs for "LEVEL 1/2/3" messages');
    } else if (withActions < calendars.length / 2) {
      console.log('\n🟡 SECONDARY ISSUE: Data Saving to LEVEL 2/3 Fallback');
      console.log('   Columns exist but most inserts skipped actions/alerts/fertilization.');
      console.log('   This suggests LEVEL 1 insert is failing consistently.');
      console.log('\n   FIX:');
      console.log('   1. Check backend console for error messages during INSERT');
      console.log('   2. Delete existing calendars from database');
      console.log('   3. Restart backend and regenerate calendar');
    } else {
      console.log('\n🟢 SYSTEM APPEARS HEALTHY');
      console.log('   - Schema is correct');
      console.log('   - Data is being saved');
      console.log('   - Check frontend component bindings or network tab');
    }

    console.log('\n' + '='.repeat(90));

  } catch (error) {
    console.error('Diagnostic error:', error.message);
  } finally {
    await connection.end();
  }
}

runDiagnostic();
