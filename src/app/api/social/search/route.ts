// src/app/api/social/search/route.ts
// GET /api/social/search?q=username — user search for Add Friends

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // Get current user for exclusion + friendship status overlay
  const session = await getServerSession(authOptions);
  const meId  = session?.user?.id;

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { NOT: { id: meId ?? "" } },
        {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { email:    { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    take: 10,
    select: {
      id:        true,
      username:  true,
      avatarUrl: true,
      role:      true,
      leaderboard: { select: { totalXp: true } },
    },
  });

  // Overlay friendship status if we have a current user
  let friendshipMap: Record<string, string> = {};
  if (meId && users.length > 0) {
    const ids = users.map((u) => u.id);
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: meId, addresseeId: { in: ids } },
          { addresseeId: meId, requesterId: { in: ids } },
        ],
      },
    });
    friendshipMap = Object.fromEntries(
      friendships.map((f) => {
        const otherId = f.requesterId === meId ? f.addresseeId : f.requesterId;
        return [otherId, f.status];
      })
    );
  }

  const result = users.map((u) => ({
    ...u,
    friendshipStatus: friendshipMap[u.id] ?? null,
  }));

  return NextResponse.json({ users: result });
}
