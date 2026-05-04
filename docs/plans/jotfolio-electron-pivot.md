# Plan: JotFolio — Electron Desktop Pivot

_Created 2026-04-23. Last updated 2026-05-03 to separate historical roadmap material from the current repo state. Supersedes `no-i-want-you-cuddly-pearl.md` which covered the earlier Phase 1–4 note-taking features._

---

## STATUS — INITIAL PIVOT COMPLETE; CURRENT REPO HAS MOVED TO v0.5.0-alpha.16

| Phase | Status | Shipped In | Notes |
|---|---|---|---|
| 0 — App.jsx split | ✅ Done | v0.3.0 | 2952 → 297 lines shell, feature modules under `src/features/*`, `src/lib/*` |
| 1 — ADRs | ✅ Done | v0.3.0 | 5 ADRs + task list at `docs/adr/` |
| 2 — UX + design tokens | ✅ Done | v0.3.0 | 12 wireframes at `docs/design/wireframes/` + `src/design/tokens.css` |
| 3 — Electron shell + adapters | ✅ Done | v0.3.0 | `src-electron/`, `src/adapters/`, YAML frontmatter, atomic writes |
| 3.5 — Renderer integration | ✅ Done | v0.3.0 | `useVault` hook, VaultPicker modal, migration flow (33/33 verified live) |
| 4a — Plugin runtime | ✅ Done | v0.4.0-alpha.1 | EventBus, CommandRegistry, PluginAPI (frozen), PluginHost, daily-notes plugin |
| 4b — Plugin UI | ✅ Done | v0.4.0-beta.1 | PluginsPanel, installOfficial(), git-sync stub. End-to-end verified: install → enable → command registered → note created |
| 5 — Security hardening | ✅ Done | v0.4.0-rc.1 | Threat model, IPC audit, contextBridge surface docs. CSP, prototype-pollution block, frozen API, write size cap, `will-navigate` lock, `webviewTag: false` |
| 6 — CI/CD + distribution + SRE | ✅ Done | v0.4.0 | GitHub Actions release workflow, electron-updater, Sentry telemetry (opt-in), recovery snapshots (7/4/3 retention), code-signing docs |
| 7 — Performance + a11y scaffold | ✅ Done | v0.4.1 | 14 benchmarks (all targets met), committed baseline, bench.yml CI, Playwright a11y spec, known gaps documented |

**Historical milestone:** the original 7-phase pivot closed at **v0.4.1** on 2026-04-24.
**Current local source line:** subsequent work moved the repo to **v0.5.0-alpha.16** (see `docs/CHANGELOG.md`).
**Current verified tests:** verification is tracked in the latest changelog section for alpha.16.
**Current verified desktop state:** alpha.16 verification is tracked in the latest changelog section after the release build completes.
**Current perf truth:** baseline still exists, but the latest local bench run failed regression thresholds on 2026-05-02; do not describe perf as green until those deltas are investigated.
**Process pattern evolved:** each phase started with specialist-authored plan at `docs/phase-plans/` (or inline for phases before convention was adopted), executed inline by Claude Code. Subagent dispatch for plan authorship worked; dispatch for execution consistently truncated — pattern abandoned mid-session.

---

## Context

JotFolio is currently a Vite + React web app (`C:\Users\gavin\OneDrive\Desktop\JotFolio\source`) with a single-file `App.jsx` at ~2900 lines. Production build is clean (395KB, 40 modules); vitest green (35/35).

**Just shipped this session:**
1. Inline markdown editor in detail panel (`marked`, debounced autosave)
2. `[[wiki-link]]` autocomplete popover + clickable rendering + auto-sync to `entry.links`
3. Standalone `note` entry type (peer of video/article/podcast/journal/link)
4. `Shift+N` quick-capture shortcut
5. Full dark-mode variant for all 26 themes; `prefers-color-scheme` auto-detect already wired

**The pivot (decided):**
- Become Obsidian-style. Notes = `.md` files on disk inside a user-picked "vault" folder.
- **Desktop install is primary** (download Windows/Mac/Linux installer, run it). Web build second (Edge/Chrome via File System Access API). Mobile via Capacitor later.
- All entry types (video/article/podcast/journal/link/note) become `.md` with YAML frontmatter — one unified source of truth. If JotFolio dies tomorrow, the vault still works in VS Code, TextEdit, Obsidian, Ulysses.
- **Electron over Tauri.** Plugin ecosystem demands JS plugins with Node access; Tauri's Rust-only native plugins would cripple contributor pool. Obsidian's moat is plugins; copy the moat, copy the tech.
- **Adapter pattern** for storage. `VaultAdapter` interface, implementations per platform: `NodeFsAdapter` (Electron), `WebFsaAdapter` (browser), `CapacitorFsAdapter` (mobile), `LocalAdapter` (fallback).
- Default vault = `~/Documents/JotFolio`, auto-created on first launch, changeable in settings.

