const http = require('http');

/**
 * Test auth service directly (port 3001) without going through proxy
 */
const testData = JSON.stringify({
  email: 'john2@test.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData),
  },
};

console.log('Testing AUTH SERVICE DIRECTLY (port 3001)...');
console.log('Request:', {
  method: options.method,
  url: `http://${options.hostname}:${options.port}${options.path}`,
  headers: options.headers,
  body: JSON.parse(testData),
});

const req = http.request(options, (res) => {
  console.log(`\n✓ Response received!`);
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n✗ Request Error:', error.message);
  console.error('Make sure auth service is running on port 3001');
  console.error('Run: cd auth-service && npm run dev');
});

req.on('timeout', () => {
  console.error('\n✗ Request Timeout - auth service not responding');
  req.destroy();
});

req.setTimeout(5000);

req.write(testData);
req.end();
