const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function run() {
  try {
    const username = 'testuser';
    const email = 'test@example.com';
    const passwordHash = await bcrypt.hash('password123', 12);
    const role = 'admin';

    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
        role,
      },
      select: { id: true, username: true, email: true, role: true },
    });

    console.log('User created:', user);

    // Initialize leaderboard entry
    await prisma.leaderboardSnapshot.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, totalXp: 0 },
      update: {},
    });

    console.log('Leaderboard created!');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
