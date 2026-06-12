const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const problems = await prisma.problem.findMany({ select: { description: true, title: true, id: true } });
  const str = JSON.stringify(problems);
  console.log(`Size: ${str.length / 1024} KB`);
}
test().finally(() => prisma.$disconnect());
