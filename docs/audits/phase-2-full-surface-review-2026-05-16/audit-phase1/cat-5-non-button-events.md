# Category 5 — Non-Button Event Bindings

Branch: `phase2/5174-transformation` @ `18af965`
Scope: every non-button event binding in `source/src/`. Read-only research.

One row per binding. "Binding" = a single addEventListener/JSX-prop attachment site (the handler body may branch on key/button, but the binding is counted once unless distinct DOM events are bound on the same element).

---

## 5.1 Keyboard shortcuts (global)

Global = bound on `document` or `window`, not scoped to a single component's DOM subtree. Includes hook-based globals (`useAppShortcuts`, `useEscapeKey`) and direct `addEventListener('keydown')` on `document`/`window`.

| # | Key combo | Action | Source file:line |
|---|-----------|--------|------------------|
| 1 | `N` (no modifier) | Open Add modal (`openAdd()`) | source/src/lib/appHooks.js:37 |
| 2 | `Shift+N` | Quick-capture note (`openAdd({type:'note',quickCapture:true})`) | source/src/lib/appHooks.js:36 |
| 3 | `/` | Focus search input (`input[placeholder^="Search"]`) | source/src/lib/appHooks.js:38 |
| 4 | `Cmd/Ctrl+K` | Open Search section (closes palette + quick switcher first) | source/src/App.jsx:556-568 |
| 5 | `Cmd/Ctrl+P` | Toggle Command Palette | source/src/App.jsx:573-577 |
| 6 | `Cmd/Ctrl+O` | Toggle Quick Switcher | source/src/App.jsx:579-583 |
| 7 | `Escape` | Dismiss modal (parameterized via `useEscapeKey`) — generic hook | source/src/lib/hooks.js:38-50 |
| 8 | `Escape` (AddModal) | Close Add modal via `tryClose()` (includeEditableTargets) | source/src/features/add/AddModal.jsx:176 |
| 9 | `Escape` (CompilePreviewModal) | Close compile preview | source/src/features/constellation/CompilePreviewModal.jsx:15 |
| 10 | `Escape` (MemoryDetailPanel) | Close memory detail panel | source/src/features/constellation/MemoryDetailPanel.jsx:31 |
| 11 | `Escape` (SplitMemoryModal) | Close split memory modal | source/src/features/constellation/SplitMemoryModal.jsx:18 |
| 12 | `Escape` (DetailPanel) | `requestDiscard('close')` | source/src/features/detail/DetailPanel.jsx:135 |
| 13 | `Escape` (TagManageDialog) | Close tag manage dialog (when open) | source/src/features/tags/TagManageDialog.jsx:97 |
| 14 | `Escape` (EntryFileDialog) | Close rename/move dialog (includeEditableTargets) | source/src/features/shell/EntryFileDialog.jsx:4 |
| 15 | `Escape` (SettingsPanel) | Close settings (when not embedded) | source/src/features/settings/SettingsPanel.jsx:371 |
| 16 | `Escape` (ImportModal) | Close onboarding import modal | source/src/onboarding/ImportModal.jsx:10-12 |
| 17 | `Escape` (WelcomePanel) | Skip onboarding (only when no activeSource) | source/src/onboarding/WelcomePanel.jsx:58-62 |
| 18 | `Space` (down, Canvas global) | Enable pan mode (`setSpaceHeld(true)`) — suppressed in fields/editing | source/src/features/canvas/CanvasView.jsx:120-127, 137 |
| 19 | `Escape` (Canvas global) | Cancel connect, close pickers, exit text edit | source/src/features/canvas/CanvasView.jsx:128-134, 137 |
| 20 | `Space` (up, Canvas global) | `setSpaceHeld(false)` | source/src/features/canvas/CanvasView.jsx:136, 138 |
| 21 | `Escape` (Constellation global) | Pop one focal layer | source/src/features/constellation/ConstellationView.jsx:502, 506 |
| 22 | `c` / `C` (Constellation global) | Toggle messy ↔ clusters layout | source/src/features/constellation/ConstellationView.jsx:503, 506 |
| 23 | `a` / `A` (Constellation global) | Toggle affinity ↔ messy layout | source/src/features/constellation/ConstellationView.jsx:504, 506 |

Note: ribbon tooltips reference `Cmd/Ctrl+G` (Constellation), `Cmd/Ctrl+Shift+D` (Daily Note), `?` (help) — none of these are wired up in code grep. (orphan-suspect — tooltip text only)

