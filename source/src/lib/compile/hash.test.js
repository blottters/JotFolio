import { describe, it, expect } from 'vitest';
import { hashSourceEntry, hashCompiledArtifact, compositeSourceHash } from './hash.js';

const baseEntry = {
  id: 'src-001',
  type: 'note',
  title: 'Hello',
  notes: 'line one\nline two',
  canonical_key: 'hello',
  aliases: ['hi', 'hey'],
  source_type: 'manual',
  valid_from: '2026-05-04',
  modified: 1700000000,
  _path: '/vault/src-001.md',
  links: ['src-002'],
};

describe('hashSourceEntry', () => {
  it('is stable across runs (same input -> same output)', () => {
    expect(hashSourceEntry(baseEntry)).toBe(hashSourceEntry(baseEntry));
  });

  it('output is 32 hex chars', () => {
    const h = hashSourceEntry(baseEntry);
    expect(h).toMatch(/^[0-9a-f]{32}$/);
  });

  it('excludes `modified` field', () => {
    const a = hashSourceEntry(baseEntry);
    const b = hashSourceEntry({ ...baseEntry, modified: 9999999999 });
    expect(a).toBe(b);
  });

  it('excludes `_path` and `links` fields', () => {
    const a = hashSourceEntry(baseEntry);
    const b = hashSourceEntry({ ...baseEntry, _path: '/elsewhere.md', links: ['other'] });
    expect(a).toBe(b);
  });

  it('changes when `notes` body changes', () => {
    const a = hashSourceEntry(baseEntry);
    const b = hashSourceEntry({ ...baseEntry, notes: 'different content' });
    expect(a).not.toBe(b);
  });

  it('is invariant to field-declaration order', () => {
    const reordered = {
      valid_from: baseEntry.valid_from,
      aliases: baseEntry.aliases,
      canonical_key: baseEntry.canonical_key,
      notes: baseEntry.notes,
      title: baseEntry.title,
      type: baseEntry.type,
      id: baseEntry.id,
      source_type: baseEntry.source_type,
    };
    expect(hashSourceEntry(baseEntry)).toBe(hashSourceEntry(reordered));
  });

  it('is invariant to alias array order', () => {
    const a = hashSourceEntry({ ...baseEntry, aliases: ['hi', 'hey'] });
    const b = hashSourceEntry({ ...baseEntry, aliases: ['hey', 'hi'] });
    expect(a).toBe(b);
  });

  it('normalizes CRLF -> LF in notes', () => {
    const a = hashSourceEntry({ ...baseEntry, notes: 'a\r\nb' });
    const b = hashSourceEntry({ ...baseEntry, notes: 'a\nb' });
    expect(a).toBe(b);
  });
});

describe('hashCompiledArtifact', () => {
  const fm = { id: 'x', title: 'T', tags: ['a', 'b'], modified: 123 };
  const body = 'body text\nmore';

  it('is stable across runs', () => {
    expect(hashCompiledArtifact({ body, frontmatter: fm }))
      .toBe(hashCompiledArtifact({ body, frontmatter: fm }));
  });

  it('output is 32 hex chars', () => {
    expect(hashCompiledArtifact({ body, frontmatter: fm })).toMatch(/^[0-9a-f]{32}$/);
  });

  it('excludes `modified` from frontmatter', () => {
    const a = hashCompiledArtifact({ body, frontmatter: { ...fm, modified: 1 } });
    const b = hashCompiledArtifact({ body, frontmatter: { ...fm, modified: 999999 } });
    expect(a).toBe(b);
  });

  it('excludes `id` from frontmatter', () => {
    const a = hashCompiledArtifact({ body, frontmatter: { ...fm, id: 'one' } });
    const b = hashCompiledArtifact({ body, frontmatter: { ...fm, id: 'two' } });
    expect(a).toBe(b);
  });

  it('is invariant to frontmatter key order', () => {
    const a = hashCompiledArtifact({ body, frontmatter: { title: 'T', tags: ['a', 'b'] } });
    const b = hashCompiledArtifact({ body, frontmatter: { tags: ['a', 'b'], title: 'T' } });
    expect(a).toBe(b);
  });

  it('normalizes CRLF -> LF in body', () => {
    const a = hashCompiledArtifact({ body: 'a\r\nb', frontmatter: fm });
    const b = hashCompiledArtifact({ body: 'a\nb', frontmatter: fm });
    expect(a).toBe(b);
  });

  it('changes when body changes', () => {
    const a = hashCompiledArtifact({ body: 'one', frontmatter: fm });
    const b = hashCompiledArtifact({ body: 'two', frontmatter: fm });
    expect(a).not.toBe(b);
  });
});

describe('compositeSourceHash', () => {
  const sources = [
    { id: 'b', hash: 'h-b' },
    { id: 'a', hash: 'h-a' },
    { id: 'c', hash: 'h-c' },
  ];

  it('is stable across runs', () => {
    expect(compositeSourceHash(sources)).toBe(compositeSourceHash(sources));
  });

  it('output is 32 hex chars', () => {
    expect(compositeSourceHash(sources)).toMatch(/^[0-9a-f]{32}$/);
  });

  it('is invariant to input order', () => {
    const reordered = [sources[2], sources[0], sources[1]];
    expect(compositeSourceHash(sources)).toBe(compositeSourceHash(reordered));
  });

  it('changes when any member hash changes', () => {
    const mutated = sources.map((s, i) => (i === 0 ? { ...s, hash: 'h-b-mut' } : s));
    expect(compositeSourceHash(sources)).not.toBe(compositeSourceHash(mutated));
  });

  it('handles empty list', () => {
    expect(compositeSourceHash([])).toMatch(/^[0-9a-f]{32}$/);
  });
});
