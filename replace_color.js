const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('#3B82F6')) {
    content = content.replace(/#3B82F6/g, '#D4AF37');
    changed = true;
  }
  if (content.includes('rgba(59, 130, 246')) {
    content = content.replace(/rgba\(59, 130, 246/g, 'rgba(212, 175, 55');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      replaceInFile(dirPath);
    }
  });
}

walkDir('./src');
