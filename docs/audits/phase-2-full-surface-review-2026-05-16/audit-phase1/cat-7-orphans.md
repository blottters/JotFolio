# JotFolio Phase 1 Audit — Category 7: Orphan Hunt

Branch `phase2/5174-transformation` @ 18af965. Read-only research. Nothing deleted.

Scan inputs:
- Exports under `source/src/lib/`, `source/src/adapters/`, `source/src/parsers/`, `source/src/plugins/`, `source/src/features/` (397 exported names extracted by Node walker, see `_exports.tsv`).
- Caller search across every `.js/.jsx/.ts/.tsx/.mjs/.cjs` under `source/src/`.
- A reference is "external" if the file is NEITHER the defining file NOR the file's own `<base>.test.*` / `<base>.safety.test.*` sibling.
- Scanner: `audit-phase1/_scan_orphans.mjs` (Node, word-boundary regex). Raw output `_orphan_scan.tsv`. Zero-caller slice in `_zero_callers.tsv`.

A "0 callers" hit means **the export is referenced only from its own file and its own colocated test**. It is not necessarily safe to delete (some are library API surfaces, internal-use error types, or scaffolding for future phases) — see Recommended action column.

---

## 7.1 Exported functions / constants with no caller

Bucket totals: **397 exports scanned**, **99 have zero external callers**, **3 have exactly one external caller** (kept for reference at end), **295 have ≥2**.

### 7.1.A Constellation memory-graph / node-renderer stack (Phase 5 dark)

These are the most consequential orphans. Spec `docs/superpowers/specs/2026-05-04-memory-graph-nodes-phase-5-design.md` plans to render wiki/review entries via these components when `flags.memory_graph_nodes` is true. The flag is defined-but-never-read (see 7.5), and `ConstellationView.jsx` never imports any of these. They are fully built + tested but not wired.

| # | Export | Defined at | Status | Recommended action |
|---|--------|------------|--------|--------------------|
| 1 | `MemoryNode` | source/src/features/constellation/MemoryNode.jsx:19 | 0 callers | wire up (Phase 5 — ConstellationView branch on entry.type) |
| 2 | `StarNode` | source/src/features/constellation/nodeRenderers.jsx:40 | 0 callers | wire up or delete (whole file is orphan) |
| 3 | `BoardNode` | source/src/features/constellation/nodeRenderers.jsx:144 | 0 callers | wire up or delete |
| 4 | `EditorialNode` | source/src/features/constellation/nodeRenderers.jsx:253 | 0 callers | wire up or delete |
| 5 | `NODE_VARIANTS` | source/src/features/constellation/nodeRenderers.jsx:350 | 0 callers | wire up or delete |
| 6 | `CONSTELLATION_ROLE_LABELS` | source/src/features/constellation/constellationVisuals.js:3 | 0 callers | wire up — only `applyTypeSat` and `LABEL` from this file get used |
| 7 | `graphDegree` | source/src/features/constellation/constellationVisuals.js:13 | 0 callers | wire up |
| 8 | `getNodeRole` | source/src/features/constellation/constellationVisuals.js:17 | 0 callers | wire up |
| 9 | `getNodePalette` | source/src/features/constellation/constellationVisuals.js:33 | 0 callers | wire up |

### 7.1.B Relationship review/decisions infrastructure (T6 incomplete?)

Sibling files `lib/index/relationshipDecisions.js` and `lib/index/relationshipReview.js` between them define 16 exports — none are imported anywhere in the application. Only the test file `ConstellationView.test.jsx` references `jf-relationship-decisions` (the storage-key string literal, not the export). Suggests an entire relationship-review subsystem was scaffolded then dropped before wiring.

