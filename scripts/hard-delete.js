const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Hard Delete for Admin User...");

  const email = "gattam035@gmail.com";
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`✅ Permanently deleted user: ${email} and all cascaded data.`);
  } else {
    console.log(`⚠️ User ${email} not found. Skipping deletion.`);
  }

  await prisma.$disconnect();
  console.log("🏁 Cleanup Finished.");
}

main().catch(async (e) => {
  console.error("❌ Error during delete:", e);
  await prisma.$disconnect();
  process.exit(1);
});
