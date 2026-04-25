// Tag parser. Returns deduplicated string[] of tag names (no leading '#').
//
// Sources:
// - Inline tags in body: `#research`, `#project/active`
// - Frontmatter `tags:` field (string or string[])
//
// Rules:
// - Tags inside fenced code or inline code are ignored.
// - Tag must start at line start or after whitespace; not part of a word
//   (no `foo#bar` matching, no markdown heading `#` matching).
// - Allowed chars: alphanum, hyphen, underscore, slash (for nested).
// - Empty tag (`#` alone) ignored.
// - Trailing punctuation (`.`, `,`, `;`, `:`, `)`, `]`) trimmed.
// - Result is deduplicated case-insensitively but original casing of the
//   first occurrence is preserved.

import { findCodeRanges, isInside } from './codeMask.js';

const TAG_RE = /(^|[\s(])#([A-Za-z0-9_\-\/]+)/g;

export function parseInlineTags(markdown, opts = {}) {
  const src = String(markdown || '');
  const codeRanges = opts.codeRanges || findCodeRanges(src);
  const out = [];
  const seen = new Set();
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(src)) !== null) {
    const offsetOfHash = m.index + m[1].length;
    if (isInside(offsetOfHash, codeRanges)) continue;
    let raw = m[2];
    // Trim trailing punctuation so "see #foo." gives "foo".
    raw = raw.replace(/[.,;:!?)\]]+$/g, '');
    if (!raw) continue;
    // Reject pure numeric (e.g. `#123`) — likely an issue ref, not a tag.
    if (/^\d+$/.test(raw)) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(raw);
  }
  return out;
}

export function parseFrontmatterTags(frontmatter) {
  if (!frontmatter) return [];
  const raw = frontmatter.tags;
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(t => String(t).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw.split(/[,\s]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean);
  }
  return [];
}

export function mergeTags(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const t of list) {
      const s = String(t || '').trim();
      if (!s) continue;
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
  }
  return out;
}
