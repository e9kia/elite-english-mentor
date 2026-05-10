// src/app/api/social/friends/route.ts
// GET  — list my friends + pending requests
// POST — send a friend request

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function resolveUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

const USER_SELECT = {
  id: true, username: true, avatarUrl: true, role: true,
  leaderboard: { select: { totalXp: true, streakDays: true } },
} as const;

export async function GET(req: NextRequest) {
  const userId = await resolveUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accepted, pending, incoming] = await Promise.all([
    // Accepted friends (both directions)
    prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: USER_SELECT },
        addressee: { select: USER_SELECT },
      },
    }),
    // Outgoing pending
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "pending" },
      include: { addressee: { select: USER_SELECT } },
    }),
    // Incoming pending
    prisma.friendship.findMany({
      where: { addresseeId: userId, status: "pending" },
      include: { requester: { select: USER_SELECT } },
    }),
  ]);

  const friends = accepted
    .map((f) => ({
      friendshipId: f.id,
      friend: f.requesterId === userId ? f.addressee : f.requester,
      since: f.createdAt,
    }))
    .filter((f) => f.friend.role !== "admin");

  return NextResponse.json({ 
    friends, 
    pending: pending.filter(p => p.addressee.role !== 'admin'), 
    incoming: incoming.filter(i => i.requester.role !== 'admin') 
  });
}

export async function POST(req: NextRequest) {
  const userId = await resolveUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json().catch(() => ({}));
  if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  if (targetUserId === userId) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

  // Check for existing relationship in either direction
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId,       addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: userId },
      ],
    },
  });
  if (existing) {
    if (existing.status === "accepted")
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    if (existing.status === "pending")
      return NextResponse.json({ error: "Request already sent" }, { status: 409 });
    if (existing.status === "blocked")
      return NextResponse.json({ error: "Cannot send request" }, { status: 403 });
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: userId, addresseeId: targetUserId },
    include: { addressee: { select: { username: true } } },
  });

  return NextResponse.json({ success: true, friendship }, { status: 201 });
}
