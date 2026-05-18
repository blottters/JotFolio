# JotFolio Phase 1 Audit — Category 2: Interactive Elements per Component

Branch `phase2/5174-transformation` @ 18af965. One row per interactive element.

## File: source/src/App.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 1 | 1686 | input | onChange→onChange(e.target.value) | Folder path input (FolderCreateDialog) |
| 2 | 1678 | form | onSubmit→onSubmit() | Folder create form submit |
| 3 | 1677 | div(modal-backdrop) | onMouseDown→onClose if currentTarget | Click backdrop to close folder dialog |
| 4 | 1690 | button | onClose | Cancel folder create |
| 5 | 1692 | button(submit) | (form submit) | Create folder button |

(NOTE: most of App.jsx's interactive elements are inside callbacks/effects passed as props to Sidebar, WorkspaceTopBar, AppRouteContent, AddModal, etc. The only literal JSX interactives in App.jsx itself are inside `FolderCreateDialog`. App.jsx also wires document-level keydown listeners — `Cmd/Ctrl+K`, `Cmd/Ctrl+P`, `Cmd/Ctrl+O` (line 555-587) which open Search / Command Palette / Quick Switcher; these are not DOM interactive elements but global event listeners.)

## File: source/src/features/add/AddModal.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 6 | 409 | div(role=dialog) | onClick→tryClose if currentTarget | Click backdrop to close modal |
| 7 | 428 | div | onDrop→onDrop | Drop file/URL onto modal body |
| 8 | 429 | div | onDragOver→preventDefault | Allow drop |
| 9 | 430 | div | onKeyDown→onFormKeyDown | Cmd/Ctrl+Enter to save |
| 10 | 461 | button | onClick→tryClose | Close capture modal (×) |
| 11 | 497 | button (radio) | onClick→chooseType(item.id) | Select entry type (radio group, repeats per CAPTURE_TYPES) |
| 12 | 533 | input | onChange→setField('title') | Title field |
| 13 | 548 | input | onChange→setField('url') | Source URL field |
| 14 | 554 | button | onClick→openSourceUrl | Open source URL in new tab |
| 15 | 580 | button | onClick→handleSuggestTags | Suggest tags (semantic) |
| 16 | 602 | button | onClick→applySuggestedTag(tag) | Apply individual suggested tag (repeats) |
| 17 | 639 | button | onClick→removeTag(tag) | Remove tag chip (repeats) |
| 18 | 662 | input | onChange→setTagDraft, onKeyDown→add tag, onBlur→addTag | Tag input + datalist |
| 19 | 689 | button | onClick→addTag(suggestion) | Pick first unused suggested tag (⌄) |
| 20 | 710 | select | onChange→setTemplate | Template dropdown |
| 21 | 721 | button | onClick→applyTemplate | Apply selected template (icon) |
| 22 | 736 | input | (readOnly) | Vault bucket display |
| 23 | 747 | input | (readOnly) | Local path preview |
| 24 | 753 | button | onClick→copyLocalPath | Copy local path |
| 25 | 778 | button | onClick→setContentTab(tab) | Content tab switch (repeats per CONTENT_TABS) |
| 26 | 803 | textarea | onChange→setField('notes') | Notes / body textarea |
| 27 | 839 | button | onClick→setDupWarning(null) | Dismiss duplicate warning |
| 28 | 840 | button | onClick→saveEntry(dupWarning,true) | Save anyway (dup conflict) |
| 29 | 860 | button | onClick→setConfirmDiscard(false) | Keep editing (discard prompt) |
| 30 | 861 | button | onClick→onClose | Discard changes |
| 31 | 877 | button | onClick→tryClose | Cancel button (footer) |
| 32 | 881 | button | onClick→applyTemplate | Apply Template footer button |
| 33 | 884 | button | onClick→saveEntry('project') | Save to Project (footer) |
| 34 | 894 | button | onClick→saveEntry('inbox') | Primary save button |

## File: source/src/features/sidebar/Sidebar.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 35 | 18 | NavItem(Pressable) | onClick→setSection('command') | Command Center nav |
| 36 | 19 | NavItem(Pressable) | onClick→setSection('raw') | Inbox nav |
| 37 | 20 | NavItem(Pressable) | onClick→setSection('search') | Search nav |
| 38 | 21 | NavItem(Pressable) | onClick→setSection('projects') | Projects nav |
| 39 | 22 | NavItem(Pressable) | onClick→setSection('note') | Notes nav |
| 40 | 23 | NavItem(Pressable) | onClick→setSection('calendar') | Calendar nav |
| 41 | 24 | NavItem(Pressable) | onClick→setSection('graph') | Constellation nav |
| 42 | 25 | NavItem(Pressable) | onClick→setSection('tasks') | Tasks nav |
| 43 | 26 | NavItem(Pressable) | onClick→setSection('spaces') | Spaces nav |
| 44 | 27 | NavItem(Pressable) | onClick→setSection('ai') | AI Setup nav |
| 45 | 33 | Pressable | onPress→toggle filterTag/setSection('all') | Tag filter chip (repeats per tag) |
| 46 | 41 | NavItem(Pressable) | onClick→setTagManageOpen(true) | Manage Tags button |
| 47 | 46 | NavItem(Pressable) | onClick→onOpenSettings or setSection('settings') | Settings nav |
| 48 | 47 | NavItem(Pressable) | onClick→setSection('trash') | Trash nav |

## File: source/src/features/workstation/WorkspaceTopBar.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 49 | 93 | button | onClick→onBack | Back navigation (‹) |
| 50 | 94 | button | onClick→onForward | Forward navigation (›) |
| 51 | 99 | input | onFocus→onSearchActivate, onChange, onKeyDown | Top-bar search input |
| 52 | 134 | button | onClick→onCapture | Capture button (⊕) |
| 53 | 54/137 | UtilityIcon(button) | onClick→onQuickSwitcher | Quick Actions (⚡) |
| 54 | 54/138 | UtilityIcon(button) | onClick→onNotifications | Notifications (bell) |
| 55 | 144 | button | onClick→onSettings | User profile / open settings |

## File: source/src/features/shell/AppRouteContent.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 56 | 86 | button | onClick→onOpenAIKeys | Open AI Keys (AIAssistantView) |
| 57 | 92 | button | onClick→onSearch | Search vault instead (AIAssistantView) |
| 58 | 370 | button | onClick→setSelectedIds(all filtered) | Select view (bulk-select bar) |
| 59 | 371 | button | onClick→bulkTrashSelected | Move selected to trash |
| 60 | 372 | button | onClick→clearSelection | Clear selection |

## File: source/src/features/shell/AppConfirmDialog.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 61 | 7 | div(role=dialog) | onMouseDown→onCancel if currentTarget | Backdrop click cancels |
| 62 | 13 | form | onSubmit→onConfirm | Form submission confirms |
| 63 | 27 | button | onClick→onCancel | Cancel confirm action |
| 64 | 33 | button(submit) | (form submit) | Confirm action button |

## File: source/src/features/shell/EntryFileDialog.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 65 | 16 | div(role=dialog) | onMouseDown→onClose if currentTarget | Backdrop click closes |
| 66 | 22 | form | onSubmit→onSubmit(value) | Submit move/rename |
| 67 | 32 | input | onChange→onChange(value) | Folder path or file name input |
| 68 | 40 | button | onClick→onClose | Cancel move/rename |
| 69 | 46 | button(submit) | (form submit) | Move/Rename button |

## File: source/src/features/commandPalette/CommandPalette.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 70 | 120 | div(role=dialog) | onKeyDown→containTabFocus, onMouseDown→onClose if currentTarget | Backdrop / tab trap |
| 71 | 134 | input | onChange→setQuery+resetIdx, onKeyDown→handleKey (Esc/↑↓/Enter) | Command search input |
| 72 | 166 | div(role=option) | onMouseEnter→setActiveIdx, onMouseDown→exec(cmd) | Command row (repeats per filtered command) |

## File: source/src/features/quickSwitcher/QuickSwitcher.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 73 | 68 | div(role=option) | onMouseEnter→onHover, onMouseDown→onActivate | Create-new-note row (CreateRow) |
| 74 | 196 | div(role=dialog) | onKeyDown→containTabFocus, onMouseDown→onClose if currentTarget | Backdrop / tab trap |
| 75 | 216 | input | onChange→setQuery+resetIdx, onKeyDown→handleKey | Entry search input |
| 76 | 264 | div(role=option) | onMouseEnter→setActiveIdx, onMouseDown→activate(entry) | Note result row (repeats per ranked entry) |

## File: source/src/features/tags/TagManageDialog.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 77 | 105 | div(role=dialog) | onClick→onClose if currentTarget | Backdrop close |
| 78 | 152 | button | onClick→onClose | Close (×) header |
| 79 | 206 | input | onChange→setRenameDraft | Rename tag input (repeats per tag) |
| 80 | 213 | button | onClick→applyRename | Apply rename (repeats per tag) |
| 81 | 235 | select | onChange→setMergeDraft | Merge target tag select (repeats per tag) |
| 82 | 248 | button | onClick→applyMerge | Apply merge (repeats per tag) |
| 83 | 274 | button | onClick→applyDelete+clearPending | Confirm delete tag (when pending) |
| 84 | 288 | button | onClick→setPendingDelete('') | Cancel delete |
| 85 | 293 | button | onClick→setPendingDelete(name) | Delete tag (open confirm) |
| 86 | 318 | button | onClick→onClose | Done (footer) |

## File: source/src/features/detail/DetailPanel.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 87 | 57 | button | onClick→load | Check snapshots (RecoverySnapshotsSection) |
| 88 | 71 | button | onClick→confirmRestore | Confirm restore snapshot |
| 89 | 73 | button | onClick→setPendingRestore(null) | Cancel restore snapshot |
| 90 | 84 | button | onClick→setPendingRestore(item) | Restore individual snapshot (repeats per item) |
| 91 | 205 | button | onClick→onDelete+closeConfirm | Yes (delete confirm) |
| 92 | 206 | button | onClick→setConfirmDelete(false) | Cancel delete confirm |
| 93 | 212 | button | onClick→requestDiscard('prev') | Previous entry (‹) |
| 94 | 214 | button | onClick→requestDiscard('next') | Next entry (›) |
| 95 | 217 | button | onClick→onCompile | Compile raw to memory |
| 96 | 221 | button | onClick→setConfirmDelete(true) | Open delete confirm |
| 97 | 223 | button | onClick→toggle editing | Edit/Cancel edit |
| 98 | 227 | IconButton | onClick→requestDiscard('close') | Close panel (×) |
| 99 | 238 | button | onClick→confirmDiscardAction | Discard unsaved edits |
| 100 | 239 | button | onClick→setConfirmDiscard(null) | Keep editing |
| 101 | 242 | input | onChange→update('title') | Edit title |
| 102 | 246 | input | onChange→update('url') | Edit URL |
| 103 | 250 | Select | onChange→update('status') | Status select (custom Select primitive) |
| 104 | 251 | input(date) | onChange→update('entry_date') | Edit date |
| 105 | 254 | input | onChange→update('tags') | Edit tags string |
| 106 | 255 | TagSuggestions | onChange→setForm tags | Tag suggestions component |
| 107 | 260 | button | onClick→handleVoice | Voice input start/stop |
| 108 | 266 | textarea | onChange→update('notes') | Edit notes textarea |
| 109 | 269 | button | onClick→save | Save edit |
| 110 | 271 | button | onClick→onDelete | Confirm delete (inline) |
| 111 | 273 | button | onClick→setConfirmingDelete(true) | Open delete confirm (icon) |
| 112 | 281 | a(href) | (native) | Open entry URL externally |
| 113 | 282 | button | onClick→copyUrl | Copy URL |
| 114 | 298 | button | onClick→onRevealFile(entry) | Reveal in Explorer |
| 115 | 299 | button | onClick→onRenameFile(entry) | Rename file |
| 116 | 300 | button | onClick→onMoveFile(entry) | Move folder |
| 117 | 308 | button | onClick→togglePicker | Open link-picker |
| 118 | 314 | button | onClick→onOpenEntry(r.id) | Open linked entry (repeats) |
| 119 | 315 | button | onClick→onUnlink(r.id) | Unlink (repeats) |
| 120 | 321 | input | onChange→setPickerQuery | Link picker search |
| 121 | 327 | button | onClick→onLink+clearQuery | Link entry result (repeats) |
| 122 | 344 | button | onClick→onOpenEntry(r.id) | Open backlink (repeats) |
| 123 | 363 | button | onClick→onCreateFromMissing(target) | Create from unresolved [[link]] (repeats) |
| 124 | 377 | button | onClick→onOpenEntry(r.id) | Open semantic similar (repeats) |
| 125 | 392 | button | onClick→onOpenEntry(r.id) | Open related by tags (repeats) |

## File: source/src/features/editor/NoteBody.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 126 | 213 | div(role=button) | onClick→setEditing(true), onKeyDown→Enter/Space | Empty notes placeholder click-to-edit |
| 127 | 223 | div(role=button) | onClick→onBodyClick, onKeyDown→Enter/Space | Rendered markdown body click-to-edit (also intercepts wiki link clicks) |
| 128 | 239 | button(tab) | onClick→setMode(nextMode), onMouseDown→preventDefault | Edit/Preview tab (repeats) |
| 129 | 247 | button | onClick→applyCommand(id), onMouseDown→preventDefault | Markdown toolbar command (repeats per TOOLBAR_COMMANDS) |
| 130 | 263 | textarea | onChange, onBlur, onKeyUp, onKeyDown, onClick | Markdown editor textarea |
| 131 | 290 | button(role=option) | onMouseDown→pickSuggestion, onMouseEnter→setSuggest index | Wiki-link suggestion (repeats) |
| 132 | 314 | button | onMouseDown→commit+exit | Done (commit & exit editor) |

## File: source/src/features/trash/TrashView.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 133 | 30 | button | onClick→onRefresh | Refresh trash list |
| 134 | 34 | button | onClick→onEmptyTrash | Empty Trash (header) |
| 135 | 67 | button | onClick→onRestore(item.path) | Restore item (repeats per item) |
| 136 | 71 | button | onClick→onPermanentDelete(item.path) | Delete forever (repeats per item) |

## File: source/src/features/templates/TemplatesPanel.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 137 | 117 | input | onChange→setDraftName, onKeyDown→Enter submits/Esc cancels | New template name input |
| 138 | 130 | button | onClick→submitDraft | Create new template |
| 139 | 131 | button | onClick→cancel+clear draft | Cancel new template |
| 140 | 134 | button | onClick→setCreating(true) | + New template (header) |
| 141 | 147 | input | onChange→setQuery | Search templates input |
| 142 | 164 | button(option) | onClick→selectTemplate(t.id) | Select template (repeats per filtered template) |
| 143 | 212 | button | onClick→setDraftBody(selected.body) | Reset draft to saved body |
| 144 | 213 | button | onClick→saveSelected | Save template |
| 145 | 216 | button | onClick→onApplyToActive | Apply to active entry |
| 146 | 226 | textarea | onChange→setDraftBody | Template body editor |
| 147 | 265 | button | onClick→onOpenEntry(entry.id) | Open incoming backlink entry (repeats) |
| 148 | 289 | button | onClick→onOpenEntry(entry.id) | Open outgoing link entry (repeats) |

## File: source/src/features/templates/InsertTemplateModal.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 149 | 68 | div(role=dialog) | onMouseDown→onClose if currentTarget | Backdrop close |
| 150 | 96 | input | onChange→setQuery+resetIdx, onKeyDown→Esc/↑↓/Enter | Template search input |
| 151 | 122 | div(role=option) | onMouseEnter→setActiveIdx, onMouseDown→pick(tpl) | Template result row (repeats per filtered) |

## File: source/src/features/bases/BaseExplorer.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 152 | 25 | input | onChange→setDraftName, onKeyDown→Enter creates / Esc cancels | New base name input |
| 153 | 42 | button | onClick→createBase + close | Create base |
| 154 | 56 | button | onClick→setCreating(true) | + New Base CTA |

## File: source/src/features/bases/BaseView.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 155 | 57 | button | onClick→onBaseChange activeViewId (ViewSwitcher) | Switch base view (repeats per view) |
| 156 | 91 | select | onChange→update key (FilterEditor) | Filter property select (repeats) |
| 157 | 96 | select | onChange→update op | Filter operator select (repeats) |
| 158 | 100 | input | onChange→update value | Filter value input (repeats) |
| 159 | 108 | button | onClick→remove(i) | Remove filter (×, repeats) |
| 160 | 111 | button | onClick→add filter | + Filter |
| 161 | 135 | select | onChange→update sort key | Sort property select (repeats) |
| 162 | 140 | button | onClick→toggle dir | Sort direction (repeats) |
| 163 | 148 | button | onClick→remove sort | Remove sort (×, repeats) |
| 164 | 151 | button | onClick→add sort | + Sort |
| 165 | 183 | button | onClick→sortByCol(c), onKeyDown→Enter/Space | Table header sort toggle (BaseTable, repeats) |
| 166 | 223 | button | onClick→onOpenEntry(e.id) | Open entry from table cell (BaseTable, repeats) |
| 167 | 236 | button | onClick→onDeleteEntry(e.id) | Delete entry × (BaseTable, repeats) |
| 168 | 266 | button | onClick→onOpenEntry(e.id) | Open entry from card (BaseCards, repeats) |
| 169 | 284 | button | onClick→onDeleteEntry(e.id) | Delete entry × (BaseCards, repeats) |
| 170 | 310 | button | onClick→onOpenEntry(e.id) | Open entry from list row (BaseList, repeats) |
| 171 | 320 | button | onClick→onDeleteEntry(e.id) | Delete entry × (BaseList, repeats) |
| 172 | 364 | details/summary | (native toggle) | Expand Configure panel |
| 173 | 397 | button | onClick→toggle(k) (ColumnEditor) | Toggle column visibility (repeats per property key) |

## File: source/src/features/canvas/CanvasExplorer.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 174 | 49 | input | onChange→setDraftName, onKeyDown→Enter creates / Esc cancels | New canvas name input |
| 175 | 67 | button | onClick→onCreate + close | Create canvas |
| 176 | 82 | button | onClick→setCreating(true) | + New Canvas CTA |
| 177 | 101 | button | onClick→onSelect(c.id) | Open canvas (repeats per existing canvas) |

## File: source/src/features/canvas/CanvasView.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 178 | 370 | button | onClick→onClose | ‹ Back |
| 179 | 375 | button | onClick→handleAddText | + Text card |
| 180 | 376 | button | onClick→toggleFilePicker | + Note card (toggle picker) |
| 181 | 377 | button | onClick→toggleMediaPicker | + Media card (toggle picker) |
| 182 | 378 | button | onClick→toggleConnectMode | Connect / Pick source/target |
| 183 | 396 | button | onClick→confirmRemoveNode | Remove Card (confirm) |
| 184 | 399 | button | onClick→setRemoveConfirmNode(null) | Cancel remove |
| 185 | 408 | input | onChange→setPickerQuery | File picker search input |
| 186 | 420 | button | onClick→handleAddFile(e.id) | Add entry as file card (repeats per filtered entry) |
| 187 | 436 | input | onChange→setMediaPath, onKeyDown→Enter adds | Media path input |
| 188 | 444 | button | onClick→handleAddMedia | Add media card |
| 189 | 453 | input | onChange→setEdgeLabelDraft, onKeyDown→Enter saves/Esc cancels | Edge label input |
| 190 | 471 | button | onClick→saveEdgeLabel | Save edge label |
| 191 | 474 | button | onClick→clearEdgeLabel | Clear edge label |
| 192 | 477 | button | onClick→cancelEdgeLabelEdit | Cancel edge label edit |
| 193 | 484 | details/summary | (native toggle) | Expand keyboard-accessible cards list |
| 194 | 495 | button | onClick→handleNodeClick(node) | Open file node (a11y list, repeats per node) |
| 195 | 498 | button | onClick→setEditingNodeId(node.id) | Edit text node (a11y list, repeats) |
| 196 | 500 | button | onClick→moveNodeByKeyboard(-10,0) | Move Left (a11y list, repeats) |
| 197 | 501 | button | onClick→moveNodeByKeyboard(10,0) | Move Right (a11y list, repeats) |
| 198 | 502 | button | onClick→moveNodeByKeyboard(0,-10) | Move Up (a11y list, repeats) |
| 199 | 503 | button | onClick→moveNodeByKeyboard(0,10) | Move Down (a11y list, repeats) |
| 200 | 504 | button | onClick→handleRemoveNode(node) | Remove (a11y list, repeats) |
| 201 | 513 | div(canvas surface) | onPointerDown→onPointerDownSurface | Canvas surface pan/zoom interactive area |
| 202 | 554 | svg line | onClick→beginEdgeLabelEdit(edge) | Click edge to edit label (repeats per edge) |
| 203 | 634 | div(role=button CanvasNode) | onPointerDown, onClick, onDoubleClick, onKeyDown, onContextMenu, onMouseEnter/Leave | Canvas node drag/click/F2/Delete (repeats per node) |
| 204 | 690 | button | onClick→onRemove | Remove card × inside node (repeats per node) |
| 205 | 727 | textarea | onChange→setDraftText, onBlur→commit, onKeyDown→Esc cancel / Cmd+Enter save | Text card inline editor (NodeBody) |

## File: source/src/features/constellation/ConstellationView.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 206 | 632 | button | onClick→onBack | ← Back (locked state) |
| 207 | 646 | button | onClick→onBack | ← Back (main) |
| 208 | 663 | button | onClick→popFocal | Back one focal layer (←) |
| 209 | 671 | button | onClick→setFocalStack slice | Focal breadcrumb crumb (repeats per stack) |
| 210 | 678 | button | onClick→onOpen(focalNode.id) | Open focal node entry |
| 211 | 688 | button | onClick→setLayoutMode(k) | Layout mode select (Spread/Groups/Similarity, repeats) |
| 212 | 696 | InfoButton(button) | onClick→setInfoOpen('layout') | Layout info toggle |
| 213 | 699 | button | onClick→setShowUnresolved | Missing links toggle |
| 214 | 704 | InfoButton(button) | onClick→setInfoOpen('ghosts') | Ghosts info toggle |
| 215 | 706 | button | onClick→setScanOpen | Graph Health toggle |
| 216 | 709 | button | onClick→resetAll | Reset map |
| 217 | 710 | input | onChange→setTitleQuery | Search node titles input |
| 218 | 714 | Select | onChange→setTagFilter | Filter by tag (custom Select) |
| 219 | 718 | Select | onChange→setFilter | Filter by entry type (custom Select) |
| 220 | 721 | button | onClick→toggle memoryOnly | Memory only toggle |
| 221 | 755 | details/summary | (native toggle) | Expand keyboard accessible node list |
| 222 | 765 | button | onClick→activateGraphNode(n) | Focus/Create node from a11y list (repeats per node) |
| 223 | 770 | button | onClick→openGraphNode(n) | Open node from a11y list (repeats) |
| 224 | 790 | svg | onPointerDown, onPointerMove, onPointerUp, onPointerCancel | SVG canvas pan / drag |
| 225 | 880 | g(role=button) | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown, onFocus, onBlur, onMouseEnter, onMouseLeave | Graph node interactive group (repeats per node) |
| 226 | 1025 | button | onClick→setLegendOpen(false) | Hide legend (×) |
| 227 | 1056 | button | onClick→setLegendOpen(true) | Show legend (ⓘ) |
| 228 | 1156 | button | onClick→onSetDecision('accepted') | Accept relationship (Graph Health, repeats) |
| 229 | 1157 | button | onClick→onSetDecision('rejected') | Reject relationship (Graph Health, repeats) |
| 230 | 1158 | button | onClick→onSetDecision('ignored') | Ignore relationship (Graph Health, repeats) |
| 231 | 1159 | button | onClick→onClearDecision | Clear decision (Graph Health, conditional, repeats) |
| 232 | 1168 | button | onClick→onOpen(item.id) | Open isolated entry (repeats) |
| 233 | 1181 | button | onClick→onCreateFromMissing(target) | Create missing wikilink target (repeats) |
| 234 | 1194 | button | onClick→onOpen(item.entryId) | Open metadata-gap entry (repeats) |
| 235 | 1255 | button | onClick→onToggle | InfoButton (i) — used multiple times above |

## File: source/src/features/constellation/MemoryDetailPanel.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 236 | 217 | button | onClick→onClose | Close memory detail (×) |
| 237 | 281 | button | onClick→onConfirm(entry.id) | Confirm memory |
| 238 | 289 | button | onClick→onSplit(entry.id) | Split into smaller memories |
| 239 | 297 | button | onClick→onTraceToSources | Trace claims to sources |

## File: source/src/features/constellation/MemoryNode.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 240 | 85 | div(role=button) | onClick→handleSelect, onKeyDown→Enter/Space, onFocus, onBlur | Memory node card select |

## File: source/src/features/constellation/SplitMemoryModal.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 241 | 106 | div(role=dialog) | onClick→onBackdrop | Backdrop close |
| 242 | 112 | button | onClick→onClose | Close (×) |
| 243 | 128 | button(role=radio) | onClick→setCount(n) | Pick split count 2/3/4 (repeats) |
| 244 | 137 | input(number) | onChange→setCount custom | Custom count input |
| 245 | 168 | input | onChange→setSplitTitle | Split title input (repeats per part) |
| 246 | 188 | input(checkbox) | onChange→toggleSource(idx,src.id) | Assign source to split (repeats) |
| 247 | 217 | button | onClick→onClose | Cancel |
| 248 | 219 | button | onClick→back | Back (step 2) |
| 249 | 222 | button | onClick→advance | Continue (step 1) |
| 250 | 224 | button | onClick→submit | Apply split (step 2) |

## File: source/src/features/constellation/CompilePreviewModal.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 251 | 130 | div(role=dialog) | onClick→onBackdrop | Backdrop close |
| 252 | 138 | button | onClick→onClose | Close (×) |
| 253 | 208 | button | onClick→onClose | Cancel footer |
| 254 | 209 | button | onClick→handleAccept | Save as wiki/review entry |

## File: source/src/features/constellation/ConstellationStateOverlay.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 255 | 111 | button | onClick→onAdd | + Add another (locked state) |
| 256 | 141 | button | onClick→onReset | Reset filters (no-matches state) |

## File: source/src/features/constellation/nodeRenderers.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 257 | 65 | svg g | onMouseEnter→onHover, onMouseLeave, onClick | StarNode interactive group (repeats per node) |
| 258 | 164 | svg g | onMouseEnter, onMouseLeave, onClick | BoardNode interactive group (repeats per node) |
| 259 | 280 | svg g | onMouseEnter, onMouseLeave, onClick | EditorialNode interactive group (repeats per node) |

## File: source/src/features/workstation/WorkstationViews.jsx
This file is 4746 lines and contains all workstation views: CommandCenterView, GlobalSearchView, InboxView, ProjectsView, TasksView, CalendarView, SpacesView, TagManagerView, WorkspaceContextRail, VaultStatusBar, plus many shared primitives (SmallButton, SectionHeader, TextActionButton, PanelShell, CalendarToolbarButton, ChipFilter, etc.).

| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 260 | 91 | button | onClick→onClick (SmallButton primitive) | Reusable small button (used many places below) |
| 261 | 113 | button | onClick→onClick (TextActionButton primitive) | Reusable text action button (used many places) |
| 262 | 148 | button | onClick→onChange?.(option.value) (ChipFilter) | Filter chip — repeats per option |
| 263 | 236 | button | onClick→onOpenEntry(entry.id) | Recent entry row (Command Center) |
| 264 | 259 | button | onClick→onOpenEntry(entry.id) | Pinned entry row (Command Center) |
| 265 | 689 | button | onClick→shiftDate(-1) | Previous day ‹ (Command Center header) |
| 266 | 691 | button | onClick→shiftDate(1) | Next day › |
| 267 | 696 | select | onChange→handleFocusModeChange | Focus mode select |
| 268 | 731 | button | onClick→action.onClick / onNavigate / onAdd | Command Center quick-action tile (repeats per action) |
| 269 | 809 | TextActionButton | onClick→onNavigate('starred') | View all pinned |
| 270 | 841 | button | onClick→onOpenEntry(focusEntry.id) | Open today's focus entry |
| 271 | 990 | TextActionButton | onClick→onNavigate('calendar') | View calendar (Plan Your Work) |
| 272 | 1000 | TextActionButton | onClick→onNavigate('calendar') | View all upcoming deadlines |
| 273 | 1012 | TextActionButton | onClick→onNavigate('calendar') | View calendar (Time Blocks) |
| 274 | 1015 | button | onClick→focus day | Time block day card (repeats per day) |
| 275 | 1120 | textarea | onChange→updateDraft, onKeyDown→shortcut | Capture draft textarea (Command Center) |
| 276 | 1141 | button | onClick→appendToDraft(value) | Capture insert symbol (repeats) |
| 277 | 1143 | button | onClick→captureNow | Capture Now (primary) |
| 278 | 1149 | CaptureFilterChip(button) | onClick→onStateChange | Capture filter chip (repeats) |
| 279 | 1150 | TextActionButton | onClick→onNavigate('raw') | View all captures |
| 280 | 1160 | TextActionButton | onClick→onNavigate('raw') | View all captures (secondary) |
| 281 | 1172 | button | onClick→onNavigate('raw') | Open Capture Inbox primary |
| 282 | 1239 | TextActionButton | onClick→toggle editingReflection | Edit Reflection / Done Editing |
| 283 | 1241 | ReflectionCard | onAction→addReflection, onChange→updateReflectionItem | Reflection card x3 (lines 1241-1243) — each contains textarea inputs and add button (covered as composite) |
| 284 | 1248 | TextActionButton | onClick→onNavigate('projects') | Goals & Commitments View all |
| 285 | 1252 | button | onClick→addGoal | + New Goal |
| 286 | 1255 | TextActionButton | onClick→onNavigate('note') | Notes to Review View all |
| 287 | 1267 | TextActionButton | onClick→onNavigate('projects') | Projects Health View all |
| 288 | 1298 | button(role=tab) | onClick→onSelect(item) | Generic tab (PrimaryTabs) repeats |
| 289 | 1324 | button | onClick→onToggle | Section toggle (ProjectRailList header) |
| 290 | 1342 | button | onClick→onItemClick(item) | Section row (rail list, repeats) |
| 291 | 1357 | button | onClick→onOpen | Generic open row (repeats) |
| 292 | 1395 | button | onClick→onAction | ReflectionCard action button |
| 293 | 1403 | button | onClick→onOpen | Plan/Goal list row (repeats) |
| 294 | 1418 | button | onClick→onOpen | Capture item open (repeats) |
| 295 | 1422 | button | onClick→onRoute | Capture route button (repeats) |
| 296 | 1429 | button | onClick→onSelect | Focus mode card (repeats) |
| 297 | 1441 | button | onClick→onClick (PillButton) | Pill toggle button (repeats) |
| 298 | 1453 | button | onClick→onOpen | Project rail row open (repeats) |
| 299 | 1467 | button | onClick→onApply | Template/applicator row (repeats) |
| 300 | 1486 | input | onChange→onChange(index,value) | Reflection item input (repeats per item) |
| 301 | 1496 | button | onClick→onAction | Reflection card add button |
| 302 | 1511 | button | onClick→onOpen | Project card open (repeats) |
| 303 | 1527 | button | onClick→onOpen | Generic open list-row (small) repeats |
| 304 | 1539 | button | onClick→onOpen | Generic open list-row (medium) repeats |
| 305 | 1587 | button | onClick→onOpenEntry(entry.id) | Reading-list entry row (repeats) |
| 306 | 1840 | button | onClick→onViewAll(tabId) | View all (search tab footer, repeats) |
| 307 | 1856 | button | onClick→onSelect(row) | Search result row (repeats) |
| 308 | 1922 | button | onClick→onClearSelection | Close selected search result (×) |
| 309 | 1937 | button | onClick→onNavigate(`tag:${tag}`) | Selected result tag pill (repeats) |
| 310 | 1946 | button | onClick→onOpenEntry(item.id) | Selected result related entry (repeats) |
| 311 | 1970 | SearchActionButton | onClick→openSearchRow | Primary open action (search rail) |
| 312 | 1971 | SearchActionButton | onClick→onRevealEntry / copyText | Reveal in vault / Copy path |
| 313 | 1972 | SearchActionButton | onClick→copyText | Copy local path |
| 314 | 1973 | SearchActionButton | onClick→share/copy | Search action (multiple) |
| 315 | 1979 | SearchActionButton | onClick→toggle moreOpen | More ⌄ |
| 316 | 1982 | button | onClick→copyText title | Copy title (More menu) |
| 317 | 1983 | button | onClick→copyText id | Copy result id (More menu) |
| 318 | 1984 | button | onClick→onNavigate('raw') | Open Inbox (More menu, entry only) |
| 319 | 2025 | button | onClick→onClick (SearchActionButton primitive) | Used many places above |
| 320 | 2134 | button | onClick→onQuickSwitcher | Quick Switcher header button |
| 321 | 2135 | button | onClick→onCommandPalette | Command Palette header button |
| 322 | 2140 | input | onChange→setQuery, onKeyDown→shortcut | Global search input |
| 323 | 2167 | button | onClick→setQuery('') | Clear search × |
| 324 | 2175 | button | onClick→setActiveTab(id) | Search tab (repeats per tab) |
| 325 | 2435 | SmallButton | onClick→onAdd('raw') | New Capture (Inbox header) |
| 326 | 2443 | button(role=tab) | onClick→setTab(item.id) | Inbox tab (repeats) |
| 327 | 2468 | button | onClick→toggle showFilters | Filter toggle |
| 328 | 2471 | select | onChange→setSortMode | Sort mode select |
| 329 | 2478 | button | onClick→toggle showBulk | Bulk actions toggle |
| 330 | 2488 | input | onChange→setTagFilter | Tag filter input |
| 331 | 2495 | button | onClick→setTagFilter('') | Clear tag filter |
| 332 | 2500 | button | onClick→updateMany processed | Mark processed (bulk) |
| 333 | 2501 | button | onClick→updateMany starred | Flag selected (bulk) |
| 334 | 2502 | button | onClick→onBulkTrash | Move to Trash (bulk) |
| 335 | 2503 | button | onClick→clearSelection | Clear selection (bulk) |
| 336 | 2511 | input(checkbox) | onChange→selectVisible | Select all visible |
| 337 | 2523 | SmallButton | onClick→onAdd('raw') | New Capture (empty state) |
| 338 | 2571 | input(checkbox) | onChange→onSelected | Select inbox row (repeats) |
| 339 | 2572 | button | onClick→onOpen | Open capture row body (repeats) |
| 340 | 2602 | button | onClick→onFlag | Flag/Unflag (per capture row) |
| 341 | 2603 | button | onClick→onTag | Tags (per capture row) |
| 342 | 2604 | button | onClick→onAttachProject | Attach Project (per capture row) |
| 343 | 2605 | button | onClick→onMakeNote | Make Note (per capture row) |
| 344 | 2606 | button | onClick→onMakeTask | Make Task (per capture row) |
| 345 | 2607 | button | onClick→onMakeLink | Make Link (per capture row) |
| 346 | 2608 | button | onClick→onCompile | Compile Memory (per capture row) |
| 347 | 2609 | button | onClick→onArchive | Archive (per capture row) |
| 348 | 2610 | button | onClick→onTrash | Trash (per capture row) |
| 349 | 2615 | input | onChange→onTagDraft | Tags input (per capture row when editing) |
| 350 | 2616 | button | onClick→onSaveTags | Save tags (per row) |
| 351 | 2617 | button | onClick→onCancelTags | Cancel tags (per row) |
| 352 | 2659 | button | onClick→onClose | Close project picker |
| 353 | 2669 | button | onClick→onPick(project) | Pick project (repeats per project) |
| 354 | 2691 | button | onClick→onClose | Cancel project picker |
| 355 | 2692 | button | onClick→onCreateProject | Create Project (when none) |
| 356 | 2919 | div(role=button) | onClick→onSelect, onKeyDown→Enter/Space | Project grid card (repeats) |
| 357 | 2936 | button | onClick→stopPropagation+onToggleStar | Toggle star (project grid) |
| 358 | 2959 | button | onClick→onOpenEntry | Open project entry (grid) |
| 359 | 2974 | div(role=button) | onClick→onSelect, onKeyDown | Project list row (repeats) |
| 360 | 2991 | button | onClick→onToggleStar | Toggle star (list row) |
| 361 | 3034 | button | onClick→onSelect(row.entry.id) | Project table row title (repeats) |
| 362 | 3048 | button | onClick→onToggleStar | Star toggle (table row) |
| 363 | 3049 | button | onClick→onOpenEntry | More (...) project entry (table row) |
| 364 | 3093 | button | onClick→onOpen | Show project details |
| 365 | 3129 | button | onClick→onClose | Close project details (x) |
| 366 | 3133 | button(role=tab) | onClick→onTab(label) | Project detail tab (repeats) |
| 367 | 3148 | input | onChange→setTagDraft, onKeyDown→Enter | Project tag input |
| 368 | 3166 | button | onClick→setAddingTag(true) | + Add tag (project) |
| 369 | 3173 | TextActionButton | onClick→onTab('Entries') | View all project entries |
| 370 | 3176 | button | onClick→onNavigate(`canvas:${item.id}`) | Open project canvas (repeats) |
| 371 | 3180 | button | onClick→onOpenEntry(item.id) | Open project entry (repeats) |
| 372 | 3191 | TextActionButton | onClick→onCreateSmartView | View all smart views |
| 373 | 3193 | button | onClick→onCreateSmartView | Smart view row (repeats) |
| 374 | 3201 | button | onClick→onAdd note in project | New Entry (project) |
| 375 | 3202 | button | onClick→newCanvas | New Canvas (project) |
| 376 | 3203 | button | onClick→onCreateSmartView | Open Smart View (project) |
| 377 | 3204 | button | onClick→onNavigate('graph') | View in Constellation (project) |
| 378 | 3206 | button | onClick→toggle menuOpen | More (project menu) |
| 379 | 3209 | button(role=menuitem) | onClick→copyText(row.path) | Copy project path |
| 380 | 3210 | button(role=menuitem) | onClick→copyText(title) | Copy project title |
| 381 | 3211 | button(role=menuitem) | onClick→onRevealEntry | Reveal in Vault (project) |
| 382 | 3215 | button | onClick→onOpenEntry | Open Entry (project) |
| 383 | 3278 | button | onClick→onAdd('project') | New Project (ProjectsView header) |
| 384 | 3288 | button(role=tab) | onClick→setTab(value) | Projects tab (repeats: All/Starred/Recent) |
| 385 | 3294 | button | onClick→toggle showFilters | Filter (Projects toolbar) |
| 386 | 3297 | select | onChange→setSort | Sort projects |
| 387 | 3306 | button | onClick→setLayout('grid') | Grid view ▦ |
| 388 | 3307 | button | onClick→setLayout('list') | List view ☰ |
| 389 | 3316 | select | onChange→setStatusFilter | Status filter |
| 390 | 3323 | input | onChange→setTagFilter | Tag filter (projects) |
| 391 | 3331 | button | onClick→clear filters | Clear filters |
| 392 | 3339 | SmallButton | onClick→onAdd('project') | New Project (empty state) |
| 393 | 3391 | SmallButton | onClick→onAdd('task') | New Task (Tasks header) |
| 394 | 3396 | ChipFilter | onChange→setFilter | Task status filter |
| 395 | 3411 | SmallButton | onClick→onAdd('task') | New Task (empty state) |
| 396 | 3437 | div(role=button) | onClick→onOpenEntry, onKeyDown | Task row open (repeats) |
| 397 | 3449 | button(role=checkbox) | onClick→toggle completed | Task complete checkbox (repeats) |
| 398 | 3598 | button | onClick→onClick (CalendarToolbarButton) | Calendar toolbar button reusable |
| 399 | 3698 | CalendarToolbarButton | onClick→setCalendarViewMode('month') | Month view |
| 400 | 3699 | CalendarToolbarButton | onClick→setCalendarViewMode('week') | Week view |
| 401 | 3700 | CalendarToolbarButton | onClick→setCalendarViewMode('day') | Day view |
| 402 | 3701 | button | onClick→shift(-1) | Calendar prev ‹ |
| 403 | 3703 | button | onClick→shift(1) | Calendar next › |
| 404 | 3704 | CalendarToolbarButton | onClick→jumpToday | Today |
| 405 | 3705 | CalendarToolbarButton | onClick→toggle showFilters | Filters |
| 406 | 3706 | CalendarToolbarButton | onClick→toggle journalOnly | Journal Entries |
| 407 | 3707 | button | onClick→setDisplayMode('grid') | Calendar grid view ▦ |
| 408 | 3708 | button | onClick→setDisplayMode('list') | Calendar list view ☰ |
| 409 | 3721 | input(checkbox) | onChange→toggleFilter(key) | Calendar filter checkbox (repeats per entry type) |
| 410 | 3745 | button | onClick→setDay(key) | Calendar day cell click (repeats per day) |
| 411 | 3786 | button | onClick→setDay(day.date) | Day label click (repeats) |
| 412 | 3802 | TextActionButton | onClick→onNavigate('note') | Open in Notes (day rail) |
| 413 | 3805 | button | onClick→onOpenEntry(entry.id) | Day rail entry row (repeats) |
| 414 | 3838 | div(role=button) | onClick→day select, onKeyDown | Calendar grid cell interactive (repeats) |
| 415 | 3882 | button | onClick→onOpen | Show day details |
| 416 | 3890 | button | onClick→onClose | Close day details (×) |
| 417 | 3894 | button | onClick→onOpenEntry(primaryEntry.id) | Open primary entry (day details) |
| 418 | 3926 | button | onClick→onNavigate('tags') | Manage tags (day) |
| 419 | 3933 | button | onClick→clipboard.writeText | Copy local path (day) |
| 420 | 3939 | button | onClick→onAdd('journal') | New Journal Entry (day) |
| 421 | 3940 | button | onClick→onNavigate('search') | Link Entry (day) |
| 422 | 3941 | button | onClick→onOpenEntry/onNavigate | Review Memory (day) |
| 423 | 3942 | button | onClick→onNavigate('graph') | Open in Constellation (day) |
| 424 | 3960 | button | onClick→onOpenEntry(entry.id) | Day-list entry row (repeats) |
| 425 | 4081 | SmallButton | onClick→toggle newSpaceOpen | New Space |
| 426 | 4082 | SmallButton | onClick→onNavigate('tags') | Manage Tags (Spaces) |
| 427 | 4083 | SmallButton | onClick→setStatusFilter('archived') | View Archive (Spaces) |
| 428 | 4092 | ChipFilter | onChange→setStatusFilter | Space status filter |
| 429 | 4094 | input | onChange→setQuery, onKeyDown→shortcut | Space search input |
| 430 | 4104 | select | onChange→setSortMode | Space sort select |
| 431 | 4115 | input | onChange→setNewSpaceName, onKeyDown→Enter | New space name |
| 432 | 4116 | SmallButton | onClick→createSpaceSeed | Create project seed |
| 433 | 4124 | SmallButton | onClick→setNewSpaceOpen(true) | Create first space (empty state) |
| 434 | 4135 | button | onClick→setSelectedId(space.id) | Space list row (repeats per space) |
| 435 | 4155 | button | onClick→cycleSelectedColor | Change space color swatch |
| 436 | 4171 | TextActionButton | onClick→onSelectSpace | Open filtered list |
| 437 | 4182 | input(checkbox) | onChange→onUpdateEntry complete | Task complete checkbox (Spaces, repeats) |
| 438 | 4197 | button | onClick→onNavigate('graph') | Unresolved target jump (repeats) |
| 439 | 4201 | button | onClick→onNavigate(`tag:${tag}`) | Space tag chip (repeats) |
| 440 | 4207 | button | onClick→onAdd note in space | Create note in space |
| 441 | 4208 | button | onClick→onAdd raw in space | Capture to space |
| 442 | 4209 | button | onClick→onNavigate('graph') | Open in Constellation (space) |
| 443 | 4283 | button | onClick→onOpenEntry(entry.id) | Space entry row (repeats) |
| 444 | 4357 | input | onChange→setQuery, onKeyDown→shortcut | TagManagerView search input |
| 445 | 4375 | button | onClick→onSelectTag(tag.name) | Tag row in TagManagerView (repeats) |
| 446 | 4554 | TextActionButton | onClick→onNavigate(rail.primaryAction) | Context rail View all (primary) |
| 447 | 4570 | (interactive) | onClick→onOpenEntry | Context rail primary entry row (repeats) |
| 448 | 4574 | button | onClick→onNavigate('raw') | Open Inbox (context rail) |
| 449 | 4597 | TextActionButton | onClick→onNavigate('raw' or 'note') | Context rail View all (secondary) |
| 450 | 4606 | (interactive) | onClick→onOpenEntry | Context rail secondary entry (repeats) |
| 451 | 4615 | TextActionButton | onClick→onNavigate('raw') | View all recent captures |
| 452 | 4621 | (interactive) | onClick→onOpenEntry | Context rail recent capture row (repeats) |
| 453 | 4674 | button(role=checkbox) | onClick→onToggle | Reusable ChecklistRow checkbox (used elsewhere) |
| 454 | 4682 | button | onClick→onOpen | ChecklistRow open body |
| 455 | 4714 | button | onClick→onClick | Reusable inboxToolbarButton primitive |
| 456 | 4733 | button | onClick→onClick | Reusable inboxActionButton primitive |

## File: source/src/features/notes/NotesWorkspaceView.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 457 | 319 | button | onClick→onAdd note | New Entry (empty state) |
| 458 | 330 | input | onChange→setTagDraft, onKeyDown→Enter / Esc | Add tag input (rail) |
| 459 | 347 | button | onClick→setAddingTag(true) | + Add tag |
| 460 | 356 | button | onClick→setLocalId+onOpenEntry | Backlink row (repeats per backlink) |
| 461 | 373 | button | onClick→onCreateFromMissing | Create unresolved link (repeats) |
| 462 | 386 | input | onBlur→onUpdateEntry status, onKeyDown→Enter/Esc | Status input |
| 463 | 406 | select | onChange→onUpdateEntry project | Project select |
| 464 | 419 | input(date) | onChange→onUpdateEntry entry_date | Entry date |
| 465 | 440 | button | onClick→copyText path | Copy local path (⧉) |
| 466 | 449 | button | onClick→onOpenInConstellation | Open in Constellation |
| 467 | 450 | button | onClick→onRevealEntry | Reveal in Vault |
| 468 | 451 | button | onClick→toggle moreOpen | More (actions menu) |
| 469 | 455 | button(role=menuitem) | onClick→copyText title | Copy title (action menu) |
| 470 | 456 | button(role=menuitem) | onClick→copyText path | Copy local path (action menu) |
| 471 | 467 | button(role=tab) | (no handler — active tab display only) | Active note tab (ORPHAN — close × inside is also ORPHAN) |
| 472 | 472 | button | onClick→onAdd note | + New note tab |
| 473 | 476 | button | onClick→setEditorMode('edit') | Edit mode tab |
| 474 | 477 | button | onClick→setEditorMode('preview') | Preview mode tab |
| 475 | 478 | button | onClick→setActiveRailTab('backlinks') | Backlinks pseudo-mode tab |
| 476 | 479 | button | onClick→onAdd note | New Entry (mode group) |
| 477 | 482 | button | onClick→toggle editorMenuOpen | More editor actions (⋮) |
| 478 | 485 | button(role=menuitem) | onClick→copyText title | Copy title (editor menu) |
| 479 | 486 | button(role=menuitem) | onClick→copyText path | Copy local path (editor menu) |
| 480 | 487 | button(role=menuitem) | onClick→setEditorMenuOpen(false)+onRevealEntry | Reveal in Vault (editor menu) |
| 481 | 496 | button | onClick→applyToolbar(label), onMouseDown→preventDefault | Markdown toolbar (repeats per toolbarButton) |
| 482 | 507 | button | onClick→focusEditor | Focus editor ↙ |
| 483 | 508 | button | onClick→toggle fullscreen | Fullscreen editor ⛶ |
| 484 | 528 | textarea | onChange→updateDraft | Markdown editor textarea |
| 485 | 568 | button(role=tab) | onClick→setActiveRailTab(id) | Rail tab (repeats per tab) |

## File: source/src/features/properties/PropertiesPanel.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 486 | 83 | input | onChange→setDraft, onBlur→commit, onKeyDown→Enter commit / Esc cancel | Edit property value (PropertyRow) |
| 487 | 96 | button | onClick→startEdit | Click value to edit (per property) |
| 488 | 105 | button | onClick→onDelete | Delete property × |
| 489 | 138 | button | onClick→setAdding(true) | + Add property (collapsed) |
| 490 | 150 | input | onChange→setKeyDraft, onKeyDown→Esc cancel | New property key input |
| 491 | 159 | input | onChange→setValDraft, onKeyDown→Enter submit / Esc cancel | New property value input |
| 492 | 169 | button | onClick→submit | Add property |
| 493 | 170 | button | onClick→setAdding(false) | Cancel add property |

## File: source/src/features/ribbon/Ribbon.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 494 | 28 | button | onClick→onClick (RibbonButton) | Reusable ribbon button (per slot below) |
| 495 | 74 | RibbonButton | onClick→onQuickSwitcher | Quick Switcher |
| 496 | 75 | RibbonButton | onClick→onNewCanvas | New Canvas |
| 497 | 76 | RibbonButton | onClick→onDailyNote | Daily Note |
| 498 | 77 | RibbonButton | onClick→onGraphView | Constellation |
| 499 | 78 | RibbonButton | onClick→onTemplates | Template Library |
| 500 | 79 | RibbonButton | onClick→onPalette | Command Palette |
| 501 | 82 | RibbonButton | onClick→onSettings | Settings |
| 502 | 83 | RibbonButton | onClick→onTrash | Trash |

## File: source/src/features/toolbar/Toolbar.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 503 | 17 | input | onChange→setQuery | Search entries input |
| 504 | 20 | Select | onChange→setFilterStatus | Status filter (custom Select) |
| 505 | 24 | Select | onChange→setSort | Sort entries (custom Select) |
| 506 | 28 | button | onClick→onClear | Clear filters ✕ |
| 507 | 35 | button | onClick→setView(v) | Grid/List view (repeats per view) |

## File: source/src/features/primitives/Pressable.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 508 | 2 | div(role=button) | onClick→onPress, onKeyDown→Enter/Space | Reusable Pressable primitive |

## File: source/src/features/primitives/IconButton.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 509 | 2 | button | onClick→onClick | Reusable IconButton primitive |

## File: source/src/features/primitives/TagSuggestions.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 510 | 12 | button | onClick→add(t) | Add tag chip (repeats per available tag) |

## File: source/src/features/primitives/Toasts.jsx
(no interactive elements — display-only with role=status)

## File: source/src/features/card/Card.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 511 | 14 | article | onMouseEnter, onMouseLeave | Card hover state |
| 512 | 17 | input(checkbox) | onChange→onSelectChange, onClick→stopPropagation | Select card |
| 513 | 23 | button | onClick→onStar | Star toggle |
| 514 | 28 | button | onClick→onOpen | Open entry body |
| 515 | 43 | button | onClick→onDelete, onMouseDown→stopPropagation | Delete × |

## File: source/src/features/card/Row.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 516 | 10 | article | onMouseEnter, onMouseLeave | Row hover state |
| 517 | 12 | input(checkbox) | onChange→onSelectChange, onClick→stopPropagation | Select row |
| 518 | 15 | button | onClick→onOpen | Open entry body |
| 519 | 26 | button | onClick→onStar | Star toggle |
| 520 | 29 | button | onClick→onDelete, onMouseDown→stopPropagation | Delete × |

## File: source/src/features/dropdowns/Select.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 521 | 53 | button | onClick→toggle open, onKeyDown→nav/Enter/Esc | Select trigger button |
| 522 | 62 | button(role=option) | onClick→pick(v), onMouseEnter→setHighlight | Option row (repeats per option) |

## File: source/src/features/dropdowns/ThemeDropdown.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 523 | 75 | button | onClick→toggle open, onKeyDown→arrow/Enter/Esc | Theme trigger |
| 524 | 85 | button(role=option) | onClick→pick(k), onMouseEnter→setHighlight | Theme option (repeats per theme) |

## File: source/src/features/dropdowns/FontDropdown.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 525 | 14 | button | onClick→toggle open | Font trigger |
| 526 | 21 | button(role=option) | onClick→onChange('') | Theme default font option |
| 527 | 26 | button(role=option) | onClick→onChange(stack) | Font option (repeats per FONT) |

## File: source/src/features/dropdowns/HexInput.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 528 | 12 | input | onChange→setDraft, onBlur→commit, onKeyDown→Enter/Esc | Hex color text input |

## File: source/src/features/settings/PluginsPanel.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 529 | 95 | button | onClick→toggle(rec) | Enable/Disable plugin toggle (repeats per plugin) |
| 530 | 110 | button | onClick→applyToggle(rec) | Confirm enable (permissions review) |
| 531 | 113 | button | onClick→setPendingEnable(null) | Cancel enable |
| 532 | 123 | button | onClick→uninstall(rec.id) | Remove plugin files (confirm) |
| 533 | 126 | button | onClick→setPendingUninstall(null) | Cancel uninstall |
| 534 | 132 | button | onClick→setPendingUninstall(rec.id) | Open uninstall confirm |
| 535 | 154 | button | onClick→install(p.id) | Install official plugin (repeats per available) |

## File: source/src/features/settings/PrivacyPanel.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 536 | 52 | button | onClick→toggle | Crash report opt-in toggle |

## File: source/src/features/settings/UpdatesPanel.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 537 | 101 | button | onClick→checkNow | Check now |
| 538 | 120 | button | onClick→restartNow | Restart now (when update ready) |

## File: source/src/features/settings/KeywordRulesPanel.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 539 | 160 | input | onChange→setTag | Rule tag input (RuleForm) |
| 540 | 169 | input | onChange→setTriggersText | Triggers CSV input |
| 541 | 178 | input | onChange→setLinksText | Links CSV input |
| 542 | 189 | button | onClick→onCancel | Cancel rule form |
| 543 | 190 | button | onClick→handleSave | Save rule form |
| 544 | 209 | IconButton | onClick→onEdit | Edit rule (per RuleRow) |
| 545 | 210 | IconButton | onClick→onDelete | Delete rule × (per RuleRow) |
| 546 | 238 | button | onClick→onAdd | + Add your first rule (EmptyState) |
| 547 | 360 | button | onClick→startAdd | + Add automation rule (after list) |
| 548 | 373 | button | onClick→confirmRescan | Confirm re-scan vault (armed state) |
| 549 | 380 | button | onClick→cancelRescan | Cancel re-scan |
| 550 | 385 | button | onClick→armRescan | Re-scan vault (idle state) |

## File: source/src/features/vault/VaultPicker.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 551 | 50 | button | onClick→doPick | Change vault (inline) |
| 552 | 61 | button | onClick→doMigrate | Import legacy entries (inline) |
| 553 | 74 | button | onClick→doPick | Pick vault folder (inline, no vault) |
| 554 | 98 | button | onClick→doPick | Pick vault folder (modal first-run) |

## File: source/src/features/updater/UpdateBanner.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 555 | 73 | button | onClick→setDismissed(true) | Dismiss × (UpdateBanner) |
| 556 | 81 | button | onClick→setDismissed(true) | Later |
| 557 | 87 | button | onClick→handleRestart | Restart now |

## File: source/src/features/plugins/PluginPanelSlot.jsx
(no native interactives — renders plugin-provided panels via panel.render. Interactive elements are owned by each plugin's render output, not this slot file.)

## File: source/src/features/emptystate/EmptyState.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 558 | 18 | button | onClick→onClear | Clear filters (no-matches state) |
| 559 | 36 | button | onClick→onAdd(t) | Add entry of type (repeats per visible entry type) |
| 560 | 43 | button | onClick→onAdd | + New Entry / Add `<type>` (primary CTA) |

## File: source/src/features/workstation/NotesRail.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 561 | 145 | button | onClick→onClick (RailButton primitive) | Reusable rail-row button |
| 562 | 238 | button(role=tab) | onClick→setActiveTab(id) | Rail tab (repeats per tab) |
| 563 | 253 | button | onClick→copyText(_path) | Copy path |
| 564 | 254 | button | onClick→onRevealEntry | Reveal in Vault |
| 565 | 262 | RailButton | onClick→onOpenEntry(item.id) | Backlink row (repeats) |
| 566 | 278 | button | onClick→onCreateFromMissing | Create missing target (repeats) |
| 567 | 289 | button | onClick→onNavigate(`tag:${tag}`) | Tag chip (repeats) |
| 568 | 294 | input | onChange→setTagDraft, onKeyDown→Enter add | New tag input |
| 569 | 307 | button | onClick→addTag | Add tag |

## File: source/src/onboarding/WelcomePanel.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 570 | 72 | div(role=dialog) | onKeyDown→containTabFocus | Welcome dialog focus trap |
| 571 | 91 | button | onClick→setActiveSource(src) | Import source picker (repeats per SOURCES) |
| 572 | 108 | button | onClick→skip | Skip — show empty library |
| 573 | 127 | button | onClick→onClick (QuickAction) | Quick action button (used 3x at lines 102-104: Create first entry, Pick theme, Open Constellation) |

## File: source/src/onboarding/ImportModal.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 574 | 47 | div(role=dialog) | onClick→onClose if currentTarget | Backdrop close |
| 575 | 58 | input(file) | onChange→onFiles | File / directory picker |
| 576 | 77 | button | onClick→onClose | Cancel (preview stage) |
| 577 | 78 | button | onClick→commit | Import (preview stage) |
| 578 | 89 | button | onClick→onClose | Close (error stage) |
| 579 | 90 | button | onClick→reset+pick | Try again (error stage) |

## File: source/src/onboarding/nudges.jsx
| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 580 | 20 | button | onClick→onAdd | + Add another (FirstSaveBanner) |
| 581 | 21 | button | onClick→dismissNudge+setDismissed | Dismiss × (FirstSaveBanner) |
| 582 | 36 | button | onClick→onAdd | + Add another (Day2ReturnCard) |
| 583 | 37 | button | onClick→dismissNudge+setDismissed | Not now (Day2ReturnCard) |
| 584 | 63 | button | onClick→onAdd | + Add another (GraphLockOverlay) |

## File: source/src/features/settings/SettingsPanel.jsx
Hosts InlineConfirm, MiniStatus, TrashReview, VaultPanel, SystemStatusPanel, AIPanel sub-components plus the main SettingsPanel.

| # | Line | Type | Handler | Purpose |
|---|------|------|---------|---------|
| 585 | 50 | button | onClick→onConfirm | InlineConfirm primary action (per use) |
| 586 | 54 | button | onClick→onCancel | InlineConfirm cancel |
| 587 | 123 | button | onClick→load (TrashReview) | Review trash |
| 588 | 144 | button | onClick→requestEmptyTrash | Empty trash (TrashReview) |
| 589 | 153 | button | onClick→requestRestore(item.path) | Restore item (per item, TrashReview) |
| 590 | 155 | button | onClick→requestPermanentDelete(item.path) | Delete forever (per item, TrashReview) |
| 591 | 214 | button | onClick→handleExport (VaultPanel) | Export vault as zip |
| 592 | 234 | button | onClick→refresh (VaultPanel) | Rescan vault issues |
| 593 | 311 | button | onClick→update enabled (AIPanel) | Allow AI provider calls toggle |
| 594 | 318 | Select | onChange→update provider (AIPanel) | AI provider picker |
| 595 | 322 | input | onChange→update customUrl | Custom endpoint URL input |
| 596 | 326 | Select | onChange→update model | AI model select |
| 597 | 329 | input | onChange→update model (custom) | Custom model name input |
| 598 | 333 | button | onClick→startOpenRouterLogin | Log in with OpenRouter |
| 599 | 340 | input | onChange→update key | API key input (password) |
| 600 | 343 | button | onClick→setShow(s=>!s) | Show/hide API key |
| 601 | 349 | button | onClick→runTest | Test connection |
| 602 | 409 | IconButton | onClick→onClose | Close settings × |
| 603 | 413 | button | onClick→setTab(key) | Settings tab (repeats per tabs array) |
| 604 | 428 | button | onClick→setTheme(k) | Theme card (basic, repeats per theme) |
| 605 | 437 | button | onClick→setDarkMode(mode) | Mode card (basic & advanced, repeats per mode) |
| 606 | 447 | input(range) | onChange→setPrefs fontSize | UI scale slider (basic) |
| 607 | 454 | ThemeDropdown | onChange→setTheme | Theme picker (advanced) |
| 608 | 460 | input(color) | onChange→setColor(key) | Color picker (advanced, repeats per color key) |
| 609 | 462 | HexInput | onCommit→setColor(key) | Hex input (advanced, repeats) |
| 610 | 467 | button | onClick→resetColors | Reset to default colors |
| 611 | 474 | button | onClick→setDarkMode(mode) | Mode card (advanced, repeats) |
| 612 | 481 | FontDropdown | onChange→setPrefs fontFamily | Font picker (advanced) |
| 613 | 486 | input(range) | onChange→setPrefs fontSize | UI scale slider (advanced) |
| 614 | 493 | button | onClick→setPrefs cardDensity | Card density (repeats: compact/comfortable/spacious) |
| 615 | 499 | button | onClick→setPrefs sidebarWidth | Sidebar width (repeats) |
| 616 | 505 | button | onClick→setPrefs constellationStyle | Constellation style (repeats) |
| 617 | 511 | button | onClick→setPrefs typeSaturation | Type color theme (repeats) |
| 618 | 517 | button | onClick→setPrefs constellationBg | Constellation bg (repeats) |
| 619 | 522 | button | onClick→toggleAdvanced | Show/Hide advanced |
| 620 | 531 | button | onClick→setPrefs defaultView | Default view (Library tab, repeats: grid/list) |
| 621 | 540 | button | onClick→setPrefs defaultSort | Default sort (Library tab, repeats) |
| 622 | 547 | button | onClick→setPrefs[key] | Card display toggle (Library tab, repeats per option) |
| 623 | 567 | button | onClick→setTab('vault') | Open Vault & Recovery (data tab callout) |
| 624 | 575 | button | onClick→onExportJSON | Export JSON (data tab) |
| 625 | 576 | button | onClick→onExportMD | Export Markdown (data tab) |
| 626 | 579 | input(file) | onChange→onImportJSON | Import JSON file picker (hidden, triggered by button below) |
| 627 | 581 | button | onClick→fileRef.click | ↑ Import JSON |
| 628 | 589 | button | onClick→remove onboarded flag + reload | ↺ Reopen welcome |
| 629 | 592 | button | onClick→onLoadConstellationDemo | Load sample constellation data |

---

## Notes on coverage

- **Skipped**: `source/src/features/primitives/SrOnly.jsx` (pure primitive per audit spec), all `*.test.jsx` files.
- **No-interactive files** (read but found nothing): `features/primitives/Toasts.jsx` (role=status only), `features/plugins/PluginPanelSlot.jsx` (delegates rendering to plugin-supplied panels; the slot file itself has no native interactives).
- **WorkstationViews.jsx scale**: this 4746-line file contains many repeating row/card/tab patterns. Each handler-prop on a primitive (SmallButton, TextActionButton, SearchActionButton, CalendarToolbarButton, RibbonButton, PanelShell action, ChipFilter option) is counted once. When the same primitive is used many times in the same call site (`{rows.map(...)}`), the row is marked "repeats per ...". Concrete uses of those primitives in the rest of the file are listed by line and consume one row each.
- **App.jsx**: most interactives live inside child components (Sidebar, WorkspaceTopBar, AppRouteContent, etc.); App.jsx itself only renders `FolderCreateDialog` JSX (rows 1-5) plus document-level keyboard listeners (Cmd/Ctrl+K/P/O at line 555-587) — those listeners are not DOM elements so they appear only as a note above the App.jsx table.
- **Repeats**: rows labelled "(repeats per X)" represent N runtime elements (one per data item). The numbered row in this audit is the JSX site, not the per-instance count.
- **Suspected orphans (ORPHAN)**: 1 — `NotesWorkspaceView.jsx:467` (active note tab `<button>` without `onClick`, with a nested visual close × that also has no handler — flagged as dead UI / display-only tab affordance).

Total: 629 interactive elements (JSX call sites) across 51 component files (54 read; 3 had no native interactives). Suspected orphans: 1.
