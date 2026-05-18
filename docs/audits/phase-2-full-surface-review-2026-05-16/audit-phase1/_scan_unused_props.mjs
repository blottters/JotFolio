// Find destructured component props (named function or arrow) that are not used in the function body.
import fs from 'node:fs';

const targets = [
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\App.jsx',
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\features\\workstation\\WorkstationViews.jsx',
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\features\\settings\\SettingsPanel.jsx',
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\features\\sidebar\\Sidebar.jsx',
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\features\\add\\AddModal.jsx',
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\features\\detail\\DetailPanel.jsx',
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\features\\constellation\\ConstellationView.jsx',
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\features\\workstation\\WorkspaceTopBar.jsx',
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\features\\workstation\\NotesRail.jsx',
  'C:\\Dev\\Projects\\JotFolio\\source\\src\\features\\notes\\NotesWorkspaceView.jsx',
];

// Match: function ComponentName({ a, b, c = 1, d: alias }){ ... }
// Match: export function ComponentName({ ... }) {
// Match: const ComponentName = ({ ... }) =>
const funcRe = /(?:export\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*\(\s*\{([^}]+)\}\s*(?:=\s*\{\s*\}\s*)?\)\s*\{/g;
const arrowRe = /(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\(?\s*\{([^}]+)\}\s*\)?\s*=>/g;

function parseProps(destruct) {
  // strip nested objects/arrays — best-effort
  // simple: drop default values via splitting on '='
  return destruct.split(',').map(s => {
    let t = s.trim();
    if (!t) return null;
    // alias form: name: alias
    let local;
    if (t.includes(':')) {
      const right = t.split(':')[1].trim();
      local = right.split('=')[0].trim();
    } else {
      local = t.split('=')[0].trim();
    }
    // remove rest spread
    if (local.startsWith('...')) local = local.slice(3);
    return local;
  }).filter(Boolean);
}

const out = [];
for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const offsets = [0];
  for (let i = 0; i < lines.length; i++) offsets.push(offsets[i] + lines[i].length + 1);
  function lineOf(off) {
    let lo = 0, hi = offsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (offsets[mid] <= off) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }

  function findBodyEnd(content, openIdx) {
    // openIdx = index of `{`
    let depth = 0;
    for (let i = openIdx; i < content.length; i++) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) return i; }
    }
    return content.length;
  }

  for (const re of [funcRe, arrowRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      const name = m[1];
      const destruct = m[2];
      const props = parseProps(destruct);
      // body starts after `{` for the function, or after `=>` (could be `{` or expr). Find first `{` after match.
      let bodyStart = content.indexOf('{', re.lastIndex - 1);
      if (bodyStart === -1) continue;
      const bodyEnd = findBodyEnd(content, bodyStart);
      const body = content.slice(bodyStart + 1, bodyEnd);
      const compLine = lineOf(m.index);
      for (const p of props) {
        if (!p) continue;
        // Skip common UI noise props (rest, _)
        if (p === '_' || p.startsWith('_')) continue;
        const re2 = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (!re2.test(body)) {
          out.push(`${file}:${compLine}\t${name}\t${p}`);
        }
      }
    }
  }
}

if (!out.length) console.log('No unread props found in scanned components.');
else { console.log('UNREAD PROPS:'); out.forEach(l => console.log(l)); }
console.log(`Total: ${out.length}`);
