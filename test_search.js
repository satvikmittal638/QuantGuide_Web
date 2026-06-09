const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const start = Date.now();
  const results = await prisma.problem.findMany({
    where: {
      OR: [
        { title: { contains: "probability", mode: "insensitive" } },
        { description: { contains: "probability", mode: "insensitive" } }
      ]
    },
    select: { id: true, title: true }
  });
  console.log(`Found ${results.length} results in ${Date.now() - start}ms`);
}
test().finally(() => prisma.$disconnect());