| # | Export | Defined at | Status | Recommended action |
|---|--------|------------|--------|--------------------|
| 10 | `RELATIONSHIP_DECISIONS_STORAGE_KEY` | lib/index/relationshipDecisions.js:1 | 0 | document as intentional OR delete |
| 11 | `RELATIONSHIP_DECISION_STATUSES` | lib/index/relationshipDecisions.js:2 | 0 | delete |
| 12 | `relationshipDecisionKey` | lib/index/relationshipDecisions.js:12 | 0 | delete |
| 13 | `parseRelationshipDecisions` | lib/index/relationshipDecisions.js:55 | 0 | delete |
| 14 | `serializeRelationshipDecisions` | lib/index/relationshipDecisions.js:66 | 0 | delete |
| 15 | `RELATIONSHIP_REVIEW_STORAGE_KEY` | lib/index/relationshipReview.js:3 | 0 | delete |
| 16 | `RELATIONSHIP_REVIEW_STATUSES` | lib/index/relationshipReview.js:4 | 0 | delete |
| 17 | `RELATIONSHIP_REVIEW_KINDS` | lib/index/relationshipReview.js:5 | 0 | delete |
| 18 | `relationshipReviewKey` | lib/index/relationshipReview.js:31 | 0 | delete |
| 19 | `createRelationshipReview` | lib/index/relationshipReview.js:72 | 0 | delete |
| 20 | `applyRelationshipReview` | lib/index/relationshipReview.js:121 | 0 | delete |
| 21 | `undoRelationshipReview` | lib/index/relationshipReview.js:156 | 0 | delete |
| 22 | `rejectRelationshipReview` | lib/index/relationshipReview.js:172 | 0 | delete |
| 23 | `parseRelationshipReviewLedger` | lib/index/relationshipReview.js:186 | 0 | delete |
| 24 | `serializeRelationshipReviewLedger` | lib/index/relationshipReview.js:197 | 0 | delete |
| 25 | `loadRelationshipReviewLedger` | lib/index/relationshipReview.js:201 | 0 | delete |
| 26 | `saveRelationshipReviewLedger` | lib/index/relationshipReview.js:209 | 0 | delete |

### 7.1.C VaultIndex query helpers (memory-graph readers — never called)

`buildVaultIndex` itself IS called by `App.jsx:565` (4 external callers). But several of its companion query helpers are not, suggesting the planned "Memory Health" / "Wiki Search" UIs never landed.

| # | Export | Defined at | Status | Recommended action |
|---|--------|------------|--------|--------------------|
| 27 | `resolveEntryLinks` | lib/index/vaultIndex.js:85 | 0 | wire up or delete |
| 28 | `getUnresolvedTargets` | lib/index/vaultIndex.js:192 | 0 | wire up (planned "broken links" view) |
| 29 | `getNeighbors` | lib/index/vaultIndex.js:210 | 0 | wire up |
| 30 | `searchWiki` | lib/index/vaultIndex.js:235 | 0 | wire up — Toolbar/Search uses `searchEntries` instead |
| 31 | `searchRaw` | lib/index/vaultIndex.js:245 | 0 | wire up |
| 32 | `getAffinityMatches` | lib/index/vaultIndex.js:255 | 0 | wire up |
| 33 | `getMemoryHealth` | lib/index/vaultIndex.js:269 | 0 | wire up (planned health UI) |

### 7.1.D Canvas / Base scaffolding constants

These get used inside their own file but never imported externally. They look like library-API exports for a CanvasOps consumer that doesn't exist yet.

