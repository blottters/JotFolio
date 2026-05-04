// Pure-JS hashing primitives for compile pipeline.
// Algorithm: djb2 (per Karpathy Phase 4 spec §1 decision lock).
// Output is 32-hex by running djb2 four times with distinct salt prefixes
// and concatenating the 8-hex results. Cheap, deterministic, no deps.
// Not cryptographic — only used for change detection & cache keys.

function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // | 0 forces 32-bit signed wrap; >>> 0 below converts to unsigned for hex.
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// 4 rounds w/ distinct salts -> 32 hex chars. Salts diversify the bit pattern
// so collisions in one round don't trivially propagate.
function djb2_32(str) {
  return djb2('a:' + str) + djb2('b:' + str) + djb2('c:' + str) + djb2('d:' + str);
}

function normalizeBody(s) {
  if (s == null) return '';
  return String(s).replace(/\r\n/g, '\n');
}

// Recursively canonicalize: sort object keys, preserve array order.
// Excludes top-level keys listed in `exclude`.
function canonicalize(value, exclude) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => canonicalize(v, null));
  const out = {};
  const keys = Object.keys(value).sort();
  for (const k of keys) {
    if (exclude && exclude.has(k)) continue;
    out[k] = canonicalize(value[k], null);
  }
  return out;
}

function stableStringify(value) {
  return JSON.stringify(canonicalize(value, null));
}

/**
 * Hash a source entry for change detection.
 * Includes: id, type, title, notes, canonical_key, aliases (sorted), source_type, valid_from.
 * Excludes: modified (timestamp churn), _path (FS detail), links (derived).
 * Body content (notes) normalized CRLF -> LF before hashing.
 */
export function hashSourceEntry(entry) {
  const e = entry || {};
  const aliases = Array.isArray(e.aliases) ? [...e.aliases].sort() : [];
  const payload = {
    id: e.id ?? null,
    type: e.type ?? null,
    title: e.title ?? null,
    notes: normalizeBody(e.notes),
    canonical_key: e.canonical_key ?? null,
    aliases,
    source_type: e.source_type ?? null,
    valid_from: e.valid_from ?? null,
  };
  return djb2_32(stableStringify(payload));
}

/**
 * Hash a compiled artifact (frontmatter + body).
 * Frontmatter canonicalized (deep key sort) and stripped of `modified` + `id`.
 * Body CRLF-normalized. Result: 32-hex.
 */
export function hashCompiledArtifact({ body, frontmatter } = {}) {
  const exclude = new Set(['modified', 'id']);
  const canonFm = canonicalize(frontmatter ?? {}, exclude);
  const fmStr = JSON.stringify(canonFm);
  const bodyStr = normalizeBody(body);
  return djb2_32(fmStr + '\n---\n' + bodyStr);
}

/**
 * Composite hash of a list of {id, hash} pairs. Sort by id ASC for stability.
 */
export function compositeSourceHash(sources) {
  const arr = Array.isArray(sources) ? sources : [];
  const sorted = arr
    .map((s) => ({ id: s?.id ?? null, hash: s?.hash ?? null }))
    .sort((a, b) => {
      const ai = String(a.id);
      const bi = String(b.id);
      return ai < bi ? -1 : ai > bi ? 1 : 0;
    });
  return djb2_32(JSON.stringify(sorted));
}
