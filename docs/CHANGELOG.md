# Changelog

All notable changes documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version scheme: [Semantic Versioning](https://semver.org/spec/v2.0.0.html) — `MAJOR.MINOR.PATCH`.

Bump rules:
- **PATCH** (0.1.`x`) — bugfix, tweak, copy change, style fix
- **MINOR** (0.`x`.0) — new feature, new view, new setting
- **MAJOR** (`x`.0.0) — breaking change (data format, API, removed feature)

**Bounded growth:** this file keeps the last 7 alphas. Older history lives in [`CHANGELOG-archive.md`](./CHANGELOG-archive.md).

---

## [Unreleased]

### Added
- Workstation UI overhaul ledger at [`docs/changes/jotfolio-ui-overhaul-ledger.md`](./changes/jotfolio-ui-overhaul-ledger.md). This tracks screenshot-approved surfaces and the real functionality wired behind them.
- Search / Quick Switcher route rebuilt with category tabs, grouped vault results, selected-result detail rail, backlinks/unresolved-link context, Quick Switcher and Command Palette launch buttons, and real result actions.
- Capture / New Entry modal rebuilt with asset-kit entry icons, template application, local path copy, source URL open, save-to-inbox/project, tag editing, and canvas creation.
- Projects route rebuilt with screenshot-style project cards, compact project table, selected-project detail rail, tabs, sorting, grid/list toggle, project-aware New Entry, project canvas creation, project-filtered Bases, Constellation routing, and copy/reveal actions.
- Notes route rebuilt as a full Markdown editor workspace with tabbed file chrome, edit/preview modes, Markdown toolbar actions, live debounced vault saving, line/word/file status, tag editing, backlinks, unresolved-link context, and file actions.
- Constellation now includes a Relationship Scan panel that reports disconnected notes, unresolved wiki links, and metadata gaps from real vault/index data before any MiniLM link-writing work.
- Graph Health now has a local relationship decision ledger for accepted, rejected, and ignored review choices without mutating note content.
- Added a relationship review engine for future Graph Health/MiniLM suggestions, including pending/applied/rejected/undone records, exact undo snapshots, and safe storage helpers.
- Capture / New Entry now supports real Project and Task entry creation with type-specific defaults and vault-relative path previews.
- Spaces now has a dedicated workstation page for space selection, metrics, recent entries, projects, tasks, tags, graph gaps, and real create/capture actions.

### Changed
- New entry creation now uses UUID v4 IDs for vault entries while keeping short UI ids for toasts and other non-vault state.
- Capture / New Entry now labels its primary action by the actual entry type; only Raw captures say `Save to Inbox`.
- Command Center starts from real vault state instead of seeded PRD/design/roadmap goals, and it scrubs the old fake defaults from saved browser mode state.
- MiniLM semantic indexing is now explicit opt-in and lazy-loaded by the semantic hook instead of starting on default vault load.
- Constellation only computes the selected heavy layout instead of eagerly computing affinity layout for every render.
- Browser preview Vault settings now explain that `local://vault` is already the active virtual vault instead of offering a fake browser-storage migration.
- Sidebar vocabulary now uses Constellation instead of Knowledge Graph.
- The unfinished main AI route is now labeled AI Setup instead of AI Assistant.
- Settings Shortcuts now lists the active Search, Quick Switcher, and Command Palette shortcuts.
- Performance bench gating now uses at least 20 samples for p95 and requires a meaningful absolute slowdown before failing on relative-only timing drift.
- The left sidebar now links to Spaces as a main page instead of listing every space under the navigation.
- Search now owns its right detail rail instead of using the generic Today/tasks rail.
- Top-bar Capture opens the full Capture / New Entry workflow.
- Top-bar search now shows immediate vault results below the field with keyboard selection, Enter-to-open, and an Open full Search action instead of routing away on focus.
- Projects now owns its project detail rail and no longer shows the generic Today/tasks dashboard rail.
- Notes now opens directly into the editor workspace instead of the generic card/list library route.
- Notes editor chrome now matches the approved reference more closely: tab and editor controls share one header row, Markdown toolbar groups use thin dividers/icons, and the duplicate note title above the editor was removed.
- Notes Info rail now shows the full screenshot-style context stack: Tags, Backlinks, Unresolved links, Properties, File, and Actions.
- Notes Properties now edits common frontmatter directly for status, project, and entry date, while the editor status bar reports real space counts instead of a hard-coded value.
- Constellation Relationship Scan is now presented as Graph Health with real open/create actions for disconnected notes, missing wiki targets, and metadata gaps.
- Capture / New Entry now starts blank instead of pre-filling a research title, example URL, default tags, and capture metadata into new entries.
- Inbox row actions now use readable action labels instead of symbol-only buttons for triage and conversion.
- Blank-vault onboarding now starts with four concrete actions: Create first note, Capture raw thought, Create project, and Load sample vault, instead of import/theme/graph setup choices.
- Vite dev-server opens now blank the browser fallback vault by default; demo, smoke, stress, and test data only load when the URL explicitly opts in.
- Command Center greeting now uses the browser's local time zone, showing morning, afternoon, or evening instead of always saying `Good morning`.
- Top-bar Capture is now route-aware: Inbox opens Raw, Calendar opens Journal, Tasks opens Task, Projects carries the selected project, and Spaces carries the selected space.
- Capture / New Entry now shows visible project or space context in the modal header before saving.
- Capture / New Entry now exposes Journal date as a real field, uses it for the journal title/path fallback, and saves it as the entry date.
- Capture / New Entry now normalizes source URLs for duplicate detection, shows the source domain/normalized URL inline, and can fill blank Article/Link titles from the URL slug.
- New Journal captures now close Capture and route directly into Calendar after saving.
- Duplicate Article/Link source warnings now offer `Open existing` when the matching entry can be identified.
- Entry detail and memory detail panels now close on outside click while preserving the existing unsaved-edit discard guard.
- Entry detail panels now use the workstation right-rail width and shell frame offsets, closing the visible gap and aligning the left divider with the rest of the app.
- Workstation shell now adapts at narrow widths: the secondary context rail hides before it crushes the page, Home Queue cards switch from four cramped columns to readable two/one-column layouts, and the top bar/sidebar compress to preserve legibility.

### Fixed
- Desktop vault moves now reject existing destination paths instead of allowing overwrite-by-rename behavior.
- Snapshot restore now validates snapshot dates and vault-contained restore destinations.
- Browser fallback binary writes now preserve arbitrary bytes instead of decoding them as text.
- Markdown frontmatter parsing now preserves body whitespace instead of trimming it on read.
- Markdown frontmatter parsing now uses a lighter hot path for vault scans while preserving the same frontmatter behavior.
- Calendar future task/project pills now show the actual due date instead of always saying `Due today`.
- Inbox row layout now uses a narrower action column so triage actions are less likely to clip at normal desktop widths.
- Command Palette and Quick Switcher now expose active options through ARIA and keep Tab focus inside their dialogs.
- Welcome now keeps initial keyboard focus inside the first-run dialog.
- Testing builds now override package metadata name to avoid reusing the production app data identity.
- Electron external-link handling now allows only `https://` and `mailto:` targets, and the Help menu issue link points at the real GitHub repo.
- First-run blank vaults now open the welcome workflow instead of dropping users into an empty workstation dashboard.
- Welcome no longer exposes Readwise import, theme picking, or Constellation as first-run blank-vault actions before the user has any entries.
- Capture / New Entry now honors Escape while a text field is focused, so the modal close/discard flow works from the title field and other editable fields.
- New Project and New Task entry points now create `project` and `task` entries instead of falling back to `note`.
- Save to Project is disabled unless a real project context exists, preventing project-less saves from stamping fake project metadata.
- Command Center quick captures now keep the saved entry id on the immediate Captured Today row, so opening a just-captured note routes back to that entry instead of falling back to Inbox.
- Inbox raw captures can now be sent directly to Notes as draft notes through the existing entry save path, keeping the same saved entry id and a `capture` tag.
- Inbox raw captures can now be converted in place into Notes, Tasks, or Links, archived from the row, or moved to Trash from the row without losing the saved entry id.
- Inbox raw captures can now be attached to a real existing Project through an in-app picker, writing `project` metadata and preserving that project link when the capture is later converted into a Note, Task, or Link.
- The `⌘K` / `Ctrl+K` shortcut now opens Search / Quick Switcher globally, matching the top search field and sidebar hint instead of doing nothing from the main shell.
- Entry detail Rename file and Move folder actions now use app-owned dialogs instead of browser `prompt()` calls while preserving the same vault move path.
- MiniLM semantic indexing now stays off unless `semanticEdges` is explicitly enabled, matching the opt-in feature flag contract and preventing default-load ONNX asset requests.
- A one-time alpha.26 prefs migration resets stale saved `semanticEdges: true` values from earlier local builds so MiniLM does not start without a real opt-in path.
- Constellation info help no longer opens as an overlapping floating popover; it now renders inline below the toolbar.
- Command Center and Tasks no longer emit duplicate React key warnings when different rows or metadata chips share the same visible title.
- Notes Properties no longer shows empty duplicate metadata rows that push File and Actions out of view.
- Notes Markdown toolbar link and image actions no longer insert fake `example.com` or `image-url` placeholders; they create blank Markdown destinations for the user to fill.
- Graph Health review decisions now persist across reloads, so accepted/rejected/ignored relationship issues stay remembered until cleared.
- Memory detail panels now have an explicit Close button and Escape-key exit path instead of trapping users in the selected-memory view.
- Command Center now opens as a real Home Queue with Resume last note, Process Inbox, Open active project, and Continue today's task actions instead of focus-mode panels, session-goal filler, weekly reflection UI, or a second quick-capture composer.
- Inbox triage no longer shows Compile as a row-level primary action; raw captures now focus on Make Note, Make Task, Make Link, Archive, and Trash, while compile remains behind the selected raw entry detail.

### Removed
- Removed the unfinished AI Setup main navigation item; legacy AI route rendering now falls through to Settings → AI Keys instead of presenting a fake assistant page.
- Removed the top-bar Notifications bell until JotFolio has a real notification source and panel.
- Removed Podcast and Video from the Capture / New Entry type picker while preserving existing podcast/video entry compatibility in parsers, imports, search, and demo vaults.
- Removed the Attachment content tab from Capture / New Entry until attachment management has a visible open/reveal/remove surface.

## [0.5.0-alpha.25] — 2026-05-07

> Note: alpha.23 (onboarding) and alpha.24 (bundle code-split) deferred — they require Gavin's design input. alpha.25 ran first because its scope is fully mechanical.

### Removed
- `source/plugins/git-sync/` directory — the Git Sync stub. It logged sync intent to `.jotfolio/sync.log` but did no real Git operations. Already removed from `OFFICIAL_PLUGINS` in alpha.17; alpha.25 ripped the on-disk source. Charter rule: don't ship stubs as features.

### Added
- **Export vault as zip** action in Settings → Vault. One click bundles every entry, attachment, and template into a single deterministic zip download (filename pattern `jotfolio-vault-export-YYYY-MM-DD.zip`). Useful for backups, cross-machine moves, and one-shot snapshots.
- New library `source/src/lib/vaultExportZip.js` — pure-JS PKZip STORE-method builder. Zero new npm dependencies. ~150 lines including a CRC-32 implementation, path-traversal safety guards, and the `exportVaultAsZip(vault)` renderer helper.
- 9 new tests covering zip structure correctness, CRC-32 fixture (`'hello world'` → `0x0d4a1185`), empty vault, multi-file order, path-safety rejects (`..` / leading `/` / empty), and a 100-file smoke. Cumulative test count: 637.

### Sync guidance copy

Below the export button, a short paragraph: *"Want continuous sync across devices? JotFolio stays out of that game. Use Obsidian Sync, Syncthing, Dropbox, or iCloud Drive on your vault folder."* The product takes a position: real sync is not JotFolio's job. Pair the vault folder with whatever sync tool you already trust.

### Internal
- This release was shipped autonomously via a scheduled Cron task while Gavin was away. Three parallel subagents (git-sync gravedigger / zip wrangler / settings smith) executed the work. Audit trail at `docs/superpowers/specs/2026-05-07-alpha-25-autonomous-execution.md` plus `docs/superpowers/specs/2026-05-07-alpha-25-status.md`. First end-to-end unattended ship for the project.

## [0.5.0-alpha.22] — 2026-05-06

### Removed
- `docs/PATCH_NOTES.md` (21KB) — duplicated `CHANGELOG.md`. Two unique narrative sections (origin-as-Claude.ai-artifact + the 2026-04-24 cleanup pass) ported into `CHANGELOG-archive.md`. Remaining content was already in CHANGELOG / archive.
- Phantom root files `index.html`, `main.js`, `package.json` — vestigial shadow files from the pre-`source/` project layout. Real artifacts live under `source/`. Already untracked; deleted from disk and added to `.gitignore` to prevent re-creation.
- Local dev cruft directories `.archive/`, `.outputs/`, `.snapshots/` — already-untracked stale residue. Deleted from disk; added to `.gitignore`.
- Root `mockups/` directory — its single file (`context-memory-concept.html`) merged into `docs/mockups/`. Eliminates the "two mockup folders" ambiguity.

### Changed
- **Plans folder consolidation.** Three overlapping "plans" folders merged into one canonical archive:
  - `docs/plans/` (2 files) → `docs/specs/archive/`
  - `docs/phase-plans/` (1 file) → `docs/specs/archive/`
  - `docs/superpowers/plans/` (5 files) → `docs/specs/archive/`
  - Active per-release design specs continue to live at `docs/superpowers/specs/`. Source dirs deleted after move. Inbound references updated.
- **Stale handoffs + audits archived.** Six pre-alpha.14 docs relocated:
  - `docs/superpowers/handoff-CC-2026-04-30.md` → `docs/_archive/handoffs/`
  - `docs/superpowers/handoff-codex-2026-04-30.md` → `docs/_archive/handoffs/`
  - `docs/superpowers/cli-skills-audit-2026-04-30.md` → `docs/_archive/audits/`
  - `docs/superpowers/desktop-skills-audit-2026-04-30.md` → `docs/_archive/audits/`
  - `docs/superpowers/skills-alignment-2026-04-30.md` → `docs/_archive/audits/`
  - `docs/superpowers/path-audit-2026-04-29.md` → `docs/_archive/audits/`
  - New `docs/_archive/README.md` explains the relocation rationale.
- `CONTEXT.md` and `AI_AGENT_GUIDE.md` updated to point at the new locations.

### Internal
- No source code changes. Pure repo hygiene.
- Six parallel subagents executed the cleanup (phantom slayer / plans consolidator / archive archivist / patch notes liquidator / mockup unifier / session extract triager).
- 628/628 tests pass unchanged. Build clean.

## [0.5.0-alpha.21] — 2026-05-06

### Added
- [`CONTEXT.md`](../CONTEXT.md) at repo root — product definition, locked vocabulary, architecture map, charter rules. First file an AI agent or new contributor should read.
- [`AI_AGENT_GUIDE.md`](../AI_AGENT_GUIDE.md) at repo root — six questions every agent asks at session start, each mapped to the file with the answer. Standard release flow checklist. "Where things you might look for actually live" lookup table.
- [`CHANGELOG-archive.md`](./CHANGELOG-archive.md) — pre-alpha.14 release history moved here for bounded growth.

### Changed
- `CHANGELOG.md` now keeps only the last 7 alphas (~125 lines). Older history archived. Header documents the rolling-window rule.

### Internal
- No source code changes. Pure documentation / discoverability work. 628/628 tests pass unchanged. Build clean.

## [0.5.0-alpha.20] — 2026-05-05

### Changed
- **Type Color Theme** replaces "Type Color Saturation" in Settings → Appearance. Four neutral palettes:
  - **Bone & stone** (default) — earth tones, most differentiated.
  - **Sepia** — single warm hue stepped by lightness.
  - **Cool neutral** — greys with bluish undertones.
  - **Monochrome** — cream tones, type-color signal nearly gone.
- All four palettes are intentional neutrals — no saturated rainbow anywhere.
- `applyTypeSat(type, theme)` accepts new theme keys (`bone` / `sepia` / `cool` / `mono`) plus legacy keys (`full` / `muted`) which auto-migrate via `migrateTypeSatToTheme()`.
- `TYPE_THEME_LEVELS` exported from `lib/types.js`. `TYPE_SATURATION_LEVELS` retained as a back-compat alias.

### Fixed
- **Constellation nodes no longer fade to transparent in focal mode.** `nodeOpacity` floors raised: focal-non-neighbor 0.18 → 0.55, hover-non-neighbor 0.4 → 0.7. Stars stay solid; focus is signaled via stroke + label, not opacity.

### Internal
- 8 new tests for theme keys + legacy migration. Cumulative 628 / 628 pass.

## [0.5.0-alpha.19] — 2026-05-05

### Added
- **Three Constellation visual styles** — Star chart (default, current behavior), Detective board (dark index-card nodes with title + meta + type-color edge strip), Editorial (sparse dots + tier-sized Fraunces labels by link count). Switchable in Settings → Appearance → Constellation Style.
- **Type color saturation** — Full / Muted / Mono. Six new desaturated type tokens (`note` / `article` / `podcast` / `video` / `journal` / `link`) replacing the old saturated rainbow. Switchable in Settings → Appearance → Type Color Saturation.
- **Constellation backgrounds** — Solid (default) / Vignette (radial dark fade focuses center) / Grid (hairline tablet) / Star field (sparse decorative dots). Switchable in Settings → Appearance → Constellation Background.
- **Designed empty / locked / no-matches state cards** — `ConstellationStateOverlay` replaces text-only states with a ✦ glyph + Fraunces heading + sub-copy + action button. Locked state shows entry count and "+ Add another"; no-matches state shows "Reset filters".
- New library exports: `TYPE_TOKENS`, `MEMORY_TOKENS`, `TYPE_SATURATION_LEVELS`, `applyTypeSat(type, saturation)` in `lib/types.js`. Pure renderer components `StarNode` / `BoardNode` / `EditorialNode` + `NODE_VARIANTS` in `features/constellation/nodeRenderers.jsx` (currently unused at runtime — integration uses inline branching for performance + drag/bob compatibility, the pure renderers ship as a tested foundation for alpha.20+ refactor).

### Changed
- `ConstellationView.jsx` swaps `TYPE_HUE` (saturated rainbow) for `applyTypeSat()` everywhere — node fill, legend swatch.
- Locked-state header replaces ad-hoc `GraphLockOverlay` with the new `ConstellationStateOverlay`.

### Internal
- 33 new tests across 5 files (8 type tokens, 16 node renderers, 9 state overlay). Cumulative 620 / 620 pass.
- `nodeRenderers.jsx` currently shipped as tested-but-unused — preserves the design's pure-component intent for a future drop-in refactor when the inline branching outgrows itself.

## [0.5.0-alpha.18] — 2026-05-04

### Added
- **Compile to memory** action on raw entry detail panels. Triggers Phase 4 `compile()` over the entry's cluster, opens a preview modal showing the generated body, sources synthesized, warnings, and decision rationale (confidence, hash, compiler). User accepts → new wiki or review entry persisted; cancels → no change.
- `CompilePreviewModal.jsx` — diff preview with severity-coded warnings, blocking-warning detection (canonical-collision-handauthored disables save), monospace body block, source-evidence list with type chips.
- Knowledge types (`raw_inbox`, `wiki_mode`, `review_queue`) graduated from dark to default-on. Sidebar Inbox / Wiki / Review sections, AddModal entry-type buttons, and Constellation memory-node legend now visible by default.

### Changed
- `DEFAULT_FEATURE_FLAGS` flips three knowledge flags to `true`. Two still-dark phases (`context_packs`, `memory_graph_nodes`) remain strict opt-in.
- `normalizeFeatureFlags` now respects explicit `false` saves on the three graduated flags (user opt-out preserved) while treating missing/null/true as on.
- Alpha.18 one-time migration (`featureFlagsResetAlpha18` marker pref) re-enables the three knowledge flags for installs that were force-disabled by the alpha.17 migration.

### Fixed
- N/A — see alpha.17 for the most recent fix batch.

### Internal
- 13 new tests for `CompilePreviewModal`. Cumulative test count rises to ~585.

## [0.5.0-alpha.17] — 2026-05-04

### Added
- Dedicated Trash route reachable from the bottom of the ribbon. Trash view shows deleted entries, bases, canvases, and template files with restore, permanent delete, and empty-trash actions. Items in the dedicated Trash no longer appear inside the regular Folders tree.
- Sidebar folder tree renders disk folders + the entry/template/base/canvas files inside them, with collapsible nested groups, file counts, and per-row delete affordances.
- Folder delete with explicit confirmation. Files inside the folder move to JotFolio Trash; the folder shell is removed only when empty.
- Vault adapter now exposes `rmdir` for safe folder removal across local-storage and Electron node-fs adapters.

### Changed
- Sidebar Knowledge surfaces (Inbox/Wiki/Review entries) are now properly gated behind the corresponding feature flags. Surfaces stay hidden until Phase 4 compilation pipeline ships in alpha.18.
- Add Entry modal type buttons filter to flag-enabled types only. Empty-state copy and Constellation type filter/legend follow the same gating.
- App layout now uses `height: 100%` instead of `100vh` on the root flex shell so the bottom of the UI no longer clips inside iframe-style preview surfaces.

### Removed
- Git Sync plugin removed from the official bundled plugin list. The plugin source remains on disk for future activation but is not exposed in the Plugins panel until real Git operations are implemented.

### Internal
- Surgical revert of Codex-era feature-flag default flip (`wiki_mode`/`raw_inbox`/`review_queue`) back to `false`. Knowledge UI plumbing kept and made truly flag-gated for Phase 4/5 ship.
- One-time prefs migration on app load resets any saved-true `wiki_mode`/`raw_inbox`/`review_queue` state from earlier Codex test builds back to `false`. Marker pref `featureFlagsResetAlpha17` ensures the migration runs at most once per install.
- Karpathy LLM Wiki Phase 4 compilation pipeline shipped as importable library (`source/src/lib/compile/`). 53 new tests. No UI surface uses it yet — Phase 5 wires the trigger in alpha.19. `compile()` is pure, deterministic, takes a seed + vault index, returns a `CompileResult` with hash, sources, confidence, warnings, and emitted target (`wiki` vs `review`). Manifest tracking, supersedes chains, stale detection, and djb2-based hashing all included.

## [0.5.0-alpha.16] — 2026-05-04

### Added
- Template Library now shows real incoming references for the selected template when entries were created/updated from that template or explicitly link to it.
- Template Library now shows outgoing wiki links from the template body, separated into resolved entries and unresolved targets.
- Applying a template now records the template path in entry frontmatter extras so future backlinks are knowable without guessing.

### Changed
- Obsolete Dependabot PRs for older Electron/Vite/Vitest targets were closed after newer dependency versions already landed on `master`.
- Release closure now requires every leftover concern to be classified as fixed, accepted for alpha, blocked externally, or moved to a named follow-up.
- Release publishing now uses the built-in GitHub token with explicit `contents: write` permission instead of requiring a PAT-style release secret.

### Fixed
- The Template Library right rail no longer stops at static help/details when real relationship data is available.
- Electron Builder 26 packaging no longer fails on stale `mac.notarize` and Windows signing-hash config fields.

### Security
- Code-signing docs now describe the current external credential requirements and Authenticode verification command instead of stale placeholder instructions.

## [0.5.0-alpha.15] — 2026-05-04

### Added
- Template Library now has an Obsidian-style three-pane workspace: searchable template list, full inline markdown editor, and a right rail for template variables/details.
- Templates can now be edited and saved directly from the Template Library instead of showing a preview-only pane.
- Sidebar folders now render as a collapsible nested tree with clearer folder affordances and total child counts.

### Changed
- Selecting a parent folder now includes entries in nested child folders, matching normal folder-browsing expectations.
- Template Library now fills the main workspace instead of sitting inside a padded card area.

## [0.5.0-alpha.14] — 2026-05-04

### Changed
- Upgraded production markdown/watch dependencies: `marked` to `18.0.3` and `chokidar` to `5.0.0`.
- Electron vault watching now lazy-loads both CommonJS and ESM-only `chokidar`, preserving packaged watcher compatibility after the dependency upgrade.

### Security
- Started the post-alpha.13 dependency-alert remediation line for production runtime dependencies.
