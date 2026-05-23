const http = require('http');

// Test the login endpoint
const postData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123',
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('Testing API Gateway Login Endpoint...');
console.log('Request:', {
  method: options.method,
  url: `http://${options.hostname}:${options.port}${options.path}`,
  body: JSON.parse(postData),
});

const req = http.request(options, (res) => {
  console.log(`\nResponse Status: ${res.statusCode}`);
  console.log('Response Headers:', res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error.message);
  console.error('This could indicate:');
  console.error('- API Gateway is not running on port 3000');
  console.error('- Auth Service is not running on port 3001');
  console.error('- There is a proxy configuration issue');
});

req.write(postData);
req.end();

console.log('\nNote: Auth service must be running on port 3001 for this test to succeed.');
console.log('Also ensure API gateway has been restarted to apply the recent fixes.\n');
