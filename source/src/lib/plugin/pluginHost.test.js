import { describe, it, expect, vi } from 'vitest';
import { createPluginHost } from './pluginHost.js';

function makeAppContext(over = {}) {
  const commands = new Map();
  const panels = new Map();
  return {
    registerCommand(cmd) {
      commands.set(cmd.id, cmd);
      return () => commands.delete(cmd.id);
    },
    registerPanel(panel) {
      panels.set(panel.id, panel);
      return () => panels.delete(panel.id);
    },
    toast: vi.fn(),
    onOpenEntry: vi.fn(),
    getEntries: () => [{ id: 'e1', title: 'A', notes: 'one two three' }],
    _commands: commands,
    _panels: panels,
    ...over,
  };
}

describe('createPluginHost', () => {
  it('throws when no appContext is provided', () => {
    const host = createPluginHost();
    host.load({ id: 'p', name: 'P', activate(){} });
    expect(() => host.activate('p')).toThrow(/appContext/);
  });

  it('rejects malformed plugins', () => {
    const host = createPluginHost({ appContext: makeAppContext() });
    expect(() => host.load(null)).toThrow(/object/);
    expect(() => host.load({})).toThrow(/id/);
    expect(() => host.load({ id: 'x' })).toThrow(/name/);
  });

  it('activate calls plugin.activate with a frozen context', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    let received;
    host.load({
      id: 'p', name: 'P',
      activate(c) { received = c; return { internal: 1 }; },
    });
    const state = host.activate('p');
    expect(state).toEqual({ internal: 1 });
    expect(received.pluginId).toBe('p');
    expect(Object.isFrozen(received)).toBe(true);
    expect(typeof received.registerCommand).toBe('function');
    expect(typeof received.registerPanel).toBe('function');
  });

  it('plugin can register a command via context, host removes it on deactivate', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    host.load({
      id: 'wc', name: 'Word Count',
      activate(c) { c.registerCommand({ id: 'count', name: 'Count words', run: () => {} }); },
    });
    host.activate('wc');
    expect(ctx._commands.has('wc:count')).toBe(true); // namespaced
    host.deactivate('wc');
    expect(ctx._commands.has('wc:count')).toBe(false);
  });

  it('plugin can register a panel via context, host removes it on deactivate', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    host.load({
      id: 'wc', name: 'Word Count',
      activate(c) { c.registerPanel({ id: 'totals', label: 'Totals', render: () => null }); },
    });
    host.activate('wc');
    expect(ctx._panels.has('wc:totals')).toBe(true);
    host.deactivate('wc');
    expect(ctx._panels.has('wc:totals')).toBe(false);
  });

  it('activate is idempotent for an already-active plugin', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    const activate = vi.fn(() => ({ count: 1 }));
    host.load({ id: 'p', name: 'P', activate });
    host.activate('p');
    host.activate('p');
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it('throws unknown-plugin for missing id', () => {
    const host = createPluginHost({ appContext: makeAppContext() });
    expect(() => host.activate('nope')).toThrow(/Unknown plugin/);
  });

  it('rolls back partial registrations if activate throws', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    host.load({
      id: 'p', name: 'P',
      activate(c) {
        c.registerCommand({ id: 'c', name: 'C', run: () => {} });
        throw new Error('boom');
      },
    });
    expect(() => host.activate('p')).toThrow(/boom/);
    expect(ctx._commands.has('p:c')).toBe(false); // rolled back
    expect(host.isActive('p')).toBe(false);
  });

  it('host runs disposers even if plugin.deactivate throws', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    host.load({
      id: 'p', name: 'P',
      activate(c) { c.registerCommand({ id: 'c', name: 'C', run: () => {} }); },
      deactivate() { throw new Error('cleanup boom'); },
    });
    host.activate('p');
    expect(ctx._commands.has('p:c')).toBe(true);
    expect(() => host.deactivate('p')).not.toThrow();
    expect(ctx._commands.has('p:c')).toBe(false);
    expect(host.isActive('p')).toBe(false);
  });

  it('unload deactivates first if plugin is active', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    host.load({
      id: 'p', name: 'P',
      activate(c) { c.registerCommand({ id: 'c', name: 'C', run: () => {} }); },
    });
    host.activate('p');
    host.unload('p');
    expect(ctx._commands.has('p:c')).toBe(false);
    expect(host.has('p')).toBe(false);
  });

  it('plugin context cannot be mutated to escape its sandbox', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    let escapeAttempt;
    host.load({
      id: 'evil', name: 'E',
      activate(c) {
        escapeAttempt = c;
        // Frozen context — assigning new properties is silently dropped
        // in non-strict mode and throws in strict. Either way it fails.
        try { c.appCtx = ctx; } catch { /* expected */ }
        try { c.registerCommand = () => 'hijacked'; } catch { /* expected */ }
      },
    });
    host.activate('evil');
    expect(escapeAttempt.appCtx).toBeUndefined();
    // registerCommand is still the original wrapper, not the hijacked stub
    const ret = escapeAttempt.registerCommand({ id: 'x', name: 'X', run: () => {} });
    expect(typeof ret).toBe('function'); // disposer, not 'hijacked' string
  });

  it('subscribe fires on load, activate, deactivate, unload', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    const fn = vi.fn();
    const unsub = host.subscribe(fn);
    host.load({ id: 'p', name: 'P', activate(){} });
    host.activate('p');
    host.deactivate('p');
    host.unload('p');
    expect(fn).toHaveBeenCalledTimes(4);
    unsub();
    host.load({ id: 'q', name: 'Q', activate(){} });
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('getEntries returns a fresh copy each call (cannot mutate host state)', () => {
    const ctx = makeAppContext();
    const host = createPluginHost({ appContext: ctx });
    let evil;
    host.load({
      id: 'p', name: 'P',
      activate(c) { evil = c.getEntries(); },
    });
    host.activate('p');
    evil.push({ id: 'injected' });
    // Next call must NOT see the injected entry
    let again;
    host.unload('p');
    host.load({
      id: 'q', name: 'Q',
      activate(c) { again = c.getEntries(); },
    });
    host.activate('q');
    expect(again.find(e => e.id === 'injected')).toBeUndefined();
  });
});
