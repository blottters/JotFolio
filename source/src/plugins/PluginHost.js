// PluginHost — discovers, loads, enables/disables, unloads plugins.
//
// Discovery: scans `<vault>/.jotfolio/plugins/*/manifest.json` via VaultAdapter.
// Each plugin folder contains:
//   - manifest.json  (id, name, version, author, description, main, permissions, ...)
//   - main.js        (plugin code, runs as `new Function('api', code)(pluginApi)`)
//
// State persists to `<vault>/.jotfolio/settings/plugins.json`:
//   { enabled: { <pluginId>: true | false } }
//
// v0 plugin code runs in the renderer JS context (accepted risk per ADR-0003).
// Phase 5 moves to sandboxed extension host.

import { vault } from '../adapters/index.js';
import { createPluginAPI } from './PluginAPI.js';

const PLUGINS_DIR = '.jotfolio/plugins';
const SETTINGS_PATH = '.jotfolio/settings/plugins.json';

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
      return JSON.parse(content);
    } catch { return { enabled: {} }; }
  }

  async _saveSettings(settings) {
    try {
      await vault.mkdir('.jotfolio/settings');
      await vault.write(SETTINGS_PATH, JSON.stringify(settings, null, 2));
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
      // Preserve existing enabled/disabled state; default disabled for new
      const prev = this._plugins.get(manifest.id);
      const userEnabled = settings.enabled?.[manifest.id] ?? false;
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
      const { api, dispose } = createPluginAPI(rec.manifest);
      // eslint-disable-next-line no-new-func
      const fn = new Function('api', 'module', 'exports', code);
      const module = { exports: {} };
      fn(api, module, module.exports);
      // If plugin exports a default function, call it with api (alternative style)
      if (typeof module.exports?.default === 'function') {
        module.exports.default(api);
      } else if (typeof module.exports === 'function') {
        module.exports(api);
      }
      rec.dispose = dispose;
      rec.status = 'enabled';
      rec.error = undefined;
    } catch (err) {
      rec.status = 'failed';
      rec.error = err.message || String(err);
      rec.dispose = undefined;
      console.error(`PluginHost: plugin "${rec.manifest.id}" crashed:`, err);
    }
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
    settings.enabled = { ...settings.enabled, [id]: true };
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
    settings.enabled = { ...settings.enabled, [id]: false };
    await this._saveSettings(settings);
    this._emit();
  }

  async uninstall(id) {
    const rec = this._plugins.get(id);
    if (!rec) return;
    if (rec.dispose) { try { rec.dispose(); } catch { /* noop */ } }
    // Remove folder contents — walk vault.list() for files under folder
    const files = await vault.list();
    const prefix = rec.folder + '/';
    for (const f of files) {
      if (f.path === rec.folder || f.path.startsWith(prefix)) {
        try { await vault.remove(f.path); } catch { /* best effort */ }
      }
    }
    this._plugins.delete(id);
    const settings = await this._loadSettings();
    if (settings.enabled) delete settings.enabled[id];
    await this._saveSettings(settings);
    this._emit();
  }
}

export const pluginHost = new PluginHost();
