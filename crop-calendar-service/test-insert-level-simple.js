/**
 * SIMPLE INSERT TEST
 * Test what INSERT LEVEL actually works
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function simpleInsertTest() {
  let connection;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('SIMPLE INSERT TEST - Determine Working LEVEL');
    console.log('='.repeat(80) + '\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Get a parcelle (field/farm) and a crop
    const [parcelles] = await connection.query('SELECT id FROM parcelles LIMIT 1');
    const [crops] = await connection.query('SELECT id FROM crops LIMIT 1');

    if (parcelles.length === 0 || crops.length === 0) {
      console.log('⚠️  No parcelles or crops found. Need test data.');
      return;
    }

    const parcelleId = parcelles[0].id;
    const cropId = crops[0].id;

    console.log(`Using parcelle ID: ${parcelleId}, crop ID: ${cropId}\n`);

    // Create a test calendar
    const [calResult] = await connection.query(
      'INSERT INTO calendars (parcelle_id, crop_id, sowing_date) VALUES (?, ?, ?)',
      [parcelleId, cropId, '2026-02-15']
    );
    const calendarId = calResult.insertId;
    console.log(`✓ Created test calendar: ${calendarId}\n`);

    // Get a stage
    const [stagesData] = await connection.query('SELECT id FROM stages LIMIT 1');
    const stageId = stagesData[0].id;

    console.log(`Using stage ID: ${stageId}\n`);

    // === TEST LEVEL 1 ===
    console.log('Test LEVEL 1 - Insert with ALL columns including JSON:');
    console.log('-'.repeat(80));

    try {
      const testData = {
        calendar_id: calendarId,
        stage_id: stageId,
        stage_name: 'Test Stage',
        start_date: '2026-02-15',
        end_date: '2026-02-28',
        duration_days: 14,
        kc_value: '0.80',
        actions: JSON.stringify(['Action 1', 'Action 2']),
        alerts: JSON.stringify(['Alert 1']),
        fertilization: JSON.stringify({type: 'Nitrogen', dose: 50})
      };

      console.log('Data to insert:', JSON.stringify(testData, null, 2));

      await connection.query(
        `INSERT INTO calendar_stages 
         (calendar_id, stage_id, stage_name, start_date, end_date, duration_days, kc_value, actions, alerts, fertilization) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testData.calendar_id,
          testData.stage_id,
          testData.stage_name,
          testData.start_date,
          testData.end_date,
          testData.duration_days,
          testData.kc_value,
          testData.actions,
          testData.alerts,
          testData.fertilization
        ]
      );

      console.log('\n✅ LEVEL 1 SUCCESS - All columns inserted with JSON data');

      // Verify
      const [check] = await connection.query(
        `SELECT stage_name, duration_days, kc_value, actions, alerts, fertilization 
         FROM calendar_stages WHERE calendar_id = ? ORDER BY id DESC LIMIT 1`,
        [calendarId]
      );

      console.log('\n✓ Verification:');
      console.log(`  stage_name: ${check[0].stage_name}`);
      console.log(`  duration_days: ${check[0].duration_days}`);
      console.log(`  kc_value: ${check[0].kc_value}`);
      console.log(`  actions: ${check[0].actions?.substring(0, 30) || 'NULL'}...`);
      console.log(`  alerts: ${check[0].alerts?.substring(0, 30) || 'NULL'}...`);
      console.log(`  fertilization: ${check[0].fertilization ? 'YES' : 'NULL'}`);

      return; // Success, no need to test other levels

    } catch (error1) {
      console.log(`❌ LEVEL 1 FAILED: ${error1.message}`);
      console.log(`   Error code: ${error1.code}`);
      console.log(`   Error SQL: ${error1.sql}`);

      // === TEST LEVEL 2 ===
      console.log('\nTest LEVEL 2 - Insert WITHOUT JSON columns:');
      console.log('-'.repeat(80));

      try {
        await connection.query(
          `INSERT INTO calendar_stages 
           (calendar_id, stage_id, stage_name, start_date, end_date, duration_days, kc_value) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            calendarId,
            stageId,
            'Test Stage L2',
            '2026-02-15',
            '2026-02-28',
            14,
            '0.80'
          ]
        );

        console.log('✅ LEVEL 2 SUCCESS - Basic columns inserted (no JSON)');

        // Verify
        const [check] = await connection.query(
          `SELECT stage_name, duration_days, kc_value, actions, alerts FROM calendar_stages WHERE calendar_id = ? ORDER BY id DESC LIMIT 1`,
          [calendarId]
        );

        console.log('\n✓ Verification:');
        console.log(`  stage_name: ${check[0].stage_name}`);
        console.log(`  duration_days: ${check[0].duration_days}`);
        console.log(`  kc_value: ${check[0].kc_value}`);
        console.log(`  actions: ${check[0].actions || 'NULL'}`);
        console.log(`  alerts: ${check[0].alerts || 'NULL'}`);

        return; // Success

      } catch (error2) {
        console.log(`❌ LEVEL 2 FAILED: ${error2.message}`);
        console.log(`   Error code: ${error2.code}`);
        console.log(`   Error SQL: ${error2.sql}`);

        // === TEST LEVEL 3 ===
        console.log('\nTest LEVEL 3 - Insert MINIMAL columns:');
        console.log('-'.repeat(80));

        try {
          await connection.query(
            `INSERT INTO calendar_stages 
             (calendar_id, stage_id, start_date, end_date) 
             VALUES (?, ?, ?, ?)`,
            [
              calendarId,
              stageId,
              '2026-02-15',
              '2026-02-28'
            ]
          );

          console.log('✅ LEVEL 3 SUCCESS - Minimal columns only');

          // Verify
          const [check] = await connection.query(
            `SELECT stage_name, duration_days, kc_value, actions, alerts FROM calendar_stages WHERE calendar_id = ? ORDER BY id DESC LIMIT 1`,
            [calendarId]
          );

          console.log('\n✓ Verification:');
          console.log(`  stage_name: ${check[0].stage_name || 'NULL'}`);
          console.log(`  duration_days: ${check[0].duration_days || 'NULL'}`);
          console.log(`  kc_value: ${check[0].kc_value || 'NULL'}`);
          console.log(`  actions: ${check[0].actions || 'NULL'}`);
          console.log(`  alerts: ${check[0].alerts || 'NULL'}`);

          console.log('\n⚠️  INSERT REACHED LEVEL 3 - This is the fallback being used!');
          console.log('   This explains why stage_name, duration_days, kc_value, and JSON fields are NULL');

          return;

        } catch (error3) {
          console.log(`❌ LEVEL 3 FAILED: ${error3.message}`);
        }
      }
    }

    // Clean up
    await connection.query('DELETE FROM calendar_stages WHERE calendar_id = ?', [calendarId]);
    await connection.query('DELETE FROM calendars WHERE id = ?', [calendarId]);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

simpleInsertTest();
