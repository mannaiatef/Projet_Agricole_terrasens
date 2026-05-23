/**
 * Comprehensive API Test for Terrasens
 * Tests: Auth -> Parcelles -> Calendar
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';
let USER_TOKEN = null;
let USER_ID = null;
let PARCELLE_ID = null;

// Helper to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (USER_TOKEN) {
      options.headers['Authorization'] = `Bearer ${USER_TOKEN}`;
    }

    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test sequence
async function runTests() {
  console.log('\n🚀 TERRASENS API TEST SUITE');
  console.log('=' .repeat(60));

  try {
    // 1. REGISTER USER
    console.log('\n📝 TEST 1: Register User');
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Farmer',
      email: 'test@terrasens.com',
      password: 'password123',
    });
    console.log(`   Status: ${registerRes.status}`);
    if (registerRes.status === 201 || registerRes.status === 409) {
      console.log('   ✅ User registered or already exists');
    } else {
      console.log('   ❌ Registration failed:', registerRes.data);
      return;
    }

    // 2. LOGIN
    console.log('\n🔐 TEST 2: Login');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'test@terrasens.com',
      password: 'password123',
    });
    console.log(`   Status: ${loginRes.status}`);
    if (loginRes.status === 200) {
      USER_TOKEN = loginRes.data.data.token;
      USER_ID = loginRes.data.data.id;
      console.log('   ✅ Login successful');
      console.log(`   Token: ${USER_TOKEN.substring(0, 20)}...`);
    } else {
      console.log('   ❌ Login failed:', loginRes.data);
      return;
    }

    // 3. GET ALL CROPS
    console.log('\n🌾 TEST 3: Get All Crops (Public)');
    const cropsRes = await makeRequest('GET', '/api/crops');
    console.log(`   Status: ${cropsRes.status}`);
    if (cropsRes.status === 200) {
      const crops = cropsRes.data.data || [];
      console.log(`   ✅ Found ${crops.length} crops`);
      crops.slice(0, 3).forEach((crop) => {
        console.log(`      - ${crop.name} (${crop.duration_days} days)`);
      });
    } else {
      console.log('   ❌ Failed to get crops:', cropsRes.data);
    }

    // 4. CREATE PARCELLE
    console.log('\n📍 TEST 4: Create Parcelle');
    const parcelleRes = await makeRequest('POST', '/api/parcelles', {
      name: 'Field A',
      location: 'North 45.67, East 3.45',
      surface: 2.5,
    });
    console.log(`   Status: ${parcelleRes.status}`);
    if (parcelleRes.status === 201) {
      PARCELLE_ID = parcelleRes.data.data.id;
      console.log('   ✅ Parcelle created successfully');
      console.log(`   ID: ${PARCELLE_ID}, Name: ${parcelleRes.data.data.name}`);
    } else {
      console.log('   ❌ Failed to create parcelle:', parcelleRes.data);
      return;
    }

    // 5. GET ALL PARCELLES
    console.log('\n📍 TEST 5: Get All Parcelles');
    const getAllRes = await makeRequest('GET', '/api/parcelles');
    console.log(`   Status: ${getAllRes.status}`);
    if (getAllRes.status === 200) {
      const parcelles = getAllRes.data.data || [];
      console.log(`   ✅ Found ${parcelles.length} parcelle(s)`);
    } else {
      console.log('   ❌ Failed to get parcelles:', getAllRes.data);
    }

    // 6. ASSIGN CROP TO PARCELLE
    console.log('\n🌱 TEST 6: Assign Crop to Parcelle');
    const assignRes = await makeRequest('POST', `/api/parcelles/${PARCELLE_ID}/assign-crop`, {
      crop_id: 1,  // Wheat
      sowing_date: '2026-04-01',
    });
    console.log(`   Status: ${assignRes.status}`);
    if (assignRes.status === 200) {
      console.log('   ✅ Crop assigned successfully');
      console.log(`   Crop ID: ${assignRes.data.data.crop_id}`);
      console.log(`   Sowing Date: ${assignRes.data.data.sowing_date}`);
    } else {
      console.log('   ❌ Failed to assign crop:', assignRes.data);
      return;
    }

    // 7. GENERATE CALENDAR
    console.log('\n📅 TEST 7: Generate Calendar');
    const calendarRes = await makeRequest('POST', '/api/calendar/generate', {
      parcelle_id: PARCELLE_ID,
      crop_id: 1,      // Wheat
      sowing_date: '2026-04-01',
    });
    console.log(`   Status: ${calendarRes.status}`);
    if (calendarRes.status === 201) {
      console.log('   ✅ Calendar generated successfully');
      const cal = calendarRes.data.data;
      console.log(`   Crop: ${cal.crop_name}`);
      console.log(`   Total Duration: ${cal.total_duration_days} days`);
      console.log(`   Stages: ${cal.stages.length}`);
      cal.stages.slice(0, 2).forEach((stage) => {
        console.log(`      - ${stage.stage_name}: ${stage.start_date} to ${stage.end_date}`);
      });
    } else {
      console.log('   ❌ Failed to generate calendar:', calendarRes.data);
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  }
}

// Run tests
setTimeout(runTests, 2000);
