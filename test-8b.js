const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Manually parse .env to get key
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let apiKey = '';
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
  if (match) {
    apiKey = match[1];
  }
});

process.env.GEMINI_API_KEY = apiKey;
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
  const models = ["gemini-1.5-flash-8b", "gemini-1.5-flash-8b-latest"];
  for (const m of models) {
    try {
      console.log(`Testing ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Hello! Reply with exactly 'Success!'" }] }]
      });
      console.log(`Response from ${m}:`, result.response.text().trim());
    } catch (error) {
      console.error(`ERROR with ${m}:`, error.message);
    }
    console.log('-------------------');
  }
}
main();
