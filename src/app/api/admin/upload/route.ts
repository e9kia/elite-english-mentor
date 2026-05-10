import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { WordType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder("utf-8");
    const csvText = decoder.decode(arrayBuffer);
    
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(), // Keep original casing but trim
    });

    const rows = parsed.data as any[];
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Create an import batch record
    const batch = await prisma.importBatch.create({
      data: {
        filename: file.name,
        uploadedById: session.user.id,
        totalRows: rows.length,
        status: "processing",
      },
    });

    for (const row of rows) {
      try {
        // Robust mapping: check multiple variants or just the specific ones
        const wordStr = (row.Word || row.word || "").trim();
        const translation = (row.Translation || row.translation || row.Definition || row.definition || "").trim();
        const pos = (row.PartOfSpeech || row.partofspeech || row.Type || row.type || "").trim().toLowerCase();
        const levelNum = parseInt(row.Level || row.level);
        const unitNum = parseInt(row.Unit || row.unit);
        const example = (row.Example || row.example || "").trim();

        if (!wordStr || !translation || isNaN(levelNum) || isNaN(unitNum)) {
          skippedCount++;
          continue;
        }

        // Map POS to enum (Case-Insensitive & Robust)
        let type: WordType = WordType.other;
        const p = pos.trim();
        if (p === "noun" || p.includes("noun")) type = WordType.noun;
        else if (p === "verb" || p.includes("verb")) type = WordType.verb;
        else if (p === "adjective" || p.includes("adj")) type = WordType.adjective;
        else if (p === "adverb" || p.includes("adv")) type = WordType.adverb;
        else if (p === "preposition" || p === "prep" || p.includes("preposition")) type = WordType.preposition;
        else if (p === "pronoun" || p === "pron" || p.includes("pronoun")) type = WordType.pronoun;
        else if (p === "conjunction" || p === "conj" || p.includes("conjunction")) type = WordType.conjunction;
        else if (p === "phrase") type = WordType.phrase;

        // 1. Get or create Level
        const level = await prisma.level.upsert({
          where: { number: levelNum },
          update: {},
          create: {
            number: levelNum,
            title: `Level ${levelNum}`,
          },
        });

        // 2. Get or create Unit
        const unit = await prisma.unit.upsert({
          where: {
            levelId_number: {
              levelId: level.id,
              number: unitNum,
            },
          },
          update: {},
          create: {
            levelId: level.id,
            number: unitNum,
            title: `Unit ${unitNum}`,
          },
        });

        // 3. Upsert Word
        await prisma.word.upsert({
          where: {
            unitId_word: {
              unitId: unit.id,
              word: wordStr,
            },
          },
          update: {
            type,
            definition: translation,
            example: example || "",
            importBatchId: batch.id,
          },
          create: {
            unitId: unit.id,
            word: wordStr,
            type,
            definition: translation,
            example: example || "",
            importBatchId: batch.id,
            createdById: session.user.id,
          },
        });

        importedCount++;
      } catch (err: any) {
        errorCount++;
        errors.push({ row, reason: err.message });
      }
    }

    // Update batch status
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        importedCount,
        skippedCount,
        errorCount,
        status: "done",
        errorLog: errors as any,
      },
    });

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      errorCount,
      batchId: batch.id,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
