/**
 * TEST: Generate Calendar and Watch Console Logs
 * 
 * This test generates a calendar for a specific farm/crop
 * and shows which INSERT LEVEL is being used
 */

const mysql = require('mysql2/promise');
const CropEngine = require('./src/domain/logic/crop-engine');
require('dotenv').config();

async function testGenerateWithLogs() {
  let connection;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('CALENDAR GENERATION WITH LEVEL LOGGING');
    console.log('='.repeat(80) + '\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Get a farm
    const [farms] = await connection.query('SELECT id, name FROM farms LIMIT 1');
    if (farms.length === 0) {
      console.log('No farms found');
      return;
    }

    const farm = farms[0];
    console.log(`📍 Farm: "${farm.name}" (ID: ${farm.id})`);

    // Clear old calendar for this farm to test fresh generation
    const cropName = 'Tomate'; // Use Tomate as test crop
    const sowingDate = '2026-02-15';

    console.log(`\n🌱 Testing crop: ${cropName}`);
    console.log(`📅 Sowing date: ${sowingDate}\n`);

    // Step 1: Generate calendar with CropEngine
    console.log('Step 1: Generate with CropEngine...');
    const calendarData = CropEngine.generateCalendar(cropName, sowingDate);
    
    console.log(`✓ Generated ${calendarData.stages.length} stages`);
    console.log(`  First stage: ${calendarData.stages[0].name}`);
    console.log(`  First stage actions: ${calendarData.stages[0].actions?.length || 0} items`);
    console.log(`  First stage alerts: ${calendarData.stages[0].alerts?.length || 0} items`);

    // Step 2: Verify data structure
    console.log('\nStep 2: Validate stage data structure...');
    const stage0 = calendarData.stages[0];
    console.log(`  - number: ${stage0.number}`);
    console.log(`  - name: ${stage0.name}`);
    console.log(`  - start_date: ${stage0.start_date}`);
    console.log(`  - end_date: ${stage0.end_date}`);
    console.log(`  - duration_days: ${stage0.duration_days}`);
    console.log(`  - kc_value: ${stage0.kc_value}`);
    console.log(`  - actions: ${typeof stage0.actions} (is Array: ${Array.isArray(stage0.actions)})`);
    console.log(`  - alerts: ${typeof stage0.alerts} (is Array: ${Array.isArray(stage0.alerts)})`);
    console.log(`  - fertilization: ${typeof stage0.fertilization}`);

    // Step 3: Resolve crop ID
    console.log('\nStep 3: Resolve crop ID...');
    const [crops] = await connection.query(
      'SELECT id FROM crops WHERE name = ?',
      [cropName]
    );
    
    if (crops.length === 0) {
      console.log('✗ Crop not found - creating...');
      const [result] = await connection.query(
        'INSERT INTO crops (name) VALUES (?)',
        [cropName]
      );
      var cropId = result.insertId;
      console.log(`✓ Created crop with ID ${cropId}`);
    } else {
      var cropId = crops[0].id;
      console.log(`✓ Found crop ID: ${cropId}`);
    }

    // Step 4: Test stage ID resolution
    console.log('\nStep 4: Test _resolveStageId for first stage...');
    const testStage = calendarData.stages[0];
    
    // Try to find or create stage
    const [stages] = await connection.query(
      'SELECT id FROM stages WHERE crop_id = ? AND stage_order = ?',
      [cropId, testStage.number]
    );

    let stageId;
    if (stages.length > 0) {
      stageId = stages[0].id;
      console.log(`✓ Found existing stage ID: ${stageId}`);
    } else {
      console.log('✗ Stage not found - creating...');
      const [result] = await connection.query(
        `INSERT INTO stages (crop_id, name, stage_order, duration_days, kc_value) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          cropId,
          testStage.name,
          testStage.number,
          testStage.duration_days,
          testStage.kc_value,
        ]
      );
      stageId = result.insertId;
      console.log(`✓ Created stage with ID ${stageId}`);
    }

    // Step 5: Test INSERT LEVEL 1
    console.log('\nStep 5: Test LEVEL 1 INSERT (with JSON columns)...');
    
    // First check what columns exist
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'calendar_stages' AND TABLE_SCHEMA = ?`,
      [process.env.DB_NAME]
    );
    
    const columnNames = columns.map(c => c.COLUMN_NAME);
    console.log(`Available columns: ${columnNames.join(', ')}`);
    
    // Check if actions/alerts/fertilization exist
    const hasActions = columnNames.includes('actions');
    const hasAlerts = columnNames.includes('alerts');
    const hasFert = columnNames.includes('fertilization');
    
    console.log(`Has actions: ${hasActions}, alerts: ${hasAlerts}, fert: ${hasFert}`);

    // Try LEVEL 1 insert (this is similar to what the service does)
    try {
      console.log('\nAttempting LEVEL 1 INSERT...');
      
      // First create calendar
      const [calResult] = await connection.query(
        `INSERT INTO calendars (parcelle_id, crop_id, sowing_date) 
         VALUES (?, ?, ?)`,
        [farm.id, cropId, sowingDate]
      );
      const calendarId = calResult.insertId;
      console.log(`✓ Calendar created with ID: ${calendarId}`);

      // Now try to insert stage with all columns
      await connection.query(
        `INSERT INTO calendar_stages 
         (calendar_id, stage_id, stage_name, start_date, end_date, duration_days, kc_value, actions, alerts, fertilization) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          calendarId,
          stageId,
          testStage.name,
          testStage.start_date,
          testStage.end_date,
          testStage.duration_days,
          testStage.kc_value,
          testStage.actions ? JSON.stringify(testStage.actions) : null,
          testStage.alerts ? JSON.stringify(testStage.alerts) : null,
          testStage.fertilization ? JSON.stringify(testStage.fertilization) : null,
        ]
      );
      
      console.log('✓ LEVEL 1 successful!');

      // Verify what was inserted
      const [check1] = await connection.query(
        `SELECT stage_name, duration_days, kc_value, 
                (actions IS NOT NULL) as has_actions,
                (alerts IS NOT NULL) as has_alerts,
                (fertilization IS NOT NULL) as has_fert
         FROM calendar_stages WHERE calendar_id = ?`,
        [calendarId]
      );
      
      if (check1.length > 0) {
        const row = check1[0];
        console.log(`\nVerification - data saved:`);
        console.log(`  stage_name: ${row.stage_name}`);
        console.log(`  duration_days: ${row.duration_days}`);
        console.log(`  kc_value: ${row.kc_value}`);
        console.log(`  has_actions: ${row.has_actions}`);
        console.log(`  has_alerts: ${row.has_alerts}`);
        console.log(`  has_fert: ${row.has_fert}`);
      }

      // Clean up
      await connection.query('DELETE FROM calendars WHERE id = ?', [calendarId]);

    } catch (error) {
      console.log(`✗ LEVEL 1 failed: ${error.message}`);
      console.log(`  Error code: ${error.code}`);
      console.log(`  Error SQL: ${error.sql}`);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testGenerateWithLogs();
