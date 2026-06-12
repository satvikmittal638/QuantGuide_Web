const fs = require('fs');
const pdfParse = require('pdf-parse');
const buf = fs.readFileSync('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf');
pdfParse(buf).then(data => {
  const text = data.text;
  const sRegex = /Solution to Question (\d+):[^\n]*\n([\s\S]*?)(?=\nSolution to Question \d+:|\nBibliography)/g;
  const solutions = {};
  let match;
  while ((match = sRegex.exec(text)) !== null) {
    solutions[parseInt(match[1])] = match[2].trim();
  }
  
  for (let id = 1; id <= 10; id++) {
    if (!solutions[id]) continue;
    let endText = solutions[id].replace(/\s+$/g, '');
    let answerMatch = endText.match(/[\d\.\-]+(?:[\n\s]*\/[\n\s]*[\d\.\-]+)?(?=[^\d]*$)/);
    let answer = answerMatch ? answerMatch[0].replace(/[\n\s]+/g, '') : "N/A";
    console.log(`Q${id} Answer: ${answer}`);
  }
});
