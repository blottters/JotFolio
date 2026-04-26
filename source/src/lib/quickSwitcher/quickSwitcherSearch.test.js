import { describe, it, expect } from 'vitest';
import { rankNotes, findExactMatch } from './quickSwitcherSearch.js';

// Fixture builder — keeps per-test setup small and obvious.
function entry(id, title, opts = {}) {
  return {
    id,
    title,
    date: opts.date,
    aliases: opts.aliases,
  };
}

const newest = '2026-04-25T10:00:00Z';
const middle = '2026-04-20T10:00:00Z';
const oldest = '2026-04-10T10:00:00Z';

describe('rankNotes — empty query', () => {
  it('returns all entries sorted newest-first by date', () => {
    const entries = [
      entry('a', 'Alpha', { date: oldest }),
      entry('b', 'Beta',  { date: newest }),
      entry('c', 'Gamma', { date: middle }),
    ];
    const result = rankNotes(entries, '');
    expect(result.map(e => e.id)).toEqual(['b', 'c', 'a']);
  });

  it('handles whitespace-only query as empty', () => {
    const entries = [
      entry('a', 'Alpha', { date: oldest }),
      entry('b', 'Beta',  { date: newest }),
    ];
    const result = rankNotes(entries, '   ');
    expect(result.map(e => e.id)).toEqual(['b', 'a']);
  });
});

describe('rankNotes — ranking', () => {
  it('exact title match outranks startsWith', () => {
    const entries = [
      entry('start',  'Compose deck'),
      entry('exact',  'Compose'),
    ];
    const result = rankNotes(entries, 'compose');
    expect(result[0].id).toBe('exact');
    expect(result[1].id).toBe('start');
  });

  it('alias exact match outranks substring on title', () => {
    const entries = [
      entry('sub',   'My Compose Notes'),                          // substring 500
      entry('alias', 'Project Octopus', { aliases: ['compose'] }), // alias exact 900
    ];
    const result = rankNotes(entries, 'compose');
    expect(result[0].id).toBe('alias');
    expect(result[1].id).toBe('sub');
  });

  it('subsequence match catches typos like "cmplr" -> "Compiler Notes"', () => {
    const entries = [
      entry('a', 'Compiler Notes'),
      entry('b', 'Random Page'),
    ];
    const result = rankNotes(entries, 'cmplr');
    expect(result.map(e => e.id)).toEqual(['a']);
  });

  it('is case-insensitive across the board', () => {
    const entries = [
      entry('a', 'Compiler', { aliases: ['CMPL'] }),
      entry('b', 'compose'),
    ];
    const r1 = rankNotes(entries, 'COMPILER');
    expect(r1[0].id).toBe('a');
    const r2 = rankNotes(entries, 'cmpl');
    expect(r2[0].id).toBe('a'); // alias exact match wins
    const r3 = rankNotes(entries, 'COMPOSE');
    expect(r3[0].id).toBe('b');
  });

  it('returns empty array when nothing matches a non-empty query', () => {
    const entries = [
      entry('a', 'Alpha'),
      entry('b', 'Beta'),
    ];
    const result = rankNotes(entries, 'zzzzzz');
    expect(result).toEqual([]);
  });

  it('does not crash on entry without title', () => {
    const entries = [
      { id: 'naked' },
      entry('b', 'Beta'),
    ];
    expect(() => rankNotes(entries, 'beta')).not.toThrow();
    const result = rankNotes(entries, 'beta');
    expect(result.map(e => e.id)).toEqual(['b']);
  });

  it('does not crash on entry without aliases', () => {
    const entries = [
      entry('a', 'Alpha'),
    ];
    expect(() => rankNotes(entries, 'alpha')).not.toThrow();
    expect(rankNotes(entries, 'alpha').map(e => e.id)).toEqual(['a']);
  });

  it('handles non-array input by returning []', () => {
    expect(rankNotes(null, 'q')).toEqual([]);
    expect(rankNotes(undefined, 'q')).toEqual([]);
  });
});

describe('findExactMatch', () => {
  it('positive on title (case-insensitive)', () => {
    const entries = [entry('a', 'Project Plan'), entry('b', 'Other')];
    const hit = findExactMatch(entries, 'project plan');
    expect(hit?.id).toBe('a');
  });

  it('positive on alias', () => {
    const entries = [
      entry('a', 'Project Plan', { aliases: ['Roadmap'] }),
      entry('b', 'Other'),
    ];
    const hit = findExactMatch(entries, 'roadmap');
    expect(hit?.id).toBe('a');
  });

  it('case-insensitive across title and alias', () => {
    const entries = [entry('a', 'Project Plan', { aliases: ['Roadmap'] })];
    expect(findExactMatch(entries, 'PROJECT PLAN')?.id).toBe('a');
    expect(findExactMatch(entries, 'ROADMAP')?.id).toBe('a');
  });

  it('returns null on no match', () => {
    const entries = [entry('a', 'Project Plan')];
    expect(findExactMatch(entries, 'nothing here')).toBeNull();
  });

  it('returns null on empty query', () => {
    const entries = [entry('a', 'Project Plan')];
    expect(findExactMatch(entries, '')).toBeNull();
    expect(findExactMatch(entries, '   ')).toBeNull();
  });

  it('does not crash on missing fields', () => {
    const entries = [{ id: 'naked' }, entry('a', 'Alpha')];
    expect(() => findExactMatch(entries, 'alpha')).not.toThrow();
    expect(findExactMatch(entries, 'alpha')?.id).toBe('a');
  });
});
