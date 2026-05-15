# JotFolio UI Overhaul Ledger

This ledger tracks the approved workstation UI changes and the real functions attached to them. Keep adding to this file as each screenshot-matched surface becomes part of the working app.

## 2026-05-14

### Workstation Shell

- Rebuilt the app around a desktop-style workstation shell: top app bar, primary left sidebar, main content pane, right dashboard rail, pane dividers, and bottom vault status bar.
- Added the macOS-style window controls, JotFolio brand mark, back/forward navigation buttons, global search field, Capture button, quick action icon, notification icon, and Gavin avatar.
- Wired the top back/forward arrows to real in-app route history across the main ribbon/sidebar sections.
- Wired the top search field to activate the Search route, Quick Actions to open the real Quick Switcher, Notifications to open Inbox, and the avatar to open Settings.
- Sidebar Spaces and Tags now render from the live vault-derived spaces/tags instead of hard-coded labels.
- Footer vault status now shows the active vault label, entry count, trash count, and vault issue state.
- Set the default workstation identity to Gavin and uses the current local date for date-sensitive surfaces.
- Added dark charcoal surfaces, faint blue-gray borders, compact spacing, and Inter/SF-style typography alignment across workstation views.

### Command Center

- Rebuilt Command Center as the home dashboard with greeting, date controls, focus selector, pinned content, recent notes, active projects, quick actions, and right-rail Today/task/capture context.
- Added focus modes for Deep Work, Planning, Capture, and Review.
- Made the focus selector persistent in local storage so the selected mode returns on reload.
- Added mode-specific Command Center content: planning overview, capture workflow, deep work hub, and review overview.
- Changed Review mode to use blue styling instead of orange.

### Right Dashboard Rail

- Matched the Today KPI widget style with a single thin progress ring and centered `6/9` plus `Done`.
- Removed boxed rows from Today's Tasks and Recent Captures.
- Added only the dividing line between task and capture sections, matching the approved screenshot.
- Added the fading border treatment and depth effect on the Today card.

### Calendar

- Rebuilt Calendar as a real month-planning view with day cells, dated entry pills, journal/review/session indicators, a lower journal table, and a right-side day detail panel.
- Calendar detail panel shows entries on the selected day, memory reviews due, linked projects, tags, local path, and actions.
- Calendar Journal Entries mode now filters the day grid and detail rail to journal entries only.
- Calendar actions route to notes, memory review, linked entries, and Constellation where available.

### Inbox

- Rebuilt Inbox as a capture-processing table with tabs, filter controls, sorting, bulk actions, selection checkboxes, source metadata, tag chips, and per-row actions.
- Added tag editing, flagging, compile/process actions, and bulk trash wiring for raw captures.
- Inbox is now the working place for unprocessed captures instead of a placeholder list.

### Projects, Tasks, Spaces, Tags

- Added real Projects and Tasks workstation routes based on Markdown entries, preserving search, backlinks, Trash, local paths, and Constellation compatibility.
- Added Spaces and Tag Manager routes using the real entry set and metadata.
- Sidebar navigation routes these surfaces directly instead of showing fake panels.
- Rebuilt Projects into the approved workspace layout with project cards, compact project table, All/Starred/Archived tabs, sorting, grid/list toggle, and a selected-project detail rail.
- Projects now derives entries, notes, canvas counts, backlinks, status, tags, local path, progress, and activity from the Markdown/project/canvas data already in the vault.
- Project actions are wired end to end: New Entry opens Capture with the selected project context, New Canvas creates a canvas with a file node for the project entry, Open Smart View creates or reopens a project-filtered Base, View in Constellation routes to the graph, and More exposes copy/reveal actions.
- Project detail controls now close/reopen the rail, View all switches the detail rail to entries, and project tags can be added from the rail.
- Projects owns its detail rail now, so the generic Today/tasks dashboard rail is hidden on the Projects route.

### Notes / Markdown Editor

