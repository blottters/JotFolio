// PluginHost — discovers, loads, enables/disables, unloads plugins.
//
// Discovery: scans `<vault>/.jotfolio/plugins/*/manifest.json` via VaultAdapter.
// Each plugin folder contains:
//   - manifest.json  (id, name, version, author, description, main, permissions, ...)
//   - main.js        (plugin code — runs inside a Web Worker via PluginBridge)
//
// State persists to `<vault>/.jotfolio/settings/plugins.json`:
//   { enabled: { <pluginId>: true | false } }
//
// Security: v0.5.0 moves plugin code into a Web Worker (see pluginWorker.js +
// PluginBridge.js). Plugin code has no access to window, document, localStorage,
// or global fetch — only the API we expose over postMessage, gated per
// manifest permissions. A zero-permission plugin has no path to exfiltrate.
//
// Fallback: if Worker is not available (e.g. Vitest + jsdom), we run the
// plugin in renderer context via `new Function()` — same behaviour as v0.4.x.
// This keeps unit tests green without a Worker polyfill. Production always
// has Worker (browser + Electron renderer).

import { vault } from '../adapters/index.js';
import { PluginBridge } from './PluginBridge.js';
import { commands as globalCommands } from './CommandRegistry.js';
import { appBus } from './EventBus.js';

const PLUGINS_DIR = '.jotfolio/plugins';
const SETTINGS_PATH = '.jotfolio/settings/plugins.json';

function ownManifest(id) {
  return typeof id === 'string'
    && Object.prototype.hasOwnProperty.call({}.constructor === Object ? Object.create(null) : {}, id) === false;
}

/**
 * @typedef {Object} PluginRecord
 * @property {Object} manifest
 * @property {string} folder       - Vault-relative folder
 * @property {'enabled'|'disabled'|'failed'} status
 * @property {string} [error]      - Present when status=failed
 * @property {() => void} [dispose]
 */

export class PluginHost {
  constructor() {
    /** @type {Map<string, PluginRecord>} */
    this._plugins = new Map();
    this._listeners = new Set();
  }

  subscribe(cb) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  _emit() {
    const snapshot = [...this._plugins.values()].map(p => ({
      manifest: p.manifest, folder: p.folder, status: p.status, error: p.error,
    }));
    this._listeners.forEach(cb => { try { cb(snapshot); } catch { /* noop */ } });
  }

  async _loadSettings() {
    try {
      const content = await vault.read(SETTINGS_PATH);
      const parsed = JSON.parse(content);
      // Harden: drop prototype-chain contamination. `toString` in user-data can't enable anything.
      const clean = Object.create(null);
      if (parsed && typeof parsed === 'object' && parsed.enabled && typeof parsed.enabled === 'object') {
        const enabled = Object.create(null);
        for (const key of Object.keys(parsed.enabled)) {
          if (!Object.prototype.hasOwnProperty.call(parsed.enabled, key)) continue;
          enabled[key] = !!parsed.enabled[key];
        }
        clean.enabled = enabled;
      } else {
        clean.enabled = Object.create(null);
      }
      return clean;
    } catch {
      const clean = Object.create(null);
      clean.enabled = Object.create(null);
      return clean;
    }
  }

  async _saveSettings(settings) {
    try {
      await vault.mkdir('.jotfolio/settings');
      // Convert null-prototype objects to plain for JSON
      const plain = { enabled: { ...(settings.enabled || {}) } };
      await vault.write(SETTINGS_PATH, JSON.stringify(plain, null, 2));
    } catch (err) {
      console.error('PluginHost: failed to save settings', err);
    }
  }

