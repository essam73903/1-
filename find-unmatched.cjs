const fs = require('fs');

const fileContent = fs.readFileSync('src/App.tsx', 'utf8');

function getLineNumOfChar(charIndex) {
  return fileContent.slice(0, charIndex).split('\n').length;
}

const lines = fileContent.split('\n');
const startOffset = lines.slice(0, 1937).join('\n').length + 1;
const endOffset = lines.slice(0, 7860).join('\n').length;

// Keep comments stripped, but keep the rest of the text intact
let clean = fileContent.slice(startOffset, endOffset);
clean = clean.replace(/\/\/.*/g, '');
clean = clean.replace(/\/\*[\s\S]*?\*\//g, '');

const SELF_CLOSING = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'col', 'base', 'embed', 'param', 'track', 'wbr']);
const stack = [];
let mismatchCount = 0;

// Regex to find tags: <tag...> or </tag>
// We will manually evaluate index context
const tagRegex = /<(\/)?([a-zA-Z][a-zA-Z0-9-.]*)\s*([\s\S]*?)([\/]?)>/g;
let match;

console.log('--- Scanning all tags matching modern JSX rules ---');
while ((match = tagRegex.exec(clean)) !== null) {
  const [fullTag, isClosing, name, attrs, isSelfClosing] = match;
  
  // Get character index in the original clean string
  const startIdx = match.index;
  
  // Rule 1: Check if '<' is preceded by an alphanumeric char, '_', '.', ')', ']', which means it is a generic (like useState<boolean>)
  if (startIdx > 0) {
    const prevChar = clean[startIdx - 1];
    if (/[a-zA-Z0-9_.)\]]/.test(prevChar)) {
      // It is a generic or comparison, skip!
      continue;
    }
  }
  
  // Rule 2: Skip self-closing tags
  if (SELF_CLOSING.has(name.toLowerCase()) || isSelfClosing || attrs.endsWith('/')) {
    continue;
  }
  
  // Rule 3: Skip known TypeScript types
  if (['string', 'number', 'boolean', 'any', 'void', 'null', 'unknown', 'BookingRequest', 'Service', 'Transaction', 'AttachedFile', 'WhatsAppLog', 'Announcement', 'Job', 'JobApplication'].includes(name)) {
    continue;
  }
  
  const absoluteCharIdx = startOffset + startIdx;
  const lineNum = getLineNumOfChar(absoluteCharIdx);
  
  if (isClosing) {
    if (stack.length > 0) {
      const top = stack.pop();
      if (top.name !== name) {
        mismatchCount++;
        console.log(`[Mismatch #${mismatchCount}] Line ${lineNum}: closing </${name}> but expected </${top.name}> (opened on line ${top.line})`);
        console.log(`  Stack remaining (top 4):`, stack.slice(-4).map(x => `${x.name}@${x.line}`));
        stack.push(top); // put back to continue
      }
    } else {
      mismatchCount++;
      console.log(`[Mismatch #${mismatchCount}] Line ${lineNum}: closing </${name}> but stack is empty`);
    }
  } else {
    stack.push({ name, line: lineNum });
  }
}

console.log(`\nScan completed. Total mismatches found: ${mismatchCount}`);
console.log('\n--- Final Stack trace Of Unclosed Elements ---');
stack.forEach(item => {
  console.log(`Unclosed <${item.name}> opened on line ${item.line}`);
});