- Rebuilt Notes as a dedicated Markdown editor workspace instead of the generic library card/list route.
- Notes now opens the first visible note by default and shows an empty state with a real New Entry action when no notes exist.
- Added screenshot-style editor chrome: open-note tab row, edit/preview controls, Markdown toolbar, line-numbered editor surface, word/line/file-size status, Markdown mode label, Spaces count, and Live indicator.
- Markdown toolbar actions are functional for headings, bold, italic, links, inline code, lists, checklist items, quotes, images, and tables.
- Editor changes autosave through `updateEntry`, so Notes uses the same vault write path as the rest of JotFolio.
- Added a Notes-owned right rail with Info, Backlinks, Unresolved, Tags, and Properties tabs.
- Notes rail tabs now switch real content instead of showing every section at once; the Backlinks mode button opens the backlinks tab.
- Notes editor utility controls now do work: Focus moves focus into the Markdown editor, Fullscreen toggles the editor workspace, and More exposes copy/reveal actions.
- Backlinks resolve from note links and wiki-style references; unresolved links display in the rail with create-from-missing wiring.
- Tags can be added from the Notes rail and save back onto the active note.
- Notes actions are wired end to end: New Entry opens Capture for a note in the Notes folder, Reveal in Vault uses the existing reveal bridge, Open in Constellation routes to the graph focused on the selected note, and More copies title/local path.

### Search / Quick Switcher

- Rebuilt Search as the approved Search / Quick Switcher screen.
- Added a large vault search box, category tabs, grouped results, selected-row highlight, and a dedicated right detail rail.
- Search tabs include All, Entries, Projects, Notes, Tags, Spaces, Smart Views, Backlinks, Canvases, Templates, and Memory.
- Search result rows show icon, title, local path, tags, and date.
- Row selection updates the right-side context panel without opening the entry immediately.
- Enter or the Open action opens the selected result.
- Quick Switcher and Command Palette buttons open the real existing overlays.
- Right detail rail shows local path, modified/created date, estimated size, status, tags, backlinks, unresolved links, and actions.
- Search actions include Open Entry/Open Canvas/Open Tag/Open Space/Open Smart View/Open Template, Reveal in Vault, Copy Local Path, Open in Constellation, Copy Title, and Copy Result ID.

### Canvas, Bases, Smart Views

- Canvas edge labels now edit inline from the canvas surface instead of using a browser prompt.
- Base table headers are keyboard-accessible sort buttons and expose active sort direction.
- Base column controls now mirror the default visible columns, so removing a default column behaves predictably.
- Project Smart View actions now open or create the real project-filtered Base from the rail, row actions, and View all control.

### Capture Mode

- Rebuilt the Capture Command Center mode to match the approved capture screen: quick capture tiles, composer, capture filters, captured-today list, capture inbox card, capture queue, and recent captures.
- Capture composer saves real entries through the same entry pipeline as the rest of the app.
- Capture queue and filters persist their local mode state.

### Capture / New Entry Modal

- Rebuilt the Capture / New Entry modal to match the approved screenshot.
- Added entry types: Note, Journal, Article, Podcast, Video, Link, Canvas, and Raw.
- Imported and used the approved SVG asset kit icons from `JotFolio_App_Assets_Icon_Graphics_Kit`.
- Added working fields for title, source URL, tags, template, folder, local path preview, and content capture tabs.
- Added working actions: Apply Template, Save to Project, Save to Inbox, Copy Local Path, Open Source URL, add/remove tags, attach dropped files, and create Canvas.
- Top-bar Capture now opens this full modal instead of the old raw quick-capture dialog.

### Constellation

- Kept the relationship-map idea while separating it from screenshot-copy styling.
- Added clearer type-color control, Constellation style/background settings, and graph-safe palette/token handling.
- Protected the main app palette while leaving Constellation node, edge, cluster, memory, ghost-link, and highlight colors open for continued tuning.
- Changed the small info buttons so help text opens as an inline panel below the toolbar instead of overlapping nearby controls or the graph.
- Memory-only filtering now shows the no-match recovery overlay instead of leaving a blank graph.
- Keyboard layout shortcuts now toggle from the latest selected layout.

### Settings, Safety, Trash, Export

- Settings exists as a full route in the workstation shell.
- Trash, restore, permanent delete, empty trash, and vault safety flows use app-level confirm dialogs instead of browser alerts.
- Vault status is visible in the footer status bar.
- Existing export/recovery/plugin/BYOK AI surfaces remain part of the safety/settings track.

### Test Coverage Added Or Updated

- Added tests for the Capture / New Entry modal.
- Updated workstation route tests for the new Search / Quick Switcher screen.
- Added/updated tests for top navigation arrows, Command Center focus modes, capture mode behavior, shell state, sidebar routing, and workstation views.

### Known Follow-Ups

- Search visual spacing should be screenshot-compared in the browser after more real vault data is loaded.
- Search can later rank exact title matches above body/tag matches.
- Constellation colors are intentionally not frozen and should get a dedicated visual tuning pass.
- The Vite build still reports the existing large chunk warning.
