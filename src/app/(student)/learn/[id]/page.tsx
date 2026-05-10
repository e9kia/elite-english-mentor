import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: { params: { id: string } }) {
  const unitId = parseInt(params.id);
  console.log(`[LEARN] Accessing Unit ID: ${unitId}`);

  if (isNaN(unitId)) {
    console.error(`[LEARN] Invalid Unit ID: ${params.id}`);
    return notFound();
  }

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      level: true,
      words: {
        orderBy: { id: "asc" }
      }
    }
  });

  console.log(`[LEARN] Unit: ${unit?.title || 'Not Found'}, Words: ${unit?.words.length || 0}`);

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in px-6">
        <div className="h-24 w-24 rounded-[2rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-2xl shadow-rose-500/10">
          <svg className="h-12 w-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tight">System 404: Null Data</h1>
          <p className="text-muted-foreground text-lg font-medium">The requested unit ID <span className="text-foreground font-bold">{params.id}</span> does not exist in our core database.</p>
        </div>
        <Link href="/dashboard" className="bg-primary text-white px-10 py-4 rounded-[1.5rem] font-bold shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300">
          Return to Elite Hub
        </Link>
      </div>
    );
  }

  // SAFETY: Unit Empty State
  if (unit.words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in px-6">
        <div className="h-24 w-24 rounded-[2rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-2xl shadow-amber-500/10">
          <svg className="h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black text-foreground tracking-tight italic">Unit {unit.number} is Empty</h1>
          <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto">Please upload word data in the Admin Dashboard to populate this curriculum segment.</p>
          <div className="pt-6">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-40">Architect: Ali Jitam ❤️</span>
          </div>
        </div>
        <Link href="/dashboard" className="bg-primary text-white px-10 py-4 rounded-[1.5rem] font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-all duration-300">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-24 px-4 sm:px-0">
      {/* Learning Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border/50 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              Level {unit.level.number}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Unit {unit.number}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">{unit.title}</h1>
        </div>
        <Link href="/dashboard" className="text-sm font-black text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group">
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO DASHBOARD
        </Link>
      </div>

      {/* Vocabulary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {unit.words.map((w) => (
          <div key={w.id} className="glass rounded-[2.5rem] p-10 border border-border/40 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden">
             {/* Card background flair */}
             <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
             
            <div className="flex items-start justify-between mb-8">
              <h3 className="text-3xl font-black text-foreground tracking-tight">{w.word}</h3>
              <span className="text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-3 py-1.5 rounded-xl border border-border/50 shadow-inner">
                {w.type}
              </span>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">Arabic Definition</span>
                <p className="text-2xl text-foreground font-arabic leading-[1.8] dir-rtl text-right font-medium">
                  {w.definition}
                </p>
              </div>
              
              {w.example && (
                <div className="pt-6 border-t border-border/30">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 block mb-2">Usage Context</span>
                  <p className="text-sm text-muted-foreground italic leading-relaxed font-medium">
                    "{w.example}"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Signature Footer */}
      <footer className="flex flex-col items-center justify-center pt-24 gap-2 opacity-50">
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
