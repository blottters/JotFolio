// Template store — pure logic for SlateVault Templates feature.
//
// Templates live as plain Markdown files under `<vault>/templates/*.md`.
// Optional YAML frontmatter is preserved; bodies may contain `{{date}}`,
// `{{date:FORMAT}}`, `{{time}}`, and `{{title}}` variables that resolve
// at insert time.
//
// This module is intentionally pure: no React, no DOM, no adapter wiring.
// `loadTemplates(vault)` accepts any object that quacks like the
// VaultAdapter contract (`list()` + `read(path)`), so tests can pass a
// plain mock. UI parents own template creation/editing flows.

import { parse as parseFrontmatter } from '../frontmatter.js';

export const TEMPLATE_DIR = 'templates';
export const TEMPLATE_EXT = '.md';

/**
 * @typedef {Object} Template
 * @property {string} id        - Stable identifier (currently the file path)
 * @property {string} name      - Display name (filename without .md)
 * @property {string} path      - Vault-relative path
 * @property {string} body      - Template body (markdown after frontmatter)
 * @property {Object} frontmatter - Parsed frontmatter (may be {})
 */

/**
 * Scan the vault's `templates/` folder and load every .md file into a
 * Template[]. Missing folder is not an error — returns []. Files that fail
 * to read or parse are skipped (caller may surface them later if needed).
 *
 * @param {{ list: () => Promise<Array<{path:string,name:string}>>, read: (path:string)=>Promise<string> }} vault
 * @returns {Promise<Template[]>}
 */
export async function loadTemplates(vault) {
  if (!vault || typeof vault.list !== 'function' || typeof vault.read !== 'function') {
    return [];
  }
  let files;
  try {
    files = await vault.list();
  } catch {
    return [];
  }
  if (!Array.isArray(files)) return [];
  const prefix = TEMPLATE_DIR + '/';
  const matched = files.filter(f => {
    if (!f || typeof f.path !== 'string') return false;
    if (!f.path.startsWith(prefix)) return false;
    if (!f.path.toLowerCase().endsWith(TEMPLATE_EXT)) return false;
    // Don't recurse into nested folders — only direct children of templates/.
    const rest = f.path.slice(prefix.length);
    if (rest.includes('/')) return false;
    return true;
  });
  const out = [];
  for (const f of matched) {
    let content;
    try {
      content = await vault.read(f.path);
    } catch {
      continue;
    }
    let frontmatter = {};
    let body = typeof content === 'string' ? content : '';
    try {
      const parsed = parseFrontmatter(body);
      frontmatter = parsed.frontmatter || {};
      body = parsed.body || '';
    } catch {
      // Frontmatter broken — fall back to raw content as body.
      frontmatter = {};
      body = typeof content === 'string' ? content : '';
    }
    const baseName = (f.name || f.path.split('/').pop() || '').replace(/\.md$/i, '');
    out.push({
      id: f.path,
      name: baseName || 'Untitled',
      path: f.path,
      body,
      frontmatter,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// ───── Variable resolution ────────────────────────────────────────

const VARIABLE_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)(?::([^}]*))?\s*\}\}/g;

/**
 * Resolve `{{date}}`, `{{date:FORMAT}}`, `{{time}}`, and `{{title}}` in a
 * template body. Unknown variables are left untouched so authors can spot
 * typos visually.
 *
 * @param {string} body
 * @param {{ date?: Date, title?: string }} ctx
 * @returns {string}
 */
export function resolveVariables(body, ctx) {
  const src = typeof body === 'string' ? body : '';
  const date = (ctx && ctx.date instanceof Date) ? ctx.date : new Date();
  const title = ctx && typeof ctx.title === 'string' ? ctx.title : '';
  return src.replace(VARIABLE_RE, (match, name, format) => {
    const key = String(name).toLowerCase();
    if (key === 'date') {
      return formatDate(date, format ? format.trim() : 'YYYY-MM-DD');
    }
    if (key === 'time') {
      return formatDate(date, format ? format.trim() : 'HH:mm:ss');
    }
    if (key === 'title') {
      return title;
    }
    return match;
  });
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
];

// Tokenizer driven by longest-match-first ordering. Anything that isn't a
// known token is emitted verbatim, so authors can interleave punctuation
// and prose freely (e.g. `{{date:dddd, MMMM D, YYYY}}`).
const TOKEN_RE = /(YYYY|YY|MMMM|MMM|MM|M|DDDD|dddd|ddd|DD|D|HH|H|mm|m|ss|s)/g;

function pad2(n) { return String(n).padStart(2, '0'); }

function formatDate(date, fmt) {
  const d = date instanceof Date ? date : new Date();
  const y = d.getFullYear();
  const mo = d.getMonth();
  const da = d.getDate();
  const dow = d.getDay();
  const h = d.getHours();
  const mi = d.getMinutes();
  const se = d.getSeconds();
  const map = {
    YYYY: String(y),
    YY: String(y).slice(-2),
    MMMM: MONTH_NAMES[mo],
    MMM: MONTH_NAMES[mo].slice(0, 3),
    MM: pad2(mo + 1),
    M: String(mo + 1),
    DDDD: DAY_NAMES[dow],
    dddd: DAY_NAMES[dow],
    ddd: DAY_NAMES[dow].slice(0, 3),
    DD: pad2(da),
    D: String(da),
    HH: pad2(h),
    H: String(h),
    mm: pad2(mi),
    m: String(mi),
    ss: pad2(se),
    s: String(se),
  };
  return String(fmt || '').replace(TOKEN_RE, t => map[t] != null ? map[t] : t);
}

// ───── Apply / insert ─────────────────────────────────────────────

/**
 * Combine a template's frontmatter with the resolved body. The frontmatter
 * is shallow-cloned so mutating the result doesn't ripple back into the
 * cached Template. Used by the "Apply to active note" flow where the
 * parent component decides how to merge the result with the note.
 *
 * @param {Template} template
 * @param {{ date?: Date, title?: string }} ctx
 * @returns {{ frontmatter: Object, body: string }}
 */
export function applyTemplateToNote(template, ctx) {
  const fm = template && template.frontmatter && typeof template.frontmatter === 'object'
    ? { ...template.frontmatter }
    : {};
  const body = resolveVariables(template ? template.body : '', ctx || {});
  return { frontmatter: fm, body };
}

/**
 * Splice `templateBody` into `currentText` at byte position `cursorPos`.
 * Returns the new text and the new cursor position (immediately after the
 * inserted block). cursorPos is clamped to [0, currentText.length].
 *
 * @param {string} currentText
 * @param {number} cursorPos
 * @param {string} templateBody
 * @returns {{ text: string, cursorAfter: number }}
 */
export function insertTemplateAtCursor(currentText, cursorPos, templateBody) {
  const text = typeof currentText === 'string' ? currentText : '';
  const insert = typeof templateBody === 'string' ? templateBody : '';
  let pos = Number.isFinite(cursorPos) ? Math.floor(cursorPos) : 0;
  if (pos < 0) pos = 0;
  if (pos > text.length) pos = text.length;
  const before = text.slice(0, pos);
  const after = text.slice(pos);
  return {
    text: before + insert + after,
    cursorAfter: pos + insert.length,
  };
}
