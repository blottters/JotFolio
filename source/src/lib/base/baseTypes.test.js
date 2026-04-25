import { describe, it, expect } from 'vitest';
import {
  createEmptyBase,
  normalizeBase,
  serializeBase,
  basePath,
  makeBaseId,
  DEFAULT_COLUMNS,
  BASE_DIR,
  BASE_FILE_EXT,
} from './baseTypes.js';

describe('baseTypes', () => {
  it('createEmptyBase returns a well-formed base with the three default views', () => {
    const b = createEmptyBase({ name: 'Reading Queue' });
    expect(b.name).toBe('Reading Queue');
    expect(b.id).toMatch(/^reading-queue-/);
    expect(b.filters).toEqual([]);
    expect(b.sorts).toEqual([]);
    expect(b.columns).toEqual(DEFAULT_COLUMNS);
    expect(b.views.map(v => v.type)).toEqual(['table', 'cards', 'list']);
    expect(b.activeViewId).toBe('table');
  });

  it('createEmptyBase falls back to "Untitled Base" when name is blank', () => {
    expect(createEmptyBase().name).toBe('Untitled Base');
    expect(createEmptyBase({ name: '   ' }).name).toBe('Untitled Base');
  });

  it('makeBaseId slugifies to lowercase + hyphens with a timestamp shard', () => {
    const id = makeBaseId('My Cool Base!!');
    expect(id).toMatch(/^my-cool-base-[a-z0-9]+$/);
  });

  it('basePath renders the canonical on-disk location', () => {
    expect(basePath('foo')).toBe(`${BASE_DIR}/foo${BASE_FILE_EXT}`);
  });

  it('normalizeBase coerces malformed input, dropping unknown ops + bad sorts', () => {
    const norm = normalizeBase({
      id: 'b1',
      name: 'Tasks',
      filters: [
        { key: 'status', op: 'equals', value: 'open' },
        { key: 'broken', op: 'mystery', value: 'x' },     // dropped: bad op
        null,                                              // dropped: nullish
      ],
      sorts: [
        { key: 'date', dir: 'desc' },
        { key: 'foo', dir: 'sideways' },                  // dropped: bad dir
      ],
      columns: ['title', 'status'],
      views: [{ id: 'table', type: 'table', name: 'Table' }],
      activeViewId: 'nope',                                // coerced to first view
    });
    expect(norm.filters).toHaveLength(1);
    expect(norm.sorts).toHaveLength(1);
    expect(norm.columns).toEqual(['title', 'status']);
    expect(norm.activeViewId).toBe('table');
  });

  it('normalizeBase fills defaults when fields are missing', () => {
    const norm = normalizeBase({});
    expect(norm.name).toBe('Untitled Base');
    expect(norm.columns).toEqual(DEFAULT_COLUMNS);
    expect(norm.views).toHaveLength(3);
    expect(norm.activeViewId).toBe('table');
  });

  it('normalizeBase throws on non-object input', () => {
    expect(() => normalizeBase(null)).toThrow();
    expect(() => normalizeBase('string')).toThrow();
  });

  it('serializeBase produces parseable JSON that round-trips', () => {
    const b = createEmptyBase({ name: 'Round Trip' });
    b.filters = [{ key: 'status', op: 'equals', value: 'active' }];
    const json = serializeBase(b);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('Round Trip');
    expect(parsed.filters[0].value).toBe('active');
    // Pretty-printed: contains a newline so git diffs are readable.
    expect(json).toContain('\n');
  });
});
