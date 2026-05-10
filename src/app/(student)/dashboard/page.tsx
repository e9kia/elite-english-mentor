"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const LEVELS = [
  { number: 1, title: "Essential 1", color: "from-emerald-500 to-teal-500", icon: "🌱", description: "Foundational English vocabulary for beginners." },
  { number: 2, title: "Essential 2", color: "from-blue-500 to-cyan-500", icon: "🚀", description: "Expanding core concepts and daily interactions." },
  { number: 3, title: "Essential 3", color: "from-violet-500 to-fuchsia-500", icon: "💎", description: "Mastering common expressions and sentence structures." },
  { number: 4, title: "Intermediate 1", color: "from-amber-500 to-orange-500", icon: "⚔️", description: "Complex grammar and professional terminology." },
  { number: 5, title: "Intermediate 2", color: "from-rose-500 to-pink-500", icon: "🔥", description: "Nuanced communication and abstract concepts." },
  { number: 6, title: "Advanced", color: "from-slate-700 to-slate-900", icon: "👑", description: "Academic proficiency and master-level vocabulary." },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [activeLevel, setActiveLevel] = useState(1);
  const [levelsData, setLevelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch("/api/student/progress");
        if (res.ok) {
          const data = await res.json();
          setLevelsData(data.levels || []);
        }
      } catch (err) {
        console.error("Failed to fetch progress", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  const currentLevelData = levelsData.find(l => l.number === activeLevel);

  return (
    <div className="space-y-12 pb-24 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              Elite English Mentor
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            Student <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium text-lg">Architected by Ali Jitam ❤️</p>
        </div>
      </div>

      {/* 6 Level Cards (Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LEVELS.map((level) => (
          <button
            key={level.number}
            onClick={() => setActiveLevel(level.number)}
            className={cn(
              "relative glass group rounded-[2.5rem] p-8 text-left transition-all duration-500 border overflow-hidden",
              activeLevel === level.number 
                ? "border-primary/40 bg-primary/5 shadow-2xl shadow-primary/10 ring-2 ring-primary/20 scale-[1.02]" 
                : "border-border/40 hover:border-border/80 hover:bg-muted/50"
            )}
          >
            {/* Background Glow */}
            <div className={cn(
              "absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[80px] opacity-20 transition-opacity duration-500",
              activeLevel === level.number ? "bg-primary" : "bg-transparent group-hover:bg-primary/20"
            )} />

            <div className="relative z-10">
              <div className={cn(
                "h-16 w-16 rounded-3xl mb-6 flex items-center justify-center text-3xl shadow-inner bg-gradient-to-br",
                level.color
              )}>
                {level.icon}
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Level {level.number}</p>
              <h3 className="text-2xl font-black text-foreground mb-3">{level.title}</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">
                {level.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">
                  {levelsData.find(l => l.number === level.number)?.units?.length || 0} / 30 Units
                </span>
                {activeLevel === level.number && (
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Unit Grid for Active Level (30 Units) */}
      <motion.div 
        key={activeLevel}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[3rem] p-8 md:p-12 border border-border/50"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-foreground mb-2">
              Level {activeLevel}: <span className="text-primary">{LEVELS[activeLevel-1].title}</span>
            </h2>
            <p className="text-muted-foreground font-medium italic">Select a unit to begin your learning session.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Completion Progress</span>
            <div className="h-3 w-64 bg-muted rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out" 
                style={{ width: `${(currentLevelData?.units?.length || 0) / 30 * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-4">
          {Array.from({ length: 30 }).map((_, i) => {
            const unitNumber = i + 1;
            const unit = currentLevelData?.units?.find((u: any) => u.number === unitNumber);
            const isUnlocked = !!unit;

            return (
              <div key={unitNumber} className="relative group">
                {isUnlocked ? (
                  <Link 
                    href={`/learn/${unit.id}`}
                    className="aspect-square glass rounded-3xl flex flex-col items-center justify-center border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white transition-all duration-300 group hover:scale-110 shadow-xl shadow-primary/5"
                  >
                    <span className="text-[10px] font-black opacity-50 mb-1">UNIT</span>
                    <span className="text-2xl font-black">{unitNumber}</span>
                  </Link>
                ) : (
                  <div className="aspect-square glass rounded-3xl flex flex-col items-center justify-center border border-border/20 opacity-30 cursor-not-allowed group">
                    <svg className="h-5 w-5 mb-1 text-muted-foreground transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[10px] font-black">{unitNumber}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* The "Big Three" Sections (Bottom Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
        {[
          { label: "AI Translation Tutor", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", color: "from-violet-500/20 to-fuchsia-500/5", text: "text-violet-500" },
          { label: "Elite Quiz Hub", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "from-emerald-500/20 to-teal-500/5", text: "text-emerald-500" },
          { label: "Voice Proficiency", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z", color: "from-rose-500/20 to-pink-500/5", text: "text-rose-500" },
        ].map((feat) => (
          <div key={feat.label} className={cn("glass rounded-[2.5rem] p-8 border border-border/50 relative overflow-hidden group cursor-not-allowed bg-gradient-to-br", feat.color)}>
            <div className="absolute top-6 right-6">
              <span className="bg-foreground/10 text-foreground/60 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-foreground/10">
                COMING SOON
              </span>
            </div>
            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner bg-card", feat.text)}>
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} />
              </svg>
            </div>
            <h4 className="text-xl font-black text-foreground mb-2">{feat.label}</h4>
            <p className="text-sm text-muted-foreground font-medium italic">Advanced AI integration and interactive feedback systems arriving in Phase 3.</p>
          </div>
        ))}
      </div>

      {/* Global Footer Signature */}
      <footer className="flex flex-col items-center justify-center pt-24 gap-2 opacity-60">
        <p className="text-sm font-bold text-foreground">
          Designed & Developed by <span className="text-primary font-black">Ali Jitam ❤️</span>
        </p>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
          | © 2026 Elite English Mentor |
        </p>
      </footer>
    </div>
  );
}
