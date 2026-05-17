// =====================================================================
//  src/app/api/student/progress/route.ts
//  Progress API — Optimized Prisma queries with select fields
//  Designed by Ali Jitam ❤️
// =====================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let userId: string | null = session?.user?.id ?? null;

    if (!userId) {
      const admin = await prisma.user.findFirst({
        where: { role: "admin" },
        select: { id: true },
      });
      userId = admin?.id ?? null;
    }

    // Optimized: select only needed fields
    const levels = await prisma.level.findMany({
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        title: true,
        description: true,
        units: {
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            title: true,
            _count: { select: { words: true } },
          },
        },
      },
    });

    let userProgress: Record<number, {
      status: string;
      currentWordIndex: number;
      completedAt: Date | null;
    }> = {};
    let totalXp = 0;
    let wordsLearned = 0;

    if (userId) {
      const [progress, lb, wc] = await Promise.all([
        prisma.userUnitProgress.findMany({
          where: { userId },
          select: { unitId: true, status: true, currentWordIndex: true, completedAt: true },
        }),
        prisma.leaderboardSnapshot.findUnique({
          where: { userId },
          select: { totalXp: true },
        }),
        prisma.userWordMastery.count({ where: { userId } }),
      ]);

      for (const p of progress) {
        userProgress[p.unitId] = {
          status: p.status,
          currentWordIndex: p.currentWordIndex,
          completedAt: p.completedAt,
        };
      }
      totalXp = lb?.totalXp ?? 0;
      wordsLearned = wc;
    }

    const enrichedLevels = levels.map(level => ({
      ...level,
      units: level.units.map(unit => ({
        ...unit,
        wordCount: unit._count.words,
        progress: userProgress[unit.id] ?? null,
      })),
    }));

    return NextResponse.json({ levels: enrichedLevels, totalXp, wordsLearned });
  } catch (error) {
    console.error("[PROGRESS_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