## Agent Roster (orchestrator-validated)

| Slot | Agent | Why |
|---|---|---|
| Overall orchestration, roadmap, delegation | `agency-agents:agents-orchestrator` | Pipeline manager — runs PM → Arch → Dev/QA → Integration loop |
| Architecture, plugin API design, ADRs | `agency-agents:engineering-software-architect` | Owns system design + interface contracts |
| Scope → tasks, cross-session memory, phase gates | `agency-agents:project-manager-senior` | Converts specs to tasks, remembers state |
| Electron main process (IPC, menus, updater) | `agency-agents:engineering-senior-developer` | Main process = embedded Node + IPC, NOT services. Senior-dev fits; backend-architect does not |
| React renderer UI (editor, tabs, sidebar, folder tree) | `agency-agents:engineering-frontend-developer` | Owns renderer process, CodeMirror/Monaco, folder tree UI |
| Plugin runtime scaffold + first 2–3 official plugins | `agency-agents:engineering-rapid-prototyper` | Speed over polish for API validation |
| CI/CD, installer builds, signing, auto-update | `agency-agents:engineering-devops-automator` | electron-builder + GitHub Actions + code signing |
| Mobile Capacitor phase (later) | `agency-agents:engineering-mobile-app-builder` | Correct slot, correctly deferred |
| Plugin sandbox, IPC surface, contextBridge, CSP | `agency-agents:engineering-security-engineer` | Highest-risk surface in the app |
| Code review at each phase gate | `agency-agents:engineering-code-reviewer` | Mandatory exit criterion |
| MCP server/client inside plugin API | `agency-agents:specialized-mcp-builder` | Non-trivial protocol, needs specialist |
| **UX information architecture** | `agency-agents:design-ux-architect` | **ADDED** — missing caused #1 rework risk |
| **UI visual system + tokens** | `agency-agents:design-ui-designer` | **ADDED** — window chrome, tray, context menus |
| **Performance benchmarks at 1k/5k/10k notes** | `agency-agents:testing-performance-benchmarker` | **ADDED** — vault scale + backlink index = perf trap |
| **SRE — telemetry, crash reporting, update rollback, vault corruption recovery** | `agency-agents:engineering-sre` | **ADDED** — desktop with auto-update + user data needs this |

**Deferred agents** (later phases or post-launch): `engineering-technical-writer` (docs after API stabilizes), `testing-accessibility-auditor` (phase 4), `marketing-content-creator` (post-launch), `design-whimsy-injector` (optional phase 7).

---

## Phase Plan

### Phase 0 — Pre-work (blocker for everything else)

**Owner:** `engineering-frontend-developer`

**Why first:** `App.jsx` at 2900 lines is a blocker. Electron renderer imports from this file; without a split, Phase 3 becomes a circular-dep + bundle-split fight instead of Electron work.

**Tasks:**
1. Split `App.jsx` into feature modules: `src/features/editor/NoteBody.jsx`, `src/features/detail/DetailPanel.jsx`, `src/features/add/AddModal.jsx`, `src/features/constellation/`, `src/features/sidebar/Sidebar.jsx`, `src/features/theme/themes.js`, `src/app/App.jsx` (shell only).
2. Preserve all current behavior; no new features during split.
3. Update imports, run `npm test` + `npm run build` green.

**Exit criteria:** `App.jsx` under 300 lines; every other file under 600 lines; tests green; production build clean.

**Reviewer:** `engineering-code-reviewer`.

---

### Phase 1 — Foundation (no implementation)

**Owners:** `engineering-software-architect` + `project-manager-senior`

