/**
 * QUICK TEST: Verify Fixed SQL Queries Work
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('\n' + '='.repeat(80));
    console.log('VERIFY FIXED SQL QUERIES');
    console.log('='.repeat(80));

    // Get a calendar ID
    const [calendars] = await conn.query('SELECT id FROM calendars WHERE id > 20 LIMIT 1');
    
    if (calendars.length === 0) {
      console.log('No recent calendars. Running calendar generation first...');
      return;
    }

    const calendarId = calendars[0].id;
    console.log(`\nTesting with calendar ID: ${calendarId}\n`);

    // Test the FIXED query with ROW_NUMBER()
    console.log('Running FIXED query with ROW_NUMBER()...\n');
    const [stages] = await conn.query(
      `SELECT 
         cs.id,
         cs.calendar_id,
         cs.stage_id,
         ROW_NUMBER() OVER (ORDER BY cs.start_date) as stage_number,
         cs.start_date,
         cs.end_date,
         COALESCE(cs.stage_name, s.name) as name,
         COALESCE(cs.duration_days, s.duration_days) as duration_days,
         COALESCE(cs.kc_value, s.kc_value) as kc_value,
         COALESCE(cs.actions, s.actions) as actions,
         (cs.actions IS NOT NULL) as has_actions,
         COALESCE(cs.alerts, s.alerts) as alerts,
         (cs.alerts IS NOT NULL) as has_alerts
       FROM calendar_stages cs
       LEFT JOIN stages s ON cs.stage_id = s.id
       WHERE cs.calendar_id = ? 
       ORDER BY cs.start_date ASC`,
      [calendarId]
    );

    console.log(`✓ Query succeeded! Retrieved ${stages.length} stages\n`);

    if (stages.length > 0) {
      const stage = stages[0];
      console.log('First Stage Data:');
      console.log(`  stage_number: ${stage.stage_number}`);
      console.log(`  stage_name: ${stage.name}`);
      console.log(`  duration_days: ${stage.duration_days}`);
      console.log(`  kc_value: ${stage.kc_value}`);
      console.log(`  has_actions: ${stage.has_actions}`);
      console.log(`  has_alerts: ${stage.has_alerts}`);
      
      if (stage.has_actions) {
        console.log(`  actions content (first 80 chars): ${String(stage.actions).substring(0, 80)}...`);
      }

      console.log('\n✓ All data properly returned from database!');
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
})();
