// Orphan scan in Node.
// Reads _exports.tsv (name, definedAt). For each export, scans all .js/.jsx/.ts/.tsx/.mjs/.cjs
// under source/src for word-boundary references, excluding the defining file and *.test.* of same base.
// Writes _orphan_scan.tsv (name, defined, refCount, sampleRef).

import fs from 'node:fs';
import path from 'node:path';

const exportsTsv = 'C:\\Dev\\Projects\\JotFolio\\audit-phase1\\_exports.tsv';
const outTsv = 'C:\\Dev\\Projects\\JotFolio\\audit-phase1\\_orphan_scan.tsv';
const srcRoot = 'C:\\Dev\\Projects\\JotFolio\\source\\src';
const VALID_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (e.isFile() && VALID_EXTS.has(path.extname(e.name))) files.push(full);
  }
  return files;
}

const allFiles = walk(srcRoot);
// Cache file content
const fileContent = new Map();
function read(f) {
  if (!fileContent.has(f)) fileContent.set(f, fs.readFileSync(f, 'utf8'));
  return fileContent.get(f);
}

const rawExports = fs.readFileSync(exportsTsv, 'utf8').split(/\r?\n/).filter(Boolean);
const exports_ = rawExports.map(line => {
  const parts = line.split('\t');
  if (parts.length < 2) return null;
  // defined like "C:\path\to\file.js:NN"
  const defined = parts[1];
  const colonIdx = defined.lastIndexOf(':');
  const definedFile = defined.slice(0, colonIdx);
  return { name: parts[0], defined, definedFile };
}).filter(Boolean);

const out = ['name\tdefined\trefCount\tsampleRef'];

let i = 0;
for (const ex of exports_) {
  i++;
  // Build word-boundary regex; escape special chars
  const escaped = ex.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`);

  // Defining file path base for matching its test files
  const baseNoExt = ex.definedFile.replace(/\.(jsx?|tsx?|m?js|cjs)$/, '');

  let count = 0;
  let sample = '';
  for (const f of allFiles) {
    if (f === ex.definedFile) continue;
    // Exclude test files for this module: <basename>.test.* or <basename>.safety.test.* etc.
    if (f.startsWith(baseNoExt + '.test.') || f.startsWith(baseNoExt + '.safety.test.')) continue;
    const content = read(f);
    if (!re.test(content)) continue;
    // Count lines that match
    const lines = content.split(/\r?\n/);
    for (let li = 0; li < lines.length; li++) {
      if (re.test(lines[li])) {
        count++;
        if (!sample) sample = `${f}:${li + 1}`;
      }
    }
  }
  out.push(`${ex.name}\t${ex.defined}\t${count}\t${sample}`);
  if (i % 30 === 0) console.log(`Scanned ${i}/${exports_.length}`);
}

fs.writeFileSync(outTsv, out.join('\n'), 'utf8');
console.log(`Done. ${exports_.length} exports scanned. Wrote ${outTsv}`);
