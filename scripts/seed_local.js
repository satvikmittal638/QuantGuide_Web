const fs = require('fs');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  console.log('Reading PDF...');
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const data = await pdfParse(buf);
  let text = data.text;
  
  // Clean up PDF page headers/footers
  text = text.replace(/\n\d+CHAPTER \d+\.\s+[A-Z]+\n/g, '\n');

  console.log('Parsing with Regex...');
  const qRegex = /Question (\d+):\s*(.*?)\nTopic:\s*(.*?)Difficulty:\s*(.*?)\n([\s\S]*?)(?=\nQuestion \d+:|\nSolution to Question 1:)/g;
  const questions = {};
  let match;
  while ((match = qRegex.exec(text)) !== null) {
    questions[parseInt(match[1])] = {
      title: match[2].trim(),
      topic: match[3].trim(),
      difficulty: match[4].trim(),
      description: match[5].trim()
    };
  }

  const sRegex = /Solution to Question (\d+):[^\n]*\n([\s\S]*?)(?=\nSolution to Question \d+:|\nBibliography)/g;
  const solutions = {};
  while ((match = sRegex.exec(text)) !== null) {
    solutions[parseInt(match[1])] = match[2].trim();
  }

  const problems = [];
  for (let id in questions) {
    if (solutions[id]) {
      
      const fullSolution = solutions[id];
      // Extract numeric solution locally using heuristic (last number/fraction)
      const endText = fullSolution.replace(/\s+$/g, '');
      const answerMatch = endText.match(/(?:(?:[\d\.\-]+)[\s]*\/[\s]*(?:[\d\.\-]+))|\b\d+(?:\.\d+)?\b/g);
      const solution = answerMatch ? answerMatch[answerMatch.length - 1].replace(/\s/g, '') : "N/A";
      
      problems.push({
        id: parseInt(id),
        ...questions[id],
        fullSolution: fullSolution,
        solution: solution,
        hint: "Please refer to the full step-by-step solution for guidance."
      });
    }
  }

  console.log(`Successfully parsed ${problems.length} problems! Inserting remaining locally...`);
  
  // Clear the database first to ensure a pristine slate
  await prisma.problem.deleteMany();
  console.log('Cleared existing problems from database to ensure no corruption.');
  
  // Insert all in a single batch
  if (problems.length > 0) {
      await prisma.problem.createMany({
        data: problems.map(p => ({
          title: p.title,
          description: p.description,
          topic: p.topic,
          difficulty: p.difficulty,
          solution: p.solution,
          fullSolution: p.fullSolution,
          hint: p.hint
        }))
      });
      console.log(`Inserted ${problems.length} perfectly formatted problems directly into DB instantly!`);
  }

  console.log('Finished seeding locally!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
