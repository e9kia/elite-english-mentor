// src/app/api/admin/words/route.ts
// GET — all words with unit/level context for the admin word manager

export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const words = await prisma.word.findMany({
    orderBy: [{ unit: { level: { number: "asc" } } }, { unit: { number: "asc" } }, { word: "asc" }],
    select: {
      id: true, word: true, type: true, definition: true,
      example: true, phonetic: true, difficulty: true,
      unit: { select: { number: true, level: { select: { number: true } } } },
    },
  });
  return NextResponse.json({ words });
}
