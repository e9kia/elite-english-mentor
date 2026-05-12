import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface FlashcardAIData {
  translation: string;       // Arabic translation
  posArabic: string;         // Part of speech in Arabic (اسم، فعل، etc.)
  examples: {
    english: string;
    arabic: string;
  }[];
}

export async function translateToArabic(word: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing. Returning fallback.");
    return `[AI Offline] ${word}`;
  }
  try {
    const prompt = `You are an expert English-Arabic translator for a premium learning platform.
Translate the English word "${word}" to Arabic.
Provide the Arabic translation followed by a very brief Arabic explanation of the meaning.
Example format: "تفاحة - فاكهة مستديرة حمراء أو خضراء"
Return ONLY the Arabic text, no English, no numbering.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`Gemini translation failed for ${word}:`, error);
    return `[AI Error] ${word}`;
  }
}

/**
 * Generate RICH flashcard data for a word: Arabic translation, POS in Arabic,
 * and exactly 3 practical usage examples in both English and Arabic.
 * This is Ali Jitam's "Rule of 3" — the core value of the platform.
 */
export async function generateFlashcardData(word: string, type: string): Promise<FlashcardAIData> {
  const fallback: FlashcardAIData = {
    translation: `[AI Offline] ${word}`,
    posArabic: type,
    examples: [
      { english: `The ${word} is important.`, arabic: `الـ ${word} مهم.` },
      { english: `I learned about ${word}.`, arabic: `تعلمت عن ${word}.` },
      { english: `This ${word} is useful.`, arabic: `هذا الـ ${word} مفيد.` },
    ],
  };

  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing. Returning flashcard fallback.");
    return fallback;
  }

  try {
    const prompt = `You are an expert English-Arabic language instructor for the premium platform "Elite English Mentor" by Ali Jitam.

For the English word "${word}" (${type}), provide:
1. A clear Arabic translation
2. The part of speech in Arabic (e.g., اسم for noun, فعل for verb, صفة for adjective, ظرف for adverb, حرف جر for preposition, ضمير for pronoun, حرف عطف for conjunction, عبارة for phrase)
3. Exactly 3 practical, real-world usage examples. Each example must have both an English sentence and its Arabic translation. The examples should show the word used in different, practical contexts.

Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{"translation":"الترجمة العربية","posArabic":"اسم","examples":[{"english":"Example sentence 1.","arabic":"جملة المثال 1."},{"english":"Example sentence 2.","arabic":"جملة المثال 2."},{"english":"Example sentence 3.","arabic":"جملة المثال 3."}]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const jsonStr = text.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (parsed.translation && Array.isArray(parsed.examples) && parsed.examples.length >= 3) {
      return {
        translation: parsed.translation,
        posArabic: parsed.posArabic || type,
        examples: parsed.examples.slice(0, 3),
      };
    }
    return fallback;
  } catch (error) {
    console.error(`Flashcard data generation failed for ${word}:`, error);
    return fallback;
  }
}

export async function batchTranslateToArabic(words: string[]): Promise<Record<string, string>> {
  if (words.length === 0) return {};
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing. Returning batch fallback.");
    const fallback: Record<string, string> = {};
    words.forEach(w => fallback[w] = `[AI Offline] ${w}`);
    return fallback;
  }
  try {
    const wordList = words.map((w, i) => `${i + 1}. ${w}`).join("\n");
    const prompt = `You are an expert English-Arabic translator for a premium learning platform called "Elite English Mentor".
Translate these English words to Arabic. For each word, provide a high-quality translation that includes the main Arabic meaning and a very brief explanation in Arabic.

Words to translate:
${wordList}

Return ONLY a valid JSON object where keys are the exact English words and values are Arabic translations.
Example format: {"apple": "تفاحة - فاكهة مستديرة حمراء أو خضراء", "family": "عائلة - مجموعة من الأشخاص المرتبطين"}
Do NOT wrap in markdown code blocks. Return raw JSON only.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    // Remove markdown code blocks if present
    const jsonStr = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Batch translation failed:", error);
    // Fallback: return empty translations so the import doesn't crash
    const fallback: Record<string, string> = {};
    words.forEach(w => fallback[w] = `[AI Error] ${w}`);
    return fallback;
  }
}

