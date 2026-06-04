const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');

// A simple lexical parser to track HTML/JSX tags and find unmatched divs/tables/tags
// We also track line numbers.

let lineNum = 1;
const stack = [];
let i = 0;

while (i < content.length) {
  if (content[i] === '\n') {
    lineNum++;
    i++;
    continue;
  }

  // Skip comments
  if (content.startsWith('/*', i)) {
    i = content.indexOf('*/', i + 2);
    if (i === -1) break;
    i += 2;
    continue;
  }
  if (content.startsWith('//', i)) {
    i = content.indexOf('\n', i + 2);
    if (i === -1) break;
    continue;
  }

  // Skip string literals in JS code
  if (content[i] === '"' || content[i] === "'" || content[i] === '`') {
    const char = content[i];
    i++;
    while (i < content.length && content[i] !== char) {
      if (content[i] === '\\') i += 2;
      else {
        if (content[i] === '\n') lineNum++;
        i++;
      }
    }
    i++;
    continue;
  }

  // Match JSX tags: <tag ...> or </tag>
  if (content[i] === '<') {
    // Check if it's a comment inside JSX
    if (content.startsWith('<!--', i)) {
      i = content.indexOf('-->', i + 4);
      if (i === -1) break;
      i += 3;
      continue;
    }

    // Check if it's a closing tag </tag>
    if (content[i + 1] === '/') {
      let end = content.indexOf('>', i + 2);
      if (end === -1) break;
      const tagName = content.slice(i + 2, end).trim();
      i = end + 1;

      // Pop from stack and verify
      if (stack.length > 0) {
        const top = stack.pop();
        if (top.name !== tagName) {
          console.log(`Mismatch on line ${lineNum}: closing </${tagName}> but expected </${top.name}> (opened on line ${top.line})`);
          // Put back top if mismatch of different kind to help recover
          stack.push(top);
        }
      } else {
        console.log(`Mismatch on line ${lineNum}: closing </${tagName}> with empty stack`);
      }
      continue;
    }

    // Check if it's an opening tag
    // It must start with a letter or underscore (to be a valid JSX tag)
    const nextChar = content[i + 1];
    if (/^[a-zA-Z_]/.test(nextChar)) {
      let end = i + 1;
      while (end < content.length && !/[\s>]/.test(content[end])) {
        end++;
      }
      const tagName = content.slice(i + 1, end);
      
      // Find the end of this tag definition (handle self-closing)
      let tagEnd = content.indexOf('>', end);
      if (tagEnd === -1) break;
      
      const isSelfClosing = content[tagEnd - 1] === '/';
      
      if (!isSelfClosing) {
        stack.push({ name: tagName, line: lineNum });
      }
      
      i = tagEnd + 1;
      continue;
    }
  }

  i++;
}

console.log('--- Unclosed tags remaining in stack (from innermost to outermost) ---');
while (stack.length > 0) {
  const item = stack.pop();
  console.log(`Unclosed <${item.name}> opened on line ${item.line}`);
}
