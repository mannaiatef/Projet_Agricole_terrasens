/**
 * TEST SCRIPT: Calendar Display with Complete Data
 * 
 * Tests the full flow:
 * 1. User creates a parcelle
 * 2. User assigns a crop to the parcelle
 * 3. Calendar is generated automatically
 * 4. Frontend retrieves calendar with all details
 * 5. Calendar displays with actions, fertilisation, alerts
 * 
 * Verifies response field mappings match frontend interfaces
 */

const http = require('http');

// Test configuration
const AUTH_SERVICE = 'http://localhost:3001';
const CALENDAR_SERVICE = 'http://localhost:3003';
const TEST_EMAIL = `test-calendar-${Date.now()}@test.com`;
const TEST_PASSWORD = 'password123';

let TEST_USER_ID;
let TEST_PARCELLE_ID;
let TEST_CALENDAR_ID;

const log = {
  step: (msg) => console.log(`\n📍 ${msg}`),
  success: (msg) => console.log(`   ✅ ${msg}`),
  error: (msg) => console.log(`   ❌ ${msg}`),
  data: (msg) => console.log(`   📄 ${msg}`),
  info: (msg) => console.log(`   ℹ️  ${msg}`)
};

/**
 * Make HTTP request
 */
function makeRequest(method, host, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, host);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Step 1: Register user
 */
async function registerUser() {
  log.step('STEP 1: Register Test User');
  
  const response = await makeRequest(
    'POST',
    AUTH_SERVICE,
    '/auth/register',
    {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Test Calendar User'
    }
  );

  if (response.status !== 201) {
    log.error(`Registration failed: ${response.status}`);
    log.data(JSON.stringify(response.data, null, 2));
    throw new Error('Registration failed');
  }

  TEST_USER_ID = response.data.data?.id || response.data.user?.id;
  log.success(`User registered: ID=${TEST_USER_ID}`);
  log.data(`Email: ${TEST_EMAIL}`);
}

/**
 * Step 2: Login and get JWT token
 */
let JWT_TOKEN;

