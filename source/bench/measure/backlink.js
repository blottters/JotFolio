import { seed } from '../seed.js';

// Current implementation rebuilds the backlink index from scratch on each save.
// Measures that worst case. Future incremental rebuild = separate measurement.

function rebuildBacklinks(entries) {
  const index = new Map();
  const byId = new Map(entries.map(e => [e.id, e]));
  for (const e of entries) {
    // Re-parse wiki-links out of notes body
    const matches = (e.notes || '').matchAll(/\[\[([^\[\]\n]{1,120})\]\]/g);
    for (const m of matches) {
      const targetId = m[1].trim();
      if (!byId.has(targetId)) continue;
      if (!index.has(targetId)) index.set(targetId, new Set());
      index.get(targetId).add(e.id);
    }
  }
  return index;
}

function make(total) {
  const size = total === 1000 ? '1k' : '5k';
  return {
    id: `backlink-rebuild-${size}`,
    warmup: 2,
    iterations: 10,
    setup: () => {
      const { entries } = seed(total);
      return { entries };
    },
    fn: ({ entries }) => {
      rebuildBacklinks(entries);
    },
  };
}

export default [make(1000), make(5000)];
