import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('useSemanticIndex', () => {
  afterEach(() => {
    vi.doUnmock('../semantic/index.js');
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('does not import the semantic implementation while disabled', async () => {
    vi.resetModules();
    const factory = vi.fn(() => ({
      buildSemanticIndex: vi.fn(),
      getSimilarEntries: vi.fn(),
      reembedEntry: vi.fn(),
    }));
    vi.doMock('../semantic/index.js', factory);

    const { useSemanticIndex } = await import('./useSemanticIndex.js');
    expect(factory).not.toHaveBeenCalled();

    const { result } = renderHook(() =>
      useSemanticIndex([{ id: 'a', title: 'Alpha' }], null, { enabled: false })
    );

    expect(result.current.ready).toBe(false);
    expect(result.current.getSimilar('a')).toEqual([]);
    await expect(result.current.reembed({ id: 'a', title: 'Alpha' })).resolves.toBeNull();
    expect(factory).not.toHaveBeenCalled();
  });

  it('lazy-imports semantic helpers when enabled and delegates calls', async () => {
    vi.resetModules();
    const api = {
      buildSemanticIndex: vi.fn(async (entries, { onProgress } = {}) => {
        onProgress?.({ done: entries.length, total: entries.length });
        return new Map([['a', new Float32Array([1, 0])]]);
      }),
      getSimilarEntries: vi.fn(() => [{ id: 'b', score: 0.82 }]),
      reembedEntry: vi.fn(async (index, entry) => {
        const vec = new Float32Array([0, 1]);
        index.set(entry.id, vec);
        return vec;
      }),
    };
    const factory = vi.fn(() => api);
    vi.doMock('../semantic/index.js', factory);

    const { useSemanticIndex } = await import('./useSemanticIndex.js');
    const { result } = renderHook(() =>
      useSemanticIndex([{ id: 'a', title: 'Alpha' }], null, { enabled: true })
    );

    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(factory).toHaveBeenCalledTimes(1);
    expect(api.buildSemanticIndex).toHaveBeenCalledWith(
      [{ id: 'a', title: 'Alpha' }],
      expect.objectContaining({ vaultAdapter: null })
    );
    expect(result.current.snapshot.size).toBe(1);
    expect(result.current.getSimilar('a', 3)).toEqual([{ id: 'b', score: 0.82 }]);
    expect(api.getSimilarEntries).toHaveBeenCalledWith(
      result.current.snapshot.index,
      'a',
      3,
      {}
    );

    await act(async () => {
      await result.current.reembed({ id: 'a', title: 'Alpha updated' });
    });

    expect(api.reembedEntry).toHaveBeenCalledWith(
      expect.any(Map),
      { id: 'a', title: 'Alpha updated' },
      { vaultAdapter: null }
    );
  });
});
