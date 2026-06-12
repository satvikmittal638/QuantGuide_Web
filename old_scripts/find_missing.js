const fs = require('fs');
const pdfParse = require('pdf-parse');

async function find() {
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const data = await pdfParse(buf);
  const text = data.text;
  
  const qMatches = [...text.matchAll(/Question (\d+):/g)];
  const sMatches = [...text.matchAll(/Solution to Question (\d+):/g)];
  
  const uniqueQs = new Set(qMatches.map(m => parseInt(m[1])));
  const uniqueSs = new Set(sMatches.map(m => parseInt(m[1])));
  
  const missingS = [];
  for (const q of uniqueQs) {
    if (!uniqueSs.has(q)) {
      missingS.push(q);
    }
  }
  missingS.sort((a,b) => a-b);
  console.log(`Questions missing solutions:`, missingS);
  
  // Also check if any solutions exist without questions
  const missingQ = [];
  for (const s of uniqueSs) {
    if (!uniqueQs.has(s)) {
      missingQ.push(s);
    }
  }
  missingQ.sort((a,b) => a-b);
  console.log(`Solutions missing questions:`, missingQ);
}
find().catch(console.error);
