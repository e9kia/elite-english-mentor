import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminFlashcardPreview({
  params,
}: {
  params: { levelId: string; unitId: string };
}) {
  const levelNumber = parseInt(params.levelId);
  const unitNumber = parseInt(params.unitId);

  if (isNaN(levelNumber) || isNaN(unitNumber)) notFound();

  const unit = await prisma.unit.findFirst({
    where: {
      number: unitNumber,
      level: { number: levelNumber },
    },
    include: {
      level: { select: { number: true, title: true } },
      words: {
        orderBy: { word: "asc" },
      },
    },
  });

  if (!unit) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <a href="/admin/preview" className="hover:text-foreground">Preview Hub</a>
            <span>/</span>
            <span>Level {levelNumber}</span>
            <span>/</span>
            <span className="text-foreground">{unit.title}</span>
          </nav>
          <h1 className="text-3xl font-bold text-foreground">{unit.title} Flashcards</h1>
          <p className="text-muted-foreground mt-1">Read-only preview of {unit.words.length} words.</p>
        </div>
        <a 
          href="/admin/preview"
          className="px-4 py-2 bg-muted text-foreground text-sm font-semibold rounded-xl hover:bg-muted/80 transition-colors"
        >
          Back to Hub
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {unit.words.map((w) => (
          <div key={w.id} className="glass rounded-2xl border border-border/50 p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">{w.word}</h3>
                <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded-md inline-block mt-1">
                  {w.type} {w.phonetic && `· ${w.phonetic}`}
                </p>
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                w.difficulty === 1 ? "bg-emerald-500/10 text-emerald-500" :
                w.difficulty === 2 ? "bg-amber-500/10 text-amber-500" :
                "bg-rose-500/10 text-rose-500"
              )}>
                Lvl {w.difficulty}
              </span>
            </div>
            
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Definition</p>
              <p className="text-sm text-foreground leading-relaxed">{w.definition}</p>
            </div>

            {w.example && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Example</p>
                <p className="text-sm text-foreground italic leading-relaxed">"{w.example}"</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {unit.words.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/50">
          <p className="text-muted-foreground">No words in this unit to preview.</p>
        </div>
      )}
    </div>
  );
}
