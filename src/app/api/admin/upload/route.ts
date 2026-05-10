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

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      
      try {
        const wordStr = (row.Word || row.word || "").trim();
        const translation = (row.Translation || row.translation || row.Definition || row.definition || "").trim();
        const rawPos = (row.PartOfSpeech || row.partofspeech || row.Type || row.type || "").trim();
        const pos = rawPos.toLowerCase();
        const levelNum = parseInt(row.Level || row.level);
        const unitNum = parseInt(row.Unit || row.unit);
        const example = (row.Example || row.example || "").trim();

        if (!wordStr || !translation || isNaN(levelNum) || isNaN(unitNum)) {
          console.warn(`[UPLOAD] Row ${rowNum} SKIPPED: Missing fields (Word: ${wordStr}, L: ${levelNum}, U: ${unitNum})`);
          skippedCount++;
          continue;
        }

        // Map POS to enum (ULTRA-PRECISE)
        let type: WordType = WordType.other;
        if (pos.includes("noun")) type = WordType.noun;
        else if (pos.includes("verb")) type = WordType.verb;
        else if (pos.includes("adjective") || pos === "adj") type = WordType.adjective;
        else if (pos.includes("adverb") || pos === "adv") type = WordType.adverb;
        else if (pos.includes("preposition") || pos === "prep" || pos === "prepositional") type = WordType.preposition;
        else if (pos.includes("pronoun") || pos === "pron") type = WordType.pronoun;
        else if (pos.includes("conjunction") || pos === "conj") type = WordType.conjunction;
        else if (pos.includes("phrase")) type = WordType.phrase;

        // 1. Level Upsert
        const level = await prisma.level.upsert({
          where: { number: levelNum },
          update: {},
          create: {
            number: levelNum,
            title: `Level ${levelNum}`,
          },
        });

        // 2. Unit Upsert (Critical: ensure Level ID is used)
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

        // 3. Word Upsert
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
            updatedAt: new Date(),
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

        console.log(`[UPLOAD] Row ${rowNum} OK: ${wordStr} in L${levelNum}U${unitNum}`);
        importedCount++;
      } catch (err: any) {
        console.error(`[UPLOAD] Row ${rowNum} ERROR: ${err.message}`);
        errorCount++;
        errors.push({ row: rowNum, reason: err.message });
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
