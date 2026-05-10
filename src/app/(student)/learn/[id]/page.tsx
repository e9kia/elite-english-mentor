import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function LearnUnitPage({ params }: { params: { id: string } }) {
  const unitId = parseInt(params.id);
  if (isNaN(unitId)) notFound();

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      level: true,
      words: {
        orderBy: { word: "asc" }
      }
    }
  });

  if (!unit) notFound();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              Level {unit.level.number}
            </span>
            <span className="text-xs font-bold text-muted-foreground/60">Unit {unit.number}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{unit.title}</h1>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Back to Dashboard
        </Link>
      </div>

      {unit.words.length === 0 ? (
        <div className="glass rounded-[2.5rem] border border-dashed border-border p-20 text-center">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
            <svg className="h-10 w-10 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Unit Under Construction</h2>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Ali Jitam ❤️ is currently curating the vocabulary for this unit. Check back soon for new words!
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all">
            Return Home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unit.words.map((w) => (
            <div key={w.id} className="glass rounded-2xl p-6 border border-border/40 hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">{w.word}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-2 py-1 rounded-md">
                  {w.type}
                </span>
              </div>
              <p className="text-sm text-foreground/80 font-medium mb-3">{w.definition}</p>
              <p className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-primary/20 pl-3">
                "{w.example}"
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Signature */}
      <div className="flex justify-center pt-10">
        <p className="text-[10px] font-medium text-muted-foreground/40 italic">
          Platform Architect: <span className="text-foreground/40 font-bold not-italic">Ali Jitam ❤️</span>
        </p>
      </div>
    </div>
  );
}
