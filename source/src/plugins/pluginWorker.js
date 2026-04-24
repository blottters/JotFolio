// Plugin Worker bootstrap. Runs inside a dedicated Web Worker, one per enabled
// plugin. First thing it does: strip every network + storage + multi-threading
// primitive available in Worker scope. What remains for the plugin: an API
// object proxied back to the parent over postMessage. No direct fetch, no
// localStorage, no importScripts, no nested Worker.
//
// Worker scope by spec already omits `window`, `document`, `localStorage`,
// `sessionStorage`. This script hardens the rest.
//
// Loaded by PluginBridge via Vite's `?raw` import, concatenated with a
// sourceURL comment, wrapped in a Blob URL, and handed to `new Worker(url)`.

(function () {
  const kill = [
    'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource',
    'importScripts', 'indexedDB', 'caches', 'BroadcastChannel',
    'Worker', 'SharedWorker', 'ServiceWorker',
    'Notification',
    // Not normally present in Worker scope — stripped defensively for
    // environments (tests, polyfills) where they might leak in.
    'localStorage', 'sessionStorage',
  ];
  for (const name of kill) {
    try { self[name] = undefined; } catch { /* some envs throw on overwrite */ }
    try { delete self[name]; } catch { /* noop */ }
  }
  // Freeze the prototypes we care about so plugin code can't monkey-patch its
  // way back to a working fetch via inheritance tricks.
  try { Object.freeze(self.navigator); } catch { /* noop */ }
})();

// ---------- RPC state ----------
let rpcSeq = 0;
const rpcPending = new Map();
const commandHandlers = new Map();
const eventHandlers = new Map();
let handlerSeq = 0;
let pluginId = null;
let pluginManifest = null;

function rpc(method, args) {
  const id = ++rpcSeq;
  self.postMessage({ kind: 'rpc', id, method, args });
  return new Promise((resolve, reject) => {
    rpcPending.set(id, { resolve, reject });
  });
}

function nextHandlerId() { return ++handlerSeq; }

function buildApi() {
  const vault = Object.freeze({
    read: (p) => rpc('vault.read', [p]),
    write: (p, c) => rpc('vault.write', [p, c]),
    list: () => rpc('vault.list', []),
    mkdir: (p) => rpc('vault.mkdir', [p]),
    move: (f, t) => rpc('vault.move', [f, t]),
    remove: (p) => rpc('vault.remove', [p]),
    watch: (cb) => {
      const localId = nextHandlerId();
      eventHandlers.set(localId, { kind: 'watch', cb });
      rpc('vault.watch', [localId]).catch(err => {
        eventHandlers.delete(localId);
        throw err;
      });
      return () => {
        eventHandlers.delete(localId);
        rpc('vault.unwatch', [localId]).catch(() => {});
      };
    },
  });

  const commands = Object.freeze({
    register: (id, handler, opts = {}) => {
      if (typeof handler !== 'function') throw new Error('Command handler required');
      const localId = nextHandlerId();
      commandHandlers.set(localId, handler);
      rpc('commands.register', [id, localId, opts]).catch(err => {
        commandHandlers.delete(localId);
        throw err;
      });
      return () => {
        commandHandlers.delete(localId);
        rpc('commands.unregister', [localId]).catch(() => {});
      };
    },
  });

  const events = Object.freeze({
    on: (event, cb) => {
      if (typeof cb !== 'function') throw new Error('Event handler required');
      const localId = nextHandlerId();
      eventHandlers.set(localId, { kind: 'on', cb });
      rpc('events.on', [event, localId]).catch(err => {
        eventHandlers.delete(localId);
        throw err;
      });
      return () => {
        eventHandlers.delete(localId);
        rpc('events.off', [localId]).catch(() => {});
      };
    },
    emit: (event, payload) => rpc('events.emit', [event, payload]),
  });

  const http = Object.freeze({
    fetch: (url, opts) => rpc('http.fetch', [url, opts]),
  });

  return Object.freeze({
    vault, commands, events, http,
    get pluginId() { return pluginId; },
    get manifest() { return pluginManifest; },
  });
}

// ---------- Message router ----------
self.addEventListener('message', (e) => {
  const msg = e.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.kind === 'bootstrap') {
    pluginId = msg.pluginId;
    pluginManifest = Object.freeze({
      ...msg.manifest,
      permissions: Object.freeze({ ...(msg.manifest?.permissions || {}) }),
    });
    const api = buildApi();
    try {
      // Plugin code still evaluated, but in a scope with no fetch/localStorage/etc.
      // The `new Function` call creates a function that runs in the Worker's
      // global scope — which has been stripped above. There is no way back to
      // the main-thread window, because Workers cannot reach it except via
      // postMessage, and our postMessage channel only exposes API calls.
      // Pass `self` explicitly so plugin code's `self.foo` references the
      // worker scope consistently across real Workers and test mocks where
      // the enclosing `self` identifier may not be reachable from inside a
      // `new Function()` body.
      // eslint-disable-next-line no-new-func
      const fn = new Function('api', 'self', 'module', 'exports', msg.code);
      const moduleObj = { exports: {} };
      fn(api, self, moduleObj, moduleObj.exports);
      if (typeof moduleObj.exports?.default === 'function') moduleObj.exports.default(api);
      else if (typeof moduleObj.exports === 'function') moduleObj.exports(api);
      self.postMessage({ kind: 'bootstrap:ok' });
    } catch (err) {
      self.postMessage({ kind: 'bootstrap:error', error: err?.message || String(err) });
    }
    return;
  }

  if (msg.kind === 'rpc:result') {
    const p = rpcPending.get(msg.id);
    if (!p) return;
    rpcPending.delete(msg.id);
    if (msg.error) p.reject(new Error(msg.error));
    else p.resolve(msg.result);
    return;
  }

  if (msg.kind === 'command:invoke') {
    const handler = commandHandlers.get(msg.localId);
    if (!handler) {
      self.postMessage({ kind: 'command:result', id: msg.id, error: 'Handler not found' });
      return;
    }
    Promise.resolve()
      .then(() => handler(...(Array.isArray(msg.args) ? msg.args : [])))
      .then(result => self.postMessage({ kind: 'command:result', id: msg.id, result }))
      .catch(err => self.postMessage({ kind: 'command:result', id: msg.id, error: err?.message || String(err) }));
    return;
  }

  if (msg.kind === 'event:fire') {
    const entry = eventHandlers.get(msg.localId);
    if (!entry) return;
    try { entry.cb(msg.payload); }
    catch (err) {
      self.postMessage({ kind: 'log', level: 'error', message: `Plugin event handler threw: ${err?.message || err}` });
    }
    return;
  }
});
