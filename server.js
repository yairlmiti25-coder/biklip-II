const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve matter-js from node_modules
app.use('/vendor/matter.js', express.static(path.join(__dirname, 'node_modules', 'matter-js', 'build', 'matter.min.js')));

// Fallback route for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(` 🚴 MTB Downhill Game running at: http://localhost:${PORT}`);
  console.log(`================================================`);
});
