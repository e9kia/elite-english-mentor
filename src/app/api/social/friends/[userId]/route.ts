// src/app/api/social/friends/[userId]/route.ts
// PATCH — accept or decline a friend request
// DELETE — remove a friendship

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function resolveMe(req: NextRequest) {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  return admin?.id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const meId = await resolveMe(req);
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json().catch(() => ({}));
  if (!["accept", "decline", "block"].includes(action)) {
    return NextResponse.json({ error: "action must be accept|decline|block" }, { status: 400 });
  }

  const statusMap: Record<string, "accepted" | "declined" | "blocked"> = {
    accept: "accepted", decline: "declined", block: "blocked",
  };

  const friendship = await prisma.friendship.updateMany({
    where: {
      requesterId: params.userId,
      addresseeId: meId,
      status: "pending",
    },
    data: { status: statusMap[action] },
  });

  if (friendship.count === 0)
    return NextResponse.json({ error: "Request not found" }, { status: 404 });

  return NextResponse.json({ success: true, action });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const meId = await resolveMe(req);
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: meId,          addresseeId: params.userId },
        { requesterId: params.userId, addresseeId: meId },
      ],
    },
  });

  return NextResponse.json({ success: true });
}
