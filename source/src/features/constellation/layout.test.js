import { describe, it, expect } from 'vitest';
import { computeAffinityLayout, computeClusterLayout, computeMessyLayout } from './layout.js';

const mkEntry = (id, extra = {}) => ({ id, type: 'note', tags: [], links: [], status: 'open', date: '2026-01-01', ...extra });

describe('computeAffinityLayout', () => {
  it('returns empty object for empty pool', () => {
    expect(computeAffinityLayout([])).toEqual({});
  });

  it('returns finite x,y coords for every entry', () => {
    const pool = [mkEntry('a'), mkEntry('b', { tags: ['x'] }), mkEntry('c', { links: ['a'] })];
    const out = computeAffinityLayout(pool);
    for (const id of ['a', 'b', 'c']) {
      expect(out[id]).toBeDefined();
      expect(Number.isFinite(out[id].x)).toBe(true);
      expect(Number.isFinite(out[id].y)).toBe(true);
    }
  });
});

describe('computeClusterLayout', () => {
  it('returns one node per input across components', () => {
    const components = [[mkEntry('a'), mkEntry('b', { links: ['a'] })], [mkEntry('c')]];
    const out = computeClusterLayout(components);
    expect(out).toHaveLength(3);
    expect(out.every(n => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
  });

  it('handles single-node component (singleton fast path)', () => {
    const out = computeClusterLayout([[mkEntry('solo')]]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('solo');
    expect(out[0].depth).toBe(0);
  });
});

describe('computeMessyLayout', () => {
  it('returns one node per pool entry with positions', () => {
    const pool = [mkEntry('a'), mkEntry('b'), mkEntry('c')];
    const out = computeMessyLayout(pool, [pool]);
    expect(out).toHaveLength(3);
    expect(out.every(n => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
  });

  it('handles single-entry pool (no divide-by-zero)', () => {
    const out = computeMessyLayout([mkEntry('only')], [[mkEntry('only')]]);
    expect(out).toHaveLength(1);
    expect(Number.isFinite(out[0].x)).toBe(true);
  });
});