| # | Export | Defined at | Status | Recommended action |
|---|--------|------------|--------|--------------------|
| 34 | `CANVAS_FILE_VERSION` | lib/canvas/canvasTypes.js:34 | 0 | document as intentional (canvas-file contract) |
| 35 | `NODE_TYPES` | lib/canvas/canvasTypes.js:38 | 0 | document |
| 36 | `KNOWN_NODE_TYPES` | lib/canvas/canvasTypes.js:39 | 0 | document |
| 37 | `makeCanvasId` | lib/canvas/canvasTypes.js:67 | 0 | wire up — CanvasExplorer/CanvasView use `nextNodeId`/`nextEdgeId` instead |
| 38 | `resizeNode` | lib/canvas/canvasOps.js:85 | 0 | wire up — only `addNode/removeNode/updateNode/moveNode/addEdge/updateEdge` get imported; `removeEdge` has 1 caller |
| 39 | `BASE_FILE_VERSION` | lib/base/baseTypes.js:48 | 0 | document |
| 40 | `makeBaseId` | lib/base/baseTypes.js:94 | 0 | wire up — BaseExplorer uses `createEmptyBase` and `basePath` only |
| 41 | `evalFilter` | lib/base/queryBase.js:44 | 0 | wire up |
| 42 | `evalSort` | lib/base/queryBase.js:101 | 0 | wire up — `applyBase` is the only entry point used |

### 7.1.E Bundle / export helpers

| # | Export | Defined at | Status | Recommended action |
|---|--------|------------|--------|--------------------|
| 43 | `BUNDLE_VERSION` | lib/exports/bundle.js:10 | 0 | document |
| 44 | `BUNDLE_KIND` | lib/exports/bundle.js:11 | 0 | document |
| 45 | `validateCanvas` | lib/exports/bundle.js:24 | 0 | wire up — only `buildBundle`/`parseBundle` get imported |
| 46 | `validateBase` | lib/exports/bundle.js:37 | 0 | wire up |
| 47 | `exportEntriesJSON` | lib/exports.js:16 | 0 | leave for follow-up — orphaned by Phase 2 bundle path |
| 48 | `importEntriesJSON` | lib/exports.js:98 | 0 | leave for follow-up |

### 7.1.F Theme / victory helpers

| # | Export | Defined at | Status | Recommended action |
|---|--------|------------|--------|--------------------|
| 49 | `THEME_VAR_CONTRACT` | lib/theme/themes.js:63 | 0 | wire up — used inside `getThemeContractIssues` but never imported externally |
| 50 | `DEFAULT_VICTORY_COLORS` | lib/theme/themes.js:133 | 0 | wire up — App.jsx hard-codes hex values instead |
| 51 | `hexToRgb` | lib/theme/victoryTheme.js:2 | 0 | document (used inside `deriveVictoryTheme`) |
| 52 | `mixHex` | lib/theme/victoryTheme.js:3 | 0 | document (used inside same file) |
| 53 | `luminance` | lib/theme/victoryTheme.js:4 | 0 | document (used inside same file) |
| 54 | `assertThemeModePairs` | lib/theme/resolve.js:26 | 0 | delete or wire to a startup check |
| 55 | `themePreview` | features/dropdowns/ThemeDropdown.jsx:6 | 0 | wire up — only `ThemeDropdown` itself gets imported |
| 56 | `ThemeSwatch` | features/dropdowns/ThemeDropdown.jsx:18 | 0 | wire up |

### 7.1.G Type-system constants

| # | Export | Defined at | Status | Recommended action |
|---|--------|------------|--------|--------------------|
| 57 | `TYPES` | lib/types.js:1 | 0 | document — only `ALL_ENTRY_TYPES` (= TYPES + KNOWLEDGE_TYPES) gets imported externally |
| 58 | `STATUS_LABELS` | lib/types.js:13 | 0 | document — `displayStatus` is the API |
| 59 | `STATUS_DONE` | lib/types.js:58 | 0 | wire up (intended for status-summary UI?) |
| 60 | `STATUS_BROKEN` | lib/types.js:59 | 0 | wire up |
| 61 | `TYPE_TOKENS` | lib/types.js:88 | 0 | wire up — `applyTypeSat` is the only entry point used |
| 62 | `MEMORY_TOKENS` | lib/types.js:99 | 0 | wire up |
| 63 | `TYPE_THEME_LEVELS` | lib/types.js:105 | 0 | wire up — SettingsPanel hard-codes the levels |
| 64 | `TYPE_SATURATION_LEVELS` | lib/types.js:108 | 0 | wire up |
| 65 | `migrateTypeSatToTheme` | lib/types.js:118 | 0 | wire up — migration path for the type-saturation→theme prefs rename |

