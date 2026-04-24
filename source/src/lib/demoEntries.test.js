import { describe, expect, it } from 'vitest';
import { MANUAL_LINKS_FIELD } from './frontmatter.js';
import { getConstellationDemoEntries } from './demoEntries.js';

describe('getConstellationDemoEntries', () => {
  it('returns a linked demo corpus across entry types', () => {
    const entries = getConstellationDemoEntries();

    expect(entries).toHaveLength(12);
    expect(new Set(entries.map(e => e.id)).size).toBe(entries.length);
    expect(new Set(entries.map(e => e.type))).toEqual(new Set(['note', 'article', 'link', 'podcast', 'video', 'journal']));
    expect(entries.every(e => e[MANUAL_LINKS_FIELD] === true)).toBe(true);
    expect(entries.every(e => (e.tags || []).includes('demo-constellation'))).toBe(true);
    expect(entries.some(e => (e.links || []).length >= 3)).toBe(true);
  });
});
