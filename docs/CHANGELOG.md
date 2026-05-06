# Changelog

All notable changes documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version scheme: [Semantic Versioning](https://semver.org/spec/v2.0.0.html) — `MAJOR.MINOR.PATCH`.

Bump rules:
- **PATCH** (0.1.`x`) — bugfix, tweak, copy change, style fix
- **MINOR** (0.`x`.0) — new feature, new view, new setting
- **MAJOR** (`x`.0.0) — breaking change (data format, API, removed feature)

**Bounded growth:** this file keeps the last 7 alphas. Older history lives in [`CHANGELOG-archive.md`](./CHANGELOG-archive.md).

---

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

