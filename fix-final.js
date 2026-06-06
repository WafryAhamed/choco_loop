const fs = require('fs');
const path = require('path');

// 1. Fix backend/index.ts
const indexTs = path.join(__dirname, 'backend', 'index.ts');
let content = fs.readFileSync(indexTs, 'utf-8');

const brokenInjection = `  workerInterval = \r\n// -----------------------------------------------------------------------------\r\n// ANALYTICS ENDPOINT`;
const brokenInjection2 = `  workerInterval = \n// -----------------------------------------------------------------------------\n// ANALYTICS ENDPOINT`;

content = content.replace(brokenInjection, `  workerInterval = setInterval(processTaskQueue, 3000);\r\n}\r\n\r\n// -----------------------------------------------------------------------------\r\n// ANALYTICS ENDPOINT`);
content = content.replace(brokenInjection2, `  workerInterval = setInterval(processTaskQueue, 3000);\n}\n\n// -----------------------------------------------------------------------------\n// ANALYTICS ENDPOINT`);

fs.writeFileSync(indexTs, content);
console.log('Fixed index.ts injection');

// 2. Fix backend/db.ts
const dbTs = path.join(__dirname, 'backend', 'db.ts');
if (fs.existsSync(dbTs)) {
  let dbContent = fs.readFileSync(dbTs, 'utf-8');
  dbContent = dbContent.replace(/keepAliveInitialDelayMs/g, 'keepAliveInitialDelay');
  fs.writeFileSync(dbTs, dbContent);
  console.log('Fixed db.ts');
}
