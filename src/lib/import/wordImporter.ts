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
}

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

    // ── 3. Build Level/Unit lookup cache from DB ──────────────────
    const unitCache = await buildUnitCache();

    // ── 4. Validate and group rows into Prisma upsert payloads ────
    const toUpsert: Array<{
      unitId: number;
      word: string;
      type: WordType;
      definition: string;
      example: string;
      phonetic: string | null;
      difficulty: number;
      importBatchId: string;
      createdById: string;
    }> = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 2; // +1 for header, +1 for 1-indexed display
      const raw = rawRows[i];

      // Normalise keys to canonical field names
      const normalised = normaliseRow(raw);

      // Zod validation
      const parsed = wordRowSchema.safeParse(normalised);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join("; ");
        errors.push({ row: rowNum, word: normalised.word as string | undefined, reason: msg });
        continue;
      }

      const data: WordRow = parsed.data;

      // Resolve unit ID
      const unitKey = `${data.level}-${data.unit}`;
      const unitId = unitCache.get(unitKey);
      if (!unitId) {
        errors.push({
          row: rowNum,
          word: data.word,
          reason: `Level ${data.level} Unit ${data.unit} does not exist in the database. Run db:seed first.`,
        });
        continue;
      }

      toUpsert.push({
        unitId,
        word: data.word,
        type: data.type as WordType,
        definition: data.definition,
        example: data.example,
        phonetic: data.phonetic ?? null,
        difficulty: data.difficulty,
        importBatchId: batch.id,
        createdById: opts.uploadedById,
      });
    }

    // ── 5. Batch upsert in chunks of 100 (avoid query size limits) ─
    const CHUNK_SIZE = 100;
    for (let i = 0; i < toUpsert.length; i += CHUNK_SIZE) {
      const chunk = toUpsert.slice(i, i + CHUNK_SIZE);

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
              : {}, // no-op update = skip duplicates silently
          })
        )
      );

      // Count actual inserts vs updates by querying batch words
      // (simplified: just count upserted rows)
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
    // For CSV, XLSX still works; just returns one sheet
    const csvData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",      // empty cells → empty string (not undefined)
      raw: false,
    });
    return csvData;
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
