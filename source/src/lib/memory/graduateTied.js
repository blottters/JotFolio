/**
 * graduateTied — pure helper that finds review memory entries newly eligible
 * for promotion after a memory has been confirmed.
 *
 * Karpathy Phase 5 §Graduate-tied-memories. Models the "unlock" concept as
 * confidence propagation + promotion eligibility (NOT as achievement gating).
 *
 * "Tied" review entries are review-typed entries that are linked to the
 * confirmed memory by ANY of:
 *   1. Their `supersedes` array contains `confirmedMemory.id`.
 *   2. They share the same `canonical_key` as `confirmedMemory`
 *      (case-insensitive, trimmed).
 *   3. Their `provenance` array contains `confirmedMemory.id` (downstream
 *      compile-derived entries cite their source provenance).
 *
 * Confidence boost rule (locked, see spec §"Confidence propagation rule"):
 *   bonus = min(0.15, 0.05 * <count of confirmed sources>)
 *
 * "Confirmed source count" is determined by inspecting each tied entry's
 * `provenance` (or `supersedes` as fallback) ids and asking, for each id,
 * whether the corresponding entry in `vault` has `review_status === 'confirmed'`
 * (or for wiki entries, simply `type === 'wiki'` since wikis are by
 * definition trusted). This keeps the rule deterministic without needing
 * to consult the manifest for every check.
 *
 * Eligibility: a tied entry is eligible if `entry.confidence + bonus >= 0.7`
 * AND the entry has no blocking warnings. Blocking warnings are detected
 * heuristically: `entry.warnings` contains an item with
 * `code === 'canonical-collision-handauthored'` (matches Phase 4 BLOCKING_CODES).
 *
 * Inputs:
 *   - `confirmedMemory`: the just-confirmed memory entry.
 *   - `vault`: array of all entries OR `{ entries }` shape. Either accepted.
 *   - `manifest`: Phase 4 manifest. Currently unused for the bonus
 *     calculation (vault is sufficient) but accepted for forward-compat
 *     and so callers don't restructure when this lib gains manifest-aware
 *     branches later.
 *
 * Returns: `{ tied, eligible }` arrays of full entry objects. Pure — does
 * NOT mutate or persist anything. Caller decides what to surface and what
 * to confirm.
 *
 * @param {object} confirmedMemory
 * @param {Array|object} vault
 * @param {object} [manifest]  Reserved.
 * @returns {{ tied: object[], eligible: object[] }}
 */
export function graduateTied(confirmedMemory, vault, manifest) {
  if (!confirmedMemory || typeof confirmedMemory !== 'object') {
    return { tied: [], eligible: [] };
  }

  const entries = Array.isArray(vault)
    ? vault
    : Array.isArray(vault?.entries)
      ? vault.entries
      : [];

  if (entries.length === 0) {
    return { tied: [], eligible: [] };
  }

  const byId = new Map();
  for (const e of entries) {
    if (e && e.id != null) byId.set(e.id, e);
  }

  const confirmedKey = normalizeKey(confirmedMemory.canonical_key);

  const tied = [];
  for (const e of entries) {
    if (!e || e.type !== 'review') continue;
    if (e.id === confirmedMemory.id) continue;

    const supersedesIds = Array.isArray(e.supersedes) ? e.supersedes : [];
    const provenanceIds = Array.isArray(e.provenance) ? e.provenance : [];
    const eKey = normalizeKey(e.canonical_key);

    const tiedBySupersedes = supersedesIds.includes(confirmedMemory.id);
    const tiedByCanonical = !!confirmedKey && eKey === confirmedKey;
    const tiedByProvenance = provenanceIds.includes(confirmedMemory.id);

    if (tiedBySupersedes || tiedByCanonical || tiedByProvenance) {
      tied.push(e);
    }
  }

  const eligible = [];
  for (const tiedEntry of tied) {
    const sourceIds = collectSourceIds(tiedEntry);
    let confirmedCount = 0;
    for (const id of sourceIds) {
      const src = byId.get(id);
      if (!src) continue;
      if (src.review_status === 'confirmed' || src.type === 'wiki') {
        confirmedCount += 1;
      }
    }

    const bonus = Math.min(0.15, 0.05 * confirmedCount);
    const baseConfidence = typeof tiedEntry.confidence === 'number' ? tiedEntry.confidence : 0;
    const recomputed = baseConfidence + bonus;

    if (recomputed < 0.7) continue;
    if (hasBlockingWarning(tiedEntry)) continue;

    eligible.push(tiedEntry);
  }

  return { tied, eligible };
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function collectSourceIds(entry) {
  const ids = new Set();
  for (const key of ['provenance', 'supersedes']) {
    const arr = entry[key];
    if (Array.isArray(arr)) {
      for (const id of arr) {
        if (id != null) ids.add(id);
      }
    }
  }
  return ids;
}

function hasBlockingWarning(entry) {
  const warnings = Array.isArray(entry.warnings) ? entry.warnings : [];
  for (const w of warnings) {
    if (w && w.code === 'canonical-collision-handauthored') return true;
  }
  return false;
}
