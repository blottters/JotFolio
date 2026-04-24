# JotFolio Electron — Phase 2–7 Task List

Last updated: 2026-04-23
Status: Phase 1 (feature module split) complete. Phase 2 begins.

Each task is scoped to 1–2 days of focused work. Tasks within a phase are ordered by dependency — complete them top-to-bottom unless noted otherwise. Acceptance criteria are the definition of done.

---

## Phase 2 — VaultAdapter Foundation

### Task 2.1: VaultError class

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\adapters\VaultError.js`
- [ ] Implement `VaultError extends Error` with properties: `code` (VaultErrorCode enum), `detail` (string), `cause` (Error)
- [ ] Export the `VaultErrorCode` values as a frozen object constant
- [ ] Write unit tests: construct each code variant, verify `instanceof Error`, verify `code` property
- [ ] Acceptance: `new VaultError('not-found', 'file gone')` throws correctly in tests; no runtime errors

**Owner:** engineering-senior-developer

---

### Task 2.2: LocalAdapter (web stub)

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\adapters\LocalAdapter.js`
- [ ] Implement `pickVault()` using `window.showDirectoryPicker()` (File System Access API)
- [ ] Implement `getVaultPath()` returning stored display name (no absolute path available in web)
- [ ] Implement `list()` via recursive `FileSystemDirectoryHandle` iteration; exclude `.jotfolio/`
- [ ] Implement `read(path)`, `write(path, content)`, `mkdir(path)`, `move(from, to)`, `remove(path)`
- [ ] Implement `watch()` as a no-op returning a no-op unsubscribe function (File System Access API has no watch)
- [ ] Implement `readBinary(path)` and `writeBinary(path, data)`
- [ ] Throw `VaultError('io-error', 'watch not supported in web build')` if watch is called with `expectEvents: true` flag (optional flag, not in interface — just stub the no-op)
- [ ] All write operations use write-to-temp-handle + rename semantics where the API permits; document in code where it does not (OPFS limitation)
- [ ] Acceptance: existing web build loads, vault picker works in Edge, files can be read/written

**Owner:** engineering-senior-developer

---

### Task 2.3: Platform adapter picker (`src/adapters/index.js`)

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\adapters\index.js`
- [ ] Implement runtime detection: `window.electron` → `NodeFsAdapter`; `window.Capacitor` → `CapacitorAdapter`; else → `LocalAdapter`
- [ ] Export a singleton `vault` instance (one adapter per app session)
- [ ] Export `getAdapter()` function for components that need the raw adapter
- [ ] Stub `CapacitorAdapter.js` with all interface methods throwing `VaultError('io-error', 'Capacitor not yet implemented')`
- [ ] Stub `NodeFsAdapter.js` with all methods throwing `VaultError('io-error', 'Electron IPC not connected')` (will be replaced in Phase 3)
- [ ] Acceptance: `import { vault } from './adapters/index.js'` works in tests; mock `window.electron` → correct adapter selected

**Owner:** engineering-senior-developer

---

### Task 2.4: Replace `src/lib/storage.js` with adapter calls

- [ ] Audit all callers of `src/lib/storage.js` (reads/writes to `localStorage` key `mgn-e`)
- [ ] Create a transitional `src/lib/noteStore.js` that wraps `vault.read()` / `vault.write()` / `vault.list()` using ADR-0005 frontmatter format
- [ ] Implement `listNotes()` → calls `vault.list()`, reads each file, parses frontmatter + body
- [ ] Implement `saveNote(entry)` → serializes to frontmatter + body, calls `vault.write()`
- [ ] Implement `deleteNote(id)` → locates file by id, calls `vault.remove()`
- [ ] Keep `src/lib/storage.js` intact but have it delegate to `noteStore.js` when a vault is open; fall back to localStorage when no vault is open (graceful degradation for web)
- [ ] Acceptance: existing tests pass; notes round-trip through frontmatter serializer without data loss (all fields preserved)

**Owner:** engineering-senior-developer

---

### Task 2.5: Frontmatter parser + serializer

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\lib\frontmatter.js`
- [ ] Implement `parse(fileContent)` → returns `{ frontmatter: Object, body: string }`; use `js-yaml` for YAML parsing
- [ ] Implement `serialize(frontmatter, body)` → returns complete file string with `---` delimiters
- [ ] Implement `slugify(title)` per ADR-0005 slug rules (lowercase, non-alphanum → hyphen, collapse, truncate at 80 chars)
- [ ] Implement `defaultPath(type, title)` → returns vault-relative path per ADR-0005 naming convention
- [ ] Validate required base fields on parse; emit warnings (not errors) for missing optional fields
- [ ] Acceptance: parse → serialize → parse round-trip produces identical output; all 6 entry types covered by tests

