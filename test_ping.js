const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(`Ping: ${Date.now() - start}ms`);
}
test().finally(() => prisma.$disconnect());
