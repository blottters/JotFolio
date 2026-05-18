# JotFolio Phase 1 Inventory — Full Coverage Audit

Branch: `phase2/5174-transformation` @ `18af965`
Generated: 2026-05-16
Source dir: `C:\Dev\Projects\JotFolio\source\`

Seven parallel subagents enumerated every surface in the codebase. Each wrote a detailed category file under `audit-phase1/`. This doc is the top-level aggregate. **No tests written in Phase 1.** Phase 2-5 paused pending user confirmation of this inventory.

---

## Totals by category

| Cat | Scope | Items | Detail file |
|-----|-------|-------|-------------|
| 1 | Code surface (routes/exports/mutations/scripts/jobs) | **478** | [cat-1-code-surface.md](audit-phase1/cat-1-code-surface.md) |
| 2 | Interactive elements per component | **629** (51 files) | [cat-2-interactive-elements.md](audit-phase1/cat-2-interactive-elements.md) |
| 3 | Settings / config / env / feature flags | **60** (119 atomic) | [cat-3-settings-config.md](audit-phase1/cat-3-settings-config.md) |
| 4 | Conditional UI modes | **291** | [cat-4-ui-modes.md](audit-phase1/cat-4-ui-modes.md) |
| 5 | Non-button event bindings | **142** | [cat-5-non-button-events.md](audit-phase1/cat-5-non-button-events.md) |
| 6 | Cross-page user flows (Playwright targets) | **50** | [cat-6-cross-page-flows.md](audit-phase1/cat-6-cross-page-flows.md) |
| 7 | Orphan suspects | **122** + 109 unused tokens | [cat-7-orphans.md](audit-phase1/cat-7-orphans.md) |

**Grand total Phase 2-5 scope (Cats 1-6):** **1650 distinct surface items.**
**Plus orphans (Cat 7):** 122 dead-suspect + 109 unused design tokens — surface, do not delete.

---

## Cat 1 — Code surface (478)

- **1.1 Route handlers:** 31 — 15 named sections (`command`, `search`, `raw`, `projects`, `note`, `tasks`, `calendar`, `spaces`, `tags`, `settings`, `ai`, `templates`, `trash`, `graph`, `welcome`) + `all`/`starred` + 10 entry-type filter sections + 4 dynamic-prefix sections (`folder:`, `space:`, `base:`, `canvas:`)
- **1.2 Public exports:** 316 across `lib/`, `adapters/`, `parsers/`, `plugins/` (largest clusters: `lib/index` 34, `lib/canvas` 20, `lib/compile` 22, `lib/base` 15, `lib/keywordRules` 14, `lib/theme` 14, `lib/parser` 12, `lib/templates` 12)
- **1.3 Vault mutations:** 71 — `VaultAdapter` interface (write/mkdir/move/remove/rmdir/writeBinary), `useVault.saveEntry/deleteEntry`, trash + attachments + manifests + opt-outs + rules, App.jsx call sites, plugin host/bridge/API/worker, 8 Electron vault IPC handlers, snapshots write/restore/prune
- **1.4 Package scripts:** 12 — dev, build, preview, test, test:watch, electron:dev, electron:build, build:testing, bench, bench:watch, bench:update-baseline, a11y
- **1.5 Background jobs:** 48 — snapshot debounce + hourly prune, updater 3s+15min checks + 7 events + 2 IPC handlers, telemetry init + 2 process events, 6 app/window lifecycle, 2 webContents nav guards, 3 chokidar fs events, 19 IPC handlers total, ConstellationView RAF watchdog

**Notable:** App.jsx is **1671 lines** (charter cap 800). Duplicated `CANVAS_DIR`/`CANVAS_FILE_EXT` constants in two files (drift risk).

---

## Cat 2 — Interactive elements (629)

51 files audited under `features/`, `onboarding/`, `App.jsx`. Heaviest:
- `WorkstationViews.jsx` — 4746-line file, dominates count (covers CommandCenter, GlobalSearch, Inbox, Projects, Tasks, Calendar, Spaces, TagManager, ContextRail)
- `AddModal.jsx` — ~50 elements (type grid, content tabs, tag input, source URL, template select, footer actions)
- `SettingsPanel.jsx` and 4 sibling panels — heavy form controls

**Method:** one row per concrete JSX call site, repeats noted per `.map()`. Reusable primitives (`Pressable`, `IconButton`, `SmallButton`, `RibbonButton`, etc.) counted at each use-site.

**Orphan flagged:** `NotesWorkspaceView.jsx:467` — active note-tab `<button>` with no `onClick`. Close `×` span is purely visual.

---

## Cat 3 — Settings / config (60 — 119 atomic)

- **3.1 Feature flags:** 6 (3 graduated, 1 active opt-in `semanticEdges`, **2 fully unread**: `context_packs`, `memory_graph_nodes`)
- **3.2 User prefs:** 17 in DEFAULT_PREFS — **3 read with NO UI editor**: `userName`, `defaultLayoutMode`, `featureFlags`
- **3.3 localStorage keys:** 17 (legacy `mgn-*` + current `jf-*`). **4 orphan writes** (no reader): `mgn-events`, `jf-relationship-review-ledger`, `jf-demo-seed-status`
- **3.4 Env vars:** 5 — `SENTRY_DSN`, `VITE_SENTRY_DSN`, `VITE_APP_VERSION`, `import.meta.env.PROD`, `A11Y_BASE_URL`
- **3.5 Config files:** 8 (incl. Electron `userData/settings.json`: `lastVault`, `telemetry.enabled`)
- **3.6 Themes:** 27 themes, 13 CSS contract vars, 4 user-tunable colors, 7 font stacks, 3 dark-mode states
- **3.7 AI providers:** 7 providers + 5 per-user config fields under `mgn-ai`

**9 orphan-suspects feed Cat 7.**

---

## Cat 4 — Conditional UI modes (291)

- **4.1 Vault state:** 17 — `loaded` is 3-way AND (`prefsLoaded && !vaultLoading && !migratingLegacy`). **Coverage gap:** workstation views render normal UI even when `vaultError` is set (only fallback shell honors it)
- **4.2 Per-route states:** 159 — every major view has 3+ branches. Calendar has 13 (month/week/day × grid/list + journal + filters + detail rail + empty)
- **4.3 Modal states:** 89 — AddModal 19, CompilePreview 8, ImportModal 9 unique (×5 sources)
- **4.4 Sidebar:** 5 — collapsed mode hides Tags. **`folders`, `folderFiles`, `bases`, `canvases`, `pluginPanelsSlot` props passed but never rendered** (suspected dead props)
- **4.5 Feature-flag-gated UI:** 7 surfaces — `semanticEdges` cascades to 4 (status bar, AddModal suggest-tags, Constellation dashed edges, DetailPanel similar)
- **4.6 prefers-reduced-motion:** 5 — **CSS motion tokens (`--jf-t-fast/med/slow`, `--jf-motion-enter/control`) declared + reduced-motion-overridden but NEVER consumed by any component**. Only Constellation honors OS preference via JS. CSS block effectively dormant.

**Notable orphans:** VaultPicker `mode='modal'` never mounted (only inline settings variant used).

---

## Cat 5 — Non-button events (142)

- **5.1 Global keyboard shortcuts:** 23
- **5.2 Local keydown:** 42 (modal Escape via `useEscapeKey` × 10, editor Tab/Enter, list arrow nav)
- **5.3 Drag/drop:** 2 (both on AddModal — onDrop + onDragOver)
- **5.4 Scroll:** 1 (Select dropdown reposition only)
- **5.5 Focus/blur:** 11
- **5.6 Mouse non-click:** 48 (modal backdrops, hover, listbox patterns, Canvas/Constellation pointer drag)
- **5.7 Custom events / bus:** 21
- **5.8 Resize/viewport:** 3

**Critical orphans flagged:**
- **Ribbon tooltips advertise `Cmd/Ctrl+G`, `Cmd/Ctrl+Shift+D`, `?` — none wired anywhere.** Pure tooltip lies.
- **`appBus.emit(...)` never called in production code.** Plugin event API (`vault-change`, `note-open`, `note-save`, `note-create`, `note-delete`, `app-ready`, `app-quit`) has 3 subscriber pathways and zero publishers. Plugins listen to a dead bus.
- **`plugin:<id>:<event>` and `jotfolio:<event>` window CustomEvents** dispatched by 3 emitters, zero in-app listeners.

---

## Cat 6 — Cross-page flows (50)

- Ready for Playwright: **43**
- Partial (Playwright-hard): **5** (Obsidian directory import via `webkitdirectory`, feature-flag toggle absent UI, vault path OS dialog, semantic edges async, update lifecycle in packaged app)
- Not implemented: **2** (Cmd-palette "Export vault" command doesn't exist; Trash multi-select restore absent)

**Flow gaps surfaced:**
- Flow 20: Command palette has no `export-vault` builtin. Export reachable only via Settings → Vault → "Export vault as zip"
- Flow 28: TrashView has per-row Restore/Delete + global Empty; no multi-select / no batch restore
- Flow 46: Memory Trace to Sources has explicit `TODO(alpha.20)` in `App.jsx:1362-1364` — currently just `setSection('graph')`, doesn't auto-focus source set
- Flow 9: Feature flag UI toggles do not exist (programmatic mutation only)

---

## Cat 7 — Orphans (122 suspects + 109 unused tokens)

- **397 exports scanned**, **99 zero-caller orphans** in `source/src/`
- **Confirmed dead clusters:**
  - **Entire relationship-review subsystem** — 17 exports in `lib/index/relationshipDecisions.js` + `lib/index/relationshipReview.js`. Imported only by tests.
  - **109 of 112 `--jf-*` design tokens** in `tokens.css` unread. Only `--jf-space-3`, `--jf-space-4`, `--jf-radius-md` are consumed by `var()` reads. The system advertises 112; the codebase uses 3.
  - **Phase 5 memory-graph stack** wired-but-dormant: `MemoryNode.jsx`, `nodeRenderers.jsx` (StarNode/BoardNode/EditorialNode), `constellationVisuals.js` helpers are fully built + tested but `ConstellationView.jsx` never imports them. `memory_graph_nodes` flag also never read.
- **Pub/sub fully broken:** `appBus.emit(...)` never published. Three subscriber pathways exist. (Mirrors Cat 5 finding.)
- **Interactive orphans:** 2 — `NotesWorkspaceView.jsx:467` button + `:470` close-span
- **Unread props:** 3 — `CaptureFilterChip.id`, `CalendarDetailRail.items`, `WorkspaceTopBar.onCommandPalette`
- **Unused imports:** 0 in top 10 files (clean)
- **TODOs:** 1 (`App.jsx:1362` alpha.20 focal-stack) + 2 legacy migration breadcrumbs

Re-runnable scanners committed: `_scan_orphans.mjs`, `_scan_tokens.mjs`, `_scan_unused_imports.mjs`, `_scan_unused_props.mjs`, `_scan_interactive_no_handler.mjs`.

---

## Cross-cutting findings (themes that appear in multiple cats)

1. **Motion tokens dead.** Cat 4 + Cat 7 both flag: `--jf-t-fast/med/slow` and `--jf-motion-enter/control` defined, reduced-motion-overridden, never consumed. Components use inline `transition: 'width 0.2s'` etc.
2. **Design token system advertised but mostly unused.** Cat 7: 109/112 tokens have zero `var()` consumers. The token file is documentation, not enforcement.
3. **Plugin event bus is publisher-less.** Cat 5 + Cat 7: subscribers wired across PluginHost/Bridge/API; zero in-app emitters. Plugins listening to silence.
4. **Sidebar receives unused props.** Cat 4 lists 5 (`folders`, `folderFiles`, `bases`, `canvases`, `pluginPanelsSlot`) — passed in App.jsx, ignored in Sidebar.jsx.
5. **Relationship-review subsystem dormant.** Cat 3 (`jf-relationship-review-ledger` orphan localStorage) + Cat 7 (17 exports zero callers in production). Built, tested, never wired.
6. **Memory-graph Phase 5 dormant.** Cat 3 (`memory_graph_nodes` flag unread) + Cat 4 (no UI consumes it) + Cat 7 (MemoryNode/nodeRenderers not imported by ConstellationView). Whole feature staged behind a switch that doesn't exist.
7. **Phantom shortcuts.** Cat 5: Ribbon tooltips claim `Cmd+G`, `Cmd+Shift+D`, `?` — none wired. UI is lying.
8. **Vault error swallowed by workstation.** Cat 4: `vaultError` only surfaces in fallback shell; workstation views render as if vault is healthy. Silent failure path.
9. **AddModal dirty-discard inline overlay.** Cat 4: the "Discard?" warning renders inline inside the modal body, not as proper confirm dialog — this is a z-index workaround documented in JOTFOLIO_AUDIT.md item #9.

---

## RESUMING AT — Phase 2

**Phase 2-5 scope is approved? If yes:**
- Cat 1: 478 surfaces → existing TEST_COVERAGE.md covers 161; delta ≈ 317 (mostly export-level granularity)
- Cat 2: 629 interactive elements → most components have `renders` test; per-element interaction tests are the gap
- Cat 3: 60 settings → ~10 have direct tests (feature flags, themes); 50 untested
- Cat 4: 291 UI modes → loading/error/empty branches mostly untested
- Cat 5: 142 events → modal Escape, list arrow nav have coverage; drag/drop, focus/blur, scroll, custom events mostly not
- Cat 6: 50 flows → ZERO Playwright tests exist. `bench/a11y/` dir referenced but flows uncovered. Phase 3 is fresh build.
- Cat 7: 122 orphans → become ORPHAN_REPORT.md in Phase 4

**Realistic Phase 2 + 3 cost:** ~1500 new test cases. Recommend execution in waves, not single-shot.

**Recommended split for Phase 2:**
- Wave 2A: Cat 1.2 export gaps (~50 missing API tests)
- Wave 2B: Cat 4 critical UI modes (~80 — vault error states, modal stages, empty/loading)
- Wave 2C: Cat 2 priority interactions (~120 — destructive actions, modal flows, form submission)
- Wave 2D: Cat 3 settings round-trip (~40)
- Wave 2E: Cat 5 keyboard + drag (~30)
- **Wave 3 (Playwright):** 43 ready flows + 5 partial

**Recommended split for Phase 4 (orphans):**
- Confirm 122 orphan suspects via re-grep + dynamic-ref check
- Write `ORPHAN_REPORT.md` at repo root with recommended action per orphan (wire / delete / document)

---

## STOP HERE — awaiting user confirmation

Per spec: "STOP after Phase 1. Run TaskList. Show me the full inventory grouped by the 7 categories before proceeding. I will confirm or correct before any tests get written."

Confirm or correct the inventory. After approval, dispatch Phase 2 waves.
