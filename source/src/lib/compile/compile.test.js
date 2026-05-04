import { describe, it, expect } from 'vitest';
import { buildVaultIndex } from '../index/vaultIndex.js';
import { compile } from './compile.js';

const FIXED_NOW = () => '2026-05-04T00:00:00.000Z';

function makeOpts(extra = {}) {
  return { now: FIXED_NOW, ...extra };
}

function fixtureLinkedStoics() {
  // Three raw sources cross-linked via wikilinks so getCluster() unifies them.
  return [
    {
      id: 'raw-1',
      type: 'raw',
      title: 'Stoic Notes A',
      notes: 'Marcus on patience. See [[Stoic Notes B]].',
      canonical_key: 'stoicism',
      created: '2026-04-01',
    },
    {
      id: 'raw-2',
      type: 'raw',
      title: 'Stoic Notes B',
      notes: 'Marcus on duty. See [[Stoic Notes C]].',
      canonical_key: 'stoicism',
      created: '2026-04-02',
    },
    {
      id: 'raw-3',
      type: 'raw',
      title: 'Stoic Notes C',
      notes: 'Marcus on virtue. See [[Stoic Notes A]].',
      canonical_key: 'stoicism',
      created: '2026-04-03',
    },
  ];
}

describe('compile orchestrator', () => {
  it('F1: 1 raw source, no canonical_key → review with single-source + no-canonical-key warnings', () => {
    const fixture = [
      {
        id: 'raw-solo',
        type: 'raw',
        title: 'Lonely Note',
        notes: 'Just one thought.',
        created: '2026-04-15',
      },
    ];
    const idx = buildVaultIndex(fixture);
    const result = compile('raw-solo', idx, makeOpts());

    expect(result.emitted).toBe('review');
    expect(result.entry.type).toBe('review');
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('single-source');
    expect(codes).toContain('no-canonical-key');
  });

  it('F2: 3 linked raw sources sharing canonical_key → wiki, confidence 0.75, no blocking warnings', () => {
    const idx = buildVaultIndex(fixtureLinkedStoics());
    const result = compile('raw-1', idx, makeOpts());

    expect(result.sources).toHaveLength(3);
    expect(result.confidence).toBe(0.75);
    expect(result.emitted).toBe('wiki');
    expect(result.entry.type).toBe('wiki');
    const blocking = result.warnings.filter(
      w => w.code === 'canonical-collision-handauthored'
    );
    expect(blocking).toHaveLength(0);
  });

  it('F3 / F10: determinism — same seed + index + fixed now → byte-identical CompileResult', () => {
    const idx1 = buildVaultIndex(fixtureLinkedStoics());
    const idx2 = buildVaultIndex(fixtureLinkedStoics());
    const r1 = compile('raw-1', idx1, makeOpts());
    const r2 = compile('raw-1', idx2, makeOpts());
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it('F3: idempotent re-compile produces same compiledHash', () => {
    const idx = buildVaultIndex(fixtureLinkedStoics());
    const r1 = compile('raw-1', idx, makeOpts());
    const r2 = compile('raw-1', idx, makeOpts());
    expect(r1.compiledHash).toBe(r2.compiledHash);
    expect(r1.sourceHash).toBe(r2.sourceHash);
  });

  it('source edit invalidates compiledHash', () => {
    const base = fixtureLinkedStoics();
    const idx1 = buildVaultIndex(base);
    const r1 = compile('raw-1', idx1, makeOpts());

    const mutated = base.map(e =>
      e.id === 'raw-1' ? { ...e, notes: e.notes + ' (edited)' } : e
    );
    const idx2 = buildVaultIndex(mutated);
    const r2 = compile('raw-1', idx2, makeOpts());

    expect(r1.compiledHash).not.toBe(r2.compiledHash);
    expect(r1.sourceHash).not.toBe(r2.sourceHash);
  });

  it('F4: canonical-collision with hand-authored wiki entry → review with blocking warning', () => {
    const fixture = [
      ...fixtureLinkedStoics(),
      {
        id: 'wiki-stoicism',
        type: 'wiki',
        title: 'Stoicism',
        notes: 'Hand-authored canonical entry.',
        canonical_key: 'stoicism',
        created: '2026-03-01',
      },
    ];
    const idx = buildVaultIndex(fixture);
    const result = compile('raw-1', idx, makeOpts());

    expect(result.emitted).toBe('review');
    expect(result.entry.type).toBe('review');
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('canonical-collision-handauthored');
  });

  describe('seed resolution', () => {
    it('resolves entry-object seed', () => {
      const idx = buildVaultIndex(fixtureLinkedStoics());
      const seedEntry = idx.byId.get('raw-1');
      const result = compile(seedEntry, idx, makeOpts());
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('resolves id-string seed', () => {
      const idx = buildVaultIndex(fixtureLinkedStoics());
      const result = compile('raw-1', idx, makeOpts());
      expect(result.sources.some(s => s.id === 'raw-1')).toBe(true);
    });

    it('resolves canonical_key-string seed', () => {
      const idx = buildVaultIndex(fixtureLinkedStoics());
      const result = compile('stoicism', idx, makeOpts());
      expect(result.sources.length).toBe(3);
    });

    it('resolves title-string seed', () => {
      const idx = buildVaultIndex(fixtureLinkedStoics());
      const result = compile('Stoic Notes A', idx, makeOpts());
      expect(result.sources.some(s => s.id === 'raw-1')).toBe(true);
    });

    it('throws on unknown seed', () => {
      const idx = buildVaultIndex(fixtureLinkedStoics());
      expect(() => compile('does-not-exist', idx, makeOpts())).toThrow(
        /cannot resolve seed/
      );
    });
  });

  it('selectSources includes seed when seed type is in includeTypes', () => {
    const idx = buildVaultIndex(fixtureLinkedStoics());
    const result = compile('raw-1', idx, makeOpts());
    expect(result.sources.some(s => s.id === 'raw-1')).toBe(true);
  });

  it('selectSources excludes entries whose type is not in includeTypes', () => {
    const fixture = [
      ...fixtureLinkedStoics(),
      {
        id: 'wiki-stoicism',
        type: 'wiki',
        title: 'Stoicism',
        notes: 'Hand-authored.',
        canonical_key: 'stoicism',
        created: '2026-03-01',
      },
    ];
    const idx = buildVaultIndex(fixture);
    const result = compile('raw-1', idx, makeOpts());
    // Only raw entries should be in sources.
    expect(result.sources.every(s => s.type === 'raw')).toBe(true);
    expect(result.sources.some(s => s.id === 'wiki-stoicism')).toBe(false);
  });

  it('CompileResult.sources sorted deterministically (created ASC, id ASC)', () => {
    // Two entries share created date → tiebreak by id.
    const fixture = [
      {
        id: 'raw-z',
        type: 'raw',
        title: 'Z Note',
        notes: 'Linked. See [[A Note]].',
        canonical_key: 'topic',
        created: '2026-04-02',
      },
      {
        id: 'raw-a',
        type: 'raw',
        title: 'A Note',
        notes: 'Linked. See [[Z Note]].',
        canonical_key: 'topic',
        created: '2026-04-02',
      },
      {
        id: 'raw-early',
        type: 'raw',
        title: 'Early',
        notes: 'Linked. See [[A Note]].',
        canonical_key: 'topic',
        created: '2026-04-01',
      },
    ];
    const idx = buildVaultIndex(fixture);
    const result = compile('raw-a', idx, makeOpts());
    const ids = result.sources.map(s => s.id);
    expect(ids).toEqual(['raw-early', 'raw-a', 'raw-z']);
  });
});
