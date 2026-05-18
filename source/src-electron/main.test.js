import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const Module = require('module');

// Capture ipcMain.handle + app event registrations.
const ipcHandlers = new Map();
const appHandlers = new Map();
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'jotfolio-main-'));

const appStub = {
  isPackaged: false,
  getPath: (k) => (k === 'userData' ? userData : userData),
  getVersion: () => '0.0.0-test',
  // Never resolves so createWindow() does not actually run.
  whenReady: () => new Promise(() => {}),
  on: vi.fn((evt, cb) => { appHandlers.set(evt, cb); }),
  quit: vi.fn(),
  exit: vi.fn(),
  relaunch: vi.fn(),
};
const ipcMainStub = {
  handle: vi.fn((channel, fn) => { ipcHandlers.set(channel, fn); }),
};
const BrowserWindowStub = vi.fn(function (opts) { this.opts = opts; });
BrowserWindowStub.getAllWindows = () => [];
const dialogStub = { showOpenDialog: vi.fn(async () => ({ canceled: true, filePaths: [] })) };
const shellStub = { openExternal: vi.fn(), showItemInFolder: vi.fn() };
const MenuStub = { buildFromTemplate: vi.fn(t => ({ __template: t })), setApplicationMenu: vi.fn() };

const origLoad = Module._load;
Module._load = function loadHook(request, parent, isMain) {
  if (request === 'electron') {
    return {
      app: appStub,
      BrowserWindow: BrowserWindowStub,
      dialog: dialogStub,
      ipcMain: ipcMainStub,
      shell: shellStub,
      Menu: MenuStub,
      contextBridge: { exposeInMainWorld: vi.fn() },
      ipcRenderer: { on: vi.fn(), invoke: vi.fn() },
    };
  }
  if (request === 'electron-updater') return { autoUpdater: { on: vi.fn(), checkForUpdatesAndNotify: vi.fn(async () => null), quitAndInstall: vi.fn() } };
  if (request === '@sentry/electron/main') throw new Error('Sentry not installed (simulated)');
  return origLoad.call(this, request, parent, isMain);
};
afterAll(() => { Module._load = origLoad; });

// Require AFTER hook is installed.
beforeAll(() => {
  require('./main.js');
});

describe('main.js bootstrap', () => {
  it('loads without throwing under a mocked electron module', () => {
    // If require above threw, beforeAll would surface it.
    expect(true).toBe(true);
  });

  it('registers all documented vault IPC handlers', () => {
    const channels = [...ipcHandlers.keys()];
    expect(channels).toEqual(expect.arrayContaining([
      'vault:pick', 'vault:current', 'vault:list',
      'vault:read', 'vault:write', 'vault:mkdir',
      'vault:move', 'vault:remove', 'vault:rmdir',
      'vault:readBinary', 'vault:writeBinary',
    ]));
  });

  it('registers app:, snapshot:, telemetry: IPC handlers', () => {
    const channels = [...ipcHandlers.keys()];
    expect(channels).toEqual(expect.arrayContaining([
      'app:open-external', 'app:show-item-in-folder', 'app:relaunch', 'app:userDataPath',
      'snapshot:list', 'snapshot:restore',
      'telemetry:getOptIn', 'telemetry:setOptIn',
    ]));
  });

  it('subscribes to app lifecycle events (window-all-closed, activate)', () => {
    expect(appHandlers.has('window-all-closed')).toBe(true);
    expect(appHandlers.has('activate')).toBe(true);
  });

  it('app:open-external rejects non-https URLs (file://, javascript:)', async () => {
    const fn = ipcHandlers.get('app:open-external');
    expect(fn).toBeTruthy();
    await expect(fn({}, 'file:///etc/passwd')).rejects.toMatchObject({ code: 'invalid-path' });
    await expect(fn({}, 'javascript:alert(1)')).rejects.toMatchObject({ code: 'invalid-path' });
  });

  it('app:open-external forwards approved https URLs to shell.openExternal', async () => {
    shellStub.openExternal.mockClear();
    const fn = ipcHandlers.get('app:open-external');
    await fn({}, 'https://jotfolio.app/help');
    expect(shellStub.openExternal).toHaveBeenCalledWith('https://jotfolio.app/help');
  });

  it('vault:read fails with not-available when no vault has been picked', async () => {
    const fn = ipcHandlers.get('vault:read');
    await expect(fn({}, 'notes/a.md')).rejects.toMatchObject({ code: 'not-available' });
  });

  it('app:userDataPath returns the userData path', async () => {
    const fn = ipcHandlers.get('app:userDataPath');
    const result = await fn({});
    expect(result).toBe(userData);
  });
});
