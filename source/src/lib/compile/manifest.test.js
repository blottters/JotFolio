import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub hashSourceEntry so tests control change-detection deterministically.
vi.mock('./hash.js', () => ({
  hashSourceEntry: vi.fn(),
}));

import { hashSourceEntry } from './hash.js';
import {
  EMPTY_MANIFEST,
  loadManifest,
  saveManifest,
  recordCompilation,
  findStale,
  isCompiledEntry,
} from './manifest.js';

const MANIFEST_PATH = '.jotfolio/compiled/manifest.json';

function makeVault() {
  return { read: vi.fn(), write: vi.fn().mockResolvedValue(undefined) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadManifest', () => {
  it('returns empty manifest when file is missing', async () => {
    const vault = makeVault();
    vault.read.mockResolvedValue(null);
    const result = await loadManifest(vault);
    expect(result).toEqual(EMPTY_MANIFEST);
    expect(vault.read).toHaveBeenCalledWith(MANIFEST_PATH);
  });

  it('round-trips a saved manifest', async () => {
    const vault = makeVault();
    const saved = {
      version: 1,
      entries: {
        'compiled/foo.md': {
          compiler: 'note-aggregator',
          sources: [{ id: 'a', hash: 'aaaa' }],
          sourceHash: 'src-1',
          compiledHash: 'cmp-1',
          compiledAt: '2026-05-04T00:00:00.000Z',
          supersedes: null,
          emitted: true,
          history: [],
        },
      },
    };
    await saveManifest(vault, saved);
    const writtenPayload = vault.write.mock.calls[0][1];
    expect(vault.write).toHaveBeenCalledWith(MANIFEST_PATH, expect.any(String));

    vault.read.mockResolvedValue(writtenPayload);
    const loaded = await loadManifest(vault);
    expect(loaded).toEqual(saved);
  });

  it('falls back to empty + warns on version mismatch', async () => {
    const vault = makeVault();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vault.read.mockResolvedValue(JSON.stringify({ version: 2, entries: {} }));
    const result = await loadManifest(vault);
    expect(result).toEqual(EMPTY_MANIFEST);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('recordCompilation', () => {
  const compileResult = {
    compiler: 'note-aggregator',
    sources: [
      { id: 'src-1', hash: 'h-src-1', title: 'One', type: 'note' },
      { id: 'src-2', hash: 'h-src-2', title: 'Two', type: 'note' },
    ],
    sourceHash: 'composite-1',
    compiledHash: 'compiled-1',
    confidence: 0.9,
    emitted: true,
  };

  it('inserts a new entry first time', () => {
    const next = recordCompilation(EMPTY_MANIFEST, compileResult, 'compiled/foo.md');
    expect(next.version).toBe(1);
    const rec = next.entries['compiled/foo.md'];
    expect(rec).toBeDefined();
    expect(rec.compiler).toBe('note-aggregator');
    expect(rec.sourceHash).toBe('composite-1');
    expect(rec.compiledHash).toBe('compiled-1');
    expect(rec.supersedes).toBeNull();
    expect(rec.emitted).toBe(true);
    expect(rec.history).toEqual([]);
    expect(rec.sources).toHaveLength(2);
    expect(rec.sources[0]).toMatchObject({ id: 'src-1', hash: 'h-src-1', title: 'One', type: 'note' });
    expect(typeof rec.compiledAt).toBe('string');
  });

  it('pushes prior state into history on subsequent record', () => {
    const first = recordCompilation(EMPTY_MANIFEST, compileResult, 'compiled/foo.md');
    const second = recordCompilation(first, {
      ...compileResult,
      sourceHash: 'composite-2',
      compiledHash: 'compiled-2',
    }, 'compiled/foo.md');
    const rec = second.entries['compiled/foo.md'];
    expect(rec.compiledHash).toBe('compiled-2');
    expect(rec.supersedes).toBe('compiled-1');
    expect(rec.history).toHaveLength(1);
    expect(rec.history[0]).toMatchObject({
      compiledHash: 'compiled-1',
      sourceHash: 'composite-1',
    });
  });

  it('caps history at 5 entries (ring buffer drops oldest)', () => {
    let m = EMPTY_MANIFEST;
    for (let i = 1; i <= 7; i++) {
      m = recordCompilation(m, {
        ...compileResult,
        sourceHash: `composite-${i}`,
        compiledHash: `compiled-${i}`,
      }, 'compiled/foo.md');
    }
    const rec = m.entries['compiled/foo.md'];
    expect(rec.compiledHash).toBe('compiled-7');
    expect(rec.history).toHaveLength(5);
    // Oldest two (compiled-1, compiled-2) should be dropped.
    const hashes = rec.history.map((h) => h.compiledHash);
    expect(hashes).toEqual(['compiled-2', 'compiled-3', 'compiled-4', 'compiled-5', 'compiled-6']);
  });
});

describe('findStale', () => {
  function buildManifest() {
    return {
      version: 1,
      entries: {
        'compiled/foo.md': {
          compiler: 'note-aggregator',
          sources: [
            { id: 'src-1', hash: 'h-1' },
            { id: 'src-2', hash: 'h-2' },
          ],
          sourceHash: 'composite',
          compiledHash: 'compiled-1',
          compiledAt: '2026-05-04T00:00:00.000Z',
          supersedes: null,
          emitted: true,
          history: [],
        },
      },
    };
  }

  it('returns empty array when nothing changed', () => {
    hashSourceEntry.mockImplementation((e) => (e.id === 'src-1' ? 'h-1' : 'h-2'));
    const current = [
      { id: 'src-1', notes: 'a' },
      { id: 'src-2', notes: 'b' },
    ];
    expect(findStale(buildManifest(), current)).toEqual([]);
  });

  it('flags source-changed when a source body hash drifts', () => {
    hashSourceEntry.mockImplementation((e) => (e.id === 'src-1' ? 'h-1-NEW' : 'h-2'));
    const current = [
      { id: 'src-1', notes: 'edited' },
      { id: 'src-2', notes: 'b' },
    ];
    const stale = findStale(buildManifest(), current);
    expect(stale).toHaveLength(1);
    expect(stale[0]).toMatchObject({
      compiledId: 'compiled/foo.md',
      reason: 'source-changed',
      staleSourceIds: ['src-1'],
    });
  });

  it('flags source-deleted when a source is missing from currentEntries', () => {
    hashSourceEntry.mockImplementation(() => 'h-2');
    const current = [{ id: 'src-2', notes: 'b' }];
    const stale = findStale(buildManifest(), current);
    expect(stale).toHaveLength(1);
    expect(stale[0]).toMatchObject({
      compiledId: 'compiled/foo.md',
      reason: 'source-deleted',
      staleSourceIds: ['src-1'],
    });
  });
});

describe('isCompiledEntry', () => {
  it('returns true for known id, false for unknown', () => {
    const m = recordCompilation(EMPTY_MANIFEST, {
      compiler: 'note-aggregator',
      sources: [],
      sourceHash: 's',
      compiledHash: 'c',
      emitted: true,
    }, 'compiled/foo.md');
    expect(isCompiledEntry(m, 'compiled/foo.md')).toBe(true);
    expect(isCompiledEntry(m, 'compiled/bar.md')).toBe(false);
    expect(isCompiledEntry(null, 'compiled/foo.md')).toBe(false);
  });
});
