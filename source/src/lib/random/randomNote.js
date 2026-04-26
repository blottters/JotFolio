// Random Note picker. Surfaces a random entry from the vault, optionally
// constrained by type (e.g. only "note") and recency (skip entries opened
// in the last N days). Mirrors the Random Note Obsidian core plugin.

export function pickRandomEntry(entries, opts = {}) {
  const list = Array.isArray(entries) ? entries : [];
  if (!list.length) return null;
  const {
    types = null,             // string[] | null — restrict to these types
    excludeIds = [],          // string[] — never pick these
    excludeRecent = null,     // { days, lastOpenedById } — skip entries opened within N days
    rng = Math.random,        // injectable for tests
  } = opts;
  const exclude = new Set(excludeIds);
  const cutoff = excludeRecent?.days ? Date.now() - excludeRecent.days * 86400000 : null;
  const lastOpened = excludeRecent?.lastOpenedById || {};

  const candidates = list.filter(e => {
    if (!e || !e.id) return false;
    if (exclude.has(e.id)) return false;
    if (types && Array.isArray(types) && !types.includes(e.type)) return false;
    if (cutoff != null) {
      const t = lastOpened[e.id];
      if (typeof t === 'number' && t >= cutoff) return false;
    }
    return true;
  });
  if (!candidates.length) return null;
  const idx = Math.floor(rng() * candidates.length);
  return candidates[idx] || null;
}
