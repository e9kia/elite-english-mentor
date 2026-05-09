// =====================================================================
//  src/app/api/admin/import/route.ts
//  POST /api/admin/import  — Excel / CSV bulk word import
//  GET  /api/admin/import  — List past import batches
// =====================================================================
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { importWordsFromBuffer } from "@/lib/import/wordImporter";
import { prisma } from "@/lib/prisma";

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────
//  Dev bypass helper
//  In development: if no JWT session exists, look up the first admin
//  in the DB. This lets you test imports before the login page is built.
//  TODO: remove once /auth/login is implemented.
// ─────────────────────────────────────────────────────────────────────
async function resolveUser() {
  try {
    // Try real session first
    const session = await getServerSession(authOptions);
    if (session?.user) return session.user;
  } catch {
    // getServerSession can throw if next-auth config has issues — ignore
  }

  if (process.env.NODE_ENV === "development") {
    try {
      const admin = await prisma.user.findFirst({ where: { role: "admin" } });
      if (admin) {
        console.warn(`[DEV BYPASS] Using admin fallback: ${admin.email}`);
        return { id: admin.id, role: admin.role as string, email: admin.email, username: "admin" };
      }
      // No admin in DB yet — return a synthetic dev user so you can still test
      console.warn("[DEV BYPASS] No admin in DB yet. Using synthetic dev user.");
      return { id: "dev-user-id", role: "admin", email: "dev@local", username: "dev" };
    } catch (dbErr) {
      console.error("[DEV BYPASS] DB lookup failed:", dbErr);
      // DB not connected — still return synthetic user so the route doesn't 500
      return { id: "dev-user-id", role: "admin", email: "dev@local", username: "dev" };
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────
//  POST /api/admin/import
// ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Outer safety net — this route ALWAYS returns JSON
  try {
    // ── 1. Auth ───────────────────────────────────────────────────
    const user = await resolveUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: no session" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });
    }

    // ── 2. Parse multipart form ───────────────────────────────────
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse form data", detail: String(e) },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file received. Make sure the form field is named "file".' },
        { status: 400 }
      );
    }

    // ── 3. Validate type + size ───────────────────────────────────
    const filename = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => filename.endsWith(ext));
    if (!hasValidExt) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 415 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_SIZE_MB} MB)` },
        { status: 413 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // ── 4. Read file into Buffer ──────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());

    // ── 5. Run import engine ──────────────────────────────────────
    const result = await importWordsFromBuffer({
      uploadedById: user.id,
      filename: file.name,
      buffer,
      upsertDuplicates: formData.get("upsertDuplicates") === "true",
    });

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      totalRows: result.totalRows,
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
      errorCount: result.errorCount,
      errors: result.errors,
      durationMs: result.durationMs,
      message: `Import complete: ${result.importedCount} words imported, ${result.errorCount} errors.`,
    });

  } catch (err) {
    // This catches ANY unhandled error and returns it as clean JSON
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/admin/import POST] Unhandled error:", err);
    return NextResponse.json(
      {
        error: "Server error during import",
        detail: message,
        hint: message.includes("prisma") || message.includes("database") || message.includes("P1")
          ? "Database may not be connected. Run: npx prisma migrate dev && npm run db:seed"
          : undefined,
      },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
//  GET /api/admin/import  — fetch past import batches
// ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const batches = await prisma.importBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { uploadedBy: { select: { username: true, email: true } } },
    });

    return NextResponse.json({ batches });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/admin/import GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch batches", detail: message },
      { status: 500 }
    );
  }
}
