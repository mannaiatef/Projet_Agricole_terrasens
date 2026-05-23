/**
 * Test: Parcelle → Assign Crop → Calendar Generation
 * Purpose: Verify calendar is properly saved and retrieved
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';
let USER_TOKEN = null;
let USER_ID = null;
let PARCELLE_ID = null;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
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

async function runTests() {
  try {
    console.log('🧪 TEST: CROP ASSIGNMENT & CALENDAR GENERATION FIX\n');
    console.log('='.repeat(60));

    // 1. LOGIN
    console.log('\n1️⃣  LOGIN USER');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'pass1234',
    });
    console.log(`   Status: ${loginRes.status}`);
    
    if (loginRes.status !== 200 || !loginRes.data.data?.token) {
      console.log('   ❌ Login failed:', loginRes.data.message);
      return;
    }

    USER_TOKEN = loginRes.data.data.token;
    USER_ID = loginRes.data.data.user.id;
    console.log(`   ✅ Logged in as user ${USER_ID}`);

    // 2. GET CROPS
    console.log('\n2️⃣  GET AVAILABLE CROPS');
    const cropsRes = await makeRequest('GET', '/calendar/crops');
    console.log(`   Status: ${cropsRes.status}`);
    
    if (cropsRes.status !== 200) {
      console.log('   ❌ Failed to get crops:', cropsRes.data);
      return;
    }
    
    const crops = cropsRes.data.data || [];
    console.log(`   ✅ Found ${crops.length} crops`);
    crops.slice(0, 2).forEach((crop) => {
      console.log(`      - ${crop.name} (ID: ${crop.id}, ${crop.duration_days} days)`);
    });

    // 3. CREATE PARCELLE
    console.log('\n3️⃣  CREATE PARCELLE (without crop)');
    const parcelleRes = await makeRequest('POST', '/parcelles', {
      name: 'Test Field - Calendar Fix',
      location: 'North 45.67, East 3.45',
      surface: 2.5,
    });
    console.log(`   Status: ${parcelleRes.status}`);
    
    if (parcelleRes.status !== 201) {
      console.log('   ❌ Failed to create parcelle:', parcelleRes.data);
      return;
    }

    PARCELLE_ID = parcelleRes.data.data.id;
    console.log(`   ✅ Parcelle created: ID ${PARCELLE_ID}`);
    console.log(`   Name: ${parcelleRes.data.data.name}`);
    console.log(`   Crop ID: ${parcelleRes.data.data.crop_id} (should be null)`);

    // 4. TRY TO GET CALENDAR (should return null)
    console.log(`\n4️⃣  GET CALENDAR FOR ${PARCELLE_ID} (should be empty)`);
    const calBeforeRes = await makeRequest('GET', `/calendar/${PARCELLE_ID}`);
    console.log(`   Status: ${calBeforeRes.status}`);
    console.log(`   Calendar exists: ${calBeforeRes.data.data ? 'YES' : 'NO'}`);
    
    if (calBeforeRes.data.data) {
      console.log(`   ⚠️  Calendar already exists (unexpected)`);
    } else {
      console.log(`   ✅ No calendar yet (expected)`);
    }

    // 5. ASSIGN CROP TO PARCELLE
    console.log('\n5️⃣  ASSIGN CROP TO PARCELLE & GENERATE CALENDAR');
    const assignRes = await makeRequest('POST', `/parcelles/${PARCELLE_ID}/assign-crop`, {
      crop_id: 1,  // Blé
      sowing_date: '2026-04-01',
    });
    console.log(`   Status: ${assignRes.status}`);
    
    if (assignRes.status !== 200) {
      console.log('   ❌ Failed to assign crop:', assignRes.data);
      return;
    }

    const assignData = assignRes.data.data;
    console.log(`   ✅ Crop assigned successfully`);
    console.log(`   Crop name: ${assignData.crop_name}`);
    console.log(`   Crop ID (database): ${assignData.crop_id}`);
    console.log(`   Sowing date: ${assignData.sowing_date}`);
    console.log(`   Calendar generated: ${assignData.calendar_generated}`);
    
    if (!assignData.calendar_generated) {
      console.log(`   ⚠️  Calendar generation failed!`);
      console.log(`   Error: ${assignData.calendar_generation_error}`);
    }

    // 6. WAIT A BIT (let database sync)
    console.log('\n⏳ Waiting 2 seconds for database...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 7. TRY TO GET CALENDAR AGAIN (should now exist)
    console.log(`\n6️⃣  GET CALENDAR FOR ${PARCELLE_ID} (should now exist)`);
    const calAfterRes = await makeRequest('GET', `/calendar/${PARCELLE_ID}`);
    console.log(`   Status: ${calAfterRes.status}`);
    
    if (!calAfterRes.data.data) {
      console.log(`   ❌ Calendar NOT found (generation likely failed)`);
      console.log(`   Response:`, calAfterRes.data);
    } else {
      const calendar = calAfterRes.data.data;
      console.log(`   ✅ Calendar found!`);
      console.log(`   Crop: ${calendar.crop_name || 'N/A'}`);
      console.log(`   Sowing date: ${calendar.sowing_date}`);
      console.log(`   Total duration: ${calendar.total_duration_days} days`);
      console.log(`   Stages: ${calendar.stages?.length || 0}`);
      
      if (calendar.stages && calendar.stages.length > 0) {
        console.log(`   First stage: ${calendar.stages[0].name} (${calendar.stages[0].duration_days} days)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  }
}

// Run tests
setTimeout(runTests, 1000);
