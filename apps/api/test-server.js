console.log('Testing server setup...');
const express = require('express');
console.log('Express loaded');
const app = express();
console.log('Express app created');

app.get('/', (req, res) => {
  res.send('Hello from test server!');
});

app.listen(4206, () => {
  console.log('Test server running on http://localhost:4206');
});
