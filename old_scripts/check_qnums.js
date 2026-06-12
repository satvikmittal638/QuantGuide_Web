const fs = require('fs');
const pdfParse = require('pdf-parse');
async function main() {
  const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
  const text = (await pdfParse(buf)).text;
  const qRegex = /Question (\d+):\s*(.*?)\nTopic:\s*(.*?)Difficulty:\s*(.*?)\n([\s\S]*?)(?=\nQuestion \d+:|\n\d+\n)/g;
  let match;
  const questions = [];
  while ((match = qRegex.exec(text)) !== null) {
    questions.push({ num: parseInt(match[1]), title: match[2].trim() });
  }
  questions.sort((a,b) => a.num - b.num);
  console.log("Original Q1-5:", questions.slice(0,5));
}
main();
