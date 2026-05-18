import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Module = require('module');

const autoUpdaterHandlers = new Map();
const autoUpdaterStub = {
  autoDownload: false,
  autoInstallOnAppQuit: false,
  on: vi.fn((event, cb) => { autoUpdaterHandlers.set(event, cb); }),
  checkForUpdatesAndNotify: vi.fn(async () => null),
  quitAndInstall: vi.fn(),
};

const ipcHandlers = new Map();
const ipcMainStub = {
  handle: vi.fn((channel, fn) => { ipcHandlers.set(channel, fn); }),
};

const appStub = { isPackaged: false };

const origLoad = Module._load;
Module._load = function loadHook(request, parent, isMain) {
  if (request === 'electron') return { app: appStub, ipcMain: ipcMainStub };
  if (request === 'electron-updater') return { autoUpdater: autoUpdaterStub };
  return origLoad.call(this, request, parent, isMain);
};
afterAll(() => { Module._load = origLoad; });

const updater = require('./updater.js');

describe('updater module shape', () => {
  it('exports a setup function', () => {
    expect(typeof updater.setup).toBe('function');
  });
});

describe('updater.setup in dev (app.isPackaged=false)', () => {
  it('registers ipc handlers but skips autoUpdater event wiring', () => {
    const fakeWin = { webContents: { send: vi.fn() } };
    updater.setup(fakeWin);

    expect(ipcMainStub.handle).toHaveBeenCalled();
    const channels = [...ipcHandlers.keys()];
    expect(channels).toEqual(expect.arrayContaining(['update:check', 'update:install-now']));

    // Dev path: no autoUpdater.on calls
    expect(autoUpdaterStub.on).not.toHaveBeenCalled();
  });

  it('update:check in dev returns ok:false with a clear message', async () => {
    const fn = ipcHandlers.get('update:check');
    expect(fn).toBeTruthy();
    const result = await fn();
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/packaged/i);
  });

  it('update:install-now in dev returns ok:false and does not call quitAndInstall', async () => {
    const fn = ipcHandlers.get('update:install-now');
    const result = await fn();
    expect(result.ok).toBe(false);
    expect(autoUpdaterStub.quitAndInstall).not.toHaveBeenCalled();
  });
});

describe('updater.setup in production (app.isPackaged=true)', () => {
  it('wires autoUpdater event handlers + configures auto-download', () => {
    appStub.isPackaged = true;
    autoUpdaterStub.on.mockClear();
    // Re-run setup
    const fakeWin = { webContents: { send: vi.fn() } };
    updater.setup(fakeWin);
    expect(autoUpdaterStub.autoDownload).toBe(true);
    expect(autoUpdaterStub.autoInstallOnAppQuit).toBe(true);
    const events = autoUpdaterStub.on.mock.calls.map(c => c[0]);
    expect(events).toEqual(expect.arrayContaining([
      'error',
      'checking-for-update',
      'update-available',
      'update-not-available',
      'download-progress',
      'update-downloaded',
    ]));
  });

  it('autoUpdater "update-downloaded" forwards a status event to the renderer', () => {
    const send = vi.fn();
    const fakeWin = { webContents: { send } };
    updater.setup(fakeWin);
    const handler = autoUpdaterHandlers.get('update-downloaded');
    expect(typeof handler).toBe('function');
    handler({ version: '1.2.3' });
    expect(send).toHaveBeenCalledWith('update:status', expect.objectContaining({
      state: 'ready',
      version: '1.2.3',
    }));
  });
});
