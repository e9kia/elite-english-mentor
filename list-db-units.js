const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { number: 'asc' },
      include: {
        _count: {
          select: { words: true }
        },
        story: true
      }
    });
    for (const u of units) {
      console.log(`Unit ${u.number}: ${u.title} (${u._count.words} words, story: ${!!u.story})`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
