const fs = require('fs');
const path = require('path');

// Manually parse .env to get key
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let key = '';
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
  if (match) {
    key = match[1];
  }
});

fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] })
}).then(r => r.json()).then(console.log).catch(console.error);
