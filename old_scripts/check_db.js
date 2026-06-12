const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.problem.count();
  console.log(`Total in DB: ${c}`);
}
main().finally(() => prisma.$disconnect());
