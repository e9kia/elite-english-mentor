// =====================================================================
//  src/lib/gemini.ts
//  Gemini AI integration — Model chain with timeout + fallback
//  Model chain: gemini-2.5-flash → gemini-2.0-flash-lite → gemini-2.0-flash
//  Designed by Ali Jitam ❤️
// =====================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateLocalFallback } from "./fallback";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Updated model chain — confirmed working models for v2/v3 API keys
const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

const AI_TIMEOUT_MS = 8000; // 8 second max per attempt

export interface FlashcardAIData {
  translation: string;       // Arabic translation
  posArabic: string;         // Part of speech in Arabic (اسم، فعل، etc.)
  examples: {
    english: string;
    arabic: string;
  }[];
}

/**
 * Wraps a promise with a timeout. Rejects if the promise takes too long.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`AI timeout after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Try generating content across the model chain with timeout.
 * Returns null if all models fail.
 */
async function tryModelChain(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing.");
    return null;
  }

  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`[gemini] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await withTimeout(
        model.generateContent(prompt),
        AI_TIMEOUT_MS
      );
      const text = result.response.text().trim();
      console.log(`[gemini] Success with model: ${modelName}`);
      return text;
    } catch (err) {
      const msg = String(err);
      console.warn(`[gemini] ${modelName} failed: ${msg.slice(0, 200)}`);
      // Don't retry on quota errors
      if (msg.includes("429") || msg.includes("quota")) break;
    }
  }

  return null;
}

export async function translateToArabic(word: string): Promise<string> {
  const prompt = `You are an expert English-Arabic translator for a premium learning platform.
Translate the English word "${word}" to Arabic.
Provide the Arabic translation followed by a very brief Arabic explanation of the meaning.
Example format: "تفاحة - فاكهة مستديرة حمراء أو خضراء"
Return ONLY the Arabic text, no English, no numbering.`;

  const text = await tryModelChain(prompt);
  if (text) return text;

  // Fallback
  return generateLocalFallback(word, "other", word, "").translation;
}

/**
 * Generate RICH flashcard data for a word: Arabic translation, POS in Arabic,
 * and exactly 3 practical usage examples in both English and Arabic.
 * Falls back to local database if AI fails.
 */
export async function generateFlashcardData(
  word: string,
  type: string,
  definition?: string,
  example?: string
): Promise<FlashcardAIData> {
  const fallback = generateLocalFallback(word, type, definition ?? word, example ?? "");

  const prompt = `You are an expert English-Arabic language instructor for the premium platform "Elite English Mentor" by Ali Jitam.

For the English word "${word}" (${type}), provide:
1. A clear Arabic translation
2. The part of speech in Arabic (e.g., اسم for noun, فعل for verb, صفة for adjective, ظرف for adverb, حرف جر for preposition, ضمير for pronoun, حرف عطف for conjunction, عبارة for phrase)
3. Exactly 3 practical, real-world usage examples. Each example must have both an English sentence and its Arabic translation. The examples should show the word used in different, practical contexts.

Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{"translation":"الترجمة العربية","posArabic":"اسم","examples":[{"english":"Example sentence 1.","arabic":"جملة المثال 1."},{"english":"Example sentence 2.","arabic":"جملة المثال 2."},{"english":"Example sentence 3.","arabic":"جملة المثال 3."}]}`;

  const text = await tryModelChain(prompt);
  if (!text) return fallback;

  try {
    const jsonStr = text.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (parsed.translation && Array.isArray(parsed.examples) && parsed.examples.length >= 3) {
      return {
        translation: parsed.translation,
        posArabic: parsed.posArabic || type,
        examples: parsed.examples.slice(0, 3),
      };
    }
    return fallback;
  } catch {
    console.error(`[gemini] JSON parse failed for ${word}`);
    return fallback;
  }
}

export async function batchTranslateToArabic(words: string[]): Promise<Record<string, string>> {
  if (words.length === 0) return {};

  const wordList = words.map((w, i) => `${i + 1}. ${w}`).join("\n");
  const prompt = `You are an expert English-Arabic translator for a premium learning platform called "Elite English Mentor".
Translate these English words to Arabic. For each word, provide a high-quality translation that includes the main Arabic meaning and a very brief explanation in Arabic.

Words to translate:
${wordList}

Return ONLY a valid JSON object where keys are the exact English words and values are Arabic translations.
Example format: {"apple": "تفاحة - فاكهة مستديرة حمراء أو خضراء", "family": "عائلة - مجموعة من الأشخاص المرتبطين"}
Do NOT wrap in markdown code blocks. Return raw JSON only.`;

  const text = await tryModelChain(prompt);
  if (!text) {
    // Fallback: return translations from local dictionary
    const result: Record<string, string> = {};
    words.forEach(w => {
      const fb = generateLocalFallback(w, "other", w, "");
      result[w] = fb.translation;
    });
    return result;
  }

  try {
    const jsonStr = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(jsonStr);
  } catch {
    const result: Record<string, string> = {};
    words.forEach(w => {
      const fb = generateLocalFallback(w, "other", w, "");
      result[w] = fb.translation;
    });
    return result;
  }
}
