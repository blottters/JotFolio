import { describe, it, expect } from 'vitest';
import { cosineSimilarity, findTopK } from './similarity.js';

function vec(values) {
  const arr = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) arr[i] = values[i];
  return arr;
}

describe('cosineSimilarity', () => {
  it('returns 1 for identical unit vectors', () => {
    const a = vec([1, 0, 0]);
    expect(cosineSimilarity(a, a)).toBe(1);
  });
  it('returns 0 for orthogonal unit vectors', () => {
    expect(cosineSimilarity(vec([1, 0, 0]), vec([0, 1, 0]))).toBe(0);
  });
  it('returns 0 for null inputs', () => {
    expect(cosineSimilarity(null, vec([1]))).toBe(0);
    expect(cosineSimilarity(vec([1]), null)).toBe(0);
  });
  it('handles mismatched lengths by using the shorter overlap', () => {
    expect(cosineSimilarity(vec([1, 1]), vec([1, 0, 0]))).toBe(1);
  });
});

describe('findTopK', () => {
  const target = vec([1, 0, 0]);
  const candidates = new Map([
    ['a', vec([1, 0, 0])],   // identical
    ['b', vec([0.9, 0.1, 0])],
    ['c', vec([0, 1, 0])],   // orthogonal
    ['d', vec([0.5, 0.5, 0])],
  ]);
  it('sorts results descending by score', () => {
    const top = findTopK(target, candidates, 5);
    expect(top.map(r => r.id)).toEqual(['a', 'b', 'd', 'c']);
  });
  it('respects k', () => {
    expect(findTopK(target, candidates, 2).map(r => r.id)).toEqual(['a', 'b']);
  });
  it('excludes the target id when requested', () => {
    expect(findTopK(target, candidates, 5, { excludeId: 'a' }).map(r => r.id))
      .toEqual(['b', 'd', 'c']);
  });
  it('drops scores below minScore', () => {
    const top = findTopK(target, candidates, 5, { minScore: 0.8 });
    expect(top.map(r => r.id)).toEqual(['a', 'b']);
  });
  it('returns empty for null inputs', () => {
    expect(findTopK(null, candidates)).toEqual([]);
    expect(findTopK(target, null)).toEqual([]);
  });
});
