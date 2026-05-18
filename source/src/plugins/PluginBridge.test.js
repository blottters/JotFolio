import { describe, it, expect, vi } from 'vitest';
import { PluginBridge } from './PluginBridge.js';

// A scriptable fake Worker: tests push messages from the "worker side" by
// calling worker._emit(msg). Posts from parent land in worker.posted[].
class FakeWorker {
  constructor() {
    this._listeners = new Map();
    this.posted = [];
    this.terminated = false;
  }
  addEventListener(type, cb) {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type).add(cb);
  }
  removeEventListener(type, cb) {
    this._listeners.get(type)?.delete(cb);
  }
  postMessage(msg) { this.posted.push(msg); }
  terminate() { this.terminated = true; }
  _emit(msg) {
    const set = this._listeners.get('message');
    if (!set) return;
    [...set].forEach(cb => cb({ data: msg }));
  }
}

// Make a Worker-shaped constructor that exposes the most recently constructed
// instance via `.last`. PluginBridge calls `new WorkerImpl(code, opts)`.
function makeWorkerImpl() {
  const holder = { last: null };
  function Ctor() { const w = new FakeWorker(); holder.last = w; return w; }
  holder.Ctor = Ctor;
  return holder;
}

describe('PluginBridge', () => {
  it('bootstrap posts a bootstrap message and resolves on bootstrap:ok', async () => {
    const h = makeWorkerImpl();
    const bridge = new PluginBridge(
      { id: 'p1', permissions: {} },
      { WorkerImpl: h.Ctor, workerCode: '/* test worker code */' }
    );
    const boot = bridge.bootstrap('console.log("hi")');
    const fake = h.last;
    expect(fake.posted[0]).toMatchObject({ kind: 'bootstrap', pluginId: 'p1' });
    fake._emit({ kind: 'bootstrap:ok' });
    await expect(boot).resolves.toBeUndefined();
    bridge.terminate();
    expect(fake.terminated).toBe(true);
  });

  it('bootstrap rejects when worker reports bootstrap:error', async () => {
    const h = makeWorkerImpl();
    const bridge = new PluginBridge(
      { id: 'p1', permissions: {} },
      { WorkerImpl: h.Ctor, workerCode: '/* */' }
    );
    const boot = bridge.bootstrap('// code');
    h.last._emit({ kind: 'bootstrap:error', error: 'syntax bad' });
    await expect(boot).rejects.toThrow(/syntax bad/);
    bridge.terminate();
  });

  it('http.fetch RPC rejects when domain not in allowlist', async () => {
    const h = makeWorkerImpl();
    const bridge = new PluginBridge(
      { id: 'p1', permissions: { http_domains: ['allowed.example'] } },
      { WorkerImpl: h.Ctor, workerCode: '/* */' }
    );
    const boot = bridge.bootstrap('// code');
    h.last._emit({ kind: 'bootstrap:ok' });
    await boot;

    h.last._emit({ kind: 'rpc', id: 1, method: 'http.fetch', args: ['https://other.com/api', {}] });
    await new Promise(r => setTimeout(r, 0));

    const reply = h.last.posted.find(m => m.kind === 'rpc:result' && m.id === 1);
    expect(reply).toBeDefined();
    expect(reply.error).toMatch(/not in manifest allowlist/);
    bridge.terminate();
  });

  it('vault.read RPC rejects when vault_read permission missing', async () => {
    const h = makeWorkerImpl();
    const bridge = new PluginBridge(
      { id: 'p1', permissions: {} },
      { WorkerImpl: h.Ctor, workerCode: '/* */' }
    );
    const boot = bridge.bootstrap('// code');
    h.last._emit({ kind: 'bootstrap:ok' });
    await boot;

    h.last._emit({ kind: 'rpc', id: 99, method: 'vault.read', args: ['notes/a.md'] });
    await new Promise(r => setTimeout(r, 0));

    const reply = h.last.posted.find(m => m.kind === 'rpc:result' && m.id === 99);
    expect(reply.error).toMatch(/permission "vault_read" not granted/);
    bridge.terminate();
  });
});
