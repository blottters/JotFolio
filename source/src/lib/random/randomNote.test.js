import { describe, it, expect } from 'vitest';
import { pickRandomEntry } from './randomNote.js';

const fix = [
  { id: 'a', type: 'note', title: 'A' },
  { id: 'b', type: 'note', title: 'B' },
  { id: 'c', type: 'video', title: 'C' },
  { id: 'd', type: 'article', title: 'D' },
];

describe('pickRandomEntry', () => {
  it('returns null on empty', () => {
    expect(pickRandomEntry([])).toBe(null);
    expect(pickRandomEntry(null)).toBe(null);
  });

  it('returns a real entry', () => {
    const result = pickRandomEntry(fix, { rng: () => 0 });
    expect(result.id).toBe('a');
  });

  it('rng = 0.99 picks last candidate', () => {
    const result = pickRandomEntry(fix, { rng: () => 0.99 });
    expect(result.id).toBe('d');
  });

  it('respects type filter', () => {
    const result = pickRandomEntry(fix, { types: ['video'], rng: () => 0 });
    expect(result.type).toBe('video');
  });

  it('returns null when type filter excludes everything', () => {
    expect(pickRandomEntry(fix, { types: ['journal'] })).toBe(null);
  });

  it('respects excludeIds', () => {
    const result = pickRandomEntry(fix, { excludeIds: ['a', 'b', 'c'], rng: () => 0 });
    expect(result.id).toBe('d');
  });

  it('respects excludeRecent: filters out entries opened within N days', () => {
    const now = Date.now();
    const yesterday = now - 86400000;
    const result = pickRandomEntry(fix, {
      excludeRecent: { days: 7, lastOpenedById: { a: yesterday, b: yesterday, c: yesterday } },
      rng: () => 0,
    });
    expect(result.id).toBe('d');
  });

  it('excludeRecent ignored when entry has no lastOpened entry', () => {
    const result = pickRandomEntry(fix, {
      excludeRecent: { days: 7, lastOpenedById: {} },
      rng: () => 0,
    });
    expect(result.id).toBe('a');
  });

  it('combines type filter + excludeIds correctly', () => {
    const result = pickRandomEntry(fix, {
      types: ['note'],
      excludeIds: ['a'],
      rng: () => 0,
    });
    expect(result.id).toBe('b');
  });

  it('skips entries without id', () => {
    const dirty = [{ id: '', type: 'note' }, ...fix];
    const result = pickRandomEntry(dirty, { rng: () => 0 });
    expect(result.id).toBe('a');
  });
});
