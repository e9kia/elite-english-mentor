// =====================================================================
//  src/app/(student)/study/level/[levelId]/unit/[unitId]/page.tsx
//  Server Component — fetches words, renders FlashcardDeck.
// =====================================================================

import { notFound }    from "next/navigation";
import { prisma }      from "@/lib/prisma";
import FlashcardDeck   from "@/components/study/FlashcardDeck";
import type { Metadata } from "next";

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { levelId: string; unitId: string };
}): Promise<Metadata> {
  const unit = await prisma.unit.findFirst({
    where: {
      number:  parseInt(params.unitId),
      level:   { number: parseInt(params.levelId) },
    },
    include: { level: { select: { number: true } } },
  });

  if (!unit) return { title: "Unit Not Found" };
  return {
    title: `${unit.title} — Level ${unit.level.number} · 4,000 Essential Words`,
    description: `Study flashcards for ${unit.title}`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FlashcardPage({
  params,
}: {
  params: { levelId: string; unitId: string };
}) {
  const levelNumber = parseInt(params.levelId);
  const unitNumber  = parseInt(params.unitId);

  if (isNaN(levelNumber) || isNaN(unitNumber)) notFound();

  // Fetch level + unit + all words in one query
  const unit = await prisma.unit.findFirst({
    where: {
      number: unitNumber,
      level:  { number: levelNumber },
    },
    include: {
      level: { select: { number: true, title: true, colorTheme: true } },
      words: {
        orderBy: [{ difficulty: "asc" }, { word: "asc" }],
        select: {
          id:         true,
          word:       true,
          type:       true,
          definition: true,
          example:    true,
          phonetic:   true,
          difficulty: true,
        },
      },
    },
  });

  if (!unit) notFound();
  if (unit.words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <svg className="h-8 w-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">No words in this unit yet</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Upload a CSV file with Level {levelNumber}, Unit {unitNumber} to populate this unit.
        </p>
        <a href="/admin/upload"
          className="mt-2 inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors">
          Go to Admin Upload
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
        <span>/</span>
        <a href={`/study/level/${levelNumber}`} className="hover:text-foreground transition-colors">
          Level {levelNumber}
        </a>
        <span>/</span>
        <span className="text-foreground font-medium">{unit.title}</span>
      </nav>

      {/* ── Unit header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: unit.level.colorTheme ?? "#6366f1" }}
            />
            <span className="text-xs font-mono text-muted-foreground">
              {unit.level.title} · Unit {unitNumber}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{unit.title}</h1>
        </div>
        <div className="glass rounded-xl px-4 py-2.5 text-center shrink-0">
          <p className="text-2xl font-bold text-foreground">{unit.words.length}</p>
          <p className="text-xs text-muted-foreground">words</p>
        </div>
      </div>

      {/* ── Unit word list (collapsed, for reference) ── */}
      <details className="glass rounded-xl border border-border/50 overflow-hidden group">
        <summary className="px-5 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-2 transition-colors select-none list-none">
          <svg className="h-4 w-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View all {unit.words.length} words in this unit
        </summary>
        <div className="border-t border-border/50 divide-y divide-border/30 max-h-64 overflow-y-auto">
          {unit.words.map((w) => (
            <div key={w.id} className="px-5 py-2.5 flex items-center gap-3 text-sm hover:bg-muted/20 transition-colors">
              <span className="font-semibold text-foreground w-32 shrink-0">{w.word}</span>
              <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                {w.type}
              </span>
              <span className="text-muted-foreground line-clamp-1 flex-1">{w.definition}</span>
            </div>
          ))}
        </div>
      </details>

      {/* ── Flashcard deck ── */}
      <FlashcardDeck
        words={unit.words.map((w) => ({ ...w, type: w.type.toString() }))}
        unitTitle={unit.title}
        levelNumber={levelNumber}
        unitNumber={unitNumber}
      />

      {/* ── Unit navigation ── */}
      <div className="flex justify-between pt-4 border-t border-border/50">
        {unitNumber > 1 ? (
          <a
            href={`/study/level/${levelNumber}/unit/${unitNumber - 1}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Unit {unitNumber - 1}
          </a>
        ) : <span />}

        {unitNumber < 30 ? (
          <a
            href={`/study/level/${levelNumber}/unit/${unitNumber + 1}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Unit {unitNumber + 1}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ) : <span />}
      </div>
    </div>
  );
}
