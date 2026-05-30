const fs = require('fs');
const pdfParse = require('pdf-parse');
const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
pdfParse(buf).then(data => {
  const text = data.text;
  
  // Extract questions
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
  
  // Extract solutions
  const sRegex = /Solution to Question (\d+):[^\n]*\n([\s\S]*?)(?=\nSolution to Question \d+:|\nBibliography)/g;
  const solutions = {};
  while ((match = sRegex.exec(text)) !== null) {
    solutions[parseInt(match[1])] = match[2].trim();
  }
  
  console.log('Found questions:', Object.keys(questions).length);
  console.log('Found solutions:', Object.keys(solutions).length);
  
  let validCount = 0;
  for (let id in questions) {
    if (solutions[id]) validCount++;
  }
  console.log('Matched Q&A pairs:', validCount);
});
