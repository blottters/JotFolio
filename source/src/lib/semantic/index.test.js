import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock embed.js so we don't load real ONNX. Return deterministic vectors based
// on text content so we can reason about similarity in tests.
vi.mock('./embed.js', () => {
  const embedText = vi.fn(async (text) => {
    if (!text || !String(text).trim()) return null;
    const vec = new Float32Array(384);
    // Deterministic small vector keyed off length and char codes
    for (let i = 0; i < 384; i++) {
      vec[i] = ((text.charCodeAt(i % text.length) || 0) % 17) / 17;
    }
    // Normalize for cosine sim
    let mag = 0;
    for (let i = 0; i < vec.length; i++) mag += vec[i] * vec[i];
    mag = Math.sqrt(mag) || 1;
    for (let i = 0; i < vec.length; i++) vec[i] /= mag;
    return vec;
  });
  return { embedText, _resetModelForTests: () => {} };
});

import { buildSemanticIndex, reembedEntry, getSimilarEntries, _internals } from './index.js';

describe('semantic/index', () => {
  beforeEach(() => {
    // No-op; vault adapter is optional and we don't pass one in basic tests
  });

  it('returns empty Map for empty entries list', async () => {
    const idx = await buildSemanticIndex([]);
    expect(idx).toBeInstanceOf(Map);
    expect(idx.size).toBe(0);
  });

  it('builds an index, skipping near-empty entries', async () => {
    const entries = [
      { id: 'a', title: 'Hello world', notes: 'this is a body about widgets' },
      { id: 'b', title: 'Another note', notes: 'something different here entirely' },
      { id: 'empty', title: '', notes: '   ' },
    ];
    const idx = await buildSemanticIndex(entries);
    expect(idx.has('a')).toBe(true);
    expect(idx.has('b')).toBe(true);
    expect(idx.has('empty')).toBe(false);
  });

  it('reembedEntry adds and updates an existing index', async () => {
    const idx = new Map();
    const vec = await reembedEntry(idx, { id: 'x', title: 'hello there', notes: 'body that is long enough' });
    expect(vec).toBeInstanceOf(Float32Array);
    expect(idx.get('x')).toBe(vec);
  });

  it('getSimilarEntries returns [] when target not in index', () => {
    const idx = new Map();
    expect(getSimilarEntries(idx, 'missing')).toEqual([]);
  });

  it('exposes _internals with cache constants', () => {
    expect(_internals.CACHE_VERSION).toBeGreaterThan(0);
    expect(typeof _internals.CACHE_PATH).toBe('string');
  });
});
