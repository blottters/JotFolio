# Category 6 — Cross-Page User Flows (Playwright Targets)

Source: `C:\Dev\Projects\JotFolio\source\src` on phase2/5174-transformation @ 18af965. Read-only research.

JotFolio is a section-based SPA. "Cross-page" = a journey that crosses ≥2 sections, or one section + modal(s) + another section. Section state lives in `App.jsx` (`section` state + `handleSection`). Sections derived from `appShellState.js` + `Sidebar.jsx`: `command`, `raw`, `search`, `projects`, `note`, `calendar`, `graph`, `tasks`, `spaces`, `ai`, `tags`, `all`, `starred`, `settings`, `templates`, `trash`, `welcome`, plus prefixed `folder:*`, `base:*`, `canvas:*`, `space:*`.

Status legend:
- **ready** — every step has implementing code today, all required IDs / labels / state transitions reachable from a Playwright spec.
- **partly-implemented** — the happy path exists but one or more assert targets (focus mode, focal stack on memory trace, semantic flags, etc.) need a workaround.
- **not-implemented** — explicitly TODO in source, or absent.

---

## Flow 1: First-run onboarding — Welcome → empty workstation → first capture
**Start:** fresh `localStorage` (no `mgn-onboarded`), no entries in vault.
**Steps:**
1. App mounts → `App.jsx:872` effect detects `loaded && section===HOME_SECTION && !isOnboarded() && visibleEntries.length===0` → `setSection('welcome')`.
2. `WelcomePanel` renders as modal overlay (`onboarding/WelcomePanel.jsx`).
3. User clicks "Create your first entry" (QuickAction) → `onOpenAdd()` → `setOnboarded(true)` → `openAdd()` → `bumpOnboarding()` → section flips back to `command`.
4. `AddModal` opens (lazy). User fills title/notes → "Save" → `addEntry` runs `saveEntryWithRules`, fires toast, closes modal.
5. App now shows the populated Command Center (`HOME_SECTION='command'`) with one entry.
**Success state:** `[role="dialog"][aria-labelledby="welcome-title"]` is gone; Command Center heading visible; entry count = 1; `localStorage.mgn-onboarded === 'true'`.
**Playwright asserts:**
- `await page.getByRole('dialog', { name: /Welcome to JotFolio/i }).isVisible()` initially.
- Click `getByRole('button', { name: /Create your first entry/i })`.
- After save: `await expect(page.getByText('▤ Entry saved')).toBeVisible()` (toast).
- `await expect(page.evaluate(() => localStorage.getItem('mgn-onboarded'))).toBe('"true"')`.
- `await expect(page.getByRole('region', { name: 'Command Center' }))` or the workstation header to render.
**Files involved:** `src/App.jsx`, `src/onboarding/WelcomePanel.jsx`, `src/onboarding/activation.js`, `src/features/add/AddModal.jsx`, `src/features/shell/AppRouteContent.jsx`, `src/features/workstation/WorkstationViews.jsx`.
**Status:** ready

---

## Flow 2: Quick capture → entry visible in Inbox
**Start:** loaded app, no modal open, any section.
**Steps:**
1. User presses `N` (handled in `lib/appHooks.js` → `useAppShortcuts`) — opens `AddModal` via `openAdd()`.
2. `AddModal` (`features/add/AddModal.jsx`) renders. User types title, notes; optionally selects type "raw" or default "note".
3. Submit → `onAdd(entry)` → `App.addEntry` → `saveEntryWithRules` → toast `"▤ Entry saved"` → modal closes.
4. User clicks sidebar **Inbox** → `setSection('raw')` → `AppRouteContent` renders `<InboxView>` with `visibleEntries.filter(type==='raw')`.
**Success state:** new entry visible in Inbox section.
**Playwright asserts:**
- Press `N` → `await expect(page.getByRole('dialog')).toBeVisible()`.
- After fill+save: `await expect(page.getByText('Entry saved')).toBeVisible()`.
- Click sidebar `[aria-label="Inbox"]`/text "Inbox" → assert entry title in scroll list.
- Entry count badge on Inbox sidebar item == 1 (only if type='raw'; otherwise check 'all' section).
**Files involved:** `src/App.jsx`, `src/lib/appHooks.js`, `src/features/add/AddModal.jsx`, `src/features/sidebar/Sidebar.jsx`, `src/features/workstation/WorkstationViews.jsx` (InboxView).
**Status:** ready (note: only entries with `type='raw'` show in Inbox — quick-capture defaults to 'note', so user must switch type or capture into 'all').

---

