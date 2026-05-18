# Phase 1 Audit — Category 4: Conditional UI Modes

Repo: `C:\Dev\Projects\JotFolio` @ `phase2/5174-transformation` (18af965)
Scope: distinct render modes driven by state. Local-first, single-user, no auth, no tiers — focus on data states and conditional renders.

Citations are `file:line` against `source/src/...`.

---

## 4.1 Vault state modes

Drivers in `App.jsx`:
- `vaultLoading` (useVault → `loading`) — `App.jsx:98`
- `vaultError` (useVault → `error`) — `App.jsx:99`
- `vaultIssues` (useVault → `issues`) — `App.jsx:100`
- `migratingLegacy` — `App.jsx:92`
- `migrationDone` — `App.jsx:93`
- `storageError` — `App.jsx:91`
- `prefsLoaded` — `App.jsx:90`
- `vaultInfo` (useVault → `vaultInfo`) — `App.jsx:97`
- `isBrowserVault` — `App.jsx:108`
- `loaded = prefsLoaded && !vaultLoading && !migratingLegacy` — `App.jsx:107`

Routing checks live in `AppRouteContent.jsx:358-364` (storage-error, vault-error, not-loaded, populated). The `WelcomePanel` is conditionally rendered at `App.jsx:1620-1628`. The first-run picker is gated by `VaultPicker` (modal mode) — wired via `App.jsx:645-648` (auto-call `pickVault` for browser vault when no `vaultInfo`).

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 1 | Bootstrap loading | `!prefsLoaded` (initial mount before localStorage settles) | App.jsx:90, 605-643 | Toolbar/sidebar may already render, but main pane (in default `command` shell route fallback) shows "Loading..." plain text |
| 2 | Vault loading after pick | `vaultLoading === true` and no error | App.jsx:98; AppRouteContent.jsx:364 | "Loading..." centered in pane |
| 3 | No vault picked, browser mode | `isBrowserVault && !vaultInfo && !vaultLoading` | App.jsx:108, 645-648 | Auto-fires `pickVault()` (LocalAdapter creates virtual vault) — no separate UI |
| 4 | No vault picked, Electron mode | `window.electron?.vault && !vaultInfo` | useVault.js:94-117 | Welcome modal from `VaultPicker mode='modal'` (only mounted when caller renders it). In actual practice App.jsx never mounts the modal-mode picker; vault is auto-loaded from `vault.getVaultPath()` |
| 5 | Vault error (load) | `vaultError != null` and storageError null | App.jsx:99; AppRouteContent.jsx:363 | Red banner "Vault error: {message}" — only on the fallback shell route (not workstation views) |
| 6 | Storage corruption | `storageError != null` (from preferences load) | App.jsx:91, 605-643; AppRouteContent.jsx:359-362 | Red alert: "Storage recovery needed" with `storageError.key` + `quarantineKey` |
| 7 | Migrating legacy entries | `migratingLegacy === true` (post-pref-load, pre-migration-done, only once) | App.jsx:92, 649-668 | `loaded` becomes false → main pane shows "Loading..." (no dedicated migrating message in main pane) |
| 8 | Legacy migration toast | After migration completes with `result.total > 0` | App.jsx:657-661 | Info toast "Imported N legacy entries into vault…" |
| 9 | Vault loaded, empty | `loaded && entries.length === 0`, not welcomed | App.jsx:872-876, 1620-1628 | If `isOnboarded() === false` & `section === HOME_SECTION`: redirected to `welcome` → `WelcomePanel` overlay. Else: `EmptyState` in shell |
| 10 | Vault loaded, populated | `loaded && entries.length > 0` | AppRouteContent.jsx:365-384 | Normal route content |
| 11 | Vault file issues present | `vaultIssues.length > 0` (parser failed on some files) | App.jsx:1564; useVault.js:64-71, 81-85 | Status bar pip turns amber: "N issues need review" |
| 12 | Vault file issues zero | `vaultIssues.length === 0` | WorkstationViews.jsx:4417-4418 | Status bar pip green: "All systems operational" |
| 13 | Semantic index building | `semantic?.building && semanticTotal > 0` | App.jsx:1565-1567; WorkstationViews.jsx:4405-4410 | Status bar shows "Indexing semantic — N/Total" with blue pip (aria-live polite) |
| 14 | Semantic index ready | `!semanticBuilding && semanticReady && semanticTotal > 0` | WorkstationViews.jsx:4411-4415 | Status bar shows "✨ N semantic" |
| 15 | Semantic disabled | `prefs.featureFlags.semanticEdges !== true` | App.jsx:882 | Hook bails out (`enabled` false). Status bar omits semantic-related text entirely |
| 16 | Settings panel reload diagnostics | Settings → Vault tab — uses vault props (issues, loading, error) | App.jsx:1409-1416 | Inline VaultPicker + lists `vaultIssues` to user |
| 17 | Browser-preview virtual vault | `isBrowserVault === true` after pick | VaultPicker.jsx:51-55 | Shown only in settings inline mode: "Browser preview is already using this virtual vault." callout |

---

## 4.2 Per-route empty / loading / populated / error states

Routing dispatch lives in `AppRouteContent.jsx`. Many routes are pure children of WorkstationViews and lack their own loading/error states — they rely on the App-level vault load to gate render. Below: every route's distinct visual mode.

### Command Center — `section==='command'` (AppRouteContent.jsx:223-233 → CommandCenterView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 18 | Mode = deep-work | `modeKey === 'deep-work'` | WorkstationViews.jsx:709, 751-929 | DeepWorkCommandCenter — pinned cards, current-focus, session goals, backlinks/unresolved/related memory mini-lists, tabs (Hub/Projects/Backlinks/SmartViews) |
| 19 | Mode = planning | `modeKey === 'planning'` | WorkstationViews.jsx:706, 931+ | PlanningCommandCenter — metrics, week schedule, 4-step priority cards |
| 20 | Mode = capture | `modeKey === 'capture'` | WorkstationViews.jsx:707, 1059+ | CaptureCommandCenter with recent captures + kind cards |
| 21 | Mode = review | `modeKey === 'review'` | WorkstationViews.jsx:708, 1181+ | ReviewCommandCenter |
| 22 | Pinned empty | `pinnedEntries.length === 0` | WorkstationViews.jsx:810-813 | "Star entries to pin them to your Deep Work hub." dashed card |
| 23 | Pinned populated | `pinnedEntries.length > 0` | WorkstationViews.jsx:814-832 | 4-column grid of ReferencePinnedCard |
| 24 | Current Focus missing | `!focusEntry` (no recent note) | WorkstationViews.jsx:859-861 | "Create a note to set your current focus." |
| 25 | Current Focus present | `focusEntry != null` | WorkstationViews.jsx:839-858 | Title, body excerpt, path, word count, last-edited |
| 26 | Session Goals empty | `goals.length === 0` | WorkstationViews.jsx:866-867 | "Create real tasks or review notes…" |
| 27 | Backlinks tab empty | `focusBacklinks.length === 0` | WorkstationViews.jsx:905-907 | "No backlinks for the current focus." |
| 28 | Active Projects tab empty | `activeProjectsDW.length === 0` | WorkstationViews.jsx:896-898 | "No active projects yet." |

