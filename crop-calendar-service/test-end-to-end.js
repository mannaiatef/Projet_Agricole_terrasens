/**
 * END-TO-END TEST: Calendar Generation → Database Save → API Retrieval
 * 
 * Validates the complete flow with the fixed SQL queries
 */

const mysql = require('mysql2/promise');
const { pool } = require('./src/config/db');
const CropEngine = require('./src/domain/logic/crop-engine');
require('dotenv').config();

async function endToEndTest() {
  let connection;

  try {
    console.log('\n' + '='.repeat(100));
    console.log('END-TO-END CALENDAR TEST');
    console.log('='.repeat(100));

    // Connect directly for initial setup
    const directConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Get test data
    const [parcelles] = await directConn.query('SELECT id, name FROM parcelles LIMIT 1');
    const [crops] = await directConn.query('SELECT id, name FROM crops WHERE name = ?', ['Tomate']);
    const parcelleId = parcelles[0].id;
    const cropId = crops[0].id;

    console.log(`\nTest Configuration:`);
    console.log(`  Parcelle: ${parcelles[0].name} (ID: ${parcelleId})`);
    console.log(`  Crop: ${crops[0].name} (ID: ${cropId})`);
    console.log(`  Sowing Date: 2026-02-15\n`);

    // STEP 1: Generate Calendar with CropEngine
    console.log('STEP 1: Generate Calendar with CropEngine');
    console.log('-'.repeat(100));

    const calendarData = CropEngine.generateCalendar('Tomate', '2026-02-15');
    
    console.log(`✓ Generated ${calendarData.stages.length} stages`);
    calendarData.stages.forEach(s => {
      console.log(`  ${s.number}. ${s.name} (${s.duration_days}d, Kc:${s.kc_value})`);
    });

    const firstStage = calendarData.stages[0];
    console.log(`\n✓ First Stage Detail:`);
    console.log(`  Name: "${firstStage.name}"`);
    console.log(`  Duration: ${firstStage.duration_days}d`);
    console.log(`  Kc Value: ${firstStage.kc_value}`);
    console.log(`  Actions: ${firstStage.actions?.length || 0}`);
    if (firstStage.actions?.length > 0) {
      console.log(`    [0]: "${firstStage.actions[0]}"`);
    }
    console.log(`  Alerts: ${firstStage.alerts?.length || 0}`);
    if (firstStage.alerts?.length > 0) {
      console.log(`    [0]: "${firstStage.alerts[0]}"`);
    }
    console.log(`  Fertilization: ${firstStage.fertilization ? 'YES - ' + firstStage.fertilization.type : 'NO'}`);

    // STEP 2: Save to Database
    console.log('\n' + '='.repeat(100));
    console.log('STEP 2: Save Calendar to Database');
    console.log('-'.repeat(100));

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert calendar
    const [calResult] = await connection.query(
      'INSERT INTO calendars (parcelle_id, crop_id, sowing_date) VALUES (?, ?, ?)',
      [parcelleId, cropId, calendarData.sowing_date]
    );
    const calendarId = calResult.insertId;
    console.log(`✓ Calendar created: ID ${calendarId}`);

    // Insert stages
    let insertedCount = 0;
    for (const stage of calendarData.stages) {
      // Find or create stage ID
      const [stageRows] = await connection.query(
        'SELECT id FROM stages WHERE crop_id = ? AND stage_order = ?',
        [cropId, stage.number]
      );
      
      let stageId;
      if (stageRows.length > 0) {
        stageId = stageRows[0].id;
      } else {
        const [newStage] = await connection.query(
          'INSERT INTO stages (crop_id, name, stage_order, duration_days, kc_value) VALUES (?, ?, ?, ?, ?)',
          [cropId, stage.name, stage.number, stage.duration_days, stage.kc_value]
        );
        stageId = newStage.insertId;
      }

      // Insert calendar_stage
      await connection.query(
        `INSERT INTO calendar_stages 
         (calendar_id, stage_id, stage_name, start_date, end_date, duration_days, kc_value, actions, alerts, fertilization) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          calendarId,
          stageId,
          stage.name,
          stage.start_date,
          stage.end_date,
          stage.duration_days,
          stage.kc_value,
          stage.actions ? JSON.stringify(stage.actions) : null,
          stage.alerts ? JSON.stringify(stage.alerts) : null,
          stage.fertilization ? JSON.stringify(stage.fertilization) : null,
        ]
      );
      insertedCount++;
    }

    await connection.commit();
    console.log(`✓ Inserted ${insertedCount} stages into calendar_stages`);

    // STEP 3: Retrieve via Fixed Query
    console.log('\n' + '='.repeat(100));
    console.log('STEP 3: Retrieve Calendar via Fixed SQL Query');
    console.log('-'.repeat(100));

    const [retrievedStages] = await connection.query(
      `SELECT 
         cs.id,
         cs.calendar_id,
         cs.stage_id,
         ROW_NUMBER() OVER (ORDER BY cs.start_date) as stage_number,
         cs.start_date,
         cs.end_date,
         COALESCE(cs.stage_name, s.name) as name,
         s.stage_order,
         COALESCE(cs.duration_days, s.duration_days) as duration_days,
         COALESCE(cs.kc_value, s.kc_value) as kc_value,
         COALESCE(cs.actions, s.actions) as actions,
         COALESCE(cs.alerts, s.alerts) as alerts,
         COALESCE(cs.fertilization, s.fertilization) as fertilization
       FROM calendar_stages cs
       LEFT JOIN stages s ON cs.stage_id = s.id
       WHERE cs.calendar_id = ? 
       ORDER BY cs.start_date ASC`,
      [calendarId]
    );

    console.log(`✓ Retrieved ${retrievedStages.length} stages from database\n`);

    // STEP 4: Verify Data Integrity
    console.log('='.repeat(100));
    console.log('STEP 4: Verify Data Integrity');
    console.log('-'.repeat(100));

    const retrieved = retrievedStages[0];
    const original = calendarData.stages[0];

    const checks = [
      { name: 'stage_number', expected: 1, actual: retrieved.stage_number },
      { name: 'stage_name', expected: original.name, actual: retrieved.name },
      { name: 'duration_days', expected: original.duration_days, actual: retrieved.duration_days },
      { name: 'kc_value', expected: original.kc_value, actual: parseFloat(retrieved.kc_value) },
      { name: 'start_date', expected: original.start_date, actual: retrieved.start_date },
      { name: 'end_date', expected: original.end_date, actual: retrieved.end_date },
    ];

    let allPass = true;
    checks.forEach(check => {
      const pass = check.expected === check.actual;
      console.log(`${pass ? '✓' : '✗'} ${check.name}: ${check.actual} ${pass ? '' : '(expected: ' + check.expected + ')'}`);
      if (!pass) allPass = false;
    });

    // Check JSON parsing
    console.log('\nJSON Field Verification:');
    try {
      const actions = typeof retrieved.actions === 'string' ? JSON.parse(retrieved.actions) : retrieved.actions;
      const actionsMatch = Array.isArray(actions) && actions.length === original.actions?.length;
      console.log(`${actionsMatch ? '✓' : '✗'} actions: ${Array.isArray(actions) ? actions.length + ' items' : 'NOT ARRAY'}`);
      if (actionsMatch && actions.length > 0) {
        console.log(`  [0]: "${actions[0]}"`);
      }
      allPass = allPass && actionsMatch;
    } catch (e) {
      console.log(`✗ actions: Parse error - ${e.message}`);
      allPass = false;
    }

    try {
      const alerts = typeof retrieved.alerts === 'string' ? JSON.parse(retrieved.alerts) : retrieved.alerts;
      const alertsMatch = Array.isArray(alerts) && alerts.length === original.alerts?.length;
      console.log(`${alertsMatch ? '✓' : '✗'} alerts: ${Array.isArray(alerts) ? alerts.length + ' items' : 'NOT ARRAY'}`);
      if (alertsMatch && alerts.length > 0) {
        console.log(`  [0]: "${alerts[0]}"`);
      }
      allPass = allPass && alertsMatch;
    } catch (e) {
      console.log(`✗ alerts: Parse error - ${e.message}`);
      allPass = false;
    }

    try {
      const fert = typeof retrieved.fertilization === 'string' ? JSON.parse(retrieved.fertilization) : retrieved.fertilization;
      const fertMatch = (fert === null && original.fertilization === null) || 
                        (fert && original.fertilization && fert.type === original.fertilization.type);
      console.log(`${fertMatch ? '✓' : '✗'} fertilization: ${fert ? fert.type : 'null'}`);
      allPass = allPass && fertMatch;
    } catch (e) {
      console.log(`✗ fertilization: Parse error - ${e.message}`);
      allPass = false;
    }

    // STEP 5: Simulate Frontend Response
    console.log('\n' + '='.repeat(100));
    console.log('STEP 5: Frontend-Ready Response');
    console.log('-'.repeat(100));

    const frontendStages = retrievedStages.map((stage, index) => {
      const startDate = new Date(stage.start_date);
      const sowingDate = new Date(calendarData.sowing_date);
      const dayFromSowing = Math.floor((startDate - sowingDate) / (1000 * 60 * 60 * 24)) + 1;

      let actions = [];
      let alerts = [];
      let fertilization = null;

      try {
        if (stage.actions) {
          actions = typeof stage.actions === 'string' ? JSON.parse(stage.actions) : stage.actions;
          if (!Array.isArray(actions)) actions = [];
        }
      } catch (e) {
        actions = [];
      }

      try {
        if (stage.alerts) {
          alerts = typeof stage.alerts === 'string' ? JSON.parse(stage.alerts) : stage.alerts;
          if (!Array.isArray(alerts)) alerts = [];
        }
      } catch (e) {
        alerts = [];
      }

      try {
        if (stage.fertilization) {
          fertilization = typeof stage.fertilization === 'string' ? JSON.parse(stage.fertilization) : stage.fertilization;
        }
      } catch (e) {
        fertilization = null;
      }

      return {
        number: stage.stage_number || index + 1,
        name: stage.name,
        start_date: stage.start_date,
        end_date: stage.end_date,
        duration_days: parseInt(stage.duration_days),
        kc_value: parseFloat(stage.kc_value),
        day_from_sowing: dayFromSowing,
        actions,
        alerts,
        fertilization
      };
    });

    console.log('\nFormatted for Frontend:');
    frontendStages.slice(0, 2).forEach(stage => {
      console.log(`\n${stage.number}. "${stage.name}"`);
      console.log(`   Period: ${stage.start_date} → ${stage.end_date} (${stage.duration_days} days)`);
      console.log(`   Kc: ${stage.kc_value}, Day from sowing: ${stage.day_from_sowing}`);
      console.log(`   Actions: ${stage.actions.length} items`);
      stage.actions.slice(0, 2).forEach(a => console.log(`     • ${a}`));
      console.log(`   Alerts: ${stage.alerts.length} items`);
      stage.alerts.slice(0, 1).forEach(a => console.log(`     ⚠️  ${a}`));
      if (stage.fertilization) {
        console.log(`   Fertilization: ${stage.fertilization.type} - ${stage.fertilization.dose_kg_ha} kg/ha`);
      }
    });

    // Final result
    console.log('\n' + '='.repeat(100));
    if (allPass) {
      console.log('✅ ALL TESTS PASSED - Calendar system working perfectly!');
    } else {
      console.log('⚠️  Some checks failed - review errors above');
    }
    console.log('='.repeat(100) + '\n');

    // Cleanup - delete test calendar
    await connection.query('DELETE FROM calendar_stages WHERE calendar_id = ?', [calendarId]);
    await connection.query('DELETE FROM calendars WHERE id = ?', [calendarId]);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      connection.release();
    }
    if (directConn) {
      await directConn.end();
    }
    process.exit(0);
  }
}

endToEndTest();