---

## 5.2 Local keydown handlers (per-component `onKeyDown`)

These bind to specific DOM nodes (modals, inputs, listboxes) rather than `document`/`window`.

| # | Where | Keys handled | Source file:line |
|---|-------|--------------|------------------|
| 1 | AddModal main form wrapper | `Cmd/Ctrl+Enter` → saveEntry('inbox') | source/src/features/add/AddModal.jsx:397-402, 430 |
| 2 | AddModal tag input | `Enter` / `,` add tag; (also onBlur addTag) | source/src/features/add/AddModal.jsx:667-672 |
| 3 | WelcomePanel dialog root | `Tab` focus trap (`containTabFocus`) | source/src/onboarding/WelcomePanel.jsx:21-42, 74 |
| 4 | CanvasExplorer create-canvas input | `Enter` create, `Escape` cancel | source/src/features/canvas/CanvasExplorer.jsx:54-64 |
| 5 | BaseView sort-column button | `Enter`/`Space` → sortByCol | source/src/features/bases/BaseView.jsx:187-192 |
| 6 | CanvasView media-path input | `Enter` → handleAddMedia | source/src/features/canvas/CanvasView.jsx:441 |
| 7 | CanvasView edge-label input | `Enter` save, `Escape` cancel | source/src/features/canvas/CanvasView.jsx:458-467 |
| 8 | CanvasView node (`CanvasNode` button div) | Enter/Space, F2, Delete/Backspace, Arrow keys (10/50px) — `handleNodeKeyDown` | source/src/features/canvas/CanvasView.jsx:324-346, 590, 638 |
| 9 | CanvasView text-card textarea (editing) | `Escape` cancel, `Cmd/Ctrl+Enter` commit | source/src/features/canvas/CanvasView.jsx:732-734 |
| 10 | CommandPalette dialog root | `Tab` focus trap | source/src/features/commandPalette/CommandPalette.jsx:25-46, 126 |
| 11 | CommandPalette search input | `Escape` close, `ArrowDown`/`ArrowUp` navigate, `Enter` exec | source/src/features/commandPalette/CommandPalette.jsx:100-105, 136 |
| 12 | BaseExplorer create-base input | `Enter` create, `Escape` cancel | source/src/features/bases/BaseExplorer.jsx:30-39 |
| 13 | ConstellationView graph-node `<g>` | Enter/Space activate, `o`/`O` open — `onGraphNodeKeyDown` | source/src/features/constellation/ConstellationView.jsx:615-625, 886 |
| 14 | MemoryNode (memory wiki/review node) | Enter/Space select — `handleKeyDown` | source/src/features/constellation/MemoryNode.jsx:37-42, 92 |
| 15 | TemplatesPanel new-template input | `Enter` submit, `Escape` cancel | source/src/features/templates/TemplatesPanel.jsx:124-127 |
| 16 | ThemeDropdown button | ArrowDown/Up (cycle on closed; highlight on open), Home/End, Enter/Space, Escape — `onKey` | source/src/features/dropdowns/ThemeDropdown.jsx:51-71, 75 |
| 17 | InsertTemplateModal search input | `Escape`, `ArrowDown/Up`, `Enter` insert | source/src/features/templates/InsertTemplateModal.jsx:48-65, 101 |
| 18 | Select (generic dropdown) button | ArrowDown/Up, Enter/Space, Escape — `onKey` | source/src/features/dropdowns/Select.jsx:43-48, 53 |
| 19 | NoteBody — collapsed/empty notes div | Enter/Space → setEditing(true) | source/src/features/editor/NoteBody.jsx:215 |
| 20 | NoteBody — rendered markdown div | Enter/Space → setEditing(true) | source/src/features/editor/NoteBody.jsx:226 |
| 21 | NoteBody — editor textarea | Escape close suggest, ArrowDown/Up navigate suggest, Enter pick suggest — `onKeyDown` (suppressed when no suggest popover) | source/src/features/editor/NoteBody.jsx:152-163, 266 |
| 22 | HexInput | `Enter` blur, `Escape` revert + blur | source/src/features/dropdowns/HexInput.jsx:13 |
| 23 | NotesRail tag input | `Enter` addTag | source/src/features/workstation/NotesRail.jsx:298-303 |
| 24 | NotesWorkspaceView status input | `Enter` blur, `Escape` revert + blur | source/src/features/notes/NotesWorkspaceView.jsx:395-401 |
| 25 | NotesWorkspaceView tag input | `Enter` submit, `Escape` cancel | source/src/features/notes/NotesWorkspaceView.jsx:334-343 |
| 26 | WorkstationViews — Quick Capture textarea | `Cmd/Ctrl+Enter` → captureNow | source/src/features/workstation/WorkstationViews.jsx:1124-1129 |
| 27 | WorkstationViews — global search input (Search section) | Escape clears, ArrowDown/Up navigate, Enter open | source/src/features/workstation/WorkstationViews.jsx:2144-2149 |
| 28 | WorkstationViews — ProjectCard (role=button) | Enter/Space → onSelect | source/src/features/workstation/WorkstationViews.jsx:2923-2928 |
| 29 | WorkstationViews — ProjectListItem (role=button) | Enter/Space → onSelect | source/src/features/workstation/WorkstationViews.jsx:2978-2983 |
| 30 | WorkstationViews — project tag input | Enter submit, Escape cancel | source/src/features/workstation/WorkstationViews.jsx:3152-3161 |
| 31 | WorkstationViews — Task row (role=button) | Enter/Space → onOpenEntry | source/src/features/workstation/WorkstationViews.jsx:3441-3446 |
| 32 | WorkstationViews — Calendar/task card (role=button) | Enter/Space → onOpenEntry | source/src/features/workstation/WorkstationViews.jsx:3844-3850 |
| 33 | WorkstationViews — Spaces filter input | `Escape` clears query | source/src/features/workstation/WorkstationViews.jsx:4098-4100 |
| 34 | WorkstationViews — new-space name input | `Enter` createSpaceSeed | source/src/features/workstation/WorkstationViews.jsx:4115 |
| 35 | WorkstationViews — Tags filter input | `Escape` clears query | source/src/features/workstation/WorkstationViews.jsx:4361-4363 |
| 36 | WorkspaceTopBar global search input | `Escape` clear, `Cmd/Ctrl+K` activate (preventDefault+stop) | source/src/features/workstation/WorkspaceTopBar.jsx:107-114 |
| 37 | QuickSwitcher dialog root | `Tab` focus trap | source/src/features/quickSwitcher/QuickSwitcher.jsx:34-55, 205 |
| 38 | QuickSwitcher search input | `Escape`, `ArrowDown/Up`, `Enter` activate, `Shift+Enter` create | source/src/features/quickSwitcher/QuickSwitcher.jsx:165-193, 221 |
| 39 | PropertiesPanel — value edit input | `Enter` commit, `Escape` cancel | source/src/features/properties/PropertiesPanel.jsx:89-92 |
| 40 | PropertiesPanel — key draft input | `Escape` cancel adding | source/src/features/properties/PropertiesPanel.jsx:156 |
| 41 | PropertiesPanel — value draft input | `Enter` submit, `Escape` cancel adding | source/src/features/properties/PropertiesPanel.jsx:163-166 |
| 42 | Pressable primitive | Enter/Space → onPress | source/src/features/primitives/Pressable.jsx:3 |

