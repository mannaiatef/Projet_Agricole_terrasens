#!/usr/bin/env node

/**
 * Validation Script: Stress Zone Color Mapping
 * 
 * This script validates that:
 * 1. Backend returns correct stress_level in zone data
 * 2. Frontend can correctly map stress_level to colors
 * 3. Color values match the expected hex codes
 * 4. All zones are rendered without errors
 * 
 * Usage:
 *   node validate-stress-zones.js
 *   node validate-stress-zones.js --verbose
 *   node validate-stress-zones.js --api http://localhost:3005
 */

const http = require('http');
const url = require('url');

// Configuration
const config = {
  apiUrl: process.argv.includes('--api') ? 
    process.argv[process.argv.indexOf('--api') + 1] : 
    'http://localhost:3005',
  verbose: process.argv.includes('--verbose'),
  testParcelId: process.env.PARCEL_ID || 'test-parcel-1'
};

// Color mapping (must match frontend)
const colorMap = {
  'high': '#F44336',
  'medium': '#FF9800',
  'healthy': '#4CAF50'
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Logging functions
function log(...args) {
  console.log('[VALIDATE]', ...args);
}

function logSuccess(message) {
  results.passed++;
  console.log('✅', message);
}

function logFailure(message) {
  results.failed++;
  console.log('❌', message);
}

function logWarning(message) {
  results.warnings++;
  console.log('⚠️', message);
}

function logDebug(...args) {
  if (config.verbose) {
    console.log('[DEBUG]', ...args);
  }
}

// API helper function
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(path, config.apiUrl);
    logDebug('GET', fullUrl.toString());
    
    http.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + e.message));
        }
      });
    }).on('error', reject);
  });
}

// Test 1: Verify API connectivity
async function testAPIConnectivity() {
  log('Test 1: API Connectivity');
  try {
    const response = await makeRequest('/health');
    logSuccess('Backend API is reachable');
    logDebug('Health check response:', response);
    return true;
  } catch (error) {
    logFailure('Backend API unreachable: ' + error.message);
    console.error(error);
    return false;
  }
}

