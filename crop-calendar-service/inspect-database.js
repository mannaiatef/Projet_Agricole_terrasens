/**
 * INSPECT EXISTING CALENDAR DATA
 * Find and display what's actually in the database
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectData() {
  let connection;

  try {
    console.log('\n' + '='.repeat(100));
    console.log('INSPECT EXISTING CALENDAR DATA');
    console.log('='.repeat(100));

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Get calendar stats
    console.log('\n' + '='.repeat(100));
    console.log('CALENDARS:');
    const [calendars] = await connection.query(`
      SELECT id, parcelle_id, crop_id, sowing_date,
             (SELECT COUNT(*) FROM calendar_stages WHERE calendar_id = calendars.id) as stage_count
      FROM calendars
      LIMIT 3
    `);

    if (calendars.length === 0) {
      console.log('No calendars found');
    } else {
      calendars.forEach(cal => {
        console.log(`Calendar ID ${cal.id}: parcelle=${cal.parcelle_id}, crop=${cal.crop_id}, sowing=${cal.sowing_date}, stages=${cal.stage_count}`);
      });
    }

    // Get detailed calendar_stages data
    console.log('\n' + '='.repeat(100));
    console.log('CALENDAR_STAGES (detailed):\n');

    const [stages] = await connection.query(`
      SELECT 
        id,
        calendar_id,
        stage_id,
        stage_name,
        start_date,
        end_date,
        duration_days,
        kc_value,
        LENGTH(actions) as actions_length,
        LENGTH(alerts) as alerts_length,
        LENGTH(fertilization) as fert_length,
        actions,
        alerts
      FROM calendar_stages
      LIMIT 3
    `);

    if (stages.length === 0) {
      console.log('No stages found');
    } else {
      stages.forEach((stage, idx) => {
        console.log(`Stage ${idx + 1}:`);
        console.log(`  ID: ${stage.id}`);
        console.log(`  calendar_id: ${stage.calendar_id}`);
        console.log(`  stage_id: ${stage.stage_id}`);
        console.log(`  stage_name: ${stage.stage_name}`);
        console.log(`  dates: ${stage.start_date} to ${stage.end_date}`);
        console.log(`  duration_days: ${stage.duration_days}`);
        console.log(`  kc_value: ${stage.kc_value}`);
        console.log(`  actions: ${stage.actions_length || 'NULL'} bytes`);
        console.log(`  alerts: ${stage.alerts_length || 'NULL'} bytes`);
        console.log(`  fert: ${stage.fert_length || 'NULL'} bytes`);
        
        if (stage.actions) {
          console.log(`  actions content (first 100 chars): ${stage.actions.substring(0, 100)}`);
        }
        if (stage.alerts) {
          console.log(`  alerts content (first 100 chars): ${stage.alerts.substring(0, 100)}`);
        }
        console.log('');
      });
    }

    // Get stages table  
    console.log('='.repeat(100));
    console.log('STAGES TABLE:\n');

    const [stagesTable] = await connection.query(`
      SELECT id, crop_id, name, stage_order, duration_days, kc_value
      FROM stages
      LIMIT 5
    `);

    if (stagesTable.length === 0) {
      console.log('No stages in stages table');
    } else {
      stagesTable.forEach(s => {
        console.log(`Stage ID ${s.id}: ${s.name} (crop=${s.crop_id}, order=${s.stage_order}, duration=${s.duration_days}d, kc=${s.kc_value})`);
      });
    }

    // Check crops
    console.log('\n' + '='.repeat(100));
    console.log('CROPS:\n');

    const [cropsTable] = await connection.query('SELECT id, name FROM crops LIMIT 5');
    cropsTable.forEach(c => {
      console.log(`Crop ID ${c.id}: ${c.name}`);
    });

  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

inspectData();
