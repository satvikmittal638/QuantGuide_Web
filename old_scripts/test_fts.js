const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const start = Date.now();
  const results = await prisma.problem.findMany({
    where: {
      description: { search: "probability" }
    },
    select: { id: true, title: true }
  });
  console.log(`FTS Found ${results.length} results in ${Date.now() - start}ms`);
}
test().finally(() => prisma.$disconnect());