### 7.1.H Storage / vault internals

| # | Export | Defined at | Status | Recommended action |
|---|--------|------------|--------|--------------------|
| 66 | `CORRUPT_STORAGE_CODE` | lib/storage.js:10 | 0 | document — error-code constant, exposed for external check |
| 67 | `StorageCorruptionError` (class) | lib/storage.js:12 | 0 | document — instantiated internally only; `isStorageCorruptionError(err)` is the external API |
| 68 | `storageQuarantineKey` | lib/storage.js:30 | 0 | wire up — Cat 3 audit notes "manual recovery surface — no automated reader" |
| 69 | `attachmentPathFor` | lib/vaultAttachments.js:7 | 0 | wire up — only `importAttachment` exposed externally |
| 70 | `trashPathFor` | lib/vaultTrash.js:12 | 0 | document (helper of `moveToTrash`) |
| 71 | `crc32` | lib/vaultExportZip.js:24 | 0 | document |
| 72 | `buildZip` | lib/vaultExportZip.js:61 | 0 | wire up — `exportVaultAsZip` is the API; lower-level builder is leaked but unused |
| 73 | `VaultExportError` | lib/vaultExportZip.js:5 | 0 | document (thrown internally) |
| 74 | `normalizeMarkdownFileName` | lib/vaultPaths.js:13 | 0 | wire up — `normalizeVaultFolder` is used; this sibling isn't |

### 7.1.I Misc

| # | Export | Defined at | Status | Recommended action |
|---|--------|------------|--------|--------------------|
| 75 | `hasAIKey` | lib/ai/providers.js:14 | 0 | wire up — Settings AI panel should gate on this |
| 76 | `escapeRegex` | lib/keywordRules/applyRules.js:7 | 0 | document — internal helper |
| 77 | `OPT_OUTS_PATH` | lib/keywordRules/optOutTracker.js:25 | 0 | document — used internally |
| 78 | `removeOptOut` | lib/keywordRules/optOutTracker.js:146 | 0 | wire up — "restore opt-out" UI doesn't exist; only `addOptOut` is called |
| 79 | `RULES_PATH` | lib/keywordRules/rulesStorage.js:19 | 0 | document |
| 80 | `RULES_DIR` | lib/keywordRules/rulesStorage.js:22 | 0 | document |
| 81 | `searchEntries` | lib/search/searchVault.js:191 | 0 | wire up — `parseSearchQuery`+`matchesQuery` are wired piecemeal but the all-in-one entrypoint isn't |
| 82 | `loadModel` | lib/semantic/embed.js:55 | 0 | document — `embedText` is the API |
| 83 | `cosineSimilarity` | lib/semantic/similarity.js:5 | 0 | document — used internally by `findTopK` |
| 84 | `_internals` | lib/semantic/index.js:190 | 0 | document — test-only export |
| 85 | `TEMPLATE_REFS_FIELD` | lib/templates/templateBacklinks.js:5 | 0 | document — internal use |
| 86 | `templateReferenceKeys` | lib/templates/templateBacklinks.js:15 | 0 | wire up — backlinks ledger only consumes `addTemplateUsageToEntry` + `getTemplateIncoming/Outgoing` |
| 87 | `getEntryTemplateRefs` | lib/templates/templateBacklinks.js:30 | 0 | wire up |
| 88 | `resolveVariables` | lib/templates/templateStore.js:101 | 0 | document — used by `applyTemplateToNote` internally |
| 89 | `insertTemplateAtCursor` | lib/templates/templateStore.js:197 | 0 | wire up — InsertTemplateModal exists but uses a different code path |
| 90 | `buildFullDemoVaultStore` | lib/demo/fullDemoVault.js:467 | 0 | wire up — only `maybeSeedFullDemoVaultFromUrl` is exposed via App.jsx |
| 91 | `shouldShowEntryType` | lib/featureFlags.js:33 | 0 | wire up — `filterEntriesForUI` calls it internally; never imported externally |
| 92 | `stripFrontmatter` | lib/frontmatter.js:250 | 0 | wire up — utility that the markdown pipeline should be using |
| 93 | `NOTE_MD_CSS` | lib/markdown.js:2 | 0 | document — string consumed by `injectNoteCss` internally |
| 94 | `captureError` | lib/telemetry.js:99 | 0 | wire up — Telemetry panel mentions this but nothing calls it |
| 95 | `ownManifest` (re-export) | plugins/PluginHost.js:324 | 0 | delete the re-export — `function ownManifest` is local and only used inside the file |
| 96 | `_dropdownBus` | features/dropdowns/bus.js:6 | 0 | document — used internally by `useSingleOpenDropdown` |
| 97 | `SR_ONLY` | features/primitives/SrOnly.jsx:1 | 0 | document — used by `SrOnly` component, not external |
| 98 | `__test__` | features/properties/PropertiesPanel.jsx:211 | 0 | document — explicit test-only export, but no test imports it |
| 99 | `WORKSTATION_SECTIONS` | features/shell/appShellState.js:7 | 0 | wire up — App.jsx duplicates the set inline |

