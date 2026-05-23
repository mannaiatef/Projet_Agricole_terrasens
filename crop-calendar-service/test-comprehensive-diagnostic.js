/**
 * COMPREHENSIVE CALENDAR DIAGNOSTIC
 * 
 * Performs full diagnostic of calendar data flow:
 * 1. Database schema validation
 * 2. Data existence check
 * 3. Insert level detection
 * 4. API retrieval test
 * 5. Frontend data binding verification
 * 
 * Run from crop-calendar-service:
 *   node test-comprehensive-diagnostic.js
 */

const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config();

async function runDiagnostic() {
  let connection;

  try {
    console.log('\n' + '='.repeat(100));
    console.log('COMPREHENSIVE CALENDAR DIAGNOSTIC');
    console.log('='.repeat(100));

    // ============================================================================
    // STEP 1: DATABASE SCHEMA VALIDATION
    // ============================================================================
    console.log('\n📋 STEP 1: DATABASE SCHEMA VALIDATION');
    console.log('-'.repeat(100));

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'calendar_stages'
    `);

    const columnNames = columns.map(c => c.COLUMN_NAME);
    const jsonColumns = ['actions', 'alerts', 'fertilization'];
    
    console.log(`✓ calendar_stages has ${columnNames.length} columns`);
    jsonColumns.forEach(col => {
      const exists = columnNames.includes(col);
      console.log(`  ${exists ? '✓' : '✗'} ${col.padEnd(20)} ${exists ? 'EXISTS' : 'MISSING'}`);
    });

    const missingJsonColumns = jsonColumns.filter(col => !columnNames.includes(col));

    if (missingJsonColumns.length > 0) {
      console.log(`\n⚠️  CRITICAL: Missing JSON columns: ${missingJsonColumns.join(', ')}`);
      console.log('This would cause INSERT to fall back to LEVEL 2 or 3, skipping JSON data');
    }

    // ============================================================================
    // STEP 2: DATA EXISTENCE CHECK
    // ============================================================================
    console.log('\n📊 STEP 2: DATA EXISTENCE CHECK');
    console.log('-'.repeat(100));

    const [calendars] = await connection.query('SELECT COUNT(*) as count FROM calendars');
    const [stagesCount] = await connection.query(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN actions IS NOT NULL THEN 1 ELSE 0 END) as withActions,
             SUM(CASE WHEN alerts IS NOT NULL THEN 1 ELSE 0 END) as withAlerts,
             SUM(CASE WHEN fertilization IS NOT NULL THEN 1 ELSE 0 END) as withFert
      FROM calendar_stages
    `);

    console.log(`\n✓ Total calendars: ${calendars[0].count}`);
    if (calendars[0].count > 0) {
      console.log(`✓ Total calendar_stages: ${stagesCount[0].total}`);
      console.log(`  - With actions: ${stagesCount[0].withActions || 0}`);
      console.log(`  - With alerts: ${stagesCount[0].withAlerts || 0}`);
      console.log(`  - With fertilization: ${stagesCount[0].withFert || 0}`);

      // Check insertion level
      const totalStages = stagesCount[0].total;
      const filledStages = (stagesCount[0].withActions || 0) + (stagesCount[0].withAlerts || 0) + (stagesCount[0].withFert || 0);

      if (filledStages === 0) {
        console.log(`\n⚠️  INSERT FALLBACK DETECTED: Using LEVEL 2 or 3 (no JSON columns populated)`);
      } else if (filledStages === totalStages * 3) {
        console.log(`\n✓ INSERT LEVEL 1 CONFIRMED: All JSON columns populated`);
      } else {
        console.log(`\n⚠️  PARTIAL DATA: ${filledStages}/${totalStages * 3} JSON columns filled`);
      }
    } else {
      console.log('⚠️  No calendars in database - need to generate');
    }

    // ============================================================================
    // STEP 3: SAMPLE DATA INSPECTION
    // ============================================================================
    console.log('\n🔍 STEP 3: SAMPLE DATA INSPECTION');
    console.log('-'.repeat(100));

    const [sampleStages] = await connection.query(`
      SELECT 
        stage_id,
        stage_name,
        start_date,
        end_date,
        actions,
        alerts,
        fertilization
      FROM calendar_stages
      LIMIT 3
    `);

    if (sampleStages.length === 0) {
      console.log('⚠️  No calendar_stages found');
    } else {
      sampleStages.forEach((stage, idx) => {
        console.log(`\nStage ${idx + 1}: ${stage.stage_name}`);
        console.log(`  Dates: ${stage.start_date} - ${stage.end_date}`);
        
        // Parse and display actions
        try {
          const actions = typeof stage.actions === 'string' ? JSON.parse(stage.actions) : stage.actions;
          if (Array.isArray(actions) && actions.length > 0) {
            console.log(`  ✓ Actions (${actions.length}): ${actions[0].substring(0, 50)}...`);
          } else {
            console.log(`  ✗ Actions: Empty or null`);
          }
        } catch (e) {
          console.log(`  ✗ Actions: Parse Error - ${e.message}`);
        }

        // Parse and display alerts
        try {
          const alerts = typeof stage.alerts === 'string' ? JSON.parse(stage.alerts) : stage.alerts;
          if (Array.isArray(alerts) && alerts.length > 0) {
            console.log(`  ✓ Alerts (${alerts.length}): ${alerts[0].substring(0, 50)}...`);
          } else {
            console.log(`  ✗ Alerts: Empty or null`);
          }
        } catch (e) {
          console.log(`  ✗ Alerts: Parse Error - ${e.message}`);
        }

        // Parse and display fertilization
        try {
          const fert = typeof stage.fertilization === 'string' ? JSON.parse(stage.fertilization) : stage.fertilization;
          if (fert && typeof fert === 'object') {
            console.log(`  ✓ Fertilization: ${fert.type || 'Unknown'}`);
          } else {
            console.log(`  ✗ Fertilization: Empty or null`);
          }
        } catch (e) {
          console.log(`  ✗ Fertilization: Parse Error - ${e.message}`);
        }
      });
    }

    // ============================================================================
    // STEP 4: API RETRIEVAL TEST
    // ============================================================================
    console.log('\n🌐 STEP 4: API RETRIEVAL TEST');
    console.log('-'.repeat(100));

    try {
      // First get a farm ID or parcel ID
      const [farms] = await connection.query('SELECT id FROM farms LIMIT 1');
      
      if (farms.length > 0) {
        const farmId = farms[0].id;
        console.log(`\nTesting API with farm ID: ${farmId}`);

        try {
          const response = await axios.get(`http://localhost:3000/api/calendars/farm/${farmId}`, {
            timeout: 5000
          });

          console.log(`✓ API Response Status: ${response.status}`);
          console.log(`✓ Calendar count in response: ${response.data.length}`);

          if (response.data.length > 0) {
            const calendar = response.data[0];
            console.log(`\nFirst Calendar:`);
            console.log(`  Crop: ${calendar.crop_name}`);
            console.log(`  Stages count: ${calendar.stages ? calendar.stages.length : 0}`);

            if (calendar.stages && calendar.stages.length > 0) {
              const stage = calendar.stages[0];
              console.log(`\n  First Stage: ${stage.name}`);
              console.log(`    Actions: ${stage.actions ? stage.actions.length : 0} items`);
              console.log(`    Alerts: ${stage.alerts ? stage.alerts.length : 0} items`);
              console.log(`    Fertilization: ${stage.fertilization ? 'YES' : 'NO'}`);

              if (stage.actions && stage.actions.length > 0) {
                console.log(`    Sample Action: ${stage.actions[0].substring(0, 50)}...`);
              }
            } else {
              console.log('⚠️  Calendar has no stages');
            }
          }
        } catch (apiError) {
          console.log(`✗ API Error: ${apiError.message}`);
          if (apiError.response) {
            console.log(`  Status: ${apiError.response.status}`);
            console.log(`  Data: ${JSON.stringify(apiError.response.data).substring(0, 100)}`);
          }
        }
      } else {
        console.log('⚠️  No farms found in database');
      }
    } catch (error) {
      console.log(`✗ Error querying farms: ${error.message}`);
    }

    // ============================================================================
    // STEP 5: RECOMMENDATIONS
    // ============================================================================
    console.log('\n💡 STEP 5: RECOMMENDATIONS');
    console.log('-'.repeat(100));

    if (missingJsonColumns.length > 0) {
      console.log('\n1. ADD MISSING COLUMNS:');
      console.log('   Execute in MySQL:');
      missingJsonColumns.forEach(col => {
        console.log(`     ALTER TABLE calendar_stages ADD COLUMN ${col} JSON NULL;`);
      });
      console.log('\n   Then regenerate calendars to populate JSON columns');
    }

    if (stagesCount[0].total === 0) {
      console.log('\n2. GENERATE CALENDARS:');
      console.log('   Run from API:');
      console.log('     POST http://localhost:3000/api/calendars/farm/{farmId}');
      console.log('   Or via backend: CalendarService.generateCalendar(crop, parcelleId)');
    }

    if (stagesCount[0].withActions === 0 && stagesCount[0].total > 0) {
      console.log('\n3. VERIFY CROP ENGINE:');
      console.log('   - Check CropEngine.generateCalendar() output');
      console.log('   - Verify actions/alerts/fertilization are populated in stages');
      console.log('   - Run test-calendar-generation.js to validate engine');
    }

    console.log('\n' + '='.repeat(100));
    console.log('DIAGNOSTIC COMPLETE');
    console.log('='.repeat(100) + '\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runDiagnostic();
