import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { WordType } from "@prisma/client";
import { z } from "zod";

// 1. STRICT ZOD SCHEMA
const wordSchema = z.object({
  word: z.string(),
  type: z.enum(["noun", "verb", "adjective", "adverb", "preposition", "pronoun", "conjunction", "phrase", "other"]),
  definition: z.string(),
  example: z.string(),
  level: z.number(),
  unit: z.number(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // MANDATORY ENCODING FIX FOR ARABIC
    const buffer = await file.arrayBuffer();
    const csvText = new TextDecoder("utf-8").decode(buffer);

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    const rows = parsed.data as any[];
    let importedCount = 0;
    const errors: any[] = [];

    const batch = await prisma.importBatch.create({
      data: {
        filename: file.name,
        uploadedById: session.user.id,
        totalRows: rows.length,
        status: "processing",
      },
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const wordRaw = (row.Word || row.word || "").trim();
        const translation = (row.Translation || row.translation || row.Definition || row.definition || "").trim();
        const rawPos = (row.PartOfSpeech || row.partofspeech || row.Type || row.type || "").trim().toLowerCase();
        const levelNum = parseInt(row.Level || row.level);
        const unitNum = parseInt(row.Unit || row.unit);
        const example = (row.Example || row.example || "").trim();

        // MANDATORY HARD-CODED MAPPING
        let type: WordType = WordType.other;
        const wordLower = wordRaw.toLowerCase();
        if (wordLower === "among") type = WordType.preposition;
        else if (wordLower === "none") type = WordType.pronoun;
        else if (wordLower === "since") type = WordType.conjunction;
        else {
          if (rawPos.includes("noun")) type = WordType.noun;
          else if (rawPos.includes("verb")) type = WordType.verb;
          else if (rawPos.includes("adjective") || rawPos === "adj") type = WordType.adjective;
          else if (rawPos.includes("adverb") || rawPos === "adv") type = WordType.adverb;
          else if (rawPos.includes("preposition") || rawPos === "prep") type = WordType.preposition;
          else if (rawPos.includes("pronoun") || rawPos === "pron") type = WordType.pronoun;
          else if (rawPos.includes("conjunction") || rawPos === "conj") type = WordType.conjunction;
          else if (rawPos.includes("phrase")) type = WordType.phrase;
        }

        const validated = wordSchema.parse({
          word: wordRaw,
          type: type,
          definition: translation,
          example: example,
          level: levelNum,
          unit: unitNum,
        });

        // RECURSIVE UPSERT (Forced Creation)
        const level = await prisma.level.upsert({
          where: { number: validated.level },
          update: {},
          create: { number: validated.level, title: `Level ${validated.level}` },
        });

        const unit = await prisma.unit.upsert({
          where: {
            levelId_number: { levelId: level.id, number: validated.unit },
          },
          update: {},
          create: { levelId: level.id, number: validated.unit, title: `Unit ${validated.unit}` },
        });

        await prisma.word.upsert({
          where: {
            unitId_word: { unitId: unit.id, word: validated.word },
          },
          update: {
            type: validated.type,
            definition: validated.definition,
            example: validated.example,
            importBatchId: batch.id,
          },
          create: {
            unitId: unit.id,
            word: validated.word,
            type: validated.type,
            definition: validated.definition,
            example: validated.example,
            importBatchId: batch.id,
            createdById: session.user.id,
          },
        });

        importedCount++;
      } catch (e: any) {
        errors.push({ row: i + 1, reason: e.message });
      }
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { importedCount, status: "done", errorLog: errors as any },
    });

    return NextResponse.json({ success: true, importedCount, batchId: batch.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
