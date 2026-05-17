import { prisma } from "@/lib/prisma";
import { WordType } from "@prisma/client";
import * as xlsx from "xlsx";
import Papa from "papaparse";
import { wordRowSchema } from "./validators";
import { batchTranslateToArabic } from "../gemini";

export interface ImportOptions {
  userId: string;
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
      userId: opts.userId,
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

    // 4. PURE BATCH UPSERT (No AI, zero latency)
    // We process in small batches for reliability
    const BATCH_SIZE = 50;
    for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
      const rowChunk = rawRows.slice(i, i + BATCH_SIZE);
      const wordsToUpsert = [];

      for (const raw of rowChunk) {
        const normalised = normaliseRow(raw);

        // Safety: map any truly unknown types to 'other'
        const rawPos = String(normalised.type || "").toLowerCase();
        const VALID_TYPES = ["noun", "verb", "adjective", "adverb", "preposition", "pronoun", "conjunction", "phrase", "other"];
        if (rawPos && !VALID_TYPES.includes(rawPos)) normalised.type = "other";

        const parsed = wordRowSchema.safeParse(normalised);
        if (!parsed.success) {
          errors.push({ row: i + rowChunk.indexOf(raw) + 2, word: raw.word || "Unknown", reason: parsed.error.errors[0].message });
          continue;
        }

        const data = parsed.data;
        const unitId = entityMap.get(`${data.level}-${data.unit}`);
        if (!unitId) continue;

        wordsToUpsert.push({
          unitId,
          word: data.word,
          type: data.type as WordType,
          definition: data.definition,
          example: data.example,
          phonetic: data.phonetic ?? null,
          difficulty: data.difficulty,
          meaningArabic: data.meaningArabic || "—",
          typeArabic: data.typeArabic || "—",
          sentenceArabic: data.sentenceArabic || "—",
          sentence2: data.sentence2 || null,
          sentence3: data.sentence3 || null,
          sentence4: data.sentence4 || null,
          collocations: data.collocations || null,
          antonyms: data.antonyms || null,
          importBatchId: batch.id,
          createdById: opts.userId,
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
              meaningArabic: row.meaningArabic,
              typeArabic: row.typeArabic,
              sentenceArabic: row.sentenceArabic,
              sentence2: row.sentence2,
              sentence3: row.sentence3,
              sentence4: row.sentence4,
              collocations: row.collocations,
              antonyms: row.antonyms,
              phonetic: row.phonetic,
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
    meaningArabic: find(["meaningarabic", "meaning arabic"]),
    typeArabic: find(["typearabic", "type arabic"]),
    sentenceArabic: find(["sentencearabic", "sentence arabic"]),
    sentence2: find(["sentence2", "sentence 2"]),
    sentence3: find(["sentence3", "sentence 3"]),
    sentence4: find(["sentence4", "sentence 4"]),
    collocations: find(["collocations"]),
    antonyms: find(["antonyms"]),
  };
}
