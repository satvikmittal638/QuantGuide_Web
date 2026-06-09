const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.problem.findFirst();
  console.log(p.id, typeof p.id);
}
main().finally(() => prisma.$disconnect());
