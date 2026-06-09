const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const data = await pdfParse(buf);
  const text = data.text;
  
  // Find where Question 99's solution is
  const idx = text.indexOf('Solution to Question 99:');
  if (idx !== -1) {
    console.log(text.substring(idx, idx + 2000));
  }
}
test().catch(console.error);