---

## 5.3 Drag and drop

| # | Element | Event | Behavior | Source file:line |
|---|---------|-------|----------|------------------|
| 1 | AddModal inner panel | `onDragOver` | `event.preventDefault()` (enables drop) | source/src/features/add/AddModal.jsx:429 |
| 2 | AddModal inner panel | `onDrop` | Read `dataTransfer.getData('text/uri-list'\|'text/plain')` → set URL field; then `dataTransfer.files?.[0]` → import attachment | source/src/features/add/AddModal.jsx:318-342, 428 |

No other `onDrop`, `onDragOver`, `onDragStart`, `onDragEnd`, `onDragEnter`, `onDragLeave`, or `dataTransfer` bindings exist in `source/src/`. Canvas node movement is implemented via pointer events (see 5.6), not HTML5 drag-and-drop. Sidebar has no drag-to-reorder.

---

## 5.4 Scroll listeners

| # | Where | Event | Behavior | Source file:line |
|---|-------|-------|----------|------------------|
| 1 | Generic `Select` dropdown (open) | `window.addEventListener('scroll', ..., true)` (capture) | Recompute portal menu position via `syncMenuRect()` | source/src/features/dropdowns/Select.jsx:34, 38 |

No `onScroll=` JSX props anywhere. No infinite-scroll or sticky-header scroll listeners in workstation views.

