// =====================================================================
//  prisma/seed.ts
//  Seeds the 6 levels and 30 units per level (180 units total).
//  Also creates the default admin user.
//  Run: npm run db:seed
// =====================================================================

import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LEVEL_META = [
  { number: 1, title: "Level 1 — Beginner",        colorTheme: "#4f46e5", description: "Core vocabulary for everyday situations." },
  { number: 2, title: "Level 2 — Elementary",       colorTheme: "#0891b2", description: "Building blocks of conversational English." },
  { number: 3, title: "Level 3 — Pre-Intermediate", colorTheme: "#059669", description: "Expanding vocabulary for academic contexts." },
  { number: 4, title: "Level 4 — Intermediate",     colorTheme: "#d97706", description: "Complex structures and topic-specific words." },
  { number: 5, title: "Level 5 — Upper-Intermediate",colorTheme: "#dc2626", description: "Advanced academic and professional vocabulary." },
  { number: 6, title: "Level 6 — Advanced",         colorTheme: "#7c3aed", description: "Sophisticated vocabulary for fluent expression." },
];

const UNIT_TITLES: Record<number, string[]> = {
  1: [
    "Family & Relationships","Daily Routines","Food & Drink","Numbers & Time",
    "Colors & Shapes","Home & Furniture","School & Education","Animals",
    "Weather & Seasons","Travel & Transport","Shopping","Health & Body",
    "Jobs & Work","Feelings & Emotions","Nature & Environment","Sports & Hobbies",
    "Technology & Internet","Money & Finance","Clothes & Fashion","Art & Music",
    "Science & Discovery","Government & Society","Law & Justice","Communication",
    "Trade & Business","Culture & Traditions","Religion & Philosophy",
    "Literature & Writing","History & Geography","Review & Assessment",
  ],
};

// Levels 2–6 use generic unit titles — replace with real book chapter names later
for (let lvl = 2; lvl <= 6; lvl++) {
  UNIT_TITLES[lvl] = Array.from({ length: 30 }, (_, i) => `Unit ${i + 1}`);
}

async function main() {
  console.log("🌱  Starting database seed...\n");

  // ── Admin user ──────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    ?? "admin@englearn.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const hash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email:        adminEmail,
      username:     "admin",
      passwordHash: hash,
      role:         Role.admin,
    },
  });
  console.log(`✅  Admin user: ${admin.email}`);

  // ── Levels & Units ──────────────────────────────────────────────
  for (const meta of LEVEL_META) {
    const level = await prisma.level.upsert({
      where:  { number: meta.number },
      update: { title: meta.title, colorTheme: meta.colorTheme },
      create: meta,
    });

    const titles = UNIT_TITLES[meta.number];
    for (let i = 0; i < 30; i++) {
      await prisma.unit.upsert({
        where:  { levelId_number: { levelId: level.id, number: i + 1 } },
        update: { title: titles[i] },
        create: { levelId: level.id, number: i + 1, title: titles[i] },
      });
    }
    console.log(`✅  Level ${meta.number} seeded with 30 units`);
  }

  // ── Starter badges ──────────────────────────────────────────────
  const badges = [
    { name: "First Word",     description: "Learned your very first word",          conditionType: "words_mastered",   conditionValue: 1  },
    { name: "Unit Champion",  description: "Completed your first unit",             conditionType: "units_completed",  conditionValue: 1  },
    { name: "Week Warrior",   description: "Maintained a 7-day streak",             conditionType: "streak_days",      conditionValue: 7  },
    { name: "Duel Master",    description: "Won 10 duels",                          conditionType: "duels_won",        conditionValue: 10 },
    { name: "Centurion",      description: "Mastered 100 words",                    conditionType: "words_mastered",   conditionValue: 100},
    { name: "Level 1 Graduate", description: "Completed all 30 units of Level 1",  conditionType: "units_completed",  conditionValue: 30 },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where:  { name: badge.name },
      update: {},
      create: badge,
    });
  }
  console.log(`✅  ${badges.length} badges seeded`);

  console.log("\n🎉  Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
