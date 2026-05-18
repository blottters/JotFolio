import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Module = require('module');

let exposed = null;
const contextBridgeStub = {
  exposeInMainWorld: vi.fn((key, api) => {
    if (key === 'electron') exposed = api;
  }),
};

const ipcEventHandlers = new Map();
const ipcRendererStub = {
  invoke: vi.fn(async (channel, ...args) => ({ channel, args })),
  on: vi.fn((channel, cb) => { ipcEventHandlers.set(channel, cb); }),
};

const origLoad = Module._load;
Module._load = function loadHook(request, parent, isMain) {
  if (request === 'electron') return { contextBridge: contextBridgeStub, ipcRenderer: ipcRendererStub };
  return origLoad.call(this, request, parent, isMain);
};
afterAll(() => { Module._load = origLoad; });

// Importing preload.js runs `contextBridge.exposeInMainWorld('electron', ...)`
require('./preload.js');

describe('preload exposed surface', () => {
  it('called contextBridge.exposeInMainWorld with key "electron"', () => {
    expect(contextBridgeStub.exposeInMainWorld).toHaveBeenCalledWith('electron', expect.any(Object));
    expect(exposed).toBeTruthy();
  });

  it('exposes the documented namespaces: vault, app, plugin, snapshots, updater, telemetry, platform', () => {
    expect(Object.keys(exposed).sort()).toEqual(
      ['app', 'platform', 'plugin', 'snapshots', 'telemetry', 'updater', 'vault'].sort(),
    );
    expect(typeof exposed.platform).toBe('string');
  });

  it('vault namespace exposes the full file API', () => {
    const expected = [
      'pick', 'currentPath', 'list', 'read', 'write', 'mkdir',
      'move', 'remove', 'rmdir', 'readBinary', 'writeBinary', 'watch',
    ];
    for (const name of expected) expect(typeof exposed.vault[name]).toBe('function');
  });

  it('vault.read("note.md") routes to ipcRenderer.invoke("vault:read", "note.md")', async () => {
    ipcRendererStub.invoke.mockClear();
    await exposed.vault.read('note.md');
    expect(ipcRendererStub.invoke).toHaveBeenCalledWith('vault:read', 'note.md');
  });

  it('vault.watch returns an unsubscribe function; vault:watch:event fans out to listeners', () => {
    const cb = vi.fn();
    const unsub = exposed.vault.watch(cb);
    expect(typeof unsub).toBe('function');
    const dispatch = ipcEventHandlers.get('vault:watch:event');
    expect(typeof dispatch).toBe('function');
    dispatch({}, { type: 'change', path: 'a.md' });
    expect(cb).toHaveBeenCalledWith({ type: 'change', path: 'a.md' });
    unsub();
    dispatch({}, { type: 'change', path: 'b.md' });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('app namespace exposes openExternal, showItemInFolder, relaunch, userDataPath', () => {
    for (const name of ['openExternal', 'showItemInFolder', 'relaunch', 'userDataPath']) {
      expect(typeof exposed.app[name]).toBe('function');
    }
  });

  it('plugin namespace is stubbed (list returns empty array; enable/disable reject)', async () => {
    const list = await exposed.plugin.list();
    expect(list).toEqual([]);
    await expect(exposed.plugin.enable('any')).rejects.toThrow(/not available/i);
    await expect(exposed.plugin.disable('any')).rejects.toThrow(/not available/i);
  });

  it('updater.onStatus returns an unsubscribe function and forwards update:status events', () => {
    const cb = vi.fn();
    const unsub = exposed.updater.onStatus(cb);
    const dispatch = ipcEventHandlers.get('update:status');
    expect(typeof dispatch).toBe('function');
    dispatch({}, { state: 'ready' });
    expect(cb).toHaveBeenCalledWith({ state: 'ready' });
    unsub();
  });
});
