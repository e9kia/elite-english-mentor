import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function LevelOverviewPage({ params }: { params: { levelId: string } }) {
  const levelNumber = parseInt(params.levelId);
  if (isNaN(levelNumber)) return notFound();

  const level = await prisma.level.findUnique({
    where: { number: levelNumber },
    include: {
      units: {
        orderBy: { number: "asc" },
        include: {
          _count: { select: { words: true } }
        }
      }
    }
  });

  if (!level) return notFound();

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-foreground">Level {level.number} Overview</h1>
        <Link href="/dashboard" className="text-sm font-bold text-muted-foreground hover:text-foreground">
          ← Back to Hub
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {level.units.map((unit) => (
          <Link 
            key={unit.id} 
            href={`/learn/${unit.id}`}
            className="glass rounded-[2rem] p-8 border border-border/40 hover:border-primary/30 transition-all group flex flex-col gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
              {unit.number}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{unit.title}</h3>
              <p className="text-sm text-muted-foreground">{unit._count.words} Words</p>
            </div>
            <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/20">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Start Unit</span>
              <svg className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M5 12h12" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
