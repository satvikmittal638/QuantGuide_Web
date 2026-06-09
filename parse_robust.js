const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const data = await pdfParse(buf);
  const text = data.text;
  
  // Robust matching for Questions
  const qMatches = [...text.matchAll(/Question\s+(\d+)\s*:\s*(.*?)\nTopic:\s*(.*?)Difficulty:\s*(.*?)\n([\s\S]*?)(?=\nQuestion\s+\d+\s*:|\n\d+\n|$)/g)];
  
  // Robust matching for Solutions
  // We can just split by "Solution to Question" but ignoring spaces
  const sMatches = [];
  const sRegex = /Solution\s+to\s+Question\s+(\d+)\s*:[^\n]*\n([\s\S]*?)(?=\nSolution\s+to\s+Question\s+\d+\s*:|\nBibliography|$)/g;
  const sRaw = [...text.matchAll(sRegex)];
  
  console.log(`Questions found: ${qMatches.length}`);
  console.log(`Solutions found: ${sRaw.length}`);
}
test().catch(console.error);
