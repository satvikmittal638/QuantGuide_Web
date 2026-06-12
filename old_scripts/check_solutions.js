const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const problems = await prisma.problem.findMany({ take: 5 });
  console.log(problems.map(p => ({ title: p.title, solution: p.solution })));
}
main().finally(() => prisma.$disconnect());