### Inbox (raw) — `section==='raw'` (AppRouteContent.jsx:247-255 → InboxView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 29 | Inbox tab=all (any captures) | `tab === 'all'` | WorkstationViews.jsx:2335-2342 | All captures sorted/filtered |
| 30 | Inbox tab=unreviewed | `tab === 'unreviewed'` | WorkstationViews.jsx:2257 | Captures whose status not in processed/archived/done/complete |
| 31 | Inbox tab=flagged | `tab === 'flagged'` | WorkstationViews.jsx:2258 | starred or priority flagged/urgent/high |
| 32 | Inbox tab=files | `tab === 'files'` | WorkstationViews.jsx:2259 | `captureHasFile(entry)` true |
| 33 | Inbox tab=links | `tab === 'links'` | WorkstationViews.jsx:2260 | `captureHasLink(entry)` true |
| 34 | Inbox tab=media | `tab === 'media'` | WorkstationViews.jsx:2261 | `captureIsMedia(entry)` true |
| 35 | Inbox empty (no raw captures at all) | `captures.length === 0` | WorkstationViews.jsx:2518-2525 | "Inbox is clear" empty card + "New Capture" CTA |
| 36 | Inbox filtered-to-zero | `captures.length > 0 && visibleCaptures.length === 0` | WorkstationViews.jsx:2518-2525 | "No captures match this view" — change tab/sort/tag |
| 37 | Inbox filters panel open | `showFilters === true` | WorkstationViews.jsx:2482-2497 | Tag filter input + clear chip |
| 38 | Inbox bulk panel open | `showBulk === true` | WorkstationViews.jsx:2482, 2498-2505 | Bulk actions row: mark processed, flag, trash, clear |
| 39 | Inbox bulk disabled | `selectedCount === 0` (button disabled) | WorkstationViews.jsx:2478 | "Bulk actions" button disabled |
| 40 | Inbox project picker open | `projectPickerEntry != null` | WorkstationViews.jsx:2551-2559 | `InboxProjectPickerDialog` |
| 41 | Inbox tag editor open | `tagEditorId === entry.id` | WorkstationViews.jsx:2542-2546 | Inline tag editor in capture row |

### Search — `section==='search'` (AppRouteContent.jsx:234-246 → GlobalSearchView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 42 | Search empty query, no rows | `query` empty + `visibleRows.length === 0` | WorkstationViews.jsx:2199-2211 | Sections render empty; "0 results" line |
| 43 | Search query + results | `totalCount > 0` | WorkstationViews.jsx:2213-2216 | Tabs, sections, row list with selected row highlighted |
| 44 | Search query + no matches | `query.trim().length > 0 && totalCount === 0` | WorkstationViews.jsx:2199-2216 | Sections show but empty; total = "0 results" |
| 45 | Search tab switch | `activeTab` ∈ {all, notes, projects, memory, tags, canvases, smart-views, templates, backlinks} | WorkstationViews.jsx:2171-2197, 1806-1820 | Visible rows narrow to that tab |
| 46 | Search row selected (entry) | `selectedRow?.kind === 'entry'` | WorkstationViews.jsx:2106 | Right rail shows entry detail + backlinks + unresolved |
| 47 | Search row deselected | `explicitlyDeselected === true` | WorkstationViews.jsx:2103-2105 | Right rail clears |
| 48 | Search query cleared button | `query` non-empty | WorkstationViews.jsx:2166-2168 | "×" clear-search button visible |

### Projects — `section==='projects'` (AppRouteContent.jsx:256-267 → ProjectsView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 49 | Projects empty | `projectRows.length === 0` | WorkstationViews.jsx:3335-3340 | "No projects yet" empty card + New Project CTA |
| 50 | Projects filtered-to-zero | `projectRows.length > 0 && visibleRows.length === 0` | WorkstationViews.jsx:3335-3340 | "No projects match this view" |
| 51 | Projects grid layout | `layout === 'grid'` (default) | WorkstationViews.jsx:3341-3346 | 3-column ProjectCard grid |
| 52 | Projects list layout | `layout === 'list'` | WorkstationViews.jsx:3347-3353 | ProjectListItem rows |
| 53 | Projects tab=all/starred/archived | `tab` switch | WorkstationViews.jsx:3239-3251 | Filtered project pool |
| 54 | Projects filters panel open | `showFilters === true` | WorkstationViews.jsx:3312-3333 | Status + tag filter widgets |
| 55 | Projects rail open | `railOpen === true` | WorkstationViews.jsx:3360-3375 | ProjectDetailRail with Overview/etc tabs |
| 56 | Projects rail closed | `railOpen === false` | WorkstationViews.jsx:3366 | Collapsed aside (no detail) |

### Notes — `section==='note'` (AppRouteContent.jsx:268-278 → NotesWorkspaceView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 57 | Notes empty | `!activeEntry` (no note found) | NotesWorkspaceView.jsx:313-323 | "No notes yet" + New Entry CTA in jf-notes-empty card |
| 58 | Notes editor — edit mode | `editorMode === 'edit'` | NotesWorkspaceView.jsx:230 | Textarea-driven Markdown editor |
| 59 | Notes editor — preview mode | `editorMode === 'preview'` | NotesWorkspaceView.jsx:230 | Rendered preview blocks (via `previewBlocks`) |
| 60 | Notes editor — split mode | `editorMode === 'split'` (per editorMenu) | NotesWorkspaceView.jsx:230 | Edit + preview side-by-side |
| 61 | Notes rail tab=info | `activeRailTab === 'info'` | NotesWorkspaceView.jsx:231 | Info section |
| 62 | Notes rail tab=backlinks (empty) | `backlinks.length === 0` | NotesWorkspaceView.jsx:362 | "No backlinks yet." |
| 63 | Notes rail tab=backlinks (populated) | `backlinks.length > 0` | NotesWorkspaceView.jsx:355-361 | Backlink rows + "+N more backlinks" |
| 64 | Notes rail tab=unresolved (empty) | `unresolved.length === 0` | NotesWorkspaceView.jsx:377 | "No unresolved links." |
| 65 | Notes rail tab=unresolved (populated) | `unresolved.length > 0` | NotesWorkspaceView.jsx:368-376 | Unresolved-link rows with "Create" buttons |
| 66 | Notes tag adding | `addingTag === true` | NotesWorkspaceView.jsx:329-348 | Inline tag input |
| 67 | Notes fullscreen | `fullscreen === true` | NotesWorkspaceView.jsx:235 | Fullscreen editor mode |

