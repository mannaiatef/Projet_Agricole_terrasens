const http = require('http');

const postData = JSON.stringify({
  name: 'Test Farmer',
  email: 'test@terrasens.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  console.log(`\n📤 Registration Request Test`);
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log(`\n📥 Response Data:`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

console.log('📬 Sending registration request...');
req.write(postData);
req.end();
