const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Surgical Admin Restoration...");

  const email = "gattam035@gmail.com";
  const username = "ali_admin";
  const password = "ali123";

  // 1. HARD PURGE
  console.log(`🧹 Purging all data for ${email}...`);
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    // Cascading delete should handle the rest
    await prisma.user.delete({ where: { id: existingUser.id } });
    console.log("✅ Old account purged.");
  }

  // 2. MANUAL CREATION
  console.log(`🔨 Creating new admin account: ${username}`);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      role: "admin",
    }
  });

  // Initialize his leaderboard record
  await prisma.leaderboardSnapshot.create({
    data: {
      userId: newUser.id,
      totalXp: 0,
    }
  });

  console.log(`✅ Admin account created with ID: ${newUser.id}`);
  
  await prisma.$disconnect();
  console.log("🏁 Restoration Finished.");
}

main().catch(async (e) => {
  console.error("❌ Fatal Error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