### Calendar — `section==='calendar'` (AppRouteContent.jsx:280 → CalendarView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 68 | Calendar month view | `viewMode === 'month'` (default) | WorkstationViews.jsx:3623, 3641-3651 | 42-cell grid (6 weeks × 7 days) |
| 69 | Calendar week view | `viewMode === 'week'` | WorkstationViews.jsx:3644-3647 | 7-day grid |
| 70 | Calendar day view | `viewMode === 'day'` | WorkstationViews.jsx:3643 | Single 360-px-tall cell |
| 71 | Calendar list view | `displayMode === 'list'` | WorkstationViews.jsx:3782-3797 | Sorted-day list (empty body if `sortedDays.length === 0`: "No dated work yet.") |
| 72 | Calendar grid view | `displayMode === 'grid'` (default) | WorkstationViews.jsx:3728-3781 | Day-cell grid (mute cells outside current month) |
| 73 | Calendar empty list | `sortedDays.length === 0` (no dated entries) | WorkstationViews.jsx:3783 | "No dated work yet." |
| 74 | Calendar journal-only toggle | `journalOnly === true` | WorkstationViews.jsx:3626, 3631-3640 | Only journal entries shown |
| 75 | Calendar filters panel open | `showFilters === true` | WorkstationViews.jsx:3712-3726 | Filter checkboxes for entries/tasks/projects/reviews |
| 76 | Calendar detail rail open | `detailOpen === true` | WorkstationViews.jsx:3815-3829, 3877-3947 | CalendarDetailRail with full sections |
| 77 | Calendar detail rail closed | `detailOpen === false` | WorkstationViews.jsx:3877-3885 | "Details are hidden. Select a calendar day…" |
| 78 | Calendar day has no primary entry | `!primaryEntry` | WorkstationViews.jsx:3901-3903 | "No dated work is attached to this day yet." |
| 79 | Calendar journal section empty | `journalRows.length === 0` | WorkstationViews.jsx:3804-3811 | "No journal entries dated in this calendar yet." |
| 80 | Calendar reviews/tasks section empty | per-section empty | WorkstationViews.jsx:3905-3921 | "No entries dated here." / "No memory reviews due." / "No linked projects." |

### Constellation — `section==='graph'` (AppRouteContent.jsx:323-337 → ConstellationView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 81 | Constellation locked (< 3 entries) | `entries.length < 3` | ConstellationView.jsx:628-640; ConstellationStateOverlay.jsx:105-121 | "Graph unlocks at 3 entries" overlay + "Add another" CTA |
| 82 | Constellation empty (no links yet) | `renderNodes.length === 0 && !hasFilters` | ConstellationView.jsx:783-789 | "Nothing's connected yet." overlay (encourages [[links]]/backlinks) |
| 83 | Constellation no-matches | `renderNodes.length === 0 && hasFilters` | ConstellationView.jsx:783-789 | "No entries match this filter." + Reset filters button |
| 84 | Constellation populated | `renderNodes.length > 0` | ConstellationView.jsx:789-… | SVG graph with nodes/edges |
| 85 | Constellation error state | `state === 'error'` (not currently wired by App, but supported) | ConstellationStateOverlay.jsx:153-163 | "Constellation could not render." overlay |
| 86 | Constellation layout = messy | `layoutMode === 'messy'` | ConstellationView.jsx:172, 685 | Scattered layout |
| 87 | Constellation layout = clusters | `layoutMode === 'clusters'` | ConstellationView.jsx:173, 685 | Component clusters |
| 88 | Constellation layout = affinity | `layoutMode === 'affinity'` | ConstellationView.jsx:163-171, 685 | Tag/type similarity |
| 89 | Constellation focal stack non-empty | `focalStack.length > 0` | ConstellationView.jsx:72, 661-680 | Breadcrumb chips + back button + Open button |
| 90 | Constellation memory-only filter | `memoryOnly === true` | ConstellationView.jsx:62, 721-728 | Filters to wiki/review nodes only |
| 91 | Constellation show-unresolved on | `showUnresolved === true` (default) | ConstellationView.jsx:59, 699-703, 198 | Dashed pseudo-nodes for [[unresolved]] |
| 92 | Constellation info panel open | `infoOpen ∈ {ghosts, messy, clusters, affinity, layout}` | ConstellationView.jsx:67, 696-697, 730-741 | Inline info panel |
| 93 | Constellation scan panel open | `scanOpen === true` | ConstellationView.jsx:60, 706, 742-752 | RelationshipScanPanel |

### Tasks — `section==='tasks'` (AppRouteContent.jsx:279 → TasksView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 94 | Tasks empty (no tasks at all) | `rows.length === 0` | WorkstationViews.jsx:3407-3412 | "No tasks yet" empty card + New Task |
| 95 | Tasks filter empty | `rows.length > 0 && filteredRows.length === 0` | WorkstationViews.jsx:3407-3412 | "No tasks match this filter" |
| 96 | Tasks filter=open | `filter === 'open'` (default) | WorkstationViews.jsx:3381, 3398 | Tasks where `isOpen !== false && taskState !== 'done'` |
| 97 | Tasks filter=today | `filter === 'today'` | WorkstationViews.jsx:3384 | Tasks with `taskState === 'today'` |
| 98 | Tasks filter=overdue | `filter === 'overdue'` | WorkstationViews.jsx:3385 | Tasks with `taskState === 'overdue'` |
| 99 | Tasks filter=done | `filter === 'done'` | WorkstationViews.jsx:3386 | Completed tasks |
| 100 | Tasks filter=all | `filter === 'all'` | WorkstationViews.jsx:3383 | All tasks |

### Spaces — `section==='spaces'` (AppRouteContent.jsx:281-289 → SpacesView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 101 | Spaces empty | `spaces.length === 0` | WorkstationViews.jsx:4120-4125 | "No spaces yet" empty card |
| 102 | Spaces filtered-to-zero | `spaces.length > 0 && visibleSpaces.length === 0` | WorkstationViews.jsx:4120-4125 | "No spaces match this filter" |
| 103 | Spaces filter=active/archived/all | `statusFilter` switch | WorkstationViews.jsx:4020, 4087-4093 | Filtered space pool |
| 104 | Spaces "new space" inline form open | `newSpaceOpen === true` | WorkstationViews.jsx:4023, 4112-4118 | Inline form with name input + Create button |

