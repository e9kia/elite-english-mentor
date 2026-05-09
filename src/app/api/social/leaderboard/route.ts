// src/app/api/social/leaderboard/route.ts
// GET — returns global top 50 + friends-only leaderboard

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

async function getMe(req: NextRequest) {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  return admin?.id ?? null;
}

async function buildRows(userIds?: string[]) {
  const where = userIds ? { userId: { in: userIds } } : {};
  const rows = await prisma.leaderboardSnapshot.findMany({
    where,
    orderBy: { totalXp: "desc" },
    take: 50,
    include: {
      user: { select: { username: true, avatarUrl: true, createdAt: true } },
    },
  });

  const masteryTotals = await prisma.userWordMastery.groupBy({
    by: ["userId"],
    _count: { wordId: true },
    where: { masteryLevel: { gte: 3 }, ...(userIds ? { userId: { in: userIds } } : {}) },
  });
  const masteryMap = Object.fromEntries(masteryTotals.map((m) => [m.userId, m._count.wordId]));

  return rows.map((r, i) => ({
    rank:         i + 1,
    userId:       r.userId,
    username:     r.user.username,
    totalXp:      r.totalXp,
    masteredWords: masteryMap[r.userId] ?? 0,
    joinedAt:     r.user.createdAt,
  }));
}

export async function GET(req: NextRequest) {
  const meId = await getMe(req);

  // Friends list for the "Friends" tab
  let friendIds: string[] = [];
  if (meId) {
    const friendships = await prisma.friendship.findMany({
      where: { status: "accepted", OR: [{ requesterId: meId }, { addresseeId: meId }] },
    });
    friendIds = [
      meId,
      ...friendships.map((f) => (f.requesterId === meId ? f.addresseeId : f.requesterId)),
    ];
  }

  const [globalRows, friendRows] = await Promise.all([
    buildRows(),
    friendIds.length > 0 ? buildRows(friendIds) : Promise.resolve([]),
  ]);

  return NextResponse.json({ global: globalRows, friends: friendRows });
}
