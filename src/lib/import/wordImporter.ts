import { prisma } from "@/lib/prisma";
import { WordType } from "@prisma/client";
import * as xlsx from "xlsx";
import Papa from "papaparse";
import { wordRowSchema } from "./validators";
import { batchTranslateToArabic } from "../gemini";

export interface ImportOptions {
  uploadedById: string;
  filename: string;
  buffer: Buffer;
  upsertDuplicates?: boolean;
  wipeData?: boolean;
  useAI?: boolean; // Ali Jitam ❤️: This is now the default path
}

export interface ImportResult {
  batchId: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: any[];
  durationMs: number;
  message?: string;
}

export async function importWordsFromBuffer(opts: ImportOptions): Promise<ImportResult> {
  const start = Date.now();

  // 1. NUCLEAR RESET: Wipe data if requested
  if (opts.wipeData) {
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
    // 2. PARSE FILE
    const decoder = new TextDecoder("utf-8");
    const csvContent = decoder.decode(opts.buffer);
    let rawRows: any[] = [];
    
    if (opts.filename.endsWith(".csv")) {
      const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
      rawRows = parsed.data;
    } else {
      const workbook = xlsx.read(opts.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawRows = xlsx.utils.sheet_to_json(sheet);
    }

    if (rawRows.length === 0) throw new Error("File is empty.");

    // 3. PRE-PROCESS ENTITIES
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

    // 4. 100% AI TRANSLATION (Ignoring CSV Definition)
    // We process in small batches to avoid Gemini timeouts
    const AI_BATCH_SIZE = 20;
    for (let i = 0; i < rawRows.length; i += AI_BATCH_SIZE) {
      const rowChunk = rawRows.slice(i, i + AI_BATCH_SIZE);
      const wordsToTranslate = rowChunk.map(r => String(normaliseRow(r).word || "").trim()).filter(Boolean);
      
      const aiTranslations = await batchTranslateToArabic(wordsToTranslate);

      const wordsToUpsert = [];
      for (const raw of rowChunk) {
        const normalised = normaliseRow(raw);
        
        // Forced Type Mapping
        const rawPos = String(normalised.type || "").toLowerCase();
        if (["preposition", "pronoun", "conjunction"].includes(rawPos)) normalised.type = "other";

        const parsed = wordRowSchema.safeParse(normalised);
        if (!parsed.success) continue;

        const data = parsed.data;
        const unitId = entityMap.get(`${data.level}-${data.unit}`);
        if (!unitId) continue;

        // FORCE AI TRANSLATION (Ignore CSV)
        const finalDefinition = aiTranslations[data.word] || "Translation unavailable";

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

      // Save this batch
      await prisma.$transaction(
        wordsToUpsert.map((row) =>
          prisma.word.upsert({
            where: { unitId_word: { unitId: row.unitId, word: row.word } },
            create: row,
            update: {
              type: row.type,
              definition: row.definition,
              example: row.example,
              difficulty: row.difficulty,
            },
          })
        )
      );
      importedCount += wordsToUpsert.length;
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: "completed", totalRows: rawRows.length, importedCount },
    });

  } catch (err: any) {
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
