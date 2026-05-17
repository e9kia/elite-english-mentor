"use server";
// =====================================================================
//  src/app/actions/admin.ts
//  Admin Server Actions (Story Builder, etc.)
// =====================================================================

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function upsertStory(data: {
  levelId: number;
  unitNumber: number;
  title: string;
  content: { en: string; ar: string }[];
  quizData: { question: string; options: string[]; answerIndex: number }[];
}) {
  const session = await getServerSession(authOptions);
  
  if (process.env.NODE_ENV !== "development") {
    if (!session || session.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required.");
    }
  }

  // Find the unit
  const unit = await prisma.unit.findFirst({
    where: {
      number: data.unitNumber,
      level: { number: data.levelId },
    },
  });

  if (!unit) {
    throw new Error(`Unit ${data.unitNumber} in Level ${data.levelId} not found. Please create the unit first.`);
  }

  // Upsert the story
  const story = await prisma.story.upsert({
    where: { unitId: unit.id },
    create: {
      unitId: unit.id,
      title: data.title,
      content: data.content,
      quizData: data.quizData,
    },
    update: {
      title: data.title,
      content: data.content,
      quizData: data.quizData,
    },
  });

  revalidatePath(`/learn/${unit.id}`);
  revalidatePath("/admin/stories");

  return { success: true, storyId: story.id };
}
