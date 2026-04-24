// Per-plugin scoped API object. Each plugin receives its own instance so:
//   - Commands registered auto-tag with pluginId (unregistered on disable)
//   - Event subscriptions tracked (cleaned up on disable)
//   - HTTP fetches validated against manifest.permissions.http_domains allowlist
//
// Surface matches ADR-0003 v0:
//   vault.{read, write, list, watch, move, remove, mkdir}
//   commands.register(id, handler, opts?)
//   events.on(event, cb)
//   http.fetch(url, options?)

import { vault } from '../adapters/index.js';
import { commands as globalCommands } from './CommandRegistry.js';
import { appBus } from './EventBus.js';

/**
 * @param {Object} manifest - Plugin manifest (per ADR-0003)
 * @returns {{ api: PluginAPIShape, dispose: () => void }}
 */
export function createPluginAPI(manifest) {
  const pluginId = manifest.id;
  const perms = manifest.permissions || {};
  const allowedDomains = new Set(perms.http_domains || []);
  const disposals = [];

  const vaultScoped = {
    read: (p) => {
      if (!perms.vault_read) throw permError('vault_read', pluginId);
      return vault.read(p);
    },
    write: (p, c) => {
      if (!perms.vault_write) throw permError('vault_write', pluginId);
      return vault.write(p, c);
    },
    list: () => {
      if (!perms.vault_read) throw permError('vault_read', pluginId);
      return vault.list();
    },
    mkdir: (p) => {
      if (!perms.vault_write) throw permError('vault_write', pluginId);
      return vault.mkdir(p);
    },
    move: (from, to) => {
      if (!perms.vault_write) throw permError('vault_write', pluginId);
      return vault.move(from, to);
    },
    remove: (p) => {
      if (!perms.vault_write) throw permError('vault_write', pluginId);
      return vault.remove(p);
    },
    watch: (cb) => {
      if (!perms.vault_read) throw permError('vault_read', pluginId);
      const off = vault.watch(cb);
      disposals.push(off);
      return off;
    },
  };

  const commandsScoped = {
    register: (id, handler, opts = {}) => {
      // Namespace under plugin id if author didn't prefix
      const fullId = id.includes('.') ? id : `${pluginId}.${id}`;
      const off = globalCommands.register(fullId, handler, { ...opts, pluginId });
      disposals.push(off);
      return off;
    },
  };

  const eventsScoped = {
    on: (event, cb) => {
      const off = appBus.on(event, cb);
      disposals.push(off);
      return off;
    },
  };

  const httpScoped = {
    fetch: async (url, options) => {
      let parsed;
      try { parsed = new URL(url); }
      catch { throw new Error(`Plugin ${pluginId}: invalid URL: ${url}`); }
      if (!allowedDomains.has(parsed.hostname)) {
        throw new Error(`Plugin ${pluginId}: domain not in manifest allowlist: ${parsed.hostname}`);
      }
      // In Electron, proxy through main process to bypass CORS; in browser, use fetch directly.
      if (typeof window !== 'undefined' && window.electron?.http?.fetch) {
        return window.electron.http.fetch(url, options);
      }
      return fetch(url, options);
    },
  };

  const api = Object.freeze({
    vault: Object.freeze(vaultScoped),
    commands: Object.freeze(commandsScoped),
    events: Object.freeze(eventsScoped),
    http: Object.freeze(httpScoped),
    pluginId,
    manifest: Object.freeze({ ...manifest, permissions: Object.freeze({ ...perms, http_domains: Object.freeze([...(perms.http_domains || [])]) }) }),
  });

  const dispose = () => {
    globalCommands.clearPlugin(pluginId);
    disposals.forEach(fn => { try { fn(); } catch { /* noop */ } });
    disposals.length = 0;
  };

  return { api, dispose };
}

function permError(perm, pluginId) {
  return new Error(`Plugin ${pluginId}: permission "${perm}" not granted. Add to manifest.permissions.`);
}
