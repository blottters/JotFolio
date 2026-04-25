// Pure stats helper for the Word Count plugin. Splits text on whitespace
// after stripping markdown noise (hashes, square brackets) so wikilinks
// and headings don't inflate the count. Returns totals + per-type buckets.

const NOISE_RE = /[#*`_>\[\]()|]/g;

export function countWords(text) {
  if (!text) return 0;
  const cleaned = String(text).replace(NOISE_RE, ' ').trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

export function wordCountSummary(entries) {
  const list = Array.isArray(entries) ? entries : [];
  let totalWords = 0;
  const perType = {};
  for (const e of list) {
    const w = countWords(e?.notes);
    totalWords += w;
    const t = e?.type || 'unknown';
    perType[t] = (perType[t] || 0) + w;
  }
  return {
    entryCount: list.length,
    totalWords,
    perType,
  };
}
