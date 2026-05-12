// POST /api/student/heartbeat — updates user's lastSeen timestamp
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeen: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[HEARTBEAT]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
