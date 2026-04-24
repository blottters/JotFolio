// PluginBridge — parent-side Worker manager. One instance per enabled plugin.
//
// Lifecycle:
//   const bridge = new PluginBridge(manifest, opts?)
//   await bridge.bootstrap(code)
//   ... plugin runs in its Worker, makes RPC calls through the bridge
//   bridge.terminate()
//
// Security boundary: the plugin receives an API object that is really a Worker
// proxy. Every call is a postMessage. Permission gates run here (parent side),
// so a plugin cannot bypass them by reaching around the proxy. A plugin has
// no access to window, document, localStorage, or global fetch from its
// Worker — see pluginWorker.js bootstrap.

import { vault } from '../adapters/index.js';
import { commands as globalCommands } from './CommandRegistry.js';
import { appBus } from './EventBus.js';

const COMMAND_TIMEOUT_MS = 30_000;

/**
 * @typedef {Object} BridgeHooks
 * @property {(url: string, opts?: any) => Promise<Response>} [fetchImpl]   - override global fetch (tests)
 * @property {new (url: string, opts?: any) => any} [WorkerImpl]             - override Worker constructor (tests)
 * @property {string} [workerCode]                                            - override bootstrap code (tests)
 */

/**
 * @param {Object} manifest
 * @param {BridgeHooks} [hooks]
 */
export class PluginBridge {
  constructor(manifest, hooks = {}) {
    this.manifest = manifest;
    this.pluginId = manifest.id;
    this.perms = manifest.permissions || {};
    this.allowedDomains = new Set(this.perms.http_domains || []);

    this._worker = null;
    this._workerUrl = null;
    this._cmdSeq = 0;
    this._cmdPending = new Map();            // id -> { resolve, reject, timeout }
    this._commandRegistrations = new Map();  // localId -> { fullId, off }
    this._eventSubs = new Map();             // localId -> { kind: 'on'|'watch', off }
    this._disposed = false;

    this._fetchImpl = hooks.fetchImpl || null;
    this._WorkerImpl = hooks.WorkerImpl || null;
    this._bootstrapCode = hooks.workerCode || null;
  }

  /**
   * @param {string} code plugin main.js source
   * @returns {Promise<void>} resolves when bootstrap:ok arrives
   */
  async bootstrap(code) {
    if (this._disposed) throw new Error(`Plugin ${this.pluginId}: bridge disposed`);
    const bootstrap = this._bootstrapCode ?? await loadBootstrapCode();
    const bundle = `${bootstrap}\n//# sourceURL=jotfolio-plugin:${this.pluginId}\n`;

    const WorkerCtor = this._WorkerImpl || (typeof Worker !== 'undefined' ? Worker : null);
    if (!WorkerCtor) {
      throw new Error(`Plugin ${this.pluginId}: Web Worker not available in this environment`);
    }

    if (this._WorkerImpl) {
      this._worker = new WorkerCtor(bundle, { pluginId: this.pluginId });
    } else {
      const blob = new Blob([bundle], { type: 'text/javascript' });
      this._workerUrl = URL.createObjectURL(blob);
      this._worker = new WorkerCtor(this._workerUrl, { type: 'classic' });
    }

    this._worker.addEventListener('message', (e) => this._onMessage(e.data));
    this._worker.addEventListener('error', (e) => {
      console.error(`Plugin ${this.pluginId}: worker error`, e?.message || e);
    });

    return new Promise((resolve, reject) => {
      let settled = false;
      const onReady = (e) => {
        const msg = e.data;
        if (!msg) return;
        if (msg.kind === 'bootstrap:ok') { settled = true; cleanup(); resolve(); }
        else if (msg.kind === 'bootstrap:error') { settled = true; cleanup(); reject(new Error(msg.error)); }
      };
      this._worker.addEventListener('message', onReady);
      const cleanup = () => this._worker.removeEventListener('message', onReady);
      setTimeout(() => {
        if (!settled) { cleanup(); reject(new Error(`Plugin ${this.pluginId}: bootstrap timeout`)); }
      }, 5_000);
      this._worker.postMessage({
        kind: 'bootstrap',
        pluginId: this.pluginId,
        manifest: this.manifest,
        code,
      });
    });
  }

