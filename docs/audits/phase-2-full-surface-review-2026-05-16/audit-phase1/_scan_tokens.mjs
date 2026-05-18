// Scan tokens.css for --jf-* defs, then check var(--jf-NAME) usage across source/src
import fs from 'node:fs';
import path from 'node:path';

const tokensFile = 'C:\\Dev\\Projects\\JotFolio\\source\\src\\design\\tokens.css';
const srcRoot = 'C:\\Dev\\Projects\\JotFolio\\source\\src';

const css = fs.readFileSync(tokensFile, 'utf8');
// Find all --jf-* definitions (left side of :)
const defs = new Set();
for (const m of css.matchAll(/^\s*(--jf-[a-z0-9-]+)\s*:/gm)) {
  defs.add(m[1]);
}

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (e.isFile() && /\.(js|jsx|ts|tsx|css|html)$/.test(e.name)) files.push(full);
  }
  return files;
}

const files = walk(srcRoot);
const usageCount = new Map();
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  for (const m of content.matchAll(/var\((--jf-[a-z0-9-]+)\b/g)) {
    const name = m[1];
    // Skip its own def site
    if (f === tokensFile) continue;
    usageCount.set(name, (usageCount.get(name) || 0) + 1);
  }
}

const unused = [];
const used = [];
for (const d of [...defs].sort()) {
  const n = usageCount.get(d) || 0;
  if (n === 0) unused.push(d);
  else used.push(`${d}\t${n}`);
}

console.log('UNUSED TOKENS:');
unused.forEach(t => console.log(t));
console.log(`\nTotal defined: ${defs.size}, unused: ${unused.length}`);
