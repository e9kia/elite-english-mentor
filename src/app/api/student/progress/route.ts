// =====================================================================
//  src/app/api/student/progress/route.ts
//  Progress API — Returns levels, units, word counts, and user progress
//  for the Foundation Protocol's Linear Roadmap
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
    let userId: string | null = null;

    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Fallback: use first admin in dev
      const admin = await prisma.user.findFirst({ where: { role: "admin" } });
      userId = admin?.id ?? null;
    }

    const levels = await prisma.level.findMany({
      orderBy: { number: "asc" },
      include: {
        units: {
          orderBy: { number: "asc" },
          include: {
            _count: {
              select: { words: true }
            },
          }
        }
      }
    });

    // Fetch user's unit progress
    let userProgress: Record<number, {
      status: string;
      currentWordIndex: number;
      completedAt: Date | null;
    }> = {};

    let totalXp = 0;
    let wordsLearned = 0;

    if (userId) {
      const progress = await prisma.userUnitProgress.findMany({
        where: { userId },
      });

      for (const p of progress) {
        userProgress[p.unitId] = {
          status: p.status,
          currentWordIndex: p.currentWordIndex,
          completedAt: p.completedAt,
        };
      }

      // Get total XP
      const lb = await prisma.leaderboardSnapshot.findUnique({
        where: { userId },
      });
      totalXp = lb?.totalXp ?? 0;

      // Get total words learned
      const wc = await prisma.userWordMastery.count({
        where: { userId },
      });
      wordsLearned = wc;
    }

    // Enrich levels with progress data
    const enrichedLevels = levels.map(level => ({
      ...level,
      units: level.units.map(unit => ({
        ...unit,
        wordCount: unit._count.words,
        progress: userProgress[unit.id] ?? null,
      })),
    }));

    return NextResponse.json({
      levels: enrichedLevels,
      totalXp,
      wordsLearned,
    });
  } catch (error) {
    console.error("[PROGRESS_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
