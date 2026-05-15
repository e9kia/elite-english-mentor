// =====================================================================
//  src/app/(student)/learn/[id]/page.tsx
//  Unit Learn Page — Foundation Protocol
//  Alphabetical word order (A-Z), AI with fallback, progress tracking
//  Designed by Ali Jitam ❤️
// =====================================================================

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import FlashcardClient from "./FlashcardClient";
import { generateFlashcardData, type FlashcardAIData } from "@/lib/gemini";
import { generateLocalFallback } from "@/lib/fallback";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export interface EnrichedWord {
  id: string;
  word: string;
  type: string;
  definition: string;
  example: string;
  phonetic?: string | null;
  aiData: FlashcardAIData;
}

export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unitId = parseInt(id);
  if (isNaN(unitId)) return notFound();

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      level: true,
      // ── ALPHABETICAL ORDER (A-Z) — Module 2 ──
      words: { orderBy: { word: "asc" } },
    },
  });

  if (!unit) return notFound();

  // ── Get user's current word index ──
  const session = await getServerSession(authOptions);
  let currentWordIndex = 0;
  let resolvedUserId: string | undefined;

  if (session?.user?.id) {
    resolvedUserId = session.user.id;
  } else {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    resolvedUserId = admin?.id ?? undefined;
  }

  if (resolvedUserId) {
    const progress = await prisma.userUnitProgress.findUnique({
      where: { userId_unitId: { userId: resolvedUserId, unitId } },
    });
    currentWordIndex = progress?.currentWordIndex ?? 0;
  }

  // ── AI DATA HEALING with FALLBACK SAFETY NET ─────────────────────
  const enrichedWords: EnrichedWord[] = await Promise.all(
    unit.words.map(async (w) => {
      try {
        console.log(`[AI HEAL] Generating flashcard data for: ${w.word}`);
        const aiData = await generateFlashcardData(w.word, w.type, w.definition, w.example);

        // If the DB definition was missing, persist the translation
        if (!w.definition || w.definition.startsWith("[AI")) {
          await prisma.word.update({
            where: { id: w.id },
            data: { definition: aiData.translation },
          }).catch(() => {}); // Non-blocking write
        }

        return {
          id: w.id,
          word: w.word,
          type: w.type,
          definition: w.definition && !w.definition.startsWith("[AI") ? w.definition : aiData.translation,
          example: w.example,
          phonetic: w.phonetic,
          aiData,
        };
      } catch (err) {
        console.error(`[AI HEAL] Failed for ${w.word}, using local fallback:`, err);
        // ── SAFETY NET: Local fallback — user NEVER sees an error ──
        const fallbackData = generateLocalFallback(w.word, w.type, w.definition || w.word, w.example || "");
        return {
          id: w.id,
          word: w.word,
          type: w.type,
          definition: w.definition || fallbackData.translation,
          example: w.example,
          phonetic: w.phonetic,
          aiData: fallbackData,
        };
      }
    })
  );

  if (enrichedWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="h-20 w-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-xl shadow-amber-500/5">
          <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-foreground mb-2 italic">Unit {unit.number} is empty</h1>
          <p className="text-muted-foreground font-medium">Upload words via the Admin panel to begin learning.</p>
        </div>
        <Link href="/dashboard" className="bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-8">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
               Tier {unit.level.number}
             </span>
             <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">Unit {unit.number}</span>
             <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
               {enrichedWords.length} words · A→Z
             </span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter italic">{unit.title}</h1>
        </div>
        <Link href="/dashboard" className="text-sm font-black text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group">
           <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
           EXIT HUB
        </Link>
      </div>

      {/* The 3D Flashcard Engine with Linear Progression */}
      <FlashcardClient
        words={enrichedWords}
        unitId={unitId}
        unitTitle={unit.title}
        levelNumber={unit.level.number}
        unitNumber={unit.number}
        initialWordIndex={currentWordIndex}
      />
    </div>
  );
}
