import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const levels = await prisma.level.findMany({
      orderBy: { number: "asc" },
      include: {
        units: {
          orderBy: { number: "asc" },
          include: {
            _count: {
              select: { words: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("[PROGRESS_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
