// Block reference parser. Returns BlockRef[]:
//   { id, line }
//
// A block ref is `^block-id` at the END of a line (the canonical Obsidian
// convention). Inline ^foo in the middle of prose is NOT a block ref.
// Block refs inside fenced code are ignored.

import { findCodeRanges, isInside } from './codeMask.js';

const BLOCK_RE = /\^([A-Za-z0-9][A-Za-z0-9_-]*)\s*$/;

export function parseBlockRefs(markdown, opts = {}) {
  const src = String(markdown || '');
  const codeRanges = opts.codeRanges || findCodeRanges(src);
  const out = [];
  let cursor = 0;
  let lineNum = 1;
  while (cursor < src.length) {
    const lineEnd = src.indexOf('\n', cursor);
    const lineText = src.slice(cursor, lineEnd === -1 ? src.length : lineEnd);
    const m = BLOCK_RE.exec(lineText);
    if (m && !isInside(cursor, codeRanges)) {
      out.push({ id: m[1], line: lineNum });
    }
    if (lineEnd === -1) break;
    cursor = lineEnd + 1;
    lineNum++;
  }
  return out;
}
