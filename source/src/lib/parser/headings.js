// ATX heading parser. Returns Heading[] per spec:
//   { level, text, slug, line }
//
// - Levels 1–6.
// - Trailing closing #'s are stripped.
// - Headings inside fenced code blocks are skipped.
// - Slug is lowercase, spaces→hyphens, non-alphanum stripped, repeated
//   hyphens collapsed. Duplicates within the same document are
//   disambiguated with an incrementing -2, -3, ... suffix to match common
//   markdown anchor behavior.

import { findCodeRanges, isInside } from './codeMask.js';

const ATX_RE = /^[ ]{0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/gm;

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function parseHeadings(markdown, opts = {}) {
  const src = String(markdown || '');
  const codeRanges = opts.codeRanges || findCodeRanges(src);
  const out = [];
  const slugCounts = new Map();

  // Use offset → line counting via line-walk so we can match line-anchored regex.
  let lineNum = 1;
  let cursor = 0;
  while (cursor < src.length) {
    const lineEnd = src.indexOf('\n', cursor);
    const line = src.slice(cursor, lineEnd === -1 ? src.length : lineEnd);
    const m = /^[ ]{0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/.exec(line);
    if (m && !isInside(cursor, codeRanges)) {
      const level = m[1].length;
      const text = m[2].trim();
      const baseSlug = slugify(text);
      const count = slugCounts.get(baseSlug) || 0;
      slugCounts.set(baseSlug, count + 1);
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
      out.push({ level, text, slug, line: lineNum });
    }
    if (lineEnd === -1) break;
    cursor = lineEnd + 1;
    lineNum++;
  }

  void ATX_RE; // keep regex export shape stable; actual matching is per-line
  return out;
}
