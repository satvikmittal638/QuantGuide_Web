const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const problems = await prisma.problem.findMany({ take: 5, orderBy: { createdAt: 'asc' } });
  console.log(problems.map(p => ({ id: p.id, title: p.title })));
}
main().finally(() => prisma.$disconnect());
