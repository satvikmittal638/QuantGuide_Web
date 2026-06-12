const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const problems = await prisma.problem.findMany({ take: 3 });
  for (const p of problems) {
    let text = p.description;
    // basic regex to wrap variables
    text = text.replace(/([a-zA-Z_]\d*(?:\s*[\+\-\=\<\>]\s*[a-zA-Z_]\d*)+)/g, '$$$1$$');
    console.log(text);
    console.log('---');
  }
}
test().catch(console.error).finally(() => prisma.$disconnect());