**Deliverables:**
1. ADR covering:
   - Monorepo layout (`src/`, `src-electron/`, `src/adapters/`, `plugins/`, `vault-schema/`)
   - `VaultAdapter` interface contract (methods, error model, watch semantics)
   - **Plugin API surface v0 — cut aggressively**: `vault.*`, `commands.*`, `events.*`, `http.fetch` only. All of `ribbon.*`, `settings.*`, `oauth.*`, `keychain.*`, `webhook.*`, `ai.*`, `mcp.*`, `scheduler.*`, `notifications`, `clipboard` → **deferred to v1**. Obsidian shipped with ~90% of its plugin use cases covered by just these four surfaces.
   - IPC channel map (request/response schemas)
   - YAML frontmatter schema per entry type
2. Task list with concrete acceptance criteria for Phases 2–7.

**Exit criteria:** Architect signs off on `VaultAdapter` interface + plugin API v0; PM hands off task list; zero implementation.

---

### Phase 2 — UX + Design System

**Owners:** `design-ux-architect` + `design-ui-designer`

**Deliverables:**
1. Wireframes: vault picker first-run, folder tree sidebar, file list, editor pane, backlinks panel, command palette (Cmd/Ctrl+P), settings.
2. Design tokens as CSS variables in `src/design/tokens.css` covering Electron window chrome, tray icon, native context menus, light + dark across existing 26 themes.
3. Interaction spec: drag-to-split panes deferred; single detail panel stays for now.

**Exit criteria:** Frontend dev can start with zero UX questions open. Tokens file committed. Reviewed by `engineering-code-reviewer`.

---

### Phase 3 — Electron Shell + Renderer Core

**Owners:** `engineering-senior-developer` (main process) + `engineering-frontend-developer` (renderer)

**Tasks:**
1. Scaffold `src-electron/main.ts` + `src-electron/preload.ts` (contextBridge exposing `vault.*` only).
2. Implement `NodeFsAdapter` using `node:fs/promises` + `chokidar` for watch.
3. Implement `VaultAdapter` interface + `LocalAdapter` fallback for web dev.
4. Vault picker UI — uses Electron's `dialog.showOpenDialog` in main, bridged to renderer via IPC.
5. YAML frontmatter parse/serialize — inline implementation (~80 lines, no new dep) or `gray-matter` if warranted.
6. Migrate existing localStorage entries → `.md` files on first vault pick (one-time).
7. Folder tree sidebar — render vault hierarchy, expand/collapse, click to open note.
8. Wire existing NoteBody + detail panel to `VaultAdapter` calls instead of localStorage.

**Exit criteria:**
- Open vault → create note → write content → quit app → relaunch → content persists on disk as `.md`.
- Existing `marked` markdown rendering + `[[wiki-link]]` autocomplete still work unchanged.
- No plugin system yet. That's Phase 4.
- Reviewed by `engineering-code-reviewer`.

---

### Phase 4 — Plugin Runtime + 2 Official Plugins

**Owners:** `engineering-rapid-prototyper` + `specialized-mcp-builder`

**Tasks:**
1. Plugin loader: scans `vault/.jotfolio/plugins/` on boot, imports `manifest.json` + `main.js`, sandboxes execution with restricted `PluginAPI` surface.
2. Implement API v0: `vault.read/write/list/watch`, `commands.register`, `events.on`, `http.fetch` (via main process proxy for CORS).
3. Ship **Daily Notes** plugin — creates `journals/2026-04-23.md` on first run each day, with template.
4. Ship **Git Sync** plugin — `git init` the vault, commit on save (debounced 60s), push on idle.
5. Plugin settings UI in main app settings panel.

**Exit criteria:**
- Third-party plugin drops into `vault/.jotfolio/plugins/foo/` → appears in settings → can be toggled → runs.
- Plugin cannot read files outside the vault root.
- Plugin cannot access Node APIs directly (only through `PluginAPI` surface).
- Both official plugins pass security review.
- Reviewed by `engineering-code-reviewer` + `engineering-security-engineer`.

---

### Phase 5 — Security Hardening

**Owner:** `engineering-security-engineer`

**Deliverables:**
1. contextBridge audit — confirm renderer cannot invoke arbitrary Node.
2. IPC surface threat model — enumerate every `ipcMain.handle` / `ipcRenderer.invoke`, document inputs, assert sanitization.
3. Plugin sandbox review — verify capability-based access, no escape via `require`, no access to global `process` / `fs`.
4. CSP headers for renderer.
5. Path traversal tests — confirm plugin can't write to `../../etc/passwd`.
6. Code signing strategy (Windows: EV cert or Azure Trusted Signing; Mac: Apple Developer ID + notarization).

