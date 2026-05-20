const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=========================================");
  console.log("🛠️ DATABASE VERIFICATION SCRIPT");
  console.log("=========================================\n");

  const dbUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';

  // Redact credentials
  const redact = (url) => {
    if (!url) return 'NOT CONFIGURED';
    return url.replace(/:[^@]+@/, ":****@").split("?")[0];
  };

  console.log(`📡 DATABASE_URL: ${redact(dbUrl)}`);
  console.log(`📡 DIRECT_URL:   ${redact(directUrl)}\n`);

  try {
    console.log("⏳ Connecting to database...");
    
    // Check connection
    await prisma.$connect();
    console.log("🟢 Connection SUCCESSFUL!\n");

    console.log("📊 QUERYING SEEDED DATA STATUS:");
    const unitCount = await prisma.unit.count();
    const wordCount = await prisma.word.count();
    const storyCount = await prisma.story.count();
    const userCount = await prisma.user.count();

    console.log(`- Units in database:   ${unitCount} (Expected: 30)`);
    console.log(`- Words in database:   ${wordCount} (Expected: 600)`);
    console.log(`- Stories in database: ${storyCount} (Expected: 30)`);
    console.log(`- Users in database:   ${userCount}\n`);

    console.log("🔑 VERIFYING ROOT ADMIN ACCOUNT:");
    const adminEmail = "gattam035@gmail.com";
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (adminUser) {
      console.log("🟢 Root Admin Account Found!");
      console.log(`  - ID:       ${adminUser.id}`);
      console.log(`  - Email:    ${adminUser.email}`);
      console.log(`  - Username: ${adminUser.username}`);
      console.log(`  - Role:     ${adminUser.role}`);
      console.log(`  - Password Hash: ${adminUser.passwordHash ? 'PRESENT' : 'MISSING'}`);
      if (adminUser.passwordHash) {
        console.log(`  - Hash prefix: ${adminUser.passwordHash.substring(0, 10)}...`);
      }
    } else {
      console.log("🔴 ERROR: Root Admin Account NOT FOUND!");
    }

  } catch (error) {
    console.error("🔴 DATABASE VERIFICATION FAILED:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
