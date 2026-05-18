const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const unitCount = await prisma.unit.count();
    const wordCount = await prisma.word.count();
    const storyCount = await prisma.story.count();
    
    console.log("Units: " + unitCount);
    console.log("Words: " + wordCount);
    console.log("Stories: " + storyCount);
  } catch (error) {
    console.error('DATABASE CONNECTION FAILED:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
