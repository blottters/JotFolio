import { describe, it, expect, vi } from 'vitest';
import { createCommandRegistry, rankCommands } from './commandRegistry.js';

const sample = (id, over = {}) => ({
  id,
  name: id,
  run: () => {},
  ...over,
});

describe('createCommandRegistry', () => {
  it('registers, lists, and gets commands', () => {
    const r = createCommandRegistry();
    r.register(sample('a'));
    r.register(sample('b', { name: 'B Cmd' }));
    expect(r.list().map(c => c.id).sort()).toEqual(['a', 'b']);
    expect(r.get('b').name).toBe('B Cmd');
    expect(r.has('a')).toBe(true);
    expect(r.has('z')).toBe(false);
  });

  it('rejects malformed commands', () => {
    const r = createCommandRegistry();
    expect(() => r.register(null)).toThrow(/object/);
    expect(() => r.register({})).toThrow(/id/);
    expect(() => r.register({ id: 'x' })).toThrow(/name/);
    expect(() => r.register({ id: 'x', name: 'X' })).toThrow(/run/);
  });

  it('register returns a disposer that removes the command', () => {
    const r = createCommandRegistry();
    const dispose = r.register(sample('a'));
    expect(r.has('a')).toBe(true);
    dispose();
    expect(r.has('a')).toBe(false);
    // disposer is idempotent
    expect(() => dispose()).not.toThrow();
  });

  it('disposer does not delete a re-registered command with same id', () => {
    const r = createCommandRegistry();
    const dispose = r.register(sample('a'));
    r.register(sample('a', { name: 'replaced' }));
    dispose();
    // The original disposer must NOT delete the replacement.
    expect(r.has('a')).toBe(true);
    expect(r.get('a').name).toBe('replaced');
  });

  it('execute runs the command function with ctx', async () => {
    const r = createCommandRegistry();
    const run = vi.fn();
    r.register({ id: 'x', name: 'X', run });
    await r.execute('x', { foo: 1 });
    expect(run).toHaveBeenCalledWith({ foo: 1 });
  });

  it('execute throws unknown-command for missing id', async () => {
    const r = createCommandRegistry();
    await expect(r.execute('nope')).rejects.toMatchObject({ code: 'unknown-command' });
  });

  it('subscribe fires on register, unregister, and clear', () => {
    const r = createCommandRegistry();
    const fn = vi.fn();
    const unsub = r.subscribe(fn);
    r.register(sample('a'));
    r.unregister('a');
    r.register(sample('b'));
    r.clear();
    expect(fn).toHaveBeenCalledTimes(4);
    unsub();
    r.register(sample('c'));
    expect(fn).toHaveBeenCalledTimes(4); // no further calls after unsub
  });

  it('clear is a no-op when empty', () => {
    const r = createCommandRegistry();
    const fn = vi.fn();
    r.subscribe(fn);
    r.clear();
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('rankCommands', () => {
  const cmds = [
    { id: 'a', name: 'Create note', section: 'Notes', keywords: ['new', 'add'] },
    { id: 'b', name: 'Open graph', section: 'View', keywords: ['constellation', 'graph'] },
    { id: 'c', name: 'Toggle theme', section: 'View', keywords: ['dark', 'light'] },
    { id: 'd', name: 'Rebuild metadata cache', section: 'Index', keywords: ['reindex'] },
    { id: 'e', name: 'Search notes', section: 'Search', keywords: ['find'] },
  ];

  it('returns all commands sorted by section/name when query is empty', () => {
    const ranked = rankCommands(cmds, '');
    expect(ranked).toHaveLength(5);
    expect(ranked[0].section).toBe('Index'); // alphabetical sections
  });

  it('exact name match outranks partial', () => {
    const ranked = rankCommands(cmds, 'create note');
    expect(ranked[0].id).toBe('a');
  });

  it('keyword match returns the command', () => {
    const ranked = rankCommands(cmds, 'reindex');
    expect(ranked[0].id).toBe('d');
  });

  it('subsequence match catches typos', () => {
    const ranked = rankCommands(cmds, 'crtnt');
    expect(ranked.map(c => c.id)).toContain('a');
  });

  it('returns empty array when no command matches', () => {
    expect(rankCommands(cmds, 'zzzzz')).toEqual([]);
  });
});
