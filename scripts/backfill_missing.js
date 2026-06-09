const fs = require('fs');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI, Type } = require('@google/genai');

const prisma = new PrismaClient();
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function backfill() {
  console.log('Reading PDF...');
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const data = await pdfParse(buf);
  const text = data.text;

  console.log('Parsing with Robust Regex...');
  // Robust matching for Questions
  const qMatches = [...text.matchAll(/Question\s+(\d+)\s*:\s*(.*?)\nTopic:\s*(.*?)Difficulty:\s*(.*?)\n([\s\S]*?)(?=\nQuestion\s+\d+\s*:|\n\d+\n|$)/g)];
  
  const questions = {};
  for (const match of qMatches) {
    questions[parseInt(match[1])] = {
      title: match[2].trim(),
      topic: match[3].trim(),
      difficulty: match[4].trim(),
      description: match[5].trim()
    };
  }

  // Robust matching for Solutions
  const sRegex = /Solution\s+to\s+Question\s+(\d+)\s*:[^\n]*\n([\s\S]*?)(?=\nSolution\s+to\s+Question\s+\d+\s*:|\nBibliography|$)/g;
  const sMatches = [...text.matchAll(sRegex)];
  const solutions = {};
  for (const match of sMatches) {
    solutions[parseInt(match[1])] = match[2].trim();
  }

  console.log(`Found ${Object.keys(questions).length} questions and ${Object.keys(solutions).length} solutions.`);

  // Get current questions in DB
  const existingInDb = await prisma.problem.findMany({
    select: { title: true }
  });
  const existingTitles = new Set(existingInDb.map(p => p.title.replace(/ /g, '_').replace(/\//g, '').replace(/:/g, '')));

  const missingProblems = [];
  for (const id in questions) {
    const q = questions[id];
    const normalizedTitle = q.title.replace(/ /g, '_').replace(/\//g, '').replace(/:/g, '');
    
    // Check if it's already in DB. Since DB IDs are CUIDs now, we check by normalized title
    if (!existingTitles.has(normalizedTitle)) {
      if (solutions[id]) {
        missingProblems.push({
          id: parseInt(id),
          ...q,
          fullSolution: solutions[id]
        });
      } else {
        console.warn(`Question ${id} has no solution found even with robust regex!`);
      }
    }
  }

  console.log(`Found ${missingProblems.length} missing problems to upload!`);

  if (missingProblems.length === 0) {
    console.log("No missing problems found.");
    return;
  }

  const responseSchema = {
    type: Type.ARRAY,
    description: "List of numeric solutions and hints",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        numeric_solution: { type: Type.STRING, description: "The final extracted numeric answer ONLY (e.g. 36, 0.25, 64/127)" },
        hint: { type: Type.STRING, description: "A 1-2 sentence hint to guide the user without revealing the answer" }
      },
      required: ["id", "numeric_solution", "hint"]
    }
  };

  const batchSize = 15;
  for (let i = 0; i < missingProblems.length; i += batchSize) {
    const batch = missingProblems.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(missingProblems.length / batchSize)}...`);
    
    const promptData = batch.map(p => `ID: ${p.id}\nProblem: ${p.description}\nSolution: ${p.fullSolution}\n`).join('\n---\n');
    
    let retries = 3;
    let batchResult = null;
    while(retries > 0) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `For each of the following problems, extract the final numeric solution from the provided text, and generate a short, helpful hint. Return the output as JSON matching the requested schema.\n\n${promptData}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            systemInstruction: "You are an expert math tutor. Provide extremely concise hints and exact numeric answers. Give answers as fractions if appropriate (e.g. '1/2' instead of '0.5')."
          }
        });
        batchResult = JSON.parse(response.text);
        break; // Success
      } catch (err) {
        console.error(`Error in batch (retries left: ${retries - 1}):`, err.message);
        retries--;
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    
    if (batchResult) {
       for (const res of batchResult) {
         const p = batch.find(x => x.id === res.id);
         if (p) {
           p.solution = res.numeric_solution;
           p.hint = res.hint;
         }
       }
       
       const validToInsert = batch.filter(p => p.solution && p.hint);
       for (const p of validToInsert) {
         await prisma.problem.create({
           data: {
             title: p.title,
             description: p.description,
             topic: p.topic,
             difficulty: p.difficulty,
             solution: String(p.solution),
             fullSolution: p.fullSolution,
             hint: p.hint
           }
         });
       }
       console.log(`Inserted ${validToInsert.length} problems into DB!`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('Finished backfilling!');
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
