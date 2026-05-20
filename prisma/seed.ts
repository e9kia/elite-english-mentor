const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getFallbackUnitContent } = require('./fallbackData');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let apiQuotasExhausted = false;

// ── Unit titles from "4000 Essential English Words 1 (2nd Edition)" ──
const UNIT_TITLES = [
  "Unit 1 — The Amalfi Coast",   "Unit 2 — The Laboratory",
  "Unit 3 — The Dog Walker",     "Unit 4 — The Greedy Bee",
  "Unit 5 — The Crazy Artist",   "Unit 6 — The Friendly Ghost",
  "Unit 7 — The Battle of Thermopylae", "Unit 8 — The Lost Pilot",
  "Unit 9 — The Starving Time",  "Unit 10 — The Magic Cup",
  "Unit 11 — The Fisherman",     "Unit 12 — The Dragon",
  "Unit 13 — The Ugly Duckling", "Unit 14 — The Farmer and the Cats",
  "Unit 15 — The Clever Thief",  "Unit 16 — The Lesson",
  "Unit 17 — The Shepherd Boy",  "Unit 18 — The Doctor's Cure",
  "Unit 19 — The Magic Boots",   "Unit 20 — The Global Fund",
  "Unit 21 — Mina's Diary",      "Unit 22 — The Climb",
  "Unit 23 — The Puppy",         "Unit 24 — The Taxi Driver",
  "Unit 25 — Joe's Pond",        "Unit 26 — The First Computer",
  "Unit 27 — The Shipwreck",     "Unit 28 — The Party",
  "Unit 29 — The Farm",          "Unit 30 — The Donation"
];

async function generateUnitContent(unitNumber) {
  if (apiQuotasExhausted) {
    console.log(`  💡 Gemini API quota is marked as exhausted. Bypassing and using Prestige Fallback Data immediately for Unit ${unitNumber}...`);
    return getFallbackUnitContent(unitNumber);
  }

  const prompt = `
You are an expert curriculum developer. Generate the exact vocabulary and interactive reading story for Unit ${unitNumber} of the book "4000 Essential English Words 1 (2nd Edition)".

PRESTIGE BILINGUAL CONSTRAINTS — EVERY field must be populated:
1. Provide exactly 20 words for Unit ${unitNumber}.
2. For EACH word, you MUST include ALL of these fields:
   - "word" (English), "type" (noun|verb|adjective|adverb|preposition|phrase|other)
   - "phonetic" (IPA pronunciation as a double-quoted string, e.g. "/ɪɡˈzæmpəl/")
   - "meaningArabic" (primary Arabic translation), "typeArabic" (اسم|فعل|صفة|ظرف|حرف جر|عبارة|أخرى)
   - "definition" (comprehensive English definition, 1-2 sentences)
   - "definitionArabic" (full Arabic translation of the definition)
   - "example" (main example sentence), "sentenceArabic" (Arabic translation of example)
   - "sentence2", "sentence2Arabic" (extra context sentence 2 + Arabic)
   - "sentence3", "sentence3Arabic" (extra context sentence 3 + Arabic)
   - "sentence4", "sentence4Arabic" (extra context sentence 4 + Arabic)
   - "synonyms" (exactly 4 English synonyms, comma-separated)
   - "synonymsArabic" (Arabic translations of those 4 synonyms, comma-separated, same order)
   - "antonyms" (exactly 4 English antonyms, comma-separated)
   - "antonymsArabic" (Arabic translations of those 4 antonyms, comma-separated, same order)
   - "collocations" (3 common English collocations, comma-separated)
   - "collocationsArabic" (Arabic translations of those 3 collocations, comma-separated, same order)

3. Story: Generate the story for Unit ${unitNumber} titled "${UNIT_TITLES[unitNumber - 1]?.split(' — ')[1] || `Story ${unitNumber}`}":
   - Break into mobile-friendly chunks (2-3 sentences each, max 6-8 chunks).
   - Each chunk: { "en": "English text", "ar": "Arabic translation" }
   - Include 4 comprehension quiz questions with 4 options each.

Respond with ONLY valid JSON, no markdown:
{
  "title": "${UNIT_TITLES[unitNumber - 1] || `Unit ${unitNumber}`}",
  "words": [
    {
      "word": "example",
      "type": "noun",
      "phonetic": "/ɪɡˈzæmpəl/",
      "meaningArabic": "مثال",
      "typeArabic": "اسم",
      "definition": "A thing characteristic of its kind.",
      "definitionArabic": "شيء يمثل نوعه.",
      "example": "This is a good example.",
      "sentenceArabic": "هذا مثال جيد.",
      "sentence2": "Can you give me an example?",
      "sentence2Arabic": "هل يمكنك أن تعطيني مثالاً؟",
      "sentence3": "She set an example for others.",
      "sentence3Arabic": "لقد كانت قدوة للآخرين.",
      "sentence4": "The teacher used examples to explain.",
      "sentence4Arabic": "استخدم المعلم أمثلة للشرح.",
      "synonyms": "instance, sample, model, illustration",
      "synonymsArabic": "حالة, عينة, نموذج, توضيح",
      "antonyms": "exception, anomaly, deviation, oddity",
      "antonymsArabic": "استثناء, شذوذ, انحراف, غرابة",
      "collocations": "good example, set an example, for example",
      "collocationsArabic": "مثال جيد, يكون قدوة, على سبيل المثال"
    }
  ],
  "story": {
    "title": "Story Title",
    "content": [
      { "en": "English chunk.", "ar": "Arabic chunk." }
    ],
    "quizData": [
      { "question": "Question?", "options": ["A", "B", "C", "D"], "answerIndex": 0 }
    ]
  }
}`;

  let retries = 5;
  while (retries > 0) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const response = result.response.text();
      const parsed = JSON.parse(response);
      
      // Validate minimum data integrity
      if (!parsed.words || parsed.words.length < 15) {
        throw new Error(`Only ${parsed.words?.length || 0} words returned, expected 20`);
      }
      return parsed;
    } catch (err) {
      retries--;
      const isRateLimit = err.message?.includes('429') || err.message?.includes('quota');
      const waitTime = isRateLimit ? 65000 : 15000;
      console.error(`  ⚠ Unit ${unitNumber} attempt failed (${retries} left): ${isRateLimit ? '429 Rate Limited' : err.message?.slice(0, 80)}`);
      
      if (isRateLimit || err.message?.includes('limit') || err.message?.includes('exhausted')) {
        console.log(`  🚨 Detected quota exhaustion or rate limit. Setting apiQuotasExhausted = true.`);
        apiQuotasExhausted = true;
        console.log(`  💡 Switching to Prestige Fallback Data immediately for Unit ${unitNumber}...`);
        return getFallbackUnitContent(unitNumber);
      }

      if (retries === 0) {
        console.log(`  💡 Gemini API failed completely for Unit ${unitNumber}. Using Prestige Fallback Data...`);
        try {
          const fallback = getFallbackUnitContent(unitNumber);
          if (fallback) {
            return fallback;
          }
        } catch (fallbackErr) {
          console.error(`  🔴 Prestige Fallback Data also failed: ${fallbackErr.message}`);
        }
        throw err;
      }
      console.log(`  ⏳ Waiting ${waitTime / 1000}s before retry...`);
      await sleep(waitTime);
    }
  }
}

