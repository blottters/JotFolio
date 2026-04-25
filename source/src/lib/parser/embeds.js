// Embed parser. Returns Embed[]:
//   { raw, target, alias?, line }
//
// Syntax: ![[target]] or ![[target|alias]]. Embeds inside code spans are
// ignored. Image embeds (extension-based detection) and note embeds share
// the same shape; callers can branch on extension if needed.

import { findCodeRanges, isInside, lineAt } from './codeMask.js';

const EMBED_RE = /!\[\[([^\[\]\n]{1,400})\]\]/g;

export function parseEmbeds(markdown, opts = {}) {
  const src = String(markdown || '');
  const codeRanges = opts.codeRanges || findCodeRanges(src);
  const out = [];
  let m;
  EMBED_RE.lastIndex = 0;
  while ((m = EMBED_RE.exec(src)) !== null) {
    if (isInside(m.index, codeRanges)) continue;
    const inner = m[1];
    if (!inner.trim()) continue;
    const pipeIdx = inner.indexOf('|');
    let target = inner;
    let alias;
    if (pipeIdx !== -1) {
      target = inner.slice(0, pipeIdx);
      const a = inner.slice(pipeIdx + 1).trim();
      alias = a === '' ? undefined : a;
    }
    out.push({
      raw: m[0],
      target: target.trim(),
      alias,
      line: lineAt(src, m.index),
    });
  }
  return out;
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp']);

export function isImageEmbed(embed) {
  if (!embed?.target) return false;
  const ext = String(embed.target).split('.').pop()?.toLowerCase();
  return ext ? IMAGE_EXTS.has(ext) : false;
}
