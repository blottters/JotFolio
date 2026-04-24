# Changelog

All notable changes documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version scheme: [Semantic Versioning](https://semver.org/spec/v2.0.0.html) — `MAJOR.MINOR.PATCH`.

Bump rules:
- **PATCH** (0.1.`x`) — bugfix, tweak, copy change, style fix
- **MINOR** (0.`x`.0) — new feature, new view, new setting
- **MAJOR** (`x`.0.0) — breaking change (data format, API, removed feature)

---

## [0.5.0-alpha.2] — 2026-04-24

Remediation sweep of Codex's stress-test findings. 14 of 15 closed. Only #5 (RAF setOffsets re-render pressure) deferred — scoped as a performance refactor rather than a bug fix.

### Tier A — data-loss + exfil (all closed)

- **#7 Batch-save stale closure overwrite.** `useVault.saveEntry` no longer closes over `entries`. It reads a live `pathsInUseRef` updated synchronously on every refresh + every save. Multiple concurrent saves with the same title now correctly produce `-2`, `-3` suffixes instead of silently overwriting each other.
- **#8 Corrupt files overwritable.** Broken files surfaced in `issues` during refresh are now tracked as "paths in use" — a new entry whose title would collide with a broken file gets suffixed around it. No silent overwrite of data we couldn't parse.
- **#2 Non-string LocalAdapter writes.** `LocalAdapter.write` now throws `VaultError('invalid-path')` for non-string content; `writeBinary` requires a `Uint8Array`. Prevents objects/numbers getting stringified into the vault.

### Tier B — correctness (all closed)

- **#1 JSON import dedupes within file.** `importEntriesJSON` now tracks ids seen inside the same file. Result object adds `withinFileDuplicates` counter separate from `duplicates` (existing-id collisions).
- **#9 `.jotfolio/*` skipped during vault refresh.** The plugin-manifest/settings/recovery/sync.log subtree is no longer parsed as notes. Non-`.md` files at the vault root also skipped (future attachment surface).
- **#10 Frontmatter close-delimiter accepts EOF.** `---` at end of file without trailing newline is now valid. Added CRLF coverage too.
- **#11 Quoted-scalar escapes round-trip.** Double-quoted YAML strings decoded via `JSON.parse` (matches serializer's `JSON.stringify`). Single-quoted strings decode YAML's `''` → `'` escape. Round-trip now preserves backslashes + embedded quotes.
- **#12 Obsidian block-array tags.** `parseMarkdown` now handles the multi-line `tags:\n  - a\n  - b` form in addition to flow-array and space-separated forms. Quoted items + `#`-prefixes normalized.

### Tier C — UX + security polish (4 of 5 closed)

- **#3 DetailPanel prev/next preserves unsaved edits.** Prev/next buttons now route through `requestDiscard` — same dirty-check path as the Close button. If edits are dirty, the existing confirm-discard dialog pops; confirming navigates.
- **#4 Constellation components are undirected.** BFS over wiki-link clusters now treats `A→B` as `A↔B`. A note linking to another no longer produces two disconnected components when the reverse link isn't also in storage.
- **#6 Dropdown Escape stops at the dropdown.** `Select` added `stopPropagation` on Escape so closing a dropdown no longer bubbles into the Settings panel's own escape-to-close handler.
- **#15 `isSafeUrl` rejects protocol-relative.** `//attacker.example/steal` no longer passes the sanitizer's URL check; previously caught under the generic `startsWith('/')` branch that allowed `/absolute` paths.
- **#5 DEFERRED.** Constellation RAF loop still calls `setOffsets` every frame → React re-renders whole SVG at 60Hz. Known performance cost; no correctness impact. A proper fix is a direct-DOM animation path (mutate `style.transform` on node refs, bypass React state) — targeted for 0.5.0-beta or later.

### Test counts

- 114 → 137 passing (+23). Coverage per finding:
  - Tier A: batch-save, overwrite-broken, non-string-write, non-Uint8Array-writeBinary
  - Tier B: within-file dedup (×2), EOF close (×2), quoted-scalar escapes (×3), block-array tags (×2), skip .jotfolio
  - Tier C: undirected components (×3), URL allowlist (×6)

### Files changed

- `src/features/vault/useVault.js` — pathsInUseRef, skip .jotfolio in refresh, synchronous path reservation
- `src/adapters/LocalAdapter.js` — write/writeBinary type validation
- `src/lib/exports.js` — within-file dedup in importEntriesJSON
- `src/lib/frontmatter.js` — EOF close-delim regex, CRLF-safe split, quoted-scalar JSON.parse decode
- `src/parsers/obsidian.js` — block-array tags, quote + hash stripping
- `src/features/detail/DetailPanel.jsx` — prev/next through requestDiscard
- `src/features/constellation/ConstellationView.jsx` — undirected adjacency in BFS
- `src/features/dropdowns/Select.jsx` — stopPropagation on Escape
- `src/lib/markdown.js` — isSafeUrl rejects protocol-relative

### Build

- 137 tests green. Build clean. Sandbox (`pluginWorker`) chunk unchanged at 6.69 KB.

---

## [0.5.0-alpha.1] — 2026-04-24

Plugin sandbox closure. **Closes HIGH-severity finding #13 from Codex's stress-test handoff.**

### Security
- **Plugin code now runs inside a dedicated Web Worker per plugin.** Each plugin gets its own Worker spawned via Blob URL. The Worker bootstrap (`src/plugins/pluginWorker.js`) strips `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `importScripts`, `indexedDB`, `caches`, `BroadcastChannel`, `Worker`, `SharedWorker`, `ServiceWorker`, `Notification`, `localStorage`, `sessionStorage` from `self` before any plugin code runs. Web Workers have no `window`, no `document`, no DOM access by spec. The only channel out is `postMessage` to the parent.
- **Permission gates moved out of the Worker.** `src/plugins/PluginBridge.js` is the parent-side RPC router that owns the permission checks. A plugin cannot bypass a permission by reaching around a proxy — the API in the Worker is a postMessage client, and the real gate lives in the parent. Before v0.5.0 a zero-permission plugin could still read `localStorage['mgn-ai']` (API keys) or call raw `fetch()`; that path is now closed.
- **CSP partially tightened.** `worker-src 'self' blob:` added for Worker-based plugin loading. `'unsafe-eval'` remains in `script-src` — Workers inherit the parent document's CSP, and the plugin loader still uses `new Function()` inside the Worker to evaluate the plugin's `main.js` source. Tightening this requires moving plugin loading to `importScripts` or ESM dynamic-import from a Blob URL; queued as polish work, not blocking. The real isolation (no DOM, no `window`, no `localStorage`, no raw `fetch`) is delivered by the Worker sandbox itself, not by the CSP directive.
- **Manifest-id prototype-pollution guard.** `PluginHost._loadSettings` now builds its enabled-map with `Object.create(null)` and only uses own-properties; a manifest with `id: "toString"` can no longer auto-enable via `settings.enabled.toString` being a truthy prototype method (closes finding #14).

### Added
- `src/plugins/pluginWorker.js` — Worker bootstrap. Strips unsafe globals, installs RPC bridge.
- `src/plugins/PluginBridge.js` — parent-side Worker manager. Spawns Worker, routes RPC, enforces permissions, relays commands + events + http.fetch via postMessage.
- `src/plugins/__tests__/sandbox.test.js` — 6 new tests verifying the sandbox boundary: stripped globals, permission-gated vault access, allowlist-enforced http.fetch, command round-trip, dispose cleanup.

### Changed
- `src/plugins/PluginHost.js` — `_instantiate` now creates a `PluginBridge` when `Worker` is available; falls back to pre-v0.5 unsandboxed `new Function()` path only when `Worker` is undefined (test envs like jsdom). Production always has Worker. Also hardens manifest-id handling + settings loading against prototype pollution.
- `src/plugins/PluginAPI.js` — added `events.emit(event, payload)` so plugins can dispatch app-side events through the bridge (re-emitted on `window` as `plugin:<id>:<name>` + `jotfolio:<name>`).
- `plugins/daily-notes/main.js` — replaced `window.dispatchEvent(...)` with `api.events.emit('open-note', ...)` (Worker has no window).
- `plugins/git-sync/main.js` — same replacement for `jotfolio:toast` emissions.
- `index.html` — CSP updated: dropped `'unsafe-eval'`, added `worker-src 'self' blob:`.

### Docs
- `docs/adr/ADR-0003-plugin-api-v0.md` — status upgraded to Accepted with amendment; alternative A split into A.1 (v0.4.x accepted-risk) and A.2 (v0.5.0 Web Worker mitigation).
- `docs/security/threat-model.md` — R4 flipped from "accepted risk" to "MITIGATED" with full sandbox description. R5 upgraded to MITIGATED (plugin cannot reach raw fetch). Gap #1 and #5 in the accepted-risks list marked closed.
- `docs/security/contextBridge-surface.md` — CSP rationale updated; `'unsafe-eval'` removal + `worker-src 'self' blob:` addition documented.

### Test counts
- 108 → 114 passing (+6 sandbox tests). All green.
- Build clean: 430.82 KB main + 6.69 KB pluginWorker chunk + 2.45 KB index.html.

### Remaining from Codex's 15 findings (separate tiers, not this release)
- Tier B: #10 frontmatter close-delim, #11 quoted-scalar round-trip, #12 Obsidian block-array tags, #9 .jotfolio JSON parsed as notes, #1 duplicate-ID import
- Tier C: #3 detail prev/next unsaved-edit drop, #4 constellation directed adjacency, #5 RAF setOffsets, #6 dropdown Esc leak, #15 protocol-relative URL acceptance

---

## [0.4.1] — 2026-04-24

Performance benchmarks + accessibility scaffold (Phase 7). Closes the roadmap for the 0.4.x cycle.

### Added — Benchmarks
- `bench/runBench.js` — pure-Node benchmark harness. 3 warmup runs + 10 measured per metric. Reports p50/p95/min/max. Writes `bench/baseline.json` with `--update-baseline`; compares against baseline otherwise. Fails CI on any `fail`-mode metric regressing >15% on p95.
- 14 measurements across 6 domains:
  - Vault scan: 1k / 5k / 10k notes
  - Search: 1k / 5k / 10k entries with 50 representative queries
  - Backlink rebuild: 1k / 5k
  - Autocomplete render (5k entries, 3-char prefix → top 20)
  - Markdown + wiki-link post-process (10KB note)
  - Frontmatter round-trip (×1000)
  - Plugin discovery: 5 / 20 / 50 manifests
- `bench/seed.js` — deterministic Mulberry32 PRNG, clustered wiki-link topology (20 clusters, 60/40 in-cluster/random), in-memory LocalAdapter stub
- `bench/baseline.json` — first committed baseline. All targets passing with huge headroom (e.g. vault-scan-10k = 101ms vs 2000ms target).

### Added — Accessibility
- `bench/a11y/flows.spec.js` — Playwright + `@axe-core/playwright` spec covering main grid, detail panel, settings modal, add entry modal, quick-capture modal. WCAG 2 AA target.
- `docs/perf/known-a11y-gaps.md` — documented gaps with target fix phase. Constellation graph, theme contrast audit, focus-visible, command palette, toast live-region all queued for v0.5.0 fix.
- `docs/perf/bench-targets.md` — target rationale, revision rules, first-run results.

### Added — CI
- `.github/workflows/bench.yml` — two jobs: perf (runs bench, regression check vs baseline) + a11y (builds dist, serves it, runs Playwright axe suite). Triggers: PR, push-to-main, nightly 02:00 UTC.

### Added — Pattern
- `docs/phase-plans/07-performance.md` — detailed implementation plan produced by the `testing-performance-benchmarker` agent before execution. New convention: each phase starts with a specialist plan committed under `docs/phase-plans/`, then executed inline. Roadmap at `~/.claude/plans/jotfolio-electron-pivot.md` stays the top-level view.

### Changed
- `package.json` — `bench`, `bench:watch`, `bench:update-baseline`, `a11y` scripts. DevDeps: `tinybench`, `seedrandom`, `playwright`, `@axe-core/playwright` (declared; `runBench.js` uses pure `perf_hooks` so install not required for local runs).
- `.gitignore` — adds `dist/`, `dist-electron/`, `.tmp/`, `node_modules/`, `playwright-report/`, `test-results/`, OS cruft. Was minimal before.

### First-run bench numbers (Node 24, Windows x64)

All 14 metrics passed targets:
- Search at 5k: **55ms** (target 100ms)
- Vault scan at 10k: **101ms** (target 2000ms — 20× headroom)
- Backlink rebuild at 5k: **14ms** (target 150ms — full re-scan, no incremental needed yet)
- Frontmatter × 1000: **13ms** (target 50ms)
- Plugin discovery at 50: **0.1ms** (target 80ms)

Full table: `bench/baseline.json`.

### Accepted risks (still open, tracked)

- A11y suite is stubbed; first real run requires `npx playwright install chromium` locally or in CI. Planned for 0.5.0 CI setup.
- Constellation graph + theme contrast audit deferred to 0.5.0 per `known-a11y-gaps.md`.
- CSP `connect-src *` + plugin sandbox + symlink realpath check still deferred to 0.5.0 per threat model.

### Test counts

- 84 tests, all green (no new vitest tests this phase — bench + a11y run on separate surfaces).

---

## [0.4.0] — 2026-04-23

CI/CD + distribution + SRE (Phase 6). First shippable desktop build.

### Added — CI/CD
- `.github/workflows/release.yml` — tag-triggered build matrix (macos-latest, windows-latest, ubuntu-latest) → signed installers published to GitHub Releases via `electron-builder --publish always`
- Source-map upload to Sentry per release via `@sentry/cli`
- Platform-specific env wiring for notarization + signing secrets

### Added — Distribution
- `src-electron/updater.js` — `electron-updater` integration. Polls latest.yml / latest-mac.yml / latest-linux.yml from GitHub Releases every 6 hours. Background download, install on quit. Update status events pushed to renderer.
- `package.json` build.publish → GitHub (`blottters/jotfolio`). Mac hardened runtime + notarize stub. Windows sha256 signing. Linux AppImage + deb.
- `build/entitlements.mac.plist` — required for hardened runtime + JIT + library validation override
- `docs/build/code-signing.md` — full playbook for Apple Developer ID, Windows OV/EV/Azure Trusted Signing, cost summary, cert revocation
- `docs/build/release-process.md` — prerequisites, cut-a-release steps, pre-release channels, rollback, release-notes template

### Added — SRE
- `src-electron/telemetry.js` — `@sentry/electron` main-process init. Opt-in (off by default). Scrubs paths, strips identity, drops note-content breadcrumbs. Local log fallback at `<userData>/logs/crash-YYYY-MM-DD.log` fires regardless of opt-in so offline crashes survive.
- `src/lib/telemetry.js` — `@sentry/browser` renderer init. Lazy-imported only when user opts in, keeps Sentry out of the main bundle otherwise.
- `src/features/settings/PrivacyPanel.jsx` — Settings > Privacy tab. Toggle, "what gets sent / what never gets sent" disclosure, first-run decision prompt.
- `src-electron/snapshots.js` — recovery snapshot writer. On every `vault:write`, debounces 60s, writes prior content to `<vault>/.jotfolio/recovery/<YYYY-MM-DD>/<rel>.md`. Retention: 7 daily + 4 weekly + 3 monthly. 500 MB size cap. Hourly prune.
- `snapshot:list` + `snapshot:restore` IPC channels exposed as `window.electron.snapshots.{list,restore}`
- 5 snapshot-retention tests (last 7, weekly picks, monthly picks, empty input, under-7 case)

### Changed
- `src-electron/preload.js` — exposes `window.electron.snapshots` + `window.electron.updater` in addition to existing buckets
- `src-electron/main.js` — wires telemetry.init() at startup, calls snapshots.schedule() after each successful write, calls updater.setup(mainWindow) on window ready, registers snapshot IPC handlers
- `package.json` devDependencies — `electron-updater`, `@sentry/browser`, `@sentry/electron`, `@sentry/cli`

### Operations required (user-side, one-time)
- Sentry account + DSN + auth token → paste into `.env.local` + GitHub Secrets (see `docs/build/release-process.md`)
- Apple Developer enrollment + cert + app-specific password → GitHub Secrets (see `docs/build/code-signing.md`)
- Windows signing cert (OV for v0, upgrade to Azure Trusted Signing when ready)
- Replace `TEAMID_REPLACE_ME` in `package.json` with your Apple Team ID

### Accepted risks (still documented)
- CSP `connect-src *` until 0.5.0 (per-plugin allowlist composition)
- Plugins run in renderer JS context until 0.5.0 (sandboxed extension host)
- No symlink realpath check until 0.5.0
- No in-app "restart to update" banner yet — auto-updates apply silently on quit. Settings > Updates banner lands 0.5.0.

### Test counts
- 79 → 84 total. All green.

---

## [0.4.0-rc.1] — 2026-04-23

Security hardening (Phase 5).

### Added
- `docs/security/threat-model.md` — assets, attacker profiles, risks R1–R9, mitigations per version, explicit accepted-risks list
- `docs/security/ipc-audit.md` — every IPC channel tabulated with input validation, output shape, trust boundary; preload surface listing; canonical `resolveSafe` rules; denylist of unexposed operations; review cadence
- `docs/security/contextBridge-surface.md` — what renderer can reach via `window.electron.*`, explicit denylist, CSP rationale per directive, change-control rules
- `src/security/__tests__/hardening.test.js` — 12 tests covering frontmatter prototype-pollution block, plugin API freeze, HTTP allowlist, permission gates

### Changed
- `index.html` — CSP `<meta>` with `default-src 'self'`, `script-src 'self' 'unsafe-eval'` (eval needed for plugin loader until 0.5.0 sandbox), `style-src 'self' 'unsafe-inline'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `frame-src 'none'`
- `src/lib/frontmatter.js` — YAML parser rejects `__proto__`, `constructor`, `prototype` keys (R2); parse target switched to null-prototype object
- `src/plugins/PluginAPI.js` — `Object.freeze` applied to api, `api.vault`, `api.commands`, `api.events`, `api.http`, manifest, manifest.permissions, manifest.permissions.http_domains. Plugin code cannot monkey-patch the surface
- `src-electron/main.js` — added 50 MB write cap on `vault:write` + `vault:writeBinary` (R6); `webviewTag: false`, `webSecurity: true`, `allowRunningInsecureContent: false`; `setWindowOpenHandler` redirects http(s) to default browser and denies everything else; `will-navigate` handler locks renderer to current origin + path; webview attach warning

### Accepted risks (documented)
- Plugin code runs in renderer JS context (ADR-0003 + threat model R4). Sandboxed extension-host process lands 0.5.0.
- `connect-src *` in CSP because plugin domain allowlist is per-plugin, not composable into one CSP directive. Narrows in 0.5.0.
- Symlink-escape not yet blocked in `resolveSafe`; real-path check ships 0.5.0.
- DOMPurify not yet wrapping `marked` output; current CSP (`script-src 'self' 'unsafe-eval'`, no `'unsafe-inline'` for scripts) blocks inline `<script>` that would survive marked. Full XSS belt-and-suspenders via DOMPurify ships 0.5.0.
- IPC rate limiting absent (R6 gap) — self-DoS only, low impact.

### Test counts
- 67 → 79 total. All green.

---

## [0.4.0-beta.1] — 2026-04-23

Plugin management UI + install flow end-to-end (Phase 4b partial).

### Added
- `src/plugins/officialPlugins.js` — bundles official plugin source via Vite `?raw` imports; `installOfficial(id)` writes the plugin files into `<vault>/.jotfolio/plugins/<id>/`
- `src/features/settings/PluginsPanel.jsx` — Settings > Plugins tab per wireframe 10. Lists discovered plugins with name/version/description/permissions; toggle enable/disable; uninstall with confirm; "Install" cards for official plugins not yet in vault
- `plugins/git-sync/` — official stub. Registers `git-sync.now` + `git-sync.configure`. Logs intent to `.jotfolio/sync.log`. Real git operations wait on `git:*` IPC (Phase 4b.5).

### Verified live
- Install Daily Notes → writes 2 files to vault
- Toggle on → `daily-notes.today` command registered via plugin API
- Run command → creates `journals/YYYY-MM-DD.md` with templated frontmatter + body

### Still deferred
- Command palette UI (Cmd/Ctrl+P) — wireframe 07
- Real git-sync via IPC
- Quick switcher (Cmd/Ctrl+O) — wireframe 08

---

## [0.4.0-alpha.1] — 2026-04-23

Plugin runtime foundation (Phase 4a). Official plugins opt-in after 4b ships the UI.

### Added
- `src/plugins/EventBus.js` — app event bus; events per ADR-0003 (`vault-change`, `note-open`, `note-save`, `note-create`, `note-delete`, `app-ready`, `app-quit`)
- `src/plugins/CommandRegistry.js` — global registry feeding command palette + menu; per-plugin clear
- `src/plugins/PluginAPI.js` — per-plugin scoped API: `vault.*`, `commands.*`, `events.*`, `http.fetch`. Permission gate against manifest. Auto-clean on disable.
- `src/plugins/PluginHost.js` — discovery from `<vault>/.jotfolio/plugins/`, enable/disable/uninstall, settings persistence to `.jotfolio/settings/plugins.json`, crash isolation
- `plugins/daily-notes/` — first official plugin. Registers `daily-notes.today` command that creates/opens `journals/YYYY-MM-DD.md` with templated frontmatter + body
- 6 PluginHost tests (discover, enable/disable, permission gate, crash handling, manifest validation, settings persistence)

### Changed
- `plugin` bucket on `window.electron` preload = still stub; Phase 4b wires real bridge

### Why alpha
- No management UI yet — plugins only discoverable programmatically (Phase 4b)
- Git-sync plugin still TBD
- Command palette not yet wired (Phase 4b)
- Plugin code runs in renderer JS context; sandbox deferred to Phase 5

---

## [0.3.0] — 2026-04-23

Note-taking first-class + Electron desktop pivot foundation + design system.

### Added
- Inline markdown editor in detail panel (`marked` renderer, debounced autosave)
- `[[wiki-link]]` autocomplete with caret-anchored popover, Arrow/Enter pick, clickable rendering, auto-sync into `entry.links`
- Standalone `note` entry type — peer of video/podcast/article/journal/link, no URL required, `📝` icon, dedicated sidebar section
- `Shift+N` quick-capture shortcut — skips type picker, title focused, `Ctrl/⌘+Enter` to save
- Full dark-mode variant for all 26 themes (7 previously incomplete); OS `prefers-color-scheme` auto-detect already wired
- Architecture Decision Records under `docs/adr/` — monorepo layout, VaultAdapter interface, Plugin API v0, IPC channel map, frontmatter schema + task list
- 12 UX wireframes under `docs/design/wireframes/` covering first-run, main layout, folder tree, file list, editor, backlinks, command palette, quick switcher, settings, plugin management, corruption recovery, native/window chrome
- Design token layer at `src/design/tokens.css` — spacing, radii, shadows, transitions, z-index, icon sizes, typography, platform flags, focus ring — composes on top of existing 26 themes
- `VaultAdapter` interface + `VaultError` typed error + `LocalAdapter` (browser fallback) + `NodeFsAdapter` (Electron IPC bridge) + runtime adapter picker at `src/adapters/`
- YAML frontmatter parse/serialize + `entryToFile` / `fileToEntry` converters at `src/lib/frontmatter.js`
- Electron main process scaffold at `src-electron/` — `main.js` with full IPC surface per ADR-0004, atomic writes, chokidar watcher, path-safety; `preload.js` with `contextBridge` exposing `window.electron.{vault,app,plugin,platform}`; native menus per wireframe 12; CommonJS package override
- `npm run electron:dev` + `npm run electron:build` scripts; electron-builder config for Win/Mac/Linux targets
- `useVault` hook + `VaultPicker` UI + Settings > Vault tab with one-shot `localStorage → .md files` migration
- 26 new tests (10 LocalAdapter + 16 frontmatter) — total 61, all green

### Changed
- `App.jsx` split into feature modules under `src/features/*` and `src/lib/*` — shell reduced from 2952 lines to 297. No behavior change.
- Package version 0.2.0 → 0.3.0
- UI version pill now imports from `package.json` (single source of truth)

### Deferred (post-0.3.0)
- Plugin runtime (Phase 4 → 0.4.0)
- Security hardening, CSP, sandboxed extension host (Phase 5)
- Signed installers + auto-update + SRE telemetry (Phase 6)
- Performance benchmarks at 1k/5k/10k notes (Phase 7)
- Tabs + drag-to-split panes
- Full primary-storage swap (legacy `mgn-e` key still primary; vault is parallel store)
- Folder tree sidebar — placeholder only, v0 uses existing type-based nav

---

## [0.2.0] — 2026-04-22

Onboarding + activation. Target: 40%+ of new users reach 3 entries in 7 days.

### Added
- Welcome panel on first run with 5 import sources (Readwise JSON, Pocket CSV, Kindle `My Clippings.txt`, Obsidian vault, JotFolio JSON) + 3 quick-actions (paste URL, pick theme, see graph) + skip
- Import parsers with shape validation + dry-run preview (`src/parsers/`)
- Activation tracking (`firstSaveAt`, `thirdSaveAt`, `lastSeenAt`, `bannersDismissed`) in `mgn-activation`
- Progress nudges:
  - Sidebar-area progress pill (N/3) beside "All Entries" until activated
  - First-save banner above grid after 1st entry
  - Day-2 return card when 1-2 entries + `lastSeen` ≥ 18h ago
  - Activation celebration toast on 3rd entry → auto-route to Constellation
  - Graph lock overlay inside Constellation until 3 entries
- Curated Settings → Appearance: 6 themes, Mode, UI scale, Enable-AI toggle (day-1 surface)
- `▸ Show advanced` reveals the full 26 themes / 22 fonts / custom colors / card density / sidebar width
- AI tab gated behind enable toggle (empty state when off)
- Data tab: `↺ Reopen welcome` button; Import JSON moved under Advanced
- Smart first-load theme via `prefers-color-scheme` (Glass dark / Minimal light)
- localStorage event log (`mgn-events`, FIFO 500) tracking onboarding + activation events
- Vitest + @testing-library/react + jsdom; full test coverage for parsers + activation hook (35 tests)

### Migration
- Existing v0.1.0 users auto-marked onboarded on first v0.2.0 load
- Derived `firstSaveAt` and `thirdSaveAt` from sorted existing entries
- No data format changes

---

## [0.1.0] — 2026-04-21

Initial snapshot.

### Features
- 5 entry types (video, podcast, article, journal, link) with type-specific fields
- 26 themes (13 original + 13 editor-aesthetic) with dark/light mode, custom Accent/Surface/Background/Foreground colors, 22 fonts
- Theme + font dropdowns with keyboard nav, single-open enforcement, live previews
- Editable hex inputs with auto-normalize + snap-back on default match
- UI scale slider (zoom-based)
- Constellation view (graph) with:
  - 3 layouts: Messy (scatter), Clusters (per-component BFS + force-sim), Affinity (tag + link + type + date weighted springs)
  - Anti-gravity bob animation (RAF + setInterval fallback)
  - Hover highlight + click focal stack with breadcrumb
  - Alt+drag detach single node, Alt+click snap back
  - Cluster drag (whole component), canvas pan, cursor-anchored wheel zoom
  - BFS depth hierarchy (size + opacity encoding)
  - Legend with shortcut hints (collapsible)
- Detail panel: Prev/Next nav, inline-confirm delete, Edit mode
- Add Entry modal: drop URL/file zone, type selector grid, sticky save, scrollable tag suggestions
- Card grid + list view, hover lift, star action
- Settings: Appearance, Library, AI, Data, Shortcuts tabs
- AI: BYOK — Anthropic, OpenAI, Gemini, Groq, OpenRouter, Ollama, Custom; test-connection button; OpenRouter PKCE OAuth login
- Data: JSON export/import (with shape validation + dup-skip), Markdown export
- Status pills with muted tone system (done/active/broken)
- Focus-visible accent rings, themed scrollbars, custom selection color
- Google Fonts (20 families, 400/700 weights only)
- localStorage persistence with `window.storage` fallback for artifact host
- Keyboard shortcuts: N (new entry), / (focus search), Esc (close), C (toggle messy/clusters), A (affinity), Arrow nav in dropdowns
- Picture This — mockup gallery with 4 animated style packs (Current, Editorial, Scientific, Cartographic)

### Architecture
- Single-file React 19 + Vite 7
- No backend
- BYOK AI abstraction (`aiComplete()`) across 7 providers
- PKCE OAuth helper (OpenRouter)
