// Electron main process — JotFolio.
//
// Responsibilities:
//   - Create single BrowserWindow pointing at Vite dev (dev) or dist (prod)
//   - Persist last-picked vault path in userData/settings.json
//   - Expose fs operations via IPC handlers per ADR-0004
//   - chokidar-based vault watcher, debounced 50ms, fanout to renderer
//   - Atomic writes (temp file + rename) per ADR-0002
//   - Path-safety: every user-supplied path resolved against vault root;
//     escapes rejected with VaultError('path-traversal')
//
// Not yet: signing, auto-update, multi-window, plugins. See phases 4–6.

const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');

const telemetry = require('./telemetry.js');
const updater = require('./updater.js');
const snapshots = require('./snapshots.js');
telemetry.init();

const isDev = !app.isPackaged;
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
const MAX_WRITE_BYTES = 50 * 1024 * 1024; // 50 MB cap on vault writes (threat R6)

let mainWindow = null;
let vaultRoot = null;             // Absolute path of current vault, or null
let watcher = null;                // chokidar instance

// ─── Settings persistence ────────────────────────────────────────
function loadSettings() {
  try {
    const raw = fsSync.readFileSync(SETTINGS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch { return {}; }
}
function saveSettings(obj) {
  try {
    fsSync.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fsSync.writeFileSync(SETTINGS_PATH, JSON.stringify(obj, null, 2));
  } catch (err) { console.error('settings save failed', err); }
}

// ─── Path safety ─────────────────────────────────────────────────
function resolveSafe(rel) {
  if (!vaultRoot) throw new VaultErr('not-available', 'No vault picked');
  if (typeof rel !== 'string' || !rel) throw new VaultErr('invalid-path', 'Empty path');
  if (rel.includes('\\')) throw new VaultErr('invalid-path', 'Use forward slashes');
  if (path.isAbsolute(rel)) throw new VaultErr('invalid-path', 'Path must be relative');
  if (rel.split('/').some(seg => seg === '..')) throw new VaultErr('path-traversal', 'Parent refs not allowed');
  const absolute = path.resolve(vaultRoot, rel);
  if (!absolute.startsWith(vaultRoot + path.sep) && absolute !== vaultRoot) {
    throw new VaultErr('path-traversal', 'Escape attempt: ' + rel);
  }
  return absolute;
}

class VaultErr extends Error {
  constructor(code, detail) { super(`${code}: ${detail}`); this.code = code; this.detail = detail; }
  toJSON() { return { code: this.code, message: this.message, detail: this.detail }; }
}
function wrapIpc(fn) {
  return async (_e, ...args) => {
    try { return await fn(...args); }
    catch (err) {
      if (err instanceof VaultErr) throw err.toJSON();
      throw { code: 'io-error', message: err.message ?? String(err), detail: err.stack };
    }
  };
}

// ─── Watcher (lazy require chokidar; optional dep) ───────────────
function startWatcher() {
  stopWatcher();
  if (!vaultRoot) return;
  try {
    const chokidar = require('chokidar');
    watcher = chokidar.watch(vaultRoot, {
      ignored: ['**/node_modules/**', '**/.git/**', '**/.jotfolio/recovery/**'],
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 20 },
    });
    const emit = (type) => (absPath) => {
      if (!mainWindow || !vaultRoot) return;
      const rel = path.relative(vaultRoot, absPath).replaceAll(path.sep, '/');
      mainWindow.webContents.send('vault:watch:event', { type, path: rel });
    };
    watcher.on('add', emit('create'));
    watcher.on('change', emit('change'));
    watcher.on('unlink', emit('delete'));
  } catch (err) {
    console.warn('chokidar not installed; vault watch disabled.', err.message);
  }
}
function stopWatcher() {
  if (watcher) {
    try { watcher.close(); } catch { /* noop */ }
    watcher = null;
  }
}

// ─── IPC handlers ────────────────────────────────────────────────
ipcMain.handle('vault:pick', wrapIpc(async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Pick a vault folder',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (res.canceled || !res.filePaths.length) return null;
  const picked = res.filePaths[0];
  try { await fs.access(picked, fsSync.constants.R_OK | fsSync.constants.W_OK); }
  catch { throw new VaultErr('access-denied', 'Folder not readable/writable'); }
  vaultRoot = picked;
  const settings = loadSettings();
  settings.lastVault = picked;
  saveSettings(settings);
  startWatcher();
  snapshots.setVaultRoot(picked);
  snapshots.startPrune();
  return { path: picked, name: path.basename(picked) };
}));

