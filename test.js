const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.problem.findFirst({ where: { title: { contains: "Chess Tournament" } } });
  console.log(p.solution);
}
main();
