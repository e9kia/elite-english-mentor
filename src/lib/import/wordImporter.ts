import { prisma } from "@/lib/prisma";
import { WordType, Level, Unit } from "@prisma/client";
import * as xlsx from "xlsx";
import Papa from "papaparse";
import { z } from "zod";
import { wordRowSchema, WordRow } from "./validators";
import { translateToArabic, batchTranslateToArabic } from "../gemini";

export interface ImportOptions {
  uploadedById: string;
  filename: string;
  buffer: Buffer;
  upsertDuplicates?: boolean;
  wipeData?: boolean;
  useAI?: boolean;
}

export interface ImportResult {
  batchId: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: any[];
  durationMs: number;
}

export async function importWordsFromBuffer(opts: ImportOptions): Promise<ImportResult> {
  const start = Date.now();

  // 1. NUCLEAR RESET: Wipe data if requested
  if (opts.wipeData) {
    console.warn("[IMPORT] NUCLEAR RESET: Wiping all words, units, and levels...");
    await prisma.word.deleteMany({});
    await prisma.unit.deleteMany({});
    await prisma.level.deleteMany({});
  }

  const batch = await prisma.importBatch.create({
    data: {
      filename: opts.filename,
      uploadedById: opts.uploadedById,
      totalRows: 0,
      status: "processing",
    },
  });

  const errors: any[] = [];
  let importedCount = 0;

  try {
    // 2. FORCE UTF-8 DECODING (Arabic Fix)
    const decoder = new TextDecoder("utf-8");
    const csvContent = decoder.decode(opts.buffer);
    
    let rawRows: any[] = [];
    if (opts.filename.endsWith(".csv")) {
      const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
      rawRows = parsed.data;
    } else {
      // For XLSX, we use the buffer directly but xlsx handles internal encoding
      const workbook = xlsx.read(opts.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawRows = xlsx.utils.sheet_to_json(sheet);
    }

    if (rawRows.length === 0) throw new Error("File contains no data.");

    // 3. PRE-PROCESS ENTITIES: Ensure all Levels and Units exist
    const entityMap = new Map<string, number>(); 
    const uniqueUnits = new Set<string>();
    
    rawRows.forEach((row: any) => {
      const normalised = normaliseRow(row);
      const lvl = parseInt(String(normalised.level));
      const unt = parseInt(String(normalised.unit));
      if (!isNaN(lvl) && !isNaN(unt)) uniqueUnits.add(`${lvl}-${unt}`);
    });

    for (const key of Array.from(uniqueUnits)) {
      const [lvlNum, untNum] = key.split("-").map(Number);
      const level = await prisma.level.upsert({
        where: { number: lvlNum },
        update: {},
        create: { number: lvlNum, title: `Level ${lvlNum}` },
      });
      const unit = await prisma.unit.upsert({
        where: { levelId_number: { levelId: level.id, number: untNum } },
        update: {},
        create: { levelId: level.id, number: untNum, title: `Unit ${untNum}` },
      });
      entityMap.set(key, unit.id);
    }

    // 4. AI-FIRST: Fetch translations if useAI is ON
    const wordsToTranslate: string[] = [];
    if (opts.useAI) {
      rawRows.forEach((row: any) => {
        const normalised = normaliseRow(row);
        const word = String(normalised.word || "").trim();
        if (word) wordsToTranslate.push(word);
      });
    }

    const aiTranslations = opts.useAI ? await batchTranslateToArabic(wordsToTranslate) : {};

    // 5. PREPARE BATCH
    const wordsToUpsert = [];
    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 2; 
      const raw = rawRows[i];
      const normalised = normaliseRow(raw);

      // Pre-process types
      const rawPos = String(normalised.type || "").toLowerCase();
      if (["preposition", "pronoun", "conjunction"].includes(rawPos)) normalised.type = "other";

      const parsed = wordRowSchema.safeParse(normalised);
      if (!parsed.success) {
        errors.push({ row: rowNum, word: String(normalised.word), reason: parsed.error.errors[0].message });
        continue;
      }

      const data = parsed.data;
      const unitId = entityMap.get(`${data.level}-${data.unit}`);
      
      if (!unitId) {
        errors.push({ row: rowNum, word: data.word, reason: "Failed to resolve unit" });
        continue;
      }

      // AI-FIRST Logic: If useAI is ON, ignore CSV definition
      const finalDefinition = opts.useAI ? (aiTranslations[data.word] || "AI Processing...") : data.definition;

      wordsToUpsert.push({
        unitId,
        word: data.word,
        type: data.type as WordType,
        definition: finalDefinition,
        example: data.example,
        phonetic: data.phonetic ?? null,
        difficulty: data.difficulty,
        importBatchId: batch.id,
        createdById: opts.uploadedById,
      });
    }

    // 6. BATCH TRANSACTION
    const CHUNK_SIZE = 50;
    for (let i = 0; i < wordsToUpsert.length; i += CHUNK_SIZE) {
      const chunk = wordsToUpsert.slice(i, i + CHUNK_SIZE);
      await prisma.$transaction(
        chunk.map((row) =>
          prisma.word.upsert({
            where: { unitId_word: { unitId: row.unitId, word: row.word } },
            create: row,
            update: opts.upsertDuplicates ? {
              type: row.type,
              definition: row.definition,
              example: row.example,
              difficulty: row.difficulty,
            } : {},
          })
        )
      );
      importedCount += chunk.length;
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: "completed", totalRows: rawRows.length, importedCount },
    });

  } catch (err: any) {
    console.error("[IMPORT ERROR]", err);
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: "failed", error: err.message },
    });
    throw err;
  }

  return {
    batchId: batch.id,
    totalRows: importedCount,
    importedCount,
    skippedCount: 0,
    errorCount: errors.length,
    errors,
    durationMs: Date.now() - start,
  };
}

function normaliseRow(row: any) {
  const keys = Object.keys(row);
  const find = (options: string[]) => {
    const key = keys.find((k) => options.includes(k.toLowerCase().trim()));
    return key ? row[key] : undefined;
  };

  return {
    word: find(["word", "english", "term"]),
    type: find(["type", "pos", "partofspeech"]),
    definition: find(["definition", "translation", "arabic", "meaning"]),
    example: find(["example", "sentence", "usage"]),
    level: find(["level", "levelnumber"]),
    unit: find(["unit", "unitnumber"]),
    difficulty: parseInt(String(find(["difficulty", "diff"]) || "1")),
    phonetic: find(["phonetic", "ipa"]),
  };
}
