const express = require('express');
const { join } = require('path');
const fs = require('fs');

const app = express();

// Ensure test uploads directory exists
const uploadsDir = join(process.cwd(), 'tmp_uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
fs.writeFileSync(join(uploadsDir, 'test.png'), 'dummy file content');

app.use('/uploads', (req, res, next) => {
  console.log('Middleware hit!');
  console.log('req.baseUrl:', req.baseUrl);
  console.log('req.path:', req.path);
  console.log('req.url:', req.url);
  
  const filename = req.path.replace(/^\//, '');
  const filePath = join(process.cwd(), 'tmp_uploads', filename);
  console.log('Resolved filePath:', filePath);
  console.log('Exists:', fs.existsSync(filePath));
  
  if (!fs.existsSync(filePath)) {
    next();
    return;
  }
  res.sendFile(filePath);
});

app.use((req, res) => {
  res.status(404).send('Not Found via fallback');
});

const port = 4209;
const server = app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  
  // Make a test request using dynamic import of node-fetch or native fetch
  fetch(`http://localhost:${port}/uploads/test.png`)
    .then(r => r.text())
    .then(text => {
      console.log('Response:', text);
      
      // Cleanup
      fs.unlinkSync(join(uploadsDir, 'test.png'));
      fs.rmdirSync(uploadsDir);
      server.close();
    })
    .catch(e => {
      console.error(e);
      server.close();
    });
});
