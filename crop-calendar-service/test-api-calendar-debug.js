/**
 * API CALENDAR DEBUG TEST
 * 
 * Tests what the API actually returns for a calendar
 * 
 * Run from crop-calendar-service:
 *   node test-api-calendar-debug.js
 */

const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testApiDebug() {
  let connection;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('API CALENDAR DEBUG TEST');
    console.log('='.repeat(80));

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Get a farm ID
    const [farms] = await connection.query('SELECT id, name FROM farms LIMIT 1');

    if (farms.length === 0) {
      console.log('⚠️  No farms found in database');
      return;
    }

    const farm = farms[0];
    console.log(`\n📍 Testing farm: "${farm.name}" (ID: ${farm.id})`);

    // Test API endpoint
    console.log(`\n🔄 Calling API: GET http://localhost:3000/api/calendars/farm/${farm.id}`);
    
    try {
      const response = await axios.get(`http://localhost:3000/api/calendars/farm/${farm.id}`, {
        timeout: 5000
      });

      console.log(`✓ Status: ${response.status}`);
      console.log(`✓ Response type: ${typeof response.data}`);
      console.log(`✓ Is array: ${Array.isArray(response.data)}`);

      if (Array.isArray(response.data)) {
        console.log(`✓ Calendar count: ${response.data.length}`);

        if (response.data.length > 0) {
          const calendar = response.data[0];

          console.log(`\n📅 First Calendar:`);
          console.log(`   crop_name: ${calendar.crop_name}`);
          console.log(`   farming_year: ${calendar.farming_year}`);
          console.log(`   status: ${calendar.status}`);
          console.log(`   stages: ${Array.isArray(calendar.stages) ? calendar.stages.length + ' items' : 'NOT AN ARRAY'}`);

          if (Array.isArray(calendar.stages) && calendar.stages.length > 0) {
            const stage = calendar.stages[0];

            console.log(`\n   First Stage:`);
            console.log(`     number: ${stage.number}`);
            console.log(`     name: ${stage.name}`);
            console.log(`     start_date: ${stage.start_date}`);
            console.log(`     end_date: ${stage.end_date}`);
            console.log(`     duration_days: ${stage.duration_days}`);
            console.log(`     kc_value: ${stage.kc_value}`);
            
            console.log(`\n     📋 actions:`);
            console.log(`       type: ${typeof stage.actions}`);
            console.log(`       isArray: ${Array.isArray(stage.actions)}`);
            if (Array.isArray(stage.actions)) {
              console.log(`       count: ${stage.actions.length}`);
              if (stage.actions.length > 0) {
                console.log(`       [0]: "${stage.actions[0]}"`);
              }
            } else {
              console.log(`       value: ${stage.actions}`);
            }

            console.log(`\n     ⚠️  alerts:`);
            console.log(`       type: ${typeof stage.alerts}`);
            console.log(`       isArray: ${Array.isArray(stage.alerts)}`);
            if (Array.isArray(stage.alerts)) {
              console.log(`       count: ${stage.alerts.length}`);
              if (stage.alerts.length > 0) {
                console.log(`       [0]: "${stage.alerts[0]}"`);
              }
            } else {
              console.log(`       value: ${stage.alerts}`);
            }

            console.log(`\n     🌱 fertilization:`);
            console.log(`       type: ${typeof stage.fertilization}`);
            console.log(`       isNull: ${stage.fertilization === null}`);
            if (stage.fertilization && typeof stage.fertilization === 'object') {
              Object.keys(stage.fertilization).forEach(key => {
                console.log(`       ${key}: ${stage.fertilization[key]}`);
              });
            } else {
              console.log(`       value: ${stage.fertilization}`);
            }

            console.log(`\n     ✓ Raw stage object:`);
            console.log(`       ${JSON.stringify(stage, null, 2).split('\n').slice(0, 10).join('\n')}`);
          } else {
            console.log('\n⚠️  No stages in calendar or stages is not array');
          }

          // Full response dump
          console.log('\n\n' + '='.repeat(80));
          console.log('FULL RESPONSE (first calendar):');
          console.log('='.repeat(80));
          console.log(JSON.stringify(response.data[0], null, 2));
        }
      } else {
        console.log('\n⚠️  Response not an array');
        console.log(JSON.stringify(response.data, null, 2));
      }
    } catch (apiError) {
      console.log(`\n❌ API Error: ${apiError.message}`);
      if (apiError.response) {
        console.log(`   Status: ${apiError.response.status}`);
        console.log(`   Data: ${JSON.stringify(apiError.response.data)}`);
      } else if (apiError.code === 'ECONNREFUSED') {
        console.log('   → API server not running on port 3000');
      }
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testApiDebug();
