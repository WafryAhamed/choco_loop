const fs = require('fs');
const path = require('path');

function resolveConflict(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Regular expression to match git merge conflicts
    // It captures:
    // 1. The start marker <<<<<<< ...
    // 2. The first block (HEAD)
    // 3. The separator =======
    // 4. The second block (fix-camera)
    // 5. The end marker >>>>>>> ...
    
    // We want to keep the fix-camera block (block 4)
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

const files = [
  path.join(__dirname, 'frontend', 'src', 'pages', 'Inventory.tsx'),
  path.join(__dirname, 'frontend', 'src', 'pages', 'TaskAssign.tsx'),
  path.join(__dirname, 'frontend', 'src', 'pages', 'TaskHistory.tsx')
];

files.forEach(resolveConflict);
