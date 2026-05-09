// src/app/api/admin/words/[wordId]/route.ts
// PATCH — update word fields
// DELETE — remove a word
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  word: z.string().min(1).optional(),
  definition: z.string().min(1).optional(),
  example: z.string().min(1).optional(),
  phonetic: z.string().optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional(),
  type: z.enum(["noun", "verb", "adjective", "adverb", "phrase", "other"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ wordId: string }> }
) {
  const { wordId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }
  const word = await prisma.word.update({
    where: { id: wordId },
    data: parsed.data,
    select: { id: true, word: true, type: true, definition: true, example: true, phonetic: true, difficulty: true },
  }).catch(() => null);

  if (!word) return NextResponse.json({ error: "Word not found" }, { status: 404 });
  return NextResponse.json({ success: true, word });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ wordId: string }> }
) {
  const { wordId } = await params;
  await prisma.word.delete({ where: { id: wordId } }).catch(() => null);
  return NextResponse.json({ success: true });
}
