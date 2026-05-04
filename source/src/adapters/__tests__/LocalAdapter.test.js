import { describe, it, expect, beforeEach } from 'vitest';
import { LocalAdapter } from '../LocalAdapter.js';
import { VaultError } from '../VaultError.js';

describe('LocalAdapter', () => {
  beforeEach(() => {
    localStorage.removeItem('jf-vault-local');
  });

  it('pickVault marks vault as picked and returns a VaultInfo', async () => {
    const v = new LocalAdapter();
    expect(v.getVaultPath()).toBe(null);
    const info = await v.pickVault();
    expect(info.path).toBe('local://vault');
    expect(v.getVaultPath()).toBe('local://vault');
  });

  it('write then read round-trips content', async () => {
    const v = new LocalAdapter();
    await v.write('notes/hello.md', '# Hello\nBody.');
    const back = await v.read('notes/hello.md');
    expect(back).toBe('# Hello\nBody.');
  });

  it('throws corrupt-vault for invalid stored JSON', async () => {
    localStorage.setItem('jf-vault-local', '{broken');
    const v = new LocalAdapter();

    await expect(v.list()).rejects.toMatchObject({
      name: 'VaultError',
      code: 'corrupt-vault',
    });
  });

  it('does not overwrite raw corrupt vault data on write', async () => {
    localStorage.setItem('jf-vault-local', '{broken');
    const v = new LocalAdapter();

    await expect(v.write('notes/new.md', 'new')).rejects.toMatchObject({ code: 'corrupt-vault' });
    expect(localStorage.getItem('jf-vault-local')).toBe('{broken');
  });

  it('list returns files with name + folder + mtime', async () => {
    const v = new LocalAdapter();
    await v.write('notes/a.md', 'a');
    await v.write('notes/sub/b.md', 'b');
    const files = await v.list();
    expect(files).toHaveLength(2);
    const a = files.find(f => f.path === 'notes/a.md');
    expect(a.name).toBe('a.md');
    expect(a.folder).toBe('notes');
    expect(a.size).toBe(1);
    expect(a.mtime).toBeGreaterThan(0);
  });

  it('mkdir persists empty folders and emits a folder create event', async () => {
    const v = new LocalAdapter();
    const events = [];
    v.watch(e => events.push(e));

    await v.mkdir('notes/projects');
    const files = await v.list();
    const folder = files.find(f => f.path === 'notes/projects');

    expect(folder).toMatchObject({
      path: 'notes/projects',
      name: 'projects',
      folder: 'notes',
      size: 0,
      type: 'folder',
    });
    expect(folder.mtime).toBeGreaterThan(0);
    expect(events).toContainEqual({ type: 'create', path: 'notes/projects', itemType: 'folder' });
  });

  it('read on missing path throws VaultError("not-found")', async () => {
    const v = new LocalAdapter();
    await expect(v.read('missing.md')).rejects.toMatchObject({
      name: 'VaultError',
      code: 'not-found',
    });
  });

  it('move renames and triggers delete + create events', async () => {
    const v = new LocalAdapter();
    await v.write('notes/old.md', 'x');
    const events = [];
    v.watch(e => events.push(e));
    await v.move('notes/old.md', 'notes/new.md');
    expect(events.some(e => e.type === 'delete' && e.path === 'notes/old.md')).toBe(true);
    expect(events.some(e => e.type === 'create' && e.path === 'notes/new.md')).toBe(true);
    expect(await v.read('notes/new.md')).toBe('x');
  });

  it('remove deletes file and emits delete event', async () => {
    const v = new LocalAdapter();
    await v.write('notes/a.md', 'a');
    const events = [];
    v.watch(e => events.push(e));
    await v.remove('notes/a.md');
    expect(events).toContainEqual({ type: 'delete', path: 'notes/a.md' });
    await expect(v.read('notes/a.md')).rejects.toMatchObject({ code: 'not-found' });
  });

  it('rmdir removes empty folder shells but refuses folders with files', async () => {
    const v = new LocalAdapter();
    await v.mkdir('notes/projects');
    await v.mkdir('notes/projects/archive');
    await v.write('notes/projects/a.md', 'a');

    await expect(v.rmdir('notes/projects')).rejects.toMatchObject({ code: 'not-empty' });

    await v.remove('notes/projects/a.md');
    await v.rmdir('notes/projects');
    const files = await v.list();
    expect(files.some(f => f.path === 'notes/projects')).toBe(false);
    expect(files.some(f => f.path === 'notes/projects/archive')).toBe(false);
  });

  it('rejects path traversal', async () => {
    const v = new LocalAdapter();
    await expect(v.write('../etc/passwd', 'nope')).rejects.toMatchObject({ code: 'path-traversal' });
    await expect(v.read('../../foo')).rejects.toMatchObject({ code: 'path-traversal' });
  });

  it('rejects drive letters + backslashes + absolute paths', async () => {
    const v = new LocalAdapter();
    await expect(v.write('C:/evil.md', 'x')).rejects.toMatchObject({ code: 'invalid-path' });
    await expect(v.write('notes\\bad.md', 'x')).rejects.toMatchObject({ code: 'invalid-path' });
    await expect(v.write('/abs.md', 'x')).rejects.toMatchObject({ code: 'invalid-path' });
  });

  it('write rejects non-string content', async () => {
    const v = new LocalAdapter();
    await expect(v.write('notes/x.md', { obj: true })).rejects.toMatchObject({ code: 'invalid-path' });
    await expect(v.write('notes/x.md', 123)).rejects.toMatchObject({ code: 'invalid-path' });
    await expect(v.write('notes/x.md', null)).rejects.toMatchObject({ code: 'invalid-path' });
    await expect(v.write('notes/x.md', undefined)).rejects.toMatchObject({ code: 'invalid-path' });
    // Confirm the store wasn't touched.
    await expect(v.read('notes/x.md')).rejects.toMatchObject({ code: 'not-found' });
  });

  it('writeBinary rejects non-Uint8Array payloads', async () => {
    const v = new LocalAdapter();
    await expect(v.writeBinary('notes/x.md', 'a string')).rejects.toMatchObject({ code: 'invalid-path' });
    await expect(v.writeBinary('notes/x.md', [1, 2, 3])).rejects.toMatchObject({ code: 'invalid-path' });
  });

  it('unsubscribe stops receiving events', async () => {
    const v = new LocalAdapter();
    const events = [];
    const off = v.watch(e => events.push(e));
    await v.write('a.md', 'a');
    off();
    await v.write('b.md', 'b');
    expect(events.map(e => e.path)).toEqual(['a.md']);
  });

  it('VaultError is identifiable after JSON round-trip', () => {
    const err = new VaultError('not-found', 'nope');
    const json = err.toJSON();
    const back = VaultError.fromJSON(json);
    expect(VaultError.is(back)).toBe(true);
    expect(back.code).toBe('not-found');
  });
});
