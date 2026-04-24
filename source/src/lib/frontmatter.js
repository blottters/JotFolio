// Frontmatter parser + serializer for JotFolio .md files.
// Format: `---\n<yaml>\n---\n<body>` per ADR-0005.
//
// Supports a tight YAML subset sufficient for JotFolio entry metadata:
//   - scalar values: string, number, boolean, null, ISO date
//   - inline flow arrays of strings: [a, b, c]
//   - multi-line block arrays of strings:
//       tags:
//         - ai
//         - research
//
// Nested maps, anchors, tags, multiline folded strings → not supported.
// If a file needs them, quote or escape.
//
// Throws FrontmatterError with 1-indexed line number.

const RESERVED_CHARS = /[:#{}[\],&*!|>'"%@`]/;

export class FrontmatterError extends Error {
  constructor(message, line) {
    super(line != null ? `${message} (line ${line})` : message);
    this.name = 'FrontmatterError';
    this.line = line;
  }
}

// ───── Parse ──────────────────────────────────────────────────────

/**
 * @param {string} content
 * @returns {{ frontmatter: Object, body: string, raw: string }}
 */
export function parse(content) {
  if (typeof content !== 'string') throw new FrontmatterError('Expected string content');
  const raw = content;
  // No frontmatter block → empty meta, all body
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return { frontmatter: {}, body: content, raw };
  }
  const afterOpen = content.replace(/^---\r?\n/, '');
  // Match either `\n---\n` / `\n---\r\n` (body follows) or `\n---` at EOF
  // (no trailing newline). Files that end at the close delimiter without
  // a trailing newline are valid and should not be rejected.
  const closeMatch = afterOpen.match(/\n---(?:\r?\n|$)/);
  if (!closeMatch) {
    // Open but no close → treat as broken frontmatter
    throw new FrontmatterError('Frontmatter opened with --- but no closing --- found', 1);
  }
  const yamlBlock = afterOpen.slice(0, closeMatch.index);
  const body = afterOpen.slice(closeMatch.index + closeMatch[0].length);
  const frontmatter = parseYaml(yamlBlock, 2); // line 1 is opening ---
  return { frontmatter, body, raw };
}

// Keys that would pollute Object.prototype if assigned blindly.
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function parseYaml(src, baseLine) {
  // Split on LF, then strip any trailing CR. Handles CRLF and lone-CR edge
  // cases without polluting scalar values with stray \r.
  const lines = src.split('\n').map(l => l.endsWith('\r') ? l.slice(0, -1) : l);
  const obj = Object.create(null); // no prototype chain; safer target
  let i = 0;
  while (i < lines.length) {
    const lineNum = baseLine + i;
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue; }
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) throw new FrontmatterError(`Invalid line: "${line}"`, lineNum);
    const [, key, valueRaw] = m;
    if (UNSAFE_KEYS.has(key)) throw new FrontmatterError(`Forbidden key: "${key}"`, lineNum);
    const value = valueRaw.trim();
    if (value === '') {
      // Block array on following lines (`-` prefixed, indented)
      const collected = [];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        const nm = next.match(/^(\s+)-\s+(.*)$/);
        if (!nm) break;
        collected.push(parseScalar(nm[2].trim(), baseLine + j));
        j++;
      }
      obj[key] = collected;
      i = j;
      continue;
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      obj[key] = parseFlowArray(value, lineNum);
    } else {
      obj[key] = parseScalar(value, lineNum);
    }
    i++;
  }
  return obj;
}

function parseFlowArray(src, lineNum) {
  const inner = src.slice(1, -1).trim();
  if (!inner) return [];
  // Split on comma, but respect quoted strings
  const out = [];
  let cur = '';
  let quote = null;
  for (let k = 0; k < inner.length; k++) {
    const c = inner[k];
    if (quote) {
      if (c === quote) { quote = null; cur += c; continue; }
      cur += c; continue;
    }
    if (c === '"' || c === "'") { quote = c; cur += c; continue; }
    if (c === ',') { out.push(parseScalar(cur.trim(), lineNum)); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(parseScalar(cur.trim(), lineNum));
  return out;
}

function parseScalar(s, lineNum) {
  if (s === 'null' || s === '~' || s === '') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  // Double-quoted: decode JSON-style escape sequences so round-trip with
  // serializeScalar (which uses JSON.stringify) is lossless for `\\` and `\"`.
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    try { return JSON.parse(s); }
    catch { return s.slice(1, -1); }
  }
  // Single-quoted: no escape processing (YAML spec). Only escape sequence
  // is `''` for a literal single quote.
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  // Number
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  // Everything else = string as-is
  return s;
}

// ───── Serialize ──────────────────────────────────────────────────

const FIELD_ORDER = [
  'id', 'type', 'title', 'tags', 'status', 'starred',
  'created', 'modified', 'entry_date', 'date',
  'url', 'channel', 'duration', 'guest', 'episode', 'highlight',
  'links',
];

export const FRONTMATTER_EXTRAS_FIELD = '_frontmatterExtras';
export const MANUAL_LINKS_FIELD = '_manualLinks';

const ENTRY_FRONTMATTER_FIELDS = new Set(FIELD_ORDER);

function frontmatterExtras(frontmatter) {
  const extras = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!ENTRY_FRONTMATTER_FIELDS.has(key)) extras[key] = value;
  }
  return extras;
}

function cleanStringArray(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String).filter(Boolean))];
}

/**
 * @param {{ frontmatter: Object, body: string }} arg
 * @returns {string}
 */
