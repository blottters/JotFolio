// Deterministic stub compiler — Karpathy Phase 4 Step 2.
// Pure JS, zero deps. No async. No fetch. No window. No LLM. No agent calls.
// Caller passes pre-sorted `sources` and an `options.now()` time injector.

function uniqSorted(values) {
  const out = [];
  const seen = new Set();
  for (const v of values) {
    if (v == null) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  out.sort();
  return out;
}

// Word-boundary aware longest common prefix across titles.
// Keep the largest prefix that ends at a word boundary (whitespace) and
// is shared (case-sensitive) across every title. Trim trailing whitespace.
function longestCommonWordPrefix(titles) {
  if (!titles || titles.length === 0) return '';
  if (titles.length === 1) return titles[0];

  let prefixLen = titles[0].length;
  for (let i = 1; i < titles.length; i++) {
    const t = titles[i];
    let j = 0;
    const max = Math.min(prefixLen, t.length);
    while (j < max && titles[0][j] === t[j]) j++;
    prefixLen = j;
    if (prefixLen === 0) return '';
  }

  let candidate = titles[0].slice(0, prefixLen);

  // Walk back to a word boundary so we don't cut mid-word.
  // A "word boundary" here = end of string OR last char is whitespace.
  // If the next character (in titles[0]) past the prefix is NOT whitespace
  // and the prefix doesn't already end at whitespace, trim back to the last
  // whitespace inside the prefix.
  const nextChar = titles[0][prefixLen];
  const prefixEndsAtBoundary =
    prefixLen === titles[0].length || /\s/.test(nextChar);

  if (!prefixEndsAtBoundary) {
    const lastSpace = candidate.search(/\s\S*$/);
    if (lastSpace === -1) {
      candidate = '';
    } else {
      candidate = candidate.slice(0, lastSpace);
    }
  }

  return candidate.replace(/\s+$/, '');
}

function computeTitle(sources) {
  const titles = sources.map((s) => (s && s.title) || '').filter(Boolean);
  const lcp = longestCommonWordPrefix(titles);
  if (lcp && lcp.length > 0) return lcp;
  return (sources[0] && sources[0].title) || '';
}

function computeBody(sources, title) {
  const seed = sources[0] || {};
  const rawNotes = typeof seed.notes === 'string' ? seed.notes : '';
  const trimmedSummary = rawNotes.trim().slice(0, 200);

  const sourceLines = sources
    .map((s) => `- [[${(s && s.title) || ''}]]`)
    .join('\n');

  return [
    '## Summary',
    trimmedSummary,
    '',
    '## Sources',
    sourceLines,
    '',
    '## Open Questions',
    '-',
    ''
  ].join('\n');
}

function computeRetrievalKeywords(sources) {
  const all = [];
  for (const s of sources) {
    const kw = Array.isArray(s && s.retrieval_keywords) ? s.retrieval_keywords : [];
    const tg = Array.isArray(s && s.tags) ? s.tags : [];
    for (const v of kw) all.push(v);
    for (const v of tg) all.push(v);
  }
  return uniqSorted(all);
}

function computeAliases(sources, chosenTitle) {
  const titles = sources
    .map((s) => (s && s.title) || '')
    .filter((t) => t && t !== chosenTitle);
  return uniqSorted(titles);
}

function computeTags(sources) {
  const all = [];
  for (const s of sources) {
    const tg = Array.isArray(s && s.tags) ? s.tags : [];
    for (const v of tg) all.push(v);
  }
  return uniqSorted(all);
}

function computeProvenance(sources) {
  return sources.map((s) => (s && s.id != null ? s.id : null));
}

function computeWarnings(sources) {
  const warnings = [];
  const seed = sources[0] || {};

  if (sources.length === 1) {
    warnings.push({
      code: 'single-source',
      message: 'Only one source — confidence is low and review is required.',
      sourceIds: computeProvenance(sources)
    });
  }

  if (seed.canonical_key == null || seed.canonical_key === '') {
    warnings.push({
      code: 'no-canonical-key',
      message: 'Seed source has no canonical_key; cluster identity is unstable.',
      sourceIds: [seed.id != null ? seed.id : null]
    });
  }

  const types = new Set(
    sources.map((s) => (s && s.type) || 'raw')
  );
  const hasNonRaw = [...types].some((t) => t !== 'raw');
  if (types.size > 1 && hasNonRaw) {
    warnings.push({
      code: 'mixed-types',
      message: 'Sources span multiple types — review before promoting to wiki.',
      sourceIds: computeProvenance(sources)
    });
  }

  return warnings;
}

function computeConfidence(sources) {
  return Math.min(0.9, 0.3 + 0.15 * sources.length);
}

export function compileDeterministic(sources, options) {
  if (!Array.isArray(sources)) {
    throw new Error('compileDeterministic: sources must be an array');
  }
  if (sources.length === 0) {
    throw new Error('compileDeterministic: sources must be non-empty');
  }
  if (!options || typeof options.now !== 'function') {
    throw new Error('compileDeterministic: options.now() time injector required');
  }

  const title = computeTitle(sources);
  const body = computeBody(sources, title);
  const confidence = computeConfidence(sources);
  const retrieval_keywords = computeRetrievalKeywords(sources);
  const aliases = computeAliases(sources, title);
  const tags = computeTags(sources);
  const provenance = computeProvenance(sources);
  const warnings = computeWarnings(sources);

  const seed = sources[0] || {};
  const frontmatter = {
    type: 'review',
    title,
    canonical_key: seed.canonical_key != null ? seed.canonical_key : null,
    aliases,
    confidence,
    freshness: 'fresh',
    source_type: 'derived',
    provenance,
    valid_from: options.now(),
    review_status: 'needs_review',
    retrieval_keywords,
    tags
  };

  return { body, frontmatter, confidence, warnings };
}
