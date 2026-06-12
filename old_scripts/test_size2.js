const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const problems = await prisma.problem.findMany();
  const str = JSON.stringify(problems);
  console.log(`Size: ${str.length / 1024} KB`);
}
test().finally(() => prisma.$disconnect());
