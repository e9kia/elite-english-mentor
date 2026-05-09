"use server";
// =====================================================================
//  src/app/actions/study.ts
//  Server Actions for study progress — called directly from Client Components.
//  No API route needed: Next.js 14 handles the RPC automatically.
// =====================================================================

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── SRS rating scale ──────────────────────────────────────────────────────────
// 1 = Again  (forgot completely)
// 2 = Hard   (remembered with great difficulty)
// 3 = Good   (remembered correctly)
// 4 = Easy   (perfect recall, effortless)

export type SrsRating = 1 | 2 | 3 | 4;

interface RateWordInput {
  wordId:   string;
  rating:   SrsRating;
  userId?:  string;       // optional: falls back to first admin in dev
}

// ── SM-2 calculation ─────────────────────────────────────────────────────────

function calcSm2(
  easeFactor: number,
  interval:   number,
  rating:     SrsRating
): { easeFactor: number; interval: number; nextReviewAt: Date } {
  // Ease factor adjustment (SM-2 formula)
  const newEF = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  );

  let newInterval: number;
  if (rating === 1) {
    // Forgot — reset to 1 day
    newInterval = 1;
  } else if (rating === 2) {
    // Hard — small step forward
    newInterval = Math.max(1, Math.round(interval * 1.2));
  } else if (interval === 0) {
    // First correct answer
    newInterval = 1;
  } else if (interval === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * newEF);
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return { easeFactor: newEF, interval: newInterval, nextReviewAt };
}

// ── Mastery level calculation ────────────────────────────────────────────────
// 0 = unseen → 1 = learning → 2 = familiar → 3 = mastered

function calcMastery(timesCorrect: number, timesWrong: number): number {
  if (timesCorrect === 0) return 0;
  if (timesCorrect < 3)   return 1;
  if (timesCorrect < 8)   return 2;
  return 3;
}

// ── Main action ──────────────────────────────────────────────────────────────

export async function rateWord({ wordId, rating, userId }: RateWordInput) {
  // Resolve userId — fall back to first admin in dev
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    resolvedUserId = admin?.id ?? "dev-user-id";
  }

  const isCorrect = rating >= 3;

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
  const masteryLevel    = calcMastery(newTimesCorrect, newTimesWrong);

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

  // Award XP
  const xp = rating === 4 ? 10 : rating === 3 ? 6 : rating === 2 ? 3 : 1;
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
