const fs = require('fs');
const path = require('path');

const excludeKeywords = ['input', 'Input', 'btn', 'Btn', 'button', 'Button', 'search', 'Search', 'edit', 'Edit', 'avatar', 'Avatar', 'modal', 'Modal'];

function shouldSkipStyle(styleName) {
  return excludeKeywords.some(kw => styleName.includes(kw));
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove borderWidth from inline styles unless it's a known input/button
  // This is tricky, let's just focus on StyleSheet definitions.
  
  // Replace borderWidth: 1 in single line styles
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // check if line defines a style with borderWidth
    const match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    let styleName = match ? match[1] : '';
    
    // If we don't have a style name on this line, look backwards a few lines (multi-line style)
    if (!styleName) {
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
            const m = lines[j].match(/^\s*([a-zA-Z0-9_]+)\s*:\s*\{\s*$/);
            if (m) {
                styleName = m[1];
                break;
            }
        }
    }

    if (line.includes('borderWidth:') && styleName) {
      if (!shouldSkipStyle(styleName)) {
        lines[i] = line.replace(/borderWidth\s*:\s*[0-9]+,?/g, '');
      }
    }
    
    // Also remove borderColor if it's there
    if (line.includes('borderColor:') && styleName) {
      if (!shouldSkipStyle(styleName)) {
        lines[i] = line.replace(/borderColor\s*:\s*[^,}]+,?/g, '');
      }
    }
  }
  
  content = lines.join('\n');

  // 2. Remove inline { backgroundColor: colors.backgroundElement, borderColor: colors.border }
  // Only remove from standard container styles, not modals.
  content = content.replace(/,\s*\{\s*backgroundColor\s*:\s*colors\.backgroundElement\s*,\s*borderColor\s*:\s*colors\.border\s*\}\s*\]/g, ']');
  content = content.replace(/,\s*borderColor\s*:\s*colors\.border/g, '');
  content = content.replace(/\[styles\.([a-zA-Z0-9_]+),\s*\{\s*backgroundColor\s*:\s*colors\.backgroundElement\s*\}\s*\]/g, (match, p1) => {
      if (!shouldSkipStyle(p1)) {
          return `styles.${p1}`;
      }
      return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Unboxed: ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      processFile(dirPath);
    }
  });
}

walkDir('./src');