**Owner:** engineering-senior-developer

---

## Phase 3 — Electron Shell

### Task 3.1: Electron scaffold

- [ ] Add `electron` and `electron-builder` to `devDependencies` in `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\package.json`
- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\main.js` — minimal `BrowserWindow` loading Vite dev server URL (`http://localhost:5173`) in dev, `dist/index.html` in prod
- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\preload.js` — `contextBridge` stub exposing `window.electron = { vault: {}, plugin: {}, http: {}, app: {} }` (empty stubs)
- [ ] Add `"main": "src-electron/main.js"` to `package.json`
- [ ] Add `npm run electron:dev` script: runs `vite` and `electron .` concurrently (use `concurrently` package)
- [ ] Add `npm run electron:build` script: runs `vite build` then `electron-builder`
- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\electron-builder.yml` with app id `com.jotfolio.app`, product name `JotFolio`, output dir `release/`
- [ ] Acceptance: `npm run electron:dev` opens a native window showing the current React UI; no console errors

**Owner:** engineering-senior-developer

---

### Task 3.2: IPC handlers — vault channels

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\ipc\vault.js`
- [ ] Implement path canonicalization + boundary check utility used by all handlers
- [ ] Implement handlers for: `vault:pick`, `vault:list`, `vault:read`, `vault:write`, `vault:move`, `vault:remove`, `vault:mkdir`, `vault:watch`, `vault:unwatch`
- [ ] `vault:write` must use temp-file-then-rename pattern (atomic write per ADR-0002)
- [ ] `vault:watch` uses Node `fs.watch()` with debounce (50ms) and deduplication; pushes `vault:watch-event` to renderer via `event.sender.send`
- [ ] Register all handlers in main.js via `ipcMain.handle()`
- [ ] Acceptance: calling `window.electron.vault.list()` from the renderer returns an array; writing a test file via `vault:write` creates it on disk; path traversal attempt returns VaultError

**Owner:** engineering-senior-developer

---

### Task 3.3: IPC handlers — plugin, http, app channels

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\ipc\plugin.js`
- [ ] Implement `plugin:list` — scans `<vault>/.jotfolio/plugins/` for `manifest.json` files
- [ ] Implement `plugin:enable`, `plugin:disable` — sets enabled flag in `.jotfolio/plugins.json` config
- [ ] Implement `plugin:uninstall` — removes plugin directory after path verification
- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\ipc\http.js`
- [ ] Implement `http:fetch` — reads `pluginId`, looks up allowlist, validates domain, performs fetch, returns `{ status, headers, body }`
- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\ipc\app.js`
- [ ] Implement `app:open-external` — validates `https://` or `mailto:` prefix, calls `shell.openExternal()`
- [ ] Implement `app:show-item-in-folder` — calls `shell.showItemInFolder()`
- [ ] Implement `app:relaunch` — calls `app.relaunch()` then `app.exit(0)`
- [ ] Acceptance: all channels respond; `http:fetch` blocks request to non-allowlisted domain; `app:open-external` rejects `file://` URLs

**Owner:** engineering-senior-developer

---

### Task 3.4: `NodeFsAdapter.js` — full implementation

- [ ] Replace stub `src/adapters/NodeFsAdapter.js` with full implementation wrapping `window.electron` IPC calls
- [ ] All methods map 1:1 to the IPC channels defined in ADR-0004
- [ ] `watch()` subscribes to `vault:watch-event` push events and fans out to local subscribers
- [ ] Deserializes IPC error objects back into `VaultError` instances
- [ ] Acceptance: with Electron running, `NodeFsAdapter` passes the same adapter test suite as `LocalAdapter`

**Owner:** engineering-senior-developer

---

### Task 3.5: preload.js — full contextBridge surface

- [ ] Replace stub preload with full `contextBridge.exposeInMainWorld('electron', {...})` per ADR-0004
- [ ] Verify no Node/Electron APIs are exposed beyond the defined shape
- [ ] Add `nodeIntegration: false`, `contextIsolation: true` to BrowserWindow webPreferences (these must be explicit, not implicit)
- [ ] Acceptance: `Object.keys(window.electron)` returns exactly `['vault', 'plugin', 'http', 'app']`; no extra properties

**Owner:** engineering-senior-developer

---

## Phase 4 — Data Migration

### Task 4.1: Migration detection and UI

