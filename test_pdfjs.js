const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function test() {
  const data = new Uint8Array(fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf'));
  const doc = await pdfjsLib.getDocument(data).promise;
  const page = await doc.getPage(6); // Page 6 has Poker Hands I
  const textContent = await page.getTextContent();
  const text = textContent.items.map(item => item.str).join('');
  console.log(text.substring(0, 500));
}
test().catch(console.error);
