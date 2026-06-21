#!/usr/bin/env node

/**
 * Stress Service Validation Agent
 * 
 * Vérifie si les valeurs retournées par le stress-service sont correctes
 * Effectue des tests automatisés sur:
 * - Format des réponses API
 * - Calculs NDVI
 * - Classifications de stress
 * - Zones géographiques
 * - Cohérence des données
 */

const http = require('http');
const https = require('https');

// ============ CONFIGURATION ============
const CONFIG = {
  stressServiceUrl: process.env.STRESS_SERVICE_URL || 'http://localhost:3005',
  cropCalendarServiceUrl: process.env.CROP_CALENDAR_SERVICE_URL || 'http://localhost:3003',
  testParcelIds: (process.env.TEST_PARCEL_IDS || '29,30,31,32,33').split(',').map(id => parseInt(id.trim())),
  apiTimeout: parseInt(process.env.API_TIMEOUT || '30000'),
  ndviPrecision: parseInt(process.env.NDVI_PRECISION_DECIMALS || '4'),
  percentagePrecision: 2,
  verbose: process.argv.includes('--verbose'),
  reportPath: './tests/validation-reports/'
};

// ============ RÉSULTATS DE VALIDATION ============
const validationResults = {
  timestamp: new Date().toISOString(),
  checks: [],
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
  summary: {}
};

// ============ UTILITAIRES ============

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  console.log(`${prefix} ${message}`);
  if (data && CONFIG.verbose) console.log(JSON.stringify(data, null, 2));
}

function recordCheck(name, passed, details = '') {
  validationResults.checks.push({
    name,
    passed,
    timestamp: new Date().toISOString(),
    details
  });
  if (passed) {
    validationResults.passed++;
  } else {
    validationResults.failed++;
  }
}

function recordError(message, error) {
  validationResults.errors.push({
    message,
    error: error?.message || error,
    timestamp: new Date().toISOString()
  });
}

function recordWarning(message) {
  validationResults.warnings.push({
    message,
    timestamp: new Date().toISOString()
  });
}

