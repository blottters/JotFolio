// Semantic index over the vault. Builds a Map<entryId, Float32Array> of
// 384-dim sentence embeddings, persists to <vault>/.jotfolio/semantic-cache.json
// so re-launches don't re-embed unchanged entries, and exposes a top-K lookup.
//
// Charter compliance: everything local. No network, no telemetry, no CDN.

import { embedText } from './embed.js';
import { findTopK } from './similarity.js';

const CACHE_PATH = '.jotfolio/semantic-cache.json';
const CACHE_VERSION = 1;
const CACHE_MODEL = 'Xenova/all-MiniLM-L6-v2:quantized';
const MAX_INPUT_LEN = 4000; // characters; keeps per-entry embed cost bounded

// Lightweight, fast hash over title+body so we can detect changes without
// re-embedding. Not crypto — just a stable fingerprint for the cache key.
// FNV-1a 32-bit, returned as base36 string.
function contentHash(text) {
  let h = 0x811c9dc5;
  const s = String(text || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function inputFor(entry) {
  const title = String(entry?.title || '').trim();
  // entry.notes is the canonical body field across JotFolio (see DetailPanel,
  // useVault). Fall back to .body in case a future codepath uses that name.
  const body = String(entry?.notes || entry?.body || '').trim();
  if (!title && !body) return '';
  return `${title}\n${body}`.slice(0, MAX_INPUT_LEN);
}

function isMeaningful(text) {
  // Skip near-empty entries — embedding 3 chars of whitespace returns a
  // garbage vector and pollutes the similarity space.
  return text && text.replace(/\s+/g, ' ').trim().length >= 8;
}

// Vector ⇄ JSON helpers. Float32Array isn't JSON-serializable; we round to
// 6 decimal places to shrink disk size. Precision loss < 1e-6 doesn't affect
// cosine similarity at the 2-decimal display granularity we use.
function vecToArray(vec) {
  const out = new Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = Math.round(vec[i] * 1e6) / 1e6;
  return out;
}
function arrayToVec(arr) {
  return new Float32Array(arr);
}

// Cache shape: { version, model, entries: { [id]: { hash, vec } } }
async function readCache(vaultAdapter) {
  if (!vaultAdapter?.read) return null;
  try {
    const raw = await vaultAdapter.read(CACHE_PATH);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CACHE_VERSION) return null;
    if (parsed?.model !== CACHE_MODEL) return null;
    return parsed;
  } catch {
    // Missing file, parse error, or read failure — treat as cold cache.
    return null;
  }
}

async function writeCache(vaultAdapter, payload) {
  if (!vaultAdapter?.write) return;
  try {
    // Ensure parent dir exists. Many adapters create on write, but be safe.
    if (vaultAdapter.mkdir) {
      try { await vaultAdapter.mkdir('.jotfolio'); } catch { /* maybe exists */ }
    }
    await vaultAdapter.write(CACHE_PATH, JSON.stringify(payload));
  } catch {
    // Cache failure is non-fatal — index still works in-memory.
  }
}

// Public API ────────────────────────────────────────────────────────────────

// Builds (or refreshes from cache) the full semantic index for a vault.
// Returns Map<entryId, Float32Array>. Entries with empty/near-empty content
// are omitted from the map.
//
// options:
//   onProgress({done, total, fromCache}) — fires after each entry processed
//   vaultAdapter — optional adapter with .read/.write for cache persistence
//   signal — optional AbortSignal to cancel a long build
export async function buildSemanticIndex(entries, options = {}) {
  const list = Array.isArray(entries) ? entries : [];
  const total = list.length;
  const { onProgress, vaultAdapter, signal } = options;
  const index = new Map();
  if (total === 0) return index;

  const cached = await readCache(vaultAdapter);
  const cacheEntries = cached?.entries || {};
  const nextCache = { version: CACHE_VERSION, model: CACHE_MODEL, entries: {} };

  let done = 0;
  for (const entry of list) {
    if (signal?.aborted) break;
    const input = inputFor(entry);
    if (!isMeaningful(input)) {
      done += 1;
      onProgress?.({ done, total, fromCache: false });
      continue;
    }
    const hash = contentHash(input);
    const prior = cacheEntries[entry.id];
    let vec = null;
    let fromCache = false;
    if (prior?.hash === hash && Array.isArray(prior.vec)) {
      vec = arrayToVec(prior.vec);
      fromCache = true;
    } else {
      try {
        vec = await embedText(input);
      } catch (err) {
        // One bad entry shouldn't kill the whole build. Skip it.
        console.warn('[semantic] embed failed for', entry.id, err);
        vec = null;
      }
    }
    if (vec) {
      index.set(entry.id, vec);
      nextCache.entries[entry.id] = { hash, vec: vecToArray(vec) };
    }
    done += 1;
    onProgress?.({ done, total, fromCache });
  }

  // Persist whatever we got — even partial builds, so a cancelled/aborted
  // run doesn't waste the work it already did.
  await writeCache(vaultAdapter, nextCache);
  return index;
}

// Re-embed a single entry and update an existing index in-place. Returns the
// new vector (or null if the entry is empty / embedding failed). Use this on
// save so the index stays fresh without rebuilding everything.
export async function reembedEntry(index, entry, options = {}) {
  if (!entry || !entry.id) return null;
  const input = inputFor(entry);
  if (!isMeaningful(input)) {
    index.delete(entry.id);
    await maybePersistAfterUpdate(index, options);
    return null;
  }
  try {
    const vec = await embedText(input);
    if (vec) index.set(entry.id, vec);
    await maybePersistAfterUpdate(index, options);
    return vec;
  } catch (err) {
    console.warn('[semantic] re-embed failed for', entry.id, err);
    return null;
  }
}

async function maybePersistAfterUpdate(index, options) {
  if (!options?.vaultAdapter?.write) return;
  // Rebuild the cache snapshot from the in-memory index. We don't keep the
  // per-entry hash here because re-embed doesn't re-derive content hashes —
  // store a sentinel "live" hash so the next cold-load knows to revalidate.
  const payload = { version: CACHE_VERSION, model: CACHE_MODEL, entries: {} };
  for (const [id, vec] of index.entries()) {
    payload.entries[id] = { hash: 'live', vec: vecToArray(vec) };
  }
  await writeCache(options.vaultAdapter, payload);
}

// Top-K nearest entries by cosine similarity. Excludes the target id and
// applies an optional minScore threshold.
export function getSimilarEntries(index, entryId, k = 5, options = {}) {
  if (!index || !entryId) return [];
  const target = index.get(entryId);
  if (!target) return [];
  return findTopK(target, index, k, {
    excludeId: entryId,
    minScore: typeof options.minScore === 'number' ? options.minScore : 0,
  });
}

export const _internals = { contentHash, inputFor, CACHE_PATH, CACHE_VERSION, CACHE_MODEL };