### 7.1.X Single-caller exports (kept for awareness)

These have exactly one external caller. Not orphans, but worth noting since deleting the single caller would orphan the export:

| # | Export | Defined at | Single caller |
|---|--------|------------|---------------|
| - | `removeEdge` | lib/canvas/canvasOps.js:134 | features/canvas/CanvasView.jsx:8 |
| - | `_resetModelForTests` | lib/semantic/embed.js:88 | lib/semantic/index.test.js:20 |
| - | `KNOWLEDGE_TYPES` | lib/types.js:2 | lib/keywordRules/useKeywordRules.js:84 |

---

## 7.2 Interactive elements with no handler

Heuristic scan: `audit-phase1/_scan_interactive_no_handler.mjs` walked every `.jsx` file and looked at every `<button>`, `<Pressable>`, `<a>` opening tag for missing `onClick`/`onPress`/`href`/`type=submit`. Cross-checked against Cat 2 output.

| # | File | Line | Element | Issue | Recommended action |
|---|------|------|---------|-------|--------------------|
| 1 | source/src/features/notes/NotesWorkspaceView.jsx | 467 | `<button type="button" className="jf-notes-tab is-active" role="tab">` | Active-tab label has no onClick — also contains a `<span className="jf-notes-tab-close">x</span>` that LOOKS clickable but is not | wire up (close action) or convert to non-interactive element / `aria-disabled` |
| 2 | source/src/features/notes/NotesWorkspaceView.jsx | 470 | `<span className="jf-notes-tab-close">x</span>` (inside the above button) | Span styled as a close button but has no handler | wire up close-tab handler |

`<div role="button">` cases (Pressable wrapper, CanvasView, ConstellationView, MemoryNode, NoteBody, WorkstationViews x4) all have onClick handlers — scanner confirmed.

---

## 7.3 Props passed but never read

Scanner: `audit-phase1/_scan_unused_props.mjs` — parses destructured prop lists from named React components in the top 10 components and greps the body.

| # | File:line | Component | Prop | Recommended action |
|---|-----------|-----------|------|--------------------|
| 1 | source/src/features/workstation/WorkstationViews.jsx:1454 | `CaptureFilterChip` | `id` | document or delete — passed but unused inside chip |
| 2 | source/src/features/workstation/WorkstationViews.jsx:3923 | `CalendarDetailRail` | `items` | wire up or delete — looks load-bearing but body never reads it |
| 3 | source/src/features/workstation/WorkspaceTopBar.jsx:60 | `WorkspaceTopBar` | `onCommandPalette` | wire up — Command Palette open button likely missing |