ipcMain.handle('vault:current', wrapIpc(async () => {
  return vaultRoot;
}));

ipcMain.handle('vault:list', wrapIpc(async () => {
  if (!vaultRoot) throw new VaultErr('not-available', 'No vault');
  const results = [];
  async function walk(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); }
    catch (err) { throw new VaultErr('io-error', err.message); }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) { await walk(abs); continue; }
      if (!e.name.endsWith('.md')) continue;
      try {
        const stat = await fs.stat(abs);
        const rel = path.relative(vaultRoot, abs).replaceAll(path.sep, '/');
        const folder = path.dirname(rel);
        results.push({
          path: rel,
          name: e.name,
          folder: folder === '.' ? '' : folder,
          size: stat.size,
          mtime: stat.mtimeMs,
        });
      } catch (err) {
        const rel = path.relative(vaultRoot, abs).replaceAll(path.sep, '/');
        results.push({
          path: rel,
          name: e.name,
          folder: path.dirname(rel),
          size: 0,
          mtime: 0,
          error: { code: 'io-error', message: err.message },
        });
      }
    }
  }
  await walk(vaultRoot);
  return results;
}));

ipcMain.handle('vault:read', wrapIpc(async (rel) => {
  const abs = resolveSafe(rel);
  try { return await fs.readFile(abs, 'utf8'); }
  catch (err) {
    if (err.code === 'ENOENT') throw new VaultErr('not-found', rel);
    if (err.code === 'EACCES') throw new VaultErr('access-denied', rel);
    throw new VaultErr('io-error', err.message);
  }
}));

