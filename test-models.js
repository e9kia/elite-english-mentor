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

async function testModel(modelName) {
  try {
    console.log(`Testing ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Hello! Reply with exactly 'Success!'" }] }]
    });
    console.log(`Response from ${modelName}:`, result.response.text().trim());
    return true;
  } catch (error) {
    console.error(`ERROR with ${modelName}:`, error.message.slice(0, 200));
    return false;
  }
}

async function main() {
  const models = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.5-flash"
  ];
  for (const m of models) {
    await testModel(m);
    console.log('-------------------');
  }
}
main();


