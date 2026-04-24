# ADR-0001 — Monorepo Layout for Electron + Web + Mobile

- **Date:** 2026-04-23
- **Status:** Proposed
- **Deciders:** Gavin (owner)

---

## Context

JotFolio is pivoting from a pure Vite/React web app to an Electron desktop-first application with web (File System Access API) and mobile (Capacitor) builds following later. Phase 0 produced a clean feature-module split under `src/features/` and `src/lib/`. The project lives at `C:\Users\gavin\OneDrive\Desktop\JotFolio\source`.

Three build targets must share the same React component tree. The divergence point is file system access — Electron uses Node `fs`, the web build uses the File System Access API, and Capacitor uses the Capacitor Filesystem plugin. Everything above the adapter layer is identical.

The question is where to put Electron-specific code, how to keep the React layer platform-agnostic, and where adapters are imported.

---

## Decision

Adopt the following directory layout. This is the layout. Do not introduce a packages/ monorepo structure (Turborepo, Nx, Lerna) — the overhead is not justified until there is a genuinely separate npm package to publish (the plugin SDK). Revisit at that point.

```
C:\Users\gavin\OneDrive\Desktop\JotFolio\source\
├── src/                          # Shared React app (all platforms)
│   ├── adapters/
│   │   ├── index.js              # Runtime platform picker (see below)
│   │   ├── NodeFsAdapter.js      # Electron implementation
│   │   ├── LocalAdapter.js       # Web File System Access API implementation
│   │   └── CapacitorAdapter.js   # Mobile implementation (stub until needed)
│   ├── features/                 # Existing feature modules (unchanged)
│   ├── lib/                      # Existing utilities (unchanged)
│   ├── onboarding/               # Existing (unchanged)
│   ├── parsers/                  # Existing (unchanged)
│   └── App.jsx
├── src-electron/
│   ├── main.js                   # Electron main process entry
│   ├── preload.js                # contextBridge — exposes window.electron
│   └── ipc/
│       ├── vault.js              # ipcMain handlers for vault:* channels
│       ├── plugin.js             # ipcMain handlers for plugin:* channels
│       ├── http.js               # ipcMain handlers for http:fetch
│       └── app.js                # ipcMain handlers for app:* channels
├── plugins/
│   └── daily-notes/              # Bundled official plugins
│       ├── manifest.json
│       └── main.js
├── docs/
│   └── adr/                      # This directory
├── electron-builder.yml          # electron-builder packaging config
├── vite.config.js                # Existing Vite config (extended for Electron renderer)
├── vite.electron.config.js       # Vite config for building src-electron/main.js
└── package.json
```

### Platform adapter resolution

`src/adapters/index.js` is the single import point for all vault operations in the React layer. It detects the platform at runtime and returns the correct adapter:

```js
// src/adapters/index.js
// Detection order matters. Check window.electron first (Electron preload injects it).
// Fall through to Capacitor, then to LocalAdapter (web).
```

Logic (pseudocode, not implementation):
1. If `window.electron` is defined → return `NodeFsAdapter` (wraps IPC calls)
2. Else if `window.Capacitor` is defined → return `CapacitorAdapter`
3. Else → return `LocalAdapter` (File System Access API)

The React feature modules import from `src/adapters/index.js` only. They never import platform-specific adapters directly. This is enforced by convention — a linting rule can codify it later.

### Why not a packages/ monorepo

Turborepo/Nx would give build caching and clean package boundaries, but introduces `workspace:*` deps, a root-level config layer, and a non-trivial onboarding cost. The entire app is one deployable artifact per platform. The shared React code is not published to npm. The only future candidate for extraction is the plugin SDK — at that point, extract `src/plugin-sdk/` into `packages/plugin-sdk/` and introduce Turborepo then. Not now.

### Why `src-electron/` as a sibling to `src/` rather than nested inside

Electron main process code runs in Node, not in the browser. It has different module resolution, can import `fs`/`path`/`electron` directly, and is bundled by a separate Vite config. Keeping it at `src-electron/` makes the separation explicit and avoids accidental browser-bundle contamination from Node-only imports.

---

## Consequences

**Gains:**
- Single React codebase serves all three platforms with no code duplication.
- Platform boundary is a single file (`src/adapters/index.js`) — easy to audit.
- Electron main process code is isolated; no risk of Node imports leaking into the renderer bundle.
- `plugins/` is a first-class top-level directory — signals that the plugin system is not an afterthought.

**Trade-offs:**
- Two Vite configs (`vite.config.js` for renderer, `vite.electron.config.js` for main process) must be kept in sync manually. This is acceptable complexity for a two-target build.
- `CapacitorAdapter.js` will be a stub or placeholder until the mobile build begins. A stub is better than no file — it forces the interface to stay honest.
- Runtime adapter detection means a wrong environment (e.g., `window.electron` accidentally defined in a test) can load the wrong adapter. Tests must mock `window.electron` explicitly.

---

## Alternatives Considered

**A. Separate repos per platform (Electron repo, web repo)**
Rejected. The shared React code is >95% of the app. Maintaining it across repos creates instant divergence. This is the wrong split.

**B. Compile-time adapter selection via Vite env vars**
Considered. `import.meta.env.VITE_PLATFORM` could tree-shake unused adapters. Rejected for v0 because it requires building three separate artifacts even for development. Runtime detection with lazy-loaded adapters achieves the same tree-shaking effect and keeps the dev workflow simpler.

**C. Turborepo from day one**
Rejected. See reasoning above. Revisit when the plugin SDK needs to be a publishable package.

---

## Cross-references

- ADR-0002 defines the VaultAdapter interface that `src/adapters/` implementations must satisfy.
- ADR-0004 defines the IPC channels that `NodeFsAdapter.js` wraps.