---

## 5.5 Focus / blur handlers

| # | Where | Event | Behavior | Source file:line |
|---|-------|-------|----------|------------------|
| 1 | AddModal — tag input | `onBlur` | `addTag(tagDraft)` (commit pending tag) | source/src/features/add/AddModal.jsx:673 |
| 2 | CanvasView — text-card textarea | `onBlur` | `onCommitText(draftText)` | source/src/features/canvas/CanvasView.jsx:731 |
| 3 | ConstellationView — graph node `<g>` | `onFocus` | `setKeyboardFocus(n.id)` | source/src/features/constellation/ConstellationView.jsx:887 |
| 4 | ConstellationView — graph node `<g>` | `onBlur` | Clear `keyboardFocus` if matched | source/src/features/constellation/ConstellationView.jsx:888 |
| 5 | MemoryNode root div | `onFocus` | `setIsFocused(true)` | source/src/features/constellation/MemoryNode.jsx:93 |
| 6 | MemoryNode root div | `onBlur` | `setIsFocused(false)` | source/src/features/constellation/MemoryNode.jsx:94 |
| 7 | PropertiesPanel — value edit input | `onBlur` | `commit()` | source/src/features/properties/PropertiesPanel.jsx:88 |
| 8 | WorkspaceTopBar search input | `onFocus` | `onSearchActivate?.()` | source/src/features/workstation/WorkspaceTopBar.jsx:102 |
| 9 | HexInput | `onBlur` | `commit()` | source/src/features/dropdowns/HexInput.jsx:12 |
| 10 | NoteBody editor textarea | `onBlur` (named `onBlur` const) | Delayed (120ms) commit notes + clear suggest popover | source/src/features/editor/NoteBody.jsx:164-170, 265 |
| 11 | NotesWorkspaceView — status input | `onBlur` | Commit if changed | source/src/features/notes/NotesWorkspaceView.jsx:391-394 |

---

## 5.6 Mouse / pointer handlers (non-click)

Includes `onMouseDown` (modal-backdrop dismiss, preventDefault for option lists, stopPropagation guards), `onMouseEnter/Leave` (hover state, highlight index), and pointer events (Canvas/Constellation drag).

### Modal backdrop dismiss (onMouseDown on root, target===currentTarget closes)

| # | Modal | Source file:line |
|---|-------|------------------|
| 1 | App FolderCreateDialog | source/src/App.jsx:1677 |
| 2 | AppConfirmDialog | source/src/features/shell/AppConfirmDialog.jsx:12 |
| 3 | EntryFileDialog | source/src/features/shell/EntryFileDialog.jsx:21 |
| 4 | InsertTemplateModal | source/src/features/templates/InsertTemplateModal.jsx:77 |
| 5 | CommandPalette | source/src/features/commandPalette/CommandPalette.jsx:127 |
| 6 | QuickSwitcher | source/src/features/quickSwitcher/QuickSwitcher.jsx:206 |

### Listbox option pattern (onMouseDown `preventDefault()` + activate; onMouseEnter sets active idx)

| # | Where | Event(s) | Behavior | Source file:line |
|---|-------|----------|----------|------------------|
| 7 | QuickSwitcher result row | onMouseEnter, onMouseDown | setActiveIdx; preventDefault + activate(note) | source/src/features/quickSwitcher/QuickSwitcher.jsx:269-270 |
| 8 | QuickSwitcher CreateRow | onMouseEnter, onMouseDown | setActiveIdx; preventDefault + activate(create) | source/src/features/quickSwitcher/QuickSwitcher.jsx:72-73 |
| 9 | CommandPalette command row | onMouseEnter, onMouseDown | setActiveIdx; preventDefault + exec(cmd) | source/src/features/commandPalette/CommandPalette.jsx:167-168 |
| 10 | InsertTemplateModal template row | onMouseEnter, onMouseDown | setActiveIdx; preventDefault + pick(tpl) | source/src/features/templates/InsertTemplateModal.jsx:126-127 |
| 11 | NoteBody wiki-link suggest row | onMouseDown, onMouseEnter | preventDefault + pickSuggestion; update suggest index | source/src/features/editor/NoteBody.jsx:292-293 |
| 12 | NoteBody mode tab (Edit/Preview) | onMouseDown | preventDefault (preserve textarea focus) | source/src/features/editor/NoteBody.jsx:239 |
| 13 | NoteBody toolbar button | onMouseDown | preventDefault (preserve focus) | source/src/features/editor/NoteBody.jsx:248 |
| 14 | NoteBody commit button | onMouseDown | preventDefault, commit notes, exit editing | source/src/features/editor/NoteBody.jsx:314 |
| 15 | NotesWorkspaceView markdown toolbar button | onMouseDown | preventDefault | source/src/features/notes/NotesWorkspaceView.jsx:500 |
| 16 | ThemeDropdown option | onMouseEnter | setHighlight(i) | source/src/features/dropdowns/ThemeDropdown.jsx:85 |
| 17 | Select option | onMouseEnter | setHighlight(i) | source/src/features/dropdowns/Select.jsx:62 |

