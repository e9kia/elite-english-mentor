#!/usr/bin/env node
// =====================================================================
//  scripts/importWords.js
//  Standalone CLI import script — no server needed.
//
//  Usage:
//    node scripts/importWords.js --file ./data/level1.xlsx
//    node scripts/importWords.js --file ./data/words.csv --upsert
//
//  Options:
//    --file    <path>  Path to .xlsx, .xls, or .csv file  (required)
//    --admin   <id>    Admin user UUID from DB             (optional, uses env ADMIN_ID)
//    --upsert          Update existing words instead of skipping duplicates
//    --dry-run         Validate only, no DB writes
//    --help            Show this help message
// =====================================================================

"use strict";

const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");

const prisma = new PrismaClient({
  log: ["error"],
});

// ── CLI argument parsing ─────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes("--help") || args.length === 0) {
  console.log(`
  📚  4000 Essential Words — Bulk Import CLI
  
  Usage:
    node scripts/importWords.js --file <path> [options]
  
  Options:
    --file    <path>   Path to .xlsx / .xls / .csv file  (required)
    --admin   <uuid>   Admin user UUID (or set ADMIN_ID env var)
    --upsert           Update words that already exist in the same unit
    --dry-run          Parse and validate without writing to DB
    --help             Show this help
  
  Excel column names (case-insensitive aliases supported):
    Word / Vocabulary / Term
    Type / Part of Speech / POS
    Definition / Meaning
    Example / Sentence
    Level / Lvl
    Unit / Chapter
    Phonetic / IPA         (optional)
    Difficulty             (optional, 1–5)
  `);
  process.exit(0);
}

const fileArg = getArg("--file");
const adminArg = getArg("--admin") || process.env.ADMIN_ID;
const isDryRun = args.includes("--dry-run");
const doUpsert = args.includes("--upsert");

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

// ── Validation schema (mirrors TypeScript version) ───────────────────
const WORD_TYPES = ["noun", "verb", "adjective", "adverb", "phrase", "other"];

const COLUMN_ALIASES = {
  word: "word", vocabulary: "word", term: "word", vocab: "word",
  type: "type", "part of speech": "type", pos: "type", "word type": "type",
  definition: "definition", meaning: "definition", desc: "definition", description: "definition",
  example: "example", sentence: "example", "example sentence": "example", usage: "example",
  level: "level", "level number": "level", lvl: "level",
  unit: "unit", "unit number": "unit", chapter: "unit", ch: "unit",
  phonetic: "phonetic", ipa: "phonetic", pronunciation: "phonetic",
  difficulty: "difficulty", diff: "difficulty",
};