- [ ] On app launch, detect if `localStorage` key `mgn-e` has entries AND no vault is currently open
- [ ] Display a migration prompt: "You have N notes in the old format. Choose a vault folder to migrate them to."
- [ ] Do not auto-migrate silently — user must explicitly pick a vault and confirm
- [ ] Show a "Export backup first" button that downloads the raw `mgn-e` JSON before migrating
- [ ] Acceptance: migration prompt appears for users with existing localStorage data; can be dismissed (keeps using localStorage web mode)

**Owner:** engineering-senior-developer

---

### Task 4.2: Migration engine

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\lib\migration.js`
- [ ] Implement `migrateFromLocalStorage(entries, adapter)` — converts JSON array to vault files per ADR-0005 schema
- [ ] Map all JSON fields to frontmatter per ADR-0005 migration table
- [ ] Generate slugs and resolve filename collisions
- [ ] Set `modified = created` for migrated entries (no historical `modified` data)
- [ ] After successful migration, write a `.jotfolio/migration-complete.json` marker with timestamp and entry count
- [ ] Do NOT delete localStorage data automatically — user must manually clear it after confirming migration looks correct
- [ ] Acceptance: 100% of test fixture entries migrate without data loss; frontmatter round-trips correctly; no filename collisions for common cases

**Owner:** engineering-senior-developer

---

### Task 4.3: Post-migration validation

- [ ] After migration, reload all files and compare count against original localStorage array
- [ ] Display a summary: "N notes migrated. M warnings (if any)."
- [ ] Warnings for: missing required fields, title collisions, unknown type values
- [ ] Acceptance: migration validation catches known edge cases (empty title, null tags, duplicate titles)

**Owner:** engineering-senior-developer

---

## Phase 5 — Plugin System

### Task 5.1: Plugin loader

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\plugin-loader.js`
- [ ] On vault open: scan `<vault>/.jotfolio/plugins/` for subdirectories containing `manifest.json`
- [ ] Validate manifest shape (required fields, id format, version semver)
- [ ] Load enabled plugins via `require()` in main process (CommonJS)
- [ ] Pass `plugin` API object to each plugin's export function
- [ ] Handle plugin load errors gracefully — a failing plugin logs an error and is skipped; other plugins still load
- [ ] Acceptance: bundled `daily-notes` plugin loads without errors; `plugin:list` returns its manifest

**Owner:** engineering-senior-developer

---

