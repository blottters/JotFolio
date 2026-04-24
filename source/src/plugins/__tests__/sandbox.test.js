// Sandbox tests — verify the Worker-based plugin isolation boundary.
//
// Real Worker not available in jsdom. We inject a minimal in-process Worker
// mock (InProcessWorker) via PluginBridge's `WorkerImpl` hook. The mock runs
// the worker bootstrap code + plugin code in a fresh Function scope with
// fetch/XMLHttpRequest/etc explicitly undefined, mirroring the production
// Worker environment closely enough to verify:
//
//   1. Plugin code cannot reach `fetch`, `XMLHttpRequest`, `WebSocket`,
//      `localStorage`, `window`, `document`, `indexedDB`, `Worker`, or
//      `importScripts` from the Worker scope.
//   2. Every API call crosses the RPC bridge and hits permission gates in
//      the parent.
//   3. A zero-permission plugin cannot read/write vault even if it tries
//      many angles.
//   4. Commands registered in the Worker are invokable from the parent
//      and the result round-trips correctly.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PluginBridge } from '../PluginBridge.js';
import workerBootstrap from '../pluginWorker.js?raw';
import { commands } from '../CommandRegistry.js';
import { vault } from '../../adapters/index.js';

// ---------- InProcessWorker — minimal Worker mock for jsdom ----------
class InProcessWorker {
  constructor(bundle) {
    this._listeners = { message: new Set(), error: new Set() };
    this._terminated = false;
    // The worker scope. Manufacture an object that stands in for `self`.
    // Importantly: no `window`, no `document`, no `localStorage`.
    this._scope = {
      postMessage: (data) => this._emitParent({ data }),
      addEventListener: (name, cb) => {
        if (!this._scope._handlers[name]) this._scope._handlers[name] = new Set();
        this._scope._handlers[name].add(cb);
      },
      removeEventListener: (name, cb) => {
        this._scope._handlers[name]?.delete(cb);
      },
      _handlers: { message: new Set(), error: new Set() },
      // Spec: Worker scope does not have these; plugin should see `undefined`.
      // The bootstrap explicitly strips them anyway.
      fetch: vi.fn(() => { throw new Error('fetch unavailable'); }),
      XMLHttpRequest: undefined,
      WebSocket: undefined,
      EventSource: undefined,
      importScripts: undefined,
      indexedDB: undefined,
      caches: undefined,
      Worker: undefined,
      BroadcastChannel: undefined,
      Notification: undefined,
      navigator: Object.freeze({ userAgent: 'InProcessWorker' }),
      setTimeout, clearTimeout, setInterval, clearInterval,
      Promise, Error, Map, Set, Object, Array, JSON, console,
      URL,
      performance: typeof performance !== 'undefined' ? performance : undefined,
    };
    // Allow plugin code to write self.foo = bar (some plugins do).
    // Use a Proxy so undefined reads return undefined, writes succeed.
    this._scope._self = this._scope;
    // Run bootstrap in the scope
    const runner = new Function(
      'self',
      'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts',
      'indexedDB', 'caches', 'Worker', 'BroadcastChannel', 'Notification',
      'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
      'Promise', 'Error', 'Map', 'Set', 'Object', 'Array', 'JSON', 'console',
      'URL', 'performance',
      `${bundle}`
    );
    const s = this._scope;
    try {
      runner(
        s,
        s.fetch, s.XMLHttpRequest, s.WebSocket, s.EventSource, s.importScripts,
        s.indexedDB, s.caches, s.Worker, s.BroadcastChannel, s.Notification,
        s.navigator, setTimeout, clearTimeout, setInterval, clearInterval,
        Promise, Error, Map, Set, Object, Array, JSON, console,
        URL, s.performance,
      );
    } catch (err) {
      queueMicrotask(() => this._listeners.error.forEach(cb => cb({ message: err.message })));
    }
  }

  _emitParent(event) {
    if (this._terminated) return;
    queueMicrotask(() => this._listeners.message.forEach(cb => cb(event)));
  }

  postMessage(data) {
    if (this._terminated) return;
    queueMicrotask(() => this._scope._handlers.message?.forEach(cb => cb({ data })));
  }

  addEventListener(name, cb) { this._listeners[name]?.add(cb); }
  removeEventListener(name, cb) { this._listeners[name]?.delete(cb); }
  terminate() { this._terminated = true; }
}