### onMouseDown stopPropagation (prevent parent drag/click)

| # | Where | Behavior | Source file:line |
|---|-------|----------|------------------|
| 18 | Row.jsx delete button | stopPropagation | source/src/features/card/Row.jsx:33 |
| 19 | Card.jsx delete button | stopPropagation | source/src/features/card/Card.jsx:47 |
| 20 | BaseView card delete button | stopPropagation | source/src/features/bases/BaseView.jsx:288 |
| 21 | BaseView list delete button | stopPropagation | source/src/features/bases/BaseView.jsx:324 |
| 22 | CanvasView node remove (×) button | stopPropagation | source/src/features/canvas/CanvasView.jsx:693 |
| 23 | CanvasView text-card textarea | stopPropagation | source/src/features/canvas/CanvasView.jsx:736 (onClick too at 737 — separate event) |

### onMouseEnter / onMouseLeave hover state

| # | Where | Behavior | Source file:line |
|---|-------|----------|------------------|
| 24 | Row article | hover state (border color) | source/src/features/card/Row.jsx:10 |
| 25 | Card article | hover state (border + transform) | source/src/features/card/Card.jsx:14 |
| 26 | DetailPanel link-picker button | inline bg toggle | source/src/features/detail/DetailPanel.jsx:329-330 |
| 27 | Ribbon button | inline bg + color toggle | source/src/features/ribbon/Ribbon.jsx:37-38 |
| 28 | CanvasView file-picker button | inline bg toggle | source/src/features/canvas/CanvasView.jsx:425-426 |
| 29 | CanvasView node | hover state | source/src/features/canvas/CanvasView.jsx:640-641 |
| 30 | ConstellationView graph node `<g>` | setHover(n.id) / setHover(null) | source/src/features/constellation/ConstellationView.jsx:889 |
| 31 | nodeRenderers — StarNode | onHover(n.id) / onHover(null) | source/src/features/constellation/nodeRenderers.jsx:70-71 |
| 32 | nodeRenderers — BoardNode | onHover(n.id) / onHover(null) | source/src/features/constellation/nodeRenderers.jsx:170-171 |
| 33 | nodeRenderers — EditorialNode | onHover(n.id) / onHover(null) | source/src/features/constellation/nodeRenderers.jsx:287-288 |

### Pointer events (Canvas + Constellation drag/pan)