**Exit criteria:** No uncontrolled Node access from renderer or plugins. Path traversal blocked. Signed threat model document committed.

---

### Phase 6 — CI/CD + Distribution + SRE

**Owners:** `engineering-devops-automator` + `engineering-sre`

**Tasks (DevOps):**
1. GitHub Actions workflow: Win/Mac/Linux build matrix on every release tag.
2. `electron-builder` config producing `.exe` (NSIS), `.dmg`, `.deb`, `.AppImage`.
3. Code signing on Win + Mac; Apple notarization.
4. `electron-updater` integration + GitHub Releases as update feed.
5. Download page on jotfolio.app (or wherever) with OS auto-detect button.

**Tasks (SRE):**
1. Crash telemetry via Sentry or self-hosted equivalent (opt-in, privacy-first).
2. Update rollback: previous-version binary retained, user can downgrade.
3. Vault corruption recovery: `.jotfolio/recovery/` stores last-known-good snapshots weekly.
4. Status page for auto-update CDN.

**Exit criteria:** Push a release tag → signed installers published to GitHub Releases automatically → installed app auto-updates from prior version.

---

### Phase 7 — Performance + Polish (ship-gate)

**Owners:** `testing-performance-benchmarker` + `design-whimsy-injector` (optional)

**Tasks:**
1. Benchmarks: cold-start time, vault-open time, search latency, backlink index build time, at 1k / 5k / 10k `.md` files.
2. Targets: cold start < 2s, vault open < 1s @ 5k notes, search < 100ms, backlink rebuild on save < 50ms.
3. Regression suite so future changes don't silently degrade.
4. Optional polish: subtle animations, empty-state copy, first-run delight.

**Exit criteria:** All benchmarks meet targets. Accessibility spot-check via `testing-accessibility-auditor` (WCAG AA on primary flows).

---

## Deferred (post-launch)

- Plugin API v1 expansion: `ribbon.*`, `settings.*`, `oauth.*`, `keychain.*`, `webhook.*`, `ai.*`, `mcp.*`, `scheduler.*`, `notifications`, `clipboard`
- Tabs + drag-to-split pane system
- Mobile Capacitor build
- Web (Edge/Chrome) build with `WebFsaAdapter`
- Community plugin registry / directory
- Sync service (or rely on iCloud / Dropbox / Git)

---

## Risks + Mitigations

1. **Design skipped → navigation rebuilt twice.** Mitigation: Phase 2 is non-optional; frontend dev is blocked from Phase 3 until design tokens + wireframes committed.
2. **Plugin API overscoped → first install delayed.** Mitigation: v0 = four surfaces only; architect enforces cut in Phase 1.
3. **App.jsx monolith → Electron integration hell.** Mitigation: Phase 0 split is the gate; no Phase 1 start until split is merged + tests green.
4. **Electron installer too large.** Mitigation: accepted trade for plugin ecosystem; mitigate with `electron-builder` asar compression + native module pruning. Target < 150MB installed.
5. **Vault corruption from concurrent writes.** Mitigation: write queue per file in `NodeFsAdapter`; atomic write via temp-file rename.
6. **Plugin security escape.** Mitigation: Phase 5 threat model gates Phase 6 distribution.

---

## Critical Files (to be created / modified)

- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\App.jsx` — split in Phase 0
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\adapters\` — new directory, Phase 3
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\adapters\VaultAdapter.js` — interface
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\adapters\NodeFsAdapter.js` — Electron impl
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\adapters\LocalAdapter.js` — web-dev fallback
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\main.ts` — new
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src-electron\preload.ts` — new
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\design\tokens.css` — Phase 2
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\src\plugins\` — Phase 4
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\package.json` — add `electron`, `electron-builder`, `chokidar`, `electron-updater`
- `C:\Users\gavin\OneDrive\Desktop\JotFolio\source\.github\workflows\release.yml` — Phase 6

---

## Verification Per Phase

Each phase exit requires, at minimum:
1. `npm run build` — zero errors
2. `npm test` — all green
3. Manual smoke test of phase deliverable
4. `engineering-code-reviewer` sign-off
5. Any phase-specific extras (security threat model, benchmarks, etc.)

---

## v0.5.0 Backlog (current open work after alpha.16)

Historical accepted risks from phases 0–7 are preserved below, but this list has been pruned to the work that is still actually open after the alpha.16 local source line.

