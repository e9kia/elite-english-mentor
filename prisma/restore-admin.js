const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restoreAdmin() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║ 🚨 CRITICAL AUTHENTICATION RESTORATION PROTOCOL 🚨 ║");
  console.log("║ Restoring Root Admin Account: Ali Jitam ❤️       ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const email = 'gattam035@gmail.com'.toLowerCase().trim();
  const username = 'alijitam';
  const passwordRaw = 'AliJitam2026!';
  const role = 'admin';

  try {
    console.log(`🔑 Generating secure password hash for NextAuth (bcrypt cost 12)...`);
    const passwordHash = await bcrypt.hash(passwordRaw, 12);

    console.log(`📡 Querying database for user: ${email}...`);
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    let user;
    if (existingUser) {
      console.log(`⚠️ User found in database. Updating privileges and password...`);
      user = await prisma.user.update({
        where: { email },
        data: {
          username,
          passwordHash,
          role
        }
      });
      console.log(`🟢 User successfully updated!`);
    } else {
      console.log(`🌱 User not found. Creating brand new admin account...`);
      user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          role
        }
      });
      console.log(`🟢 User successfully created!`);
    }

    console.log(`🏆 Initializing Leaderboard Snapshot for Admin...`);
    await prisma.leaderboardSnapshot.upsert({
      where: { userId: user.id },
      create: { userId: user.id, totalXp: 0 },
      update: {}
    });
    console.log(`🟢 Leaderboard Snapshot verified/upserted!`);

    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║ 🎉 ROOT ADMIN RESTORATION SUCCESSFUL             ║`);
    console.log(`║ Email:    ${user.email.padEnd(38)} ║`);
    console.log(`║ Username: ${user.username.padEnd(38)} ║`);
    console.log(`║ Role:     ${user.role.padEnd(38)} ║`);
    console.log(`║ Password: ${passwordRaw.padEnd(38)} ║`);
    console.log(`╚══════════════════════════════════════════════════╝`);

  } catch (err) {
    console.error("🔴 RESTORATION FAILED:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

restoreAdmin();
