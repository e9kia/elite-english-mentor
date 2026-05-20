const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
  const email = 'gattam035@gmail.com';
  console.log(`📡 Querying database for email: ${email}...`);
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      console.log(`❌ No user found for ${email}`);
      return;
    }

    console.log(`🟢 User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password Hash in DB: ${user.passwordHash}`);

    const testPassword = 'AliJitam2026!';
    console.log(`🔑 Verifying password "${testPassword}" against DB hash using bcryptjs.compare...`);
    const valid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log(`👉 Validation Result: ${valid ? '🟢 VALID / CORRECT' : '❌ INVALID / INCORRECT'}`);

  } catch (err) {
    console.error("🔴 Query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
