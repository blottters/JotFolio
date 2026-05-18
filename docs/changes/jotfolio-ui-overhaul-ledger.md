# JotFolio UI Overhaul Ledger

This ledger tracks the approved workstation UI changes and the real functions attached to them. Keep adding to this file as each screenshot-matched surface becomes part of the working app.

## 2026-05-14

### Workstation Shell

- Rebuilt the app around a desktop-style workstation shell: top app bar, primary left sidebar, main content pane, right dashboard rail, pane dividers, and bottom vault status bar.
- Blank first-run vaults now open the welcome workflow instead of landing on an empty workstation dashboard.
- Blank first-run vaults now show exactly four starter actions: Create first note, Capture raw thought, Create project, and Load sample vault.
- Normal Vite dev-server opens now clear the browser fallback vault before app mount, so entries appear only after user creation or explicit demo/test/stress URLs.
- Added the macOS-style window controls, JotFolio brand mark, back/forward navigation buttons, global search field, Capture button, quick action icon, and Gavin avatar.
- Wired the top back/forward arrows to real in-app route history across the main ribbon/sidebar sections.
- Wired the top search field to activate the Search route, Quick Actions to open the real Quick Switcher, and the avatar to open Settings.
- Top search now behaves as an immediate vault search field: typing opens top matching entries/tags/spaces/canvases/smart views/templates below the field, arrow keys move selection, Enter opens the selected result, and Open full Search still routes to the full search workspace.
- Top-bar Capture now respects the active workspace route: Inbox opens Raw, Calendar opens Journal, Tasks opens Task, Projects passes the selected project, and Spaces passes the selected space.
- Removed the unfinished AI Setup sidebar route and top-bar notification bell from the main shell until those surfaces have real engines behind them.
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
- Replaced the focus-mode dashboard with a real Home Queue: Resume last note, Process Inbox, Open active project, and Continue today's task. The old session-goal, planning, reflection, and duplicate quick-capture surfaces no longer render from Command Center.
- Command Center greeting now derives from the browser's local time zone, so the header uses morning, afternoon, or evening correctly for the user.

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
- Inbox rows can send raw captures to Notes as draft note entries, preserving the saved id while moving them through the existing vault save path.
- Inbox row actions now use readable labels for Flag, Tags, Make Note, Make Task, Make Link, Compile, Archive, and Trash instead of symbol-only controls.
- Inbox rows can now convert raw captures into notes, tasks, or links in place while preserving the same saved entry id and adding a `capture` tag.
- Inbox row Archive and Trash actions are wired directly from each row; Trash uses the existing vault trash flow.
- Inbox rows can now attach a raw capture to a real Project through an app-owned picker. The action writes real `project` metadata, shows the attached project on the row, and preserves that project link when the capture is converted into a note, task, or link.
- Inbox rows no longer expose Compile as a primary triage action. The row-level choices are now Make Note, Make Task, Make Link, Archive, and Trash; memory compile is only reachable from the selected raw entry detail.

### Projects, Tasks, Spaces, Tags

- Added real Projects and Tasks workstation routes based on Markdown entries, preserving search, backlinks, Trash, local paths, and Constellation compatibility.
- Added Spaces and Tag Manager routes using the real entry set and metadata.
- Sidebar navigation routes these surfaces directly instead of showing fake panels.
- Moved individual Spaces out of the left sidebar and promoted Spaces to a main workstation page.
- Spaces now shows a dense workspace view with a space list, selected-space metrics, recent entries, active projects, open tasks, linked tags, graph gaps, and real create/capture actions that preserve `space` metadata.
- Rebuilt Projects into the approved workspace layout with project cards, compact project table, All/Starred/Archived tabs, sorting, grid/list toggle, and a selected-project detail rail.
- Projects now derives entries, notes, canvas counts, backlinks, status, tags, local path, progress, and activity from the Markdown/project/canvas data already in the vault.
- Project actions are wired end to end: New Entry opens Capture with the selected project context, New Canvas creates a canvas with a file node for the project entry, Open Smart View creates or reopens a project-filtered Base, View in Constellation routes to the graph, and More exposes copy/reveal actions.
- Project detail controls now close/reopen the rail, View all switches the detail rail to entries, and project tags can be added from the rail.
- Projects owns its detail rail now, so the generic Today/tasks dashboard rail is hidden on the Projects route.

### Notes / Markdown Editor

