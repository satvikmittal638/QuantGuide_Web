const fs = require('fs');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  console.log('Reading QuantProf PDF...');
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/(Important) QuantProf.pdf');
  const data = await pdfParse(buf);
  const text = data.text;

  console.log('Parsing Questions with Regex...');
  // Question Regex:
  // 1.  Non-empty Intersection
  // Probability  Lvl 7/10  (Hard)Jane Street, Jump Trading
  // <Description>
  // [ Hint ↓ | Solution ↓ | ↑ ]
  const qRegex = /(\d+)\.\s+([^\n]*)\n([^\s]*)\s+Lvl\s+(\d+)\/10\s+\((.*?)\)(.*?)\n([\s\S]*?)(?=\[\s*Hint\s*↓)/g;
  const questions = {};
  let match;
  while ((match = qRegex.exec(text)) !== null) {
    const qNo = parseInt(match[1]);
    questions[qNo] = {
      title: match[2].trim(),
      topic: match[3].trim(),
      level: parseInt(match[4]),
      difficulty: match[5].trim(),
      companies: match[6].trim() || null,
      description: match[7].trim()
    };
  }

  console.log(`Found ${Object.keys(questions).length} questions!`);

  console.log('Parsing Hints with Regex...');
  // Hint Regex
  // 1.  Non-empty Intersection
  // [ Question ↑ | Solution ↓ | ↑ ]
  // Hint 1: ...
  // <Next Number>. 
  const hints = {};
  const hintSectionIdx = text.indexOf('HINTSQuantProf Problems');
  if (hintSectionIdx !== -1) {
    const hintText = text.substring(hintSectionIdx);
    const hRegex = /(\d+)\.\s+[^\n]*\n\[\s*Question[\s\S]*?\]\n([\s\S]*?)(?=\n\d+\.\s+[^\n]*\n\[\s*Question|\nSOLUTIONSQuantProf Problems)/g;
    while ((match = hRegex.exec(hintText)) !== null) {
      hints[parseInt(match[1])] = match[2].trim();
    }
  }

  console.log(`Found ${Object.keys(hints).length} hints!`);

  console.log('Parsing Solutions with Regex...');
  // Solution Regex
  // 1.  Non-empty Intersection
  // [ Question ↑ | Hint ↑ | ↑ ]
  // <solution text>
  // Answer:   0.12698
  const solutions = {};
  const solSectionIdx = text.indexOf('SOLUTIONSQuantProf Problems');
  if (solSectionIdx !== -1) {
    const solText = text.substring(solSectionIdx);
    const sRegex = /(\d+)\.\s+[^\n]*\n\[\s*Question[\s\S]*?\]\n([\s\S]*?)(?=\n\d+\.\s+[^\n]*\n\[\s*Question|$)/g;
    while ((match = sRegex.exec(solText)) !== null) {
      const qNo = parseInt(match[1]);
      const fullSol = match[2].trim();
      
      // Extract answer
      let answerMatch = fullSol.match(/Answer:\s+(.*)/);
      let solutionAns = answerMatch ? answerMatch[1].trim() : 'Unknown';
      
      solutions[qNo] = {
        fullSolution: fullSol,
        solutionAns: solutionAns
      };
    }
  }

  console.log(`Found ${Object.keys(solutions).length} solutions!`);

  const problemsToInsert = [];
  for (let id in questions) {
    if (solutions[id]) {
      problemsToInsert.push({
        id: parseInt(id),
        ...questions[id],
        fullSolution: solutions[id].fullSolution,
        solution: solutions[id].solutionAns,
        hint: hints[id] || null,
        source: "QuantProf"
      });
    }
  }

  console.log(`Prepared ${problemsToInsert.length} complete problems for insertion.`);

  // Insert to DB
  let count = 0;
  for (const p of problemsToInsert) {
    // Only insert if answer is known. Skip if totally unknown and can't be parsed.
    if (p.solution !== 'Unknown') {
      await prisma.problem.create({
        data: {
          title: p.title.replace(/\u0000/g, ''),
          description: p.description.replace(/\u0000/g, ''),
          topic: p.topic.replace(/\u0000/g, ''),
          difficulty: p.difficulty.replace(/\u0000/g, ''),
          level: p.level,
          companies: p.companies ? p.companies.replace(/\u0000/g, '') : null,
          source: p.source,
          solution: p.solution.replace(/\u0000/g, ''),
          fullSolution: p.fullSolution ? p.fullSolution.replace(/\u0000/g, '') : null,
          hint: p.hint ? p.hint.replace(/\u0000/g, '') : null
        }
      });
      count++;
      if (count % 100 === 0) console.log(`Inserted ${count}...`);
    }
  }

  console.log(`Successfully seeded ${count} problems to the database!`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
