import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VaultError } from '../../adapters/VaultError.js';

const mockVault = vi.hoisted(() => ({
  getVaultPath: vi.fn(),
  list: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  mkdir: vi.fn(),
  move: vi.fn(),
  remove: vi.fn(),
  watch: vi.fn(),
}));

vi.mock('../../adapters/index.js', () => ({
  vault: mockVault,
}));

import { useVault } from './useVault.js';

describe('useVault saveEntry', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mockVault.getVaultPath.mockReturnValue('local://vault');
    mockVault.list.mockResolvedValue([
      { path: 'notes/Old.md', name: 'Old.md', folder: 'notes', size: 1, mtime: 1 },
    ]);
    mockVault.read.mockResolvedValue(`---
id: id-1
type: note
title: Old
---
Body`);
    mockVault.watch.mockReturnValue(() => {});
  });

  it('keeps the old file when a rename write fails', async () => {
    mockVault.write.mockRejectedValue(new VaultError('disk-full', 'full'));
    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    await expect(act(() => result.current.saveEntry({
      ...result.current.entries[0],
      title: 'New',
    }))).rejects.toMatchObject({ code: 'disk-full' });

    expect(mockVault.write).toHaveBeenCalledWith('notes/New.md', expect.any(String));
    expect(mockVault.remove).not.toHaveBeenCalled();
  });

  it('writes the new path before removing the old path during rename', async () => {
    mockVault.write.mockResolvedValue(undefined);
    mockVault.remove.mockResolvedValue(undefined);
    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    await act(() => result.current.saveEntry({
      ...result.current.entries[0],
      title: 'New',
    }));

    expect(mockVault.write).toHaveBeenCalledWith('notes/New.md', expect.any(String));
    expect(mockVault.remove).toHaveBeenCalledWith('notes/Old.md');
    expect(mockVault.write.mock.invocationCallOrder[0]).toBeLessThan(mockVault.remove.mock.invocationCallOrder[0]);
  });

  it('moves deleted entries to JotFolio Trash instead of permanently removing them', async () => {
    mockVault.mkdir.mockResolvedValue(undefined);
    mockVault.move.mockResolvedValue(undefined);
    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    await act(() => result.current.deleteEntry('id-1'));

    const target = mockVault.move.mock.calls[0][1];
    expect(target).toMatch(/^\.jotfolio\/trash\/[^/]+\/notes\/Old\.md$/);
    expect(mockVault.mkdir).toHaveBeenCalledWith(target.slice(0, target.lastIndexOf('/')));
    expect(mockVault.move).toHaveBeenCalledWith('notes/Old.md', target);
    expect(mockVault.remove).not.toHaveBeenCalled();
    expect(result.current.entries).toHaveLength(0);
  });

  it('batch saves with the same title suffix their paths — no overwrite', async () => {
    mockVault.list.mockResolvedValue([]); // start empty
    mockVault.write.mockResolvedValue(undefined);
    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Fire 3 saves in one tick — all with the same title. Before the fix,
    // each read stale `entries` and saw only the original set; all three
    // wrote to "notes/Dup.md" → silent overwrite.
    await act(async () => {
      await Promise.all([
        result.current.saveEntry({ id: 'a', type: 'note', title: 'Dup', tags: [], notes: '', links: [] }),
        result.current.saveEntry({ id: 'b', type: 'note', title: 'Dup', tags: [], notes: '', links: [] }),
        result.current.saveEntry({ id: 'c', type: 'note', title: 'Dup', tags: [], notes: '', links: [] }),
      ]);
    });

    const writtenPaths = mockVault.write.mock.calls.map(c => c[0]).sort();
    expect(writtenPaths).toEqual(['notes/Dup-2.md', 'notes/Dup-3.md', 'notes/Dup.md']);
  });

  it('skips .jotfolio/** files during refresh (finding #9)', async () => {
    // Before fix: refresh() parsed every file including plugin manifests +
    // settings, producing false "Invalid frontmatter" issues after any
    // plugin install. Fix: skip .jotfolio/** entirely.
    mockVault.list.mockResolvedValue([
      { path: 'notes/Real.md', name: 'Real.md', folder: 'notes', size: 10, mtime: 1 },
      { path: '.jotfolio/plugins/daily-notes/manifest.json', name: 'manifest.json', folder: '.jotfolio/plugins/daily-notes', size: 100, mtime: 1 },
      { path: '.jotfolio/plugins/daily-notes/main.js', name: 'main.js', folder: '.jotfolio/plugins/daily-notes', size: 200, mtime: 1 },
      { path: '.jotfolio/settings/plugins.json', name: 'plugins.json', folder: '.jotfolio/settings', size: 40, mtime: 1 },
      { path: '.jotfolio/sync.log', name: 'sync.log', folder: '.jotfolio', size: 80, mtime: 1 },
      { path: 'attachment.png', name: 'attachment.png', folder: '', size: 5000, mtime: 1 }, // non-md, skip
    ]);
    mockVault.read.mockImplementation(async (p) => {
      if (p === 'notes/Real.md') {
        return `---\nid: r1\ntype: note\ntitle: Real\n---\nBody`;
      }
      throw new Error('refresh tried to read a path it should have skipped: ' + p);
    });
    const { result } = renderHook(() => useVault());
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.issues).toHaveLength(0);
    expect(result.current.entries[0].title).toBe('Real');
    // Assert no read was attempted on .jotfolio/** or attachment.png
    const readPaths = mockVault.read.mock.calls.map(c => c[0]);
    expect(readPaths).toEqual(['notes/Real.md']);
  });

  it('does not overwrite a path belonging to a file whose frontmatter failed to parse', async () => {
    // Simulate: refresh finds one healthy file + one broken file at `notes/Broken.md`.
    mockVault.list.mockResolvedValue([
      { path: 'notes/Old.md', name: 'Old.md', folder: 'notes', size: 1, mtime: 1 },
      { path: 'notes/Broken.md', name: 'Broken.md', folder: 'notes', size: 1, mtime: 1 },
    ]);
    mockVault.read.mockImplementation(async (p) => {
      if (p === 'notes/Old.md') {
        return `---\nid: id-1\ntype: note\ntitle: Old\n---\nBody`;
      }
      if (p === 'notes/Broken.md') {
        // Unclosed frontmatter → fileToEntry throws, refresh records it in issues.
        return `---\ntitle: Broken\n(never closes)`;
      }
      throw new Error('unexpected read: ' + p);
    });
    mockVault.write.mockResolvedValue(undefined);

    const { result } = renderHook(() => useVault());
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.issues).toHaveLength(1);
    expect(result.current.issues[0].path).toBe('notes/Broken.md');

    // User creates a new note titled "Broken" — it must NOT overwrite the
    // existing Broken.md which we couldn't parse. Expected: suffixed.
    await act(() => result.current.saveEntry({
      id: 'new-1', type: 'note', title: 'Broken', tags: [], notes: '', links: [],
    }));

    const writtenPaths = mockVault.write.mock.calls.map(c => c[0]);
    expect(writtenPaths).not.toContain('notes/Broken.md');
    expect(writtenPaths.some(p => p.startsWith('notes/Broken-'))).toBe(true);
  });
});
