// Scan top 10 large files for imports that don't appear in body.
import fs from 'node:fs';
import path from 'node:path';

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

const out = [];

for (const file of targets) {
  if (!fs.existsSync(file)) { console.log('SKIP missing:', file); continue; }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  // Build a list of imported names
  // import default, { a, b as bb } from '...'
  // import * as ns from '...'
  const importLines = [];
  let inImport = false;
  let bufStart = -1;
  let buf = '';
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    if (!inImport && /^import\b/.test(t.trim())) {
      bufStart = i;
      buf = t;
      if (/;\s*$|^\s*}.*from /.test(t) || /from\s+['"][^'"]+['"]/.test(t)) {
        importLines.push({ start: bufStart, end: i, text: buf });
        buf = '';
      } else {
        inImport = true;
      }
    } else if (inImport) {
      buf += '\n' + t;
      if (/from\s+['"][^'"]+['"]/.test(t)) {
        importLines.push({ start: bufStart, end: i, text: buf });
        inImport = false;
        buf = '';
      }
    }
  }
  // Body is everything after last import
  const lastImportEnd = importLines.length ? importLines[importLines.length - 1].end : -1;
  const body = lines.slice(lastImportEnd + 1).join('\n');

  // Extract names from each import
  const names = [];
  for (const imp of importLines) {
    const txt = imp.text;
    // default import
    const def = txt.match(/^import\s+(\w+)(?:\s*,)?/);
    if (def && !/^import\s*\{/.test(txt)) names.push({ name: def[1], line: imp.start + 1, raw: txt.slice(0, 80) });
    // named: { a, b as bb }
    const named = txt.match(/\{([^}]+)\}/);
    if (named) {
      for (const part of named[1].split(',')) {
        const trimmed = part.trim().replace(/\s+/g, ' ');
        if (!trimmed) continue;
        const localName = trimmed.includes(' as ') ? trimmed.split(' as ')[1].trim() : trimmed;
        names.push({ name: localName, line: imp.start + 1, raw: txt.slice(0, 80) });
      }
    }
    // ns: * as foo
    const ns = txt.match(/\*\s+as\s+(\w+)/);
    if (ns) names.push({ name: ns[1], line: imp.start + 1, raw: txt.slice(0, 80) });
  }

  for (const n of names) {
    const re = new RegExp(`\\b${n.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (!re.test(body)) {
      out.push(`${file}:${n.line}\t${n.name}\t(${n.raw}...)`);
    }
  }
}

if (!out.length) console.log('No unused imports found in scanned files.');
else { console.log('UNUSED IMPORTS:'); out.forEach(l => console.log(l)); }
