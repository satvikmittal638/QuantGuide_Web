const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.problem.findFirst({ where: { title: { contains: "Chess Tournament" } } });
  if (p) {
    await prisma.problem.update({
      where: { id: p.id },
      data: { solution: "64/127" }
    });
    console.log("Updated problem to 64/127");
  }
}
main();