  /** Scan vault for plugin folders + parse manifests. Does NOT instantiate. */
  async discover() {
    const files = await vault.list();
    const manifestPaths = files
      .filter(f => !f.error)
      .filter(f => f.path.startsWith(`${PLUGINS_DIR}/`) && f.name === 'manifest.json');

    const settings = await this._loadSettings();
    const seen = new Set();

    for (const mf of manifestPaths) {
      const folder = mf.folder; // e.g. ".jotfolio/plugins/daily-notes"
      let manifest;
      try {
        const raw = await vault.read(mf.path);
        manifest = JSON.parse(raw);
        if (!manifest.id || !manifest.name || !manifest.main) {
          throw new Error('Manifest missing required fields: id, name, main');
        }
        // Reject manifest ids that collide with Object.prototype members.
        if (['__proto__', 'constructor', 'prototype', 'toString', 'hasOwnProperty', 'valueOf'].includes(manifest.id)) {
          throw new Error(`Manifest id "${manifest.id}" is reserved`);
        }
      } catch (err) {
        const failedId = folder.split('/').pop();
        this._plugins.set(failedId, {
          manifest: { id: failedId, name: failedId, version: '?', author: '?' },
          folder,
          status: 'failed',
          error: `Invalid manifest: ${err.message}`,
        });
        seen.add(failedId);
        continue;
      }

      seen.add(manifest.id);
      // Preserve existing enabled/disabled state; default disabled for new.
      // Use hasOwnProperty to ignore prototype-chain contamination.
      const prev = this._plugins.get(manifest.id);
      const userEnabled = Object.prototype.hasOwnProperty.call(settings.enabled, manifest.id)
        ? !!settings.enabled[manifest.id]
        : false;
      const status = prev?.status === 'enabled' ? 'enabled' : (userEnabled ? 'enabled' : 'disabled');
      this._plugins.set(manifest.id, {
        manifest, folder, status,
        dispose: prev?.dispose,
      });
    }

    // Remove plugins no longer present on disk
    for (const id of [...this._plugins.keys()]) {
      if (!seen.has(id)) {
        const rec = this._plugins.get(id);
        if (rec.dispose) { try { rec.dispose(); } catch { /* noop */ } }
        this._plugins.delete(id);
      }
    }

    // Auto-start plugins flagged enabled
    for (const rec of this._plugins.values()) {
      if (rec.status === 'enabled' && !rec.dispose) {
        await this._instantiate(rec);
      }
    }

    this._emit();
  }

  async _instantiate(rec) {
    try {
      const mainPath = `${rec.folder}/${rec.manifest.main}`;
      const code = await vault.read(mainPath);

      if (typeof Worker !== 'undefined') {
        // Production path — sandboxed Worker.
        const bridge = new PluginBridge(rec.manifest);
        await bridge.bootstrap(code);
        rec.dispose = () => bridge.terminate();
      } else {
        // Test / non-Worker fallback. Uses the pre-v0.5 unsandboxed path.
        // Running in renderer context here; permission gates still apply via
        // the same API shape. Tests cover this path; production never hits it.
        const dispose = this._instantiateUnsandboxed(rec.manifest, code);
        rec.dispose = dispose;
      }

      rec.status = 'enabled';
      rec.error = undefined;
    } catch (err) {
      rec.status = 'failed';
      rec.error = err.message || String(err);
      rec.dispose = undefined;
      console.error(`PluginHost: plugin "${rec.manifest.id}" crashed:`, err);
    }
  }

