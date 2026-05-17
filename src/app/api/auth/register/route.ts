// src/app/api/auth/register/route.ts
// POST /api/auth/register — creates a new student account.

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma }  from "@/lib/prisma";
import bcrypt      from "bcryptjs";
import { z }       from "zod";

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, underscores"),
  email:    z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  const { username, email, password } = parsed.data;

  try {
    // Check for existing email / username case-insensitively
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: { equals: username, mode: "insensitive" } }
        ]
      },
    });
    
    if (existing) {
      const conflict = existing.email.toLowerCase() === email.toLowerCase() ? "Email" : "Username";
      return NextResponse.json({ error: `${conflict} is already taken` }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Ali Jitam ❤️: First user to sign up becomes Admin
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "admin" : "student";

    const user = await prisma.user.create({
      data: {
        username,
        email:        email.toLowerCase(),
        passwordHash,
        role,
      },
      select: { id: true, username: true, email: true, role: true },
    });

    // Initialize leaderboard entry
    await prisma.leaderboardSnapshot.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, totalXp: 0 },
      update: {},
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err: any) {
    console.error("[REGISTER ERROR]", err);
    
    // Handle Prisma unique constraint violations gracefully
    if (err.code === "P2002") {
      const target = err.meta?.target?.[0] || "Field";
      return NextResponse.json({ error: `${target} is already taken` }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Registration failed", detail: err.message }, { status: 500 });
  }
}
