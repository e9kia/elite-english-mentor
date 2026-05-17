// =====================================================================
//  scripts/seedStory.ts
//  Seeds a dummy story for Unit 1
//  Run: npx ts-node --project tsconfig.json scripts/seedStory.ts
// =====================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄  Seeding dummy story for Unit 1...");

  // Assuming Unit 1 exists
  const unit = await prisma.unit.findFirst({
    where: { number: 1, level: { number: 1 } },
  });

  if (!unit) {
    console.error("❌ Unit 1 not found. Please ensure DB is seeded with units first.");
    return;
  }

  // Delete existing story if any
  await prisma.story.deleteMany({
    where: { unitId: unit.id },
  });

  const content = [
    {
      en: "The ability to learn a new language is a great advantage in modern life.",
      ar: "القدرة على تعلم لغة جديدة هي ميزة كبيرة في الحياة العصرية.",
    },
    {
      en: "Many people feel afraid when they begin, but they should not abandon their goals.",
      ar: "يشعر الكثير من الناس بالخوف عندما يبدأون، لكن لا ينبغي لهم أن يتخلوا عن أهدافهم.",
    },
    {
      en: "To achieve success, you must absorb new words and accept that mistakes are normal.",
      ar: "لتحقيق النجاح، يجب أن تستوعب كلمات جديدة وتقبل أن الأخطاء أمر طبيعي.",
    },
    {
      en: "A good student is active, always trying to apply what they learn in conversation.",
      ar: "الطالب الجيد هو طالب نشيط، ويحاول دائمًا تطبيق ما يتعلمه في المحادثة.",
    },
  ];

  const quizData = [
    {
      question: "What is a great advantage in modern life?",
      options: ["Being afraid", "Learning a new language", "Making mistakes", "Abandoning goals"],
      answerIndex: 1,
    },
    {
      question: "What should people NOT do when they feel afraid?",
      options: ["Abandon their goals", "Accept mistakes", "Absorb words", "Be active"],
      answerIndex: 0,
    },
    {
      question: "How should a good student behave?",
      options: ["They should avoid conversation", "They should only study grammar", "They should be active and apply what they learn", "They should be afraid"],
      answerIndex: 2,
    },
  ];

  await prisma.story.create({
    data: {
      unitId: unit.id,
      title: "The Journey of Learning",
      content: content,
      quizData: quizData,
    },
  });

  console.log("✅  Story seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