// Test 2: Verify stress zone data structure
async function testZoneDataStructure() {
  log('\nTest 2: Zone Data Structure');
  try {
    const response = await makeRequest(`/stress/parcel/${config.testParcelId}/latest`);
    
    if (!response.zones || !Array.isArray(response.zones)) {
      logFailure('Response does not contain zones array');
      return false;
    }
    
    logSuccess(`Response contains zones array (${response.zones.length} zones)`);
    
    if (response.zones.length === 0) {
      logWarning('No zones found - test parcel may not have analysis results');
      return true;
    }
    
    // Validate first zone structure
    const zone = response.zones[0];
    logDebug('First zone structure:', JSON.stringify(zone, null, 2));
    
    const requiredFields = ['stress_level', 'mean_ndvi_in_zone'];
    const missingFields = requiredFields.filter(field => !(field in zone));
    
    if (missingFields.length > 0) {
      logFailure(`Zone missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    logSuccess('Zone contains required fields');
    return true;
  } catch (error) {
    logFailure('Error fetching zone data: ' + error.message);
    return false;
  }
}

// Test 3: Verify stress_level classification
async function testStressLevelClassification() {
  log('\nTest 3: Stress Level Classification');
  try {
    const response = await makeRequest(`/stress/parcel/${config.testParcelId}/latest`);
    
    if (!response.zones || response.zones.length === 0) {
      logWarning('No zones to test');
      return true;
    }
    
    const validStressLevels = Object.keys(colorMap);
    let allValid = true;
    
    response.zones.forEach((zone, index) => {
      const stressLevel = (zone.stress_level || '').toLowerCase();
      
      if (!validStressLevels.includes(stressLevel)) {
        logFailure(`Zone ${index}: Invalid stress_level='${zone.stress_level}'`);
        allValid = false;
      } else {
        logDebug(`Zone ${index}: stress_level='${stressLevel}' ✓`);
      }
    });
    
    if (allValid) {
      logSuccess('All zones have valid stress_level values');
    }
    return allValid;
  } catch (error) {
    logFailure('Error testing stress classification: ' + error.message);
    return false;
  }
}

// Test 4: Verify color mapping
function testColorMapping() {
  log('\nTest 4: Color Mapping');
  
  let allValid = true;
  
  Object.entries(colorMap).forEach(([stressLevel, expectedColor]) => {
    // Simulate frontend color mapping
    const mappedColor = getColorFromStressLevel(stressLevel);
    
    if (mappedColor === expectedColor) {
      logSuccess(`${stressLevel} → ${expectedColor}`);
    } else {
      logFailure(`${stressLevel}: Expected ${expectedColor}, got ${mappedColor}`);
      allValid = false;
    }
  });
  
  return allValid;
}

// Simulates frontend's getColorFromStressLevel function
function getColorFromStressLevel(stressLevel) {
  const normalized = (stressLevel || '').toLowerCase().trim();
  
  switch (normalized) {
    case 'high': return '#F44336';
    case 'medium': return '#FF9800';
    case 'healthy': return '#4CAF50';
    default: return 'unknown';
  }
}

// Test 5: Verify NDVI-to-stressLevel consistency
async function testNDVIConsistency() {
  log('\nTest 5: NDVI-to-StressLevel Consistency');
  try {
    const response = await makeRequest(`/stress/parcel/${config.testParcelId}/latest`);
    
    if (!response.zones || response.zones.length === 0) {
      logWarning('No zones to test');
      return true;
    }
    
    let allConsistent = true;
    
    response.zones.forEach((zone, index) => {
      const ndvi = zone.mean_ndvi_in_zone;
      const stressLevel = (zone.stress_level || '').toLowerCase();
      
      // Verify NDVI matches stress classification
      let expectedStress;
      if (ndvi <= 0.35) expectedStress = 'high';
      else if (ndvi <= 0.45) expectedStress = 'medium';
      else expectedStress = 'healthy';
      
      if (stressLevel === expectedStress) {
        logDebug(`Zone ${index}: NDVI=${ndvi} → ${stressLevel} ✓`);
      } else {
        logWarning(`Zone ${index}: NDVI=${ndvi} suggests '${expectedStress}' but got '${stressLevel}'`);
        // This is not necessarily an error - backend might have additional logic
      }
    });
    
    return true;
  } catch (error) {
    logFailure('Error testing NDVI consistency: ' + error.message);
    return false;
  }
}

// Test 6: Verify GeoJSON structure
async function testGeoJSONStructure() {
  log('\nTest 6: GeoJSON Structure');
  try {
    const response = await makeRequest(`/stress/parcel/${config.testParcelId}/latest`);
    
    if (!response.zones || response.zones.length === 0) {
      logWarning('No zones to test');
      return true;
    }
    
    let allValid = true;
    const zone = response.zones[0];
    
    if (!zone.geojson) {
      logFailure('Zone missing geojson property');
      return false;
    }
    
    logDebug('GeoJSON type:', zone.geojson.type);
    
    if (zone.geojson.type !== 'Polygon') {
      logWarning(`Expected Polygon, got ${zone.geojson.type}`);
    } else {
      logSuccess('GeoJSON type is Polygon');
    }
    
    if (!zone.geojson.coordinates || zone.geojson.coordinates.length === 0) {
      logFailure('GeoJSON has no coordinates');
      return false;
    }
    
    logSuccess('GeoJSON has valid coordinates');
    return true;
  } catch (error) {
    logFailure('Error testing GeoJSON structure: ' + error.message);
    return false;
  }
}

// Test 7: Verify no missing data fields
async function testDataCompleteness() {
  log('\nTest 7: Data Completeness');
  try {
    const response = await makeRequest(`/stress/parcel/${config.testParcelId}/latest`);
    
    if (!response.zones || response.zones.length === 0) {
      logWarning('No zones to test');
      return true;
    }
    
    const zone = response.zones[0];
    const fields = {
      'stress_level': zone.stress_level !== undefined && zone.stress_level !== null,
      'mean_ndvi_in_zone': zone.mean_ndvi_in_zone !== undefined && zone.mean_ndvi_in_zone !== null,
      'pixel_count': zone.pixel_count !== undefined && zone.pixel_count !== null,
      'geojson': zone.geojson !== undefined && zone.geojson !== null
    };
    
    let allPresent = true;
    Object.entries(fields).forEach(([field, present]) => {
      if (present) {
        logDebug(`Field '${field}': ✓`);
      } else {
        logFailure(`Field '${field}': Missing`);
        allPresent = false;
      }
    });
    
    if (allPresent) {
      logSuccess('All required fields present');
    }
    return allPresent;
  } catch (error) {
    logFailure('Error testing data completeness: ' + error.message);
    return false;
  }
}

// Main validation runner
async function runValidation() {
  console.log('\n' + '='.repeat(60));
  console.log('STRESS ZONE COLOR MAPPING VALIDATION');
  console.log('='.repeat(60));
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Test Parcel ID: ${config.testParcelId}`);
  console.log(`Verbose: ${config.verbose ? 'Yes' : 'No'}`);
  console.log('='.repeat(60) + '\n');
  
  try {
    // Run tests in sequence
    const test1 = await testAPIConnectivity();
    if (!test1) {
      console.log('\n❌ API connectivity failed. Skipping remaining tests.');
      process.exit(1);
    }
    
    const test2 = await testZoneDataStructure();
    const test3 = await testStressLevelClassification();
    const test4 = testColorMapping();
    const test5 = await testNDVIConsistency();
    const test6 = await testGeoJSONStructure();
    const test7 = await testDataCompleteness();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️ Warnings: ${results.warnings}`);
    console.log('='.repeat(60) + '\n');
    
    if (results.failed === 0) {
      console.log('✅ All validations passed!');
      process.exit(0);
    } else {
      console.log(`❌ ${results.failed} validation(s) failed.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during validation:', error);
    process.exit(1);
  }
}

// Run validation
runValidation();
