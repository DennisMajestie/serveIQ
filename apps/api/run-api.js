const { execSync } = require('child_process');
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('Starting ServeIQ API...');
  execSync('npx ts-node src/index.ts', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('Error:', e);
}