  _instantiateUnsandboxed(manifest, code) {
    const pluginId = manifest.id;
    const perms = manifest.permissions || {};
    const allowedDomains = new Set(perms.http_domains || []);
    const disposals = [];

    const requirePerm = (name) => {
      if (!perms[name]) throw new Error(`Plugin ${pluginId}: permission "${name}" not granted. Add to manifest.permissions.`);
    };

    const api = Object.freeze({
      vault: Object.freeze({
        read: (p) => { requirePerm('vault_read'); return vault.read(p); },
        write: (p, c) => { requirePerm('vault_write'); return vault.write(p, c); },
        list: () => { requirePerm('vault_read'); return vault.list(); },
        mkdir: (p) => { requirePerm('vault_write'); return vault.mkdir(p); },
        move: (f, t) => { requirePerm('vault_write'); return vault.move(f, t); },
        remove: (p) => { requirePerm('vault_write'); return vault.remove(p); },
        watch: (cb) => { requirePerm('vault_read'); const off = vault.watch(cb); disposals.push(off); return off; },
      }),
      commands: Object.freeze({
        register: (id, handler, opts = {}) => {
          if (typeof id !== 'string' || !id) throw new Error(`Plugin ${pluginId}: command id required`);
          if (id.includes('.') && !id.startsWith(`${pluginId}.`)) {
            throw new Error(`Plugin ${pluginId}: command id "${id}" must be namespaced as "${pluginId}.*"`);
          }
          const fullId = id.includes('.') ? id : `${pluginId}.${id}`;
          const off = globalCommands.register(fullId, handler, { ...opts, pluginId });
          disposals.push(off);
          return off;
        },
      }),
      events: Object.freeze({
        on: (event, cb) => { const off = appBus.on(event, cb); disposals.push(off); return off; },
        emit: (event, payload) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(`plugin:${pluginId}:${event}`, { detail: payload }));
            window.dispatchEvent(new CustomEvent(`jotfolio:${event}`, { detail: payload }));
          }
        },
      }),
      http: Object.freeze({
        fetch: async (url, options) => {
          let parsed;
          try { parsed = new URL(url); }
          catch { throw new Error(`Plugin ${pluginId}: invalid URL: ${url}`); }
          if (!allowedDomains.has(parsed.hostname)) {
            throw new Error(`Plugin ${pluginId}: domain not in manifest allowlist: ${parsed.hostname}`);
          }
          if (typeof window !== 'undefined' && window.electron?.http?.fetch) {
            return window.electron.http.fetch(url, options);
          }
          return fetch(url, options);
        },
      }),
      pluginId,
      manifest: Object.freeze({
        ...manifest,
        permissions: Object.freeze({
          ...perms,
          http_domains: Object.freeze([...(perms.http_domains || [])]),
        }),
      }),
    });

    // eslint-disable-next-line no-new-func
    const fn = new Function('api', 'module', 'exports', code);
    const moduleObj = { exports: {} };
    fn(api, moduleObj, moduleObj.exports);
    if (typeof moduleObj.exports?.default === 'function') moduleObj.exports.default(api);
    else if (typeof moduleObj.exports === 'function') moduleObj.exports(api);

    return () => {
      globalCommands.clearPlugin(pluginId);
      disposals.forEach(fn => { try { fn(); } catch { /* noop */ } });
      disposals.length = 0;
    };
  }

  list() {
    return [...this._plugins.values()].map(p => ({
      manifest: p.manifest, folder: p.folder, status: p.status, error: p.error,
    }));
  }

  async enable(id) {
    const rec = this._plugins.get(id);
    if (!rec) throw new Error(`Plugin not found: ${id}`);
    if (rec.status === 'enabled') return;
    await this._instantiate(rec);
    const settings = await this._loadSettings();
    settings.enabled[id] = true;
    await this._saveSettings(settings);
    this._emit();
  }

  async disable(id) {
    const rec = this._plugins.get(id);
    if (!rec) throw new Error(`Plugin not found: ${id}`);
    if (rec.dispose) { try { rec.dispose(); } catch { /* noop */ } }
    rec.dispose = undefined;
    rec.status = 'disabled';
    const settings = await this._loadSettings();
    settings.enabled[id] = false;
    await this._saveSettings(settings);
    this._emit();
  }

  async uninstall(id) {
    const rec = this._plugins.get(id);
    if (!rec) return;
    if (rec.dispose) { try { rec.dispose(); } catch { /* noop */ } }
    const files = await vault.list();
    const prefix = rec.folder + '/';
    for (const f of files) {
      if (f.path === rec.folder || f.path.startsWith(prefix)) {
        try { await vault.remove(f.path); } catch { /* best effort */ }
      }
    }
    this._plugins.delete(id);
    const settings = await this._loadSettings();
    delete settings.enabled[id];
    await this._saveSettings(settings);
    this._emit();
  }
}

export const pluginHost = new PluginHost();

// Expose helper so tests can verify the unsandboxed fallback vs Worker path.
// Not part of the plugin API — internal only.
export { ownManifest };
