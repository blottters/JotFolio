# src-electron — JotFolio Desktop Shell

Electron main-process code. Three files:

- **`main.js`** — creates the `BrowserWindow`, registers all IPC handlers (see ADR-0004), persists settings + last-vault path to `app.getPath('userData')/settings.json`, runs the `chokidar` vault watcher.
- **`preload.js`** — exposes `window.electron.{ vault, app, snapshots, updater, telemetry, plugin, platform }` via `contextBridge`. The renderer never touches `ipcRenderer` directly.
- **`menus.js`** — builds the native application menu per wireframe 12.

## Processes

```
┌─ main (Node) ─────────────────┐     ┌─ renderer (Chromium) ──────────┐
│  main.js                       │     │  Vite-built React app          │
│   - IPC handlers               │ ←→  │   - window.electron.* (from    │
│   - fs reads/writes            │ IPC │     preload)                   │
│   - chokidar watch             │     │   - adapters/NodeFsAdapter     │
│  preload.js                    │     │     forwards to IPC            │
│   - contextBridge              │     └────────────────────────────────┘
└────────────────────────────────┘
```

Main process has full Node access. Renderer does NOT — only what preload exposes.

## Adding a new IPC channel

1. Add handler in `main.js` with `ipcMain.handle('namespace:name', wrapIpc(async (arg) => { ... }))`
2. Add a bridge method in `preload.js` under the appropriate bucket (`vault`, `app`, `plugin`)
3. Update ADR-0004 channel map
4. Consume from renderer via `window.electron.<bucket>.<method>(...)`

All path-accepting channels MUST call `resolveSafe(rel)` in the handler. No exceptions.

## Running in dev

From the project root:

```sh
npm install
npm run electron:dev
```

`electron:dev` runs Vite + Electron concurrently. Vite serves on `:5174`; Electron waits for it via `wait-on`, then launches. Renderer hot-reload works as usual.

## Building a production binary

```sh
npm run electron:build
```

Uses `electron-builder` to produce platform-specific installers under `dist-electron/`. Config lives in `package.json` under the `build` key.

## Security notes (Phase 5 will harden)

- `sandbox: false` — required today so preload can use node APIs. Phase 5 moves those to main-process IPC and flips sandbox on.
- No CSP yet. Phase 5 adds.
- Plugins not yet loaded. Phase 4 adds them with capability-based permissions.

## Tests

Main process is not covered by vitest (it requires Electron runtime). Manual verification:

1. `npm run electron:dev`
2. Window opens showing current React UI
3. First launch has no vault — first-run modal prompts user
4. After pick, files appear in `list()`, edits persist to disk, watch emits events
