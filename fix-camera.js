const fs = require('fs');
const path = require('path');

function resolveConflict(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const conflictRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> fix-camera\r?\n?/g;
    const newContent = content.replace(conflictRegex, '$2');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log(`Resolved conflicts in ${filePath}`);
    } else {
      console.log(`No conflicts found in ${filePath}`);
    }
  } catch (e) {
    console.error(`Error processing ${filePath}:`, e);
  }
}

resolveConflict(path.join(__dirname, 'frontend', 'src', 'pages', 'Camera.tsx'));
