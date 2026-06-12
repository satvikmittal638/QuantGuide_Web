const fs = require('fs');
const pdfParse = require('pdf-parse');

async function count() {
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const data = await pdfParse(buf);
  const text = data.text;
  
  const qMatches = [...text.matchAll(/Question (\d+):/g)];
  const sMatches = [...text.matchAll(/Solution to Question (\d+):/g)];
  
  console.log(`Total questions found by regex: ${qMatches.length}`);
  console.log(`Total solutions found by regex: ${sMatches.length}`);
  
  const uniqueQs = new Set(qMatches.map(m => m[1]));
  const uniqueSs = new Set(sMatches.map(m => m[1]));
  
  console.log(`Unique questions: ${uniqueQs.size}`);
  console.log(`Unique solutions: ${uniqueSs.size}`);
  
  let maxQ = 0;
  for (const q of uniqueQs) {
      if (parseInt(q) > maxQ) maxQ = parseInt(q);
  }
  console.log(`Max question number: ${maxQ}`);
}
count().catch(console.error);
