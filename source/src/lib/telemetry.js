// Renderer-side Sentry init. Mirrors src-electron/telemetry.js on main side.
//
// Reads DSN from Vite env (set in .env.local for dev, GitHub Actions secret
// for prod). Init gated on Settings > Privacy > "Send crash reports".
//
// Exposes `captureError(err, context)` for explicit calls from UI code.

const DSN = import.meta.env?.VITE_SENTRY_DSN || '';
const VERSION = import.meta.env?.VITE_APP_VERSION || '0.0.0-dev';
const PREF_KEY = 'mgn-telemetry';

let sentryModule = null;
let initialized = false;

export function userOptedIn() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return false;
    return JSON.parse(raw).enabled === true;
  } catch { return false; }
}

export function setOptIn(value) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify({ enabled: !!value, decidedAt: new Date().toISOString() })); }
  catch { /* noop */ }
  if (value && !initialized && DSN) init();
}

export function hasDecided() {
  try { return !!localStorage.getItem(PREF_KEY); } catch { return false; }
}

function scrub(event) {
  if (!event) return event;
  if (event.request) { delete event.request.cookies; delete event.request.headers; }
  delete event.user?.email;
  delete event.user?.ip_address;
  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (!ex.stacktrace?.frames) continue;
      for (const f of ex.stacktrace.frames) {
        if (typeof f.filename === 'string') f.filename = f.filename.replace(/^[\s\S]*?(src|dist)/, '$1');
      }
    }
  }
  return event;
}

export async function init() {
  if (initialized || !DSN) return;
  if (!userOptedIn()) return;
  try {
    // Lazy dynamic import — keeps Sentry out of the main bundle for opted-out
    // users. String concat + `new Function` prevents bundler static analysis,
    // so the build does not fail when @sentry/browser isn't installed yet.
    const spec = ['@sentry', 'browser'].join('/');
    const loader = new Function('s', 'return import(s)');
    const mod = await loader(spec).catch(() => null);
    if (!mod) return;
    mod.init({
      dsn: DSN,
      release: VERSION,
      environment: import.meta.env?.PROD ? 'production' : 'development',
      tracesSampleRate: 0,
      beforeSend: scrub,
    });
    sentryModule = mod;
    initialized = true;
  } catch (err) {
    console.warn('Sentry renderer init skipped:', err.message);
  }
}

export function captureError(err, context) {
  try {
    if (!initialized || !sentryModule) return;
    sentryModule.captureException(err, context ? { extra: context } : undefined);
  } catch { /* noop */ }
}

// Always wire local log via console.error hook so offline crashes still recorded
// (written via main process when IPC available).
if (typeof window !== 'undefined' && window.electron?.app) {
  window.addEventListener('error', (e) => {
    if (!userOptedIn()) return;
    captureError(e.error || new Error(e.message));
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (!userOptedIn()) return;
    captureError(e.reason || new Error('Unhandled promise rejection'));
  });
}