Top-10 components otherwise had no unread destructured props.

---

## 7.4 Settings written but never read (or vice versa)

Pulled from Cat 3 + grep of `localStorage.{set,get}Item` and `storage.{set,get}`.

| # | Key | Write site | Read site | Status | Recommended action |
|---|-----|-----------|-----------|--------|--------------------|
| 1 | `mgn-settings-advanced` | SettingsPanel.jsx:368 | SettingsPanel.jsx:366 | symmetric | OK |
| 2 | `mgn-vault-migrated` | App.jsx:662 | App.jsx:655 | symmetric | OK |
| 3 | `mgn-p` | App.jsx:671, fullDemoVault.js:503 | App.jsx:607, fullDemoVault.js:497 | symmetric | OK |
| 4 | `mgn-onboarded` | fullDemoVault.js:547 | (read in onboarding/activation tests + App tests) | likely read in onboarding code | verify external read site |
| 5 | `mgn-ai` | lib/ai/providers.js:13 (setAIConfig) | lib/ai/providers.js:12 (getAIConfig) | symmetric | OK |
| 6 | `jf-vault-local` | adapters/LocalAdapter (write at runtime) | LocalAdapter.test.js read | adapter-internal | OK |
| 7 | `jf-command-center-mode-state` | (no source-tree writer — only test seeds) | WorkstationViews test reads | TEST-ONLY KEY | document — runtime writer is missing OR this is a leftover from removed feature |
| 8 | `jf-relationship-decisions` | (no writer in source) | ConstellationView.test.jsx:209 | RELATIONSHIP-REVIEW SUBSYSTEM ORPHAN | covered by §7.1.B; whole subsystem unwired |

Recommendation: items 7 and 8 are the suspicious ones. Item 7 (`jf-command-center-mode-state`) only has test reads + writes — verify whether the Command Center toggles ever persist mode in the real app.

---

## 7.5 Feature flags defined but not gating anything

Source: `source/src/lib/featureFlags.js`. Gate-site scan via grep `\bflagName\b` excluding the defining file and its test.

| # | Flag | Default | Gating sites | Recommended action |
|---|------|---------|--------------|--------------------|
| 1 | `wiki_mode` | true | App.jsx:632 (alpha.18 reset), EmptyState.jsx, ConstellationView.jsx, useKeywordRules.js | OK |
| 2 | `raw_inbox` | true | App.jsx:632, EmptyState.jsx, ConstellationView.jsx | OK |
| 3 | `review_queue` | true | App.jsx:632, EmptyState.jsx, ConstellationView.jsx | OK |
| 4 | `semanticEdges` | false | App.jsx:882 (`useSemanticIndex` enable), ConstellationView.jsx (semantic edges rendering) | OK |
| 5 | **`context_packs`** | false | **no gating sites** — defined in `DEFAULT_FEATURE_FLAGS` + normalized but never read | **delete OR wire up** (context-packs feature unbuilt) |
| 6 | **`memory_graph_nodes`** | false | **no gating sites** — defined + normalized but never read | **wire up** — MemoryNode + nodeRenderers stack (§7.1.A) was built behind this flag but ConstellationView never branches on it |

---

## 7.6 Theme variables (--jf-*) defined but not used

Scanner: `audit-phase1/_scan_tokens.mjs`. Reads `source/src/design/tokens.css` and counts `var(--jf-NAME)` references across all `.js/.jsx/.css/.html` under `source/src/` (excluding the defining file).

**112 tokens defined. 109 are unused. Only 3 are used:** `--jf-space-3`, `--jf-space-4`, `--jf-radius-md` (the last via `--jf-radius-md` consumers — verify, the scanner counted token use across all files).

The entire `--jf-*` design-token layer is a parallel namespace that no component reads from. App code uses the legacy theme variables directly (`var(--bg)`, `var(--ac)`, etc.).

