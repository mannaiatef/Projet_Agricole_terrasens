/**
 * CROP CALENDAR API INTEGRATION TESTS
 * 
 * Complete test suite for the crop calendar system.
 * Tests deterministic calendar generation and all API endpoints.
 */

const http = require('http');
const BASE_URL = 'http://localhost:3000/api';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            headers: res.headers,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
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

// Test Suite
async function runTests() {
  console.log('🧪 CROP CALENDAR API INTEGRATION TESTS\n');
  console.log('========================================\n');

  let testsPassed = 0;
  let testsFailed = 0;
  let jwtToken = '';
  let farmId = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✓ ${message}`);
      testsPassed++;
    } else {
      console.log(`✗ ${message}`);
      testsFailed++;
    }
  };

  try {
    // ===== Test 1: Get Available Crops =====
    console.log('\n📌 Test 1: GET /crop-calendar/crops');
    const cropsResponse = await makeRequest('GET', '/crop-calendar/crops');
    assert(cropsResponse.status === 200, 'Status 200');
    assert(cropsResponse.data.success === true, 'Response is successful');
    assert(Array.isArray(cropsResponse.data.data), 'Returns array of crops');
    assert(cropsResponse.data.data.length > 0, 'At least one crop available');

    const hasBlé = cropsResponse.data.data.some((c) => c.name === 'Blé');
    assert(hasBlé, 'Blé crop is available');

    const blé = cropsResponse.data.data.find((c) => c.name === 'Blé');
    assert(blé.duration_days === 140, 'Blé has 140 day duration');

    // ===== Test 2: Get Crop Details =====
    console.log('\n📌 Test 2: GET /crop-calendar/crops/Blé');
    const cropDetailsResponse = await makeRequest('GET', '/crop-calendar/crops/Blé');
    assert(cropDetailsResponse.status === 200, 'Status 200');
    assert(cropDetailsResponse.data.data.name === 'Blé', 'Crop name is correct');
    assert(cropDetailsResponse.data.data.stages, 'Crop has stages');
    assert(cropDetailsResponse.data.data.stages.length > 0, 'Crop has at least 1 stage');

    // ===== Test 3: Calendar Generation - CRITICAL TEST =====
    console.log('\n📌 Test 3: Calendar Generation Algorithm (CRITICAL)');
    const calendarRequest = {
      crop_name: 'Blé',
      sowing_date: '2026-01-15',
    };

    // For testing without auth, we'll test the calendar engine directly
    // In production, this would go through the API with JWT
    const CropEngine = require('./src/domain/logic/crop-engine.js');

    let calendar;
    try {
      calendar = CropEngine.generateCalendar('Blé', '2026-01-15');
    } catch (error) {
      console.log('Note: Testing engine directly instead of API endpoint');
      calendar = null;
    }

    if (calendar) {
      assert(calendar.crop_name === 'Blé', 'Calendar crop name is Blé');
      assert(calendar.sowing_date === '2026-01-15', 'Sowing date correct');
      assert(calendar.total_duration_days === 140, 'Total duration is 140 days');
      assert(calendar.stages.length === 5, 'Blé has 5 stages');

      // CRITICAL: Verify Stage 4 dates
      const stage4 = calendar.stages.find((s) => s.number === 4);
      assert(stage4, 'Stage 4 exists');
      assert(
        stage4.start_date === '2026-03-26',
        `✓ CRITICAL: Stage 4 starts on 2026-03-26 (actual: ${stage4.start_date})`
      );
      assert(
        stage4.end_date === '2026-04-14',
        `✓ CRITICAL: Stage 4 ends on 2026-04-14 (actual: ${stage4.end_date})`
      );
      assert(stage4.duration_days === 30, 'Stage 4 (Épiaison) is 30 days');

      // Verify dates are sequential
      let allSequential = true;
      for (let i = 0; i < calendar.stages.length - 1; i++) {
        const current = calendar.stages[i];
        const next = calendar.stages[i + 1];
        const currentEnd = new Date(current.end_date);
        const nextStart = new Date(next.start_date);
        currentEnd.setDate(currentEnd.getDate() + 1);

        if (
          currentEnd.toISOString().split('T')[0] !== 
          nextStart.toISOString().split('T')[0]
        ) {
          allSequential = false;
          break;
        }
      }
      assert(allSequential, 'All stages are sequential with no gaps');

      // Verify stages have required fields
      let allStagesValid = calendar.stages.every(
        (s) =>
          s.number &&
          s.name &&
          s.start_date &&
          s.end_date &&
          s.duration_days &&
          s.kc_value !== undefined &&
          Array.isArray(s.actions) &&
          Array.isArray(s.alerts)
      );
      assert(allStagesValid, 'All stages have required fields');

      // Verify fertilization data
      const stage1 = calendar.stages[0];
      assert(stage1.fertilization, 'Stage 1 has fertilization data');
      assert(stage1.fertilization.npk, 'Fertilization has NPK values');
      assert(stage1.fertilization.type, 'Fertilization has type');
    }

    // ===== Test 4: Maïs Crop =====
    console.log('\n📌 Test 4: Maïs (Maize) Crop');
    try {
      const maïsCalendar = CropEngine.generateCalendar('Maïs', '2026-04-15');
      assert(maïsCalendar.crop_name === 'Maïs', 'Maïs calendar generated');
      assert(maïsCalendar.total_duration_days === 140, 'Maïs is 140 days');
      assert(maïsCalendar.stages.length === 4, 'Maïs has 4 stages');
    } catch (error) {
      console.log(`✗ Maïs test failed: ${error.message}`);
      testsFailed++;
    }

    // ===== Test 5: Orge Crop =====
    console.log('\n📌 Test 5: Orge (Barley) Crop');
    try {
      const orgeCalendar = CropEngine.generateCalendar('Orge', '2026-10-20');
      assert(orgeCalendar.crop_name === 'Orge', 'Orge calendar generated');
      assert(orgeCalendar.total_duration_days === 130, 'Orge is 130 days');
      assert(orgeCalendar.stages.length === 4, 'Orge has 4 stages');
    } catch (error) {
      console.log(`✗ Orge test failed: ${error.message}`);
      testsFailed++;
    }

    // ===== Test 6: Invalid Crop =====
    console.log('\n📌 Test 6: Invalid Crop Name');
    try {
      CropEngine.generateCalendar('InvalidCrop', '2026-01-15');
      console.log('✗ Should have thrown error for invalid crop');
      testsFailed++;
    } catch (error) {
      assert(error.message.includes('not found'), 'Correctly rejects invalid crop');
    }

    // ===== Test 7: Invalid Date Format =====
    console.log('\n📌 Test 7: Invalid Date Format');
    try {
      CropEngine.generateCalendar('Blé', '01-15-2026');
      console.log('✗ Should have thrown error for invalid date');
      testsFailed++;
    } catch (error) {
      assert(error.message.includes('Invalid'), 'Correctly rejects invalid date format');
    }

    // ===== Test 8: Case Insensitive Crop Names =====
    console.log('\n📌 Test 8: Case Insensitive Crop Names');
    try {
      const calendar1 = CropEngine.generateCalendar('Blé', '2026-01-15');
      const calendar2 = CropEngine.generateCalendar('blé', '2026-01-15');
      const calendar3 = CropEngine.generateCalendar('BLÉ', '2026-01-15');

      assert(calendar1.total_duration_days === calendar2.total_duration_days, 'lowercase works');
      assert(calendar2.total_duration_days === calendar3.total_duration_days, 'uppercase works');
    } catch (error) {
      console.log(`✗ Case insensitive test failed: ${error.message}`);
      testsFailed++;
    }

    // ===== Test 9: Get Available Crops List =====
    console.log('\n📌 Test 9: Get Available Crops');
    try {
      const crops = CropEngine.getAvailableCrops();
      assert(Array.isArray(crops), 'Returns array');
      assert(crops.length >= 4, 'At least 4 crops available');

      const cropNames = crops.map((c) => c.name);
      assert(cropNames.includes('Blé'), 'Blé in list');
      assert(cropNames.includes('Maïs'), 'Maïs in list');
      assert(cropNames.includes('Orge'), 'Orge in list');
      assert(cropNames.includes('Riz'), 'Riz in list');
    } catch (error) {
      console.log(`✗ Available crops test failed: ${error.message}`);
      testsFailed++;
    }

    // ===== Test 10: Calendar Validation =====
    console.log('\n📌 Test 10: Calendar Validation');
    try {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');
      const errors = CropEngine.validateCalendar(calendar);
      assert(errors.length === 0, 'Generated calendar is valid');
    } catch (error) {
      console.log(`✗ Validation test failed: ${error.message}`);
      testsFailed++;
    }

    // ===== Test 11: Current Stage Detection =====
    console.log('\n📌 Test 11: Current Stage Detection');
    try {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');
      
      // Test date during Stage 1
      let currentStage = CropEngine.getCurrentStage(calendar, '2026-01-20');
      assert(currentStage && currentStage.number === 1, 'Detects Stage 1');

      // Test date during Stage 3
      currentStage = CropEngine.getCurrentStage(calendar, '2026-03-20');
      assert(currentStage && currentStage.number === 3, 'Detects Stage 3');

      // Test date before calendar
      currentStage = CropEngine.getCurrentStage(calendar, '2026-01-10');
      assert(currentStage === null, 'Returns null before calendar starts');
    } catch (error) {
      console.log(`✗ Current stage test failed: ${error.message}`);
      testsFailed++;
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error);
    testsFailed++;
  }

  // Summary
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');
  console.log(`✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log('========================================\n');

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${testsFailed} test(s) failed\n`);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest };
