// Wikilink parser. Returns InternalLink[] per the SlateVault spec:
//   { raw, target, alias?, heading?, block?, line }
//
// Syntax supported (target = the text before any of |, #, #^):
//   [[Note]]
//   [[Note|Alias]]
//   [[Note#Heading]]
//   [[Note#^block-id]]
//
// Edge cases:
// - Wikilinks inside fenced code blocks or inline code are skipped
//   (caller passes pre-computed code ranges from codeMask.findCodeRanges).
// - Empty wikilinks `[[]]` are dropped.
// - Empty alias `[[Note|]]` returns alias undefined.
// - Embeds (`![[...]]`) are NOT returned by this parser; see embeds.js.

import { findCodeRanges, isInside, lineAt } from './codeMask.js';

const WIKILINK_RE = /\[\[([^\[\]\n]{0,400})\]\]/g;

export function parseWikilinks(markdown, opts = {}) {
  const src = String(markdown || '');
  const codeRanges = opts.codeRanges || findCodeRanges(src);
  const out = [];
  let m;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(src)) !== null) {
    // Skip embeds (`![[...]]`) — they belong to the embed parser.
    if (m.index > 0 && src.charCodeAt(m.index - 1) === 33 /* '!' */) continue;
    if (isInside(m.index, codeRanges)) continue;
    const inner = m[1];
    if (!inner.trim()) continue; // empty wikilink

    const link = parseInner(inner);
    if (!link.target) continue; // e.g. "[[#Heading]]" — no target

    out.push({
      raw: m[0],
      target: link.target,
      alias: link.alias,
      heading: link.heading,
      block: link.block,
      line: lineAt(src, m.index),
    });
  }
  return out;
}

function parseInner(inner) {
  // Split on first '|' for alias.
  let body = inner;
  let alias;
  const pipeIdx = inner.indexOf('|');
  if (pipeIdx !== -1) {
    body = inner.slice(0, pipeIdx);
    const aliasRaw = inner.slice(pipeIdx + 1).trim();
    alias = aliasRaw === '' ? undefined : aliasRaw;
  }
  // Then split on first '#' for heading or block.
  let target = body;
  let heading;
  let block;
  const hashIdx = body.indexOf('#');
  if (hashIdx !== -1) {
    target = body.slice(0, hashIdx);
    const after = body.slice(hashIdx + 1);
    if (after.startsWith('^')) {
      const b = after.slice(1).trim();
      block = b || undefined;
    } else {
      const h = after.trim();
      heading = h || undefined;
    }
  }
  return {
    target: target.trim(),
    alias,
    heading,
    block,
  };
}
