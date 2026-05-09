// src/app/api/ai/explain/route.ts
// Gemini API endpoint — returns word explanations, mnemonics, and deep dives.
// Model chain: gemini-2.5-flash → gemini-2.0-flash-lite (fallback)

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI }        from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Models available for this key (confirmed via ListModels)
// gemini-1.5-flash is NOT available — this key uses the newer v2/v3 generation
const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI unavailable", detail: "GEMINI_API_KEY not configured in .env" },
      { status: 503 }
    );
  }

  let body: { word: string; type: string; definition: string; example: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { word, type, definition, example, mode = "explain" } = body;
  if (!word) return NextResponse.json({ error: "word is required" }, { status: 400 });

  const genAI  = new GoogleGenerativeAI(GEMINI_API_KEY);
  const activePrompt = `You are an elite Language Acquisition Specialist. Your goal is to help an Arabic speaker deeply acquire the English word "${word}" (${type}).
ALL YOUR EXPLANATIONS AND TEXT MUST BE IN HIGH-QUALITY ARABIC.

Word: ${word}
Type: ${type}
Definition: ${definition}
Example: ${example}

Respond in this exact JSON format (no markdown, raw JSON only):
{
  "meaning": "A clear, contextual explanation of the word's meaning (in Arabic).",
  "story": "A short, engaging 3-sentence story (in Arabic) that naturally incorporates the English word '${word}'.",
  "mnemonic": "A creative memory trick or mental image (in Arabic) to help remember the word.",
  "context_engine": [
    { "style": "Academic", "english": "An academic sentence using the word", "arabic": "Arabic translation" },
    { "style": "Casual", "english": "A casual/everyday sentence using the word", "arabic": "Arabic translation" },
    { "style": "Professional", "english": "A professional/business sentence using the word", "arabic": "Arabic translation" }
  ]
}`;
  let lastError: unknown;

  // Try each model in the chain — stop at first success
  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`[/api/ai/explain] Trying model: ${modelName}`);
      const model  = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(activePrompt);
      const text   = result.response.text().trim();

      // Strip markdown fences if Gemini wraps the JSON
      const clean  = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(clean);

      console.log(`[/api/ai/explain] Success with model: ${modelName}`);
      return NextResponse.json({ mode, word, model: modelName, data: parsed });
    } catch (err) {
      const msg = String(err);
      console.warn(`[/api/ai/explain] ${modelName} failed: ${msg.slice(0, 200)}`);
      // Don't retry on quota errors — they'll all fail
      if (msg.includes("429") || msg.includes("quota")) {
        lastError = err;
        break;
      }
      lastError = err;
      // Continue to next model for 404 (not found) errors
    }
  }

  console.error("[/api/ai/explain] All models failed. Last error:", lastError);
  const errMsg = String(lastError);
  const isQuota = errMsg.includes("429") || errMsg.includes("quota");
  return NextResponse.json(
    {
      error:  isQuota ? "Rate limit reached" : "AI generation failed",
      detail: isQuota
        ? "You've hit the free-tier quota. Wait a minute and try again, or upgrade your Gemini plan at ai.google.dev."
        : errMsg.slice(0, 300),
    },
    { status: isQuota ? 429 : 500 }
  );
}
