// Minimal test server to verify Node.js is working
const http = require('http');

const PORT = 8080;

console.log('Creating HTTP server...');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(JSON.stringify({
    message: 'Test server is working!',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  }, null, 2));
});

console.log('Starting server...');

server.listen(PORT, () => {
  console.log(`✅ Test server running at http://localhost:${PORT}`);
  console.log('Try visiting: http://localhost:8080');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

console.log('Server setup complete.');
