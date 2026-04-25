import { describe, it, expect } from 'vitest';
import { parseSearchQuery, matchesQuery, searchEntries } from './searchVault.js';

const ENTRIES = [
  {
    id: 'a',
    type: 'note',
    title: 'Compiler notes from MIT',
    notes: 'Lattice typing is hard.',
    tags: ['focus', 'cs'],
    status: 'active',
  },
  {
    id: 'b',
    type: 'video',
    title: 'How a CPU works',
    notes: 'Great explainer with diagrams.',
    tags: ['cs', 'reference'],
    status: 'watched',
    channel: 'The Daily',
    priority: 'high',
  },
  {
    id: 'c',
    type: 'article',
    title: 'Foo bar baz',
    notes: 'totally unrelated content',
    tags: ['draft'],
    status: 'archived',
  },
  {
    id: 'd',
    type: 'note',
    title: 'Archived stuff',
    notes: 'old thoughts',
    tags: ['archived', 'focus'],
    status: 'archived',
  },
  {
    id: 'e',
    type: 'podcast',
    title: 'Episode 12: Compilers',
    notes: 'guest talked about parser combinators',
    tags: ['focus'],
    status: 'active',
    channel: 'HBR',
  },
];

describe('parseSearchQuery', () => {
  it('returns empty bins for empty/whitespace query', () => {
    expect(parseSearchQuery('')).toEqual({ text: [], scoped: [], phrases: [] });
    expect(parseSearchQuery('   ')).toEqual({ text: [], scoped: [], phrases: [] });
  });

  it('splits plain text tokens on whitespace and lowercases', () => {
    const p = parseSearchQuery('Hello WORLD');
    expect(p.text).toEqual(['hello', 'world']);
    expect(p.scoped).toEqual([]);
    expect(p.phrases).toEqual([]);
  });

  it('parses tag:foo as scoped tag token', () => {
    const p = parseSearchQuery('tag:Focus');
    expect(p.scoped).toEqual([{ key: 'tag', value: 'focus', negated: false }]);
    expect(p.text).toEqual([]);
  });

  it('parses #foo as alias for tag:foo', () => {
    const p = parseSearchQuery('#focus');
    expect(p.scoped).toEqual([{ key: 'tag', value: 'focus', negated: false }]);
  });

  it('parses negation -tag:archived', () => {
    const p = parseSearchQuery('-tag:archived');
    expect(p.scoped).toEqual([{ key: 'tag', value: 'archived', negated: true }]);
  });

  it('parses quoted scoped value channel:"The Daily"', () => {
    const p = parseSearchQuery('channel:"The Daily"');
    expect(p.scoped).toEqual([{ key: 'channel', value: 'the daily', negated: false }]);
  });

  it('parses bare quoted phrase as a phrase, not split', () => {
    const p = parseSearchQuery('"compiler notes"');
    expect(p.phrases).toEqual(['compiler notes']);
    expect(p.text).toEqual([]);
  });

  it('parses mixed scoped + plain + quoted scoped', () => {
    const p = parseSearchQuery('tag:focus -status:archived compiler channel:"The Daily"');
    expect(p.scoped).toEqual([
      { key: 'tag', value: 'focus', negated: false },
      { key: 'status', value: 'archived', negated: true },
      { key: 'channel', value: 'the daily', negated: false },
    ]);
    expect(p.text).toEqual(['compiler']);
  });
});

