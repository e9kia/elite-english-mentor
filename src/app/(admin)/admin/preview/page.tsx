import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminPreviewHub() {
  const levels = await prisma.level.findMany({
    orderBy: { number: "asc" },
    include: {
      units: {
        orderBy: { number: "asc" },
        include: { _count: { select: { words: true } } },
      },
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Content Preview Hub</h1>
        <p className="text-muted-foreground mt-1">Verify uploaded words and flashcards across all levels and units.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level) => (
          <div key={level.id} className="glass rounded-2xl border border-border/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary">
                L{level.number}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{level.title}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">30 Units</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {level.units.map((unit) => {
                const hasWords = unit._count.words > 0;
                return (
                  <a
                    key={unit.id}
                    href={hasWords ? `/admin/preview/${level.number}/${unit.number}` : "#"}
                    title={hasWords ? `${unit.title} (${unit._count.words} words)` : "Empty unit"}
                    className={cn(
                      "h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                      hasWords 
                        ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20" 
                        : "bg-muted text-muted-foreground/30 border border-transparent cursor-not-allowed"
                    )}
                  >
                    U{unit.number}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
