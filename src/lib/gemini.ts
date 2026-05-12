import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
