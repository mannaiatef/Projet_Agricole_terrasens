/**
 * DIRECT TEST OF _saveCalendarToDB WITH DETAILED LOGGING
 * Simulates what happens when calendar is generated
 */

const mysql = require('mysql2/promise');
const CropEngine = require('./src/domain/logic/crop-engine');
require('dotenv').config();

async function testSaveCalendarToDB() {
  let connection;
  let pool;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('TEST: Save Calendar with Detailed Error Logging');
    console.log('='.repeat(80) + '\n');

    // Create pool (same way service does)
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    connection = await pool.getConnection();

    // Get test data
    const [parcelles] = await connection.query('SELECT id FROM parcelles LIMIT 1');
    const [crops] = await connection.query('SELECT id, name FROM crops WHERE name = ? LIMIT 1', ['Maize']);
    
    if (parcelles.length === 0 || crops.length === 0) {
      console.log('No test data available');
      return;
    }

    const parcelleId = parcelles[0].id;
    const cropId = crops[0].id;
    const cropNameForEngine = 'Maïs'; // CropEngine uses French name

    console.log(`Test: Generate and save calendar for ${cropNameForEngine}\n`);

    // Generate calendar
    const calendarData = CropEngine.generateCalendar(cropNameForEngine, '2026-02-15');
    console.log(`✓ CropEngine generated calendar: ${calendarData.stages.length} stages\n`);
    console.log(`First 3 stages:`);
    calendarData.stages.slice(0, 3).forEach(s => {
      console.log(`  - ${s.name} (${s.duration_days}d, Kc:${s.kc_value}, actions:${s.actions?.length || 0}, alerts:${s.alerts?.length || 0})`);
    });

    // Now test the save logic - simulate _saveCalendarToDB

    await connection.beginTransaction();

    try {
      // Insert calendar
      const [result] = await connection.query(
        `INSERT INTO calendars (parcelle_id, crop_id, sowing_date) 
         VALUES (?, ?, ?)`,
        [parcelleId, cropId, calendarData.sowing_date]
      );

      const calendarId = result.insertId;
      console.log(`\n✓ Calendar inserted: ID ${calendarId}\n`);

      // Process stages
      for (let idx = 0; idx < Math.min(2, calendarData.stages.length); idx++) {
        const stage = calendarData.stages[idx];
        const stageNumber = stage.number;

        console.log(`\nProcessing Stage ${stageNumber}: "${stage.name}"`);
        console.log(`  Full data: name="${stage.name}", duration=${stage.duration_days}, kc=${stage.kc_value}`);
        console.log(`  Actions: ${stage.actions?.length || 0}, Alerts: ${stage.alerts?.length || 0}, Fert: ${stage.fertilization ? 'YES' : 'NO'}`);

        // _resolveStageId logic
        const [stages] = await connection.query(
          `SELECT id FROM stages WHERE crop_id = ? AND stage_order = ?`,
          [cropId, stageNumber]
        );

        let stageId;
        if (stages && stages.length > 0) {
          stageId = stages[0].id;
          console.log(`  → Found existing stage ID: ${stageId}`);
        } else {
          const [newStage] = await connection.query(
            `INSERT INTO stages (crop_id, name, stage_order, duration_days, kc_value) 
             VALUES (?, ?, ?, ?, ?)`,
            [cropId, stage.name, stageNumber, stage.duration_days, stage.kc_value]
          );
          stageId = newStage.insertId;
          console.log(`  → Created new stage ID: ${stageId}`);
        }

        // LEVEL 1 INSERT
        console.log(`  → LEVEL 1: Attempting full insert with JSON...`);
        try {
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
          console.log(`    ✓ LEVEL 1 SUCCESS`);

          // Verify
          const [verify1] = await connection.query(
            'SELECT stage_name, duration_days, kc_value, (actions IS NOT NULL) as has_actions FROM calendar_stages WHERE calendar_id = ? AND stage_id = ? ORDER BY id DESC LIMIT 1',
            [calendarId, stageId]
          );
          console.log(`    ✓ Verified: stage_name="${verify1[0].stage_name}", duration=${verify1[0].duration_days}, kc=${verify1[0].kc_value}, actions=${verify1[0].has_actions}`);

        } catch (error1) {
          console.log(`    ✗ LEVEL 1 FAILED`);
          console.log(`      Code: ${error1.code}`);
          console.log(`      Message: ${error1.message}`);

          // LEVEL 2
          console.log(`  → LEVEL 2: Attempting without JSON...`);
          if (error1.code === 'ER_BAD_FIELD_ERROR' || error1.message.includes('Unknown column')) {
            try {
              await connection.query(
                `INSERT INTO calendar_stages 
                 (calendar_id, stage_id, stage_name, start_date, end_date, duration_days, kc_value) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  calendarId,
                  stageId,
                  stage.name,
                  stage.start_date,
                  stage.end_date,
                  stage.duration_days,
                  stage.kc_value,
                ]
              );
              console.log(`    ✓ LEVEL 2 SUCCESS (no JSON)`);
            } catch (error2) {
              console.log(`    ✗ LEVEL 2 FAILED: ${error2.message}`);

              // LEVEL 3
              console.log(`  → LEVEL 3: Minimal insert...`);
              try {
                await connection.query(
                  `INSERT INTO calendar_stages 
                   (calendar_id, stage_id, start_date, end_date) 
                   VALUES (?, ?, ?, ?)`,
                  [calendarId, stageId, stage.start_date, stage.end_date]
                );
                console.log(`    ✓ LEVEL 3 SUCCESS (minimal - FALLBACK!)`);
              } catch (error3) {
                console.log(`    ✗ LEVEL 3 FAILED (CRITICAL): ${error3.message}`);
                throw error3;
              }
            }
          } else {
            console.log(`      (Not a schema error, would throw)`);
            throw error1;
          }
        }
      }

      await connection.commit();
      console.log('\n✓ Transaction committed\n');

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      connection.release();
    }
    if (pool) {
      await pool.end();
    }
  }
}

testSaveCalendarToDB();
