import { describe, it, expect } from 'vitest';
import { applyBase, evalFilter, evalSort, getPropertyKeys } from './queryBase.js';

const ENTRIES = [
  { id: '1', title: 'Alpha',   type: 'note',    status: 'active',  tags: ['ai','ml'],   priority: 3, _path: 'a.md' },
  { id: '2', title: 'Bravo',   type: 'video',   status: 'watched', tags: ['ml'],        priority: 1, _path: 'b.md' },
  { id: '3', title: 'Charlie', type: 'note',    status: 'draft',   tags: ['design'],    priority: 5, _path: 'c.md' },
  { id: '4', title: 'Delta',   type: 'article', status: 'reading', tags: ['ai'],        _path: 'd.md' },
  { id: '5', title: 'Echo',    type: 'note',    status: 'active',                       priority: 2, _path: 'e.md' },
];

describe('evalFilter', () => {
  it('equals matches scalar values strictly', () => {
    expect(evalFilter(ENTRIES[0], { key: 'status', op: 'equals', value: 'active' })).toBe(true);
    expect(evalFilter(ENTRIES[0], { key: 'status', op: 'equals', value: 'draft' })).toBe(false);
  });

  it('equals on an array key checks membership', () => {
    expect(evalFilter(ENTRIES[0], { key: 'tags', op: 'equals', value: 'ai' })).toBe(true);
    expect(evalFilter(ENTRIES[0], { key: 'tags', op: 'equals', value: 'gone' })).toBe(false);
  });

  it('contains is case-insensitive substring match', () => {
    expect(evalFilter(ENTRIES[0], { key: 'title', op: 'contains', value: 'lph' })).toBe(true);
    expect(evalFilter(ENTRIES[0], { key: 'title', op: 'contains', value: 'ALPHA' })).toBe(true);
    expect(evalFilter(ENTRIES[0], { key: 'title', op: 'contains', value: 'omega' })).toBe(false);
  });

  it('exists tests presence regardless of value', () => {
    expect(evalFilter(ENTRIES[0], { key: 'priority', op: 'exists' })).toBe(true);
    expect(evalFilter(ENTRIES[3], { key: 'priority', op: 'exists' })).toBe(false);
  });

  it('greater compares numerically when possible', () => {
    expect(evalFilter(ENTRIES[2], { key: 'priority', op: 'greater', value: 2 })).toBe(true);
    expect(evalFilter(ENTRIES[1], { key: 'priority', op: 'greater', value: 5 })).toBe(false);
  });

  it('less compares numerically when possible', () => {
    expect(evalFilter(ENTRIES[1], { key: 'priority', op: 'less', value: 2 })).toBe(true);
    expect(evalFilter(ENTRIES[2], { key: 'priority', op: 'less', value: 2 })).toBe(false);
  });

  it('in checks comma-separated membership against scalar OR array values', () => {
    expect(evalFilter(ENTRIES[0], { key: 'status', op: 'in', value: 'active,draft' })).toBe(true);
    expect(evalFilter(ENTRIES[1], { key: 'status', op: 'in', value: 'active,draft' })).toBe(false);
    expect(evalFilter(ENTRIES[0], { key: 'tags',   op: 'in', value: 'ai,design' })).toBe(true);
    expect(evalFilter(ENTRIES[2], { key: 'tags',   op: 'in', value: ['design','engineering'] })).toBe(true);
  });

  it('returns false for filters on missing keys (except exists which returns false)', () => {
    expect(evalFilter(ENTRIES[3], { key: 'priority', op: 'equals',   value: 1 })).toBe(false);
    expect(evalFilter(ENTRIES[3], { key: 'priority', op: 'contains', value: '1' })).toBe(false);
    expect(evalFilter(ENTRIES[3], { key: 'priority', op: 'exists' })).toBe(false);
  });
});

describe('evalSort', () => {
  it('single-key asc orders ascending', () => {
    const sorted = ENTRIES.slice().sort((a, b) => evalSort(a, b, [{ key: 'title', dir: 'asc' }]));
    expect(sorted.map(e => e.title)).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']);
  });

  it('single-key desc reverses', () => {
    const sorted = ENTRIES.slice().sort((a, b) => evalSort(a, b, [{ key: 'title', dir: 'desc' }]));
    expect(sorted.map(e => e.title)).toEqual(['Echo', 'Delta', 'Charlie', 'Bravo', 'Alpha']);
  });

  it('multi-key sorts: type asc, then priority desc', () => {
    const sorted = ENTRIES.slice().sort((a, b) =>
      evalSort(a, b, [{ key: 'type', dir: 'asc' }, { key: 'priority', dir: 'desc' }])
    );
    // type alpha order: article, note, note, note, video
    // within note bucket: priority 5,3,2  (Charlie, Alpha, Echo)
    expect(sorted.map(e => e.title)).toEqual(['Delta', 'Charlie', 'Alpha', 'Echo', 'Bravo']);
  });

  it('missing values sort to the end on ascending order', () => {
    const sorted = ENTRIES.slice().sort((a, b) => evalSort(a, b, [{ key: 'priority', dir: 'asc' }]));
    expect(sorted[sorted.length - 1].id).toBe('4'); // Delta has no priority
  });

  it('empty sort list is a no-op (stable)', () => {
    expect(evalSort(ENTRIES[0], ENTRIES[1], [])).toBe(0);
    expect(evalSort(ENTRIES[0], ENTRIES[1], null)).toBe(0);
  });
});

describe('applyBase', () => {
  it('returns all entries when no filters or sorts are configured', () => {
    expect(applyBase(ENTRIES, {}).map(e => e.id)).toEqual(['1','2','3','4','5']);
  });

  it('AND-combines multiple filters', () => {
    const base = {
      filters: [
        { key: 'type',   op: 'equals', value: 'note' },
        { key: 'status', op: 'equals', value: 'active' },
      ],
    };
    expect(applyBase(ENTRIES, base).map(e => e.id)).toEqual(['1', '5']);
  });

  it('combines filter + sort: notes only, sorted by priority desc', () => {
    const base = {
      filters: [{ key: 'type', op: 'equals', value: 'note' }],
      sorts:   [{ key: 'priority', dir: 'desc' }],
    };
    expect(applyBase(ENTRIES, base).map(e => e.title)).toEqual(['Charlie', 'Alpha', 'Echo']);
  });

  it('handles empty entry list and null base safely', () => {
    expect(applyBase([], { filters: [{ key: 'x', op: 'equals', value: 1 }] })).toEqual([]);
    expect(applyBase(ENTRIES, null).length).toBe(ENTRIES.length);
    expect(applyBase(null, null)).toEqual([]);
  });
});

describe('getPropertyKeys', () => {
  it('returns the alphabetized union of frontmatter keys, dedup', () => {
    const keys = getPropertyKeys(ENTRIES);
    // common keys across the fixture (sorted): priority, status, tags, title, type
    expect(keys).toContain('priority');
    expect(keys).toContain('status');
    expect(keys).toContain('tags');
    expect(keys).toContain('title');
    expect(keys).toContain('type');
    const sorted = [...keys].sort((a, b) => a.localeCompare(b));
    expect(keys).toEqual(sorted);
  });

  it('excludes system + underscore-prefixed keys', () => {
    const keys = getPropertyKeys(ENTRIES);
    expect(keys).not.toContain('_path');
    expect(keys).not.toContain('id');
  });

  it('returns [] for empty/non-array input', () => {
    expect(getPropertyKeys([])).toEqual([]);
    expect(getPropertyKeys(null)).toEqual([]);
    expect(getPropertyKeys(undefined)).toEqual([]);
  });
});