### AI Setup — `section==='ai'` (AppRouteContent.jsx:296-300 → AIAssistantView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 105 | AI setup — only state | always | AppRouteContent.jsx:69-102 | Status text: "Source-grounded AI is not enabled as a chat route yet." + Open AI Keys + Search vault instead |

(AI Setup has no per-state branching; the AI Keys panel itself lives in Settings.)

### Settings — `section==='settings'` (AppRouteContent.jsx:291-295 → SettingsPanel embedded)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 106 | Settings — Appearance tab | `tab === 'appearance'` | SettingsPanel.jsx:378, 423 | Theme grid, mode segmented, UI scale slider, advanced color pickers if `advanced === true` |
| 107 | Settings — Library tab | `tab === 'library'` | SettingsPanel.jsx:378 | Feature flags, entry-type toggles |
| 108 | Settings — Keyword Library tab | `tab === 'keyword-rules'` | SettingsPanel.jsx:378 | KeywordRulesPanel |
| 109 | Settings — Vault & Recovery tab | `tab === 'vault'` | SettingsPanel.jsx:378 | VaultPanel: vault path, export-zip, TrashReview |
| 110 | Settings — System Health tab | `tab === 'system'` | SettingsPanel.jsx:378 | Runtime, vault path, storage stats |
| 111 | Settings — Privacy tab | `tab === 'privacy'` | SettingsPanel.jsx:378 | PrivacyPanel (telemetry opt-in) |
| 112 | Settings — Extensions tab | `tab === 'plugins'` | SettingsPanel.jsx:378 | PluginsPanel |
| 113 | Settings — AI Keys tab | `tab === 'ai'` | SettingsPanel.jsx:378 | BYOK provider config |
| 114 | Settings — Updates tab | `tab === 'updates'` | SettingsPanel.jsx:378 | UpdatesPanel |
| 115 | Settings — Import/Export tab | `tab === 'data'` | SettingsPanel.jsx:378 | exportJSON / exportMD / importJSON controls |
| 116 | Settings — Shortcuts tab | `tab === 'shortcuts'` | SettingsPanel.jsx:378 | Keybinding reference |
| 117 | Settings — Advanced toggle on | `advanced === true` | SettingsPanel.jsx:365-368, 452+ | Replaces simple Appearance with ThemeDropdown + custom HEX color pickers |
| 118 | Settings — embedded mode | `embedded === true` | SettingsPanel.jsx:363-364, 400-402 | Fills route pane; no fixed positioning |
| 119 | Settings — modal mode | `embedded === false` | SettingsPanel.jsx:400-402 | Fixed right-edge panel (only mounted via App's `settingsOpen` flag) |
| 120 | Settings TrashReview — not loaded | `items === null` | SettingsPanel.jsx:73, 137 | Shows nothing under load until user clicks Review |
| 121 | Settings TrashReview — empty after load | `Array.isArray(items) && items.length === 0` | SettingsPanel.jsx:137-140 | "Trash is empty." |
| 122 | Settings TrashReview — populated | `items.length > 0` | SettingsPanel.jsx:141-161 | List of up to 12 trash files + Empty Trash button |
| 123 | Settings TrashReview — confirming (restore/delete/empty) | `confirming != null` | SettingsPanel.jsx:76, 126-136 | InlineConfirm with tone + busy state |
| 124 | Settings TrashReview — busy | `busy === true` | SettingsPanel.jsx:74 | Buttons disabled, "Checking…"/"Working…" labels |
| 125 | Settings TrashReview — error | `error.length > 0` | SettingsPanel.jsx:75, 125 | Red alert text |
| 126 | Settings VaultPanel — vault selected | `vaultInfo != null` | VaultPicker.jsx:47-69 | Path + Change vault + (optional legacy import) |
| 127 | Settings VaultPanel — vault unset | `vaultInfo == null` | VaultPicker.jsx:71-76 | "No vault picked yet." + pick CTA |
| 128 | Settings VaultPanel — migration available | `legacyCount > 0 && !migrated` | VaultPicker.jsx:56-63 | "You have N entries in browser storage…" + Import button |
| 129 | Settings VaultPanel — migration result | `migrated != null` | VaultPicker.jsx:64-69 | "Imported X of Y entries…" |
| 130 | Settings VaultPanel — picker busy | `busy === true` | VaultPicker.jsx:50-61 | Buttons disabled |
| 131 | Settings VaultPanel — picker error | `err != null` | VaultPicker.jsx:77 | Red alert |
| 132 | Settings export-zip busy | `exporting === true` | SettingsPanel.jsx:172, 177-196 | (button label changes) |
| 133 | Settings export-zip error | `exportError.length > 0` | SettingsPanel.jsx:173 | Inline error |
| 134 | Settings export-zip ready | `exportedAt != null` | SettingsPanel.jsx:174 | "Exported …" timestamp |

### Trash — `section==='trash'` (AppRouteContent.jsx:213-222 → TrashView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 135 | Trash empty | `items.length === 0` | TrashView.jsx:45-50 | "Trash is empty" empty state |
| 136 | Trash populated | `items.length > 0` | TrashView.jsx:51-79 | Articles with Restore + Delete-forever per row |
| 137 | Trash busy | `busy === true` | TrashView.jsx:30-37, 67-74 | Buttons disabled, "Refreshing..." label |
| 138 | Trash error | `error.length > 0` | TrashView.jsx:40-44 | Red alert banner |
| 139 | Trash empty button disabled | `items.length === 0` | TrashView.jsx:34-37 | "Empty Trash" button greyed |

### Bases (each base) — `section.startsWith('base:')` (AppRouteContent.jsx:313-322 → BaseExplorer → BaseView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 140 | Base missing | `currentBase == null` (base id present but base not loaded) | BaseExplorer.jsx:13, 17-65 | "No base selected" — name input + Create CTA |
| 141 | Base creating | `creating === true` | BaseExplorer.jsx:10, 23-54 | Inline name input visible |
| 142 | Base loaded, table view | `activeView.type === 'table'` (default) | BaseView.jsx:348-351 | BaseTable |
| 143 | Base loaded, cards view | `activeView.type === 'cards'` | BaseView.jsx:344-345 | BaseCards grid |
| 144 | Base loaded, list view | `activeView.type === 'list'` | BaseView.jsx:346-347 | BaseList |
| 145 | Base empty (filtered) | `filtered.length === 0` | BaseView.jsx:376-380 | "No entries match this base." |
| 146 | Base populated | `filtered.length > 0` | BaseView.jsx:380 | renderBody() |
| 147 | Base lazy loading | wrapped in Suspense | AppRouteContent.jsx:313-322 | "Loading base..." fallback |

### Canvas (each canvas) — `section.startsWith('canvas:')` (AppRouteContent.jsx:301-312 → CanvasExplorer → CanvasView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 148 | Canvas missing (id only) | `current == null` | CanvasExplorer.jsx:27, 39-89 | Canvases hub + create CTA |
| 149 | Canvas hub creating | `creating === true` | CanvasExplorer.jsx:23, 47-80 | Inline name input |
| 150 | Canvas hub — canvases present | `canvases.length > 0` | CanvasExplorer.jsx:91-127 | Card grid of canvases |
| 151 | Canvas selected | `current != null` | CanvasExplorer.jsx:27-37 | CanvasView |
| 152 | Canvas — connect mode active | `connectMode === true` | CanvasView.jsx:64, 130 | Pointer/cursor enters connect mode |
| 153 | Canvas — file picker open | `showFilePicker === true` | CanvasView.jsx:67, 131 | Entry picker modal layer |
| 154 | Canvas — media picker open | `showMediaPicker === true` | CanvasView.jsx:68, 132 | Media picker modal layer |
| 155 | Canvas — editing node | `editingNodeId != null` | CanvasView.jsx:66, 133 | Inline node text editor |
| 156 | Canvas — editing edge label | `editingEdgeId != null` | CanvasView.jsx:72 | Inline edge label editor |
| 157 | Canvas — remove confirm node | `removeConfirmNode != null` | CanvasView.jsx:71 | Confirm-remove dialog for a node |
| 158 | Canvas — space-held pan | `spaceHeld === true` | CanvasView.jsx:63 | Cursor pan mode |
| 159 | Canvas — dragging node | `draggingNode != null` | CanvasView.jsx:61 | Node follows pointer |
| 160 | Canvas lazy loading | Suspense fallback | AppRouteContent.jsx:301-312 | "Loading canvas..." |

### Templates — `section==='templates'` (AppRouteContent.jsx:199-212 → TemplatesPanel)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 161 | Templates — no templates | `templates.length === 0` (panel internal) | TemplatesPanel.jsx | Empty state encourages template creation |
| 162 | Templates — creating | `creating === true` | TemplatesPanel.jsx:21 | Inline create form |
| 163 | Templates — saving | `saving === true` | TemplatesPanel.jsx:24 | Save button busy state |
| 164 | Templates lazy loading | Suspense fallback | AppRouteContent.jsx:200, 211 | "Loading templates..." |

### Default shell (all/starred/folder:/space:/by-type/welcome) — fallback render at AppRouteContent.jsx:338-388

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 165 | Shell — storage corruption | `storageError != null` | AppRouteContent.jsx:359-362 | Red banner (Storage recovery needed) |
| 166 | Shell — vault error | `vaultError != null` (and no storageError) | AppRouteContent.jsx:363 | "Vault error: …" red banner |
| 167 | Shell — loading | `!loaded` | AppRouteContent.jsx:364 | "Loading..." |
| 168 | Shell — empty (no filters) | `filtered.length === 0 && !hasFilters` | AppRouteContent.jsx:365 → EmptyState.jsx:25-48 | "Your vault is empty" + type buttons + + New Entry |
| 169 | Shell — empty (filtered-to-zero) | `filtered.length === 0 && hasFilters` | AppRouteContent.jsx:365 → EmptyState.jsx:10-24 | "No matches" + Clear filters CTA |
| 170 | Shell — populated grid | `filtered.length > 0 && view === 'grid'` | AppRouteContent.jsx:375-378 | Card grid |
| 171 | Shell — populated list | `filtered.length > 0 && view === 'list'` | AppRouteContent.jsx:379-383 | Row list |
| 172 | Shell — selection toolbar visible | `selectedIds.size > 0` | AppRouteContent.jsx:367-373 | Sticky bulk-action toolbar (Select view / Move to trash / Clear) |
| 173 | Shell — Day2ReturnCard | `section === 'all' && visibleEntries.length < 3 && activation.showDay2` | AppRouteContent.jsx:352-354 | Day-2 nudge card |
| 174 | Shell — FirstSaveBanner | `section === 'all' && visibleEntries.length === 1 && !activation.showDay2` | AppRouteContent.jsx:355-357 | First-save celebration banner |
| 175 | Shell — ProgressPill | `section === 'all'` | AppRouteContent.jsx:349 | Activation progress pill near header count |

### Tags route — `section==='tags'` (AppRouteContent.jsx:290 → TagManagerView)

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 176 | Tag manager — empty | `tags.length === 0` | WorkstationViews.jsx:4367-4371 | "No tags yet" empty card |
| 177 | Tag manager — filtered-to-zero | `tags.length > 0 && visibleTags.length === 0` | WorkstationViews.jsx:4367-4371 | "No tags match this filter" |
| 178 | Tag manager — populated | `visibleTags.length > 0` | WorkstationViews.jsx:4372-4391 | Tag rows with related/aliases/unresolved/count pills |

---

## 4.3 Modal open/closed states

App-level modal flags live in App.jsx (`showAddModal`, `paletteOpen`, `quickSwitcherOpen`, `insertTemplateOpen`, `settingsOpen`, `folderDialogOpen`, `entryFileDialog`, `confirmRequest`, `compilePreview`, `splitMemoryTarget`, `detailId`, `section==='welcome'` → WelcomePanel).

### AddModal — `App.jsx:1615-1619`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 179 | Closed | `showAddModal === false` | App.jsx:143, 1615 | No modal |
| 180 | Opening (lazy fallback) | `showAddModal && Suspense pending` | App.jsx:1616 | "Loading capture..." overlay |
| 181 | Open — full create mode | `quickCapture === false` | AddModal.jsx:147, 481-528 | Type picker grid visible |
| 182 | Open — quickCapture mode (note) | `quickCapture === true && startingType === 'note'` | AddModal.jsx:157, 481, 543 | Type picker hidden, source URL hidden |
| 183 | Open — clean (not dirty) | `dirty === false` | AddModal.jsx:170, 456-460 | Header shows no "Unsaved" badge |
| 184 | Open — dirty (unsaved) | `dirty === true` | AddModal.jsx:170, 456-460 | "Unsaved" badge in header |
| 185 | Open — discard confirm visible | `confirmDiscard === true` | AddModal.jsx:171, 844-863 | "Discard this capture? Your changes will be lost." inline alert |
| 186 | Open — URL error | `urlError.length > 0` | AddModal.jsx:168, 570 | "Use a full http(s) source URL." |
| 187 | Open — dup warning | `dupWarning != null` | AddModal.jsx:169, 823-841 | "That source URL is already in the vault." + Dismiss / Save anyway |
| 188 | Open — content tab=Markdown | `contentTab === 'Markdown'` | AddModal.jsx:167, 808 | Markdown placeholder |
| 189 | Open — content tab=Link | `contentTab === 'Link'` | AddModal.jsx:809 | Link-notes placeholder |
| 190 | Open — content tab=Transcript | `contentTab === 'Transcript'` | AddModal.jsx:810 | Transcript placeholder |
| 191 | Open — content tab=Attachment | `contentTab === 'Attachment'` | AddModal.jsx:811 | Attachment placeholder |
| 192 | Open — content tab=Canvas | `contentTab === 'Canvas'` | AddModal.jsx:812 | Canvas placeholder |
| 193 | Open — suggesting tags | `suggestingTags === true` | AddModal.jsx:235, 580-595 | Suggest button disabled |
| 194 | Open — tag suggest notice | `tagSuggestNotice.length > 0` | AddModal.jsx:236, 622-624 | Inline status text |
| 195 | Open — suggested tags rendered | `suggestedTags.length > 0` | AddModal.jsx:234, 600-621 | Dashed chips above tag input |
| 196 | Open — project context locked | `projectContext != null` | App.jsx:255; AddModal.jsx | Project tag applied automatically |
| 197 | Open — Save to Project disabled | `canSaveToProject === false` | AddModal.jsx:884-893 | Button greyed |

### CommandPalette — `App.jsx:1632-1641`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 198 | Closed | `paletteOpen === false` | App.jsx:201, 1632 | Nothing rendered |
| 199 | Open empty query | `query === ''` | CommandPalette.jsx:49, 79 | All commands grouped by section |
| 200 | Open filtered | `query.length > 0 && filtered.length > 0` | CommandPalette.jsx:79, 109-115 | Filtered/grouped results |
| 201 | Open no-match | `filtered.length === 0` | CommandPalette.jsx:150-154 | "No commands match." |
| 202 | Open registry-updated re-render | `version` bumps on subscribe | CommandPalette.jsx:51, 60-63 | Re-renders when plugin registers/unregisters commands |
| 203 | Lazy fallback | Suspense pending | App.jsx:1633 | "Loading command palette..." |

### QuickSwitcher — `App.jsx:1642-1651`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 204 | Closed | `quickSwitcherOpen === false` | App.jsx:202, 1642 | Nothing rendered |
| 205 | Open empty-vault | `entries.length === 0 && query === ''` | QuickSwitcher.jsx:241-245 | "No entries yet." |
| 206 | Open recent (empty query, has entries) | `query === '' && ranked.length > 0` | QuickSwitcher.jsx:132, 247-296 | "Recent" section header |
| 207 | Open filtered (matches) | `query.length > 0 && ranked.length > 0` | QuickSwitcher.jsx:132, 247-296 | "Matches" section |
| 208 | Open filtered (no matches) | `query.length > 0 && ranked.length === 0` | QuickSwitcher.jsx:241-245 | "No entries match." |
| 209 | Open create-row visible | `trimmed.length > 0 && !exact` | QuickSwitcher.jsx:131, 298-307 | `+ Create "<query>"` row visible |
| 210 | Open exact match | `exact != null` | QuickSwitcher.jsx:127-131 | No create row (exact entry already exists) |
| 211 | Lazy fallback | Suspense pending | App.jsx:1643 | "Loading quick switcher..." |

### SettingsPanel — `App.jsx:1631`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 212 | Closed | `settingsOpen === false && section !== 'settings'` | App.jsx:150 | No panel |
| 213 | Open as modal (fixed) | `settingsOpen === true` | App.jsx:1631; SettingsPanel.jsx:400-402 | Right-edge fixed panel |
| 214 | Open as embedded route | `section === 'settings'` | AppRouteContent.jsx:291-295 | Fills route pane |
| 215 | Lazy fallback | Suspense pending | App.jsx:1387-1396 | "Loading settings..." |

(Per-tab subdivisions enumerated as 4.2 rows 106-134 above.)

### AppConfirmDialog — `App.jsx:1662-1665`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 216 | Closed | `confirmRequest === null` | App.jsx:158; AppConfirmDialog.jsx:2 | No dialog |
| 217 | Open — info tone | `request.tone === 'info'` | AppConfirmDialog.jsx:4 | Blue confirm button |
| 218 | Open — warning tone | `request.tone === 'warning'` | AppConfirmDialog.jsx:4 | Amber button |
| 219 | Open — danger tone (default) | `request.tone === 'danger'` or unset | AppConfirmDialog.jsx:3, 4 | Red button |

### TagManageDialog — `Sidebar.jsx:41-44`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 220 | Closed | `open === false` | TagManageDialog.jsx:99 | Returns null |
| 221 | Open empty | `list.length === 0` | TagManageDialog.jsx:172-175 | "No tags yet. Add tags to entries…" |
| 222 | Open populated | `list.length > 0` | TagManageDialog.jsx:176-291 | Tag list with rename/merge/delete controls |
| 223 | Open — pending delete | `pendingDelete === tag.name` | TagManageDialog.jsx:95, 269-291 | "Sure? This removes the tag from N entries." confirm row |

### InsertTemplateModal — `App.jsx:1652-1661`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 224 | Closed | `insertTemplateOpen === false` | App.jsx:203, 1652 | Nothing |
| 225 | Open — no templates | `templates.length === 0` (filtered) | InsertTemplateModal.jsx:33 | (No row state; toast "No templates yet" shown via App.jsx:954 before opening) |
| 226 | Open — empty query | `query === ''` | InsertTemplateModal.jsx:18, 33 | All templates ranked |
| 227 | Open — filtered with active note context | `activeNoteTitle` non-empty | InsertTemplateModal.jsx:85-95 | "Insert saved template into '<title>'" banner |
| 228 | Lazy fallback | Suspense pending | App.jsx:1653 | "Loading templates..." |

### CompilePreviewModal — `App.jsx:1587-1595`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 229 | Closed | `compilePreview === null` | App.jsx:1368, 1587 | Nothing |
| 230 | Open — emitted=wiki | `result.emitted === 'wiki'` | CompilePreviewModal.jsx:19, 48 | Wiki badge; "Save as wiki entry" primary CTA |
| 231 | Open — emitted=review (default) | `result.emitted === 'review'` | CompilePreviewModal.jsx:19, 49 | Review badge; "Save as review entry" CTA |
| 232 | Open — has blocking warning | `blockingWarning != null` | CompilePreviewModal.jsx:21-24, 41-45, 125-127 | Save CTA blocked (cannot accept) |
| 233 | Open — has amber warnings | warnings with codes in `AMBER_WARNING_CODES` | CompilePreviewModal.jsx:10, severityChip | Amber severity chip per warning |
| 234 | Open — source missing rows | `sourceEntries` missing some `result.sources` ids | CompilePreviewModal.jsx:29-37, 156-163 | "Source missing: <id>" red rows |
| 235 | Open — no sources | `sourcesView.length === 0` | CompilePreviewModal.jsx:152-154 | "No sources recorded." italic |
| 236 | Lazy fallback | Suspense pending | App.jsx:1588 | "Loading compile preview..." |

### SplitMemoryModal — `App.jsx:1596-1604`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 237 | Closed | `splitMemoryTarget === null` | App.jsx:1596 | Nothing |
| 238 | Open — step 1 (pick count) | `step === 1` | SplitMemoryModal.jsx:10, 118-143 | Count chips 2-10 |
| 239 | Open — step 2 (titles + sources) | `step === 2` | SplitMemoryModal.jsx:10, 144-216 | Per-split title input + source checkboxes |
| 240 | Open — step 2 showing errors | `showErrors && !isValid` | SplitMemoryModal.jsx:13, 71-72 | Inline error indicators next to invalid splits |
| 241 | Open — step 2 valid | `isValid === true` | SplitMemoryModal.jsx:67-69 | Submit button enabled |
| 242 | Lazy fallback | Suspense pending | App.jsx:1597 | "Loading split tool..." |

### WelcomePanel / ImportModal — `App.jsx:1620-1628`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 243 | Welcome closed (onboarded) | `isOnboarded() === true` OR `visibleEntries.length > 0` | App.jsx:872-876, 1620 | Not rendered |
| 244 | Welcome active (not onboarded, empty vault) | `section === 'welcome' && !isOnboarded() && visibleEntries.length === 0` | App.jsx:872-876, 1620-1628 | Welcome dialog with imports + start-from-scratch |
| 245 | Welcome — source picker (no active source) | `activeSource === null` | WelcomePanel.jsx:45 | List of source buttons |
| 246 | Welcome — active source ImportModal — pick stage | `stage === 'pick'` (in ImportModal) | ImportModal.jsx:4, 56-64 | File input |
| 247 | Welcome — ImportModal preview stage | `stage === 'preview'` | ImportModal.jsx:67-81 | Parsed-entry preview + import |
| 248 | Welcome — ImportModal committing | `stage === 'committing'` | ImportModal.jsx:83 | "Importing…" |
| 249 | Welcome — ImportModal error | `stage === 'error'` | ImportModal.jsx:85-93 | Red error banner + Try again |
| 250 | Welcome — source: Readwise | active source id `readwise` | parsers/index.js:8 | (Wraps ImportModal flow) |
| 251 | Welcome — source: Pocket | id `pocket` | parsers/index.js:9 | "" |
| 252 | Welcome — source: Kindle | id `kindle` | parsers/index.js:10 | "" |
| 253 | Welcome — source: Obsidian vault | id `obsidian`, directory input | parsers/index.js:11; ImportModal.jsx:60-61 | Directory-picker input |
| 254 | Welcome — source: JotFolio JSON | id `jotfolio` | parsers/index.js:12 | File input |

### EntryFileDialog — `App.jsx:1610-1614`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 255 | Closed | `entryFileDialog === null` | App.jsx:1610; EntryFileDialog.jsx:5 | Nothing |
| 256 | Open — move kind | `request.kind === 'move'` | EntryFileDialog.jsx:6, 8 | "Move entry file" — vault folder input |
| 257 | Open — rename kind | `request.kind === 'rename'` | EntryFileDialog.jsx:6 | "Rename entry file" — filename input |

### FolderCreateDialog — `App.jsx:1605-1609`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 258 | Closed | `folderDialogOpen === false` | App.jsx:152, 1605 | Nothing |
| 259 | Open | `folderDialogOpen === true` | App.jsx:1605-1609; App.jsx:1673-1697 | Inline create-folder form |

### DetailPanel / MemoryDetailPanel — `App.jsx:1572-1586`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 260 | Closed | `detail == null` | App.jsx:149 | Nothing |
| 261 | Open — MemoryDetailPanel (wiki) | `detail.type === 'wiki'` | App.jsx:1572-1581 | MemoryDetailPanel — facts, sources, confirm/split/trace actions |
| 262 | Open — MemoryDetailPanel (review) | `detail.type === 'review'` | App.jsx:1572-1581 | MemoryDetailPanel with isReview=true |
| 263 | Open — Memory: confirmed | `entry.review_status === 'confirmed'` | MemoryDetailPanel.jsx:35 | Different copy/state (isConfirmed=true) |
| 264 | Open — Memory: stale | `entry.freshness === 'stale'` | MemoryDetailPanel.jsx:36 | "Stale" badge / copy |
| 265 | Open — DetailPanel for other types | `detail != null && type ∉ {wiki, review}` | App.jsx:1582-1586 | Regular DetailPanel (note/article/journal/task/project/link/raw) |
| 266 | Lazy fallback | Suspense pending | App.jsx:1573, 1583 | "Loading memory detail..." or "Loading entry detail..." |

### UpdateBanner — `App.jsx:1667`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 267 | Hidden — no status | `status == null` | UpdateBanner.jsx:28 | Nothing |
| 268 | Hidden — dismissed | `dismissed === true` | UpdateBanner.jsx:14, 28 | Nothing |
| 269 | Hidden — state not actionable | `state ∉ {ready, downloading, error}` | UpdateBanner.jsx:29 | Nothing |
| 270 | Shown — downloading | `state === 'downloading'` | UpdateBanner.jsx:30, 63 | "Downloading N%" + transferred/total MB |
| 271 | Shown — ready | `state === 'ready'` | UpdateBanner.jsx:31, 61-62, 79-94 | "Update ready" + Restart now + Later buttons |
| 272 | Shown — error | `state === 'error'` | UpdateBanner.jsx:32, 59-67 | "Update check failed" + message |

### ActivationToast — `App.jsx:1668`

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 273 | Hidden | `celebrating === false` | App.jsx:864, 1668 | Nothing |
| 274 | Shown — celebrating 3-entry milestone | `celebrating === true` | App.jsx:864, 1668 | Toast pops; after done navigates to graph |

---

## 4.4 Sidebar collapsed/expanded states

`Sidebar.jsx` driven by `open` prop (= `sidebarOpen` in App). Width computed at `App.jsx:1438`: `sidebarOpen ? max(prefs.sidebarWidth, 260) : 58`.

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 275 | Sidebar collapsed | `open === false` | Sidebar.jsx:16, 29 | 58-px-wide rail; nav-item labels hidden (only icons), tooltips via `title`/`aria-label`. Tag list + "Manage Tags" button hidden entirely (Sidebar.jsx:29-42). Section divider is a thin line. |
| 276 | Sidebar expanded | `open === true` | Sidebar.jsx:16, 29-42 | Full width (≥260px); nav-item labels visible; Tag section header + tag rows + "Manage Tags" CTA visible; full SectionDivider |
| 277 | Sidebar — collapsed tag-manage hidden | `open === false` | Sidebar.jsx:30-42 | Entire "Tags" section omitted from render |
| 278 | Sidebar — tag manage dialog open | `tagManageOpen === true` | Sidebar.jsx:7, 41, 44 | `TagManageDialog` overlay |
| 279 | Sidebar — filter active tag | `filterTag === t.name` for some tag | Sidebar.jsx:33-39 | Tag highlighted (background tint, white text) |

(Sidebar omits Folders/Bases/Canvases/PluginPanelSlot rendering despite receiving the props — these are passed through but never rendered. Flagged as orphan props elsewhere in the audit.)

---

## 4.5 Feature-flag-gated UI

`source/src/lib/featureFlags.js`. Six flags total. `filterEntriesForUI` (App.jsx:869) hides matching entry types from every UI surface; `EmptyState` adapts copy; `Constellation` adapts type-filter dropdown.

| # | Flag | Default | Source file:line | Surfaces it affects |
|---|---|---|---|---|
| 280 | `wiki_mode` | `true` (alpha.18) | featureFlags.js:5, 21 | Hides `wiki`-type entries everywhere when off. EmptyState message changes (EmptyState.jsx:8, 30). Constellation type filter omits wiki (ConstellationView.jsx:31, 54). |
| 281 | `raw_inbox` | `true` (alpha.18) | featureFlags.js:6, 22 | Hides `raw`-type entries; Inbox view (raw section) still mounts but shows no captures. EmptyState copy changes (EmptyState.jsx:8, 30). Constellation hides raw nodes. |
| 282 | `review_queue` | `true` (alpha.18) | featureFlags.js:7, 23 | Hides `review`-type entries everywhere. EmptyState copy. Constellation hides review nodes. |
| 283 | `context_packs` | `false` (dark) | featureFlags.js:9, 25 | Read but no UI consumes it yet (planned phase) |
| 284 | `memory_graph_nodes` | `false` (dark) | featureFlags.js:10, 26 | Read but no UI consumes it yet (planned phase) |
| 285 | `semanticEdges` | `false` (opt-in) | featureFlags.js:13, 29 | Gates `useSemanticIndex` (App.jsx:882). When off: status bar omits semantic, AddModal's "Suggest tags" button omitted (App.jsx:1617 → `suggestTagsFromText` undefined), Constellation dashed semantic edges hidden, DetailPanel "similar" hidden. |
| 286 | Flag-fallback empty state copy | `knowledgeOn = any of raw_inbox/wiki_mode/review_queue` true | EmptyState.jsx:8, 30 | "inbox capture, wiki note, or review item" added to vault-empty subtitle |

---

## 4.6 prefers-reduced-motion

Defined in `source/src/design/tokens.css:241-256` — overrides four duration vars + two motion-shortcut vars when the OS preference is on.

`--jf-motion-enter` and `--jf-motion-control` (and the `--jf-t-*` durations) are declared but a repo-wide grep shows them only used inside `tokens.css` itself. The CSS overrides are dormant at runtime today.

The runtime path that actually changes behavior is JS-driven (Constellation only) — see `usePrefersReducedMotion()` at ConstellationView.jsx:1365-1380.

| # | Mode | Condition | Source file:line | What user sees |
|---|---|---|---|---|
| 287 | Motion full | `matchMedia('(prefers-reduced-motion: reduce)') === false` AND `renderNodes.length <= 120` | ConstellationView.jsx:241 | Bob/jitter RAF animation on Constellation nodes; transition props on edges/nodes (560-566) |
| 288 | Motion reduced (Constellation node bob off) | `prefersReducedMotion === true` | ConstellationView.jsx:241 | RAF bob loop suppressed (`motionAllowed` false) |
| 289 | Motion reduced (Constellation transitions zeroed) | `prefersReducedMotion === true` | ConstellationView.jsx:560-566 | `layerTransition`/`nodeTransition`/`edgeTransition` set to `none` |
| 290 | Motion reduced (CSS tokens zeroed — DORMANT) | OS media query | tokens.css:241-256 | Token durations go to 0ms; but no component reads `--jf-t-*` / `--jf-motion-*` directly today, so no observable effect outside Constellation |
| 291 | Large graph fallback | `renderNodes.length > LARGE_GRAPH_ANIMATION_LIMIT (120)` | ConstellationView.jsx:32, 241 | Animation suppressed regardless of OS preference (same visual as reduced-motion mode) |

---

Total: **291 distinct UI modes across 6 subcategories.**

### Coverage notes

- Routes audited for every state: Command Center, Inbox, Search, Projects, Notes, Calendar, Constellation, Tasks, Spaces, AI Setup, Settings (with per-tab + per-internal-panel substates), Trash, Bases, Canvases, Templates, Tag Manager, plus the default shell route (all/starred/folder:/space:/by-type).
- Subviews counted as distinct modes when they produce visibly different UI (e.g., grid vs list, edit vs preview, busy vs idle, tab-with-data vs tab-empty).
- Every modal enumerated for closed / opening (lazy fallback) / open-empty / open-populated / dirty / sub-confirm where applicable.
- `prefers-reduced-motion`: CSS tokens are wired in `tokens.css` but currently unused by components (likely dead code / future hook). Only Constellation actually consumes the media-query at runtime via `usePrefersReducedMotion()`. Worth flagging as a coverage gap.
- AI Setup route is a single static surface — no per-state branching by design (charter ban on AI chat).
- Browser-vault auto-pick path means the full-screen first-run `VaultPicker mode='modal'` is never reached in browser preview; it's only authored for Electron's pre-`vault.getVaultPath()` flow (currently unmounted by App.jsx — see modes 4 and 16 for the actual reach paths).
