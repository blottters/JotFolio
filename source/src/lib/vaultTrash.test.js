import { describe, expect, it, vi } from 'vitest';
import { moveToTrash, originalPathFromTrashPath, restoreFromTrash, trashPathFor } from './vaultTrash.js';

describe('vault trash helpers', () => {
  it('builds a hidden trash path that preserves the original relative path', () => {
    const path = trashPathFor('notes/My Note.md', {
      now: new Date('2026-05-03T12:34:56.789Z'),
      nonce: 'abc',
    });
    expect(path).toBe('.jotfolio/trash/2026-05-03T12-34-56-789Z-abc/notes/My Note.md');
  });

  it('creates the trash folder and moves the file', async () => {
    const adapter = {
      mkdir: vi.fn(async () => {}),
      move: vi.fn(async () => {}),
    };
    const target = await moveToTrash(adapter, 'bases/base-1.base.json', {
      now: new Date('2026-05-03T00:00:00.000Z'),
      nonce: 'n1',
    });
    expect(target).toBe('.jotfolio/trash/2026-05-03T00-00-00-000Z-n1/bases/base-1.base.json');
    expect(adapter.mkdir).toHaveBeenCalledWith('.jotfolio/trash/2026-05-03T00-00-00-000Z-n1/bases');
    expect(adapter.move).toHaveBeenCalledWith('bases/base-1.base.json', target);
  });

  it('restores a trashed file to its original path', async () => {
    const adapter = {
      mkdir: vi.fn(async () => {}),
      read: vi.fn(async () => {
        const err = new Error('not found');
        err.code = 'not-found';
        throw err;
      }),
      move: vi.fn(async () => {}),
    };
    const trashPath = '.jotfolio/trash/2026-05-03T00-00-00-000Z-n1/notes/Old.md';
    expect(originalPathFromTrashPath(trashPath)).toBe('notes/Old.md');
    await expect(restoreFromTrash(adapter, trashPath)).resolves.toBe('notes/Old.md');
    expect(adapter.read).toHaveBeenCalledWith('notes/Old.md');
    expect(adapter.mkdir).toHaveBeenCalledWith('notes');
    expect(adapter.move).toHaveBeenCalledWith(trashPath, 'notes/Old.md');
  });

  it('refuses to restore over an existing destination file', async () => {
    const adapter = {
      mkdir: vi.fn(async () => {}),
      read: vi.fn(async () => '# newer note'),
      move: vi.fn(async () => {}),
    };
    const trashPath = '.jotfolio/trash/2026-05-03T00-00-00-000Z-n1/notes/Old.md';
    await expect(restoreFromTrash(adapter, trashPath)).rejects.toThrow('destination exists: notes/Old.md');
    expect(adapter.move).not.toHaveBeenCalled();
  });
});