ipcMain.handle('vault:write', wrapIpc(async (rel, content) => {
  const abs = resolveSafe(rel);
  if (typeof content !== 'string') throw new VaultErr('invalid-path', 'Content must be string');
  if (Buffer.byteLength(content, 'utf8') > MAX_WRITE_BYTES) {
    throw new VaultErr('io-error', `Payload exceeds ${MAX_WRITE_BYTES} byte cap`);
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  // Atomic write: temp + rename
  const tmp = abs + '.' + crypto.randomBytes(6).toString('hex') + '.tmp';
  try {
    await fs.writeFile(tmp, content, 'utf8');
    await fs.rename(tmp, abs);
    snapshots.schedule(rel);
  } catch (err) {
    try { await fs.unlink(tmp); } catch { /* noop */ }
    if (err.code === 'ENOSPC') throw new VaultErr('disk-full', rel);
    if (err.code === 'EACCES') throw new VaultErr('access-denied', rel);
    throw new VaultErr('io-error', err.message);
  }
}));

// Snapshot IPC — list + restore previous versions of a note
ipcMain.handle('snapshot:list', wrapIpc(async (rel) => {
  return snapshots.list(rel);
}));
ipcMain.handle('snapshot:restore', wrapIpc(async (rel, date) => {
  return snapshots.restore(rel, date);
}));

ipcMain.handle('vault:mkdir', wrapIpc(async (rel) => {
  const abs = resolveSafe(rel);
  try { await fs.mkdir(abs, { recursive: true }); }
  catch (err) { throw new VaultErr('io-error', err.message); }
}));

ipcMain.handle('vault:move', wrapIpc(async (from, to) => {
  const absFrom = resolveSafe(from);
  const absTo = resolveSafe(to);
  try {
    await fs.mkdir(path.dirname(absTo), { recursive: true });
    await fs.rename(absFrom, absTo);
  } catch (err) {
    if (err.code === 'ENOENT') throw new VaultErr('not-found', from);
    throw new VaultErr('io-error', err.message);
  }
}));

ipcMain.handle('vault:remove', wrapIpc(async (rel) => {
  const abs = resolveSafe(rel);
  try { await fs.unlink(abs); }
  catch (err) {
    if (err.code === 'ENOENT') throw new VaultErr('not-found', rel);
    throw new VaultErr('io-error', err.message);
  }
}));

ipcMain.handle('vault:readBinary', wrapIpc(async (rel) => {
  const abs = resolveSafe(rel);
  try {
    const buf = await fs.readFile(abs);
    return buf; // Electron serializes Buffer as Uint8Array over IPC
  } catch (err) { throw new VaultErr('io-error', err.message); }
}));

ipcMain.handle('vault:writeBinary', wrapIpc(async (rel, data) => {
  const abs = resolveSafe(rel);
  const buf = Buffer.from(data);
  if (buf.byteLength > MAX_WRITE_BYTES) {
    throw new VaultErr('io-error', `Payload exceeds ${MAX_WRITE_BYTES} byte cap`);
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const tmp = abs + '.' + crypto.randomBytes(6).toString('hex') + '.tmp';
  try {
    await fs.writeFile(tmp, buf);
    await fs.rename(tmp, abs);
  } catch (err) {
    try { await fs.unlink(tmp); } catch { /* noop */ }
    throw new VaultErr('io-error', err.message);
  }
}));

ipcMain.handle('app:open-external', wrapIpc(async (url) => {
  if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
    throw new VaultErr('invalid-path', 'Only http(s) URLs allowed');
  }
  await shell.openExternal(url);
}));

ipcMain.handle('app:show-item-in-folder', wrapIpc(async (rel) => {
  const abs = resolveSafe(rel);
  shell.showItemInFolder(abs);
}));

ipcMain.handle('app:relaunch', wrapIpc(async () => {
  app.relaunch();
  app.exit(0);
}));

ipcMain.handle('app:userDataPath', wrapIpc(async () => app.getPath('userData')));

// ─── Window lifecycle ────────────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: '#0b1020',
    title: 'JotFolio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // required so preload can use node APIs; revisit in 0.5.0
      webviewTag: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Block window.open and target="_blank" — renderer cannot create new windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Send http(s) links to default browser, deny everything else
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url).catch(err => console.error('openExternal failed', err));
    }
    return { action: 'deny' };
  });

  // Prevent renderer navigation off the loaded origin.
  // In dev we load http://localhost:5174 — allow only that.
  // In prod we load file://.../dist/index.html — allow only that.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL();
    try {
      const target = new URL(url);
      const here = new URL(current);
      if (target.origin !== here.origin || target.pathname !== here.pathname) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  // Block embedded webview permission requests outright
  mainWindow.webContents.on('did-attach-webview', () => {
    console.warn('webview attach attempted and was blocked');
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Restore last vault on launch
  const settings = loadSettings();
  if (settings.lastVault) {
    try {
      await fs.access(settings.lastVault, fsSync.constants.R_OK);
      vaultRoot = settings.lastVault;
      startWatcher();
      snapshots.setVaultRoot(vaultRoot);
      snapshots.startPrune();
    } catch { /* last vault unavailable — user will re-pick */ }
  }

  updater.setup(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopWatcher();
  });
}

app.whenReady().then(async () => {
  await createWindow();
  // Build menu (placeholder — full menu in Phase 3.5)
  try {
    const { buildMenu } = require('./menus.js');
    Menu.setApplicationMenu(buildMenu(mainWindow));
  } catch (err) {
    console.warn('menu build failed', err.message);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Crash safety — log but don't exit
process.on('uncaughtException', (err) => { console.error('uncaughtException', err); });
process.on('unhandledRejection', (err) => { console.error('unhandledRejection', err); });