- Rebuilt Notes as a dedicated Markdown editor workspace instead of the generic library card/list route.
- Notes now opens the first visible note by default and shows an empty state with a real New Entry action when no notes exist.
- Added screenshot-style editor chrome: open-note tab row, edit/preview controls, Markdown toolbar, line-numbered editor surface, word/line/file-size status, Markdown mode label, Spaces count, and Live indicator.
- Tightened the editor chrome to the approved screenshot: the open note tab, `+`, Edit/Preview, Backlinks, New Entry, and More controls now share one top editor row.
- Markdown toolbar buttons now use compact editor icons with faint vertical group dividers instead of word-heavy button text.
- Removed the duplicate large note title above the Markdown editor so the content starts directly inside the line-numbered editor surface.
- Markdown toolbar actions are functional for headings, bold, italic, links, inline code, lists, checklist items, quotes, images, and tables.
- Editor changes autosave through `updateEntry`, so Notes uses the same vault write path as the rest of JotFolio.
- Added a Notes-owned right rail with Info, Backlinks, Unresolved, Tags, and Properties tabs.
- The Notes Info rail now mirrors the approved right menu by showing Tags, Backlinks, Unresolved links, Properties, File, and Actions in one stacked view.
- Empty duplicate metadata is filtered out of the Notes Properties section so File and Actions stay reachable.
- Notes rail tabs switch to focused views for Backlinks, Unresolved, Tags, and Properties; the Info tab keeps the full screenshot-style overview stack.
- Notes editor utility controls now do work: Focus moves focus into the Markdown editor, Fullscreen toggles the editor workspace, and More exposes copy/reveal actions.
- Notes Properties now has real editing controls for status, project, and entry date, saving through the existing entry update path.
- Notes editor status now reports the real number of spaces in the draft instead of a hard-coded screenshot value.
- Notes Markdown toolbar link and image actions now insert blank Markdown destinations instead of fake `example.com` and `image-url` placeholders.
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
- Newly saved quick captures now keep their saved entry id in the immediate Captured Today row, so opening the row jumps to the real note/task/link/raw entry that was just written.
- Capture queue and filters persist their local mode state.

### Capture / New Entry Modal

- Rebuilt the Capture / New Entry modal to match the approved screenshot.
- Added entry types: Note, Journal, Article, Link, Project, Task, Canvas, and Raw.
- Imported and used the approved SVG asset kit icons from `JotFolio_App_Assets_Icon_Graphics_Kit`.
- Added working fields for title, source URL, tags, template, vault bucket, local path preview, and content capture tabs.
- Added working actions: Apply Template, Save to Project, Save to Inbox, Copy Local Path, Open Source URL, add/remove tags, attach dropped files, and create Canvas.
- Top-bar Capture now opens this full modal instead of the old raw quick-capture dialog.
- Capture / New Entry now shows a visible project or space context chip in the modal header when opened from a contextual workspace.
- Removed Podcast and Video from the visible Capture type picker, and removed the Attachment content tab, so the modal no longer advertises media-specific or attachment-management surfaces that are not finished.
- Capture / New Entry now closes through the normal close/discard flow when Escape is pressed from focused editable fields, including the title field.
- Capture / New Entry now starts clean with no fake title, fake URL, or preselected tags.
- Local path preview now mirrors the real vault bucket for the selected type, such as `notes/`, `projects/`, `tasks/`, `inbox/`, or `canvases/`.
- New Project creates a `project` entry and New Task creates a `task` entry through the normal vault save path instead of pretending they are notes.
- Save to Project is disabled unless a real selected project context is present.
- Capture / New Entry now uses type-honest primary labels: Raw saves to Inbox, while Note/Journal/Article/Podcast/Video/Link/Project/Task/Canvas create that selected entry type.
- Journal capture now has an explicit date field that drives the fallback title, local path preview, and saved `entry_date`.
- Article and Link capture now show a source summary with domain, normalized URL, local title suggestion, and existing-entry duplicate warning before save.
- Saving a Journal from Capture now lands the user in Calendar instead of leaving them on the previous route.
- Duplicate Article/Link warnings now include an `Open existing` action when JotFolio knows the matching entry.
- Entry detail and memory detail panels now dismiss on the next outside click; dirty entry edits still show the discard guard before closing.
- Entry detail panels now match the workstation right-rail width and shell top/status-bar offsets so the left divider aligns with the underlying app grid instead of leaving a visible strip.
- Workstation responsive behavior now protects readable content at narrow widths: the context rail hides under 1240px, Home Queue switches to two columns and then one, and the top bar/sidebar compress before text becomes unusable.

### Constellation

