// Simple runner that uses root node_modules
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting ServeIQ API...');

const apiProcess = spawn('npx', ['ts-node', 'apps/api/src/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

apiProcess.on('error', (err) => {
  console.error('Failed to start API:', err);
});
