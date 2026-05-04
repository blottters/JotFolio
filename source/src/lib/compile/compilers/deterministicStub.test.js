import { describe, it, expect } from 'vitest';
import { compileDeterministic } from './deterministicStub.js';

const FIXED_NOW = '2026-05-04T00:00:00.000Z';
const now = () => FIXED_NOW;

function makeSource(overrides = {}) {
  return {
    id: 's1',
    title: 'Untitled',
    notes: '',
    type: 'raw',
    canonical_key: 'ck-1',
    retrieval_keywords: [],
    tags: [],
    ...overrides
  };
}

describe('compileDeterministic', () => {
  it('single source: confidence 0.45, includes single-source warning', () => {
    const out = compileDeterministic(
      [makeSource({ id: 's1', title: 'Alpha', notes: 'hello', canonical_key: 'ck-a' })],
      { now }
    );
    expect(out.confidence).toBeCloseTo(0.45, 10);
    const codes = out.warnings.map((w) => w.code);
    expect(codes).toContain('single-source');
  });

  it('three sources: confidence 0.75, no single-source warning', () => {
    const sources = [
      makeSource({ id: 's1', title: 'Alpha A', canonical_key: 'ck' }),
      makeSource({ id: 's2', title: 'Alpha B', canonical_key: 'ck' }),
      makeSource({ id: 's3', title: 'Alpha C', canonical_key: 'ck' })
    ];
    const out = compileDeterministic(sources, { now });
    expect(out.confidence).toBeCloseTo(0.75, 10);
    const codes = out.warnings.map((w) => w.code);
    expect(codes).not.toContain('single-source');
  });

  it('determinism: same inputs + fixed now → byte-identical output', () => {
    const sources = [
      makeSource({ id: 's1', title: 'Stoic Notes A', notes: 'on virtue', tags: ['phil', 'stoic'] }),
      makeSource({ id: 's2', title: 'Stoic Notes B', notes: 'on logos', tags: ['stoic', 'wisdom'] })
    ];
    const a = compileDeterministic(sources, { now });
    const b = compileDeterministic(sources, { now });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('title: longest common word prefix across "Stoic Notes A/B" → "Stoic Notes"', () => {
    const sources = [
      makeSource({ id: 's1', title: 'Stoic Notes A' }),
      makeSource({ id: 's2', title: 'Stoic Notes B' })
    ];
    const out = compileDeterministic(sources, { now });
    expect(out.frontmatter.title).toBe('Stoic Notes');
  });

  it('title fallback: no shared prefix → sources[0].title', () => {
    const sources = [
      makeSource({ id: 's1', title: 'X' }),
      makeSource({ id: 's2', title: 'Y' })
    ];
    const out = compileDeterministic(sources, { now });
    expect(out.frontmatter.title).toBe('X');
  });

  it('retrieval_keywords: union, dedup, sorted', () => {
    const sources = [
      makeSource({
        id: 's1',
        title: 'A',
        retrieval_keywords: ['zebra', 'apple'],
        tags: ['tag2', 'apple']
      }),
      makeSource({
        id: 's2',
        title: 'B',
        retrieval_keywords: ['mango', 'apple'],
        tags: ['tag1']
      })
    ];
    const out = compileDeterministic(sources, { now });
    expect(out.frontmatter.retrieval_keywords).toEqual([
      'apple',
      'mango',
      'tag1',
      'tag2',
      'zebra'
    ]);
  });

  it('aliases: union of titles excluding chosen output title, sorted', () => {
    const sources = [
      makeSource({ id: 's1', title: 'Stoic Notes A' }),
      makeSource({ id: 's2', title: 'Stoic Notes B' }),
      makeSource({ id: 's3', title: 'Stoic Notes A' })
    ];
    const out = compileDeterministic(sources, { now });
    expect(out.frontmatter.title).toBe('Stoic Notes');
    expect(out.frontmatter.aliases).toEqual(['Stoic Notes A', 'Stoic Notes B']);
  });

  it('mixed-types warning when sources span >1 type and include non-raw', () => {
    const sources = [
      makeSource({ id: 's1', title: 'A', type: 'raw' }),
      makeSource({ id: 's2', title: 'B', type: 'wiki' })
    ];
    const out = compileDeterministic(sources, { now });
    const codes = out.warnings.map((w) => w.code);
    expect(codes).toContain('mixed-types');
  });

  it('no-canonical-key warning when seed lacks canonical_key', () => {
    const sources = [
      makeSource({ id: 's1', title: 'A', canonical_key: null }),
      makeSource({ id: 's2', title: 'B', canonical_key: 'ck' })
    ];
    const out = compileDeterministic(sources, { now });
    const codes = out.warnings.map((w) => w.code);
    expect(codes).toContain('no-canonical-key');
  });
});
