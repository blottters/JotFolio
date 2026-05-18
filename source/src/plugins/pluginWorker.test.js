import { describe, it, expect } from 'vitest';
import workerSource from './pluginWorker.js?raw';

// pluginWorker.js is a bootstrap script meant to run inside a Web Worker. We
// can't import it directly (it touches `self`). Instead, evaluate the source
// inside a controlled fake worker scope and exercise the message handlers.

function evalWorker() {
  const scope = {
    _listeners: new Map(),
    posted: [],
    navigator: {},
    addEventListener(type, cb) {
      if (!this._listeners.has(type)) this._listeners.set(type, new Set());
      this._listeners.get(type).add(cb);
    },
    postMessage(msg) { this.posted.push(msg); },
    _emit(msg) {
      const set = this._listeners.get('message');
      if (!set) return;
      [...set].forEach(cb => cb({ data: msg }));
    },
  };
  // Pre-populate the "globals" the strip step will null out so we can verify
  // they were indeed stripped.
  scope.fetch = () => {};
  scope.XMLHttpRequest = function () {};
  scope.localStorage = {};

  // Wrap the worker source so `self` resolves to our fake scope.
  // The script uses bare `self.foo = undefined` so `self` must be in scope.
  // eslint-disable-next-line no-new-func
  const runner = new Function('self', workerSource);
  runner(scope);
  return scope;
}

describe('pluginWorker bootstrap script', () => {
  it('strips fetch / XMLHttpRequest / localStorage from worker scope', () => {
    const scope = evalWorker();
    expect(scope.fetch).toBeUndefined();
    expect(scope.XMLHttpRequest).toBeUndefined();
    expect(scope.localStorage).toBeUndefined();
  });

  it('registers a message listener that handles bootstrap and reports bootstrap:ok', () => {
    const scope = evalWorker();
    scope._emit({
      kind: 'bootstrap',
      pluginId: 'test',
      manifest: { id: 'test', permissions: {} },
      code: '// no-op',
    });
    const reply = scope.posted.find(m => m.kind === 'bootstrap:ok' || m.kind === 'bootstrap:error');
    expect(reply).toBeDefined();
    expect(reply.kind).toBe('bootstrap:ok');
  });

  it('reports bootstrap:error when plugin code throws synchronously', () => {
    const scope = evalWorker();
    scope._emit({
      kind: 'bootstrap',
      pluginId: 'test',
      manifest: { id: 'test', permissions: {} },
      code: 'throw new Error("kaboom")',
    });
    const reply = scope.posted.find(m => m.kind === 'bootstrap:error');
    expect(reply).toBeDefined();
    expect(reply.error).toMatch(/kaboom/);
  });
});
