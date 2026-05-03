// Preload — bridges the renderer to IPC handlers in main.js.
// Runs in an isolated context. Only `window.electron` is exposed to the
// renderer via contextBridge. No direct `ipcRenderer`, `require`, `process`
// access from renderer code — Phase 5 hardens the surface further.

const { contextBridge, ipcRenderer } = require('electron');

// Watch event fan-out — single IPC subscription, multiple renderer listeners
const watchListeners = new Set();
ipcRenderer.on('vault:watch:event', (_e, event) => {
  watchListeners.forEach((cb) => {
    try { cb(event); } catch (err) { console.error('vault watch cb error', err); }
  });
});

const vault = {
  async pick() { return ipcRenderer.invoke('vault:pick'); },
  async currentPath() { return ipcRenderer.invoke('vault:current'); },
  async list() { return ipcRenderer.invoke('vault:list'); },
  async read(p) { return ipcRenderer.invoke('vault:read', p); },
  async write(p, content) { return ipcRenderer.invoke('vault:write', p, content); },
  async mkdir(p) { return ipcRenderer.invoke('vault:mkdir', p); },
  async move(from, to) { return ipcRenderer.invoke('vault:move', from, to); },
  async remove(p) { return ipcRenderer.invoke('vault:remove', p); },
  async readBinary(p) { return ipcRenderer.invoke('vault:readBinary', p); },
  async writeBinary(p, data) { return ipcRenderer.invoke('vault:writeBinary', p, data); },
  watch(cb) {
    watchListeners.add(cb);
    return () => watchListeners.delete(cb);
  },
};

const appBridge = {
  async openExternal(url) { return ipcRenderer.invoke('app:open-external', url); },
  async showItemInFolder(relPath) { return ipcRenderer.invoke('app:show-item-in-folder', relPath); },
  async relaunch() { return ipcRenderer.invoke('app:relaunch'); },
  async userDataPath() { return ipcRenderer.invoke('app:userDataPath'); },
};

const snapshots = {
  async list(relPath) { return ipcRenderer.invoke('snapshot:list', relPath); },
  async restore(relPath, date) { return ipcRenderer.invoke('snapshot:restore', relPath, date); },
};

// Update channel — main pushes status events to renderer
const updateListeners = new Set();
ipcRenderer.on('update:status', (_e, payload) => {
  updateListeners.forEach(cb => { try { cb(payload); } catch { /* noop */ } });
});
const updater = {
  async check() { return ipcRenderer.invoke('update:check'); },
  async installNow() { return ipcRenderer.invoke('update:install-now'); },
  onStatus(cb) { updateListeners.add(cb); return () => updateListeners.delete(cb); },
};

const telemetry = {
  async getOptIn() { return ipcRenderer.invoke('telemetry:getOptIn'); },
  async setOptIn(enabled) { return ipcRenderer.invoke('telemetry:setOptIn', enabled); },
};

// Native plugin bridge is not exposed yet; the renderer plugin host owns the current runtime.
const plugin = {
  async list() { return []; },
  async enable(_id) { throw new Error('Native plugin bridge is not available'); },
  async disable(_id) { throw new Error('Native plugin bridge is not available'); },
};

contextBridge.exposeInMainWorld('electron', {
  vault,
  app: appBridge,
  plugin,
  snapshots,
  updater,
  telemetry,
  platform: process.platform, // 'darwin' | 'win32' | 'linux'
});
