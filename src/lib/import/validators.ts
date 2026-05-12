// =====================================================================
//  src/lib/import/validators.ts
//  Zod schema for a single word row coming from Excel/CSV.
//  Normalises casing and strips whitespace before validation.
// =====================================================================

import { z } from "zod";

// Word types accepted in the spreadsheet (case-insensitive)
const WORD_TYPES = ["noun", "verb", "adjective", "adverb", "preposition", "pronoun", "conjunction", "phrase", "other"] as const;

export const wordRowSchema = z.object({
  /** The vocabulary word itself */
  word: z
    .string({ required_error: "Missing 'Word' column" })
    .trim()
    .min(1, "Word cannot be empty")
    .max(120, "Word is too long"),

  /** Grammatical type */
  type: z
    .string({ required_error: "Missing 'Type' column" })
    .trim()
    .toLowerCase()
    .refine(
      (v) => WORD_TYPES.includes(v as (typeof WORD_TYPES)[number]),
      {
        message: `Type must be one of: ${WORD_TYPES.join(", ")}`,
      }
    )
    .transform((v) => v as (typeof WORD_TYPES)[number]),

  /** Plain-English definition (Optional in AI-First mode) */
  definition: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .default(""),

  /** Example sentence using the word */
  example: z
    .string({ required_error: "Missing 'Example' column" })
    .trim()
    .min(3, "Example sentence is too short")
    .max(2000),

  /** Level number 1–6 */
  level: z.coerce
    .number({ required_error: "Missing 'Level' column" })
    .int()
    .min(1, "Level must be 1–6")
    .max(6, "Level must be 1–6"),

  /** Unit number 1–30 */
  unit: z.coerce
    .number({ required_error: "Missing 'Unit' column" })
    .int()
    .min(1, "Unit must be 1–30")
    .max(30, "Unit must be 1–30"),

  /** Optional IPA phonetic transcription */
  phonetic: z.string().trim().max(120).optional(),

  /** Optional difficulty 1–5 */
  difficulty: z.coerce.number().int().min(1).max(5).optional().default(1),
});

export type WordRow = z.infer<typeof wordRowSchema>;

// ── Column name aliases ─────────────────────────────────────────────
// Maps common alternate column headers → canonical field names.
// This makes the importer tolerant of slightly different spreadsheets.
export const COLUMN_ALIASES: Record<string, keyof WordRow> = {
  // word
  word: "word",
  vocabulary: "word",
  term: "word",
  vocab: "word",

  // type
  type: "type",
  "part of speech": "type",
  pos: "type",
  "word type": "type",

  // definition
  definition: "definition",
  meaning: "definition",
  desc: "definition",
  description: "definition",

  // example
  example: "example",
  sentence: "example",
  "example sentence": "example",
  usage: "example",

  // level
  level: "level",
  "level number": "level",
  lvl: "level",

  // unit
  unit: "unit",
  "unit number": "unit",
  chapter: "unit",
  ch: "unit",

  // optional
  phonetic: "phonetic",
  ipa: "phonetic",
  pronunciation: "phonetic",

  difficulty: "difficulty",
  diff: "difficulty",
};