### Task 5.2: Plugin API object construction

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\plugin-api.js`
- [ ] Construct the `plugin` object with all four v0 surfaces: `vault`, `commands`, `events`, `http`
- [ ] `plugin.vault.*` enforces permissions from manifest before delegating to main process vault handlers
- [ ] `plugin.commands.register()` stores command registrations in a command registry (in-memory map)
- [ ] `plugin.events.on()` subscribes to app events dispatched from the renderer via a main-process event bus
- [ ] `plugin.http.fetch()` enforces domain allowlist from manifest
- [ ] Acceptance: Daily Notes plugin can register a command and create a file via `plugin.vault.write()`

**Owner:** engineering-senior-developer

---

### Task 5.3: Command palette integration

- [ ] Extend the existing command palette component (or create one if absent) to include plugin-registered commands
- [ ] Commands registered via `plugin.commands.register()` appear in the palette alongside built-in app commands
- [ ] Hotkeys registered by plugins are bound at the window level; conflicts logged to console
- [ ] Acceptance: opening the command palette shows "Open today's journal" from Daily Notes plugin; invoking it creates the file

**Owner:** engineering-frontend-developer

---

### Task 5.4: Plugin management UI

- [ ] Add a "Plugins" section to the Settings page
- [ ] List all discovered plugins with name, version, author, description
- [ ] Enable/disable toggle per plugin (calls `window.electron.plugin.enable/disable`)
- [ ] Uninstall button with confirmation (calls `window.electron.plugin.uninstall`)
- [ ] Show permission badges (vault_read, vault_write, http_domains)
- [ ] Acceptance: user can disable and re-enable Daily Notes plugin; disabled plugin's commands do not appear in palette

**Owner:** engineering-frontend-developer

---

## Phase 6 — Vault Sync + Watch Integration

### Task 6.1: Vault watch → UI sync

- [ ] Connect `NodeFsAdapter.watch()` to the app's note list state
- [ ] On `create` event: load the new file, parse frontmatter, add to in-memory list
- [ ] On `change` event: reload the changed file, update the in-memory entry
- [ ] On `delete` event: remove the entry from in-memory list
- [ ] Debounce UI updates: batch multiple events within a 100ms window into a single re-render
- [ ] Acceptance: editing a file externally (in VS Code) while JotFolio is open updates the note list within ~200ms without restart

**Owner:** engineering-senior-developer

---

### Task 6.2: Link graph index

- [ ] Create `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\lib\linkIndex.js`
- [ ] On vault load: scan all notes, extract `[[Title]]` patterns from bodies, build a `{ sourceId → [targetTitle] }` map
- [ ] Resolve target titles to IDs using the in-memory entry list
- [ ] Cache index to `<vault>/.jotfolio/index.json` (mtime-based invalidation)
- [ ] Rebuild affected entries after save/create/delete events
- [ ] Expose `getBacklinks(id)` — returns all entries that link to the given ID
- [ ] Acceptance: backlinks panel shows correct entries; index rebuilds after external file edit; no stale links after rename

**Owner:** engineering-senior-developer

---

### Task 6.3: Collision-safe save

- [ ] When saving a note with a title that already has a file at the expected slug path, check if the file's `id` matches
- [ ] If `id` matches: overwrite (same note, same file)
- [ ] If `id` differs: apply `-2`, `-3` suffix to new file path (collision with different note)
- [ ] Update in-memory entry's `path` field when a suffix is applied
- [ ] Acceptance: creating two notes with identical titles produces `notes/same-title.md` and `notes/same-title-2.md`; both are independently editable

**Owner:** engineering-senior-developer

---

## Phase 7 — Packaging + Distribution

### Task 7.1: electron-builder configuration

- [ ] Complete `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\electron-builder.yml`:
  - Windows: NSIS installer + portable zip; target `x64`
  - macOS: DMG + zip; target `universal` (Intel + Apple Silicon)
  - Linux: AppImage; target `x64`
- [ ] Configure code signing stubs (unsigned for now; document where to add certificates)
- [ ] Set `asar: true` (package app into asar archive)
- [ ] Configure `extraResources` to include `plugins/` bundled official plugins
- [ ] Acceptance: `npm run electron:build` produces installable artifacts for current platform; app launches from installer

**Owner:** engineering-senior-developer

---

### Task 7.2: Auto-updater scaffold

- [ ] Add `electron-updater` to dependencies
- [ ] Add update check on app launch (check after 3 seconds, non-blocking)
- [ ] Show a non-intrusive banner when an update is available: "Update available — restart to install"
- [ ] Do not auto-install without user action
- [ ] Configure publish target stub in `electron-builder.yml` (GitHub Releases — point to actual repo when ready)
- [ ] Acceptance: update check runs without crashing; banner appears in development via mock update response

**Owner:** engineering-senior-developer

---

### Task 7.3: App icon + window chrome

- [ ] Create app icon assets: `build/icon.icns` (macOS), `build/icon.ico` (Windows), `build/icon.png` (Linux, 512x512)
- [ ] Set window title to "JotFolio — {vault name}" when vault is open; "JotFolio" when no vault
- [ ] Implement native menu bar (File, Edit, View) with at minimum: New Note, Open Vault, Preferences, Quit
- [ ] Acceptance: app icon appears in dock/taskbar; window title updates when vault changes; native menu opens

**Owner:** engineering-frontend-developer

---

### Task 7.4: Crash reporting + error boundary

- [ ] Add a React error boundary at the app root that catches rendering errors and shows a "Something went wrong — restart JotFolio" screen
- [ ] Log uncaught errors in the main process to `<userData>/logs/main.log` (use `electron-log`)
- [ ] Log renderer errors to `<userData>/logs/renderer.log`
- [ ] Rotate logs at 5MB
- [ ] Acceptance: a thrown error in a feature component shows the error boundary screen, not a blank window; log file exists at expected path after error

**Owner:** engineering-senior-developer

---

### Task 7.5: First-launch onboarding flow

- [ ] On first launch (no vault configured, no localStorage migration), show the onboarding screen from `src/onboarding/`
- [ ] Onboarding must offer: "Create a new vault" (pick folder) or "Open existing vault" (pick existing JotFolio vault)
- [ ] Skip onboarding if a vault path is persisted in `electron-store` from a previous session
- [ ] Acceptance: fresh install shows onboarding; returning user opens directly to their vault

**Owner:** engineering-frontend-developer

---

## Phase completion criteria

| Phase | Done when |
|---|---|
| Phase 2 | All adapter tests pass; frontmatter round-trip is lossless for all 6 types |
| Phase 3 | Electron window opens; all IPC channels respond; vault read/write/watch functional |
| Phase 4 | Migration runs without data loss on a 500-entry test dataset; marker file written |
| Phase 5 | Daily Notes plugin loads, registers command, creates file; plugin UI shows enable/disable |
| Phase 6 | External file edit reflected in UI within 200ms; backlinks accurate after vault changes |
| Phase 7 | Build artifacts produced for current platform; installer runs; first-launch onboarding works |