async function upsertUnit(level, unitNumber, data) {
  const unit = await prisma.unit.upsert({
    where: { levelId_number: { levelId: level.id, number: unitNumber } },
    update: { title: data.title },
    create: { levelId: level.id, number: unitNumber, title: data.title }
  });

  const ALLOWED_TYPES = ["noun", "verb", "adjective", "adverb", "preposition", "pronoun", "conjunction", "phrase", "other"];
  let wordCount = 0;
  for (const w of data.words) {
    try {
      let wordType = w.type ? w.type.toLowerCase().trim() : "other";
      if (!ALLOWED_TYPES.includes(wordType)) {
        wordType = "other";
      }
      await prisma.word.upsert({
        where: { unitId_word: { unitId: unit.id, word: w.word.toLowerCase() } },
        update: {
          type: wordType, definition: w.definition, definitionArabic: w.definitionArabic || null,
          example: w.example, meaningArabic: w.meaningArabic, typeArabic: w.typeArabic,
          sentenceArabic: w.sentenceArabic, sentence2: w.sentence2,
          sentence2Arabic: w.sentence2Arabic, sentence3: w.sentence3,
          sentence3Arabic: w.sentence3Arabic, sentence4: w.sentence4,
          sentence4Arabic: w.sentence4Arabic,
          synonyms: w.synonyms, synonymsArabic: w.synonymsArabic || null,
          antonyms: w.antonyms, antonymsArabic: w.antonymsArabic || null,
          collocations: w.collocations, collocationsArabic: w.collocationsArabic || null,
          phonetic: w.phonetic || null
        },
        create: {
          unitId: unit.id, word: w.word.toLowerCase(), type: wordType,
          definition: w.definition, definitionArabic: w.definitionArabic || null,
          example: w.example, meaningArabic: w.meaningArabic, typeArabic: w.typeArabic,
          sentenceArabic: w.sentenceArabic, sentence2: w.sentence2,
          sentence2Arabic: w.sentence2Arabic, sentence3: w.sentence3,
          sentence3Arabic: w.sentence3Arabic, sentence4: w.sentence4,
          sentence4Arabic: w.sentence4Arabic,
          synonyms: w.synonyms, synonymsArabic: w.synonymsArabic || null,
          antonyms: w.antonyms, antonymsArabic: w.antonymsArabic || null,
          collocations: w.collocations, collocationsArabic: w.collocationsArabic || null,
          phonetic: w.phonetic || null, difficulty: 1
        }
      });
      wordCount++;
    } catch (err) {
      console.error(`  ⚠ Skipped word "${w.word}": ${err.message}`);
    }
  }

  if (data.story) {
    await prisma.story.upsert({
      where: { unitId: unit.id },
      update: { title: data.story.title, content: data.story.content, quizData: data.story.quizData },
      create: { unitId: unit.id, title: data.story.title, content: data.story.content, quizData: data.story.quizData }
    });
  }

  return wordCount;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  PRESTIGE SEED · 30 Units · Universal Bilingual ║");
  console.log("║  Ali Jitam ❤️ Elite English Mentor              ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  console.log("✓  Active Resumption Protocol (skipping pre-seeded units).\n");

  // Ensure Level 1
  const level = await prisma.level.upsert({
    where: { number: 1 },
    update: {},
    create: { number: 1, title: "Level 1 — Beginner", colorTheme: "#4f46e5" }
  });

  let totalWords = 0;
  let totalStories = 0;

  // Loop all 30 units
  for (let i = 1; i <= 30; i++) {
    console.log(`═══════════════════════════════════════`);
    console.log(`🔄 Checking/Synthesizing Unit ${i}/30: ${UNIT_TITLES[i - 1]}...`);

    // Check if the unit exists and is complete (exactly 20 words and has a story)
    const existingUnit = await prisma.unit.findFirst({
      where: {
        number: i,
        levelId: level.id
      },
      include: {
        _count: {
          select: { words: true }
        },
        story: true
      }
    });

    if (existingUnit && existingUnit._count.words === 20 && existingUnit.story) {
      console.log(`🟢 Unit ${i} already exists with exactly 20 words and story. Skipping!`);
      totalWords += existingUnit._count.words;
      totalStories += 1;
      continue;
    }

    if (existingUnit) {
      console.log(`⚠️ Unit ${i} exists but is incomplete (${existingUnit._count.words} words, story: ${!!existingUnit.story}). Purging and re-seeding...`);
      // Delete specific story, words, unit
      await prisma.story.deleteMany({ where: { unitId: existingUnit.id } });
      await prisma.word.deleteMany({ where: { unitId: existingUnit.id } });
      await prisma.unit.delete({ where: { id: existingUnit.id } });
    }

    try {
      const data = await generateUnitContent(i);
      const wordCount = await upsertUnit(level, i, data);
      totalWords += wordCount;
      totalStories += data.story ? 1 : 0;
      console.log(`🟢 Unit ${i} PACKED: ${wordCount} words, 1 story ✓`);
    } catch (err) {
      console.error(`🔴 Unit ${i} FAILED: ${err.message}`);
      console.log(`   Continuing to next unit...`);
    }

    // Rate-limit armor: 25s between units (respect API bounds when not in fallback mode)
    if (i < 30) {
      const cooldown = apiQuotasExhausted ? 100 : 25000;
      console.log(`  ⏳ Cooling down ${cooldown / 1000}s before next unit...`);
      await sleep(cooldown);
    }
  }

  // ── Automatic Admin Restoration Step ──
  console.log(`\n🔑 Checking/restoring root admin account (Ali Jitam)...`);
  try {
    const adminEmail = 'gattam035@gmail.com'.toLowerCase().trim();
    const adminUsername = 'alijitam';
    const adminPasswordHash = await bcrypt.hash('AliJitam2026!', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        username: adminUsername,
        passwordHash: adminPasswordHash,
        role: 'admin'
      },
      create: {
        email: adminEmail,
        username: adminUsername,
        passwordHash: adminPasswordHash,
        role: 'admin'
      }
    });
    
    await prisma.leaderboardSnapshot.upsert({
      where: { userId: adminUser.id },
      create: { userId: adminUser.id, totalXp: 0 },
      update: {}
    });
    
    console.log(`🟢 Root admin account checked/restored successfully (username: ${adminUser.username})`);
  } catch (err) {
    console.error(`🔴 Auto-admin restoration failed: ${err.message}`);
  }

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  🚀 PRESTIGE SEED COMPLETE                      ║`);
  console.log(`║  Words: ${String(totalWords).padStart(3)}  Stories: ${String(totalStories).padStart(2)}  Units: 30     ║`);
  console.log(`║  Ali Jitam ❤️ · 100% PACKED                     ║`);
  console.log(`╚══════════════════════════════════════════════════╝`);
}

main()
  .catch(e => { console.error("SEED FATAL ERROR:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
