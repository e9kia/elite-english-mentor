"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import StartLearningButton from "@/components/StartLearningButton";

const LEVELS = [
  { number: 1, title: "Essential 1", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-500" },
  { number: 2, title: "Essential 2", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20", text: "text-blue-500" },
  { number: 3, title: "Essential 3", color: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/20", text: "text-violet-500" },
  { number: 4, title: "Intermediate 1", color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", text: "text-amber-500" },
  { number: 5, title: "Intermediate 2", color: "from-rose-500/20 to-rose-500/5", border: "border-rose-500/20", text: "text-rose-500" },
  { number: 6, title: "Advanced", color: "from-slate-500/20 to-slate-500/5", border: "border-slate-500/20", text: "text-slate-500" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
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

  return (
    <div className="space-y-12 pb-20 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-card border border-border/50 shadow-2xl shadow-primary/5 p-8 md:p-16">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Welcome, {session?.user?.name || "Scholar"}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 text-5xl">Elite English Mentor</span>
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg leading-relaxed font-medium mb-8">
              Your path to mastering <span className="text-foreground font-bold underline decoration-primary/30 decoration-4 underline-offset-4">4,000 Essential Words</span> starts here.
            </p>
            {isAdmin && (
              <Link href="/admin/upload" className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-8 py-3 rounded-2xl font-bold text-sm hover:bg-primary/20 transition-all">
                Manage Curriculum
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Level Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {LEVELS.map((level) => {
          const dbLevel = levelsData.find(l => l.number === level.number);
          const hasContent = dbLevel && dbLevel.units?.length > 0;
          const firstUnitId = dbLevel?.units?.[0]?.id;

          return (
            <div key={level.number} className={cn("group glass rounded-[2.5rem] p-8 border transition-all duration-500 hover:-translate-y-2", level.border)}>
              <div className={cn("h-16 w-16 rounded-3xl mb-6 flex items-center justify-center bg-gradient-to-br shadow-inner", level.color)}>
                <span className={cn("text-2xl font-black", level.text)}>{level.number}</span>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-2">{level.title}</h3>
              <p className="text-sm text-muted-foreground mb-8 font-medium">
                {dbLevel?.units?.length || 0} Units • {dbLevel?._count?.words || 0} Words
              </p>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/30">
                {hasContent ? (
                  <StartLearningButton unitId={firstUnitId} />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">Coming Soon</span>
                )}
                
                <Link href={`/learn/level/${level.number}`} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                  View Path →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Branding */}
      <div className="flex justify-center pt-20 border-t border-border/20">
        <p className="text-[10px] font-medium text-muted-foreground/40 italic">
          Designed & Developed by <span className="text-foreground/40 font-bold not-italic">Ali Jitam ❤️</span> | © 2026 Elite English Mentor
        </p>
      </div>
    </div>
  );
}
