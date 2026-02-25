const http = require('http');

const postData = JSON.stringify({ username: 'admin', password: 'admin123' });

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', res.headers);
  res.setEncoding('utf8');
  let raw = '';
  res.on('data', (chunk) => { raw += chunk; });
  res.on('end', () => {
    console.log('BODY:', raw);
  });
});

req.on('error', (e) => {
  console.error('problem with request:', e.message);
});

req.write(postData);
req.end();
