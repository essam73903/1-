const fs = require('fs');

const fileContent = fs.readFileSync('src/App.tsx', 'utf8');
const lines = fileContent.split('\n');

function traceRange(startLine, endLine) {
  const rRange = lines.slice(startLine - 1, endLine).join('\n');
  const startOffset = lines.slice(0, startLine - 1).join('\n').length + 1;
  
  let clean = rRange.replace(/\/\/.*/g, '');
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, '');
  clean = clean.replace(/"[^"\\\r\n]*(?:\\.[^"\\\r\n]*)*"/g, '""');
  clean = clean.replace(/'[^'\\\r\n]*(?:\\.[^'\\\r\n]*)*'/g, "''");
  clean = clean.replace(/`[\s\S]*?`/g, '""');

  const strippedIndices = [];
  let stripped = '';
  let braceLevel = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === stringChar) inString = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      stringChar = c;
      continue;
    }
    if (c === '{') { braceLevel++; continue; }
    if (c === '}') { braceLevel--; if (braceLevel < 0) braceLevel = 0; continue; }
    if (braceLevel === 0) {
      stripped += c;
      strippedIndices.push(startOffset + i);
    }
  }

  const SELF_CLOSING = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'col', 'base', 'embed', 'param', 'track', 'wbr']);
  const stack = [];
  const tagRegex = /<(\/)?([a-zA-Z][a-zA-Z0-9-.]*)\s*([\s\S]*?)([\/]?)>/g;
  let match;

  console.log('--- Trace of Jobs Control Tags ---');
  while ((match = tagRegex.exec(stripped)) !== null) {
    const [fullTag, isClosing, tagName, attrs, isSelfClosing] = match;
    if (SELF_CLOSING.has(tagName.toLowerCase()) || isSelfClosing || attrs.endsWith('/')) continue;
    if (['string', 'number', 'boolean', 'any', 'void', 'null', 'unknown', 'BookingRequest', 'Service', 'Transaction', 'AttachedFile', 'WhatsAppLog', 'Announcement', 'Job', 'JobApplication'].includes(tagName)) continue;

    // Check preceding character
    const strippedIdx = match.index;
    if (strippedIdx > 0) {
      const prevChar = stripped[strippedIdx - 1];
      if (/[a-zA-Z0-9_.)\]]/.test(prevChar)) continue;
    }

    const fileCharIdx = strippedIndices[strippedIdx];
    const lineNum = fileCharIdx ? fileContent.slice(0, fileCharIdx).split('\n').length : 'N/A';

    if (isClosing) {
      if (stack.length > 0) {
        const top = stack.pop();
        console.log(`[CLOSE] Line ${lineNum}: </${tagName}>, popped <${top.tagName}@${top.lineNum}>`);
        if (top.tagName !== tagName) {
          console.log(`>>> ERROR: Mismatch! Closed </${tagName}> but expected </${top.tagName}> (opened on line ${top.lineNum})`);
          break;
        }
      } else {
        console.log(`[CLOSE] Line ${lineNum}: </${tagName}> but stack is empty`);
        break;
      }
    } else {
      stack.push({ tagName, lineNum });
      console.log(`[OPEN] Line ${lineNum}: <${tagName}>`);
    }
  }
}

traceRange(7167, 7860);
