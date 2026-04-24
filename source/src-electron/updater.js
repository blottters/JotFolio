// Auto-update — electron-updater reads `latest.yml` (Mac: `latest-mac.yml`,
// Linux: `latest-linux.yml`) from the GitHub Releases of this repo, compares
// version strings, downloads + installs in-place.
//
// `electron-builder` publishes those `latest*.yml` files automatically when
// `--publish always` is passed in CI. No extra infra needed beyond GitHub
// Releases; the update feed is the release assets themselves.
//
// electron-updater verifies the installer signature before applying. We do
// NOT disable that check. Unsigned builds (dev) skip auto-update entirely.

const { autoUpdater } = require('electron-updater');
const { app, ipcMain } = require('electron');

let mainWindowRef = null;

function setup(mainWindow) {
  mainWindowRef = mainWindow;
  if (!app.isPackaged) return; // no-op in dev

  autoUpdater.autoDownload = true;          // download silently in background
  autoUpdater.autoInstallOnAppQuit = true;  // install next restart

  autoUpdater.on('error', err => {
    console.error('auto-update error', err);
    sendStatus({ state: 'error', message: err.message });
  });

  autoUpdater.on('checking-for-update', () => {
    sendStatus({ state: 'checking' });
  });

  autoUpdater.on('update-available', info => {
    sendStatus({ state: 'available', version: info.version, releaseNotes: info.releaseNotes });
  });

  autoUpdater.on('update-not-available', () => {
    sendStatus({ state: 'current' });
  });

  autoUpdater.on('download-progress', progress => {
    sendStatus({
      state: 'downloading',
      percent: Math.round(progress.percent),
      transferredMB: (progress.transferred / 1e6).toFixed(1),
      totalMB: (progress.total / 1e6).toFixed(1),
    });
  });

  autoUpdater.on('update-downloaded', info => {
    sendStatus({ state: 'ready', version: info.version });
  });

  // Check shortly after launch, then every 6 hours
  const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
  setTimeout(() => autoUpdater.checkForUpdatesAndNotify().catch(() => {}), 30_000);
  setInterval(() => autoUpdater.checkForUpdatesAndNotify().catch(() => {}), CHECK_INTERVAL_MS);

  // IPC: renderer can ask for an on-demand check + trigger install
  ipcMain.handle('update:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdatesAndNotify();
      return result ? { ok: true, info: result.updateInfo } : { ok: true, info: null };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('update:install-now', async () => {
    // Fires `before-quit` + restarts into the new version
    autoUpdater.quitAndInstall(false, true);
  });
}

function sendStatus(payload) {
  mainWindowRef?.webContents.send('update:status', payload);
}

module.exports = { setup };
