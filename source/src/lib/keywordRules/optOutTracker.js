// Per-entry opt-out tracker for the Keyword Library.
//
// When the user removes an auto-applied tag or wikilink from an entry, that
// removal must persist — the next save (or re-scan) shouldn't re-add it.
// Per gating decision D7, opt-outs live in a separate vault file
// (`_jotfolio/keyword-opt-outs.yaml`) rather than entry frontmatter, so the
// user's plain markdown stays clean.
//
// File shape on disk (locked):
//
//   entry-id-12345:
//     - ai
//     - frontend
//   entry-id-67890:
//     - stoic
//
// In-memory shape mirrors the YAML: `{ [entryId: string]: string[] }`.
//
// Pure functions (`addOptOut`, `removeOptOut`, `getOptOutsForEntry`) never
// mutate inputs — every call returns a fresh object. I/O lives only in the
// async `loadOptOuts` / `saveOptOuts` helpers that wrap the vault adapter.

import yaml from 'js-yaml';

export const OPT_OUTS_PATH = '_jotfolio/keyword-opt-outs.yaml';
const OPT_OUTS_DIR = '_jotfolio';

/**
 * Read the opt-outs YAML file from the vault. Missing file is not an
 * error — returns `{}`. Corrupt YAML returns `{ error }` so the caller can
 * surface the issue without crashing the save pipeline.
 *
 * @param {{ read: (path:string) => Promise<string> }} vaultAdapter
 * @returns {Promise<{ [entryId: string]: string[] } | { error: string }>}
 */
export async function loadOptOuts(vaultAdapter) {
  if (!vaultAdapter || typeof vaultAdapter.read !== 'function') {
    return {};
  }
  let raw;
  try {
    raw = await vaultAdapter.read(OPT_OUTS_PATH);
  } catch (err) {
    // Missing file is fine — first run has no opt-outs yet.
    if (err && err.code === 'not-found') return {};
    // Real I/O error (permission, disk, parse). Propagate so the caller
    // doesn't silently overwrite real data on next save.
    return { error: err && err.message ? err.message : String(err) };
  }
  if (typeof raw !== 'string' || raw.trim() === '') {
    return {};
  }
  let parsed;
  try {
    parsed = yaml.load(raw);
  } catch (e) {
    return { error: e && e.message ? e.message : 'Failed to parse opt-outs YAML' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }
  const out = {};
  for (const entryId of Object.keys(parsed)) {
    const value = parsed[entryId];
    if (Array.isArray(value)) {
      out[entryId] = value.filter(v => typeof v === 'string');
    }
  }
  return out;
}

/**
 * Persist the opt-outs map to the vault as YAML. Creates the parent
 * `_jotfolio/` directory if missing. Returns `{ ok: true }` on success or
 * `{ error }` on any I/O failure.
 *
 * @param {{ write: (path:string, content:string) => Promise<void>, mkdir: (path:string) => Promise<void> }} vaultAdapter
 * @param {{ [entryId: string]: string[] }} optOuts
 * @returns {Promise<{ ok: true } | { error: string }>}
 */
export async function saveOptOuts(vaultAdapter, optOuts) {
  if (!vaultAdapter || typeof vaultAdapter.write !== 'function') {
    return { error: 'No vault adapter available' };
  }
  const safe = optOuts && typeof optOuts === 'object' && !Array.isArray(optOuts)
    ? optOuts
    : {};
  let serialized;
  try {
    serialized = yaml.dump(safe, { noRefs: true, indent: 2 });
  } catch (e) {
    return { error: e && e.message ? e.message : 'Failed to serialize opt-outs' };
  }
  if (typeof vaultAdapter.mkdir === 'function') {
    try {
      await vaultAdapter.mkdir(OPT_OUTS_DIR);
    } catch {
      // mkdir failures are non-fatal — the write below will surface a real
      // error if the directory truly cannot be created.
    }
  }
  try {
    await vaultAdapter.write(OPT_OUTS_PATH, serialized);
  } catch (e) {
    return { error: e && e.message ? e.message : 'Failed to write opt-outs' };
  }
  return { ok: true };
}

/**
 * Record that the user has opted out of `tagOrLink` on `entryId`. Pure —
 * returns a new top-level object with the updated entry array. Adding the
 * same opt-out twice is a no-op (no duplicates).
 *
 * @param {{ [entryId: string]: string[] }} optOuts
 * @param {string} entryId
 * @param {string} tagOrLink
 * @returns {{ [entryId: string]: string[] }}
 */
export function addOptOut(optOuts, entryId, tagOrLink) {
  const base = optOuts && typeof optOuts === 'object' && !Array.isArray(optOuts)
    ? optOuts
    : {};
  if (!entryId || typeof tagOrLink !== 'string') {
    return { ...base };
  }
  const current = Array.isArray(base[entryId]) ? base[entryId] : [];
  if (current.includes(tagOrLink)) {
    // Clone for reference equality — caller can rely on a new object on
    // every call, even when nothing changed semantically.
    return { ...base, [entryId]: current.slice() };
  }
  return { ...base, [entryId]: [...current, tagOrLink] };
}

/**
 * Reverse a previous opt-out (un-opt-out). Pure and idempotent — removing
 * a tag that isn't opted-out, or operating on an unknown entry, returns a
 * fresh clone of the input with no semantic change.
 *
 * @param {{ [entryId: string]: string[] }} optOuts
 * @param {string} entryId
 * @param {string} tagOrLink
 * @returns {{ [entryId: string]: string[] }}
 */
export function removeOptOut(optOuts, entryId, tagOrLink) {
  const base = optOuts && typeof optOuts === 'object' && !Array.isArray(optOuts)
    ? optOuts
    : {};
  if (!entryId || typeof tagOrLink !== 'string') {
    return { ...base };
  }
  if (!Array.isArray(base[entryId])) {
    return { ...base };
  }
  const filtered = base[entryId].filter(t => t !== tagOrLink);
  return { ...base, [entryId]: filtered };
}

/**
 * Look up the opt-out list for one entry. Pure. Missing entry → `[]`.
 *
 * @param {{ [entryId: string]: string[] }} optOuts
 * @param {string} entryId
 * @returns {string[]}
 */
export function getOptOutsForEntry(optOuts, entryId) {
  if (!optOuts || typeof optOuts !== 'object' || Array.isArray(optOuts)) {
    return [];
  }
  const value = optOuts[entryId];
  return Array.isArray(value) ? value.slice() : [];
}
