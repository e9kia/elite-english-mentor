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

    const csvText = await file.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
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
        const wordStr = row.Word?.trim();
        const translation = row.Translation?.trim();
        const pos = row.PartOfSpeech?.trim().toLowerCase();
        const levelNum = parseInt(row.Level);
        const unitNum = parseInt(row.Unit);
        const example = row.Example?.trim();

        if (!wordStr || !translation || isNaN(levelNum) || isNaN(unitNum)) {
          skippedCount++;
          continue;
        }

        // Map POS to enum
        let type: WordType = WordType.other;
        if (pos === "noun") type = WordType.noun;
        else if (pos === "verb") type = WordType.verb;
        else if (pos === "adjective") type = WordType.adjective;
        else if (pos === "adverb") type = WordType.adverb;
        else if (pos === "phrase") type = WordType.phrase;

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
