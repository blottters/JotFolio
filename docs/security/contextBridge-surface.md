# contextBridge Surface

What the JotFolio renderer can do via `window.electron.*`. Anything not on this list is either not possible or must be added via IPC channel (see `ipc-audit.md`).

---

## Principles

1. **Capability, not power.** The renderer receives specific methods that do specific things, not raw objects it can reflect on.
2. **Frozen exposure.** Objects passed via `contextBridge.exposeInMainWorld` are structured-cloned; methods are proxied. The renderer cannot mutate the preload's internal state.
3. **No prototype reach-back.** `contextIsolation: true` ensures renderer code cannot access `ipcRenderer`, `require`, or the Node global scope even through tricks like `Function.prototype.constructor`.
4. **No `window.opener`, no `webview`, no `iframe src=file://`.** Navigation surface locked down.

---

## Exposed

```ts
window.electron = {
  vault: { /* see ipc-audit.md */ },
  app:   { /* see ipc-audit.md */ },
  plugin: {
    list(): Promise<Array<never>>    // stub in 0.4.x
    enable(id): Promise<void>        // throws 'not implemented'
    disable(id): Promise<void>       // throws 'not implemented'
  },
  platform: 'darwin' | 'win32' | 'linux',
};
```

No other globals are installed by preload.

---

## NOT exposed (explicit denylist)

These are commonly exposed by other Electron apps and deliberately NOT here:

| Not exposed | Reason |
|---|---|
| `require` / `module` | Would let renderer load arbitrary Node modules |
| `process` | Leaks env vars + cwd |
| `ipcRenderer` raw | Would let renderer call any channel, bypassing our allowlist |
| `fs` / `path` / `os` | Renderer does not need fs; all filesystem calls go through `vault:*` |
| `Buffer` (global) | Node-specific; renderer uses `Uint8Array` for binary |
| `shell` | Renderer calls `app.openExternal`, which is URL-scheme-gated |
| `clipboard` | Will be wired in plugin API v1; rendering layer uses `navigator.clipboard` with user gesture |
| `dialog` | Renderer asks main to show dialogs via `vault:pick`; no arbitrary dialog access |
| `webContents` | Main-only |
| `BrowserWindow` | Main-only |
| `app` (raw) | Only the `app.*` methods we expose |
| `@electron/remote` | Package not installed |

---

## Renderer window hardening

`src-electron/main.js` applies the following at `BrowserWindow` creation + `webContents` event handlers:

1. `webPreferences.contextIsolation: true` — required for `contextBridge`
2. `webPreferences.nodeIntegration: false` — renderer has no Node
3. `webPreferences.sandbox: false` — preload needs node APIs temporarily; will flip to `true` when plugin host moves out-of-process (0.5.0)
4. `webPreferences.webviewTag: false` — explicit default-off
5. `webPreferences.webSecurity: true` — enforce same-origin + CORS in renderer
6. `webPreferences.allowRunningInsecureContent: false`
7. `webContents.setWindowOpenHandler(() => ({ action: 'deny' }))` — blocks `window.open`
8. `webContents.on('will-navigate', (e, url) => { if (not our dev URL / our dist file) e.preventDefault() })` — locks renderer location

See `src-electron/main.js` for the live configuration.

---

## CSP (Content Security Policy)

Added via `<meta http-equiv="Content-Security-Policy">` in `index.html`:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src *;
frame-src 'none';
object-src 'none';
base-uri 'none';
form-action 'none';
```

### Rationale per directive

- `default-src 'self'` — block everything else by default.
- `script-src 'self'` — no inline scripts, no `eval`. **Note:** plugin `main.js` is currently loaded via `new Function(code)`, which CSP counts as `unsafe-eval` — this violates the policy unless plugins are disabled. Temporary exemption: `'unsafe-eval'` added conditionally when any plugin is enabled. Proper fix = sandboxed extension host in 0.5.0.
- `style-src 'self' 'unsafe-inline'` — inline styles are used throughout the codebase (26 themes worth). Tokenization to classes is a separate refactor.
- `img-src 'self' data: blob:` — support pasted image data URIs + blobs (future attachment UI).
- `connect-src *` — wide open for v0 because plugin HTTP allowlist is per-plugin, not global. Tightens in 0.5.0.
- `frame-src 'none'` — no iframes allowed.
- `object-src 'none'` — no `<object>` / `<embed>`.
- `base-uri 'none'` — prevents `<base>` tag redirection of relative URLs.
- `form-action 'none'` — no forms should POST anywhere; submit handlers ignore default.

### Known compromises

1. `'unsafe-inline'` for styles — required by current inline-style patterns across 26 themes. Migration target: CSS custom properties in classes (Phase 7 polish work).
2. `'unsafe-eval'` for scripts when a plugin is enabled — required by `new Function(code)` plugin loader. Removed when sandbox ships.
3. `connect-src *` — widened to accommodate plugin allowlists without recompiling CSP per-plugin. Narrowed in 0.5.0.

These three are the known CSP gaps; everything else is strict.

---

## Auditing this surface

Periodic audit steps:

1. `grep -rn "window.electron" src/` — confirm only documented buckets are referenced.
2. `grep -rn "contextBridge" src-electron/` — confirm `exposeInMainWorld` calls are centralized in `preload.js`.
3. Diff `ipcMain.handle` in `main.js` vs channel table in `ipc-audit.md`.
4. Run security-test suite (`npm test -- src/security`) — should exercise: path traversal, CSP meta presence, preload surface shape, permission denial in plugin API.

---

## Change control

Any PR that:
- Adds a new method to `window.electron.*`
- Loosens a CSP directive
- Adds a new IPC channel
- Enables a previously-denylisted renderer capability

...must update this document AND `ipc-audit.md`, and include a security-review checkbox in the PR description. Flagged for `engineering-security-engineer` review.
