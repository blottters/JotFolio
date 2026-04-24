// Constellation component-grouping (BFS) — finding #4.
//
// The grouping logic belongs to `ConstellationView.jsx` inline, but the
// algorithm is pure and testable. We re-implement the same shape here so
// the test asserts the expected result against hand-constructed pools.
// Full-component testing (JSDOM + RAF) is out of scope — this covers
// correctness of adjacency-building + BFS.

import { describe, it, expect } from 'vitest';

function computeComponents(pool) {
  const poolById = Object.create(null);
  pool.forEach(e => { poolById[e.id] = e; });
  const adj = Object.create(null);
  for (const n of pool) {
    if (!adj[n.id]) adj[n.id] = new Set();
    (n.links || []).forEach(t => {
      if (!poolById[t]) return;
      adj[n.id].add(t);
      if (!adj[t]) adj[t] = new Set();
      adj[t].add(n.id);
    });
  }
  const visited = new Set();
  const comps = [];
  for (const seed of pool) {
    if (visited.has(seed.id)) continue;
    const group = [];
    const stack = [seed.id];
    while (stack.length) {
      const id = stack.pop();
      if (visited.has(id)) continue;
      visited.add(id);
      const n = poolById[id];
      if (!n) continue;
      group.push(n);
      (adj[id] || []).forEach(l => { if (poolById[l] && !visited.has(l)) stack.push(l); });
    }
    comps.push(group);
  }
  return comps.sort((a, b) => b.length - a.length);
}

describe('constellation component grouping (finding #4)', () => {
  it('treats wiki-links as undirected — A→B and B→A produce one cluster either way', () => {
    // Only A links to B. Before fix: two separate components.
    const pool = [
      { id: 'A', title: 'A', links: ['B'] },
      { id: 'B', title: 'B', links: [] },
      { id: 'C', title: 'C', links: [] },
    ];
    const comps = computeComponents(pool);
    expect(comps).toHaveLength(2);
    const ab = comps.find(c => c.some(n => n.id === 'A'));
    expect(ab.map(n => n.id).sort()).toEqual(['A', 'B']);
  });

  it('chains through undirected adjacency across 3+ nodes', () => {
    const pool = [
      { id: 'A', title: 'A', links: ['B'] },
      { id: 'B', title: 'B', links: [] },
      { id: 'C', title: 'C', links: ['B'] },
      { id: 'D', title: 'D', links: [] }, // isolated
    ];
    const comps = computeComponents(pool);
    expect(comps[0].map(n => n.id).sort()).toEqual(['A', 'B', 'C']);
    expect(comps[1].map(n => n.id)).toEqual(['D']);
  });

  it('ignores links to missing ids (dangling refs)', () => {
    const pool = [
      { id: 'A', title: 'A', links: ['GHOST'] },
      { id: 'B', title: 'B', links: [] },
    ];
    const comps = computeComponents(pool);
    // GHOST doesn't exist in pool → A stays isolated
    expect(comps).toHaveLength(2);
    expect(comps.every(c => c.length === 1)).toBe(true);
  });
});
