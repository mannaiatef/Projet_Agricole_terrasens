const http = require('http');

/**
 * Test HTTP POST to /irrigation/calculate endpoint
 * This simulates what the frontend would send
 */
function makeRequest(parcelId = 1) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({});
    
    const options = {
      hostname: 'localhost',
      port: 3004,
      path: `/irrigation/calculate/${parcelId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    console.log(`\n📤 Sending POST ${options.method} ${options.path}`);
    console.log('Endpoint: http://localhost:3004' + options.path);

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

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function test() {
  try {
    console.log('🧪 Testing HTTP POST to irrigation service...');
    console.log('This will fail with "Parcel not found" because crop-calendar-service is not running');
    console.log('BUT we can monitor if the error is handled properly\n');

    const response = await makeRequest(1);
    
    console.log(`\n✅ Response received (Status: ${response.status})`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Even if it fails, we can see the error handling
    if (response.status !== 201) {
      console.log('\n⚠️  Request failed, but that\'s expected if crop-calendar-service is offline');
      console.log(`The important thing is that the error was handled gracefully`);
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('Is the irrigation service running on port 3004?');
  }
}

test();