## Flow 3: Import from Pocket — Welcome → Pocket source → ImportModal → entries appear
**Start:** fresh user or section=`welcome`.
**Steps:**
1. `WelcomePanel` open. Click Pocket button — `WelcomePanel.jsx:91` `onClick={() => { logEvent(...); setActiveSource(src) }}`.
2. `ImportModal` mounts inside the same dialog (`WelcomePanel.jsx:113`).
3. User picks `.csv` file via `<input type="file" accept=".csv">` → `onFiles` reads text → `pocket.parse(text)` → preview stage.
4. Click "Import" → `commit()` → `onComplete(parsed)` → `App.jsx:1622` `onImport={async items=>{await Promise.all(items.map(e=>saveEntryWithRules(e)))}}` → toast, `bumpOnboarding`.
5. App moves to `command` section. Imported entries visible across `all` / `raw` views per their parsed type.
**Success state:** Welcome modal gone, entries persisted, "Imported N entries" toast fired.
**Playwright asserts:**
- `await page.getByRole('button', { name: 'Pocket' }).click()`.
- `await expect(page.getByRole('dialog', { name: /Import from Pocket/i }))`.
- Upload fixture: `await page.setInputFiles('input[type="file"]', 'fixtures/pocket.csv')`.
- Wait for "Import N entries?" preview.
- `await page.getByRole('button', { name: 'Import' }).click()`.
- `await expect(page.getByText(/Imported \d+ entries/)).toBeVisible()`.
- Navigate to Inbox or All Entries → entries visible.
**Files involved:** `src/onboarding/WelcomePanel.jsx`, `src/onboarding/ImportModal.jsx`, `src/parsers/pocket.js`, `src/parsers/index.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 4: Import from Readwise (same shape as Flow 3, different parser)
**Start:** same as Flow 3.
**Steps:** identical to Flow 3 with `src.id === 'readwise'`, `accept='.json'`, parser at `src/parsers/readwise.js`.
**Success state:** identical.
**Playwright asserts:** click Readwise button instead; upload `.json` fixture.
**Files involved:** `src/parsers/readwise.js`, `src/onboarding/ImportModal.jsx`, `src/onboarding/WelcomePanel.jsx`, `src/App.jsx`.
**Status:** ready

---

## Flow 5: Import from Kindle (same shape as Flow 3)
**Start:** same as Flow 3.
**Steps:** identical with `src.id === 'kindle'`, `accept='.txt'`, parser at `src/parsers/kindle.js`.
**Playwright asserts:** click Kindle button; upload `My Clippings.txt` fixture.
**Files involved:** `src/parsers/kindle.js`, `src/onboarding/ImportModal.jsx`, `src/App.jsx`.
**Status:** ready

---

## Flow 6: Import from Obsidian (directory picker, same shape)
**Start:** same as Flow 3.
**Steps:** identical with `src.id === 'obsidian'`, `inputType='directory'` (uses `webkitdirectory`/`directory` attrs in `ImportModal.jsx:60`), parser at `src/parsers/obsidian.js`. ImportModal passes the raw `File[]` to parser (not text).
**Playwright asserts:** Playwright's `setInputFiles` with multiple files; verify preview count.
**Files involved:** `src/parsers/obsidian.js`, `src/onboarding/ImportModal.jsx`, `src/App.jsx`.
**Status:** partly-implemented (Playwright cannot easily set `webkitdirectory` semantics; assert with single `.md` file payload as workaround).

---

## Flow 7: Import existing JotFolio bundle (Welcome path)
**Start:** same as Flow 3.
**Steps:** identical with `src.id === 'jotfolio'`, parser at `src/parsers/jotfolio.js`.
**Playwright asserts:** upload prior JotFolio JSON export; verify entries appear.
**Files involved:** `src/parsers/jotfolio.js`, `src/onboarding/ImportModal.jsx`, `src/App.jsx`. (Note: a separate import-bundle path exists via Settings > Import/Export → see Flow 38).
**Status:** ready

---

## Flow 8: Settings → Appearance → change theme → tokens propagate
**Start:** any populated section.
**Steps:**
1. Click sidebar Settings button (or topbar settings gear) → `openSettingsTab('appearance')` → `handleSection('settings')`.
2. `AppRouteContent` renders `<SettingsPanel embedded={true}>` (`App.jsx:1387`).
3. Click a theme tile (e.g., "Sakura") in the Theme grid (`SettingsPanel.jsx:427`).
4. `setTheme('sakura')` → `App.jsx:590` CSS-vars effect rewrites `document.documentElement.style` for `--ac`, `--bg`, `--tx`, etc.; `App.jsx:598` injects `<style id="mgn-theme-style">`.
5. Navigate back to any section (e.g., All Entries) → all surfaces render with new tokens.
**Success state:** `document.documentElement.style.getPropertyValue('--ac')` changes; visible accent colors swap.
**Playwright asserts:**
- `await page.getByRole('button', { name: 'Settings' }).click()` (sidebar).
- `await page.getByRole('button', { name: 'Sakura' }).click()`.
- `await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ac'))).not.toBe(initialAc)`.
- Visual: screenshot snapshot of sidebar before+after to verify token propagation.
**Files involved:** `src/features/settings/SettingsPanel.jsx`, `src/App.jsx`, `src/lib/theme/themes.js`, `src/lib/theme/resolve.js`, `src/lib/theme/themeCss.js`.
**Status:** ready

---

## Flow 9: Settings → toggle feature flag (`raw_inbox`) → Inbox view changes visibility
**Start:** Settings open.
**Steps:**
1. Settings → "Library" or appropriate flag-toggle UI (note: feature flags currently live in `prefs.featureFlags`; UI surface present in advanced settings but not under an obvious tab — `wiki_mode`, `raw_inbox`, `review_queue` default-on alpha.18).
2. Toggle `raw_inbox` off → `setPrefs(p => ({...p, featureFlags: {...p.featureFlags, raw_inbox: false}}))`.
3. `filterEntriesForUI` (`src/lib/featureFlags.js`) excludes type='raw' entries from `visibleEntries`.
4. Click sidebar Inbox → counts.raw = 0; InboxView shows EmptyState.
**Success state:** Inbox view shows empty state; sidebar count badge gone.
**Playwright asserts:**
- Locate flag toggle (search Settings tabs for `data-testid` or button with name like "raw_inbox").
- Toggle off → navigate to Inbox → assert empty state visible.
**Files involved:** `src/lib/featureFlags.js`, `src/features/settings/SettingsPanel.jsx`, `src/App.jsx`, `src/features/workstation/WorkstationViews.jsx`.
**Status:** partly-implemented (no obvious user-facing toggle in current Settings tabs surface; flags edited programmatically via `prefs.featureFlags` shape only).

---

## Flow 10: Vault path swap — Settings → Vault & Recovery → pick new folder → entries reload
**Start:** Vault picked, entries present.
**Steps:**
1. Settings → click **Vault & Recovery** tab.
2. `VaultPanel` renders → `<VaultPicker mode="inline">` shows "Change vault…".
3. Click → `onPick()` → `useVault.pickVault()` → Electron `vault.pickVault()` dialog (or browser localStorage virtual path).
4. New `vaultInfo` → `useVault` re-lists files → `refreshVault()` → `entries` array repopulates from new folder.
5. Sidebar counts/All entries update.
**Success state:** Vault label in MiniStatus card changes to new path; entry list reflects new folder content.
**Playwright asserts:**
- Stub `window.electron.vault.pickVault` in `addInitScript` to return a fake new path.
- Click "Change vault…" → verify new vault label appears via `await expect(page.getByText('/some/new/path'))`.
- Verify entries list refreshed to match new folder fixture.
**Files involved:** `src/features/vault/VaultPicker.jsx`, `src/features/vault/useVault.js`, `src/features/settings/SettingsPanel.jsx` (VaultPanel), `src/App.jsx`.
**Status:** partly-implemented (full path-swap end-to-end works only in Electron; browser test path must stub the bridge).

---

## Flow 11: Delete entry → goes to Trash → restore → entry returns
**Start:** populated All Entries, at least one entry, vault picked.
**Steps:**
1. Open entry → DetailPanel → click "Delete" → inline confirm in DetailPanel OR top-level `confirmDeleteEntry` → `AppConfirmDialog` shows.
2. Confirm → `deleteEntry(id)` → `deleteVaultEntry` (which calls `moveToTrash` via `useVault.deleteEntry`) → `clearProvenance` → toast "Entry moved to trash" → `loadTrashItems()`.
3. Click sidebar Trash → `setSection('trash')` → `TrashView` renders with the deleted file row.
4. Click Restore on the row → `restoreTrashItem(path)` → confirm dialog → `restoreFromTrash` → `refreshVault` → toast "Restored ...".
5. Click sidebar All Entries → entry visible again with its prior `_path`.
**Success state:** Trash list empty (or shrunk by 1); entry back in All Entries.
**Playwright asserts:**
- Open entry, click Delete, confirm in `AppConfirmDialog` → wait for toast.
- Sidebar Trash count = 1; nav to Trash → row visible with original path.
- Click Restore → confirm → toast → row gone → entry back in All Entries.
**Files involved:** `src/App.jsx` (deleteEntry, restoreTrashItem, emptyTrash), `src/features/detail/DetailPanel.jsx`, `src/features/trash/TrashView.jsx`, `src/features/shell/AppConfirmDialog.jsx`, `src/lib/vaultTrash.js`, `src/features/vault/useVault.js`.
**Status:** ready

---

