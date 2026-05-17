"use client";
// =====================================================================
//  LevelClient — Units Tab + Word Bank Tab
//  Elite Midnight Gold · Designed by Ali Jitam ❤️
// =====================================================================

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface UnitData {
  id: number; number: number; title: string; wordCount: number;
  isCompleted: boolean; isUnlocked: boolean; isActive: boolean; currentWordIndex: number;
}

interface WordData {
  id: string; word: string; type: string; definition: string;
  meaningArabic: string | null; unitId: number;
}

interface LevelInfo {
  id: number; number: number; title: string; description: string | null; icon: string;
}

const TYPE_COLORS: Record<string, string> = {
  noun: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  verb: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  adjective: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  adverb: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  preposition: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  phrase: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  other: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

const MASTERY_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "New", color: "text-muted-foreground/40 bg-muted/30" },
  1: { label: "Learning", color: "text-amber-400 bg-amber-500/10" },
  2: { label: "Familiar", color: "text-blue-400 bg-blue-500/10" },
  3: { label: "Mastered", color: "text-gold bg-gold/10" },
};

export default function LevelClient({
  level, units, words, wordMasteryMap,
}: {
  level: LevelInfo; units: UnitData[]; words: WordData[];
  wordMasteryMap: Record<string, number>;
}) {
  const [tab, setTab] = useState<"units" | "wordbank">("units");
  const [search, setSearch] = useState("");

  const completedCount = units.filter(u => u.isCompleted).length;
  const filteredWords = search.length > 0
    ? words.filter(w => w.word.toLowerCase().includes(search.toLowerCase()) || w.definition.toLowerCase().includes(search.toLowerCase()))
    : words;

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-border/30">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-gold/10 border border-gold/20 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shrink-0">
            {level.icon}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gold/50">Level {level.number}</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">{level.title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {completedCount}/{units.length} units · {words.length} words total
            </p>
          </div>
        </div>
        <Link href="/dashboard" className="text-xs sm:text-sm font-black text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group self-start sm:self-auto">
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl border border-border/50">
        {(["units", "wordbank"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
              tab === t ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "text-muted-foreground hover:text-foreground")}>
            {t === "units" ? `📚 Units (${units.length})` : `📖 Word Bank (${words.length})`}
          </button>
        ))}
      </div>

      {/* ═══ UNITS TAB ═══ */}
      {tab === "units" && (
        <div className="space-y-2 sm:space-y-3">
          {units.map((unit, i) => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              {unit.isUnlocked ? (
                <Link href={`/learn/${unit.id}`}
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 elite-card rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 border transition-all duration-300 group",
                    unit.isActive ? "border-primary/30 shadow-lg shadow-primary/10 hover:shadow-xl hover:border-primary/50" :
                    unit.isCompleted ? "border-gold/20 hover:border-gold/40" : "border-border/20 hover:border-primary/30"
                  )}>
                  {/* Node */}
                  <div className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all",
                    unit.isActive ? "bg-gradient-to-br from-primary to-gold text-primary-foreground shadow-lg shadow-primary/30" :
                    unit.isCompleted ? "bg-gold/10 text-gold border border-gold/20" : "bg-muted text-muted-foreground"
                  )}>
                    {unit.isCompleted ? "✓" : unit.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                        unit.isActive ? "bg-primary/10 text-primary" : unit.isCompleted ? "bg-gold/10 text-gold" : "bg-muted text-muted-foreground/50"
                      )}>U{unit.number}</span>
                      <h4 className={cn("text-sm font-bold truncate",
                        unit.isActive ? "text-foreground" : unit.isCompleted ? "text-foreground/80" : "text-muted-foreground"
                      )}>{unit.title}</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 font-bold mt-0.5">
                      {unit.wordCount} words
                      {unit.currentWordIndex > 0 && !unit.isCompleted && <span className="text-primary ml-1">· Word {unit.currentWordIndex + 1}</span>}
                    </p>
                  </div>
                  <div className="shrink-0 ml-2">
                    {unit.isActive ? (
                      <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/20">
                        Start →
                      </span>
                    ) : unit.isCompleted ? (
                      <span className="text-gold text-sm font-black">⭐</span>
                    ) : (
                      <svg className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4 elite-card rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 border border-border/10 opacity-40 cursor-not-allowed">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-muted/30 flex items-center justify-center shrink-0">
                    <svg className="h-4 w-4 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 px-1.5 py-0.5 rounded bg-muted/30">U{unit.number}</span>
                    <h4 className="text-sm font-bold text-muted-foreground/40 truncate">{unit.title}</h4>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══ WORD BANK TAB ═══ */}
      {tab === "wordbank" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="glass rounded-xl border border-border/50 flex items-center gap-3 px-4 py-3">
            <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search words..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
            />
            <span className="text-[10px] font-bold text-muted-foreground/50">{filteredWords.length} words</span>
          </div>

          {/* Word Table */}
          <div className="elite-card rounded-2xl border border-border/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/10">
                    <th className="text-left px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Word</th>
                    <th className="text-left px-3 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Type</th>
                    <th className="text-right px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest" dir="rtl">المعنى</th>
                    <th className="text-center px-3 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-20 hidden sm:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredWords.map((w, i) => {
                    const mastery = wordMasteryMap[w.id] ?? 0;
                    const masteryInfo = MASTERY_LABELS[mastery] ?? MASTERY_LABELS[0];
                    const typeClass = TYPE_COLORS[w.type.toLowerCase()] ?? TYPE_COLORS.other;
                    return (
                      <motion.tr
                        key={w.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.01, 0.5) }}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-foreground">{w.word}</span>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell">
                          <span className={cn("inline-block border rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", typeClass)}>
                            {w.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm text-muted-foreground" dir="rtl">
                          {w.meaningArabic || w.definition}
                        </td>
                        <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                          <span className={cn("inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider", masteryInfo.color)}>
                            {masteryInfo.label}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredWords.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground font-bold">No words found</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
