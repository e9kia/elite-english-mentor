const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hardResetAdmin() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║ 🚨 HARD RESET ADMIN ACCOUNT PROTOCOL             ║");
  console.log("║ Target: gattam035@gmail.com (Ali Jitam ❤️)       ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const email = 'gattam035@gmail.com'.toLowerCase().trim();
  const username = 'alijitam';
  const passwordRaw = 'AliJitam2026!';
  const role = 'admin';

  try {
    // 1. Purge any existing references
    console.log(`🧹 Purging any existing user accounts with email: ${email}...`);
    const deleteResult = await prisma.user.deleteMany({
      where: { email }
    });
    console.log(`🟢 Purged count: ${deleteResult.count}`);

    // 2. Generate secure bcryptjs hash
    console.log(`🔑 Generating secure password hash for NextAuth (bcryptjs salt cost 12)...`);
    const passwordHash = await bcrypt.hash(passwordRaw, 12);

    // 3. Create fresh user
    console.log(`🌱 Creating fresh root admin user...`);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role
      }
    });
    console.log(`🟢 User successfully created with ID: ${user.id}`);

    // 4. Create fresh leaderboard snapshot
    console.log(`🏆 Initializing Leaderboard Snapshot...`);
    await prisma.leaderboardSnapshot.create({
      data: {
        userId: user.id,
        totalXp: 0,
        duelsWon: 0,
        duelsPlayed: 0,
        winRate: 0.0,
        streakDays: 0
      }
    });
    console.log(`🟢 Leaderboard Snapshot successfully created!`);

    // 5. Run mock login verification to prove it works
    console.log(`\n🔍 Performing mock authentication verification...`);
    const checkUser = await prisma.user.findUnique({
      where: { email }
    });
    if (!checkUser || !checkUser.passwordHash) {
      throw new Error("Verification failed: created user not found or has null password hash");
    }
    const isMatched = await bcrypt.compare(passwordRaw, checkUser.passwordHash);
    if (!isMatched) {
      throw new Error("Verification failed: password compare returned false on fresh hash");
    }
    console.log(`🟢 Mock Login: SUCCESS! Email and password match perfectly.`);

    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║ 🎉 HARD RESET ADMIN ACCOUNT SUCCESSFUL           ║`);
    console.log(`║ Email:    ${user.email.padEnd(38)} ║`);
    console.log(`║ Username: ${user.username.padEnd(38)} ║`);
    console.log(`║ Role:     ${user.role.padEnd(38)} ║`);
    console.log(`║ Password: ${passwordRaw.padEnd(38)} ║`);
    console.log(`╚══════════════════════════════════════════════════╝`);

  } catch (err) {
    console.error("🔴 HARD RESET FAILED:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

hardResetAdmin();
