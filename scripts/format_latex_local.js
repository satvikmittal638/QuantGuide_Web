const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function formatText(text) {
  if (!text) return text;
  
  const prompt = `You are a strict formatting and proofreading engine. Your task is to fix any PDF extraction errors in the following text. 
1. Fix OCR errors and missing spaces (e.g. "Ifpis" -> "If p is").
2. Wrap any math variables, equations, or fractions with inline LaTeX $ tags (e.g. $a^2 + b^2 = c^2$). 
3. DO NOT add conversational responses. ONLY output the corrected and formatted text.
  
Text:
${text}`;

  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:1b',
      prompt: prompt,
      stream: false
    })
  });
  
  const data = await res.json();
  if (data.response) {
    return data.response.trim();
  }
  return text;
}

async function generateHint(description, fullSolution) {
  const prompt = `You are an expert math tutor. Write a short 1-2 sentence hint for this problem based on the provided solution. DO NOT reveal the final numerical answer. Only output the hint text.
  
Problem: ${description}
Solution: ${fullSolution}`;

  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:1b',
      prompt: prompt,
      stream: false
    })
  });
  
  const data = await res.json();
  if (data.response) {
    return data.response.trim();
  }
  return "Please refer to the full step-by-step solution for guidance.";
}

async function main() {
  console.log("Starting local LLM LaTeX formatting script...");
  const problems = await prisma.problem.findMany();
  console.log(`Found ${problems.length} problems to format.`);
  
  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    console.log(`\n[${i+1}/${problems.length}] Formatting: ${p.title}`);
    
    try {
      const formattedDesc = await formatText(p.description);
      const formattedSol = await formatText(p.fullSolution);
      const hint = await generateHint(formattedDesc, formattedSol);
      
      await prisma.problem.update({
        where: { id: p.id },
        data: {
          description: formattedDesc,
          fullSolution: formattedSol,
          hint: hint
        }
      });
      console.log(`Success! Hint generated.`);
    } catch (err) {
      console.error(`Error formatting ${p.id}:`, err.message);
    }
  }
  
  console.log("\nFinished formatting all problems!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
