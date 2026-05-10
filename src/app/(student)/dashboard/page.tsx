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
    <div className="flex gap-8 pb-24 animate-fade-in relative">
      {/* Main Content Area */}
      <div className="flex-1 space-y-12 min-w-0">
        {/* Premium Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="h-px w-12 bg-primary/30" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Elite English Mentor</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground">
            Student <span className="text-primary italic">Dashboard</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl">
            Welcome back, <span className="text-foreground font-bold">{session?.user?.name || "Scholar"}</span>. 
            Architected for excellence by <span className="text-primary font-black">Ali Jitam ❤️</span>.
          </p>
        </div>

        {/* 6 Level Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
              <div className={cn(
                "h-16 w-16 rounded-3xl mb-6 flex items-center justify-center text-3xl shadow-inner bg-gradient-to-br",
                level.color
              )}>
                {level.icon}
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Tier {level.number}</p>
              <h3 className="text-2xl font-black text-foreground mb-3">{level.title}</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">
                {level.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-border/20">
                <span className="text-xs font-bold text-muted-foreground">
                  {levelsData.find(l => l.number === level.number)?.units?.length || 0} / 30 Units
                </span>
                {activeLevel === level.number && (
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Unit Grid */}
        <motion.div 
          key={activeLevel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[3rem] p-8 md:p-12 border border-border/50"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl font-black text-foreground mb-2 italic">
                Level {activeLevel} <span className="text-primary not-italic tracking-tight">Curriculum</span>
              </h2>
              <p className="text-muted-foreground font-medium">Master all 30 units to advance to the next tier.</p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent mx-8 hidden xl:block" />
            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mastery Progress</span>
              <div className="h-3 w-64 bg-muted rounded-full overflow-hidden border border-border/50 p-0.5">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(var(--primary),0.5)]" 
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
                      className="aspect-square glass rounded-2xl flex flex-col items-center justify-center border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white transition-all duration-500 group hover:scale-110 shadow-xl shadow-primary/5"
                    >
                      <span className="text-[8px] font-black opacity-50 mb-1">UNIT</span>
                      <span className="text-xl font-black">{unitNumber}</span>
                    </Link>
                  ) : (
                    <div className="aspect-square glass rounded-2xl flex flex-col items-center justify-center border border-border/20 opacity-30 cursor-not-allowed grayscale">
                      <svg className="h-4 w-4 mb-1 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-[8px] font-black">{unitNumber}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* The 'Big Three' (Bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[
            { label: "Elite AI Tutor", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", color: "from-violet-500/10 to-fuchsia-500/5", text: "text-violet-500" },
            { label: "Competitive Quizzes", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "from-emerald-500/10 to-teal-500/5", text: "text-emerald-500" },
            { label: "Voice Recognition", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z", color: "from-rose-500/10 to-pink-500/5", text: "text-rose-500" },
          ].map((feat) => (
            <div key={feat.label} className={cn("glass rounded-[2.5rem] p-8 border border-border/50 relative overflow-hidden group cursor-not-allowed")}>
              <div className="absolute top-6 right-6">
                <span className="bg-foreground/5 text-foreground/40 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-foreground/10">
                  COMING SOON
                </span>
              </div>
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br", feat.color, feat.text)}>
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} />
                </svg>
              </div>
              <h4 className="text-xl font-black text-foreground mb-1">{feat.label}</h4>
              <p className="text-xs text-muted-foreground font-medium italic opacity-60">Architectural implementation in progress.</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar: Friends Section */}
      <aside className="hidden lg:flex flex-col w-80 space-y-6">
        <div className="glass rounded-[2.5rem] p-8 border border-border/50 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-foreground tracking-tight">Elite <span className="text-primary">Friends</span></h3>
            <button className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
               </svg>
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
             {[
               { name: "Ahmed", status: "online", level: 4 },
               { name: "Sarah", status: "offline", level: 2 },
               { name: "Omar", status: "online", level: 6 },
               { name: "Layla", status: "offline", level: 1 },
             ].map((friend) => (
               <div key={friend.name} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors group cursor-pointer border border-transparent hover:border-border/50">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-primary border border-primary/20">
                      {friend.name[0]}
                    </div>
                    <span className={cn(
                      "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background",
                      friend.status === "online" ? "bg-emerald-500" : "bg-muted-foreground/30"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground leading-none">{friend.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Level {friend.level}</p>
                  </div>
               </div>
             ))}
          </div>

          <button className="mt-8 w-full py-4 rounded-2xl bg-muted/50 text-muted-foreground text-xs font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
             View All Friends
          </button>
        </div>

        {/* Branding Signature */}
        <div className="p-4 text-center space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground/60">
             Designed & Developed by
          </p>
          <p className="text-xs font-black text-foreground">
             Ali Jitam ❤️
          </p>
          <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] pt-2">
             © 2026 Elite Mentor
          </p>
        </div>
      </aside>
    </div>
  );
}
