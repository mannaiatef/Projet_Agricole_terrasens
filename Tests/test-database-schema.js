/**
 * DEBUG: Check database schema
 * Verify that calendar_stages has all required columns
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('\n' + '='.repeat(80));
    console.log('DATABASE SCHEMA CHECK');
    console.log('='.repeat(80));

    // Check calendar_stages table structure
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'calendar_stages'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n📋 calendar_stages table columns:');
    console.log('-'.repeat(80));
    
    const requiredColumns = ['calendar_id', 'stage_id', 'stage_name', 'start_date', 'end_date', 'duration_days', 'kc_value', 'actions', 'alerts', 'fertilization'];
    const hasColumns = {};
    
    columns.forEach(col => {
      const isRequired = requiredColumns.includes(col.COLUMN_NAME);
      const marker = isRequired ? '✓' : ' ';
      hasColumns[col.COLUMN_NAME] = true;
      console.log(`${marker} ${col.COLUMN_NAME.padEnd(20)} ${col.COLUMN_TYPE.padEnd(30)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('-'.repeat(80));

    // Check for missing columns
    const missingColumns = requiredColumns.filter(col => !hasColumns[col]);
    if (missingColumns.length > 0) {
      console.log(`\n⚠️  MISSING COLUMNS: ${missingColumns.join(', ')}`);
      console.log('\nTo fix, run:');
      missingColumns.forEach(col => {
        let colType = 'VARCHAR(255)';
        if (col === 'actions' || col === 'alerts' || col === 'fertilization') {
          colType = 'JSON';
        } else if (col === 'duration_days') {
          colType = 'INT';
        } else if (col === 'kc_value') {
          colType = 'DECIMAL(3,2)';
        } else if (col === 'start_date' || col === 'end_date') {
          colType = 'DATE';
        }
        console.log(`  ALTER TABLE calendar_stages ADD COLUMN IF NOT EXISTS ${col} ${colType};`);
      });
    } else {
      console.log('✓ All required columns present');
    }

    // Check sample data
    console.log('\n' + '='.repeat(80));
    console.log('SAMPLE DATA CHECK');
    console.log('='.repeat(80));
    
    const [data] = await connection.query(`
      SELECT 
        stage_id,
        stage_name,
        start_date,
        end_date,
        duration_days,
        kc_value,
        (actions IS NOT NULL) as has_actions,
        (alerts IS NOT NULL) as has_alerts,
        (fertilization IS NOT NULL) as has_fertilization
      FROM calendar_stages
      LIMIT 5
    `);

    if (data.length === 0) {
      console.log('⚠️  No calendar_stages data found');
    } else {
      console.log(`\nFound ${data.length} stages:`);
      data.forEach((row, idx) => {
        console.log(`\n Stage ${idx + 1}: ${row.stage_name}`);
        console.log(`   Dates: ${row.start_date} to ${row.end_date}`);
        console.log(`   Duration: ${row.duration_days}d, Kc: ${row.kc_value}`);
        console.log(`   Data: Actions=${row.has_actions ? 'YES' : 'NO'}, Alerts=${row.has_alerts ? 'YES' : 'NO'}, Fert=${row.has_fertilization ? 'YES' : 'NO'}`);
      });
    }

    // Check stages table for comparison
    console.log('\n' + '='.repeat(80));
    console.log('stages TABLE CHECK');
    console.log('='.repeat(80));

    const [stagesData] = await connection.query(`
      SELECT 
        id,
        name,
        crop_id,
        stage_order,
        (actions IS NOT NULL) as has_actions,
        (alerts IS NOT NULL) as has_alerts,
        (fertilization IS NOT NULL) as has_fertilization
      FROM stages
      LIMIT 3
    `);

    if (stagesData.length === 0) {
      console.log('⚠️  No stages data found');
    } else {
      console.log(`Found ${stagesData.length} stages:`);
      stagesData.forEach((row, idx) => {
        console.log(`\n Stage: ${row.name} (ID: ${row.id})`);
        console.log(`   Data: Actions=${row.has_actions ? 'YES' : 'NO'}, Alerts=${row.has_alerts ? 'YES' : 'NO'}, Fert=${row.has_fertilization ? 'YES' : 'NO'}`);
      });
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkSchema();