## Flow 12: Permanent delete from Trash (irreversible, confirm required)
**Start:** Trash section open with at least one item.
**Steps:**
1. Section=`trash` → `TrashView` lists items.
2. Click "Delete forever" on a row → `permanentlyDeleteTrashItem(path)` → `requestConfirm` → `AppConfirmDialog` "Permanently delete file?" / "Delete Forever" / tone=danger.
3. Confirm → `vaultAdapter.remove(path)` → `loadTrashItems()` → toast "File permanently deleted".
**Success state:** Item removed from Trash, count -1, file actually gone from `<vault>/.trash/`.
**Playwright asserts:**
- Get row, click "Delete forever".
- `await page.getByRole('button', { name: 'Delete Forever' }).click()` in confirm dialog.
- Row count -1; toast visible.
**Files involved:** `src/App.jsx`, `src/features/trash/TrashView.jsx`, `src/features/shell/AppConfirmDialog.jsx`, `src/lib/vaultTrash.js`.
**Status:** ready

---

## Flow 13: Empty Trash (bulk irreversible)
**Start:** Trash with ≥1 item.
**Steps:**
1. TrashView header → click "Empty Trash" → `emptyTrash()` (`App.jsx:479`).
2. `requestConfirm` → "Empty Trash?" with N count, "Empty Trash"/tone=danger.
3. Confirm → loop `vaultAdapter.remove` for each item → toast "Trash emptied".
**Success state:** Trash list empty, sidebar trash count = 0.
**Playwright asserts:**
- Click "Empty Trash" → confirm → assert empty state visible (`await expect(page.getByText('Trash is empty'))`).
**Files involved:** `src/App.jsx`, `src/features/trash/TrashView.jsx`, `src/features/shell/AppConfirmDialog.jsx`.
**Status:** ready

---