- Kept the relationship-map idea while separating it from screenshot-copy styling.
- Added clearer type-color control, Constellation style/background settings, and graph-safe palette/token handling.
- Protected the main app palette while leaving Constellation node, edge, cluster, memory, ghost-link, and highlight colors open for continued tuning.
- Changed the small info buttons so help text opens as an inline panel below the toolbar instead of overlapping nearby controls or the graph.
- Added the first Relationship Scan foundation: Constellation can now show disconnected notes, unresolved wiki-link targets, and tag gaps from real graph/index data before MiniLM is allowed to suggest or write links.
- Promoted Relationship Scan into Graph Health in the Constellation toolbar, with action rows for opening disconnected/metadata-gap entries and creating missing wiki-link targets.
- Memory detail panels now expose an explicit Close control and Escape-key exit so selected memory review is not a dead-end screen.
- Added Graph Health review decisions for accepted, rejected, and ignored relationship issues. Decisions persist locally and do not edit note content.
- Added the relationship review/apply/undo engine for future Graph Health and MiniLM suggestions. It can model related-note links, wiki-link inserts, tag additions, and project assignments, but only applies them when explicitly called and records exact undo snapshots.
- Memory-only filtering now shows the no-match recovery overlay instead of leaving a blank graph.
- Keyboard layout shortcuts now toggle from the latest selected layout.
- MiniLM semantic indexing is now explicit opt-in and lazy-loaded by the semantic hook instead of starting on default vault load.
- App-level MiniLM gating now matches the explicit opt-in contract: the semantic index hook only starts when `semanticEdges` is exactly `true`.
- Stale local `semanticEdges: true` prefs from earlier builds are reset once during alpha.26 prefs migration so default startup stays MiniLM-free.
- Constellation now computes the active heavy layout only, so affinity layout work does not run when another layout is selected.

### Settings, Safety, Trash, Export

- Settings exists as a full route in the workstation shell.
- Entry detail file actions now use app-level dialogs for Rename file and Move folder instead of browser prompts, and both continue through the real vault move operation.
- Trash, restore, permanent delete, empty trash, and vault safety flows use app-level confirm dialogs instead of browser alerts.
- Vault status is visible in the footer status bar.
- Existing export/recovery/plugin/BYOK AI surfaces remain part of the safety/settings track.
- The unfinished sidebar AI route is labeled AI Setup instead of AI Assistant so it does not promise a finished chat surface.
- New vault entries now use UUID v4 identity while existing non-UUID entries remain untouched until a future explicit repair flow can preview, backup, apply, and undo changes.
- Desktop vault moves reject existing destinations instead of overwriting them.
- Snapshot restore validates snapshot dates and restore destinations before writing.
- Electron external links now follow the ADR policy by allowing only `https://` and `mailto:` targets, including menu help links.
- Browser preview Vault settings no longer offers a fake import path for the active virtual vault.
- Browser fallback binary storage now preserves arbitrary bytes, and Markdown frontmatter parsing preserves body whitespace.
- Testing builds now override package metadata name so packaged smoke tests can use a separate app data identity.
- Performance benches now collect enough samples for a real p95 and only fail relative regressions when the absolute slowdown is meaningful; the frontmatter parser hot path was tightened so vault-scan remains under the gate.

### Test Coverage Added Or Updated

- Added tests for the Capture / New Entry modal.
- Added Capture / New Entry tests for clean blank defaults, disabled project-less project save, real Project creation, and real Task creation.
- Added workstation coverage for blank first-run vaults opening the welcome workflow.
- Added Inbox coverage for readable row actions and raw capture conversion into notes, tasks, and links.
- Updated workstation route tests for the new Search / Quick Switcher screen.
- Added/updated tests for top navigation arrows, Command Center focus modes, capture mode behavior, shell state, sidebar routing, and workstation views.
- Added shell shortcut coverage so `Ctrl/Cmd+K` opens Search / Quick Switcher from the main app shell, matching the visible `⌘K` hint.
- Added regression coverage for duplicate visible titles in Command Center lists and repeated metadata labels in Tasks, preventing React key warnings during live route navigation.
- Added Notes coverage for editable metadata and fake-free Markdown toolbar inserts.
- Added Constellation coverage for Graph Health open/create actions.
- Added relationship decision helper tests and Constellation coverage proving accepted/rejected/ignored Graph Health choices persist and can be cleared.
- Added relationship review engine tests for proposal creation, apply, reject, undo, storage round-trips, and no-mutation-before-apply behavior.
- Added tests for UUID entry creation, Capture type-honest action labels, semantic lazy loading, active-layout Constellation rendering, browser binary round-trips, frontmatter whitespace preservation, command overlay ARIA/focus handling, and browser preview Vault messaging.

### Known Follow-Ups

- Search visual spacing should be screenshot-compared in the browser after more real vault data is loaded.
- Search can later rank exact title matches above body/tag matches.
- Constellation colors are intentionally not frozen and should get a dedicated visual tuning pass.
- The Vite build still reports the existing large chunk warning.
- Dependency audit is currently clean through an `onnxruntime-web` override; keep semantic smoke tests around that override until MiniLM packaging is revisited.