export function serialize({ frontmatter, body }) {
  const fm = frontmatter || {};
  const keys = Object.keys(fm);
  const ordered = [
    ...FIELD_ORDER.filter(k => k in fm),
    ...keys.filter(k => !FIELD_ORDER.includes(k)).sort(),
  ];
  const lines = ['---'];
  for (const k of ordered) {
    const v = fm[k];
    lines.push(serializeField(k, v));
  }
  lines.push('---');
  const trailing = body.endsWith('\n') ? body : body + '\n';
  return lines.join('\n') + '\n' + trailing;
}

function serializeField(key, value) {
  if (value == null) return `${key}: null`;
  if (typeof value === 'boolean') return `${key}: ${value}`;
  if (typeof value === 'number') return `${key}: ${value}`;
  if (Array.isArray(value)) {
    if (value.length === 0) return `${key}: []`;
    // Prefer flow form for short string arrays
    const allShortStrings = value.every(v => typeof v === 'string' && v.length < 24 && !RESERVED_CHARS.test(v));
    if (allShortStrings && value.length <= 8) {
      return `${key}: [${value.map(serializeScalar).join(', ')}]`;
    }
    return `${key}:\n` + value.map(v => `  - ${serializeScalar(v)}`).join('\n');
  }
  return `${key}: ${serializeScalar(value)}`;
}

function serializeScalar(v) {
  if (v == null) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const s = String(v);
  if (s === '' || RESERVED_CHARS.test(s) || /^\s|\s$/.test(s) || /^(true|false|null|~|yes|no)$/i.test(s) || /^-?\d/.test(s)) {
    return JSON.stringify(s);
  }
  return s;
}

export function stripFrontmatter(content) {
  return parse(content).body;
}

// ───── Entry ↔ File conversion ────────────────────────────────────

// Sanitize title → filesystem-safe slug. Preserves unicode, strips
// separators, trims length.
export function slugify(title) {
  if (typeof title !== 'string') return 'untitled';
  const cleaned = title
    .replace(/[\\/:*?"<>|]/g, '')        // illegal on Windows/Mac
    .replace(/\s+/g, ' ')
    .trim();
  const trimmed = cleaned.slice(0, 80) || 'untitled';
  return trimmed;
}

// Each type has a default folder bucket. User-created folders override.
export const TYPE_FOLDER = {
  note: 'notes',
  video: 'videos',
  podcast: 'podcasts',
  article: 'articles',
  journal: 'journals',
  link: 'links',
};

/**
 * @param {Object} entry
 * @param {(candidatePath: string) => boolean} [exists] - Optional collision detector
 * @returns {{ path: string, content: string }}
 */
export function entryToFile(entry, exists) {
  const folder = TYPE_FOLDER[entry.type] || 'notes';
  const slug = slugify(entry.title || 'Untitled');
  let path = `${folder}/${slug}.md`;
  if (typeof exists === 'function') {
    let suffix = 2;
    while (exists(path)) {
      path = `${folder}/${slug}-${suffix}.md`;
      suffix++;
      if (suffix > 999) throw new FrontmatterError('Too many collisions for ' + slug);
    }
  }
  const now = new Date().toISOString();
  const frontmatter = {
    ...(entry[FRONTMATTER_EXTRAS_FIELD] && typeof entry[FRONTMATTER_EXTRAS_FIELD] === 'object'
      ? entry[FRONTMATTER_EXTRAS_FIELD]
      : {}),
    id: entry.id,
    type: entry.type,
    title: entry.title || 'Untitled',
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    status: entry.status || '',
    starred: !!entry.starred,
    created: entry.created || entry.date || now,
    modified: now,
  };
  if (entry.entry_date) frontmatter.entry_date = entry.entry_date;
  if (entry.url) frontmatter.url = entry.url;
  if (entry.channel) frontmatter.channel = entry.channel;
  if (entry.duration) frontmatter.duration = entry.duration;
  if (entry.guest) frontmatter.guest = entry.guest;
  if (entry.episode) frontmatter.episode = entry.episode;
  if (entry.highlight) frontmatter.highlight = entry.highlight;
  if (entry[MANUAL_LINKS_FIELD]) frontmatter.links = cleanStringArray(entry.links);
  const body = typeof entry.notes === 'string' ? entry.notes : '';
  return { path, content: serialize({ frontmatter, body }) };
}

/**
 * @param {{ path: string, content: string }} file
 * @returns {Object} entry
 */
export function fileToEntry({ path, content }) {
  const { frontmatter, body } = parse(content);
  if (!frontmatter.id) throw new FrontmatterError(`Missing required field: id (${path})`);
  if (!frontmatter.type) throw new FrontmatterError(`Missing required field: type (${path})`);
  const manualLinks = Array.isArray(frontmatter.links);
  const extras = frontmatterExtras(frontmatter);
  return {
    id: String(frontmatter.id),
    type: String(frontmatter.type),
    title: String(frontmatter.title || ''),
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
    status: String(frontmatter.status || ''),
    starred: !!frontmatter.starred,
    date: String(frontmatter.created || frontmatter.modified || new Date().toISOString()),
    entry_date: frontmatter.entry_date ? String(frontmatter.entry_date) : undefined,
    url: frontmatter.url ? String(frontmatter.url) : undefined,
    channel: frontmatter.channel ? String(frontmatter.channel) : undefined,
    duration: frontmatter.duration ? String(frontmatter.duration) : undefined,
    guest: frontmatter.guest ? String(frontmatter.guest) : undefined,
    episode: frontmatter.episode ? String(frontmatter.episode) : undefined,
    highlight: frontmatter.highlight ? String(frontmatter.highlight) : undefined,
    notes: body.trim(),
    links: manualLinks ? cleanStringArray(frontmatter.links) : [],
    [MANUAL_LINKS_FIELD]: manualLinks,
    [FRONTMATTER_EXTRAS_FIELD]: extras,
    _path: path,
  };
}