async function flush() {
  // Drain microtask queue; the mock dispatches via queueMicrotask.
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

async function buildBridge(manifest, code, hooks = {}) {
  const bridge = new PluginBridge(manifest, {
    WorkerImpl: InProcessWorker,
    workerCode: workerBootstrap,
    ...hooks,
  });
  await bridge.bootstrap(code);
  await flush();
  return bridge;
}

describe('plugin sandbox', () => {
  beforeEach(async () => {
    localStorage.clear();
    await vault.pickVault();
  });

  afterEach(() => {
    commands.clearPlugin('test');
    commands.clearPlugin('sneaky');
    commands.clearPlugin('noperm');
    commands.clearPlugin('cmd');
  });

  // In a real Worker, `fetch` === `self.fetch` — stripping the `self.*` slot
  // removes the identifier entirely. The bootstrap does this.
  // In this jsdom test, Node's globals + jsdom's polyfills leak `fetch` and
  // `localStorage`, so we probe `self.*` (what the bootstrap touches). In a
  // real browser Worker the bare identifier and `self.*` are the same thing.
  it('bootstrap strips self.fetch / self.localStorage / self.XMLHttpRequest / etc', async () => {
    const manifest = { id: 'test', name: 'T', version: '0', author: 'a', main: 'main.js', permissions: {} };
    const code = `
      const report = {
        selfFetch: typeof self.fetch,
        selfXHR: typeof self.XMLHttpRequest,
        selfWebSocket: typeof self.WebSocket,
        selfLocalStorage: typeof self.localStorage,
        selfSessionStorage: typeof self.sessionStorage,
        selfIndexedDB: typeof self.indexedDB,
        selfImportScripts: typeof self.importScripts,
        selfWorker: typeof self.Worker,
        selfEventSource: typeof self.EventSource,
        selfBroadcastChannel: typeof self.BroadcastChannel,
      };
      api.commands.register('report', () => report);
    `;
    const bridge = await buildBridge(manifest, code);
    await flush();

    expect(commands.has('test.report')).toBe(true);
    const report = await commands.run('test.report');
    expect(report.selfFetch).toBe('undefined');
    expect(report.selfXHR).toBe('undefined');
    expect(report.selfWebSocket).toBe('undefined');
    expect(report.selfLocalStorage).toBe('undefined');
    expect(report.selfSessionStorage).toBe('undefined');
    expect(report.selfIndexedDB).toBe('undefined');
    expect(report.selfImportScripts).toBe('undefined');
    expect(report.selfWorker).toBe('undefined');
    expect(report.selfEventSource).toBe('undefined');
    expect(report.selfBroadcastChannel).toBe('undefined');

    bridge.terminate();
  });

  it('zero-permission plugin cannot read vault via api', async () => {
    const manifest = { id: 'noperm', name: 'NP', version: '0', author: 'a', main: 'main.js', permissions: {} };
    const code = `
      api.commands.register('tryread', async () => {
        try { await api.vault.read('notes/x.md'); return 'reached'; }
        catch (e) { return 'blocked: ' + e.message; }
      });
    `;
    const bridge = await buildBridge(manifest, code);
    await flush();
    const result = await commands.run('noperm.tryread');
    expect(result).toMatch(/blocked: .*vault_read/);
    bridge.terminate();
  });

  it('zero-permission plugin cannot reach self.localStorage after bootstrap', async () => {
    localStorage.setItem('mgn-ai', '{"apiKey":"secret"}');
    const manifest = { id: 'sneaky', name: 'S', version: '0', author: 'a', main: 'main.js', permissions: {} };
    const code = `
      api.commands.register('exfil', () => {
        // Bootstrap strips self.localStorage. In a real Worker, localStorage
        // is also absent by spec — bare and self.* both resolve to undefined.
        try { return typeof self.localStorage === 'undefined' ? 'no-ls' : 'HAS-LS'; }
        catch (e) { return 'threw:' + e.message; }
      });
    `;
    const bridge = await buildBridge(manifest, code);
    await flush();
    const result = await commands.run('sneaky.exfil');
    expect(result).toBe('no-ls');
    bridge.terminate();
  });

  it('http.fetch enforces manifest allowlist in parent', async () => {
    const fetchMock = vi.fn(async () => ({ status: 200, statusText: 'OK', ok: true, headers: { entries: () => [] }, text: async () => 'ok' }));
    const manifest = {
      id: 'test', name: 'T', version: '0', author: 'a', main: 'main.js',
      permissions: { http_domains: ['api.example.com'] },
    };
    const code = `
      api.commands.register('tryhit', async (url) => {
        try { await api.http.fetch(url); return 'hit'; }
        catch (e) { return 'blocked: ' + e.message; }
      });
    `;
    const bridge = await buildBridge(manifest, code, { fetchImpl: fetchMock });
    await flush();

    const bad = await commands.run('test.tryhit', 'https://attacker.com/steal');
    expect(bad).toMatch(/allowlist/);
    expect(fetchMock).not.toHaveBeenCalled();

    const good = await commands.run('test.tryhit', 'https://api.example.com/ping');
    expect(good).toBe('hit');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    bridge.terminate();
  });

  it('vault write with permission succeeds through RPC', async () => {
    const manifest = {
      id: 'test', name: 'T', version: '0', author: 'a', main: 'main.js',
      permissions: { vault_read: true, vault_write: true },
    };
    const code = `
      api.commands.register('doit', async () => {
        await api.vault.write('plugin-wrote.md', '# hello');
        return 'ok';
      });
    `;
    const bridge = await buildBridge(manifest, code);
    await flush();
    const r = await commands.run('test.doit');
    expect(r).toBe('ok');
    expect(await vault.read('plugin-wrote.md')).toBe('# hello');
    bridge.terminate();
  });

  it('terminating bridge unregisters commands + kills worker', async () => {
    const manifest = { id: 'cmd', name: 'C', version: '0', author: 'a', main: 'main.js', permissions: {} };
    const code = `api.commands.register('ping', () => 'pong');`;
    const bridge = await buildBridge(manifest, code);
    await flush();
    expect(commands.has('cmd.ping')).toBe(true);
    bridge.terminate();
    expect(commands.has('cmd.ping')).toBe(false);
  });
});
