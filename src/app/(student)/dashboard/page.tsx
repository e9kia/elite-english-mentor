"use client";

// =====================================================================
//  Dashboard — 6 Premium Level Cards
//  Elite Midnight Gold · Designed by Ali Jitam ❤️
// =====================================================================

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ── Level Metadata ───────────────────────────────────────────────────
const LEVELS = [
  { number: 1, title: "Beginner",           color: "from-amber-500 to-yellow-600",   glow: "shadow-amber-500/20",  icon: "🌱", subtitle: "Core vocabulary for everyday situations" },
  { number: 2, title: "Elementary",          color: "from-sky-500 to-blue-600",       glow: "shadow-sky-500/20",    icon: "🚀", subtitle: "Building blocks of conversational English" },
  { number: 3, title: "Pre-Intermediate",    color: "from-violet-500 to-purple-600",  glow: "shadow-violet-500/20", icon: "💎", subtitle: "Expanding vocabulary for academic contexts" },
  { number: 4, title: "Intermediate",        color: "from-rose-500 to-pink-600",      glow: "shadow-rose-500/20",   icon: "⚔️", subtitle: "Complex structures and topic-specific words" },
  { number: 5, title: "Upper-Intermediate",  color: "from-teal-500 to-emerald-600",   glow: "shadow-teal-500/20",   icon: "🔥", subtitle: "Advanced academic and professional vocabulary" },
  { number: 6, title: "Advanced",            color: "from-gold to-gold-deep",         glow: "shadow-gold/20",       icon: "👑", subtitle: "Sophisticated vocabulary for fluent expression" },
];

interface LevelData {
  id: number;
  number: number;
  title: string;
  description: string | null;
  unitsTotal: number;
  unitsCompleted: number;
  totalWords: number;
}

function getGreeting(): { greeting: string; emoji: string; subtitle: string } {
  const hour = new Date().getHours();
  if (hour < 6)  return { greeting: "Night Owl",       emoji: "🦉", subtitle: "Burning the midnight oil? Elite." };
  if (hour < 12) return { greeting: "Good Morning",    emoji: "☀️", subtitle: "A fresh start to master new words." };
  if (hour < 17) return { greeting: "Good Afternoon",  emoji: "🔥", subtitle: "Keep the momentum going strong." };
  if (hour < 21) return { greeting: "Good Evening",    emoji: "🌙", subtitle: "Evening sessions build lasting habits." };
  return { greeting: "Good Night", emoji: "✨", subtitle: "One more unit before rest?" };
}

