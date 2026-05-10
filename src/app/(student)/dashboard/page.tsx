// src/app/(student)/dashboard/page.tsx
// Server Component — fetches real stats directly from Prisma (no API round-trip)

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma }  from "@/lib/prisma";
import { cn }      from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Dashboard — 4,000 Essential Words",
  description: "Track your English vocabulary progress across 6 levels and 180 units.",
};

// ─── Data fetching (runs on server) ──────────────────────────────────────────

async function getDashboardStats() {
  const [
    totalWords,
    totalLevels,
    levels,
    recentBatch,
  ] = await Promise.all([
    // Total vocabulary words loaded into the system
    prisma.word.count(),

    // How many levels have at least 1 word
    prisma.level.count(),

    // All levels with their units and word counts
    prisma.level.findMany({
      orderBy: { number: "asc" },
      include: {
        units: {
          orderBy: { number: "asc" },
          include: { _count: { select: { words: true } } },
        },
      },
    }),

    // Most recent import batch
    prisma.importBatch.findFirst({
      orderBy: { createdAt: "desc" },
      where: { status: "done" },
      select: { filename: true, importedCount: true, createdAt: true },
    }),
  ]);

  // Words per level
  const levelStats = levels.map((level) => {
    const wordCount = level.units.reduce((sum, u) => sum + u._count.words, 0);
    const unitsWithWords = level.units.filter((u) => u._count.words > 0).length;
    return { ...level, wordCount, unitsWithWords };
  });

  // First unit that has words (for "Start Learning" button)
  const firstUnitWithWords = levels
    .flatMap((l) => l.units.map((u) => ({ ...u, levelNumber: l.number })))
    .find((u) => u._count.words > 0);

  return { totalWords, totalLevels, levelStats, recentBatch, firstUnitWithWords };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, accent = false,
}: {
  icon: string; label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={cn(
      "glass rounded-2xl p-6 flex flex-col gap-3 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5",
      accent && "border border-primary/20 hover:border-primary/40 hover:glow-indigo"
    )}>
      {accent && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl",
        accent ? "bg-primary/20" : "bg-muted"
      )}>
        <svg className={cn("h-5 w-5", accent ? "text-primary" : "text-muted-foreground")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

const LEVEL_COLORS: Record<number, { bg: string; border: string; text: string; dot: string }> = {
  1: { bg: "bg-indigo-500/10",  border: "border-indigo-500/20",  text: "text-indigo-400",  dot: "bg-indigo-500"  },
  2: { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    text: "text-cyan-400",    dot: "bg-cyan-500"    },
  3: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-500" },
  4: { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-500"   },
  5: { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    dot: "bg-rose-500"    },
  6: { bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-400",  dot: "bg-violet-500"  },
};

function LevelCard({ level }: { level: Awaited<ReturnType<typeof getDashboardStats>>["levelStats"][number] }) {
  const color = LEVEL_COLORS[level.number] ?? LEVEL_COLORS[1];
  const pct = Math.round((level.wordCount / (level.wordCount > 0 ? Math.max(level.wordCount, 1) : 1)) * 100);
  const hasWords = level.wordCount > 0;

  return (
    <div className={cn(
      "glass rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-0.5 group",
      hasWords ? cn(color.border, "hover:shadow-lg") : "border-border/40 opacity-60"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold", color.bg, color.text)}>
          L{level.number}
        </div>
        {hasWords ? (
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", color.bg, color.border, color.text)}>
            {level.wordCount} words
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50 px-2 py-0.5 rounded-full border border-border/30">
            Coming soon
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground text-sm leading-snug mb-1">{level.title}</h3>
      {level.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{level.description}</p>
      )}

      {/* Unit progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{level.unitsWithWords} / 30 units populated</span>
          <span>{Math.round((level.unitsWithWords / 30) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", color.dot)}
            style={{ width: `${Math.round((level.unitsWithWords / 30) * 100)}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      {hasWords && (
        <a
          href={`/study/level/${level.number}`}
          className={cn(
            "mt-4 flex items-center gap-1.5 text-xs font-medium transition-colors",
            color.text, "hover:opacity-80"
          )}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          Study Level {level.number}
        </a>
      )}
    </div>
  );
}

// ─── Progress ring SVG ────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 88, stroke = 7, color = "#6366f1" }: {
  pct: number; size?: number; stroke?: number; color?: string;
}) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease-out" }} />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";
  const { totalWords, levelStats, recentBatch, firstUnitWithWords } = await getDashboardStats();

  const levelsWithWords   = levelStats.filter((l) => l.wordCount > 0).length;
  const totalUnitsLoaded  = levelStats.reduce((s, l) => s + l.unitsWithWords, 0);
  const overallPct        = Math.round((totalUnitsLoaded / 180) * 100);

  return (
    <div className="space-y-10 animate-fade-in">

      {/* ── Hero header ── */}
      <div className="relative rounded-3xl overflow-hidden glass border border-border/50 p-8 md:p-12">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-8">
          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-xs font-medium text-emerald-400">Learning System Active</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="gradient-text">Student Hub</span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg text-base leading-relaxed">
              Master the <span className="text-foreground font-semibold">4,000 Essential English Words</span> through
              intelligent study modes, pronunciation checks, and live competition.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {firstUnitWithWords ? (
                <a
                  href={`/study/level/${firstUnitWithWords.levelNumber}/unit/${firstUnitWithWords.number}`}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Learning
                </a>
              ) : session?.user?.role === 'admin' ? (
                <a href="/admin/upload"
                  className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/30 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Words to Start
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 bg-muted border border-border text-muted-foreground px-6 py-2.5 rounded-xl font-semibold text-sm cursor-not-allowed">
                  Waiting for Content
                </span>
              )}
              <a href="/compete"
                className="inline-flex items-center gap-2 border border-border bg-transparent text-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-muted transition-colors">
                <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Duel Mode
              </a>
            </div>
          </div>

          {/* Overall progress ring */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative">
              <ProgressRing pct={overallPct} size={110} stroke={8} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{overallPct}%</span>
                <span className="text-[10px] text-muted-foreground">loaded</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {totalUnitsLoaded} / 180 units<br />populated
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          accent
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          label="Words Available"
          value={totalWords.toLocaleString()}
          sub="Ready to study"
        />
        <StatCard
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          label="Units Loaded"
          value={totalUnitsLoaded}
          sub={`of 180 total`}
        />
        <StatCard
          icon="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
          label="Levels Active"
          value={levelsWithWords}
          sub="of 6 levels"
        />
        <StatCard
          icon="M13 10V3L4 14h7v7l9-11h-7z"
          label="Duels Played"
          value={0}
          sub="Start competing!"
        />
      </div>

      {/* ── Recent import notice ── */}
      {recentBatch && (
        <div className="glass rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 shrink-0">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Latest import: <span className="text-emerald-400 font-mono">{recentBatch.filename}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {recentBatch.importedCount} words added ·{" "}
              {new Date(recentBatch.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <a href="/admin/upload"
            className="text-xs font-medium text-emerald-400 hover:underline underline-offset-2 shrink-0">
            Import more →
          </a>
        </div>
      )}

      {/* ── 6 Level Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">
            All 6 Levels
            <span className="ml-2 text-sm font-normal text-muted-foreground">· 30 units each</span>
          </h2>
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md">
            {totalWords} / 4,000 words
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {levelStats.map((level) => (
            <LevelCard key={level.id} level={level} />
          ))}
        </div>
      </div>

      {/* ── Quick action cards ── */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-5">Study Modes</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Flashcards",
              desc: "Flip through vocabulary cards with spaced repetition",
              icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
              color: "text-indigo-400", bg: "bg-indigo-500/10", href: "/study/flashcards", available: true,
            },
            {
              title: "Quizzes",
              desc: "Multiple choice, fill-in-the-blank, and more",
              icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
              color: "text-emerald-400", bg: "bg-emerald-500/10", href: "/study/quiz", available: false,
            },
            {
              title: "Pronunciation",
              desc: "Speak words aloud and get AI feedback",
              icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
              color: "text-rose-400", bg: "bg-rose-500/10", href: "/study/pronunciation", available: false,
            },
            {
              title: "AI Tutor",
              desc: "Chat with AI to fix grammar and build stories",
              icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
              color: "text-violet-400", bg: "bg-violet-500/10", href: "/study/tutor", available: false,
            },
          ].map((mode) => (
            <div key={mode.title}
              className={cn("glass rounded-2xl p-5 border border-border/40 flex flex-col gap-3 transition-all duration-200",
                mode.available ? "hover:-translate-y-0.5 hover:border-border/70 cursor-pointer" : "opacity-60")}>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", mode.bg)}>
                <svg className={cn("h-5 w-5", mode.color)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={mode.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-foreground">{mode.title}</h3>
                  {!mode.available && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-medium">
                      Phase 3
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mode.desc}</p>
              </div>
              {mode.available ? (
                <a href={mode.href}
                  className={cn("text-xs font-medium flex items-center gap-1", mode.color, "hover:opacity-80")}>
                  Open <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ) : (
                <span className="text-xs text-muted-foreground/50">Coming in Phase 3</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── No content placeholder ── */}
      {totalWords === 0 && (
        <div className="text-center py-20 glass rounded-2xl border border-dashed border-border">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No words yet</h3>
          {isAdmin ? (
            <>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Upload your first CSV or Excel file to populate the vocabulary database.
              </p>
              <a href="/admin/upload"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors">
                Go to Admin Upload
              </a>
            </>
          ) : (
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              The database is currently empty. Check back later for new study materials!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
