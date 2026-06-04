const fs = require('fs');

const fileContent = fs.readFileSync('src/App.tsx', 'utf8');

// We want to extract only the JSX content or strip JavaScript blocks.
// Let's write a precise brace-stripper that removes everything inside { ... }
// taking into account nested braces, string literals (double quotes, single quotes, backticks),
// and comments.

let output = '';
let i = 0;
let braceLevel = 0;
let inString = false;
let stringChar = '';
let inLineComment = false;
let inBlockComment = false;

while (i < fileContent.length) {
  const c = fileContent[i];
  const next = fileContent[i + 1] || '';

  // Handle block comments
  if (inBlockComment) {
    if (c === '*' && next === '/') {
      inBlockComment = false;
      i += 2;
    } else {
      i++;
    }
    continue;
  }

  // Handle line comments
  if (inLineComment) {
    if (c === '\n' || c === '\r') {
      inLineComment = false;
    }
    i++;
    continue;
  }

  // Check for comment starts if not in string
  if (!inString) {
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (c === '/' && next === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }
  }

  // Handle strings
  if (inString) {
    if (c === '\\') {
      // skip escape char
      i += 2;
      continue;
    }
    if (c === stringChar) {
      inString = false;
    }
    if (braceLevel === 0) {
      output += c;
    }
    i++;
    continue;
  }

  if (c === '"' || c === "'" || c === '`') {
    inString = true;
    stringChar = c;
    if (braceLevel === 0) {
      output += c;
    }
    i++;
    continue;
  }

  // Handle braces
  if (c === '{') {
    braceLevel++;
    i++;
    continue;
  }
  if (c === '}') {
    braceLevel--;
    if (braceLevel < 0) braceLevel = 0;
    i++;
    continue;
  }

  // Only copy characters if we are outside any JS expression block
  if (braceLevel === 0) {
    output += c;
  } else {
    // If inside a block, we can optionally output a placeholder to keep index alignment,
    // but here we just skip it to get raw HTML tags. We can replace with space.
    output += ' ';
  }
  i++;
}

// Now we have a clean HTML string with all JS expressions replaced by spaces!
// Let's parse HTML tags using a standard state machine or tag-tracker.
const SELF_CLOSING = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'col', 'base', 'embed', 'param', 'track', 'wbr']);
const stack = [];
const tagRegex = /<(\/)?([a-zA-Z][a-zA-Z0-9-.]*)\s*([^>]*?)(\/)?>/g;
let match;
let mismatchCount = 0;

console.log('--- SCANNING RECONSTRUCTED HTML (JS EXCLUDED) ---');
while ((match = tagRegex.exec(output)) !== null) {
  const [fullTag, isClosing, name, attrs, isSelfClosing] = match;
  
  // Skip self-closing tags
  if (SELF_CLOSING.has(name.toLowerCase()) || isSelfClosing || attrs.endsWith('/')) {
    continue;
  }

  // Skip TypeScript definitions / generic types
  if (['string', 'number', 'boolean', 'any', 'void', 'null', 'unknown', 'BookingRequest', 'Service', 'Transaction', 'AttachedFile', 'WhatsAppLog', 'Announcement', 'Job', 'JobApplication'].includes(name)) {
    continue;
  }

  const absoluteCharIdx = match.index;
  const lineNum = fileContent.slice(0, absoluteCharIdx).split('\n').length;

  if (isClosing) {
    if (stack.length > 0) {
      const top = stack.pop();
      if (top.name !== name) {
        mismatchCount++;
        console.log(`[Mismatch #${mismatchCount}] Line ${lineNum}: closing </${name}> but expected </${top.name}> (opened on line ${top.line})`);
        console.log(`  Stack remaining (top 5):`, stack.slice(-5).map(x => `${x.name}@${x.line}`));
        // We put the top back to attempt recovery
        stack.push(top);
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
console.log('\n--- Remaining Stack Trace of Unclosed Elements ---');
stack.forEach(item => {
  console.log(`Unclosed <${item.name}> opened on line ${item.line}`);
});