// ============ HTTP UTILITIES ============

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.apiTimeout
    };

    const req = protocol.request(urlObj, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${CONFIG.apiTimeout}ms`));
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============ VALIDATION NDVI ============

function validateNDVIValue(ndvi, pixelIndex = null) {
  const checks = [];
  
  // Vérifier la plage
  if (ndvi < -1 || ndvi > 1) {
    checks.push({
      name: `NDVI value in range [-1, 1] ${pixelIndex ? `(pixel ${pixelIndex})` : ''}`,
      passed: false,
      actual: ndvi
    });
  } else {
    checks.push({
      name: `NDVI value in range [-1, 1] ${pixelIndex ? `(pixel ${pixelIndex})` : ''}`,
      passed: true
    });
  }

  // Vérifier la précision
  const decimalCount = (ndvi.toString().split('.')[1] || '').length;
  if (decimalCount > CONFIG.ndviPrecision + 2) {
    checks.push({
      name: `NDVI precision acceptable ${pixelIndex ? `(pixel ${pixelIndex})` : ''}`,
      passed: false,
      details: `Expected ≤ ${CONFIG.ndviPrecision} decimals, got ${decimalCount}`
    });
  } else {
    checks.push({
      name: `NDVI precision acceptable ${pixelIndex ? `(pixel ${pixelIndex})` : ''}`,
      passed: true
    });
  }

  return checks;
}

function validateNDVIStatistics(stats) {
  const checks = [];

  // Mean NDVI
  checks.push(...validateNDVIValue(stats.mean_ndvi, 'mean'));

  // Min/Max
  if (stats.min_ndvi > stats.mean_ndvi) {
    checks.push({
      name: 'NDVI min ≤ mean',
      passed: false,
      details: `min=${stats.min_ndvi}, mean=${stats.mean_ndvi}`
    });
  } else {
    checks.push({
      name: 'NDVI min ≤ mean',
      passed: true
    });
  }

  if (stats.max_ndvi < stats.mean_ndvi) {
    checks.push({
      name: 'NDVI max ≥ mean',
      passed: false,
      details: `max=${stats.max_ndvi}, mean=${stats.mean_ndvi}`
    });
  } else {
    checks.push({
      name: 'NDVI max ≥ mean',
      passed: true
    });
  }

  // Std dev (doit être ≥ 0)
  if (stats.std_dev_ndvi && stats.std_dev_ndvi < 0) {
    checks.push({
      name: 'NDVI std deviation ≥ 0',
      passed: false,
      actual: stats.std_dev_ndvi
    });
  } else {
    checks.push({
      name: 'NDVI std deviation ≥ 0',
      passed: true
    });
  }

  return checks;
}

// ============ VALIDATION CLASSIFICATION STRESS ============

function classifyStress(ndvi) {
  if (ndvi > 0.45) return 'healthy';
  if (ndvi > 0.35) return 'medium';
  return 'high';
}

function validateStressClassification(ndvi, expectedClass) {
  const actualClass = classifyStress(ndvi);
  const passed = actualClass === expectedClass;

  return {
    name: `Stress classification for NDVI=${ndvi}`,
    passed,
    actual: actualClass,
    expected: expectedClass
  };
}

function validateStressPercentage(stressedPixels, totalPixels, stressPercentage) {
  const checks = [];

  if (totalPixels === 0) {
    checks.push({
      name: 'Stress percentage with non-zero total',
      passed: false,
      details: 'totalPixels = 0'
    });
    return checks;
  }

  const calculatedPercentage = (stressedPixels / totalPixels) * 100;
  const tolerance = 0.01; // 0.01%

  if (Math.abs(calculatedPercentage - stressPercentage) > tolerance) {
    checks.push({
      name: 'Stress percentage calculation',
      passed: false,
      details: `Expected ${calculatedPercentage.toFixed(2)}%, got ${stressPercentage.toFixed(2)}%`
    });
  } else {
    checks.push({
      name: 'Stress percentage calculation',
      passed: true
    });
  }

  // Vérifier la plage [0, 100]
  if (stressPercentage < 0 || stressPercentage > 100) {
    checks.push({
      name: 'Stress percentage in range [0, 100]',
      passed: false,
      actual: stressPercentage
    });
  } else {
    checks.push({
      name: 'Stress percentage in range [0, 100]',
      passed: true
    });
  }

  return checks;
}

// ============ VALIDATION ZONES GEOJSON ============

function validateGeoJSON(zone) {
  const checks = [];

  // Type check
  if (zone.type !== 'Feature') {
    checks.push({
      name: 'GeoJSON type is Feature',
      passed: false,
      actual: zone.type
    });
  } else {
    checks.push({
      name: 'GeoJSON type is Feature',
      passed: true
    });
  }

  // Geometry check
  if (!zone.geometry) {
    checks.push({
      name: 'GeoJSON has geometry',
      passed: false
    });
    return checks;
  }

  if (zone.geometry.type !== 'Polygon') {
    checks.push({
      name: 'Geometry type is Polygon',
      passed: false,
      actual: zone.geometry.type
    });
  } else {
    checks.push({
      name: 'Geometry type is Polygon',
      passed: true
    });
  }

  // Coordinates validation
  if (!zone.geometry.coordinates || zone.geometry.coordinates.length === 0) {
    checks.push({
      name: 'Polygon has coordinates',
      passed: false
    });
    return checks;
  }

  const ring = zone.geometry.coordinates[0];
  if (ring.length < 4) {
    checks.push({
      name: 'Polygon has at least 4 coordinates (3 unique + closure)',
      passed: false,
      details: `Got ${ring.length} coordinates`
    });
  } else {
    checks.push({
      name: 'Polygon has at least 4 coordinates (3 unique + closure)',
      passed: true
    });
  }

  // First and last coordinate must match (ring closure)
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (JSON.stringify(first) !== JSON.stringify(last)) {
    checks.push({
      name: 'Polygon ring is closed',
      passed: false,
      details: `First ${JSON.stringify(first)} ≠ Last ${JSON.stringify(last)}`
    });
  } else {
    checks.push({
      name: 'Polygon ring is closed',
      passed: true
    });
  }

  // Coordinate precision (should be 6+ decimals for lat/lon)
  ring.forEach((coord, idx) => {
    const [lon, lat] = coord;
    if (Math.abs(lon) > 180 || Math.abs(lat) > 90) {
      checks.push({
        name: `Coordinate ${idx} within valid lat/lon bounds`,
        passed: false,
        actual: coord
      });
    }
  });

  return checks;
}

function validateZoneSummary(summary) {
  const checks = [];

  const levels = ['high', 'medium', 'healthy'];
  
  for (const level of levels) {
    if (!summary[level]) continue;
    
    const levelData = summary[level];
    
    // Zone count
    if (levelData.zone_count && !Number.isInteger(levelData.zone_count)) {
      checks.push({
        name: `${level} zone_count is integer`,
        passed: false,
        actual: typeof levelData.zone_count
      });
    }

    // Average NDVI
    if (levelData.avg_ndvi) {
      checks.push(...validateNDVIValue(levelData.avg_ndvi, `${level} avg`));
      
      // Vérifier cohérence avec le niveau
      const expectedClass = classifyStress(levelData.avg_ndvi);
      if (expectedClass !== level) {
        checks.push({
          name: `${level} avg_ndvi matches classification`,
          passed: false,
          details: `NDVI ${levelData.avg_ndvi} should classify as ${expectedClass}, not ${level}`
        });
      }
    }
  }

  return checks;
}

// ============ VALIDATION ALERTES ============

function validateAlerts(record, alerts) {
  const checks = [];

  // Si stress > 45%, une alerte HIGH doit exister
  if (record.stress_percentage > 45) {
    const hasHighAlert = alerts.some(a => a.severity === 'high');
    checks.push({
      name: 'Alert HIGH exists for stress > 45%',
      passed: hasHighAlert,
      details: `stress=${record.stress_percentage}%, high_alerts=${alerts.filter(a => a.severity === 'high').length}`
    });
  }

  // Si stress > 30%, une alerte doit exister
  if (record.stress_percentage > 30) {
    checks.push({
      name: 'Alerts exist for stress > 30%',
      passed: alerts.length > 0,
      details: `stress=${record.stress_percentage}%, alerts=${alerts.length}`
    });
  }

  // Si stress < 15%, peu ou pas d'alertes attendues
  if (record.stress_percentage < 15 && alerts.length > 0) {
    checks.push({
      name: 'Few/no alerts expected for stress < 15%',
      passed: false,
      details: `stress=${record.stress_percentage}%, alerts=${alerts.length}`
    });
  }

  return checks;
}

// ============ VALIDATION TIMESTAMPS ============

function validateTimestamp(timestamp, fieldName = 'timestamp') {
  const checks = [];

  if (!timestamp) {
    checks.push({
      name: `${fieldName} exists`,
      passed: false
    });
    return checks;
  }

  // ISO 8601 format
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!iso8601Regex.test(timestamp)) {
    checks.push({
      name: `${fieldName} is ISO 8601 format`,
      passed: false,
      actual: timestamp
    });
  } else {
    checks.push({
      name: `${fieldName} is ISO 8601 format`,
      passed: true
    });
  }

  // Must be a valid date
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    checks.push({
      name: `${fieldName} is valid date`,
      passed: false,
      actual: timestamp
    });
  } else {
    checks.push({
      name: `${fieldName} is valid date`,
      passed: true
    });
  }

  return checks;
}

// ============ VALIDATION ENDPOINTS ============

async function validateLatestAnalysis(parcelId) {
  log('INFO', `Validating /stress/parcel/${parcelId}/latest`);
  
  try {
    const url = `${CONFIG.stressServiceUrl}/stress/parcel/${parcelId}/latest`;
    const response = await makeRequest(url);

    // Status code
    recordCheck(`GET /stress/parcel/${parcelId}/latest returns 200`, 
      response.status === 200, 
      `Got ${response.status}`);

    if (response.status !== 200) {
      recordCheck(`Response data exists for parcel ${parcelId}`, false, `HTTP ${response.status}`);
      recordError(`Failed to fetch latest analysis for parcel ${parcelId}`, response.body);
      return;
    }

    const data = response.body.data;

    // Structure validation
    const requiredFields = ['record', 'zones', 'alerts', 'summary', 'heatmap'];
    requiredFields.forEach(field => {
      recordCheck(`Response has ${field}`, 
        field in data, 
        `Field ${field} ${field in data ? 'present' : 'missing'}`);
    });

    if (!data.record) return;

    // Record field validation
    const record = data.record;
    
    recordCheck(`record.parcel_id matches`, 
      record.parcel_id === parcelId, 
      `Expected ${parcelId}, got ${record.parcel_id}`);

    recordCheck(`record.mean_ndvi is number`, 
      typeof record.mean_ndvi === 'number', 
      `Got ${typeof record.mean_ndvi}`);

    recordCheck(`record.stress_percentage is number`, 
      typeof record.stress_percentage === 'number', 
      `Got ${typeof record.stress_percentage}`);

    // NDVI validation
    if (typeof record.mean_ndvi === 'number') {
      validateNDVIValue(record.mean_ndvi).forEach(check => {
        recordCheck(check.name, check.passed, check.details || check.actual);
      });
    }

    // Stress percentage validation
    if (record.pixel_count && record.stressed_pixel_count !== undefined) {
      validateStressPercentage(record.stressed_pixel_count, record.pixel_count, record.stress_percentage)
        .forEach(check => recordCheck(check.name, check.passed, check.details));
    }

    // Zones validation
    if (Array.isArray(data.zones)) {
      recordCheck(`zones is array`, true, `${data.zones.length} zones`);
      data.zones.slice(0, 3).forEach((zone, idx) => {
        validateGeoJSON(zone.geojson).forEach(check => {
          recordCheck(`Zone ${idx}: ${check.name}`, check.passed, check.details);
        });
      });
    }

    // Alerts validation
    if (Array.isArray(data.alerts)) {
      validateAlerts(record, data.alerts).forEach(check => {
        recordCheck(check.name, check.passed, check.details);
      });
    }

    // Summary validation
    if (data.summary) {
      validateZoneSummary(data.summary).forEach(check => {
        recordCheck(check.name, check.passed, check.details);
      });
    }

    // Timestamp validation
    if (record.created_at) {
      validateTimestamp(record.created_at, 'created_at').forEach(check => {
        recordCheck(check.name, check.passed, check.details);
      });
    }

  } catch (error) {
    recordCheck(`Connection to stress-service for parcel ${parcelId}`, false, `Connection error: ${error.message}`);
    recordError(`Error validating latest analysis for parcel ${parcelId}`, error);
  }
}

async function validateJobStatus(parcelId) {
  log('INFO', `Testing job status validation`);
  
  try {
    // First, trigger an analysis
    const analyzeUrl = `${CONFIG.stressServiceUrl}/stress/analyze`;
    const analyzeResponse = await makeRequest(analyzeUrl, 'POST', { parcel_id: parcelId });

    recordCheck(`POST /stress/analyze returns 202`, 
      analyzeResponse.status === 202, 
      `Got ${analyzeResponse.status}`);

    if (analyzeResponse.status !== 202 || !analyzeResponse.body.data?.job_id) {
      recordError('Failed to trigger analysis', analyzeResponse.body);
      return;
    }

    const jobId = analyzeResponse.body.data.job_id;
    log('INFO', `Job triggered: ${jobId}`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check job status
    const jobUrl = `${CONFIG.stressServiceUrl}/stress/jobs/${jobId}`;
    const jobResponse = await makeRequest(jobUrl);

    recordCheck(`GET /stress/jobs/:jobId returns 200`, 
      jobResponse.status === 200, 
      `Got ${jobResponse.status}`);

    if (jobResponse.body.data) {
      const jobData = jobResponse.body.data;
      recordCheck(`Job has id, status, progress`, 
        jobData.id && jobData.status && jobData.progress !== undefined, 
        `status=${jobData.status}, progress=${jobData.progress}`);
    }

  } catch (error) {
    recordCheck(`Job status API connection`, false, `Connection error: ${error.message}`);
    recordError(`Error validating job status`, error);
  }
}

async function validateQueueStats() {
  log('INFO', `Validating /stress/queue/stats`);
  
  try {
    const url = `${CONFIG.stressServiceUrl}/stress/queue/stats`;
    const response = await makeRequest(url);

    recordCheck(`GET /stress/queue/stats returns 200`, 
      response.status === 200, 
      `Got ${response.status}`);

    if (response.body.data) {
      const stats = response.body.data;
      const requiredFields = ['waiting', 'active', 'completed', 'failed'];
      
      requiredFields.forEach(field => {
        recordCheck(`Queue stats has ${field}`, 
          field in stats && typeof stats[field] === 'number', 
          `${stats[field]}`);
      });
    }

  } catch (error) {
    recordCheck(`Queue stats API connection`, false, `Connection error: ${error.message}`);
    recordError(`Error validating queue stats`, error);
  }
}

async function validateHealthCheck() {
  log('INFO', `Validating health check endpoint`);
  
  try {
    const url = `${CONFIG.stressServiceUrl}/health/detailed`;
    const response = await makeRequest(url);

    recordCheck(`GET /health/detailed returns 200`, 
      response.status === 200, 
      `Got ${response.status}`);

  } catch (error) {
    recordWarning(`Health check failed: ${error.message}`);
  }
}

// ============ MAIN VALIDATION WORKFLOW ============

async function runValidation() {
  log('INFO', '========== STRESS SERVICE VALIDATION STARTED ==========');
  log('INFO', `Configuration:`, CONFIG);

  // Check health
  await validateHealthCheck();

  // Validate endpoints for each test parcel
  for (const parcelId of CONFIG.testParcelIds) {
    log('INFO', `\n--- Validating Parcel ${parcelId} ---`);
    await validateLatestAnalysis(parcelId);
    await validateJobStatus(parcelId);
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Validate queue stats
  await validateQueueStats();

  // Summary
  const totalChecks = validationResults.passed + validationResults.failed;
  const passRate = totalChecks > 0 ? (validationResults.passed / totalChecks) * 100 : 0;
  
  log('INFO', '\n========== VALIDATION SUMMARY ==========');
  log('INFO', `Total Checks: ${totalChecks}`);
  log('INFO', `Passed: ${validationResults.passed}`);
  log('INFO', `Failed: ${validationResults.failed}`);
  log('INFO', `Pass Rate: ${passRate.toFixed(2)}%`);
  log('INFO', `Warnings: ${validationResults.warnings.length}`);
  log('INFO', `Errors: ${validationResults.errors.length}`);

  // Save report
  console.log('\n' + JSON.stringify(validationResults, null, 2));

  process.exit(validationResults.failed > 0 ? 1 : 0);
}

// Run validation
runValidation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
