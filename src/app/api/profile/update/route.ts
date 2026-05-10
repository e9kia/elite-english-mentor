import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username, avatarUrl } = await req.json().catch(() => ({}));

  if (!username || username.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
  }

  // Check if username is taken by someone else
  const existing = await prisma.user.findFirst({
    where: { username, id: { not: session.user.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { username, avatarUrl },
    });
    return NextResponse.json({ success: true, user: { username: updated.username, avatarUrl: updated.avatarUrl } });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
