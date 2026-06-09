const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const data = await pdfParse(buf);
  const text = data.text;
  
  const idx = text.indexOf('Question 100:');
  if (idx !== -1) {
    console.log(text.substring(idx - 100, idx + 300));
  }
  
  // Try to find anything with "100" in the solutions part
  const lines = text.split('\n');
  const sIdx = lines.findIndex(l => l.toLowerCase().includes('solution') && l.includes('100'));
  if (sIdx !== -1) {
    console.log('\nFound solution-like line:', lines.slice(Math.max(0, sIdx-2), sIdx+5).join('\n'));
  }
}
test().catch(console.error);