  _onMessage(msg) {
    if (!msg || typeof msg !== 'object' || this._disposed) return;

    if (msg.kind === 'rpc') {
      this._handleRpc(msg).catch(err => {
        try {
          this._worker?.postMessage({ kind: 'rpc:result', id: msg.id, error: err?.message || String(err) });
        } catch { /* noop */ }
      });
      return;
    }

    if (msg.kind === 'command:result') {
      const p = this._cmdPending.get(msg.id);
      if (!p) return;
      this._cmdPending.delete(msg.id);
      clearTimeout(p.timeout);
      if (msg.error) p.reject(new Error(msg.error));
      else p.resolve(msg.result);
      return;
    }

    if (msg.kind === 'log') {
      const level = msg.level === 'error' ? 'error' : 'warn';
      console[level](`Plugin ${this.pluginId}:`, msg.message);
      return;
    }
  }

  async _handleRpc(msg) {
    const { id, method, args } = msg;
    let result;
    try {
      switch (method) {
        case 'vault.read':
          this._requirePerm('vault_read');
          result = await vault.read(args[0]);
          break;
        case 'vault.write':
          this._requirePerm('vault_write');
          result = await vault.write(args[0], args[1]);
          break;
        case 'vault.list':
          this._requirePerm('vault_read');
          result = await vault.list();
          break;
        case 'vault.mkdir':
          this._requirePerm('vault_write');
          result = await vault.mkdir(args[0]);
          break;
        case 'vault.move':
          this._requirePerm('vault_write');
          result = await vault.move(args[0], args[1]);
          break;
        case 'vault.remove':
          this._requirePerm('vault_write');
          result = await vault.remove(args[0]);
          break;
        case 'vault.watch': {
          this._requirePerm('vault_read');
          const [localId] = args;
          const off = vault.watch((event) => {
            if (this._disposed) return;
            try { this._worker.postMessage({ kind: 'event:fire', localId, payload: event }); } catch { /* noop */ }
          });
          this._eventSubs.set(localId, { kind: 'watch', off });
          result = undefined;
          break;
        }
        case 'vault.unwatch': {
          const [localId] = args;
          const sub = this._eventSubs.get(localId);
          if (sub) { try { sub.off(); } catch { /* noop */ } this._eventSubs.delete(localId); }
          result = undefined;
          break;
        }

        case 'commands.register': {
          const [cmdIdRaw, localId, opts] = args;
          if (typeof cmdIdRaw !== 'string' || !cmdIdRaw) {
            throw new Error(`Plugin ${this.pluginId}: command id required`);
          }
          if (cmdIdRaw.includes('.') && !cmdIdRaw.startsWith(`${this.pluginId}.`)) {
            throw new Error(`Plugin ${this.pluginId}: command id "${cmdIdRaw}" must be namespaced as "${this.pluginId}.*"`);
          }
          const fullId = cmdIdRaw.includes('.') ? cmdIdRaw : `${this.pluginId}.${cmdIdRaw}`;
          const handler = (...innerArgs) => this._invokeCommand(localId, innerArgs);
          const off = globalCommands.register(fullId, handler, { ...(opts || {}), pluginId: this.pluginId });
          this._commandRegistrations.set(localId, { fullId, off });
          result = undefined;
          break;
        }
        case 'commands.unregister': {
          const [localId] = args;
          const entry = this._commandRegistrations.get(localId);
          if (entry) { try { entry.off(); } catch { /* noop */ } this._commandRegistrations.delete(localId); }
          result = undefined;
          break;
        }

        case 'events.on': {
          const [eventName, localId] = args;
          const off = appBus.on(eventName, (payload) => {
            if (this._disposed) return;
            try { this._worker.postMessage({ kind: 'event:fire', localId, payload }); } catch { /* noop */ }
          });
          this._eventSubs.set(localId, { kind: 'on', off });
          result = undefined;
          break;
        }
        case 'events.off': {
          const [localId] = args;
          const sub = this._eventSubs.get(localId);
          if (sub) { try { sub.off(); } catch { /* noop */ } this._eventSubs.delete(localId); }
          result = undefined;
          break;
        }
        case 'events.emit': {
          const [eventName, payload] = args;
          // Re-emit on window so app-side listeners can hear plugin events.
          // Namespaced form (plugin:<id>:<event>) + generic `jotfolio:<event>`.
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(`plugin:${this.pluginId}:${eventName}`, { detail: payload }));
            window.dispatchEvent(new CustomEvent(`jotfolio:${eventName}`, { detail: payload }));
          }
          result = undefined;
          break;
        }

        case 'http.fetch': {
          const [url, opts] = args;
          let parsed;
          try { parsed = new URL(url); }
          catch { throw new Error(`Plugin ${this.pluginId}: invalid URL: ${url}`); }
          if (!this.allowedDomains.has(parsed.hostname)) {
            throw new Error(`Plugin ${this.pluginId}: domain not in manifest allowlist: ${parsed.hostname}`);
          }
          const doFetch = this._fetchImpl
            || (typeof window !== 'undefined' && window.electron?.http?.fetch)
            || (typeof fetch !== 'undefined' ? fetch : null);
          if (!doFetch) throw new Error(`Plugin ${this.pluginId}: no fetch available`);
          const res = await doFetch(url, opts);
          const body = typeof res.text === 'function' ? await res.text() : '';
          const headers = res.headers && typeof res.headers.entries === 'function'
            ? Object.fromEntries([...res.headers.entries()])
            : (res.headers || {});
          result = {
            status: res.status ?? 0,
            statusText: res.statusText ?? '',
            ok: !!res.ok,
            headers,
            body,
          };
          break;
        }

        default:
          throw new Error(`Unknown RPC method: ${method}`);
      }
    } catch (err) {
      this._worker?.postMessage({ kind: 'rpc:result', id, error: err?.message || String(err) });
      return;
    }
    this._worker?.postMessage({ kind: 'rpc:result', id, result });
  }

  _requirePerm(name) {
    if (!this.perms[name]) {
      throw new Error(`Plugin ${this.pluginId}: permission "${name}" not granted. Add to manifest.permissions.`);
    }
  }

  _invokeCommand(localId, args) {
    if (this._disposed) return Promise.reject(new Error(`Plugin ${this.pluginId}: disposed`));
    const id = ++this._cmdSeq;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._cmdPending.delete(id);
        reject(new Error(`Plugin ${this.pluginId}: command timeout after ${COMMAND_TIMEOUT_MS}ms`));
      }, COMMAND_TIMEOUT_MS);
      this._cmdPending.set(id, { resolve, reject, timeout });
      try {
        this._worker.postMessage({ kind: 'command:invoke', id, localId, args });
      } catch (err) {
        this._cmdPending.delete(id);
        clearTimeout(timeout);
        reject(err);
      }
    });
  }

  terminate() {
    if (this._disposed) return;
    this._disposed = true;
    for (const { off } of this._commandRegistrations.values()) { try { off(); } catch { /* noop */ } }
    this._commandRegistrations.clear();
    for (const { off } of this._eventSubs.values()) { try { off(); } catch { /* noop */ } }
    this._eventSubs.clear();
    for (const { reject, timeout } of this._cmdPending.values()) {
      clearTimeout(timeout);
      try { reject(new Error(`Plugin ${this.pluginId}: disposed`)); } catch { /* noop */ }
    }
    this._cmdPending.clear();
    try { this._worker?.terminate(); } catch { /* noop */ }
    this._worker = null;
    if (this._workerUrl) {
      try { URL.revokeObjectURL(this._workerUrl); } catch { /* noop */ }
      this._workerUrl = null;
    }
  }
}

// Lazy-load the bootstrap source. Vite inlines via ?raw at build time.
let _bootstrapCache = null;
async function loadBootstrapCode() {
  if (_bootstrapCache) return _bootstrapCache;
  const mod = await import('./pluginWorker.js?raw');
  _bootstrapCache = mod.default;
  return _bootstrapCache;
}
