/**
 * Test Suite: Disease Detection Image Display & Analysis Results
 * Validates the entire workflow: image upload -> analysis -> display
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3007/api/v1/disease';
const TEST_USER_ID = 1;
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}`)
};

/**
 * Create a test image file
 */
function createTestImage() {
  // Create a minimal valid PNG (1x1 pixel white)
  const buffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  
  const testDir = path.join(process.cwd(), 'test-images');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filename = `test-crop-${Date.now()}.png`;
  const filepath = path.join(testDir, filename);
  fs.writeFileSync(filepath, buffer);
  
  return filepath;
}

/**
 * Test 1: Image Upload & Disease Analysis
 */
async function testImageUpload() {
  log.section('TEST 1: Image Upload & Disease Analysis');
  
  try {
    const imagePath = createTestImage();
    log.info(`Created test image: ${imagePath}`);
    
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('parcelId', '123');
    
    const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'X-User-ID': TEST_USER_ID
      }
    });
    
    log.success('Image uploaded and analyzed successfully');
    
    // Validate response structure
    const requiredFields = ['id', 'analysisId', 'imageUrl', 'detectedDiseases', 'recommendations'];
    const missingFields = requiredFields.filter(field => !response.data[field]);
    
    if (missingFields.length > 0) {
      log.error(`Missing fields in response: ${missingFields.join(', ')}`);
    } else {
      log.success('All required fields present in response');
    }
    
    // Check imageUrl format
    if (!response.data.imageUrl) {
      log.error('imageUrl is missing');
    } else if (!response.data.imageUrl.startsWith('/')) {
      log.warn(`imageUrl should start with '/': ${response.data.imageUrl}`);
    } else {
      log.success(`imageUrl format correct: ${response.data.imageUrl}`);
    }
    
    // Check diseases detected
    if (!response.data.detectedDiseases || response.data.detectedDiseases.length === 0) {
      log.warn('No diseases detected');
    } else {
      log.success(`Detected ${response.data.detectedDiseases.length} disease(s)`);
      response.data.detectedDiseases.forEach(disease => {
        console.log(`  - ${disease.name} (Confidence: ${(disease.confidence * 100).toFixed(1)}%)`);
      });
    }
    
    // Check recommendations
    const recommendations = response.data.recommendations;
    if (!recommendations || Object.keys(recommendations).length === 0) {
      log.warn('No recommendations provided');
    } else {
      log.success('Recommendations provided:');
      Object.entries(recommendations).forEach(([key, value]) => {
        if (value) console.log(`  - ${key}: ${value.substring(0, 50)}...`);
      });
    }
    
    return response.data.analysisId;
    
  } catch (error) {
    log.error(`Upload test failed: ${error.response?.data?.error?.message || error.message}`);
    return null;
  }
}

/**
 * Test 2: Fetch Analysis Details & Verify Image URL
 */
async function testAnalysisDetails(analysisId) {
  log.section('TEST 2: Fetch Analysis Details & Verify Image URL');
  
  if (!analysisId) {
    log.warn('No analysis ID to test');
    return;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/analysis/${analysisId}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    log.success('Analysis details fetched successfully');
    
    const imageUrl = response.data.data?.imageUrl;
    if (!imageUrl) {
      log.error('imageUrl missing in analysis details');
    } else {
      log.success(`Image URL retrieved: ${imageUrl}`);
      
      // Try to access the image
      try {
        const imageResponse = await axios.get(`http://localhost:3007${imageUrl}`);
        log.success('Image file is accessible via HTTP');
      } catch (imgError) {
        log.error(`Cannot access image at ${imageUrl}: ${imgError.message}`);
      }
    }
    
  } catch (error) {
    log.error(`Details test failed: ${error.message}`);
  }
}

/**
 * Test 3: Analyze History Display
 */
async function testAnalysisHistory() {
  log.section('TEST 3: Analysis History Display');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/history?limit=5&offset=0`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'X-User-ID': TEST_USER_ID
      }
    });
    
    log.success('Analysis history retrieved');
    
    if (!response.data.analyses || response.data.analyses.length === 0) {
      log.warn('No analyses in history');
    } else {
      log.success(`Retrieved ${response.data.analyses.length} analyses`);
      
      response.data.analyses.slice(0, 3).forEach(analysis => {
        console.log(`\n  Analysis ID: ${analysis.id}`);
        console.log(`  Disease: ${analysis.mainDisease}`);
        console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
        console.log(`  Image URL: ${analysis.imageUrl}`);
        
        if (!analysis.imageUrl.startsWith('/')) {
          log.warn(`    ⚠ Image URL should be absolute: ${analysis.imageUrl}`);
        }
      });
    }
    
  } catch (error) {
    log.error(`History test failed: ${error.message}`);
  }
}

/**
 * Test 4: Disease Statistics
 */
async function testDiseaseStatistics() {
  log.section('TEST 4: Disease Statistics Display');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/statistics`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'X-User-ID': TEST_USER_ID
      }
    });
    
    log.success('Disease statistics retrieved');
    
    const stats = response.data;
    console.log(`\n  Total Analyses: ${stats.totalAnalyses}`);
    console.log(`  Successful: ${stats.successfulAnalyses}`);
    console.log(`  Failed: ${stats.failedAnalyses}`);
    
    if (stats.commonDiseases && stats.commonDiseases.length > 0) {
      log.success('Common diseases found:');
      stats.commonDiseases.slice(0, 5).forEach(disease => {
        console.log(`    - ${disease.name}: ${disease.count} (${disease.percentage}%)`);
      });
    }
    
    if (stats.severityDistribution) {
      log.success('Severity distribution:');
      Object.entries(stats.severityDistribution).forEach(([level, count]) => {
        console.log(`    - ${level}: ${count}`);
      });
    }
    
  } catch (error) {
    log.error(`Statistics test failed: ${error.message}`);
  }
}

/**
 * Test 5: High Risk Analyses
 */
async function testHighRiskAnalyses() {
  log.section('TEST 5: High Risk Analyses Display');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/high-risk?confidence=80`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'X-User-ID': TEST_USER_ID
      }
    });
    
    log.success('High-risk analyses retrieved');
    
    if (!response.data.highRiskAnalyses || response.data.highRiskAnalyses.length === 0) {
      log.warn('No high-risk analyses found');
    } else {
      log.success(`Found ${response.data.highRiskAnalyses.length} high-risk analyses`);
      
      response.data.highRiskAnalyses.slice(0, 2).forEach(analysis => {
        console.log(`\n  Analysis ID: ${analysis.id}`);
        console.log(`  Severity: ${analysis.severity}`);
        console.log(`  Image URL: ${analysis.imageUrl}`);
      });
    }
    
  } catch (error) {
    log.error(`High-risk test failed: ${error.message}`);
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Disease Detection - Image Display & Analysis Test   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  try {
    // Check server health first
    log.section('PRE-TEST: Server Health Check');
    try {
      const health = await axios.get(`http://localhost:3007/health`);
      log.success('Server is running and healthy');
    } catch (err) {
      log.error('Server is not responding. Make sure disease-detection-service is running on port 3007');
      process.exit(1);
    }
    
    // Run all tests
    const analysisId = await testImageUpload();
    await testAnalysisDetails(analysisId);
    await testAnalysisHistory();
    await testDiseaseStatistics();
    await testHighRiskAnalyses();
    
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    log.success('All tests completed! Review results above.');
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
  }
}

// Run tests
runAllTests();