| # | Where | Event(s) | Behavior | Source file:line |
|---|-------|----------|----------|------------------|
| 34 | CanvasView surface div | onPointerDown (`onPointerDownSurface`) | middle-button or space+left = pan; spawns window-level pointermove/up | source/src/features/canvas/CanvasView.jsx:156-170, 515 |
| 35 | CanvasView wheel listener (manual) | `wheel` (non-passive on containerRef) | Trackpad/Ctrl+wheel zoom about cursor (`onWheel`) | source/src/features/canvas/CanvasView.jsx:93-108, 114-115 |
| 36 | CanvasView per-node | onPointerDown (`onNodePointerDown`) | Start drag; spawns window-level pointermove/up to commit final pos | source/src/features/canvas/CanvasView.jsx:172-198, 587 |
| 37 | CanvasView node (CanvasNode) | onPointerDown (prop pass-through) | bound to onPointerDown handler | source/src/features/canvas/CanvasView.jsx:635 |
| 38 | CanvasView node — onContextMenu | onContextMenu | preventDefault + onRemove | source/src/features/canvas/CanvasView.jsx:639 |
| 39 | CanvasView node remove (×) button | onPointerDown stopPropagation | source/src/features/canvas/CanvasView.jsx:692 |
| 40 | CanvasView text-card textarea | onPointerDown stopPropagation | source/src/features/canvas/CanvasView.jsx:736 |
| 41 | ConstellationView svg | onPointerDown / onPointerMove / onPointerUp / onPointerCancel | Pan via `setView` updates | source/src/features/constellation/ConstellationView.jsx:338-358, 793 |
| 42 | ConstellationView wheel listener (manual) | `wheel` (non-passive on svgRef.current) | Zoom about cursor | source/src/features/constellation/ConstellationView.jsx:312-326, 326-327 |
| 43 | ConstellationView graph-node group `<g>` | onPointerDown | Cluster/node drag start (`onNodePointerDown`) | source/src/features/constellation/ConstellationView.jsx:365-384, 882 |
| 44 | ConstellationView graph-node group `<g>` | onPointerMove | Update drag offsets (`onNodePointerMove`) | source/src/features/constellation/ConstellationView.jsx:385-398, 883 |
| 45 | ConstellationView graph-node group `<g>` | onPointerUp | Commit drag or fire click/drill/open (`onNodePointerUp`) | source/src/features/constellation/ConstellationView.jsx:399-418, 884 |
| 46 | ConstellationView graph-node group `<g>` | onPointerCancel | Clear `compDragRef.current` | source/src/features/constellation/ConstellationView.jsx:885 |

### Dropdown click-outside (mousedown on document)

| # | Where | Event | Behavior | Source file:line |
|---|-------|-------|----------|------------------|
| 47 | `useClickOutside` hook | `document.addEventListener('mousedown', ...)` | Close if event target outside ref | source/src/features/dropdowns/bus.js:17-23 |
| 48 | Select (portal-menu version) | `document.addEventListener('mousedown', ...)` | Close if target outside root or list refs | source/src/features/dropdowns/Select.jsx:32, 36 |

---

## 5.7 Custom events / event bus

### EventBus (`appBus`) — plugin pub/sub layer

Channels listed in `EventBus.js` header: `vault-change`, `note-open`, `note-save`, `note-create`, `note-delete`, `app-ready`, `app-quit`.

| # | API surface | Behavior | Source file:line |
|---|-------------|----------|------------------|
| 1 | `appBus.on(event, cb)` | Subscribe | source/src/plugins/EventBus.js:9-14 |
| 2 | `appBus.off(event, cb)` | Unsubscribe | source/src/plugins/EventBus.js:16-18 |
| 3 | `appBus.emit(event, payload)` | Fire | source/src/plugins/EventBus.js:20-28 |
| 4 | Plugin API `events.on` (Worker bridge) | `appBus.on` proxy → postMessage `event:fire` | source/src/plugins/PluginBridge.js:201-209 |
| 5 | Plugin API `events.on` (Direct host) | `appBus.on` proxy | source/src/plugins/PluginAPI.js:72-77 |
| 6 | Plugin API `events.on` (PluginHost) | `appBus.on` proxy | source/src/plugins/PluginHost.js:226 |

Critical finding: **the JotFolio app itself never calls `appBus.emit`** — grep for `appBus.emit` and `emit('vault-change'|'note-open'|'note-save'|'note-create'|'note-delete'|'app-ready'|'app-quit')` returns zero matches in `source/src/`. Plugins can subscribe to these events via the API surface, but the host app currently emits nothing on the bus. (orphan-suspect — entire plugin event API surface has no producers in the JotFolio core)

### Window-level custom events (plugin → window re-dispatch)

| # | Event name pattern | Producer | Source file:line |
|---|--------------------|----------|------------------|
| 7 | `plugin:<id>:<event>` (CustomEvent) | PluginHost direct path on `events.emit` | source/src/plugins/PluginHost.js:229 |
| 8 | `jotfolio:<event>` (CustomEvent) | PluginHost direct path on `events.emit` | source/src/plugins/PluginHost.js:230 |
| 9 | `plugin:<id>:<event>` (CustomEvent) | PluginBridge Worker bridge on `events.emit` | source/src/plugins/PluginBridge.js:223 |
| 10 | `jotfolio:<event>` (CustomEvent) | PluginBridge Worker bridge on `events.emit` | source/src/plugins/PluginBridge.js:224 |
| 11 | `plugin:<id>:<event>` (CustomEvent) | PluginAPI events.emit | source/src/plugins/PluginAPI.js:82 |
| 12 | `jotfolio:<event>` (CustomEvent) | PluginAPI events.emit | source/src/plugins/PluginAPI.js:83 |

