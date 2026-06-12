const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const asc = await prisma.problem.findMany({ orderBy: { createdAt: 'asc' }, take: 3 });
  console.log("ASC:", asc.map(p => p.title));
}
main().finally(() => prisma.$disconnect());
