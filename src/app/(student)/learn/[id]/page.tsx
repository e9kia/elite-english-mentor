import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function LearningPage({ params }: { params: { id: string } }) {
  const unitId = parseInt(params.id);

  if (isNaN(unitId)) {
    return notFound();
  }

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      level: true,
      words: {
        orderBy: { word: "asc" }
      }
    }
  });

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="h-20 w-20 rounded-3xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <svg className="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-foreground mb-2">Unit Not Found</h1>
          <p className="text-muted-foreground">The requested unit ID {params.id} does not exist.</p>
        </div>
        <Link href="/dashboard" className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (unit.words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="h-20 w-20 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-foreground mb-2 italic">Unit {unit.number} is empty</h1>
          <p className="text-muted-foreground">Add words in the Admin Dashboard to populate this unit.</p>
          <p className="text-[10px] mt-4 font-bold text-muted-foreground uppercase tracking-widest italic opacity-50">
            Platform Architect: Ali Jitam ❤️
          </p>
        </div>
        <Link href="/dashboard" className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-foreground">{unit.title}</h1>
          <p className="text-muted-foreground font-medium">Level {unit.level.number} • {unit.words.length} Words</p>
        </div>
        <Link href="/dashboard" className="text-sm font-bold text-muted-foreground hover:text-foreground">
          Exit Learning →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {unit.words.map((w) => (
          <div key={w.id} className="glass rounded-[2rem] p-8 border border-border/40 hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-black text-foreground">{w.word}</h3>
              <span className="text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-2 py-1 rounded-lg">
                {w.type}
              </span>
            </div>
            <p className="text-lg text-foreground font-arabic leading-relaxed dir-rtl text-right mb-4">
              {w.definition}
            </p>
            {w.example && (
              <p className="text-sm text-muted-foreground italic border-l-2 border-primary/20 pl-4">
                "{w.example}"
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-20">
        <p className="text-[10px] font-medium text-muted-foreground/40 italic">
          Designed & Developed by <span className="text-foreground/40 font-bold not-italic">Ali Jitam ❤️</span> | © 2026 Elite English Mentor
        </p>
      </div>
    </div>
  );
}
