// =====================================================================
//  src/lib/import/wordImporter.ts
//  Core import engine shared by both the API route and the CLI script.
//
//  Supports: .xlsx, .xls, .csv
//  Strategy:
//    1. Parse file → raw rows
//    2. Normalise column headers via alias map
//    3. Validate each row with Zod (collect errors, don't abort)
//    4. Resolve Level/Unit IDs from DB (cached in memory per import)
//    5. Upsert words in a Prisma transaction (batched for performance)
//    6. Update ImportBatch record with final counts
// =====================================================================

import * as XLSX from "xlsx";
import { prisma } from "../prisma";
import { wordRowSchema, COLUMN_ALIASES, WordRow } from "./validators";
import type { WordType } from "@prisma/client";

// ─────────────────────────────────────────────
//  Public types
// ─────────────────────────────────────────────

export interface ImportOptions {
  /** ID of the admin user doing the import */
  uploadedById: string;
  /** Original filename (for audit log) */
  filename: string;
  /** File content as a Buffer (works for both xlsx and csv) */
  buffer: Buffer;
  /** If true, duplicate words in the same unit are updated (not skipped) */
  upsertDuplicates?: boolean;
  wipeData?: boolean; // Nuclear Reset
  useAI?: boolean;   // AI Auto-translate
}

import { translateToArabic, batchTranslateToArabic } from "../gemini";

export interface ImportResult {
  batchId: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: RowError[];
  durationMs: number;
}

interface RowError {
  row: number;
  word?: string;
  reason: string;
}

// ─────────────────────────────────────────────
//  Main import function
// ─────────────────────────────────────────────

export async function importWordsFromBuffer(opts: ImportOptions): Promise<ImportResult> {
  const start = Date.now();

  // 1. NUCLEAR RESET: Wipe data if requested
  if (opts.wipeData) {
    console.warn("[IMPORT] NUCLEAR RESET: Wiping all words...");
    await prisma.word.deleteMany({});
  }

  // ── 1. Create ImportBatch record ─────────────────────────────────
  const batch = await prisma.importBatch.create({
    data: {
      filename: opts.filename,
      uploadedById: opts.uploadedById,
      totalRows: 0, // updated at end
      status: "processing",
    },
  });

  const errors: RowError[] = [];
  let importedCount = 0;
  let skippedCount = 0;

  try {
    // ── 2. Parse file into raw rows ───────────────────────────────
    const rawRows = parseFile(opts.buffer, opts.filename);
    const totalRows = rawRows.length;

    if (totalRows === 0) {
      throw new Error("File contains no data rows. Check that row 1 is the header.");
    }

    // 2. PRE-PROCESS ENTITIES: Ensure all Levels and Units exist
    // This avoids race conditions in batch inserts
    const entityMap = new Map<string, number>(); // "level-unit" -> unitId
    
    // Extract unique levels and units from rows
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

    // 3. AI TRANSLATION: Collect words needing translation
    const wordsToTranslate: string[] = [];
    if (opts.useAI) {
      rawRows.forEach((row: any) => {
        const normalised = normaliseRow(row);
        const word = String(normalised.word || "").trim();
        const definition = String(normalised.definition || "").trim();
        // If definition is empty or contains weird characters (basic check)
        if (word && (!definition || /[\uFFFD]/.test(definition))) {
          wordsToTranslate.push(word);
        }
      });
    }

    const aiTranslations = opts.useAI ? await batchTranslateToArabic(wordsToTranslate) : {};

    // 4. PREPARE BATCH UPSERT
    const wordsToUpsert = [];
    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 2; // +1 for header, +1 for 1-indexed display
      const raw = rawRows[i];

      // Normalise keys to canonical field names
      const normalised = normaliseRow(raw);

      // Pre-process types to pass strict validation as requested
      const rawPos = String(normalised.type || "").toLowerCase();
      if (["preposition", "pronoun", "conjunction"].includes(rawPos)) {
        normalised.type = "other";
      }

      // Zod validation
      const parsed = wordRowSchema.safeParse(normalised);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join("; ");
        errors.push({ row: rowNum, word: normalised.word as string | undefined, reason: msg });
        continue;
      }

      const data: WordRow = parsed.data;

      // Resolve unit ID from entity map
      const unitId = entityMap.get(`${data.level}-${data.unit}`);
      if (!unitId) {
        errors.push({
          row: rowNum,
          word: data.word,
          reason: `Failed to resolve Level ${data.level} Unit ${data.unit}.`,
        });
        continue;
      }

      // Apply AI translation if needed
      let finalDefinition = data.definition;
      if (opts.useAI && (!finalDefinition || /[\uFFFD]/.test(finalDefinition))) {
        finalDefinition = aiTranslations[data.word] || finalDefinition;
      }

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

    // ── 5. Batch upsert in chunks (atomic hits for speed) ─
    const CHUNK_SIZE = 50; 
    for (let i = 0; i < wordsToUpsert.length; i += CHUNK_SIZE) {
      const chunk = wordsToUpsert.slice(i, i + CHUNK_SIZE);

      await prisma.$transaction(
        chunk.map((row) =>
          prisma.word.upsert({
            where: {
              unitId_word: { unitId: row.unitId, word: row.word },
            },
            create: row,
            update: opts.upsertDuplicates
              ? {
                type: row.type,
                definition: row.definition,
                example: row.example,
                difficulty: row.difficulty,
                importBatchId: row.importBatchId,
              }
              : {}, 
          })
        )
      );

      importedCount += chunk.length;
    }

    // Words that failed validation are counted as errors
    skippedCount = errors.length;

    // ── 6. Finalise ImportBatch ───────────────────────────────────
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        totalRows,
        importedCount,
        skippedCount,
        errorCount: errors.length,
        errorLog: errors.length > 0 ? (errors as any) : undefined,
        status: "done",
      },
    });

    return {
      batchId: batch.id,
      totalRows,
      importedCount,
      skippedCount,
      errorCount: errors.length,
      errors,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    // Mark batch as failed
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: "failed", errorLog: [{ reason: String(err) }] },
    }).catch(() => { }); // don't throw if update itself fails

    throw err;
  }
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

