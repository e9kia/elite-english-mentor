import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function translateToArabic(word: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing. Returning fallback.");
    return `Translation for ${word} (AI Key Missing)`;
  }
  try {
    const prompt = `Translate the English word "${word}" to Arabic. Provide ONLY the Arabic translation, no extra text or explanations.`;
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
    const prompt = `Translate these English words to Arabic for an advanced learning platform. 
    For each word, provide a high-quality translation that includes the main meaning and a very brief explanation in Arabic if necessary.
    Return the result as a JSON object where keys are English words and values are Arabic translations. 
    Format: {"apple": "تفاحة - فاكهة مستديرة حمراء أو خضراء", ...}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    // Remove markdown code blocks if any
    const jsonStr = text.replace(/```json|```/g, "");
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Batch translation failed:", error);
    return {};
  }
}
