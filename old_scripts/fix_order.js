const fs = require('fs');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Reading PDF...');
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const text = (await pdfParse(buf)).text;
  
  const qRegex = /Question (\d+):\s*(.*?)\nTopic:\s*(.*?)Difficulty:\s*(.*?)\n([\s\S]*?)(?=\nQuestion \d+:|\n\d+\n)/g;
  let match;
  const qNums = {};
  while ((match = qRegex.exec(text)) !== null) {
    qNums[match[2].trim()] = parseInt(match[1]);
  }
  
  console.log('Updating DB timestamps...');
  const problems = await prisma.problem.findMany();
  let updated = 0;
  for (let p of problems) {
    const num = qNums[p.title];
    if (num) {
      const newTime = new Date(1700000000000 + num * 1000); // Base date + exactly 1 sec per question number
      await prisma.problem.update({ where: { id: p.id }, data: { createdAt: newTime } });
      updated++;
    }
  }
  console.log(`Updated ${updated} problem timestamps!`);
}
main().finally(() => prisma.$disconnect());
