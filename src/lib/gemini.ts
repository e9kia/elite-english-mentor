import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function translateToArabic(word: string): Promise<string> {
  try {
    const prompt = `Translate the English word "${word}" to Arabic. Provide ONLY the Arabic translation, no extra text or explanations.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`Gemini translation failed for ${word}:`, error);
    return "";
  }
}

export async function batchTranslateToArabic(words: string[]): Promise<Record<string, string>> {
  if (words.length === 0) return {};
  try {
    const prompt = `Translate these English words to Arabic: ${words.join(", ")}. Return the result as a JSON object where keys are English words and values are Arabic translations. Format: {"apple": "تفاحة", ...}`;
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
