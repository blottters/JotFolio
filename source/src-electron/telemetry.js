// Sentry for Electron main process. Matching renderer init lives at
// src/lib/telemetry.js so both sides of the app report into the same project.
//
// Opt-in: disabled unless the user has flipped Settings > Privacy ON.
// That preference is stored in the userData settings.json under
// `telemetry.enabled = true`.
//
// If VITE_SENTRY_DSN is empty at build time, init is a no-op.

const path = require('node:path');
const fsSync = require('node:fs');
const { app } = require('electron');

const DSN = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN || '';
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
const LOG_DIR = path.join(app.getPath('userData'), 'logs');

function readSettings() {
  try { return JSON.parse(fsSync.readFileSync(SETTINGS_PATH, 'utf8')); }
  catch { return {}; }
}

function userOptedIn() {
  return readSettings().telemetry?.enabled === true;
}

function hasDecided() {
  return typeof readSettings().telemetry?.enabled === 'boolean';
}

function scrub(event) {
  if (!event) return event;
  // Strip absolute paths from stack frames; keep only basename
  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (!ex.stacktrace?.frames) continue;
      for (const f of ex.stacktrace.frames) {
        if (typeof f.filename === 'string') f.filename = f.filename.replace(/^[\s\S]*?([/\\])(src|src-electron|dist)/, '$2');
      }
    }
  }
  // Drop any breadcrumb data field that could contain note content
  if (Array.isArray(event.breadcrumbs)) {
    for (const bc of event.breadcrumbs) {
      if (bc.category === 'note-save' || bc.category === 'vault-write') {
        delete bc.data;
      }
    }
  }
  // Never send user identity beyond anonymous id
  delete event.user?.email;
  delete event.user?.username;
  delete event.user?.ip_address;
  return event;
}

function writeLocalLog(err) {
  try {
    fsSync.mkdirSync(LOG_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/:/g, '-');
    const file = path.join(LOG_DIR, `crash-${stamp.slice(0, 10)}.log`);
    const line = `[${stamp}] main: ${err?.stack || err?.message || String(err)}\n`;
    fsSync.appendFileSync(file, line);
  } catch { /* noop */ }
}

let handlersInstalled = false;
let sentryInitialized = false;

function init() {
  if (!handlersInstalled) {
    handlersInstalled = true;
    process.on('uncaughtException', err => writeLocalLog(err));
    process.on('unhandledRejection', err => writeLocalLog(err));
  }

  initSentryIfAllowed();
}

function initSentryIfAllowed() {
  if (sentryInitialized) return;
  if (!DSN) return;                    // no DSN = telemetry disabled at build time
  if (!userOptedIn()) return;          // user hasn't opted in

  try {
    // Lazy require — if @sentry/electron isn't installed, fail silently
    // eslint-disable-next-line global-require
    const Sentry = require('@sentry/electron/main');
    Sentry.init({
      dsn: DSN,
      release: app.getVersion(),
      environment: app.isPackaged ? 'production' : 'development',
      tracesSampleRate: 0,      // no perf sampling in v0
      beforeSend: (event) => {
        if (!userOptedIn()) return null;
        return scrub(event);
      },
      beforeBreadcrumb: (bc) => {
        // Drop breadcrumbs that could leak note content
        if (bc.category === 'console' && typeof bc.message === 'string' && bc.message.length > 500) {
          return null;
        }
        return bc;
      },
    });
    sentryInitialized = true;
  } catch (err) {
    console.warn('Sentry main-process init skipped:', err.message);
  }
}

function setOptIn(value) {
  const settings = readSettings();
  settings.telemetry = { ...(settings.telemetry || {}), enabled: value === true };
  try {
    fsSync.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fsSync.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('telemetry preference save failed', err);
    return { ok: false, error: err.message };
  }
  if (value === true) initSentryIfAllowed();
  return { ok: true, enabled: value === true };
}

module.exports = { init, userOptedIn, hasDecided, setOptIn };
