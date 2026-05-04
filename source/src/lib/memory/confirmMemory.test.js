import { describe, it, expect } from 'vitest';
import { confirmMemory } from './confirmMemory.js';

const FIXED_NOW = '2026-05-04T12:00:00.000Z';
const fixedClock = () => FIXED_NOW;

describe('confirmMemory', () => {
  it('throws on non-memory entry types', () => {
    expect(() => confirmMemory({ id: 'a', type: 'note' })).toThrow('not a memory');
    expect(() => confirmMemory({ id: 'a', type: 'raw' })).toThrow('not a memory');
    expect(() => confirmMemory(null)).toThrow('not a memory');
  });

  it('sets review_status to "confirmed"', () => {
    const entry = { id: '1', type: 'wiki', confidence: 0.85, review_status: 'pending' };
    const { updatedEntry } = confirmMemory(entry, { now: fixedClock });
    expect(updatedEntry.review_status).toBe('confirmed');
  });

  it('sets valid_from to opts.now()', () => {
    const entry = { id: '1', type: 'wiki', confidence: 0.85 };
    const { updatedEntry } = confirmMemory(entry, { now: fixedClock });
    expect(updatedEntry.valid_from).toBe(FIXED_NOW);
  });

  it('bumps confidence to 0.7 on review entry below threshold', () => {
    const entry = { id: '1', type: 'review', confidence: 0.4 };
    const { updatedEntry, graduatedToWiki } = confirmMemory(entry, { now: fixedClock });
    expect(updatedEntry.confidence).toBe(0.7);
    expect(graduatedToWiki).toBe(true);
    expect(updatedEntry.type).toBe('wiki');
  });

  it('graduates type review -> wiki when bumped confidence reaches threshold', () => {
    const entry = { id: '1', type: 'review', confidence: 0.6 };
    const { updatedEntry, graduatedToWiki } = confirmMemory(entry, { now: fixedClock });
    expect(updatedEntry.type).toBe('wiki');
    expect(updatedEntry.confidence).toBe(0.7);
    expect(graduatedToWiki).toBe(true);
  });

  it('wiki entry already at high confidence — confirmed, no type change, confidence preserved', () => {
    const entry = { id: '1', type: 'wiki', confidence: 0.9 };
    const { updatedEntry, graduatedToWiki } = confirmMemory(entry, { now: fixedClock });
    expect(updatedEntry.type).toBe('wiki');
    expect(updatedEntry.confidence).toBe(0.9);
    expect(graduatedToWiki).toBe(false);
  });

  it('idempotent: confirming same entry twice with same now yields same output', () => {
    const entry = { id: '1', type: 'review', confidence: 0.5 };
    const first = confirmMemory(entry, { now: fixedClock });
    const second = confirmMemory(first.updatedEntry, { now: fixedClock });
    expect(second.updatedEntry).toEqual(first.updatedEntry);
    expect(second.graduatedToWiki).toBe(false); // already wiki on second pass
  });

  it('uses Date.now-derived timestamp when opts.now is absent', () => {
    const entry = { id: '1', type: 'wiki', confidence: 0.8 };
    const { updatedEntry } = confirmMemory(entry);
    expect(typeof updatedEntry.valid_from).toBe('string');
    expect(updatedEntry.valid_from).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('preserves all other entry fields verbatim', () => {
    const entry = {
      id: '1',
      type: 'wiki',
      confidence: 0.85,
      title: 'mem',
      notes: 'body',
      canonical_key: 'k',
      provenance: ['s1', 's2'],
    };
    const { updatedEntry } = confirmMemory(entry, { now: fixedClock });
    expect(updatedEntry.title).toBe('mem');
    expect(updatedEntry.notes).toBe('body');
    expect(updatedEntry.canonical_key).toBe('k');
    expect(updatedEntry.provenance).toEqual(['s1', 's2']);
  });
});
