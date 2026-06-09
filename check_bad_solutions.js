const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const problems = await prisma.problem.findMany();
  const bad = problems.map(p => p.solution).filter(s => {
    if (!s) return true;
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length !== 2 || isNaN(parseFloat(parts[0])) || isNaN(parseFloat(parts[1]))) return true;
    } else if (isNaN(parseFloat(s))) {
      return true;
    }
    return false;
  });
  console.log("Found bad solutions:", bad.length);
  console.log("Sample:", bad.slice(0, 10));
}
main().finally(() => prisma.$disconnect());