### Security (carried from Phase 5)
- **Symlink realpath check** in `src-electron/main.js:resolveSafe`. Reject files whose `fs.realpath(abs)` escapes vault root.
- **Snapshot restore path validation parity.** `snapshot:restore` should enforce the same vault-boundary guarantees as normal vault writes.
- **Tighten CSP.** Drop `connect-src *` once plugin domain allowlists can be composed per-plugin. Revisit `'unsafe-eval'` usage in the plugin-loading path.
- **DOMPurify wrap** over `marked.parse` output in NoteBody as belt-and-suspenders.

### UX (carried from Phase 4b.5)
- **Folder tree sidebar** per wireframe 03. Expandable, drag-move, rename (F2), create folder.
- **Real git-sync** in `plugins/git-sync/` — ships `git:*` IPC channel from main process (spawn git subprocess), plugin uses it. Current plugin = stub only.
- **Full file-management workflows** — move, rename, create folder, reveal in Explorer/Finder, safe delete, and attachment handling in the main UI.
- **Update preferences** — channel selection and deeper updater controls after the basic alpha.10 Updates surface.

### Accessibility (carried from Phase 7 `known-a11y-gaps.md`)
- Manual verification for Constellation keyboard + screen-reader behavior
- 26-theme contrast audit (auto-adjust `--t3` / `--br` tokens when <AA)
- Focus-visible outline on dropdowns
- Command palette + quick switcher manual AT verification
- High contrast, reduced motion, and 200%/400% zoom checks

### Performance (carried from Phase 7)
- **Investigate current bench regressions** in `frontmatter-roundtrip`, `search-5k`, `backlink-rebuild-1k`, and vault-scan metrics before claiming performance health.
- **Incremental backlink rebuild** if usage reveals full-rescan is painful at larger library sizes.
- **Full-text search index** if the current linear scan no longer meets the product target envelope.

### Platforms
- **Web build ship** (Edge/Chrome via `WebFsaAdapter` using File System Access API). Adapter shape already defined, not yet implemented.
- **Mobile via Capacitor** (`CapacitorFsAdapter`). iOS + Android. Separate repo or monorepo package.

### Operational (user-side, one-time)
- Sentry account + DSN + auth token → `.env.local` + GitHub Secrets (prompt already delivered)
- Apple Developer enrollment + cert + notarization setup per `docs/build/code-signing.md`
- Windows signing cert (start OV, upgrade Azure Trusted Signing)
- Configure Apple notarization credentials in the release environment
- First signed release after the code-signing placeholders are replaced

### Process
- Formalize two-tier plan pattern: roadmap (this file) + per-phase plan at `docs/phase-plans/NN-<name>.md`. Phase 7 set the precedent; retrofit earlier phases only if contributors need them.

---

## Deliverable inventory (what exists as of v0.4.1)

**ADRs (5):** `docs/adr/ADR-0001` through `ADR-0005` + `TASKS.md`
**Wireframes (12):** `docs/design/wireframes/01-first-run.md` through `12-window-chrome-and-native.md`
**Security docs (3):** `docs/security/threat-model.md`, `ipc-audit.md`, `contextBridge-surface.md`
**Build docs (2):** `docs/build/code-signing.md`, `release-process.md`
**Perf docs (2):** `docs/perf/bench-targets.md`, `known-a11y-gaps.md`
**Phase plans (1):** `docs/phase-plans/07-performance.md` (first to use two-tier pattern)
**Source adapters (5):** `VaultAdapter`, `LocalAdapter`, `NodeFsAdapter`, `VaultError`, `index.js`
**Plugin system (5):** `EventBus`, `CommandRegistry`, `PluginAPI`, `PluginHost`, `officialPlugins`
**Official plugins (2):** `plugins/daily-notes/`, `plugins/git-sync/`
**Electron shell (5):** `main.js`, `preload.js`, `menus.js`, `updater.js`, `telemetry.js`, `snapshots.js`, `README.md`
**UI features:** `VaultPicker`, `useVault`, `PluginsPanel`, `PrivacyPanel`, `NoteBody`, wired through `SettingsPanel`
**Benchmark suite:** `bench/runBench.js` + 6 measure modules + `baseline.json`
**CI (2):** `source/.github/workflows/release.yml`, `source/.github/workflows/bench.yml`
**Tests:** 84/84 green across 12 test files

---

_Plan closed. Pivot shipped. v0.5.0 backlog above is the next plan's starting seed._