const wordRowSchema = z.object({
  word: z.string().trim().min(1).max(120),
  type: z.string().trim().toLowerCase().refine(v => WORD_TYPES.includes(v), {
    message: `Type must be one of: ${WORD_TYPES.join(", ")}`,
  }),
  definition: z.string().trim().min(3).max(1000),
  example: z.string().trim().min(3).max(2000),
  level: z.coerce.number().int().min(1).max(6),
  unit: z.coerce.number().int().min(1).max(30),
  phonetic: z.string().trim().max(120).optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional().default(1),
});

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  // Validate file path
  if (!fileArg) {
    console.error("❌  --file argument is required. Use --help for usage.");
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`❌  File not found: ${filePath}`);
    process.exit(1);
  }

  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  if (![".xlsx", ".xls", ".csv"].includes(ext)) {
    console.error(`❌  Unsupported file type: ${ext}. Use .xlsx, .xls, or .csv`);
    process.exit(1);
  }

  console.log(`\n📂  File:    ${filePath}`);
  console.log(`🔧  Mode:    ${isDryRun ? "DRY RUN (no DB writes)" : doUpsert ? "UPSERT (update duplicates)" : "INSERT (skip duplicates)"}`);
  console.log("─".repeat(60));

  // ── 1. Parse file ────────────────────────────────────────────────
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`📊  Raw rows found: ${rawRows.length}`);

  if (rawRows.length === 0) {
    console.error("❌  No data rows found. Is row 1 the header row?");
    process.exit(1);
  }

  // ── 2. Normalise and validate rows ───────────────────────────────
  const errors = [];
  const validatedRows = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2; // 1-indexed, accounting for header
    const raw = rawRows[i];
    const normalised = {};

    for (const [key, value] of Object.entries(raw)) {
      const alias = COLUMN_ALIASES[key.trim().toLowerCase()];
      if (alias) normalised[alias] = value;
    }

    const result = wordRowSchema.safeParse(normalised);
    if (!result.success) {
      const msg = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
      errors.push({ row: rowNum, word: normalised.word, reason: msg });
    } else {
      validatedRows.push({ rowNum, data: result.data });
    }
  }

  // ── 3. Report validation results ─────────────────────────────────
  console.log(`✅  Valid rows:   ${validatedRows.length}`);
  console.log(`❌  Invalid rows: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n⚠️   Validation errors:");
    errors.slice(0, 20).forEach(e =>
      console.log(`    Row ${String(e.row).padStart(4)}: [${e.word || "?"}] ${e.reason}`)
    );
    if (errors.length > 20) {
      console.log(`    ... and ${errors.length - 20} more errors.`);
    }
  }

  if (isDryRun) {
    console.log("\n🔍  DRY RUN complete. No data written.");
    process.exit(0);
  }

  if (validatedRows.length === 0) {
    console.log("⚠️   Nothing to import.");
    process.exit(0);
  }

  // ── 4. Resolve admin user ────────────────────────────────────────
  let adminUserId = adminArg;
  if (!adminUserId) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    if (!admin) {
      console.error("❌  No admin user found. Run `npm run db:seed` first, or pass --admin <uuid>.");
      process.exit(1);
    }
    adminUserId = admin.id;
    console.log(`\n👤  Using admin: ${admin.email} (${admin.id})`);
  }

  // ── 5. Build unit cache ──────────────────────────────────────────
  console.log("\n🗄️   Loading level/unit structure from DB...");
  const units = await prisma.unit.findMany({
    include: { level: { select: { number: true } } },
  });

  const unitCache = new Map();
  for (const u of units) {
    unitCache.set(`${u.level.number}-${u.number}`, u.id);
  }
  console.log(`    Found ${unitCache.size} units in DB`);

  // ── 6. Create ImportBatch ────────────────────────────────────────
  const batch = await prisma.importBatch.create({
    data: {
      filename,
      userId: adminUserId,
      totalRows: rawRows.length,
      importedCount: 0,
      status: "processing",
    },
  });
  console.log(`\n📋  Import batch created: ${batch.id}`);

  // ── 7. Upsert words in chunks ────────────────────────────────────
  const CHUNK_SIZE = 100;
  let imported = 0;
  let skipped = 0;
  const importErrors = [...errors];

  const toImport = [];
  for (const { rowNum, data } of validatedRows) {
    const unitKey = `${data.level}-${data.unit}`;
    const unitId = unitCache.get(unitKey);

    if (!unitId) {
      importErrors.push({
        row: rowNum, word: data.word,
        reason: `Level ${data.level} Unit ${data.unit} not found. Run db:seed.`,
      });
      continue;
    }

    toImport.push({ unitId, data, rowNum });
  }

  process.stdout.write("\n⬆️   Importing");
  for (let i = 0; i < toImport.length; i += CHUNK_SIZE) {
    const chunk = toImport.slice(i, i + CHUNK_SIZE);

    await prisma.$transaction(
      chunk.map(({ unitId, data }) =>
        prisma.word.upsert({
          where: { unitId_word: { unitId, word: data.word } },
          create: {
            unitId,
            word: data.word,
            type: data.type,
            definition: data.definition,
            example: data.example,
            phonetic: data.phonetic ?? null,
            difficulty: data.difficulty,
            importBatchId: batch.id,
            createdById: adminUserId,
          },
          update: doUpsert ? {
            type: data.type,
            definition: data.definition,
            example: data.example,
            phonetic: data.phonetic ?? null,
            difficulty: data.difficulty,
          } : {},
        })
      )
    );

    imported += chunk.length;
    process.stdout.write(".");
  }
  console.log(" done!");

  // ── 8. Finalise batch ────────────────────────────────────────────
  skipped = importErrors.length;
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      importedCount: imported,
      skippedCount: skipped,
      errorCount: importErrors.length,
      errorLog: importErrors.length > 0 ? importErrors : undefined,
      status: "done",
    },
  });

  // ── 9. Summary ───────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("📊  IMPORT SUMMARY");
  console.log("─".repeat(60));
  console.log(`   Total rows in file : ${rawRows.length}`);
  console.log(`   Successfully saved : ${imported}`);
  console.log(`   Errors / skipped   : ${importErrors.length}`);
  console.log(`   Batch ID           : ${batch.id}`);
  console.log("─".repeat(60));

  if (importErrors.length > 0) {
    console.log("\n⚠️   Errors (first 20):");
    importErrors.slice(0, 20).forEach(e =>
      console.log(`   Row ${String(e.row).padStart(4)}: [${e.word || "?"}] ${e.reason}`)
    );
  }

  if (imported > 0) {
    console.log(`\n🎉  Done! ${imported} words are now in the database.`);
  }
}

main()
  .catch(err => { console.error("\n❌  Fatal error:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