| # | Token | Defined at | Status | Recommended action |
|---|-------|------------|--------|--------------------|
| 1–109 | (see `_scan_tokens.mjs` output saved in `audit-phase1/_tokens_unused.txt`) | tokens.css | 0 uses | wire up (preferred — refactor inline styles to consume tokens) OR delete tokens.css and shrink the design system |

Concrete examples named in the audit prompt:
- `--jf-z-modal: 300` → 0 uses (confirmed)
- `--jf-z-toast: 500` → 0 uses
- `--jf-z-tooltip: 600` → 0 uses
- All `--jf-z-*` (sidebar, detail, command-palette, popover, modal, toast, tooltip) → 0 uses
- All `--jf-shadow-*`, `--jf-text-*`, `--jf-control-*`, `--jf-icon-*`, `--jf-weight-*`, `--jf-radius-*` (non-surface), `--jf-color-*` aliases, `--jf-oklch-*` ramps, `--jf-t-*` transitions, `--jf-ease-*`, `--jf-motion-*`, `--jf-content-*`, `--jf-sidebar-width*`, `--jf-detail-width`, `--jf-topbar-height`, `--jf-statusbar-height`, `--jf-scrollbar-*`, `--jf-density-*`, `--jf-focus-ring*` → 0 uses

In-file self-references (one --jf-* var referencing another inside tokens.css) ARE counted as 0 here because they live in the defining file; the scanner intentionally excludes the file itself.

Recommended overall action for §7.6: **single highest-leverage cleanup** — either migrate inline styles to consume tokens (sets up the design-system rewrite) or delete tokens.css (saves ~190 LoC of dead config). Decide before alpha.20.

---

## 7.7 Event bus topics published but not subscribed (or vice versa)

### 7.7.A `plugins/EventBus.js` (`appBus` singleton)

ADR-0003 documents the bus topics: `vault-change`, `note-open`, `note-save`, `note-create`, `note-delete`, `app-ready`, `app-quit`.

- **Subscribe sites** (in production code): 3 — `plugins/PluginHost.js:226`, `plugins/PluginBridge.js:203`, `plugins/PluginAPI.js:74`. All three are generic forwarders that let plugins call `events.on(eventName, cb)`.
- **Publish sites** (in production code): **0**. `appBus.emit(...)` is **never called** anywhere except tests (`plugins/EventBus.test.js`).
- **Net effect:** the entire pub/sub infrastructure exists, plugins can subscribe to any of the documented topics, but the core app never publishes any of them. Plugin event listeners are guaranteed to be dead.

Recommended action: **wire up** — emit `note-save` from save path in `App.jsx`/AddModal, `vault-change` from VaultAdapter writes, `app-ready` from boot, `note-open` from DetailPanel open, etc. OR document this as "events deferred" and remove the subscribe pathways to avoid silent failure.

### 7.7.B `features/dropdowns/bus.js` (`_dropdownBus`)

- **Publish:** `dispatchEvent(new CustomEvent('open', ...))` at bus.js:13 (inside `useSingleOpenDropdown`).
- **Subscribe:** `addEventListener('open', h)` at bus.js:12.
- Symmetric. OK.

---

## 7.8 Imported but unused

Scanner: `audit-phase1/_scan_unused_imports.mjs`. Walks named/default/namespace imports in the top 10 large component files, regexes the body for the local name.

**Result: 0 unused imports across all 10 scanned files** (App.jsx, WorkstationViews.jsx, SettingsPanel.jsx, Sidebar.jsx, AddModal.jsx, DetailPanel.jsx, ConstellationView.jsx, WorkspaceTopBar.jsx, NotesRail.jsx, NotesWorkspaceView.jsx).

No action needed.

---

## 7.9 TODO / FIXME / dead comments

Grep `(TODO|FIXME|XXX|HACK|@deprecated)` and `// (removed|unused|dead|deprecated|legacy|orphan)` across `source/src/`.

