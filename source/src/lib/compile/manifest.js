// Manifest persistence + stale detection for the compile pipeline.
// Karpathy Phase 4 Step 4. I/O is injected via a `vault` adapter so this
// module stays test-friendly. Pure functions where possible.
//
// Manifest shape:
//   {
//     version: 1,
//     entries: {
//       [compiledEntryId]: {
//         compiler: string,
//         sources: Array<{ id, hash, title?, type? }>,
//         sourceHash: string,        // composite hash of sources
//         compiledHash: string,      // hash of compiled artifact
//         compiledAt: ISO8601 string,
//         supersedes: string | null, // prior compiledHash, if any
//         emitted: boolean,
//         history: Array<{ compiledHash, sourceHash, compiledAt }> // ring (max 5)
//       }
//     }
//   }

import { hashSourceEntry } from './hash.js';

const MANIFEST_PATH = '.jotfolio/compiled/manifest.json';
const HISTORY_CAP = 5;

export const EMPTY_MANIFEST = Object.freeze({ version: 1, entries: {} });

function freshEmpty() {
  return { version: 1, entries: {} };
}

/**
 * Read the manifest via the vault adapter.
 *  - Missing file (vault.read returns null/undefined) -> EMPTY_MANIFEST clone.
 *  - JSON parse error or version mismatch -> EMPTY_MANIFEST clone + console.warn.
 * Never throws.
 */
export async function loadManifest(vault) {
  let raw;
  try {
    raw = await vault.read(MANIFEST_PATH);
  } catch (err) {
    console.warn('[manifest] read failed; using empty manifest:', err?.message ?? err);
    return freshEmpty();
  }
  if (raw == null) return freshEmpty();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn('[manifest] parse failed; using empty manifest:', err?.message ?? err);
    return freshEmpty();
  }
  if (!parsed || parsed.version !== 1 || typeof parsed.entries !== 'object' || parsed.entries === null) {
    console.warn('[manifest] version mismatch or malformed; using empty manifest. got:', parsed?.version);
    return freshEmpty();
  }
  return parsed;
}

/**
 * Write the manifest via the vault adapter (pretty-printed JSON).
 */
export async function saveManifest(vault, manifest) {
  const payload = JSON.stringify(manifest, null, 2);
  await vault.write(MANIFEST_PATH, payload);
}

/**
 * Pure: returns a NEW manifest with `compiledEntryId` recorded/updated.
 * If an entry already exists, its current state is pushed onto `history`
 * (ring buffer, oldest dropped at HISTORY_CAP).
 */
export function recordCompilation(manifest, compileResult, compiledEntryId) {
  const base = manifest && typeof manifest === 'object' ? manifest : freshEmpty();
  const entries = { ...(base.entries || {}) };
  const prev = entries[compiledEntryId];

  const nowIso = new Date().toISOString();
  const sources = Array.isArray(compileResult?.sources)
    ? compileResult.sources.map((s) => ({
        id: s?.id ?? null,
        hash: s?.hash ?? null,
        ...(s?.title !== undefined ? { title: s.title } : {}),
        ...(s?.type !== undefined ? { type: s.type } : {}),
      }))
    : [];

  let history = [];
  let supersedes = null;
  if (prev) {
    const prevHistory = Array.isArray(prev.history) ? prev.history : [];
    const nextHistory = [
      ...prevHistory,
      {
        compiledHash: prev.compiledHash ?? null,
        sourceHash: prev.sourceHash ?? null,
        compiledAt: prev.compiledAt ?? null,
      },
    ];
    // ring: keep the most recent HISTORY_CAP entries, drop oldest
    history = nextHistory.slice(-HISTORY_CAP);
    supersedes = prev.compiledHash ?? null;
  }

  entries[compiledEntryId] = {
    compiler: compileResult?.compiler ?? null,
    sources,
    sourceHash: compileResult?.sourceHash ?? null,
    compiledHash: compileResult?.compiledHash ?? null,
    compiledAt: nowIso,
    supersedes,
    emitted: Boolean(compileResult?.emitted),
    history,
    ...(compileResult?.confidence !== undefined ? { confidence: compileResult.confidence } : {}),
  };

  return { version: 1, entries };
}

/**
 * Pure: scan the manifest against `currentEntries` (list of source entries)
 * and return any compiled records whose sources have drifted.
 *
 * @returns Array<{ compiledId, reason, staleSourceIds }>
 *   reason is one of: 'source-deleted' | 'source-changed' | 'source-list-mismatch'
 */
export function findStale(manifest, currentEntries) {
  const out = [];
  if (!manifest?.entries) return out;
  const byId = new Map();
  for (const e of Array.isArray(currentEntries) ? currentEntries : []) {
    if (e && e.id != null) byId.set(e.id, e);
  }

  for (const compiledId of Object.keys(manifest.entries)) {
    const rec = manifest.entries[compiledId];
    const recSources = Array.isArray(rec?.sources) ? rec.sources : [];
    const staleSourceIds = [];
    let reason = null;

    for (const src of recSources) {
      const srcId = src?.id;
      const oldHash = src?.hash;
      const current = byId.get(srcId);
      if (!current) {
        staleSourceIds.push(srcId);
        if (!reason) reason = 'source-deleted';
        continue;
      }
      const newHash = hashSourceEntry(current);
      if (newHash !== oldHash) {
        staleSourceIds.push(srcId);
        if (!reason) reason = 'source-changed';
      }
    }

    // Source-list-mismatch: count of recorded sources still present differs
    // from total recorded sources. Only surface if no per-source reason yet.
    const presentCount = recSources.filter((s) => byId.has(s?.id)).length;
    if (!reason && presentCount !== recSources.length) {
      reason = 'source-list-mismatch';
    }

    if (reason) {
      out.push({ compiledId, reason, staleSourceIds });
    }
  }
  return out;
}

/**
 * Pure: was this entry id produced by the compile pipeline?
 */
export function isCompiledEntry(manifest, entryId) {
  return Boolean(manifest?.entries?.[entryId]);
}
