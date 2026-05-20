"use server";
// =====================================================================
//  src/app/actions/study.ts
//  Server Actions for study progress — Foundation Protocol
//  3-Button SRS: Unknown(1) / Medium(2) / Strong(3)
//  + saveWordProgress + completeUnit
//  Designed by Ali Jitam ❤️
// =====================================================================

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── SRS rating scale (SIMPLIFIED — 3 buttons) ────────────────────────
// 1 = New/Unknown  (high frequency review)
// 2 = Medium       (moderate frequency review)
// 3 = Strong       (spaced repetition, long-term)

export type SrsRating = 1 | 2 | 3;

interface RateWordInput {
  wordId:   string;
  rating:   SrsRating;
  userId?:  string;
  unitId?:  number;        // for auto-advancing currentWordIndex
}

// ── SM-2 adapted for 3-button system ─────────────────────────────────

function calcSm2(
  easeFactor: number,
  interval:   number,
  rating:     SrsRating
): { easeFactor: number; interval: number; nextReviewAt: Date } {
  let newEF: number;
  let newInterval: number;

  if (rating === 1) {
    // Unknown — reset to very short interval, high frequency
    newEF = Math.max(1.3, easeFactor - 0.3);
    newInterval = 1; // review tomorrow
  } else if (rating === 2) {
    // Medium — moderate step forward
    newEF = Math.max(1.3, easeFactor - 0.1);
    if (interval === 0) {
      newInterval = 2;
    } else if (interval <= 2) {
      newInterval = 4;
    } else {
      newInterval = Math.round(interval * 1.5);
    }
  } else {
    // Strong — full spaced repetition, long-term
    newEF = Math.min(3.0, easeFactor + 0.15);
    if (interval === 0) {
      newInterval = 4;
    } else if (interval <= 4) {
      newInterval = 10;
    } else {
      newInterval = Math.round(interval * newEF);
    }
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return { easeFactor: newEF, interval: newInterval, nextReviewAt };
}

// ── Mastery level calculation ────────────────────────────────────────
// 0 = unseen → 1 = learning → 2 = familiar → 3 = mastered

function calcMastery(timesCorrect: number, timesWrong: number, rating: SrsRating): number {
  if (rating === 3 && timesCorrect >= 1) return 3; // Strong = instant mastery path
  if (timesCorrect === 0) return 0;
  if (timesCorrect < 3)   return 1;
  if (timesCorrect < 6)   return 2;
  return 3;
}

// ── Main rate action ─────────────────────────────────────────────────

export async function rateWord({ wordId, rating, userId, unitId }: RateWordInput) {
  // Resolve userId — fall back to first admin in dev
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    resolvedUserId = admin?.id ?? "dev-user-id";
  }

  const isCorrect = rating >= 2; // Medium and Strong count as correct

  // Fetch existing mastery record (if any)
  const existing = await prisma.userWordMastery.findUnique({
    where: { userId_wordId: { userId: resolvedUserId, wordId } },
  });

  const prevEF       = existing?.easeFactor ?? 2.5;
  const prevInterval = existing?.interval   ?? 0;
  const prevCorrect  = existing?.timesCorrect ?? 0;
  const prevWrong    = existing?.timesWrong   ?? 0;

  const { easeFactor, interval, nextReviewAt } = calcSm2(prevEF, prevInterval, rating);

  const newTimesCorrect = prevCorrect + (isCorrect ? 1 : 0);
  const newTimesWrong   = prevWrong   + (isCorrect ? 0 : 1);
  const masteryLevel    = calcMastery(newTimesCorrect, newTimesWrong, rating);

  await prisma.userWordMastery.upsert({
    where:  { userId_wordId: { userId: resolvedUserId, wordId } },
    create: {
      userId:       resolvedUserId,
      wordId,
      masteryLevel,
      timesSeen:    1,
      timesCorrect: newTimesCorrect,
      timesWrong:   newTimesWrong,
      easeFactor,
      interval,
      lastSeenAt:   new Date(),
      nextReviewAt,
    },
    update: {
      masteryLevel,
      timesSeen:    { increment: 1 },
      timesCorrect: newTimesCorrect,
      timesWrong:   newTimesWrong,
      easeFactor,
      interval,
      lastSeenAt:   new Date(),
      nextReviewAt,
    },
  });

  // Award XP based on 3-button system
  const xp = rating === 3 ? 10 : rating === 2 ? 5 : 2;
  await prisma.xpEvent.create({
    data: {
      userId:      resolvedUserId,
      eventType:   "quiz_complete",
      xpEarned:    xp,
      referenceId: wordId,
    },
  });

  // Update leaderboard snapshot
  await prisma.leaderboardSnapshot.upsert({
    where:  { userId: resolvedUserId },
    create: { userId: resolvedUserId, totalXp: xp },
    update: { totalXp: { increment: xp } },
  });

  // Revalidate dashboard so stats update
  revalidatePath("/dashboard");

  return { masteryLevel, nextReviewAt, xpEarned: xp };
}

// ── Save word progress (advances currentWordIndex) ───────────────────

export async function saveWordProgress({
  userId,
  unitId,
  newIndex,
}: {
  userId?: string;
  unitId: number;
  newIndex: number;
}) {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    resolvedUserId = admin?.id ?? "dev-user-id";
  }

  await prisma.userUnitProgress.upsert({
    where: { userId_unitId: { userId: resolvedUserId, unitId } },
    create: {
      userId: resolvedUserId,
      unitId,
      status: "in_progress",
      currentWordIndex: newIndex,
      startedAt: new Date(),
    },
    update: {
      currentWordIndex: newIndex,
      status: "in_progress",
    },
  });
}

// ── Complete unit (marks unit as completed, unlocks next) ────────────

export async function completeUnit({
  userId,
  unitId,
  bonusXp = 0,
}: {
  userId?: string;
  unitId: number;
  bonusXp?: number;
}) {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    resolvedUserId = admin?.id ?? "dev-user-id";
  }

  // Mark this unit as completed
  await prisma.userUnitProgress.upsert({
    where: { userId_unitId: { userId: resolvedUserId, unitId } },
    create: {
      userId: resolvedUserId,
      unitId,
      status: "completed",
      completedAt: new Date(),
      startedAt: new Date(),
    },
    update: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  const totalXp = 50 + bonusXp;

  // Award unit_complete XP
  await prisma.xpEvent.create({
    data: {
      userId: resolvedUserId,
      eventType: "unit_complete",
      xpEarned: totalXp,
      referenceId: String(unitId),
    },
  });

  // Update leaderboard
  await prisma.leaderboardSnapshot.upsert({
    where: { userId: resolvedUserId },
    create: { userId: resolvedUserId, totalXp: totalXp },
    update: { totalXp: { increment: totalXp } },
  });

  revalidatePath("/dashboard");

  return { completed: true, xpEarned: totalXp };
}

// ── Toggle notebook check (per-user, per-word) ──────────────────────

export async function toggleNotebookCheck({
  wordId,
  isChecked,
  userId,
}: {
  wordId: string;
  isChecked: boolean;
  userId?: string;
}) {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true } });
    resolvedUserId = admin?.id ?? "dev-user-id";
  }

  await prisma.userWordMastery.upsert({
    where: { userId_wordId: { userId: resolvedUserId, wordId } },
    create: {
      userId: resolvedUserId,
      wordId,
      notebookChecked: isChecked,
    },
    update: {
      notebookChecked: isChecked,
    },
  });

  return { success: true, isChecked };
}