function LevelCard({ level, meta, index }: { level: LevelData; meta: typeof LEVELS[number]; index: number }) {
  const progress = level.unitsTotal > 0 ? Math.round((level.unitsCompleted / level.unitsTotal) * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
    >
      <Link
        href={`/learn/level/${level.number}`}
        className={cn(
          "group block elite-card rounded-[2rem] p-6 sm:p-8 border border-border/30 hover:border-gold/30",
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
          meta.glow
        )}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg bg-gradient-to-br shrink-0",
              meta.color
            )}>
              {meta.icon}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gold/50">Level {level.number}</p>
              <h3 className="text-lg font-black text-foreground leading-tight">{meta.title}</h3>
            </div>
          </div>
          {/* Progress Ring */}
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth="4" />
              <motion.circle
                cx="40" cy="40" r="36" fill="none"
                stroke="hsl(var(--gold))"
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.5, delay: index * 0.1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-gold tabular-nums">{progress}%</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-medium mb-5 line-clamp-2">{meta.subtitle}</p>

        <div className="flex items-center justify-between pt-4 border-t border-border/20">
          <div className="flex gap-4">
            <div>
              <p className="text-lg font-black text-foreground tabular-nums">{level.unitsCompleted}<span className="text-muted-foreground/40 text-sm">/{level.unitsTotal}</span></p>
              <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Units</p>
            </div>
            <div>
              <p className="text-lg font-black text-foreground tabular-nums">{level.totalWords.toLocaleString()}</p>
              <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Words</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Enter Level
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5-5 5M5 12h12" />
            </svg>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function DashboardContent() {
  const { data: session } = useSession();
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);
  const [wordsLearned, setWordsLearned] = useState(0);

  const { greeting, emoji, subtitle } = getGreeting();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/student/progress");
        if (res.ok) {
          const data = await res.json();
          setTotalXp(data.totalXp || 0);
          setWordsLearned(data.wordsLearned || 0);

          // Build level summary data
          const levelData: LevelData[] = (data.levels || []).map((level: any) => {
            const units = level.units || [];
            const completedUnits = units.filter((u: any) => u.progress?.status === "completed").length;
            const totalWords = units.reduce((sum: number, u: any) => sum + (u.wordCount || u._count?.words || 0), 0);
            return {
              id: level.id,
              number: level.number,
              title: level.title,
              description: level.description,
              unitsTotal: units.length,
              unitsCompleted: completedUnits,
              totalWords,
            };
          });
          setLevels(levelData);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const completedUnitsTotal = levels.reduce((s, l) => s + l.unitsCompleted, 0);
  const totalUnits = levels.reduce((s, l) => s + l.unitsTotal, 0);
  const overallProgress = totalUnits > 0 ? Math.round((completedUnitsTotal / totalUnits) * 100) : 0;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 sm:space-y-10 pb-8 animate-fade-in">
      {/* ═══ HERO SECTION ═══ */}
      <div className="elite-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 md:p-12 relative overflow-hidden gradient-shine border border-gold/10">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gold/6 blur-[60px] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3 sm:space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 sm:w-12 bg-gold/30" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gold">Elite English Mentor</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.1]">
              {emoji} {greeting},
              <br />
              <span className="text-primary italic">{session?.user?.name || "Scholar"}</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-lg">
              {subtitle}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-row md:flex-col gap-3 sm:gap-4 shrink-0">
            <div className="elite-card rounded-2xl border border-gold/10 px-4 sm:px-6 py-3 sm:py-4 text-center flex-1 md:flex-none md:min-w-[100px]">
              <p className="text-xl sm:text-2xl font-black text-gold tabular-nums">⚡ {totalXp.toLocaleString()}</p>
              <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Total XP</p>
            </div>
            <div className="elite-card rounded-2xl border border-primary/10 px-4 sm:px-6 py-3 sm:py-4 text-center flex-1 md:flex-none md:min-w-[100px]">
              <p className="text-xl sm:text-2xl font-black text-primary tabular-nums">📚 {wordsLearned}</p>
              <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Words Learned</p>
            </div>
            <div className="elite-card rounded-2xl border border-gold/10 px-4 sm:px-6 py-3 sm:py-4 text-center flex-1 md:flex-none md:min-w-[100px]">
              <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">✅ {completedUnitsTotal}</p>
              <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Units Done</p>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="relative mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gold/50">Journey Progress</span>
            <span className="text-[9px] sm:text-[10px] font-black text-primary">{overallProgress}% · {completedUnitsTotal}/{totalUnits}</span>
          </div>
          <div className="h-2 sm:h-2.5 bg-muted/20 rounded-full overflow-hidden border border-border/20">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-gold rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ boxShadow: "0 0 12px hsl(var(--gold) / 0.4)" }}
            />
          </div>
        </div>
      </div>

      {/* ═══ 6 PREMIUM LEVEL CARDS ═══ */}
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-6 sm:w-8 bg-gold/30" />
          <h2 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-gold/70">Your Levels</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {levels.map((level, i) => {
            const meta = LEVELS.find(l => l.number === level.number) ?? LEVELS[0];
            return <LevelCard key={level.number} level={level} meta={meta} index={i} />;
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary fallbackTitle="Dashboard couldn't load">
      <DashboardContent />
    </ErrorBoundary>
  );
}
