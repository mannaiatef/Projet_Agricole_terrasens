/**
 * DEBUG: Check what the API is returning
 * Run: node test-api-calendar-debug.js
 */

const http = require('http');

// Assuming farm_id = 1 (adjust if needed)
const farmId = 1;

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/calendar/${farmId}`,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IlRlc3QgVXNlciIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTcxNjM4NDQwMH0.signed',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('\n' + '='.repeat(80));
      console.log('API Response for /api/calendar/' + farmId);
      console.log('='.repeat(80));
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.data && parsed.data.stages && parsed.data.stages.length > 0) {
        const stage1 = parsed.data.stages[0];
        console.log('\n' + '='.repeat(80));
        console.log('FIRST STAGE DETAIL:');
        console.log('='.repeat(80));
        console.log(`Name: ${stage1.name}`);
        console.log(`Actions: ${stage1.actions ? stage1.actions.length : 0} items`);
        console.log(`Alerts: ${stage1.alerts ? stage1.alerts.length : 0} items`);
        console.log(`Fertilization: ${stage1.fertilization ? 'YES' : 'NO'}`);
        
        if (stage1.actions && stage1.actions.length > 0) {
          console.log(`\nFirst action: ${stage1.actions[0]}`);
        }
        if (stage1.alerts && stage1.alerts.length > 0) {
          console.log(`First alert: ${stage1.alerts[0]}`);
        }
        if (stage1.fertilization) {
          console.log(`Fertilization type: ${stage1.fertilization.type}`);
        }
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
  console.log('\nMake sure:');
  console.log('1. Backend service is running on port 3000');
  console.log('2. Database is running with calendar data');
  console.log('3. Farm ID 1 exists and has a calendar');
});

req.end();