## Flow 14: Search/open via QuickSwitcher → edit body → autosave
**Start:** populated app, no modal.
**Steps:**
1. Press `Ctrl/Cmd+O` (`App.jsx:579`) → `setQuickSwitcherOpen(true)`.
2. `QuickSwitcher` modal opens — input autofocused (`features/quickSwitcher/QuickSwitcher.jsx`).
3. Type query → `rankNotes` returns ranked list → arrow keys navigate.
4. Press Enter → `onOpenEntry(id)` → `setDetailId(id)` → QuickSwitcher closes.
5. DetailPanel opens. Click "Edit" or directly into NoteBody → user types in `<textarea>`.
6. `NoteBody.jsx` uses `useDebouncedCallback` for save (or DetailPanel's onUpdate path).
7. After debounce, `updateEntry(id, {notes: ...})` → `saveEntryWithRules` → semantic re-embed; vault file is rewritten.
**Success state:** Entry persisted with new notes. Toast may show if `saveEntryWithRules` chains a tag-detection save.
**Playwright asserts:**
- `await page.keyboard.press('Control+o')`.
- `await page.getByPlaceholder(/Find or create entry/i).fill('partial title')`.
- `await page.keyboard.press('Enter')`.
- `await expect(page.getByRole('dialog')).toContainText(/entry title/)`.
- Click Edit → type into notes textarea → wait debounce (≥800ms).
- Reload page; verify notes content persists.
**Files involved:** `src/features/quickSwitcher/QuickSwitcher.jsx`, `src/lib/quickSwitcher/quickSwitcherSearch.js`, `src/features/detail/DetailPanel.jsx`, `src/features/editor/NoteBody.jsx`, `src/lib/hooks.js`, `src/App.jsx` (updateEntry).
**Status:** ready

---

## Flow 15: Create entry → tag it → filter sidebar by tag → entry shows up
**Start:** populated app.
**Steps:**
1. Press `N` → AddModal opens. Fill title + add tag "research" in tag chips field → Save.
2. `addEntry` writes entry with `tags: ['research']`.
3. Sidebar "Tags" section (`Sidebar.jsx:31`) lists all tags from `visibleEntries`; tag pill "research" appears.
4. Click "research" tag in sidebar — `setFilterTag('research')` + `setSection('all')` (`Sidebar.jsx:33`).
5. `filterShellEntries` (`appShellState.js:23`) keeps only entries with that tag.
**Success state:** Filtered All Entries list contains the new entry; tag pill marked active (`aria-pressed=true`).
**Playwright asserts:**
- After save, sidebar should show tag pill `await expect(page.getByRole('button', { name: /Filter by tag research/i }))`.
- Click → assert filter active visually; assert filtered count.
**Files involved:** `src/features/add/AddModal.jsx`, `src/features/sidebar/Sidebar.jsx`, `src/features/shell/appShellState.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 16: Create entry → link via [[Wikilink]] → both visible in Constellation
**Start:** populated app.
**Steps:**
1. Open entry A in DetailPanel; edit notes to add `[[Topic B]]`.
2. `buildVaultIndex` (`lib/index/vaultIndex.js`) detects unresolved target "Topic B".
3. Save. Either:
   - (a) Click the unresolved wikilink in DetailPanel → `onCreateFromMissing('Topic B')` → creates entry B; OR
   - (b) Navigate to Constellation → unresolved targets show as ghosts; click ghost → `onCreateFromMissing` (`ConstellationView.jsx`).
4. `createFromMissing` (`App.jsx:1070`) creates entry, sets `detailId`, fires "Created 'Topic B'" toast.
5. Switch to Constellation (`Ctrl+P` → "Open Constellation" or sidebar Constellation) — both nodes visible, connected.
**Success state:** Two visible nodes in graph, one edge between them.
**Playwright asserts:**
- Add `[[Topic B]]` in DetailPanel notes → save.
- Click ghost node or click wikilink → assert new entry created (`'Topic B'` in entry list).
- Navigate to Constellation, assert SVG contains both node IDs.
**Files involved:** `src/features/detail/DetailPanel.jsx`, `src/features/constellation/ConstellationView.jsx`, `src/lib/index/vaultIndex.js`, `src/App.jsx` (createFromMissing).
**Status:** ready

---

## Flow 17: Capture project → child entry with project context → appears under project rail
**Start:** populated app.
**Steps:**
1. Create a project entry (AddModal with type='project').
2. Navigate Projects → `ProjectsView` (`WorkstationViews.jsx:3222`).
3. Select project → context rail/right panel shows project metadata.
4. Click "New Entry" button on project toolbar (`WorkstationViews.jsx:3201`) → `onAdd({type:'note', folder:'Projects', projectContext: projectContext(row)})`.
5. AddModal opens with project context prefilled (project pill at top of modal).
6. Save → entry created with `project` frontmatter → `buildProjectRows` (`lib/workstation/workstationData.js`) groups it under the project.
7. Project rail shows the new child entry.
**Success state:** Project's children list contains the new entry.
**Playwright asserts:**
- Create project → navigate Projects → click project tile.
- Click "New Entry" → AddModal with project pill visible.
- Save → assert project's child row visible.
**Files involved:** `src/features/workstation/WorkstationViews.jsx` (ProjectsView), `src/features/add/AddModal.jsx`, `src/lib/workstation/workstationData.js`, `src/App.jsx` (openAdd with projectContext).
**Status:** ready

---

## Flow 18: Create canvas → add nodes → drag → save → reopen → state restored
**Start:** populated app.
**Steps:**
1. Navigate to Canvas (sidebar or AddModal type='canvas') → `handleNewCanvas` (`App.jsx:799`) creates `canvas-${ts}` and `setSection(canvas:<id>)`.
2. `CanvasExplorer` → `CanvasView` (`features/canvas/CanvasView.jsx`) renders.
3. Click "Add text card" toolbar → text node added via `addNode`. Drag node → on pointerup `commit(moveNode(...))` → `onCanvasChange(canvas)` → `persistCanvas` writes `<vault>/canvases/<id>.canvas.json`.
4. Navigate away (e.g., Command Center) then back to `canvas:<id>` → `useEffect` re-reads `.canvas.json` files on `entries.length` change; layout restored.
**Success state:** Reloaded canvas has node at moved position.
**Playwright asserts:**
- Create canvas, add node via toolbar.
- Drag (mouse down, move, up) on the node SVG/div.
- Navigate to "all" → back to canvas:id → assert node position matches drag delta.
**Files involved:** `src/features/canvas/CanvasView.jsx`, `src/features/canvas/CanvasExplorer.jsx`, `src/lib/canvas/canvasOps.js`, `src/lib/canvas/canvasTypes.js`, `src/App.jsx` (persistCanvas).
**Status:** ready

---

## Flow 19: Command Palette → run "Toggle theme" → theme flips
**Start:** any section, no modal open.
**Steps:**
1. Press `Ctrl/Cmd+P` (`App.jsx:573`) → `setPaletteOpen(true)`.
2. `CommandPalette` modal renders. Builtin command `core:toggle-theme` listed (`features/commandPalette/builtinCommands.js:104`).
3. Type "theme" → ranked → press Enter on "Toggle theme".
4. `executeCommand('core:toggle-theme')` → `commandRegistry.execute` runs `appCtx.toggleTheme()` → `setDarkMode` cycles dark→light→system→dark → toast.
5. Palette closes.
**Success state:** Dark-mode pref cycles; visual theme flips; toast visible.
**Playwright asserts:**
- `await page.keyboard.press('Control+p')`.
- `await page.getByPlaceholder(/Filter/i).fill('toggle theme')` (placeholder string inside palette; verify in CommandPalette.jsx).
- `await page.keyboard.press('Enter')`.
- `await expect(page.getByText(/Theme: (dark|light|system)/)).toBeVisible()`.
**Files involved:** `src/features/commandPalette/CommandPalette.jsx`, `src/features/commandPalette/builtinCommands.js`, `src/lib/command/commandRegistry.js`, `src/App.jsx` (toggleTheme).
**Status:** ready

---

## Flow 20: Command Palette → "Rebuild metadata cache" / "Search notes" / etc. (no native export command)
**Start:** any section, palette open.
**Steps:**
1. Press `Ctrl+P` → CommandPalette.
2. Search "export" → **no match** in builtinCommands. Closest: `core:rebuild-metadata-cache`, `core:search-notes`, etc.
3. Workaround for "Export vault" — open Settings (palette has no native command for Settings either) → Vault & Recovery → "Export vault as zip" button → `exportVaultAsZip(vaultAdapter)` → blob download.
**Success state:** N/A (command does not exist).
**Playwright asserts:**
- `await page.keyboard.press('Control+p')`.
- Verify no command matches "export vault".
**Files involved:** `src/features/commandPalette/builtinCommands.js`, `src/features/settings/SettingsPanel.jsx` (VaultPanel handleExport), `src/lib/vaultExportZip.js`.
**Status:** not-implemented (the listed "Export vault" command doesn't exist as a palette builtin — must be reached through Settings).

---

## Flow 21: Compile raw entry → preview modal → save compiled output
**Start:** at least one type='raw' entry exists.
**Steps:**
1. Navigate Inbox → click a raw entry → DetailPanel.
2. Click "Compile" button in DetailPanel (`detail/DetailPanel.jsx` has `onCompile` prop → `App.jsx:1584` `onCompile={() => handleCompileRaw(detail.id)}`).
3. `handleCompileRaw` (`App.jsx:1369`) builds vault index, runs `compile(seed, idx, {compiler:'deterministic-stub'})`.
4. `CompilePreviewModal` opens (`features/constellation/CompilePreviewModal.jsx`).
5. User reviews compiled markdown, source citations, warnings.
6. Click "Save as wiki entry" or "Save as review entry" → `handleAcceptCompile` → `saveEntryWithRules(compiledEntry)` → toast.
**Success state:** New `type='wiki'` or `type='review'` entry created; modal closes.
**Playwright asserts:**
- Open a raw entry → click "Compile".
- `await expect(page.getByRole('dialog', { name: /compile/i }))`.
- Click "Save as wiki entry" (or review).
- `await expect(page.getByText(/Saved as (wiki|review) entry/)).toBeVisible()`.
**Files involved:** `src/features/constellation/CompilePreviewModal.jsx`, `src/lib/compile/index.js`, `src/lib/index/vaultIndex.js`, `src/App.jsx` (handleCompileRaw, handleAcceptCompile), `src/features/detail/DetailPanel.jsx`.
**Status:** ready (also reachable via InboxView `onCompileRaw` row action).

---

## Flow 22: Memory split — open MemoryDetailPanel → Split → SplitMemoryModal → children created
**Start:** at least one wiki or review entry.
**Steps:**
1. Click a wiki/review entry in any list → `setDetailId(id)` → `App.jsx:1572` renders `<MemoryDetailPanel>` (not DetailPanel) since `detail.type==='wiki'||'review'`.
2. Click "Split" stacked-button action → `onSplit(entry.id)` → `App.jsx:1327` `handleSplitMemory` → `setSplitMemoryTarget(entry)`.
3. `SplitMemoryModal` opens (`features/constellation/SplitMemoryModal.jsx`). Step 1: pick count (2-10). Step 2: name each, assign source IDs via checkbox.
4. Submit → `onSubmit(splits)` → `handleSplitSubmit` → `splitMemory()` → for each child write a new entry; superseding original gets `superseded_by` ids → all saved.
5. Toast "Split into N memories". MemoryDetailPanel closes (`setSplitMemoryTarget(null)`).
**Success state:** N new child memories visible; original has `superseded_by` set.
**Playwright asserts:**
- Open a wiki entry → click Split.
- Choose count 2 → fill names → check sources → Submit.
- Assert toast and presence of 2 new entries.
**Files involved:** `src/features/constellation/MemoryDetailPanel.jsx`, `src/features/constellation/SplitMemoryModal.jsx`, `src/lib/memory/splitMemory.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 23: Activation toast lifecycle — 3rd entry triggers celebration → dismiss → no reappear
**Start:** exactly 2 entries (or 0; capture 3).
**Steps:**
1. Capture entries via AddModal until `newCount === 3`.
2. `App.jsx:909` `if(newCount===3) setCelebrating(true)`.
3. `<ActivationToast visible={celebrating} onDone={...}>` renders at bottom-center (`nudges.jsx`).
4. After 4s `onDone` fires → `setCelebrating(false)` + `setSection('graph')` (auto-navigate to Constellation).
5. Reload app → no re-show; `mgn-activation.thirdSaveAt` is set, so the gate `newCount===3` never re-fires.
**Success state:** Toast visible exactly once, then auto-dismisses, then app navigates to Constellation.
**Playwright asserts:**
- Capture 3 entries.
- `await expect(page.getByText(/Your graph is live/)).toBeVisible()`.
- Wait 4-5s → assert Constellation section title or canvas visible.
- Reload → assert toast not visible.
**Files involved:** `src/onboarding/nudges.jsx` (ActivationToast), `src/onboarding/activation.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 24: AI provider setup — Settings → AI Keys → pick provider → enter key → test → success
**Start:** Settings open.
**Steps:**
1. Settings → click **AI Keys** tab → `<AIPanel>` (`SettingsPanel.jsx:281`).
2. Toggle "Allow AI provider calls" on.
3. Select provider from `<Select>` (anthropic/openai/openrouter/ollama/custom).
4. Enter API key in `<input type="password">`.
5. Click "Test connection" → `runTest` → `aiComplete({system, user, maxTokens:8})` → checks response.
6. Status badge shows ✓ Connected or ✗ error.
**Success state:** Either `setTest({state:'ok'})` (green) or `'fail'` (red) badge rendered.
**Playwright asserts:**
- Mock `fetch` to provider endpoint → return `"OK"`.
- Click Settings → AI Keys → enable toggle → pick provider → enter fake key.
- Click "Test connection".
- `await expect(page.getByText(/✓ Connected/)).toBeVisible()`.
**Files involved:** `src/features/settings/SettingsPanel.jsx` (AIPanel), `src/lib/ai/providers.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 25: OpenRouter OAuth login → callback → ready
**Start:** Settings → AI Keys, provider=openrouter.
**Steps:**
1. Click "↗ Log in with OpenRouter" → `startOpenRouterLogin()` (`lib/ai/openrouter.js:11`) → generates PKCE pair, stashes verifier in `sessionStorage`, sets `window.location.href = https://openrouter.ai/auth?...`.
2. User authenticates on OpenRouter → redirected back with `?code=`.
3. App mounts → `useOpenRouterCallback(toast)` (`lib/appHooks.js`) detects code in URL → calls `exchangeOpenRouterCode(code)` → POST to `/api/v1/auth/keys` with verifier → returns key.
4. Stash key into AI config → toast → strip code from URL.
**Success state:** AI config has openrouter key; toast confirms.
**Playwright asserts:**
- Stub `window.location` redirect OR intercept the OAuth fetch with route mock returning `{key:'sk-or-test'}` after a manual `?code=fake` URL.
- Reload with `?code=fake` → assert toast and `getAIConfig().key` is set.
**Files involved:** `src/lib/ai/openrouter.js`, `src/lib/appHooks.js` (useOpenRouterCallback), `src/features/settings/SettingsPanel.jsx`, `src/lib/ai/providers.js`.
**Status:** ready (requires network mock + URL manipulation in tests).

---

## Flow 26: Plugin install → enable → panel appears in sidebar → disable → panel disappears
**Start:** Settings open.
**Steps:**
1. Settings → **Extensions** tab → `<PluginsPanel>` (`features/settings/PluginsPanel.jsx`).
2. List of `OFFICIAL_PLUGINS` shown if not installed. Click "Install" on one → `installOfficial(id)` → `pluginHost.discover()` → state refresh.
3. Toggle Enable → may trigger inline permission review for write/network plugins → `applyToggle` → `pluginHost.enable(id)` → plugin's `activate(appContext)` runs → can register commands + panels.
4. If plugin registers a panel → `panelStore.register(panel)` → `<PluginPanelSlot>` (`features/plugins/PluginPanelSlot.jsx`) re-renders with new panel attached to sidebar.
5. Toggle off → `pluginHost.disable` → `deactivate()` → panel unregisters → slot empties.
**Success state:** Panel visible in sidebar when enabled; removed when disabled.
**Playwright asserts:**
- Navigate Settings → Extensions → click Install on a sample plugin.
- Click toggle Enable → assert panel section visible in sidebar (`Sidebar.jsx:pluginPanelsSlot` prop wires `<PluginPanelSlot>`).
- Toggle Disable → assert panel gone.
**Files involved:** `src/features/settings/PluginsPanel.jsx`, `src/plugins/PluginHost.js`, `src/plugins/officialPlugins.js`, `src/features/plugins/PluginPanelSlot.jsx`, `src/App.jsx`.
**Status:** ready (depends on at least one official plugin existing; current builtin is `wordCountPlugin` but only the dynamic `OFFICIAL_PLUGINS` matter for install flow).

---

## Flow 27: Keyword Rules — add rule → save entry matching → tags auto-applied
**Start:** Settings open.
**Steps:**
1. Settings → **Keyword Library** tab → `<KeywordRulesPanel>` (`features/settings/KeywordRulesPanel.jsx`).
2. Click "+ Add rule" → inline RuleForm → fill tag="ai", triggers="machine learning, neural net", links="[[ML Index]]" → Save.
3. `handleKeywordRulesChange` writes `_jotfolio/keyword-rules.yaml`.
4. Capture or edit an entry whose notes/title contains "machine learning" → `saveEntryWithRules` (`lib/keywordRules/useKeywordRules.js:70`) runs `applyRules` → diff merges new tags + links → second save → entry now has `tags: ['ai']` + `links: ['ML Index id']`.
**Success state:** Entry frontmatter has `tags: [ai]` even though user didn't add it.
**Playwright asserts:**
- Add rule via panel inline form.
- Capture entry with "machine learning" in notes → save.
- Reopen entry → assert "ai" tag chip visible.
**Files involved:** `src/features/settings/KeywordRulesPanel.jsx`, `src/lib/keywordRules/useKeywordRules.js`, `src/lib/keywordRules/applyRules.js`, `src/lib/keywordRules/rulesStorage.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 28: Trash batch restore (multi-select)
**Start:** Trash with multiple items.
**Steps:** Inspect `TrashView` — only per-row Restore/Delete and the global "Empty Trash" exist; no multi-select checkboxes. `App.jsx:bulkTrashSelected` handles bulk DELETION (from main list), not bulk RESTORE.
**Success state:** N/A.
**Playwright asserts:** none — flow doesn't exist.
**Files involved:** `src/features/trash/TrashView.jsx`, `src/App.jsx`.
**Status:** not-implemented (flag — bulk restore from Trash is currently absent. Users must restore one at a time. Worth adding a multi-select cluster in TrashView).

---

## Flow 29: Template create → use → backlink appears in template
**Start:** populated app, vault picked.
**Steps:**
1. Sidebar → Templates folder → `handleSelectFolder(TEMPLATE_DIR)` → `setSection('templates')` → `TemplatesPanel` (`features/templates/TemplatesPanel.jsx`).
2. Click "+ New Template" → fill name → `handleCreateTemplate({name})` (`App.jsx:976`) writes `<vault>/templates/<slug>.md`.
3. Edit body in TemplatesPanel editor → "Save" → `handleSaveTemplate` writes file with frontmatter.
4. Navigate back to All Entries. Open an existing note in DetailPanel.
5. Press `Ctrl+P` → "Insert template at cursor" → `InsertTemplateModal` → pick the template → Enter.
6. `handleInsertTemplate` (`App.jsx:960`) resolves variables, appends template body to active note's `notes`, `addTemplateUsageToEntry` updates the entry's template usage backlinks, save → toast "Inserted template '<name>'".
7. Return to Templates panel → select template → "Incoming" list shows the entry that just used it (`getTemplateIncoming`).
**Success state:** Template's incoming backlinks list contains the using entry.
**Playwright asserts:**
- Create template → save body.
- Open existing note → trigger Insert template → pick template → Enter.
- Navigate Templates → select template → assert incoming row visible.
**Files involved:** `src/features/templates/TemplatesPanel.jsx`, `src/features/templates/InsertTemplateModal.jsx`, `src/lib/templates/templateStore.js`, `src/lib/templates/templateBacklinks.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 30: Update banner — auto-updater fires → UpdateBanner shows → Restart → reload
**Start:** packaged Electron desktop only. `window.electron.updater` available.
**Steps:**
1. Main process electron-updater polls release feed → emits `update-ready` IPC → renderer `updater.onStatus(payload)` callback fires.
2. `UpdateBanner` (`features/updater/UpdateBanner.jsx`) sets state to `{state:'ready', version:'x.y.z'}` → renders bottom-right banner with "↓ Update X.Y.Z ready" + Later + Restart now buttons.
3. Click "Restart now" → `window.electron.updater.installNow()` → main calls `autoUpdater.quitAndInstall()` → app quits, installer runs, new version launches.
**Success state:** Renderer logs Restart, then process exits. (Not testable end-to-end in Playwright unless run against packaged app.)
**Playwright asserts:**
- `await page.evaluate(() => window.electron.updater?.emitStatus?.({state:'ready', version:'9.9.9'}))` (requires test harness on the bridge).
- `await expect(page.getByText(/Update 9\.9\.9 ready/)).toBeVisible()`.
- Click "Restart now" → assert `installNow` IPC was called (stub check).
- Click × dismiss → banner disappears; assert state.
**Files involved:** `src/features/updater/UpdateBanner.jsx`, `src-electron/main.cjs` (updater wiring), `src/App.jsx`.
**Status:** partly-implemented (testable only with stubbed `window.electron.updater`; full lifecycle requires packaged app).

---

## Flow 31: Open in Constellation from DetailPanel → graph focuses on entry
**Start:** DetailPanel open on entry X.
**Steps:**
1. DetailPanel "Open in Constellation" or right-rail action → `openInConstellation(entry)` (`App.jsx:1227`).
2. `handleSection('graph')` + `setConstellationFocusId(id)`.
3. `ConstellationView` renders with `focusEntryId={id}` → applies focal layout / pans to node.
**Success state:** Constellation visible with entry node highlighted/focused.
**Playwright asserts:**
- Open entry → click "Open in Constellation" action.
- Assert section change (graph view container visible).
- Assert `applyFocus` ran (node in DOM with `data-focused="true"` or similar — verify CSS class in ConstellationView).
**Files involved:** `src/features/constellation/ConstellationView.jsx`, `src/App.jsx` (openInConstellation, constellationFocusId).
**Status:** ready

---

## Flow 32: Random note command → opens random entry
**Start:** 2+ entries.
**Steps:**
1. `Ctrl+P` → "Random note" → `openRandomNote` (`App.jsx:945`) picks via `pickRandomEntry(visibleEntries)`.
2. `setDetailId(picked.id)` → DetailPanel opens on the random one.
3. Toast "🎲 Opened '<title>'".
**Success state:** DetailPanel visible on a random entry.
**Playwright asserts:**
- `Ctrl+P` → "random" → Enter → DetailPanel open.
- Seed test fixture with 3 entries; manually mock `Math.random` to assert determinism if needed.
**Files involved:** `src/lib/random/randomNote.js`, `src/features/commandPalette/builtinCommands.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 33: Daily note command → creates today's journal OR opens existing
**Start:** any section.
**Steps:**
1. `Ctrl+P` → "Create daily note" → `createDailyNote` (`App.jsx:922`).
2. Looks up entries with `type==='journal' && (entry_date==today || title==today)`.
3. If found → `setSection('all')` + `setDetailId(existing.id)` + toast "Opened today's journal".
4. Else → creates new journal entry → saves → opens DetailPanel → toast "Daily note created".
**Success state:** DetailPanel open on today's journal.
**Playwright asserts:**
- Open palette → run "Create daily note" twice.
- First run: assert "Daily note created" toast; entry exists.
- Second run: assert "Opened today's journal" toast; same entry id.
**Files involved:** `src/App.jsx` (createDailyNote), `src/features/commandPalette/builtinCommands.js`.
**Status:** ready

---

## Flow 34: Folder create → entry move-to-folder → folder browse → folder delete
**Start:** vault picked.
**Steps:**
1. Sidebar "+ New folder" → `handleNewFolder` → `FolderCreateDialog` (`App.jsx:1673`).
2. Type "research/projects" → submit → `vaultAdapter.mkdir` → `refreshVault` → toast.
3. Open entry → DetailPanel → "Move" action → `moveEntryFile` → `<EntryFileDialog>` open with destination folder input.
4. Submit → `submitEntryFileDialog` (`App.jsx:509`) → `vaultAdapter.move(entry._path, target)` → refresh.
5. Sidebar folder tree → click "research/projects" → `setSection('folder:research/projects')` → `filterShellEntries` shows only files under that folder.
6. Optional: delete folder via sidebar context — `handleDeleteFolder` (`App.jsx:372`) → confirm dialog → cascade move-to-Trash for files inside, `rmdir` folder shell.
**Success state:** Folder created, entry moved, folder section shows entry, folder deletion sends contents to Trash.
**Playwright asserts:**
- Create folder via dialog.
- Move entry → assert entry in target folder section.
- Delete folder → confirm dialog → assert entries gone from All, present in Trash.
**Files involved:** `src/App.jsx` (handleNewFolder, moveEntryFile, handleDeleteFolder), `src/features/shell/EntryFileDialog.jsx`, `src/features/shell/AppConfirmDialog.jsx`, `src/lib/vaultPaths.js`.
**Status:** ready

---

## Flow 35: Base (Smart View) — create base → filter rules → render table
**Start:** populated app.
**Steps:**
1. Sidebar "+ New Base" → `handleNewBase` (`App.jsx:716`) creates `base-${ts}` → `setSection('base:<id>')`.
2. `BaseExplorer` → `BaseView` (`features/bases/`) renders. User edits filters/sorts/columns → `onBaseChange` → `persistBase` writes `<vault>/bases/<id>.base.json`.
3. View renders filtered entries in table/cards/list per `activeViewId`.
**Success state:** Base persisted; entries filtered correctly.
**Playwright asserts:**
- Create base via sidebar.
- Add a `type==='note'` filter → assert entry list shrinks to notes only.
- Reload → base still configured the same.
**Files involved:** `src/features/bases/BaseExplorer.jsx`, `src/features/bases/BaseView.jsx`, `src/lib/base/baseTypes.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 36: Project → "Create Smart View" → auto-generated Base scoped to project
**Start:** at least one project entry.
**Steps:**
1. Projects view → select project → click "Open Smart View" (`WorkstationViews.jsx:3203`) → `onCreateSmartView(project)`.
2. `AppRouteContent.openProjectSmartView` (`AppRouteContent.jsx:187`) checks for existing base matching project; if missing builds `buildProjectSmartBase(project)` → `persistBase` → `setSection('base:<id>')`.
3. BaseView renders with project filter applied.
**Success state:** A new base file exists scoped to project, visible as table.
**Playwright asserts:**
- Create project → Projects view → click "Open Smart View".
- Assert URL/section is `base:project-<slug>`.
- Verify filtered entries match project.
**Files involved:** `src/features/shell/AppRouteContent.jsx`, `src/features/workstation/WorkstationViews.jsx`, `src/lib/base/baseTypes.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 37: Bulk move-to-Trash — multi-select in All Entries → confirm → all gone
**Start:** All Entries with ≥2 entries.
**Steps:**
1. Cards or Rows render with selection checkbox (`Card`/`Row` components, prop `onSelectChange`).
2. User selects multiple → `selectedIds` Set grows → top-bar shows "N selected" + "Move to trash" button (`AppRouteContent.jsx:368`).
3. Click "Move to trash" → `bulkTrashSelected()` → `requestConfirm` "Move selected entries to Trash?" → Confirm.
4. Loop `deleteVaultEntry(id)` + `clearProvenance(id)` per id → toast "N entries moved to trash" → `clearSelection`.
**Success state:** Selected entries gone from list; counts in sidebar decrement; Trash has new files.
**Playwright asserts:**
- Click 2 selection checkboxes.
- Verify "2 selected" bar appears.
- Click "Move to trash" → confirm.
- Assert entries gone; Trash count = 2.
**Files involved:** `src/features/shell/AppRouteContent.jsx`, `src/features/card/Card.jsx`, `src/features/card/Row.jsx`, `src/App.jsx` (bulkTrashSelected).
**Status:** ready

---

## Flow 38: Settings → Import/Export → import JSON bundle → entries+bases+canvases land
**Start:** Settings open.
**Steps:**
1. Settings → **Import/Export** tab.
2. Click "↑ Import JSON" → file picker → choose JotFolio bundle JSON.
3. `importJSON(file)` (`App.jsx:1277`) → `importVaultBundle(file, existingIds)` → splits into entries/bases/canvases; fresh vs duplicate entries.
4. For each: `saveEntryWithRules` (entries), `vaultAdapter.write(basePath(b.id), serializeBase(b))` (bases), `vaultAdapter.write(canvases/<id>.canvas.json, ...)` (canvases).
5. `refreshVault` → counts updated → toast `"Imported N entries, M bases, K canvases (D duplicates skipped)"`.
**Success state:** Entries appear in All; bases listed in sidebar; canvases listed in sidebar.
**Playwright asserts:**
- `setInputFiles` with JotFolio JSON bundle fixture.
- Assert toast with count.
- Verify sidebar counts updated.
**Files involved:** `src/features/settings/SettingsPanel.jsx`, `src/lib/exports.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 39: Settings → Reopen welcome → onboarding restarts
**Start:** Settings → Import/Export.
**Steps:**
1. Click "↺ Reopen welcome" (`SettingsPanel.jsx:589`).
2. Removes `mgn-onboarded` from `localStorage`, closes settings, `location.reload()` after 50ms.
3. App re-mounts → `isOnboarded()` false → if vault is empty → WelcomePanel opens (Flow 1).
**Success state:** Welcome dialog visible after reload.
**Playwright asserts:**
- Settings → Import/Export → click "Reopen welcome".
- Wait for reload.
- `await expect(page.getByRole('dialog', { name: /Welcome/i }))`.
**Files involved:** `src/features/settings/SettingsPanel.jsx`, `src/onboarding/activation.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 40: Settings → Load sample constellation data → navigate to graph
**Start:** Settings → Import/Export.
**Steps:**
1. Click "Load sample constellation data" (`SettingsPanel.jsx:592`) → `onLoadConstellationDemo` → `loadConstellationDemo` (`App.jsx:1257`).
2. Reads `getConstellationDemoEntries()` → filters out already-loaded demo ids → saves each via `saveEntryWithRules`.
3. `refreshVault` → `setSettingsOpen(false)` + `setSection('graph')` → toast "Loaded N constellation demo files".
**Success state:** Section now `graph`; new nodes visible; entries tagged `demo-constellation`.
**Playwright asserts:**
- Click button → wait for graph section.
- Assert SVG has additional nodes.
- Assert one entry has `tags` containing `demo-constellation`.
**Files involved:** `src/features/settings/SettingsPanel.jsx`, `src/lib/demoEntries.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 41: Topbar back/forward — Workstation history navigation
**Start:** populated app on Command Center.
**Steps:**
1. Click sidebar Inbox → `handleSection('raw')` → pushes prev section onto `navBackStack`.
2. Click sidebar Projects → push raw → `navBackStack=[command, raw]`.
3. `WorkspaceTopBar` Back arrow click → `goBackSection` → pops `raw` → pushes `projects` onto forward stack → `setSection('raw')`.
4. Forward arrow → goes back to `projects`.
**Success state:** Section state cycles correctly; sidebar active nav reflects.
**Playwright asserts:**
- Click 3 sidebar items in sequence.
- Click topbar back → verify section.
- Click topbar forward → verify section.
- Verify Back disabled when stack empty (`canGoBack` prop).
**Files involved:** `src/features/workstation/WorkspaceTopBar.jsx`, `src/App.jsx` (goBackSection, goForwardSection, navBackStack).
**Status:** ready

---

## Flow 42: Tag-filter from TagManager → Navigate to All Entries with filter applied
**Start:** populated app.
**Steps:**
1. Sidebar → Tags section → click "Manage Tags" or navigate to a tag rendering.
2. From workstation Tags view (`section==='tags'` via `TagManagerView`) → click a tag row → `setFilterTag(tag); setSection('all')` (`AppRouteContent.jsx:290`).
3. All Entries view renders filtered by tag.
**Success state:** Section changes to `all` with filterTag applied.
**Playwright asserts:**
- Navigate to Tags (sidebar — may not exist as direct nav; reach via command palette `core:open-all-entries` then sidebar Tags pill).
- Click tag → assert section is "all" and filtered count matches.
**Files involved:** `src/features/workstation/WorkstationViews.jsx` (TagManagerView), `src/App.jsx`.
**Status:** partly-implemented (TagManagerView nav is reached indirectly; no direct sidebar nav called "Tags").

---

## Flow 43: AI Setup section → "Open AI Keys" → Settings AI tab
**Start:** Sidebar AI Setup (section=`ai`).
**Steps:**
1. Click sidebar "AI Setup" → `setSection('ai')` → `AppRouteContent` renders `<AIAssistantView>` (`AppRouteContent.jsx:69`).
2. Click "Open AI Keys" → `openSettingsTab('ai')` → `setSection('settings')` with `settingsInitialTab='ai'`.
3. SettingsPanel opens with AI Keys tab pre-selected.
**Success state:** Settings section visible with AI tab active.
**Playwright asserts:**
- Sidebar "AI Setup" → click "Open AI Keys".
- Assert section is `settings` and tab AI active.
**Files involved:** `src/features/shell/AppRouteContent.jsx`, `src/features/settings/SettingsPanel.jsx`, `src/App.jsx`.
**Status:** ready

---

## Flow 44: AI Setup section → "Search vault instead" → switch to Search
**Start:** section=`ai`.
**Steps:**
1. Click "Search vault instead" → `setSection('search')` (`AppRouteContent.jsx:94`).
2. `GlobalSearchView` opens.
**Success state:** Section=`search`.
**Playwright asserts:** click button → assert section=search.
**Files involved:** `src/features/shell/AppRouteContent.jsx`, `src/features/workstation/WorkstationViews.jsx` (GlobalSearchView).
**Status:** ready

---

## Flow 45: Search → open from results → Reveal in Explorer → external action
**Start:** search section with results.
**Steps:**
1. Press `Ctrl+K` → opens Search section directly (no modal — palette routes to global search).
2. Type query in `GlobalSearchView` → results rendered.
3. Click result → `onOpenEntry(id)` → DetailPanel.
4. DetailPanel "Reveal in Explorer" → `revealEntryFile(entry)` (`App.jsx:435`) → `window.electron.app.showItemInFolder(entry._path)`.
**Success state:** External file manager opens (Electron only; in browser, toast says path).
**Playwright asserts:**
- `Ctrl+K`; type; press Enter on result.
- DetailPanel open → click Reveal → stub `window.electron.app.showItemInFolder` and verify called with the path.
**Files involved:** `src/features/workstation/WorkstationViews.jsx` (GlobalSearchView), `src/features/detail/DetailPanel.jsx`, `src/App.jsx`.
**Status:** ready (Reveal only works in Electron; browser path-print fallback exists).

---

## Flow 46: Memory Trace to Sources — wiki → graph (TODO state)
**Start:** wiki or review entry open in MemoryDetailPanel.
**Steps:**
1. MemoryDetailPanel → "Trace to sources" → `onTraceToSources(entryId)` → `handleTraceToSources` (`App.jsx:1360`) does `setSection('graph')`.
2. **TODO comment in code** (`App.jsx:1362-1364`): wire focal-stack initializer in ConstellationView so trace lands directly on entryId scoped to its sources. Today it only navigates to graph; user must click the memory node manually.
**Success state:** Section=graph; focal-stack should auto-focus on entryId+sources (currently does not).
**Playwright asserts:**
- Open wiki entry → click Trace.
- Assert section=graph.
- **Partial:** assert ConstellationView focal stack contains entryId (will fail until alpha.20 wires it).
**Files involved:** `src/features/constellation/MemoryDetailPanel.jsx`, `src/features/constellation/ConstellationView.jsx`, `src/App.jsx`.
**Status:** partly-implemented (explicit TODO at `App.jsx:1362`).

---

## Flow 47: Folder Tree → open template file → switch to templates section
**Start:** Sidebar showing folder tree with `_jotfolio/`, `templates/`, etc.
**Steps:**
1. Click `templates/` folder in sidebar → `handleSelectFolder(TEMPLATE_DIR)` (`App.jsx:331`) → `setSection('templates')` + restore previous selectedTemplateId.
2. Inside templates folder file list, click a `.md` template → `handleOpenFolderFile({kind:'template', templateId})` (`App.jsx:339`) → `setSelectedTemplateId(id)` + `setSection('templates')`.
3. TemplatesPanel renders with that template selected.
**Success state:** TemplatesPanel open, template highlighted.
**Playwright asserts:**
- Click templates/ folder in sidebar → assert TemplatesPanel visible.
- Click template name → assert highlighted state in panel.
**Files involved:** `src/features/sidebar/Sidebar.jsx`, `src/features/templates/TemplatesPanel.jsx`, `src/App.jsx`.
**Status:** ready

---

## Flow 48: Base file → click in sidebar → opens BaseView; canvas file → opens CanvasView
**Start:** sidebar folder tree.
**Steps:**
1. Click a `.base.json` file in sidebar → `handleOpenFolderFile({kind:'base', baseId})` → `setSection('base:<id>')`.
2. `BaseExplorer` opens for that base.
3. Click a `.canvas.json` file → `handleOpenFolderFile({kind:'canvas', canvasId})` → `setSection('canvas:<id>')`.
4. `CanvasExplorer`/`CanvasView` renders.
**Success state:** Correct route renders.
**Playwright asserts:**
- Find both file types in sidebar; click each; assert section state and view visible.
**Files involved:** `src/features/sidebar/Sidebar.jsx`, `src/features/bases/BaseExplorer.jsx`, `src/features/canvas/CanvasExplorer.jsx`, `src/App.jsx`.
**Status:** ready

---

## Flow 49: Confirm Memory — wiki/review confirmation → graduates Tied
**Start:** Wiki entry open in MemoryDetailPanel.
**Steps:**
1. Click "Confirm" → `onConfirm(id)` → `handleConfirmMemory` (`App.jsx:1311`).
2. `confirmMemory(entry)` returns `{updatedEntry, graduatedToWiki}` → `saveEntryWithRules`.
3. Loads manifest; if a tied memory becomes eligible → `graduateTied` returns eligible list → toast "M tied memories now eligible".
4. Toast either "X confirmed" or "X graduated to wiki".
**Success state:** Entry's `review_status==='confirmed'` (review) or `type==='wiki'` if graduated; toasts fired.
**Playwright asserts:**
- Open review/wiki entry → Confirm.
- Reload → assert review_status changed.
**Files involved:** `src/features/constellation/MemoryDetailPanel.jsx`, `src/lib/memory/confirmMemory.js`, `src/lib/memory/graduateTied.js`, `src/App.jsx`.
**Status:** ready

---

## Flow 50: Sidebar `+ New Canvas` button → Canvas view created → returns sidebar entry
**Start:** Sidebar open.
**Steps:**
1. Sidebar `+ New Canvas` (wired via `onNewCanvas={handleNewCanvas}` in `Sidebar.jsx` props from `App.jsx:1460`).
2. `handleNewCanvas('New Canvas')` (`App.jsx:799`) creates a canvas with default empty nodes/edges → `persistCanvas` writes file → `handleSection('canvas:<id>')`.
3. CanvasExplorer/CanvasView renders.
4. Sidebar canvas list re-renders with new entry.
**Success state:** Canvas exists in sidebar and is the current view.
**Playwright asserts:**
- Click sidebar "+ New Canvas".
- Assert new canvas tile in sidebar list.
- Assert current section is `canvas:<id>`.
**Files involved:** `src/features/sidebar/Sidebar.jsx`, `src/features/canvas/CanvasExplorer.jsx`, `src/App.jsx`.
**Status:** ready

---

Total: 50 cross-page flows. Ready for Playwright: 43. Partial: 5 (Obsidian directory import, vault path swap stubbing, feature-flag toggle surface, update banner harness, memory trace to sources TODO). Not implemented: 2 (Command Palette "Export vault" command missing; multi-select restore from Trash).
