const fs = require('fs');
const path = require('path');

const viteConfigTs = path.join(__dirname, 'frontend', 'vite.config.ts');
if (fs.existsSync(viteConfigTs)) {
  let content = fs.readFileSync(viteConfigTs, 'utf-8');
  const conflictRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> fix-camera\r?\n?/g;
  content = content.replace(conflictRegex, '$2');
  fs.writeFileSync(viteConfigTs, content);
  console.log('Fixed vite.config.ts');
}