describe('matchesQuery / searchEntries', () => {
  it('empty query matches every entry', () => {
    expect(searchEntries(ENTRIES, '')).toHaveLength(ENTRIES.length);
    expect(searchEntries(ENTRIES, '   ')).toHaveLength(ENTRIES.length);
  });

  it('plain text matches title (case-insensitive)', () => {
    const r = searchEntries(ENTRIES, 'COMPILER');
    const ids = r.map(e => e.id).sort();
    expect(ids).toEqual(['a', 'e']);
  });

  it('plain text matches notes', () => {
    const r = searchEntries(ENTRIES, 'lattice');
    expect(r.map(e => e.id)).toEqual(['a']);
  });

  it('plain text matches tag substring', () => {
    const r = searchEntries(ENTRIES, 'refer');
    expect(r.map(e => e.id)).toEqual(['b']);
  });

  it('tag:foo matches by tag, ignores title text containing the word', () => {
    // Entry c has title "Foo bar baz" but tag 'draft', not 'foo'.
    const r = searchEntries(ENTRIES, 'tag:foo');
    expect(r).toHaveLength(0);
    const r2 = searchEntries(ENTRIES, 'tag:focus');
    expect(r2.map(e => e.id).sort()).toEqual(['a', 'd', 'e']);
  });

  it('#foo is alias for tag:foo', () => {
    const a = searchEntries(ENTRIES, '#focus').map(e => e.id).sort();
    const b = searchEntries(ENTRIES, 'tag:focus').map(e => e.id).sort();
    expect(a).toEqual(b);
  });

  it('status:active matches frontmatter status', () => {
    const r = searchEntries(ENTRIES, 'status:active');
    expect(r.map(e => e.id).sort()).toEqual(['a', 'e']);
  });

  it('type:note matches entry type', () => {
    const r = searchEntries(ENTRIES, 'type:note');
    expect(r.map(e => e.id).sort()).toEqual(['a', 'd']);
  });

  it('multiple scoped tokens AND-combine', () => {
    const r = searchEntries(ENTRIES, 'tag:focus status:active');
    expect(r.map(e => e.id).sort()).toEqual(['a', 'e']);
  });

  it('-tag:archived excludes those entries', () => {
    const r = searchEntries(ENTRIES, '-tag:archived');
    // Only entry d has the 'archived' tag.
    expect(r.map(e => e.id).sort()).toEqual(['a', 'b', 'c', 'e']);
  });

  it('quoted phrase matches as a single substring (not split into tokens)', () => {
    const r = searchEntries(ENTRIES, '"compiler notes"');
    // Only entry a's title contains the literal phrase "compiler notes".
    expect(r.map(e => e.id)).toEqual(['a']);
    // Whereas plain text would have matched both "compiler" and "notes" separately.
    const naive = searchEntries(ENTRIES, 'compiler notes');
    // 'compiler' AND 'notes' as separate tokens — entry a has both.
    expect(naive.map(e => e.id)).toEqual(['a']);
  });

  it('quoted scoped value channel:"The Daily" parses and matches', () => {
    const r = searchEntries(ENTRIES, 'channel:"The Daily"');
    expect(r.map(e => e.id)).toEqual(['b']);
  });

  it('mixed query: tag:focus -status:archived compiler', () => {
    const r = searchEntries(ENTRIES, 'tag:focus -status:archived compiler');
    expect(r.map(e => e.id).sort()).toEqual(['a', 'e']);
  });

  it('arbitrary frontmatter property: priority:high', () => {
    const r = searchEntries(ENTRIES, 'priority:high');
    expect(r.map(e => e.id)).toEqual(['b']);
  });

  it('unknown property key excludes entries that lack it (no false positives)', () => {
    // Only entries b and e have a 'channel' field. Entry a does not.
    const r = searchEntries(ENTRIES, 'channel:HBR');
    expect(r.map(e => e.id)).toEqual(['e']);
    // Sanity: entry a should NOT come back even though its other fields are nonempty.
    expect(r.find(e => e.id === 'a')).toBeUndefined();
  });

  it('case-insensitive across scoped, tag, and phrase forms', () => {
    expect(searchEntries(ENTRIES, 'STATUS:ACTIVE').map(e => e.id).sort()).toEqual(['a', 'e']);
    expect(searchEntries(ENTRIES, 'TAG:CS').map(e => e.id).sort()).toEqual(['a', 'b']);
    expect(searchEntries(ENTRIES, '"COMPILER NOTES"').map(e => e.id)).toEqual(['a']);
  });

  it('matchesQuery returns true for empty parsed', () => {
    const parsed = parseSearchQuery('');
    expect(matchesQuery(ENTRIES[0], parsed)).toBe(true);
  });

  it('handles entries with missing optional fields gracefully', () => {
    const sparse = { id: 'x', type: 'note' }; // no title, notes, tags, status
    expect(matchesQuery(sparse, parseSearchQuery(''))).toBe(true);
    expect(matchesQuery(sparse, parseSearchQuery('foo'))).toBe(false);
    expect(matchesQuery(sparse, parseSearchQuery('tag:foo'))).toBe(false);
    expect(matchesQuery(sparse, parseSearchQuery('-tag:foo'))).toBe(true);
  });
});
