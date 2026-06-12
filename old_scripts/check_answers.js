const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const problems = await prisma.problem.findMany({ take: 5 });
  console.log(problems.map(p => ({ title: p.title, answer: p.answer })));
}
main().finally(() => prisma.$disconnect());
