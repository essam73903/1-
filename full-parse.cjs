const fs = require('fs');

const fileContent = fs.readFileSync('src/App.tsx', 'utf8');
const lines = fileContent.split('\n');

const startOffset = lines.slice(0, 1937).join('\n').length + 1;
const endOffset = lines.slice(0, 7861).join('\n').length; // Up to </main>

let clean = fileContent.slice(startOffset, endOffset);
// Strip comments and string literals first
clean = clean.replace(/\/\/.*/g, '');
clean = clean.replace(/\/\*[\s\S]*?\*\//g, '');
clean = clean.replace(/"[^"\\\r\n]*(?:\\.[^"\\\r\n]*)*"/g, '""');
clean = clean.replace(/'[^'\\\r\n]*(?:\\.[^'\\\r\n]*)*'/g, "''");
clean = clean.replace(/`[\s\S]*?`/g, '""');

// Iterative braces solver: dissolves purely JS curly braces while keeping JSX ones
let changed = true;
while (changed) {
  changed = false;
  clean = clean.replace(/\{([^{}]*)\}/g, (match, content) => {
    if (!/<[a-zA-Z\/]/.test(content)) {
      changed = true;
      return '""';
    }
    return match;
  });
}

const SELF_CLOSING = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'col', 'base', 'embed', 'param', 'track', 'wbr']);
const stack = [];
const tagRegex = /<(\/)?([a-zA-Z][a-zA-Z0-9-.]*)\s*([\s\S]*?)([\/]?)>/g;
let match;
let count = 0;

console.log('--- ENTIRE CHRONOLOGICAL TAG TRACE (With Intelligent JS Brace Reduction) ---');
while ((match = tagRegex.exec(clean)) !== null) {
  const [fullTag, isClosing, name, attrs, isSelfClosing] = match;
  
  const startIdx = match.index;
  
  // Rule 1: Skip generics (ONLY for opening tags)
  if (!isClosing && startIdx > 0) {
    const prevChar = clean[startIdx - 1];
    if (/[a-zA-Z0-9_.)\]]/.test(prevChar)) {
      continue;
    }
  }
  
  // Rule 2: Skip self-closing
  if (SELF_CLOSING.has(name.toLowerCase()) || isSelfClosing || attrs.endsWith('/')) {
    continue;
  }
  
  // Rule 3: Skip TS types
  if (['string', 'number', 'boolean', 'any', 'void', 'null', 'unknown', 'BookingRequest', 'Service', 'Transaction', 'AttachedFile', 'WhatsAppLog', 'Announcement', 'Job', 'JobApplication'].includes(name)) {
    continue;
  }
  
  const absoluteCharIdx = startOffset + startIdx;
  const lineNum = fileContent.slice(0, absoluteCharIdx).split('\n').length;
  
  if (isClosing) {
    if (stack.length > 0) {
      const top = stack.pop();
      if (top.name !== name) {
        console.log(`>>> ERROR Mismatch! ${lineNum}: closed </${name}> but expected </${top.name}> (opened on line ${top.line})`);
        console.log(`  Stack remaining (top 5):`, stack.slice(-5).map(x => `${x.name}@${x.line}`));
        break; // Stop at first error
      } else {
        count++;
        if (count % 100 === 0) {
          console.log(`[OK Close] Line ${lineNum}: </${name}> closed <${top.name}@${top.line}>. Stack size: ${stack.length}`);
        }
      }
    } else {
      console.log(`>>> ERROR Empty Stack! ${lineNum}: closed </${name}> but stack is empty`);
      break;
    }
  } else {
    stack.push({ name, line: lineNum });
  }
}

if (stack.length > 0) {
  console.log('\n--- Final Stack at end of scan ---');
  stack.slice(-15).forEach(x => console.log(`Unclosed <${x.name}> opened on line ${x.line}`));
}
