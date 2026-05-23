#!/usr/bin/env node

const http = require('http');

// Test helper function
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJqb2huMkB0ZXN0LmNvbSIsImlhdCI6MTcxMjA2MTczNH0.rFUhfOwl_iLrKJMvhZNDLo0jZQwpPCmnf41o0PSFQ3c'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('Testing Terrasens API Endpoints...\n');

  try {
    console.log('1. Testing GET /api/fields...');
    const fieldsResponse = await makeRequest('GET', '/api/fields');
    console.log(`   Status: ${fieldsResponse.status}`);
    console.log(`   Message: ${fieldsResponse.body?.message || 'N/A'}`);
    console.log(`   Data count: ${fieldsResponse.body?.data?.length || 'N/A'}\n`);

    console.log('2. Testing POST /api/parcelles/4/assign-crop...');
    const assignCropResponse = await makeRequest('POST', '/api/parcelles/4/assign-crop', {
      crop_id: 1,
      sowing_date: '2024-04-02'
    });
    console.log(`   Status: ${assignCropResponse.status}`);
    console.log(`   Message: ${assignCropResponse.body?.message || 'N/A'}\n`);

    // Summary
    console.log('Results:');
    console.log(`✓ Fields endpoint: ${fieldsResponse.status === 200 ? 'OK' : 'FAILED'}`);
    console.log(`✓ Assign-crop endpoint: ${assignCropResponse.status === 200 ? 'OK' : 'FAILED'}`);
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

setTimeout(runTests, 2000); // Wait 2 seconds for servers to be ready
