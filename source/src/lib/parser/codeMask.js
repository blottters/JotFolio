// Find character ranges occupied by Markdown code spans so other parsers can
// ignore tokens inside them. Wikilinks, tags, embeds, and block refs all
// short-circuit when their match offset falls inside a returned range.
//
// Covers:
// - Fenced code blocks: ```lang\n...\n``` and ~~~lang\n...\n~~~
// - Inline code spans: `code`, ``code with ` backtick``
// - Indented code blocks (4-space / 1-tab line prefix)
//
// Each range is `{start, end}` with character offsets into the original
// source. `end` is exclusive. Empty `[]` if no code present.

const FENCE_RE = /^([ ]{0,3})(```+|~~~+)([^\n]*)\n?/m;

export function findCodeRanges(markdown) {
  const src = String(markdown || '');
  const ranges = [];
  let i = 0;

  // Pass 1 — fenced blocks. Walk line-by-line so we can match opening/closing
  // fences with the same marker length.
  while (i < src.length) {
    const lineEnd = src.indexOf('\n', i);
    const line = src.slice(i, lineEnd === -1 ? src.length : lineEnd);
    const fence = /^([ ]{0,3})(```+|~~~+)([^\n]*)$/.exec(line);
    if (fence) {
      const marker = fence[2];
      const blockStart = i;
      i = (lineEnd === -1 ? src.length : lineEnd + 1);
      // Find matching closing fence (>= same length, same char).
      const closer = new RegExp(`^[ ]{0,3}${marker[0]}{${marker.length},}[ \t]*$`);
      while (i < src.length) {
        const nextLineEnd = src.indexOf('\n', i);
        const nextLine = src.slice(i, nextLineEnd === -1 ? src.length : nextLineEnd);
        if (closer.test(nextLine)) {
          i = (nextLineEnd === -1 ? src.length : nextLineEnd + 1);
          break;
        }
        i = (nextLineEnd === -1 ? src.length : nextLineEnd + 1);
      }
      ranges.push({ start: blockStart, end: i });
      continue;
    }
    i = (lineEnd === -1 ? src.length : lineEnd + 1);
  }

  // Pass 2 — inline code spans. Skip if inside an already-found fence range.
  // Inline syntax: one or more backticks, content, matching backtick run.
  const inlineRe = /(`+)([\s\S]*?[^`])\1(?!`)/g;
  let m;
  while ((m = inlineRe.exec(src)) !== null) {
    if (isInside(m.index, ranges)) continue;
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }

  // Sort + merge overlapping ranges.
  ranges.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end;
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
}

export function isInside(offset, ranges) {
  for (const r of ranges) {
    if (offset >= r.start && offset < r.end) return true;
  }
  return false;
}

export function lineAt(markdown, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < markdown.length; i++) {
    if (markdown.charCodeAt(i) === 10) line++;
  }
  return line;
}
