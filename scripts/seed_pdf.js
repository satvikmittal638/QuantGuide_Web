const fs = require('fs');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI, Type, Schema } = require('@google/genai');

const prisma = new PrismaClient();
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function seed() {
  console.log('Reading PDF...');
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const data = await pdfParse(buf);
  const text = data.text;

  console.log('Parsing with Regex...');
  const qRegex = /Question (\d+):\s*(.*?)\nTopic:\s*(.*?)Difficulty:\s*(.*?)\n([\s\S]*?)(?=\nQuestion \d+:|\n\d+\n)/g;
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
      problems.push({
        id: parseInt(id),
        ...questions[id],
        fullSolution: solutions[id]
      });
    }
  }

  console.log(`Successfully parsed ${problems.length} problems!`);
  
  // To avoid running out of memory or tokens, we'll batch them.
  const batchSize = 25; // Smaller batch size to prevent hitting max output tokens
  
  const responseSchema = {
    type: Type.ARRAY,
    description: "List of numeric solutions and hints",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        numeric_solution: { type: Type.STRING, description: "The final extracted numeric answer ONLY (e.g. 36, 0.25)" },
        hint: { type: Type.STRING, description: "A 1-2 sentence hint to guide the user without revealing the answer" }
      },
      required: ["id", "numeric_solution", "hint"]
    }
  };

  for (let i = 0; i < problems.length; i += batchSize) {
    const batch = problems.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(problems.length / batchSize)}...`);
    
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
            systemInstruction: "You are an expert math tutor. Provide extremely concise hints and exact numeric answers."
          }
        });
        batchResult = JSON.parse(response.text);
        break; // Success
      } catch (err) {
        console.error(`Error in batch (retries left: ${retries - 1}):`, err.message);
        retries--;
        await new Promise(r => setTimeout(r, 10000)); // wait 10s on rate limit
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
       
       // Save this batch to DB
       const validToInsert = batch.filter(p => p.solution && p.hint);
       for (const p of validToInsert) {
         await prisma.problem.create({
           data: {
             title: p.title,
             description: p.description,
             topic: p.topic,
             difficulty: p.difficulty,
             solution: p.solution,
             fullSolution: p.fullSolution,
             hint: p.hint
           }
         });
       }
       console.log(`Inserted ${validToInsert.length} problems into DB!`);
    }
    
    // Throttle to respect 15 RPM
    await new Promise(r => setTimeout(r, 4000));
  }
  
  console.log('Finished seeding!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
