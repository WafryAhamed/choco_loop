const fs = require('fs');
const path = require('path');

const indexTs = path.join(__dirname, 'backend', 'index.ts');
let content = fs.readFileSync(indexTs, 'utf-8');

content = content.replace(/setInterval\(processTaskQueue, 3000\);\r?\n};\r?\n/g, "");

fs.writeFileSync(indexTs, content);
console.log('Fixed stray startServer closing');
