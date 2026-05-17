// =====================================================================
//  Level View — Units + Word Bank Tabs (Server Component)
//  Elite Midnight Gold · Designed by Ali Jitam ❤️
// =====================================================================
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LevelClient from "./LevelClient";

export const dynamic = "force-dynamic";
const LEVEL_ICONS: Record<number, string> = { 1: "🌱", 2: "🚀", 3: "💎", 4: "⚔️", 5: "🔥", 6: "👑" };

export default async function LevelOverviewPage({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = await params;
  const levelNumber = parseInt(levelId);
  if (isNaN(levelNumber)) return notFound();

  const level = await prisma.level.findUnique({
    where: { number: levelNumber },
    select: {
      id: true, number: true, title: true, description: true,
      units: {
        orderBy: { number: "asc" },
        select: { id: true, number: true, title: true, _count: { select: { words: true } } },
      },
    },
  });
  if (!level) return notFound();

  const session = await getServerSession(authOptions);
  let userId: string | null = session?.user?.id ?? null;
  if (!userId) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true } });
    userId = admin?.id ?? null;
  }

  let unitProgressMap: Record<number, { status: string; currentWordIndex: number }> = {};
  if (userId) {
    const progress = await prisma.userUnitProgress.findMany({
      where: { userId, unitId: { in: level.units.map(u => u.id) } },
      select: { unitId: true, status: true, currentWordIndex: true },
    });
    for (const p of progress) unitProgressMap[p.unitId] = { status: p.status, currentWordIndex: p.currentWordIndex };
  }

  const words = await prisma.word.findMany({
    where: { unitId: { in: level.units.map(u => u.id) } },
    select: { id: true, word: true, type: true, definition: true, meaningArabic: true, unitId: true },
    orderBy: { word: "asc" },
  });

  let wordMasteryMap: Record<string, number> = {};
  if (userId) {
    const masteries = await prisma.userWordMastery.findMany({
      where: { userId, wordId: { in: words.map(w => w.id) } },
      select: { wordId: true, masteryLevel: true },
    });
    for (const m of masteries) wordMasteryMap[m.wordId] = m.masteryLevel;
  }

  const units = level.units.map((unit, i) => {
    const progress = unitProgressMap[unit.id] ?? null;
    const isCompleted = progress?.status === "completed";
    const prevCompleted = i === 0 ? true : (unitProgressMap[level.units[i - 1].id]?.status === "completed" || false);
    return {
      id: unit.id, number: unit.number, title: unit.title, wordCount: unit._count.words,
      isCompleted, isUnlocked: i === 0 || prevCompleted || isCompleted,
      isActive: !isCompleted && (i === 0 || prevCompleted), currentWordIndex: progress?.currentWordIndex ?? 0,
    };
  });

  return (
    <LevelClient
      level={{ id: level.id, number: level.number, title: level.title, description: level.description, icon: LEVEL_ICONS[level.number] ?? "📚" }}
      units={units}
      words={words}
      wordMasteryMap={wordMasteryMap}
    />
  );
}