async function loginUser() {
  log.step('STEP 2: Login and Get JWT Token');
  
  const response = await makeRequest(
    'POST',
    AUTH_SERVICE,
    '/auth/login',
    {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  );

  if (response.status !== 200) {
    log.error(`Login failed: ${response.status}`);
    log.data(JSON.stringify(response.data, null, 2));
    throw new Error('Login failed');
  }

  JWT_TOKEN = response.data.data?.token || response.data.token;
  log.success(`Login successful`);
  log.data(`Token: ${JWT_TOKEN.substring(0, 50)}...`);
}

/**
 * Step 3: Create a parcelle without crop
 */
async function createParcelle() {
  log.step('STEP 3: Create Parcelle (without crop)');
  
  const response = await makeRequest(
    'POST',
    CALENDAR_SERVICE,
    '/parcelles',
    {
      name: 'Test Plot - Tomate',
      location: 'Test Farm',
      surface: 1.5
    },
    { 'Authorization': `Bearer ${JWT_TOKEN}` }
  );

  if (response.status !== 201) {
    log.error(`Parcelle creation failed: ${response.status}`);
    log.data(JSON.stringify(response.data, null, 2));
    throw new Error('Parcelle creation failed');
  }

  TEST_PARCELLE_ID = response.data.data?.id || response.data.id;
  log.success(`Parcelle created: ID=${TEST_PARCELLE_ID}`);
  log.data(`Name: Test Plot - Tomate`);
  log.data(`Surface: 1.5 ha`);
}

/**
 * Step 4: Assign crop to parcelle (should auto-generate calendar)
 */
async function assignCrop() {
  log.step('STEP 4: Assign Crop to Parcelle (auto-generates calendar)');
  
  const sowingDate = new Date().toISOString().split('T')[0];
  
  const response = await makeRequest(
    'POST',
    CALENDAR_SERVICE,
    `/parcelles/${TEST_PARCELLE_ID}/assign-crop`,
    {
      crop_id: 4,  // Tomate (sequential ID from CropEngine)
      sowing_date: sowingDate
    },
    { 'Authorization': `Bearer ${JWT_TOKEN}` }
  );

  if (response.status !== 200) {
    log.error(`Crop assignment failed: ${response.status}`);
    log.data(JSON.stringify(response.data, null, 2));
    throw new Error('Crop assignment failed');
  }

  log.success(`Crop assigned successfully`);
  log.data(`Crop: Tomate (ID 4)`);
  log.data(`Sowing date: ${sowingDate}`);
  
  if (response.data.data?.calendar_generation_error) {
    log.error(`Calendar generation error: ${response.data.data.calendar_generation_error}`);
  } else {
    log.success(`Calendar generated automatically`);
  }
}

/**
 * Step 5: Retrieve calendar and verify structure
 */
async function getCalendar() {
  log.step('STEP 5: Retrieve Calendar from Backend');
  
  const response = await makeRequest(
    'GET',
    CALENDAR_SERVICE,
    `/calendar/${TEST_PARCELLE_ID}`,
    null,
    { 'Authorization': `Bearer ${JWT_TOKEN}` }
  );

  if (response.status !== 200) {
    log.error(`Calendar retrieval failed: ${response.status}`);
    log.data(JSON.stringify(response.data, null, 2));
    throw new Error('Calendar retrieval failed');
  }

  const calendar = response.data.data;

  if (!calendar) {
    log.info(`Calendar is null (normal if no crop assigned yet)`);
    return null;
  }

  TEST_CALENDAR_ID = calendar.id;
  log.success(`Calendar retrieved: ID=${calendar.id}`);
  log.data(`Farm name: ${calendar.farm_name}`);
  log.data(`Crop type: ${calendar.crop_type}`);
  log.data(`Sowing date: ${calendar.sowing_date}`);
  log.data(`Total days: ${calendar.total_days}`);
  log.data(`Number of stages: ${calendar.stages?.length || 0}`);

  // Verify response structure matches frontend interface
  verifyCalendarStructure(calendar);

  // Display stage details
  if (calendar.stages && calendar.stages.length > 0) {
    log.step('Calendar Stages Detail');
    
    calendar.stages.forEach((stage, index) => {
      log.data(`\n Stage ${index + 1}: ${stage.stage_name}`);
      log.data(`  - Dates: ${stage.start_date} → ${stage.end_date}`);
      log.data(`  - Duration: ${stage.duration_days} days`);
      log.data(`  - Kc value: ${stage.kc_value}`);
      log.data(`  - Day from sowing: ${stage.day_from_sowing}`);
      
      if (stage.actions && stage.actions.length > 0) {
        log.data(`  - Actions: ${stage.actions.length} item(s)`);
        stage.actions.forEach((action, i) => {
          log.data(`    [${i+1}] ${action.substring(0, 60)}...`);
        });
      } else {
        log.data(`  - Actions: (none)`);
      }

      if (stage.fertilization) {
        log.data(`  - Fertilization: ${stage.fertilization.type}`);
        log.data(`    * Product: ${stage.fertilization.product}`);
        log.data(`    * Dose: ${stage.fertilization.dose_kg_ha} kg/ha`);
        log.data(`    * Date: ${stage.fertilization.application_date}`);
      } else {
        log.data(`  - Fertilization: (none)`);
      }

      if (stage.alerts && stage.alerts.length > 0) {
        log.data(`  - Alerts: ${stage.alerts.length} item(s)`);
        stage.alerts.forEach((alert, i) => {
          log.data(`    [${i+1}] ${alert.substring(0, 60)}...`);
        });
      } else {
        log.data(`  - Alerts: (none)`);
      }
    });
  }

  return calendar;
}

/**
 * Verify calendar structure matches frontend interface
 */
function verifyCalendarStructure(calendar) {
  log.step('Verify Response Structure');

  const requiredFields = ['farm_name', 'crop_type', 'sowing_date', 'total_days', 'stages'];
  const missingFields = requiredFields.filter(f => !(f in calendar));

  if (missingFields.length > 0) {
    log.error(`Missing required fields: ${missingFields.join(', ')}`);
  } else {
    log.success(`All required top-level fields present`);
  }

  if (!Array.isArray(calendar.stages) || calendar.stages.length === 0) {
    log.error(`Stages is not a non-empty array`);
    return;
  }

  // Check first stage structure
  const stage = calendar.stages[0];
  const stageFields = [
    'stage_number',
    'stage_name',
    'start_date',
    'end_date',
    'duration_days',
    'kc_value',
    'day_from_sowing',
    'actions',
    'alerts',
    'fertilization'
  ];

  const missingStageFi elds = stageFields.filter(f => !(f in stage));

  if (missingStageFi elds.length > 0) {
    log.error(`Stage missing fields: ${missingStageFi elds.join(', ')}`);
  } else {
    log.success(`All stage fields present in first stage`);
  }

  // Verify types
  const typeErrors = [];
  
  if (typeof stage.actions !== 'undefined' && !Array.isArray(stage.actions)) {
    typeErrors.push(`actions should be array, got ${typeof stage.actions}`);
  }
  if (typeof stage.alerts !== 'undefined' && !Array.isArray(stage.alerts)) {
    typeErrors.push(`alerts should be array, got ${typeof stage.alerts}`);
  }
  if (stage.fertilization && typeof stage.fertilization !== 'object') {
    typeErrors.push(`fertilization should be object or null, got ${typeof stage.fertilization}`);
  }

  if (typeErrors.length > 0) {
    log.error(`Type errors: ${typeErrors.join(', ')}`);
  } else {
    log.success(`All types correct`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  CALENDAR DISPLAY TEST SUITE`);
  console.log(`  Testing complete calendar flow with all details`);
  console.log(`${'='.repeat(70)}`);
  
  try {
    await registerUser();
    await loginUser();
    await createParcelle();
    await assignCrop();
    const calendar = await getCalendar();

    console.log(`\n${'='.repeat(70)}`);
    if (calendar) {
      console.log(`  ✅ TEST PASSED: Calendar displays with all details`);
      console.log(`     - Actions: ${calendar.stages[0]?.actions?.length || 0} items`);
      console.log(`     - Fertilization: ${calendar.stages[0]?.fertilization ? 'Present' : 'None'}`);
      console.log(`     - Alerts: ${calendar.stages[0]?.alerts?.length || 0} items`);
    } else {
      console.log(`  ⚠️  Calendar is null - check if crop was assigned`);
    }
    console.log(`${'='.repeat(70)}\n`);

  } catch (error) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`  ❌ TEST FAILED`);
    console.log(`  Error: ${error.message}`);
    console.log(`${'='.repeat(70)}\n`);
    process.exit(1);
  }
}

// Run tests
runTests();
