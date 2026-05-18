const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateUnit1Content() {
  const prompt = `
You are an expert curriculum developer. Generate the exact vocabulary and interactive reading story for Unit 1 of the book "4000 Essential English Words 1 (2nd Edition)".

ELITE HIGH-DENSITY CONSTRAINTS:
1. Provide exactly 20 words for Unit 1.
2. For each word, include:
   - "word", "type", "phonetic" (IPA)
   - "meaningArabic" (Arabic meaning) and "typeArabic" (Arabic type)
   - "definition" (comprehensive English definition)
   - "example" (Main example sentence) and "sentenceArabic" (its Arabic translation)
   - "sentence2", "sentence2Arabic" (Extra context sentence 1 + translation)
   - "sentence3", "sentence3Arabic" (Extra context sentence 2 + translation)
   - "sentence4", "sentence4Arabic" (Extra context sentence 3 + translation)
   - "synonyms" (exactly 4 synonyms, comma-separated)
   - "antonyms" (exactly 4 antonyms, comma-separated)
   - "collocations" (3 key collocations, comma-separated)

3. For the story, inject "The Amalfi Coast" broken into bite-sized 2-3 sentence chunks.

Respond ONLY with a raw, valid JSON object matching exactly this structure:
{
  "title": "Unit 1 — The Amalfi Coast",
  "words": [
    {
      "word": "english word",
      "type": "noun|verb|adjective|...",
      "phonetic": "/ɪɡˈzæmpəl/",
      "meaningArabic": "Arabic meaning",
      "typeArabic": "اسم | فعل | ...",
      "definition": "Comprehensive definition",
      "example": "Main example sentence.",
      "sentenceArabic": "Main example Arabic.",
      "sentence2": "Extra sentence 2.",
      "sentence2Arabic": "Extra sentence 2 Arabic.",
      "sentence3": "Extra sentence 3.",
      "sentence3Arabic": "Extra sentence 3 Arabic.",
      "sentence4": "Extra sentence 4.",
      "sentence4Arabic": "Extra sentence 4 Arabic.",
      "synonyms": "syn1, syn2, syn3, syn4",
      "antonyms": "ant1, ant2, ant3, ant4",
      "collocations": "colloc1, colloc2, colloc3"
    }
  ],
  "story": {
    "title": "The Amalfi Coast",
    "content": [
      { "en": "Short English sentence chunk 1.", "ar": "Arabic translation 1." },
      { "en": "Short English sentence chunk 2.", "ar": "Arabic translation 2." }
    ],
    "quizData": [
      { "question": "Question 1", "options": ["A", "B", "C", "D"], "answerIndex": 0 }
    ]
  }
}
Note: Ensure valid JSON, no markdown formatting blocks.
`;

  let retries = 3;
  while (retries > 0) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const response = result.response.text();
      return JSON.parse(response);
    } catch (err) {
      console.error("Failed generating Unit 1, retrying...", err.message);
      retries--;
      if (retries === 0) throw err;
      await sleep(2000);
    }
  }
}

async function main() {
  console.log("Starting Elite Reconstruction Purge...");

  // 1. Purge all existing data
  await prisma.story.deleteMany({});
  await prisma.word.deleteMany({});
  await prisma.unit.deleteMany({});
  console.log("✓ Purged old low-density data.");

  const level = await prisma.level.upsert({
    where: { number: 1 },
    update: {},
    create: { number: 1, title: "Level 1 — Beginner", colorTheme: "#4f46e5" }
  });

  console.log("\\n=================================");
  console.log("Synthesizing High-Density Unit 1...");
  
  await sleep(2000); // 2-second rate-limit armor

  const data = await generateUnit1Content();

  console.log("✓ Generated Elite JSON for Unit 1. Upserting to Database...");

  const unit = await prisma.unit.upsert({
    where: { levelId_number: { levelId: level.id, number: 1 } },
    update: { title: data.title },
    create: { levelId: level.id, number: 1, title: data.title }
  });

  for (const w of data.words) {
    await prisma.word.upsert({
      where: { unitId_word: { unitId: unit.id, word: w.word.toLowerCase() } },
      update: {
        type: w.type,
        definition: w.definition,
        example: w.example,
        meaningArabic: w.meaningArabic,
        typeArabic: w.typeArabic,
        sentenceArabic: w.sentenceArabic,
        sentence2: w.sentence2,
        sentence2Arabic: w.sentence2Arabic,
        sentence3: w.sentence3,
        sentence3Arabic: w.sentence3Arabic,
        sentence4: w.sentence4,
        sentence4Arabic: w.sentence4Arabic,
        synonyms: w.synonyms,
        antonyms: w.antonyms,
        collocations: w.collocations,
        phonetic: w.phonetic || null
      },
      create: {
        unitId: unit.id,
        word: w.word.toLowerCase(),
        type: w.type,
        definition: w.definition,
        example: w.example,
        meaningArabic: w.meaningArabic,
        typeArabic: w.typeArabic,
        sentenceArabic: w.sentenceArabic,
        sentence2: w.sentence2,
        sentence2Arabic: w.sentence2Arabic,
        sentence3: w.sentence3,
        sentence3Arabic: w.sentence3Arabic,
        sentence4: w.sentence4,
        sentence4Arabic: w.sentence4Arabic,
        synonyms: w.synonyms,
        antonyms: w.antonyms,
        collocations: w.collocations,
        phonetic: w.phonetic || null,
        difficulty: 1
      }
    });
  }

  await prisma.story.upsert({
    where: { unitId: unit.id },
    update: {
      title: data.story.title,
      content: data.story.content,
      quizData: data.story.quizData
    },
    create: {
      unitId: unit.id,
      title: data.story.title,
      content: data.story.content,
      quizData: data.story.quizData
    }
  });

  console.log("✓ Unit 1 Elite Standard packed successfully. (20 words, 1 story)");
  console.log("\\n🚀 Phase 2 SEEDING COMPLETE.");
}

main()
  .catch(e => {
    console.error("SEED FATAL ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