| # | File:line | Marker | Comment | Status |
|---|-----------|--------|---------|--------|
| 1 | source/src/App.jsx:1362 | TODO | "TODO(alpha.20): wire focal-stack initializer in ConstellationView so..." | open work item — known incomplete |
| 2 | source/src/App.jsx:611 | "Legacy" | "Legacy migration: old victoryColors → new customColors" | migration path — leave until migration confirmed complete |
| 3 | source/src/lib/exports.js:100 | "Legacy" | "Legacy strictness: a non-array, non-bundle top-level is a hard error" | intentional — documents legacy import contract |

No `FIXME`, no `HACK`, no `XXX`, no `@deprecated`, no `// removed` / `// unused` / `// dead` markers. Clean codebase from this lens.

---

## Totals

**Total orphan suspects: 122** (across all subcategories).
- 7.1 exports with zero callers: **99**
- 7.2 interactive elements with no handler: **2**
- 7.3 props passed but never read: **3**
- 7.4 settings written-only or read-only: **2** (suspicious; rest symmetric)
- 7.5 feature flags not gating anything: **2** (`context_packs`, `memory_graph_nodes`)
- 7.6 design tokens unused: **109** (one bucket; not added to grand total since cosmetic)
- 7.7 event-bus mismatches: **1** (entire `appBus` publish path)
- 7.8 imports unused: **0**
- 7.9 TODO/FIXME/dead markers: **3** (1 open TODO + 2 legacy-migration breadcrumbs)

**Confirmed dead (zero refs, very likely safe to delete):**
- The entire relationship-review subsystem (`lib/index/relationshipDecisions.js`, `lib/index/relationshipReview.js`) — **17 exports across 2 files** (§7.1.B). One test references the storage-key string but no app code imports any export.
- `context_packs` feature flag (§7.5).
- 109 unused `--jf-*` tokens (§7.6). High-confidence dead but might be intentional design-system scaffolding.
- `ownManifest` re-export (§7.1.I item 95) — function is locally used; the `export { ownManifest }` line is dead.
- **C ≈ 130** (including the unused tokens).

**Likely false positives / dynamic refs:**
- `StorageCorruptionError` class (§7.1.H item 67) — thrown internally; `instanceof` check happens via `isStorageCorruptionError`. NOT dead, just leaked API surface.
- `_internals`, `_resetModelForTests`, `__test__`, `_dropdownBus`, `SR_ONLY` — explicitly underscore-prefixed, intentional internal-API exports (5 items).
- `BUNDLE_VERSION`, `BUNDLE_KIND`, `CANVAS_FILE_VERSION`, `BASE_FILE_VERSION` — file-format version constants; exported for downstream tooling that doesn't exist yet but probably should (4 items).
- Theme victory-color helpers (`hexToRgb`, `mixHex`, `luminance`) — used inside `deriveVictoryTheme` of the same file; could be unexported but are intentional API surface (3 items).
- `searchEntries` (§7.1.I) — the all-in-one search entry-point; the toolbar/search uses lower-level pieces. Wiring would consolidate, not delete.
- **F ≈ 15**

**Net actionable orphan candidates:** ≈75–80 (after subtracting design tokens that need a strategy call and the false-positive bucket).

---

## Scanner artifacts (for re-runs / verification)

- `_build_exports_tsv.ps1` — extract every `export …` line into `_exports.tsv`
- `_scan_orphans.mjs` — Node walker that counts external callers per export, writes `_orphan_scan.tsv`
- `_zero_callers.tsv` — `awk '$3==0'` slice of the above
- `_scan_tokens.mjs` — `--jf-*` definition vs usage scan
- `_scan_interactive_no_handler.mjs` — `<button>`/`<Pressable>`/`<a>` heuristic
- `_scan_unused_props.mjs` — destructured-props body-presence check
- `_scan_unused_imports.mjs` — import-name body-presence check

All scanners are read-only and re-runnable. Drift-detection: a clean re-run on a future commit should be diff-comparable.
