// Find <button>, <Pressable>, <a> elements that lack an onClick/onPress/href handler.
import fs from 'node:fs';
import path from 'node:path';

const srcRoot = 'C:\\Dev\\Projects\\JotFolio\\source\\src';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (e.isFile() && /\.jsx$/.test(e.name) && !/\.test\.jsx$/.test(e.name)) files.push(full);
  }
  return files;
}

const files = walk(srcRoot);

// Strategy: tokenize JSX opening tags for these elements and check attrs.
// Heuristic: find `<button` or `<Pressable` followed by attrs ending in `>` or `/>`.
const elemRe = /<(button|Pressable|a)\b([^>]*?)\/?>/gms;
const orphans = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split(/\r?\n/);
  let lineIdx = 0;
  const offsets = [0];
  for (let i = 0; i < lines.length; i++) offsets.push(offsets[i] + lines[i].length + 1);
  function lineOf(off) {
    // binary search
    let lo = 0, hi = offsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (offsets[mid] <= off) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }

  for (const m of content.matchAll(elemRe)) {
    const tag = m[1];
    const attrs = m[2] || '';
    // For <a>, having href is fine
    if (tag === 'a' && /\bhref\s*=/.test(attrs)) continue;
    // For <Pressable>, need onPress
    if (tag === 'Pressable' && /\bonPress\s*=/.test(attrs)) continue;
    // For <button>, need onClick OR be type=submit OR onMouseDown / onKeyDown / inside form
    if (tag === 'button') {
      if (/\b(onClick|onMouseDown|onPointerDown|onKeyDown|onSubmit)\s*=/.test(attrs)) continue;
      if (/\btype\s*=\s*["']submit["']/.test(attrs)) continue;
      // a button that just uses disabled or is purely visual
      if (/\bdisabled\b/.test(attrs) && !/\bonClick/.test(attrs)) {
        // still suspicious — flag it
      }
    }
    // For <a>: need href or onClick
    if (tag === 'a') {
      if (/\bonClick\s*=/.test(attrs)) continue;
    }
    const line = lineOf(m.index);
    orphans.push({ file: f, line, tag, snippet: m[0].slice(0, 140).replace(/\s+/g, ' ') });
  }
}

console.log(`Found ${orphans.length} potential interactive elements without handler:`);
for (const o of orphans.slice(0, 200)) {
  console.log(`${o.file}:${o.line} <${o.tag}> ${o.snippet}`);
}