/**
 * Parses .xlsx / .xls / .csv files into an array of plain objects.
 * The first row is treated as the header.
 */
function parseFile(buffer: Buffer, filename: string): Record<string, unknown>[] {
  const ext = filename.split(".").pop()?.toLowerCase();

  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,   // parse date cells as JS Date
    raw: false,  // format numbers as strings for consistent handling
  });

  // Always use the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Excel file has no sheets.");

  const sheet = workbook.Sheets[sheetName];

  if (ext === "csv") {
    // MANDATORY FIX FOR ARABIC SYMBOLS: Use TextDecoder
    const csvText = new TextDecoder("utf-8").decode(buffer);
    const workbookFromCsv = XLSX.read(csvText, { type: "string" });
    const sheet = workbookFromCsv.Sheets[workbookFromCsv.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
}

/**
 * Normalises raw spreadsheet column keys to canonical field names
 * using COLUMN_ALIASES. Handles extra whitespace and mixed case.
 */
function normaliseRow(raw: Record<string, unknown>): Record<string, unknown> {
  const normalised: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const cleanKey = key.trim().toLowerCase();
    const canonical = COLUMN_ALIASES[cleanKey];
    if (canonical) {
      normalised[canonical] = value;
    }
    // Unknown columns are silently ignored
  }

  return normalised;
}

/**
 * Fetches all units from the DB once and builds a Map:
 *   "levelNumber-unitNumber" → unitId
 *
 * This avoids N+1 queries during import.
 */
async function buildUnitCache(): Promise<Map<string, number>> {
  const units = await prisma.unit.findMany({
    include: { level: { select: { number: true } } },
  });

  const cache = new Map<string, number>();
  for (const unit of units) {
    const key = `${unit.level.number}-${unit.number}`;
    cache.set(key, unit.id);
  }
  return cache;
}
