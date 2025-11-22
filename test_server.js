const http = require('http');

const hostname = '0.0.0.0';
const port = 8001;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('exit', (code) => {
  console.log(`Process exited with code: ${code}`);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Exiting...');
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Exiting...');
  process.exit();
});

console.log(`Attempting to start server on ${hostname}:${port}...`);

const server = http.createServer((req, res) => {
  console.log(`Received request from ${req.socket.remoteAddress}`);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

server.on('error', (e) => {
  console.error('Server error:', e);
});

