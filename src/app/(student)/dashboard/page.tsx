"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const LEVELS = [
  { number: 1, title: "Essential 1", color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/20", icon: "🌱" },
  { number: 2, title: "Essential 2", color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20", icon: "🚀" },
  { number: 3, title: "Essential 3", color: "from-violet-500 to-fuchsia-500", shadow: "shadow-violet-500/20", icon: "💎" },
  { number: 4, title: "Intermediate 1", color: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20", icon: "⚔️" },
  { number: 5, title: "Intermediate 2", color: "from-rose-500 to-pink-500", shadow: "shadow-rose-500/20", icon: "🔥" },
  { number: 6, title: "Advanced", color: "from-slate-700 to-slate-900", shadow: "shadow-slate-500/20", icon: "👑" },
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
    <div className="space-y-12 pb-20 animate-fade-in">
      {/* Header with Signature */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              Elite Experience
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            Curriculum <span className="text-primary">Architect</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Mastering 4,000 words with Ali Jitam ❤️</p>
        </div>

        {/* Feature Icons */}
        <div className="flex items-center gap-3">
          {[
            { label: "AI Tutor", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", color: "bg-violet-500/10 text-violet-500" },
            { label: "Quizzes", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "bg-emerald-500/10 text-emerald-500" },
            { label: "Voice", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z", color: "bg-rose-500/10 text-rose-500" },
          ].map((f) => (
            <div key={f.label} className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 cursor-help", f.color)}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Level Selector Grid (6 Levels) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {LEVELS.map((level) => (
          <button
            key={level.number}
            onClick={() => setActiveLevel(level.number)}
            className={cn(
              "relative glass group rounded-[2rem] p-6 text-left transition-all duration-300 border",
              activeLevel === level.number 
                ? "border-primary/40 bg-primary/5 shadow-2xl shadow-primary/10 ring-2 ring-primary/20 scale-[1.02]" 
                : "border-border/40 hover:border-border/80 hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "h-12 w-12 rounded-2xl mb-4 flex items-center justify-center text-xl transition-transform group-hover:scale-110",
              activeLevel === level.number ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}>
              {level.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Level {level.number}</p>
            <p className="font-bold text-foreground text-sm leading-tight">{level.title}</p>
            
            {activeLevel === level.number && (
              <motion.div layoutId="level-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-8 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Units Grid for Active Level */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            Level {activeLevel} Progress
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-lg">
              {currentLevelData?.units?.length || 0} / 30 Units Active
            </span>
          </h2>
          <div className="h-2 w-48 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: `${(currentLevelData?.units?.length || 0) / 30 * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {Array.from({ length: 30 }).map((_, i) => {
            const unitNumber = i + 1;
            const unit = currentLevelData?.units?.find((u: any) => u.number === unitNumber);
            const isUnlocked = !!unit;

            return (
              <div key={unitNumber} className="relative group">
                {isUnlocked ? (
                  <Link 
                    href={`/learn/${unit.id}`}
                    className="aspect-square glass rounded-2xl flex flex-col items-center justify-center border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white transition-all duration-300 group hover:scale-105 shadow-xl shadow-primary/5"
                  >
                    <span className="text-[10px] font-black opacity-50 mb-1">UNIT</span>
                    <span className="text-xl font-black">{unitNumber}</span>
                  </Link>
                ) : (
                  <div className="aspect-square glass rounded-2xl flex flex-col items-center justify-center border border-border/20 opacity-40 cursor-not-allowed">
                    <svg className="h-4 w-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[10px] font-black">{unitNumber}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Footer Signature */}
      <div className="flex flex-col items-center justify-center pt-20 border-t border-border/20 gap-2">
        <p className="text-sm font-semibold text-foreground/60">
          Designed & Developed by <span className="text-primary font-black">Ali Jitam ❤️</span>
        </p>
        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">
          © 2026 Elite English Mentor | All Rights Reserved
        </p>
      </div>
    </div>
  );
}
