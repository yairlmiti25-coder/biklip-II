const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from root directory
app.use(express.static(__dirname));

// Fallback route for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(` 🚴 MTB Downhill Game running at: http://localhost:${PORT}`);
  console.log(`================================================`);
});
