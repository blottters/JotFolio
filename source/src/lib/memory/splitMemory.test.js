import { describe, it, expect, vi } from 'vitest';
import { splitMemory } from './splitMemory.js';

// Mock compile() returning a CompileResult-shaped object. We capture the
// args it was called with so tests can assert pass-through behavior.
function makeMockCompile() {
  const calls = [];
  const fn = vi.fn((seed, index, opts) => {
    calls.push({ seed, index, opts });
    return {
      entry: {
        type: 'review',
        title: 'auto-generated',
        notes: '## Summary\n- fact',
        confidence: 0.5,
      },
      sources: [
        { id: 's1', hash: 'h1', title: 'src1', type: 'raw' },
        { id: 's2', hash: 'h2', title: 'src2', type: 'raw' },
        { id: 's3', hash: 'h3', title: 'src3', type: 'raw' },
        { id: 's4', hash: 'h4', title: 'src4', type: 'raw' },
      ],
      sourceHash: 'composite',
      compiledHash: 'compiled',
      confidence: 0.5,
      warnings: [],
      emitted: 'review',
      compiler: { name: 'deterministic-stub', version: '0.1' },
    };
  });
  fn.calls = calls;
  return fn;
}

describe('splitMemory', () => {
  const original = {
    id: 'orig-1',
    type: 'wiki',
    title: 'big memory',
    canonical_key: 'big-mem',
  };
  const index = { byId: new Map(), lookup: new Map() };

  it('splits into 2 children, original gets superseded_by referencing both', () => {
    const compile = makeMockCompile();
    const splits = [
      { title: 'Child A', sourceIds: ['s1', 's2'] },
      { title: 'Child B', sourceIds: ['s3', 's4'] },
    ];
    const { children, supersedingOriginal } = splitMemory({
      original, splits, index, compile,
    });
    expect(children).toHaveLength(2);
    expect(supersedingOriginal.superseded_by).toHaveLength(2);
    expect(supersedingOriginal.id).toBe('orig-1');
  });

  it('each child has supersedes pointing at original', () => {
    const compile = makeMockCompile();
    const splits = [
      { title: 'A', sourceIds: ['s1'] },
      { title: 'B', sourceIds: ['s2'] },
    ];
    const { children } = splitMemory({ original, splits, index, compile });
    for (const child of children) {
      expect(child.entry.supersedes).toEqual(['orig-1']);
    }
  });

  it('each child gets its overridden title', () => {
    const compile = makeMockCompile();
    const splits = [
      { title: 'Alpha', sourceIds: ['s1'] },
      { title: 'Bravo', sourceIds: ['s2'] },
    ];
    const { children } = splitMemory({ original, splits, index, compile });
    expect(children[0].entry.title).toBe('Alpha');
    expect(children[1].entry.title).toBe('Bravo');
  });

  it('children sources contain only the assigned sourceIds (post-filter)', () => {
    const compile = makeMockCompile();
    const splits = [
      { title: 'A', sourceIds: ['s1', 's2'] },
      { title: 'B', sourceIds: ['s3'] },
    ];
    const { children } = splitMemory({ original, splits, index, compile });
    expect(children[0].sources.map(s => s.id).sort()).toEqual(['s1', 's2']);
    expect(children[1].sources.map(s => s.id)).toEqual(['s3']);
  });

  it('single split (1 child) is valid', () => {
    const compile = makeMockCompile();
    const splits = [{ title: 'Only', sourceIds: ['s1'] }];
    const { children, supersedingOriginal } = splitMemory({
      original, splits, index, compile,
    });
    expect(children).toHaveLength(1);
    expect(supersedingOriginal.superseded_by).toHaveLength(1);
    expect(children[0].entry.title).toBe('Only');
    expect(children[0].entry.supersedes).toEqual(['orig-1']);
  });

  it('empty splits array -> children: [], original superseded_by is []', () => {
    const compile = makeMockCompile();
    const { children, supersedingOriginal } = splitMemory({
      original, splits: [], index, compile,
    });
    expect(children).toEqual([]);
    expect(supersedingOriginal.superseded_by).toEqual([]);
    expect(compile).not.toHaveBeenCalled();
  });

  it('passes compileOpts to compile() for each split', () => {
    const compile = makeMockCompile();
    const splits = [{ title: 'A', sourceIds: ['s1'] }];
    splitMemory({
      original, splits, index, compile,
      compileOpts: { compiler: 'deterministic-stub', minSources: 2 },
    });
    expect(compile.calls[0].opts.minSources).toBe(2);
    expect(compile.calls[0].opts.includeTypes).toEqual(['raw']);
  });

  it('throws on split with empty sourceIds', () => {
    const compile = makeMockCompile();
    expect(() =>
      splitMemory({
        original,
        splits: [{ title: 'bad', sourceIds: [] }],
        index,
        compile,
      })
    ).toThrow(/sourceIds/);
  });

  it('throws when compile is not a function', () => {
    expect(() =>
      splitMemory({ original, splits: [{ title: 'x', sourceIds: ['s1'] }], index })
    ).toThrow(/compile/);
  });
});
