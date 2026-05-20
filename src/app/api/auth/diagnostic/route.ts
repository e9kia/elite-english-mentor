export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const diagnosticInfo: any = {
    timestamp: new Date().toISOString(),
    databaseUrlStatus: {
      hasUrl: !!process.env.DATABASE_URL,
      // Redact sensitive details, only show host for verification
      redactedUrl: process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.replace(/:[^@]+@/, ":****@").split("?")[0] 
        : null,
    },
    nextAuthUrl: process.env.NEXTAUTH_URL || "NOT_SET",
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  };

  try {
    // 1. Try querying the database
    const usersCount = await prisma.user.count();
    diagnosticInfo.databaseConnection = "SUCCESSFUL";
    diagnosticInfo.totalUsersInDatabase = usersCount;

    // 2. Query target user
    const targetEmail = "gattam035@gmail.com";
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (user) {
      diagnosticInfo.adminUserFound = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        hasPasswordHash: !!user.passwordHash,
        passwordHashStartsWith: user.passwordHash ? user.passwordHash.substring(0, 8) : null,
      };

      // Test verify password matching inside the Vercel context
      const testPassword = "AliJitam2026!";
      if (user.passwordHash) {
        const valid = await bcrypt.compare(testPassword, user.passwordHash);
        diagnosticInfo.passwordVerificationTest = valid ? "PASS - VERIFIED SUCCESSFULLY" : "FAIL - PASSWORD HASH MISMATCH";
      } else {
        diagnosticInfo.passwordVerificationTest = "FAIL - NO PASSWORD HASH";
      }
    } else {
      diagnosticInfo.adminUserFound = null;
      
      // Fetch up to 5 sample users to diagnose what data is in Vercel's DB
      const sampleUsers = await prisma.user.findMany({
        take: 5,
        select: {
          email: true,
          username: true,
          role: true,
        }
      });
      diagnosticInfo.sampleUsersInDatabase = sampleUsers;
    }

  } catch (err: any) {
    diagnosticInfo.databaseConnection = "FAILED";
    diagnosticInfo.databaseError = err.message || String(err);
  }

  return NextResponse.json(diagnosticInfo, { status: 200 });
}