No `window.addEventListener` for `plugin:*` or `jotfolio:*` exists in app code. Plugins emit; app does not listen via this channel. (orphan-suspect — emitters with no in-app listeners)

### Dropdown single-open bus (`EventTarget`)

| # | Where | Behavior | Source file:line |
|---|-------|----------|------------------|
| 13 | `_dropdownBus.addEventListener('open', h)` | Close this dropdown when another fires `open` (single-open enforcement) | source/src/features/dropdowns/bus.js:6-15 |
| 14 | `_dropdownBus.dispatchEvent(new CustomEvent('open', ...))` | Emit on open | source/src/features/dropdowns/bus.js:13 |

### Window global listeners

| # | Event | Behavior | Source file:line |
|---|-------|----------|------------------|
| 15 | `window.addEventListener('error', ...)` (Electron only) | Telemetry capture if opted in | source/src/lib/telemetry.js:110-113 |
| 16 | `window.addEventListener('unhandledrejection', ...)` (Electron only) | Telemetry capture if opted in | source/src/lib/telemetry.js:114-117 |
| 17 | `window.addEventListener('storage', h)` | Cross-tab activation refresh tick (`useActivation`) | source/src/onboarding/activation.js:137-142 |

### Worker message channels (plugin sandbox)

| # | Where | Event | Behavior | Source file:line |
|---|-------|-------|----------|------------------|
| 18 | PluginBridge worker | `addEventListener('message', ...)` | RPC + command results + log | source/src/plugins/PluginBridge.js:74 |
| 19 | PluginBridge worker | `addEventListener('error', ...)` | console.error worker error | source/src/plugins/PluginBridge.js:75 |
| 20 | PluginBridge bootstrap listener | `addEventListener('message', onReady)` | Bootstrap handshake | source/src/plugins/PluginBridge.js:87 |
| 21 | pluginWorker (inside Worker) | `self.addEventListener('message', ...)` | Receive bootstrap/rpc-result/event:fire | source/src/plugins/pluginWorker.js:118 |

---

## 5.8 Resize / viewport / matchMedia

| # | Where | API | Behavior | Source file:line |
|---|-------|-----|----------|------------------|
| 1 | `useSystemDark` hook | `window.matchMedia('(prefers-color-scheme: dark)')` + `addEventListener('change')` | Track dark mode preference | source/src/lib/hooks.js:13, 20-29 |
| 2 | `usePrefersReducedMotion` (Constellation) | `window.matchMedia('(prefers-reduced-motion: reduce)')` + `addEventListener('change')` | Disable bob animation | source/src/features/constellation/ConstellationView.jsx:1365-1387 |
| 3 | Select dropdown (open) | `window.addEventListener('resize', onViewportChange)` | Recompute portal menu rect | source/src/features/dropdowns/Select.jsx:33, 37 |

No `ResizeObserver` usage in `source/src/`. No other `window.addEventListener('resize', ...)` sites.

---

Total: 142 event bindings across 8 subcategories.

Breakdown:
- 5.1 keyboard shortcuts (global): 23
- 5.2 local keydown handlers: 42
- 5.3 drag and drop: 2
- 5.4 scroll listeners: 1
- 5.5 focus / blur: 11
- 5.6 mouse / pointer (non-click): 48
- 5.7 custom events / event bus: 21
- 5.8 resize / viewport: 3

Orphan-suspect flags (forward to Category 7):
- Ribbon tooltips reference `Cmd/Ctrl+G`, `Cmd/Ctrl+Shift+D`, `?` shortcuts that are not bound anywhere — tooltip text without keyboard handlers.
- `appBus.emit` is never called in `source/src/` — entire plugin events API (`vault-change`, `note-open`, `note-save`, `note-create`, `note-delete`, `app-ready`, `app-quit`) has no producers in the JotFolio host. Plugins can subscribe, but nothing fires.
- `plugin:<id>:<event>` and `jotfolio:<event>` window CustomEvents are emitted by PluginHost/PluginBridge/PluginAPI but no `window.addEventListener('plugin:...', ...)` or `window.addEventListener('jotfolio:...', ...)` exists in app code — emitters without in-app listeners.
