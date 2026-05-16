# JotFolio Review Actions

Source: `REVIEW.md`

Action block count: 115.

## HIGH SIGNAL - KEEP AND PROTECT

1. **Item:** Search / Quick Switcher route
- **Why it stays:** This is the fastest way through the vault, and the app gets worse the second search becomes secondary.
- **What protects it:** Keep search global, keyboard-first, and faster than sidebar navigation.
- **Who already proves the bar:** Raycast, 2020, made root search the whole launcher instead of a tiny field pretending to help.
- **Acceptance:** `Ctrl+K` opens Search, typing filters entries immediately, and Enter opens the highlighted result without making me grab the mouse.

2. **Item:** Notes route
- **Why it stays:** This is the actual product, not the surrounding dashboard noise.
- **What protects it:** Keep Notes as the writing home with metadata, backlinks, and file actions close by.
- **Who already proves the bar:** Obsidian, 2020, shipped Markdown files plus graph context as the main object, not a side quest.
- **Acceptance:** I can open Notes, write Markdown, save, tag, search, and see relationship context without leaving the editor.

3. **Item:** Trash route
- **Why it stays:** Local-first without recovery is just a more stressful way to lose files.
- **What protects it:** Keep restore, delete, and empty-trash paths explicit and guarded.
- **Who already proves the bar:** Notion, 2016, kept deleted pages recoverable from Trash instead of treating deletion like a dare.
- **Acceptance:** A moved-to-trash entry appears in Trash, restores to the original path, and permanent delete still makes me confirm the damage.

4. **Item:** Capture note type
- **Why it stays:** Notes are the base unit, and the capture modal finally writes the right kind of thing.
- **What protects it:** Keep Note creation direct, local, and free of fake demo defaults.
- **Who already proves the bar:** Bear, 2016, made new-note capture instant and text-first.
- **Acceptance:** `Capture -> Note -> Create Note` writes a real `.md` entry with no stock tags, fake URL, or sample body.

5. **Item:** Capture project type
- **Why it stays:** Projects need to be first-class instead of notes wearing a costume.
- **What protects it:** Preserve project-specific paths, status, tags, and linked work.
- **Who already proves the bar:** Linear, 2019, made projects real containers with status and linked issues.
- **Acceptance:** `Capture -> Project` creates a project entry that Projects can find, filter, and use as context for new work.

6. **Item:** Capture task type
- **Why it stays:** Tasks are real commitments, not paragraphs with checkboxes taped on.
- **What protects it:** Keep tasks as a distinct type with status that the Tasks screen can update.
- **Who already proves the bar:** Todoist, 2007, treated tasks as their own object with completion state.
- **Acceptance:** `Capture -> Task` creates a task in `tasks/`, and checking it in Tasks updates that same entry.

7. **Item:** Raw capture / Save to Inbox
- **Why it stays:** Messy capture is honest, and Inbox is where messy belongs.
- **What protects it:** Keep raw captures separate until the user processes them.
- **Who already proves the bar:** Readwise Reader, 2022, gave unsorted saves an Inbox before cleanup.
- **Acceptance:** `Capture -> Raw -> Save to Inbox` creates a raw item that appears in Inbox and does not masquerade as a finished note.

8. **Item:** Template picker and Apply Template
- **Why it stays:** Templates save real writing time when they insert real structure.
- **What protects it:** Keep templates editable, local, and visible from Capture and Notes.
- **Who already proves the bar:** Notion, 2019, put templates where pages get created.
- **Acceptance:** Picking `Meeting Notes` and pressing `Apply Template` inserts the actual meeting scaffold into the draft.

9. **Item:** Vault bucket and local path preview
- **Why it stays:** Showing the exact file path is the difference between local-first and trust-me storage.
- **What protects it:** Keep the preview live and accurate for every capture type.
- **Who already proves the bar:** Obsidian, 2020, made the file tree visible because files are the contract.
- **Acceptance:** Switching from Note to Task changes the preview from `notes/...md` to `tasks/...md` before save.

10. **Item:** Inbox queue
- **Why it stays:** The Inbox is the right pressure valve for a tool that captures fast.
- **What protects it:** Keep Inbox focused on processing raw or unfinished work.
- **Who already proves the bar:** Things 3, 2017, used Inbox as the triage room before scheduling.
- **Acceptance:** New raw captures land in Inbox and leave Inbox only after a clear processing action.

11. **Item:** Search query and category tabs
- **Why it stays:** Searching across object types is the right answer for a mixed vault.
- **What protects it:** Keep the query broad, but make object type filters fast.
- **Who already proves the bar:** Notion, 2021, shipped Quick Find across pages and databases from one entry point.
- **Acceptance:** A single query returns notes, projects, tasks, tags, templates, canvases, and bases with visible type labels.

12. **Item:** Quick Switcher overlay
- **Why it stays:** Opening things by name beats walking the sidebar.
- **What protects it:** Keep it keyboard-first and separate from heavy search views.
- **Who already proves the bar:** Obsidian, 2020, shipped Quick Switcher as the fastest path to any note.
- **Acceptance:** `Ctrl+O`, type three letters, Enter opens the target entry.

13. **Item:** Command Palette overlay
- **Why it stays:** A desktop workspace needs commands, not hunting through buttons.
- **What protects it:** Keep real executable actions only.
- **Who already proves the bar:** VS Code, 2015, made `Ctrl+Shift+P` the command center for the whole app.
- **Acceptance:** `Ctrl+P` opens commands and every listed command actually changes the app.

14. **Item:** Notes tabs and note rail
- **Why it stays:** This makes Notes feel like an editor rather than a settings form with a text area.
- **What protects it:** Keep open notes, navigation, and context visible without burying the body.
- **Who already proves the bar:** Craft, 2020, kept document navigation close to writing.
- **Acceptance:** I can switch notes from the rail and keep the editor state intact.

15. **Item:** Notes Markdown editor and autosave
- **Why it stays:** If Markdown editing is weak, the rest of the product is decoration.
- **What protects it:** Keep autosave reliable and make save state visible.
- **Who already proves the bar:** Obsidian, 2020, made local Markdown editing the main event.
- **Acceptance:** Typing into a note persists to the vault, reload keeps the text, and no fake save button lies to me.

16. **Item:** Notes metadata editor
- **Why it stays:** Status, date, project, and tags belong beside the note they describe.
- **What protects it:** Keep metadata editable in context, not buried in detail panels.
- **Who already proves the bar:** Tana, 2022, made fields part of the working note surface.
- **Acceptance:** I edit status or project in Notes and Search, Projects, and graph context reflect it.

17. **Item:** Backlinks and unresolved links rail
- **Why it stays:** Backlinks are not a cute graph gimmick; they are how a personal wiki breathes.
- **What protects it:** Keep backlinks and missing links visible while writing.
- **Who already proves the bar:** Roam Research, 2019, made backlinks impossible to ignore.
- **Acceptance:** Writing `[[Missing Thing]]` shows an unresolved link with an action next to the note.

18. **Item:** Create missing note
- **Why it stays:** A wiki grows by naming ideas before every page exists.
- **What protects it:** Keep missing-note creation one click away.
- **Who already proves the bar:** Roam Research, 2019, made bracketed pages spring into existence from references.
- **Acceptance:** Clicking `Create` beside an unresolved link creates the missing note and updates the link state.

19. **Item:** Projects filters and layouts
- **Why it stays:** Projects need scan, filter, and status views to be more than tags.
- **What protects it:** Keep project navigation dense and work-focused.
- **Who already proves the bar:** Linear, 2019, shipped project lists with state, progress, and linked work.
- **Acceptance:** Projects can filter by status/tag and open a project without losing the list context.

20. **Item:** Tasks grouping
- **Why it stays:** Open, Today, Overdue, Done is the right first cut for task triage.
- **What protects it:** Keep task buckets plain and action-based.
- **Who already proves the bar:** Things 3, 2017, shipped Today and Upcoming as first-class task views.
- **Acceptance:** Tasks land in the correct bucket and completion moves them out of the active pile.

21. **Item:** Task checkbox status update
- **Why it stays:** A checkbox that changes real status is the bare minimum and this one does.
- **What protects it:** Keep row actions wired to entry data.
- **Who already proves the bar:** Todoist, 2007, made task completion instant from the list.
- **Acceptance:** Click the checkbox, the row moves to Done, and reloading keeps it done.

22. **Item:** Spaces list/filter/sort/status
- **Why it stays:** Spaces deserve a page because they describe work rooms, not sidebar clutter.
- **What protects it:** Keep Spaces as a workspace overview with list and selected detail.
- **Who already proves the bar:** Notion, 2022, introduced Teamspaces as high-level containers for work.
- **Acceptance:** The sidebar has one `Spaces` entry, and the page filters and selects Spaces without nested sidebar sprawl.

23. **Item:** Space metrics and health panels
- **Why it stays:** A Space should answer what exists, what is active, and what is broken.
- **What protects it:** Keep metrics tied to real entries and graph gaps.
- **Who already proves the bar:** Anytype, 2023, made spaces containers with object context.
- **Acceptance:** Selecting a Space shows real entries, projects, tasks, tags, and graph gaps from that Space.

24. **Item:** Constellation visual controls
- **Why it stays:** Graphs need layout controls or they become expensive wallpaper.
- **What protects it:** Keep controls that change the rendered map and cut dead styling knobs.
- **Who already proves the bar:** Obsidian, 2020, shipped graph filters and display controls because vault graphs get messy fast.
- **Acceptance:** Changing layout/style/background visibly changes the graph and persists as preference.

25. **Item:** Graph Health / Relationship Scan
- **Why it stays:** This is the first thing here that can beat Obsidian instead of chasing it.
- **What protects it:** Make graph health about actual fix queues: orphan notes, missing links, weak tags, stale memory.
- **Who already proves the gap:** Obsidian, 2020, shows a graph but does not tell me what to repair.
- **Acceptance:** Opening Constellation shows a Graph Health queue with concrete fixes before a decorative graph tour.

26. **Item:** Relationship decision actions
- **Why it stays:** Suggestions without accept/reject/ignore are just automation with plausible deniability.
- **What protects it:** Preserve user review before any relationship change lands in the vault.
- **Who already proves the bar:** Readwise Reader, 2022, kept user review in the loop for saved highlights and triage.
- **Acceptance:** A suggested relation can be accepted, rejected, ignored, and the decision is remembered.

27. **Item:** Memory detail confirm/split/trace/close
- **Why it stays:** Memory claims need trust actions, not magic.
- **What protects it:** Keep confirm and trace visible, and never trap the user in the panel.
- **Who already proves the bar:** Roam Research, 2019, made source links and block references part of trust.
- **Acceptance:** Opening a memory gives Confirm, Split, Trace, and Close; Escape or Close exits cleanly.

28. **Item:** Canvas list/create/open/delete
- **Why it stays:** Visual planning belongs in a knowledge app when it writes to local files.
- **What protects it:** Keep canvases first-class and file-backed.
- **Who already proves the bar:** Obsidian Canvas, 2022, made local visual boards useful inside a vault.
- **Acceptance:** Create a canvas, reopen it, and delete it through the Canvas Explorer without touching raw files.

29. **Item:** Base explorer
- **Why it stays:** Saved views are how a vault becomes operational instead of just searchable.
- **What protects it:** Keep Bases understandable as saved filtered lists.
- **Who already proves the bar:** Notion, 2018, made databases central to structured work.
- **Acceptance:** A Base appears in the explorer, opens, and preserves its filters and layout.

30. **Item:** Base filters/sorts/columns/views
- **Why it stays:** This is the local answer to Notion databases, and it has teeth.
- **What protects it:** Keep filters, sorts, and views tied to entries without cloud-only behavior.
- **Who already proves the bar:** Notion, 2018, shipped filters, sorts, table views, and properties as the core database loop.
- **Acceptance:** I can filter tasks by project, sort by date, switch view, and reopen the same saved view.

31. **Item:** AI Keys settings
- **Why it stays:** This is honest about being provider setup, not fake chat.
- **What protects it:** Keep AI provider calls opt-in and clearly separated from local features.
- **Who already proves the bar:** Obsidian, 2023, let AI happen through user-installed plugins instead of pretending core notes need cloud calls.
- **Acceptance:** AI Keys stays in Settings, the main route does not overpromise, and no vault content leaves without explicit action.

32. **Item:** Privacy telemetry opt-in
- **Why it stays:** Local-first users will walk if telemetry is sneaky.
- **What protects it:** Keep crash reporting opt-in, readable, and revocable.
- **Who already proves the bar:** Obsidian, 2020, built trust by keeping vault contents local.
- **Acceptance:** Privacy shows telemetry state, toggling it persists, and the copy says what is never sent.

33. **Item:** Electron preload API
- **Why it stays:** The desktop bridge is the difference between a vault app and a security accident.
- **What protects it:** Keep renderer access narrow and audited.
- **Who already proves the bar:** VS Code, 2015, put file access behind the host process instead of random web code.
- **Acceptance:** Renderer code reaches vault, snapshots, updates, and telemetry only through the exposed bridge.

34. **Item:** Keyboard shortcuts
- **Why it stays:** Power users forgive rough UI faster when the keyboard path is fast.
- **What protects it:** Keep shortcuts documented, tested, and wired globally where appropriate.
- **Who already proves the bar:** Linear, 2019, made command-menu workflows fast enough to run issues in a few keystrokes.
- **Acceptance:** `Ctrl+K`, `Ctrl+O`, `Ctrl+P`, `N`, `/`, and Escape all work from normal app surfaces.

## REMOVE

35. **Item:** AI Setup main route
- **Why it goes:** A main-nav item that opens "not ready" copy is product cosplay.
- **What replaces it:** Nothing in main nav; `AI Keys` stays under Settings until source-grounded chat exists.
- **Who already cut this and was right to:** Obsidian, 2020, shipped core notes without a fake AI tab and let optional AI arrive later through plugins.
- **Acceptance:** `AI Setup` no longer renders in the sidebar, and navigating to the old route redirects to Settings > AI Keys or a plain not-found route.

36. **Item:** Notifications bell
- **Why it goes:** A bell with no notification model is a lie in icon form.
- **What replaces it:** Nothing until due reviews, failed saves, update events, or vault health alerts exist.
- **Who already cut this and was right to:** Bear, 2016, did not stick a fake notification bell in a note app just to look busy.
- **Acceptance:** The bell no longer renders in the top bar unless there is a real notification source and a real notification panel.

37. **Item:** Podcast capture type
- **Why it goes:** A podcast icon on a generic Markdown form is not a podcast feature.
- **What replaces it:** Article or Link capture until transcript, episode, timestamp, and source metadata exist.
- **Who already cut this and was right to:** Raindrop.io, 2013, saved media links as bookmarks instead of inventing fake media object types.
- **Acceptance:** `Podcast` no longer appears in Capture; existing podcast entries still open as normal entries.

38. **Item:** Video capture type
- **Why it goes:** Video capture without timestamp, transcript, channel, or watch state is just a label tax.
- **What replaces it:** Link capture with media metadata later.
- **Who already cut this and was right to:** Readwise Reader, 2022, handled videos as readable/savable sources with metadata instead of a dead type picker button.
- **Acceptance:** `Video` no longer appears in Capture; existing video entries remain readable.

39. **Item:** Attachment tab
- **Why it goes:** A tab that hints at file handling without an attachment manager is how people lose confidence.
- **What replaces it:** A real attachment list later, or nothing right now.
- **Who already cut this and was right to:** Craft, 2020, showed inserted files as visible blocks, not a vague empty tab.
- **Acceptance:** `Attachment` is absent from Capture until dropped files render in an attachment list with open, reveal, and remove actions.

40. **Item:** Compile raw to memory in Inbox
- **Why it goes:** Inbox triage should not ask me to understand memory compilation before I can sort a capture.
- **What replaces it:** `Make note`, `Make task`, `Make link`; memory compile moves to Graph Health review.
- **Who already cut this and was right to:** Readwise Reader, 2022, kept Inbox triage separate from high-level review and export flows.
- **Acceptance:** Inbox raw rows no longer show compile as a primary action; Graph Health owns memory review entry points.

41. **Item:** Command Center session goals / priorities / reflection copy
- **Why it goes:** This reads like a productivity app hallucinating a coach.
- **What replaces it:** Real recent work, pinned work, and next actions.
- **Who already cut this and was right to:** Linear, 2019, showed assigned issues and projects instead of motivational filler.
- **Acceptance:** Command Center no longer renders `session goals`, `priorities`, or `reflection` copy unless backed by editable real entries.

42. **Item:** Command Center capture-mode quick composer
- **Why it goes:** A second capture surface fights the actual Capture button.
- **What replaces it:** One Capture modal, opened with context.
- **Who already cut this and was right to:** Raycast, 2020, kept one command entry point instead of scattering mini-launchers through every view.
- **Acceptance:** Command Center no longer contains its own quick composer; all creation routes through Capture.

43. **Item:** Command Center planning / review panels
- **Why it goes:** Panels that do not mutate vault work are dashboard tax.
- **What replaces it:** Work queues that open or change real notes, projects, tasks, and Inbox items.
- **Who already cut this and was right to:** Things 3, 2017, kept review attention on Today, Upcoming, and concrete tasks.
- **Acceptance:** Planning and review panels either operate on real entries or do not render.

44. **Item:** Project Smart View shortcut
- **Why it goes:** This adds another abstraction before users understand Bases.
- **What replaces it:** A normal `Open saved view` action after Bases are explained.
- **Who already cut this and was right to:** Notion, 2018, made database views visible inside the database instead of hiding creation behind a project card trick.
- **Acceptance:** Project screens no longer show `Create Smart View` until Base education and view preview exist.

45. **Item:** Calendar graph/link/review action cluster
- **Why it goes:** The day detail rail is turning into a drawer of unrelated buttons.
- **What replaces it:** Journal creation and date assignment only.
- **Who already cut this and was right to:** Fantastical, 2011, focused the day view on calendar items and creation, not graph tourism.
- **Acceptance:** Day detail no longer shows graph, link, or review-memory actions unless tied to a dated review item.

46. **Item:** Semantic edges / MiniLM suggestions
- **Why it goes:** Invisible meaning edges before review/undo is exactly the kind of clever feature that wrecks trust.
- **What replaces it:** Graph Health suggestion cards with reason, source, accept, reject, ignore, undo.
- **Who already cut this and was right to:** Obsidian, 2020, showed explicit links and graph edges from vault data, not silent semantic guesses.
- **Acceptance:** Constellation does not draw MiniLM edges until every edge has a visible reason and review decision.

47. **Item:** Split memory modal in normal UI
- **Why it goes:** Splitting memories is expert tooling exposed before the basic memory review loop is sane.
- **What replaces it:** Confirm and trace only; split returns after review queues are stable.
- **Who already cut this and was right to:** Readwise Reader, 2022, kept advanced cleanup behind review workflows instead of putting it in the first detail panel.
- **Acceptance:** `Split` no longer renders in normal memory detail until Graph Health has a mature review queue.

48. **Item:** Appearance theme sprawl
- **Why it goes:** Twenty knobs for color while core workflows still wobble is priorities upside down.
- **What replaces it:** Dark, light, system, scale, font; advanced theme editing hidden behind Advanced.
- **Who already cut this and was right to:** Linear, 2019, kept appearance choices tight while the issue workflow did the work.
- **Acceptance:** Appearance defaults show only theme mode, scale, and font; color matrices live behind Advanced or disappear.

49. **Item:** Extensions panel
- **Why it goes:** A plugin panel without a user-installable plugin story is architecture showing through the drywall.
- **What replaces it:** Nothing until plugin install, permissions, enable/disable, and failure states are real.
- **Who already cut this and was right to:** Bear, 2016, skipped plugins entirely and shipped a focused notes app.
- **Acceptance:** `Extensions` is hidden from Settings unless at least one safe, installable, documented extension exists.

50. **Item:** Public npm scripts as product surface
- **Why it goes:** Users do not care about repo scripts, and pretending they do is developer narcissism.
- **What replaces it:** Developer docs only.
- **Who already cut this and was right to:** Notion, 2016, never exposed build scripts as product concepts to users.
- **Acceptance:** No product UI, onboarding, or user-facing copy mentions dev/build/test scripts.

## CHANGE

51. **Item:** Command Center
- **What it does now:** It presents a dashboard with some useful entries buried under vague productivity framing.
- **What it does after:** It becomes the home queue: resume last note, process Inbox, open active project, continue today's task.
- **Who's been doing this right the whole time:** Linear, 2019, opens work around assigned issues, cycles, and projects instead of mood-board dashboard cards.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/workstation/workstationData.js`
- **Acceptance:** Opening Command Center shows four real work actions first, and each one opens or changes real vault data in one click.

52. **Item:** Inbox
- **What it does now:** It lists raw captures, but processing choices are not blunt enough.
- **What it does after:** Every raw capture has `Make note`, `Make task`, and `Make link` buttons.
- **Who's been doing this right the whole time:** Things 3, 2017, turns Inbox items into concrete scheduled or filed tasks fast.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/App.jsx`, `source/src/lib/storage.js`
- **Acceptance:** I save a raw capture, press `Make task`, and it leaves Inbox as a task with a trace back to the original capture.

53. **Item:** Projects
- **What it does now:** It lists projects with filters, but project anatomy is too thin.
- **What it does after:** Each project shows milestones, next action, linked notes, open tasks, and recent changes.
- **Who's been doing this right the whole time:** Linear, 2019, project pages shipped with status, progress, linked issues, and updates.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/workstation/workstationData.js`, `source/src/features/detail/DetailPanel.jsx`
- **Acceptance:** Opening a project gives me the next action and active work without needing Search.

54. **Item:** Calendar
- **What it does now:** It looks like a calendar but does not beat dedicated calendar apps at planning.
- **What it does after:** It becomes a journal and review calendar: daily notes, dated tasks, and memory reviews.
- **Who's been doing this right the whole time:** Craft, 2020, made daily notes a writing surface instead of pretending to replace Google Calendar.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/workstation/workstationData.js`, `source/src/App.jsx`
- **Acceptance:** Today opens or creates today's journal, dated tasks show on the day, and review items are clearly labeled.

55. **Item:** Constellation
- **What it does now:** It opens a graph-first view with health tools available but secondary.
- **What it does after:** It opens Graph Health first, with the map supporting the fix queue.
- **Who's been doing this right the whole time:** Obsidian, 2020, nailed graph display; JotFolio beats that only by making graph repair the first job.
- **Files / routes / components likely touched:** `source/src/features/constellation/ConstellationView.jsx`, `source/src/lib/index/vaultIndex.js`
- **Acceptance:** Opening Constellation lands on Graph Health, and clicking an issue highlights the relevant graph node or missing target.

56. **Item:** Tasks
- **What it does now:** It groups tasks, but editing jumps between row controls and detail panels.
- **What it does after:** Rows support fast inline due date, priority, project, and status edits.
- **Who's been doing this right the whole time:** Todoist, 2007, let users change task project/date/priority directly from task context.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/workstation/workstationData.js`
- **Acceptance:** I edit due date and priority from the task row, reload, and the task stays in the correct bucket.

57. **Item:** Spaces
- **What it does now:** It shows a useful Space page but editing is too weak.
- **What it does after:** Spaces support rename, archive, color name, and visible rules that affect entries.
- **Who's been doing this right the whole time:** Notion, 2022, shipped Teamspaces as named, managed work containers.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/App.jsx`, `source/src/lib/workstation/workstationData.js`
- **Acceptance:** I rename a Space, archive it, and watch its filtered entries respect the new state.

58. **Item:** Settings
- **What it does now:** It mixes preferences, safety, AI, plugins, import/export, updates, and dev-ish controls in one crowded panel.
- **What it does after:** Settings splits into Preferences, Safety, and Advanced.
- **Who's been doing this right the whole time:** Arc, 2023, separated profile, account, and advanced browser choices instead of dumping every knob into one panel.
- **Files / routes / components likely touched:** `source/src/features/settings/SettingsPanel.jsx`, `source/src/features/shell/AppRouteContent.jsx`
- **Acceptance:** Normal settings open to Preferences; recovery/export lives in Safety; plugins/sample data live in Advanced.

59. **Item:** All Entries
- **What it does now:** The library still feels like the default home despite Notes, Inbox, Search, and Spaces doing the real work.
- **What it does after:** It becomes `All Entries`: a utility list, not the app's front door.
- **Who's been doing this right the whole time:** Obsidian, 2020, treated the file explorer as a utility, not the whole workspace.
- **Files / routes / components likely touched:** `source/src/features/shell/AppRouteContent.jsx`, `source/src/features/sidebar/Sidebar.jsx`, `source/src/features/shell/appShellState.js`
- **Acceptance:** App start lands on the real home queue, and `All Entries` is clearly a secondary library view.

60. **Item:** Capture button
- **What it does now:** It opens Capture with Note as the default too often.
- **What it does after:** It defaults by context: Project screen starts project-related capture, Space screen carries Space, Calendar starts journal/date.
- **Who's been doing this right the whole time:** Things 3, 2017, uses context when adding tasks from project areas.
- **Files / routes / components likely touched:** `source/src/App.jsx`, `source/src/features/workstation/WorkspaceTopBar.jsx`, `source/src/features/add/AddModal.jsx`
- **Acceptance:** From Spaces, `Capture` opens with the selected Space already shown; from Calendar, it starts a journal or dated item.

61. **Item:** Journal capture
- **What it does now:** It uses a daily template but hides the journal date in a generic capture form.
- **What it does after:** Journal capture centers date and links directly to Calendar.
- **Who's been doing this right the whole time:** Craft, 2020, put daily notes on a calendar-backed writing path.
- **Files / routes / components likely touched:** `source/src/features/add/AddModal.jsx`, `source/src/App.jsx`, `source/src/features/workstation/WorkstationViews.jsx`
- **Acceptance:** Creating a journal shows the date field up front and the entry appears on that Calendar day.

62. **Item:** Article capture
- **What it does now:** It depends on manual source paste and generic metadata.
- **What it does after:** It extracts title/domain when possible and shows duplicate source matches before save.
- **Who's been doing this right the whole time:** Readwise Reader, 2022, saves articles with title, source, and duplicate-aware library behavior.
- **Files / routes / components likely touched:** `source/src/features/add/AddModal.jsx`, `source/src/lib/storage.js`
- **Acceptance:** Paste a URL, see title/domain metadata, and get blocked with the existing entry if that source is already saved.

63. **Item:** Link capture
- **What it does now:** It behaves like a generic note with a URL field.
- **What it does after:** It behaves like a bookmark: title, domain, duplicate warning, source preview.
- **Who's been doing this right the whole time:** Raindrop.io, 2013, made bookmark capture about title, URL, domain, and collection.
- **Files / routes / components likely touched:** `source/src/features/add/AddModal.jsx`, `source/src/lib/storage.js`
- **Acceptance:** `Capture -> Link` shows domain and existing match before I save a duplicate.

64. **Item:** Canvas capture
- **What it does now:** Canvas creation runs through a note-shaped capture form.
- **What it does after:** Canvas gets a slim dialog: name, description, seed cards.
- **Who's been doing this right the whole time:** Obsidian Canvas, 2022, creates a canvas as its own object, then lets cards define the board.
- **Files / routes / components likely touched:** `source/src/features/add/AddModal.jsx`, `source/src/features/canvas/CanvasExplorer.jsx`, `source/src/App.jsx`
- **Acceptance:** Picking Canvas opens a canvas-specific dialog and creates a board with optional seed cards.

65. **Item:** Source URL field
- **What it does now:** It validates safe URLs and opens them, but duplicate handling is not visible enough.
- **What it does after:** It normalizes URLs, detects duplicates, and shows the existing entry before save.
- **Who's been doing this right the whole time:** Raindrop.io, 2013, handles duplicate bookmark URLs as library hygiene, not user homework.
- **Files / routes / components likely touched:** `source/src/features/add/AddModal.jsx`, `source/src/lib/storage.js`, `source/src/lib/search/searchVault.js`
- **Acceptance:** Pasting `https://example.com/?utm_source=x` matches an existing `https://example.com/` entry and shows it.

66. **Item:** Inbox conversion
- **What it does now:** Raw captures are listed, but turning them into finished objects is not concrete enough.
- **What it does after:** Conversion preserves the original id or writes a visible conversion trace.
- **Who's been doing this right the whole time:** Things 3, 2017, turns Inbox items into organized tasks without making a duplicate mess.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/App.jsx`, `source/src/lib/storage.js`
- **Acceptance:** `Make note` converts a raw capture, removes it from Inbox, and leaves history/search intact.

67. **Item:** Inbox project attach
- **What it does now:** Project attachment is not obvious in the raw capture flow.
- **What it does after:** A recent-project picker sits on each raw capture.
- **Who's been doing this right the whole time:** Linear, 2019, lets issues attach to projects from the issue context.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/workstation/workstationData.js`
- **Acceptance:** A raw capture can be attached to a recent project in two clicks and appears in that project.

68. **Item:** Inbox archive/trash
- **What it does now:** Clearing Inbox leans too close to removal.
- **What it does after:** Archive becomes its own safe state; Trash remains destructive cleanup.
- **Who's been doing this right the whole time:** Gmail, 2004, separated Archive from Trash because clearing the inbox is not deletion.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/types.js`, `source/src/App.jsx`
- **Acceptance:** Archiving a raw capture removes it from Inbox without placing it in Trash.

69. **Item:** Search detail rail
- **What it does now:** It previews results, but keyboard action is too weak.
- **What it does after:** Arrow keys move selection, Enter opens, and preview hotkeys work.
- **Who's been doing this right the whole time:** Raycast, 2020, makes search results operable without mouse travel.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`
- **Acceptance:** In Search, Down selects a result, Enter opens it, and the detail rail follows the selection.

70. **Item:** Search object actions
- **What it does now:** It searches mixed objects, but filtering by type is slower than it needs to be.
- **What it does after:** Type badges are stronger, and keyboard filters narrow to notes/tasks/projects/tags/templates.
- **Who's been doing this right the whole time:** Notion, 2021, Quick Find labels pages, databases, and workspace objects clearly.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/workstation/workstationData.js`
- **Acceptance:** I type a query, press a type-filter key, and only that object type remains.

71. **Item:** Focus mode tabs
- **What it does now:** Switching focus modes changes surface tone more than work behavior.
- **What it does after:** Each focus mode changes the first three actions shown.
- **Who's been doing this right the whole time:** Things 3, 2017, changes the working list by Today, Upcoming, Anytime, Someday instead of just changing labels.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/workstation/workstationData.js`
- **Acceptance:** Switching from Deep Work to Review changes the first row from writing actions to review actions.

72. **Item:** Pinned/recent items
- **What it does now:** Recent items are useful, but the user cannot control the list enough.
- **What it does after:** Notes and projects can be manually pinned and reordered.
- **Who's been doing this right the whole time:** Slack, 2019, let users pin important channel items instead of trusting recency only.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/storage.js`
- **Acceptance:** I pin a project, reload, and it stays above recents until I unpin it.

73. **Item:** Project detail rail
- **What it does now:** It shows project context, but not enough command-level work.
- **What it does after:** It becomes the project command center: next action, milestone, recent note, task rollup, status edit.
- **Who's been doing this right the whole time:** Linear, 2019, gives project pages progress, milestones, updates, and linked issues.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/workstation/workstationData.js`
- **Acceptance:** Opening a project shows next action and task rollup before any decorative metadata.

74. **Item:** New entry with project context
- **What it does now:** Context carries into Capture, but the UI does not make the target obvious enough.
- **What it does after:** Capture title bar shows the project target and saved relationship.
- **Who's been doing this right the whole time:** Linear, 2019, shows the project/cycle context when creating an issue from that context.
- **Files / routes / components likely touched:** `source/src/features/add/AddModal.jsx`, `source/src/features/workstation/WorkstationViews.jsx`
- **Acceptance:** From a project, Capture says `Saving to Project: <name>` and the saved entry appears on that project.

75. **Item:** New canvas from project
- **What it does now:** It creates a blank canvas from project context.
- **What it does after:** It seeds the canvas with project notes and open tasks.
- **Who's been doing this right the whole time:** Obsidian Canvas, 2022, lets notes become cards so context is visible immediately.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/features/canvas/CanvasView.jsx`, `source/src/lib/canvas/canvasTypes.js`
- **Acceptance:** `New Canvas` from a project opens a board containing the project, linked notes, and open tasks as cards.

76. **Item:** Project metadata
- **What it does now:** Project metadata edits save, but feedback is too quiet.
- **What it does after:** Status changes show inline save feedback and status history.
- **Who's been doing this right the whole time:** Linear, 2019, shows project updates and status changes as part of project history.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/features/detail/DetailPanel.jsx`
- **Acceptance:** Changing project status shows `Saved` and a visible status history entry.

77. **Item:** Task detail/add
- **What it does now:** Task creation still feels like note creation with a task label.
- **What it does after:** Tasks use a compact form: title, due, project, priority, notes.
- **Who's been doing this right the whole time:** Todoist, 2007, makes task entry title-first with project/date/priority close by.
- **Files / routes / components likely touched:** `source/src/features/add/AddModal.jsx`, `source/src/features/workstation/WorkstationViews.jsx`
- **Acceptance:** `New Task` opens a task-specific form and saves due/project/priority without opening a detail panel.

78. **Item:** Day detail
- **What it does now:** It shows day context but does not let me edit enough.
- **What it does after:** It supports add journal, assign task date, and move dated entries.
- **Who's been doing this right the whole time:** Fantastical, 2011, lets users create and edit day items from the calendar context.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/App.jsx`
- **Acceptance:** From a day detail, I assign a task to that date and it appears on that day after reload.

79. **Item:** Journal creation
- **What it does now:** It creates a journal but does not guarantee the daily note loop is one-click.
- **What it does after:** Clicking New Journal opens today's existing journal or creates it once.
- **Who's been doing this right the whole time:** Craft, 2020, made daily notes date-based and easy to revisit.
- **Files / routes / components likely touched:** `source/src/App.jsx`, `source/src/features/workstation/WorkstationViews.jsx`
- **Acceptance:** Clicking `New Journal Entry` twice for the same day opens the same journal, not a duplicate.

80. **Item:** Space actions
- **What it does now:** Space actions create and capture, but saved entries do not show Space context everywhere.
- **What it does after:** Space context appears in entry detail, search result, and filtered lists.
- **Who's been doing this right the whole time:** Notion, 2022, makes Teamspace ownership visible on pages and search surfaces.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/features/detail/DetailPanel.jsx`, `source/src/features/add/AddModal.jsx`
- **Acceptance:** Create a note in a Space, then Search shows that Space on the result.

81. **Item:** Space internals
- **What it does now:** Archive and rename are indirect or absent.
- **What it does after:** Spaces have explicit rename, archive, and unarchive controls.
- **Who's been doing this right the whole time:** Notion, 2022, let workspace admins manage Teamspaces directly.
- **Files / routes / components likely touched:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/workstation/workstationData.js`
- **Acceptance:** I archive a Space, it moves to Archive, then unarchive brings it back with entries intact.

82. **Item:** Compile preview
- **What it does now:** It previews compiled output, but source evidence is not dominant enough.
- **What it does after:** Source evidence sits above the save controls and must be reviewed.
- **Who's been doing this right the whole time:** Readwise Reader, 2022, keeps highlights attached to source context during review.
- **Files / routes / components likely touched:** `source/src/features/constellation/CompilePreviewModal.jsx`, `source/src/App.jsx`
- **Acceptance:** Save as wiki/review is below source evidence, and no save happens without the evidence visible.

83. **Item:** Vault & Recovery
- **What it does now:** It offers vault picker, migrate, export zip, and skipped-file review.
- **What it does after:** Export has preflight: file count, skipped files, estimated size, manifest.
- **Who's been doing this right the whole time:** Time Machine, 2007, made backup state visible before restore decisions.
- **Files / routes / components likely touched:** `source/src/features/settings/SettingsPanel.jsx`, `source/src/lib/vaultExportZip.js`
- **Acceptance:** Pressing export first shows a preflight summary and manifest preview before the zip starts.

84. **Item:** System Health / Updates
- **What it does now:** Runtime health and update checks are split across panels.
- **What it does after:** One Health page shows version, runtime, vault path, update check, relaunch.
- **Who's been doing this right the whole time:** Arc, 2023, keeps update and app version status in one visible app settings area.
- **Files / routes / components likely touched:** `source/src/features/settings/SettingsPanel.jsx`, `source/src/features/settings/UpdatesPanel.jsx`
- **Acceptance:** Opening Safety or System shows version, update status, vault path, and relaunch in one place.

85. **Item:** Entry detail panel
- **What it does now:** It packs edit, delete, voice, links, backlinks, and similar entries into one cramped panel.
- **What it does after:** It splits into Info, Edit, Links, Recovery, Similar.
- **Who's been doing this right the whole time:** Notion, 2018, keeps page properties, comments, backlinks, and page body separated enough to scan.
- **Files / routes / components likely touched:** `source/src/features/detail/DetailPanel.jsx`
- **Acceptance:** Entry detail opens with tabs, and each tab contains only the controls for that job.

## EDIT

86. **Item:** Bases
- **Wrong now:** The product says `Base` and `Smart View` as if normal people signed up for database vocabulary homework.
- **Right after:** Use `Saved filtered list` in helper copy and keep `Base` as the advanced object name only where needed.
- **Who writes copy that doesn't suck here:** Notion, 2018, uses labels like `Table`, `Board`, and `Gallery` where users act, then explains databases underneath.
- **Where it lives:** `source/src/features/bases/BaseExplorer.jsx`, `source/src/features/bases/BaseView.jsx`, `source/src/features/shell/AppRouteContent.jsx`
- **Acceptance:** First-time Base UI says `Saved filtered list`, and I do not need a glossary to know what it does.

87. **Item:** Welcome flow
- **Wrong now:** The first-run path presents too many early choices.
- **Right after:** Show exactly four actions: `Create first note`, `Capture raw thought`, `Create project`, `Load sample vault`.
- **Who writes copy that doesn't suck here:** Raycast, 2020, starts onboarding around immediate actions instead of feature tours.
- **Where it lives:** `source/src/onboarding/WelcomePanel.jsx`
- **Acceptance:** Blank vault welcome renders four primary actions and no extra feature buffet.

88. **Item:** Back/forward buttons
- **Wrong now:** The arrows are tiny and do not say where they lead.
- **Right after:** Disabled arrows show why they are disabled; enabled arrows show destination on hover.
- **Who writes copy that doesn't suck here:** VS Code, 2015, labels command/navigation targets clearly in tooltips.
- **Where it lives:** `source/src/features/workstation/WorkspaceTopBar.jsx`
- **Acceptance:** Hovering Back shows the destination route name, and disabled state is visually obvious.

89. **Item:** Lightning button
- **Wrong now:** The top-bar `lightning` icon is a mystery meat button.
- **Right after:** Replace it with a named command button or remove it.
- **Who writes copy that doesn't suck here:** Linear, 2019, labels creation and command actions instead of hiding major flows behind random symbols.
- **Where it lives:** `source/src/features/workstation/WorkspaceTopBar.jsx`
- **Acceptance:** No unlabeled lightning action remains; the visible control says what it does.

90. **Item:** Avatar/settings entry
- **Wrong now:** Clicking `G` opens settings with no menu or explanation.
- **Right after:** Avatar opens a menu: `Gavin`, vault path, `Settings`, `Privacy`, `About`.
- **Who writes copy that doesn't suck here:** Notion, 2016, made workspace/account menus name the current space and settings path.
- **Where it lives:** `source/src/features/workstation/WorkspaceTopBar.jsx`
- **Acceptance:** Clicking `G` opens a small menu instead of teleporting straight to Settings.

91. **Item:** Save to Project
- **Wrong now:** The disabled `Save to Project` button gives me no useful next move.
- **Right after:** Show `Pick a project to enable this` and provide a project picker.
- **Who writes copy that doesn't suck here:** Linear, 2019, makes project assignment explicit in issue creation.
- **Where it lives:** `source/src/features/add/AddModal.jsx`
- **Acceptance:** The disabled state explains itself, and a project picker can enable the save path.

92. **Item:** Discard / Escape
- **Wrong now:** `Ctrl+Enter` exists as a save affordance but is hidden.
- **Right after:** The primary save row says `Ctrl+Enter to save`.
- **Who writes copy that doesn't suck here:** GitHub, 2012, labels keyboard submit hints on issue/comment flows.
- **Where it lives:** `source/src/features/add/AddModal.jsx`
- **Acceptance:** Capture footer shows the shortcut beside the primary save button.

93. **Item:** Bulk trash
- **Wrong now:** Bulk removal does not show enough consequence before moving files.
- **Right after:** Confirmation says `Move 7 entries to Trash?` and lists the first five titles.
- **Who writes copy that doesn't suck here:** Google Drive, 2012, confirms bulk file removal with count and selected file context.
- **Where it lives:** `source/src/features/shell/AppRouteContent.jsx`, `source/src/App.jsx`
- **Acceptance:** Bulk trash always shows count and sample titles before anything moves.

94. **Item:** Markdown toolbar
- **Wrong now:** Toolbar actions insert generic junk instead of working with selection and real inputs.
- **Right after:** Buttons wrap selected text; link opens an in-app URL field; image opens a file picker; table inserts a usable starter.
- **Who writes copy that doesn't suck here:** Obsidian, 2020, keeps Markdown actions tied to the editor selection and file context.
- **Where it lives:** `source/src/features/notes/NotesWorkspaceView.jsx`
- **Acceptance:** Selecting text and pressing Bold wraps that exact text, and Link asks for the URL inside JotFolio.

95. **Item:** Notes actions menu
- **Wrong now:** Copy, reveal, and more actions are scattered between rail and editor.
- **Right after:** One `Note actions` menu contains `Copy title`, `Copy local path`, `Reveal in Vault`, `Open in Constellation`.
- **Who writes copy that doesn't suck here:** Craft, 2020, keeps document actions grouped in one clear menu.
- **Where it lives:** `source/src/features/notes/NotesWorkspaceView.jsx`
- **Acceptance:** The note header has one actions menu and duplicate action clusters disappear.

96. **Item:** Calendar navigation
- **Wrong now:** The current day depends too much on color and mouse controls.
- **Right after:** Add keyboard arrows and a non-color today marker.
- **Who writes copy that doesn't suck here:** Fantastical, 2011, made day navigation obvious with keyboard and visible date focus.
- **Where it lives:** `source/src/features/workstation/WorkstationViews.jsx`
- **Acceptance:** Arrow keys move the selected day, and today's cell has a text/shape marker that survives low contrast.

97. **Item:** New Space seed project
- **Wrong now:** `Create project seed` sounds like internal machinery.
- **Right after:** Rename to `Create Space Project` and add one line: `Creates a project that anchors this Space.`
- **Who writes copy that doesn't suck here:** Notion, 2022, labels Teamspace setup in plain workspace terms.
- **Where it lives:** `source/src/features/workstation/WorkstationViews.jsx`
- **Acceptance:** The button says `Create Space Project`, and the helper line explains the relationship.

98. **Item:** Constellation filters
- **Wrong now:** Graph filters, style, search, unresolved, memory-only, and scan controls are packed together.
- **Right after:** Use tabs: `Graph Health`, `Filters`, `Style`.
- **Who writes copy that doesn't suck here:** Obsidian, 2020, separates graph filter/search/display controls so the graph panel stays usable.
- **Where it lives:** `source/src/features/constellation/ConstellationView.jsx`
- **Acceptance:** Constellation controls are grouped into three tabs, and Graph Health is the first tab.

99. **Item:** Constellation focal stack
- **Wrong now:** Focal navigation can leave me unsure where I am.
- **Right after:** Always show a breadcrumb with current node path and a reset action.
- **Who writes copy that doesn't suck here:** Roam Research, 2019, made page/block context visible through backlinks and references.
- **Where it lives:** `source/src/features/constellation/ConstellationView.jsx`
- **Acceptance:** Clicking graph nodes updates a visible breadcrumb, and `Reset map` clears it.

100. **Item:** Library settings
- **Wrong now:** These preferences take more space than their importance deserves.
- **Right after:** Keep `Default view`, `Default sort`, and card display in one compact Preferences section.
- **Who writes copy that doesn't suck here:** Bear, 2016, keeps preference panels short and focused.
- **Where it lives:** `source/src/features/settings/SettingsPanel.jsx`
- **Acceptance:** Library preferences fit in one compact group without scrolling past strategic settings.

101. **Item:** Import / Export
- **Wrong now:** `Import/Export` mixes user data tools with sample data and welcome reset.
- **Right after:** Keep JSON/Markdown import/export here; move sample data and welcome reset to Advanced.
- **Who writes copy that doesn't suck here:** Notion, 2016, keeps import/export user-facing and hides debug/reset actions away from normal flow.
- **Where it lives:** `source/src/features/settings/SettingsPanel.jsx`
- **Acceptance:** Import/Export contains only user data movement; sample/demo/reset actions are not there.

102. **Item:** Shortcuts
- **Wrong now:** The shortcuts list is passive.
- **Right after:** Each row can run or demonstrate the command where safe.
- **Who writes copy that doesn't suck here:** VS Code, 2015, made keyboard commands searchable and actionable in the command UI.
- **Where it lives:** `source/src/features/settings/SettingsPanel.jsx`
- **Acceptance:** Clicking the `Ctrl+P` row opens Command Palette, and passive rows are marked as reference only.

103. **Item:** Entry file actions
- **Wrong now:** Rename/move are better than old browser prompts, but conflict handling is not visible enough.
- **Right after:** Every file operation shows before path, after path, and conflict result before submit.
- **Who writes copy that doesn't suck here:** Finder, 1984, shows file names and collision prompts before overwriting or moving.
- **Where it lives:** `source/src/features/shell/EntryFileDialog.jsx`, `source/src/features/detail/DetailPanel.jsx`
- **Acceptance:** Rename and Move Folder dialogs show exact before/after paths and block conflicts with a clear message.

104. **Item:** Electron menu
- **Wrong now:** Some menu commands fire into the renderer without enough visible feedback.
- **Right after:** Every menu command causes an obvious UI change or disabled state.
- **Who writes copy that doesn't suck here:** VS Code, 2015, maps menu commands to visible editor/sidebar/palette state.
- **Where it lives:** `source/src-electron/menus.js`, `source/src/App.jsx`
- **Acceptance:** `Find in Vault` opens Search, `Toggle Sidebar` visibly toggles sidebar, and disabled commands do not pretend to work.

## ADD

105. **Feature:** Tag Manager rename/merge/delete/description/affected-entry preview
- **What it does:** Lets me clean tag sprawl without manually editing every note.
- **Who's had this for years:** Obsidian Tag Wrangler plugin, 2020, let users rename tags across a vault.
- **Where it lives:** Tags / Tag Manager route.
- **Minimum viable shape:** Rename and merge tags with an affected-entry count before apply.
- **Files / routes / components needed for v1:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/lib/storage.js`, `source/src/App.jsx`
- **Acceptance:** Rename `#foo` to `#bar`, see affected count, confirm, and every entry updates.

106. **Feature:** Template variable preview
- **What it does:** Shows exactly what a template will insert before it touches the active note.
- **Who's had this for years:** Notion, 2019, previewed templates through page creation flows and database templates.
- **Where it lives:** Templates route, Capture template picker, Notes insert template flow.
- **Minimum viable shape:** A preview pane with resolved title/date variables before insert.
- **Files / routes / components needed for v1:** `source/src/features/templates/TemplatesPanel.jsx`, `source/src/features/templates/InsertTemplateModal.jsx`, `source/src/features/add/AddModal.jsx`
- **Acceptance:** Choosing a template shows resolved body text before `Apply`.

107. **Feature:** Canvas Explorer thumbnails
- **What it does:** Shows a visual clue for each canvas instead of text-only rows.
- **Who's had this for years:** Miro, 2011, made boards recognizable from visual previews.
- **Where it lives:** Canvas Explorer route.
- **Minimum viable shape:** Last-edited timestamp plus a tiny generated preview from card positions.
- **Files / routes / components needed for v1:** `source/src/features/canvas/CanvasExplorer.jsx`, `source/src/features/canvas/CanvasView.jsx`
- **Acceptance:** Canvas list shows preview tiles and last edited time for each canvas.

108. **Feature:** Top search live results popover
- **What it does:** Typing in the top search field immediately shows top vault results below it.
- **Who's had this for years:** Raycast, 2020, shows live results while typing in the launcher.
- **Where it lives:** Top bar search field.
- **Minimum viable shape:** Top five results, type badges, Enter opens first result.
- **Files / routes / components needed for v1:** `source/src/features/workstation/WorkspaceTopBar.jsx`, `source/src/lib/workstation/workstationData.js`, `source/src/App.jsx`
- **Acceptance:** Type in the top field and a result popover appears without navigating away first.

109. **Feature:** Sidebar tag pinning and collapse
- **What it does:** Keeps huge tag lists from eating the sidebar.
- **Who's had this for years:** Slack, 2015, let users star/pin channels and collapse long sections.
- **Where it lives:** Sidebar tags section.
- **Minimum viable shape:** Pin/unpin tag and collapse the full tag list.
- **Files / routes / components needed for v1:** `source/src/features/sidebar/Sidebar.jsx`, `source/src/lib/storage.js`
- **Acceptance:** A pinned tag stays visible after reload while the full tag list remains collapsed.

110. **Feature:** Sidebar folder inline actions
- **What it does:** Creates, renames, moves, and deletes folders where the folder tree actually lives.
- **Who's had this for years:** Obsidian, 2020, put folder create/rename/delete in the file explorer context menu.
- **Where it lives:** Sidebar folder tree.
- **Minimum viable shape:** New folder, rename folder, move folder, delete with affected-file count.
- **Files / routes / components needed for v1:** `source/src/features/sidebar/Sidebar.jsx`, `source/src/App.jsx`, `source/src/lib/vaultPaths.js`
- **Acceptance:** Right-click or menu on a folder shows actions and delete lists affected files.

111. **Feature:** Clickable vault status bar segments
- **What it does:** Turns status into action: vault opens settings, trash opens Trash, issues open skipped-file review, semantic opens Graph Health.
- **Who's had this for years:** VS Code, 2015, made status bar segments clickable for branch, errors, sync, and language mode.
- **Where it lives:** Bottom vault status bar.
- **Minimum viable shape:** Four clickable segments with labels and destinations.
- **Files / routes / components needed for v1:** `source/src/features/workstation/WorkstationViews.jsx`, `source/src/App.jsx`
- **Acceptance:** Clicking `Trash 3` opens Trash; clicking `issues` opens Vault & Recovery.

112. **Feature:** Project picker in Capture
- **What it does:** Lets me choose a project when saving from non-project contexts.
- **Who's had this for years:** Todoist, 2007, lets tasks choose a project during entry.
- **Where it lives:** Capture modal footer or metadata area.
- **Minimum viable shape:** Recent projects dropdown, search, selected project shown in title bar.
- **Files / routes / components needed for v1:** `source/src/features/add/AddModal.jsx`, `source/src/App.jsx`
- **Acceptance:** From a normal note capture, I pick a project and the saved entry appears under that project.

113. **Feature:** Notes split preview
- **What it does:** Shows edit and rendered Markdown side-by-side.
- **Who's had this for years:** Typora, 2016, made Markdown preview immediate; Obsidian, 2020, added edit/preview workflows.
- **Where it lives:** Notes editor mode controls.
- **Minimum viable shape:** `Edit`, `Preview`, `Split` buttons with split using the same Markdown renderer.
- **Files / routes / components needed for v1:** `source/src/features/notes/NotesWorkspaceView.jsx`, `source/src/features/notes/NotesWorkspaceView.css`
- **Acceptance:** Press `Split` and the editor shows source on the left and rendered Markdown on the right.

114. **Feature:** Canvas snap, multi-select, keyboard delete, visible edge labels
- **What it does:** Makes the board controllable enough for real planning.
- **Who's had this for years:** Figma, 2016, shipped multi-select, alignment, and keyboard delete as basic canvas behavior.
- **Where it lives:** Canvas board.
- **Minimum viable shape:** Shift-click multi-select, Delete removes selected cards, edge labels always visible when set.
- **Files / routes / components needed for v1:** `source/src/features/canvas/CanvasView.jsx`
- **Acceptance:** Select two cards, press Delete, confirm, and both leave the canvas; edge labels remain visible.

115. **Feature:** Tag suggestions ranked from this vault
- **What it does:** Ranks tag suggestions from the user's actual vault before any stock words appear.
- **Who's had this for years:** Bear, 2016, made tag entry lightweight by reusing existing tags as the first-class path.
- **Where it lives:** Capture modal tag field.
- **Minimum viable shape:** Existing vault tags sorted by frequency and recent use, with semantic suggestions clearly marked as suggestions.
- **Files / routes / components needed for v1:** `source/src/features/add/AddModal.jsx`, `source/src/lib/workstation/workstationData.js`, `source/src/lib/hooks/useSemanticIndex.js`
- **Acceptance:** Typing in the Capture tag field shows real vault tags first, and generic stock tags do not appear above actual user tags.

## PRIORITY STACK WITH COMPETITIVE SHAME

### SHIP THIS WEEK BEFORE ANYONE ELSE NOTICES

1. AI Setup main route - Obsidian, 2020, shipped notes without a fake AI nav item; JotFolio should remove this before it looks desperate.
2. Notifications bell - Bear, 2016, did not fake notifications; JotFolio should not either.
3. Podcast capture type - Raindrop.io, 2013, saves media links as bookmarks; JotFolio's fake podcast type should go.
4. Video capture type - Readwise Reader, 2022, treats video saves with source context; JotFolio's generic video type should go.
5. Attachment tab - Craft, 2020, shows attachments as blocks; JotFolio's vague tab should go until real.
6. Semantic edges / MiniLM suggestions - Obsidian, 2020, earns graph edges from explicit links; JotFolio cannot draw ghost edges before review and undo.
7. Command Center - Linear, 2019, opens around real assigned work while JotFolio still has dashboard filler.
8. Inbox - Things 3, 2017, turns Inbox items into filed tasks faster than JotFolio sorts raw captures.
9. Projects - Linear, 2019, makes projects operational; JotFolio's project cards need next action and linked work now.
10. Tasks - Todoist, 2007, edits task metadata from context; JotFolio cannot force detail-panel trips for basic task work.
11. Settings - Arc, 2023, keeps settings grouped; JotFolio needs Preferences, Safety, Advanced.
12. Welcome flow - Raycast, 2020, gets users to action fast; JotFolio needs four choices, not a buffet.
13. Top search live results popover - Raycast, 2020, shows results while typing, so the top search field cannot stay passive.
14. Capture button - Things 3, 2017, uses context for new tasks; JotFolio needs context-aware capture.
15. Journal capture - Craft, 2020, has daily notes handled; JotFolio needs date-first journal capture now.
16. Article capture - Readwise Reader, 2022, pulls source metadata; JotFolio needs URL intelligence.
17. Link capture - Raindrop.io, 2013, handles bookmarks cleanly; JotFolio needs domain, title, and duplicate warnings.
18. Source URL field - Raindrop.io, 2013, treats duplicates as cleanup; JotFolio needs normalized matching.
19. Inbox conversion - Things 3, 2017, turns Inbox items into organized work; JotFolio needs raw-to-note/task/link now.
20. Search detail rail - Raycast, 2020, drives search with keyboard selection; JotFolio needs Enter-to-open.
21. Project detail rail - Linear, 2019, puts project state and work together; JotFolio needs the same.
22. Task detail/add - Todoist, 2007, made compact task entry obvious; JotFolio needs a task-specific form.
23. Journal creation - Craft, 2020, makes daily notes easy to revisit; JotFolio needs one-click idempotent journals.
24. Vault & Recovery - Time Machine, 2007, made backup state obvious; JotFolio export needs preflight before more automation.
25. Tag Manager rename/merge/delete/description/affected-entry preview - Obsidian Tag Wrangler, 2020, renames tags across vaults; JotFolio needs merge and affected-entry preview.
26. Project picker in Capture - Todoist, 2007, lets tasks pick projects at entry; JotFolio needs this in Capture.
27. Notes split preview - Typora, 2016, proved split/preview matters; JotFolio needs split view.
28. Markdown toolbar - Obsidian, 2020, works with selected text; JotFolio needs useful inserts.
29. Entry file actions - Finder, 1984, names before/after file operations; JotFolio needs path preview and conflict copy.
30. Command Center session goals / priorities / reflection copy - Linear, 2019, shows actual work instead of fake coaching; JotFolio should cut the filler.

### CATCH-UP WORK

1. Calendar - Craft, 2020, already handles daily notes better; JotFolio can leap by tying journals to graph health.
2. Spaces - Notion, 2022, made Teamspaces manageable; JotFolio can leap with local Space health and rules.
3. All Entries - Obsidian, 2020, keeps file lists secondary; JotFolio should stop treating the library like home.
4. Bases - Notion, 2018, explains views through tables and boards; JotFolio needs plain `saved filtered list` copy.
5. Template variable preview - Notion, 2019, made templates visible at creation; JotFolio needs resolved preview.
6. Canvas Explorer thumbnails - Miro, 2011, uses visual board previews; JotFolio needs thumbnails.
7. Back/forward buttons - VS Code, 2015, labels navigation and commands clearly; JotFolio needs destination tooltips.
8. Lightning button - Linear, 2019, labels real commands; JotFolio should stop hiding action behind a mystery icon.
9. Avatar/settings entry - Notion, 2016, gives account/workspace menus context; JotFolio needs a real avatar menu.
10. Sidebar tag pinning and collapse - Slack, 2015, solves long sidebar lists; JotFolio needs pinned tags.
11. Sidebar folder inline actions - Obsidian, 2020, handles folders in the file explorer; JotFolio should too.
12. Clickable vault status bar segments - VS Code, 2015, made status actionable; JotFolio's status bar needs destinations.
13. Canvas capture - Obsidian Canvas, 2022, creates canvases as boards; JotFolio should stop using a note-shaped form.
14. Save to Project - Linear, 2019, makes project assignment explicit; JotFolio needs a picker when disabled.
15. Discard / Escape - GitHub, 2012, labels keyboard submit hints; JotFolio needs `Ctrl+Enter` visible.
16. Inbox project attach - Linear, 2019, attaches issues to projects from context; JotFolio needs recent project attach.
17. Inbox archive/trash - Gmail, 2004, separates Archive from Trash; JotFolio needs that same split.
18. Bulk trash - Google Drive, 2012, confirms bulk removal with count; JotFolio needs the same guard.
19. Search object actions - Notion, 2021, labels result types; JotFolio needs stronger badges and keyboard filters.
20. Focus mode tabs - Things 3, 2017, changes working lists by mode; JotFolio tabs need to change actions, not tone.
21. Pinned/recent items - Slack, 2019, pins important work; JotFolio needs manual pins.
22. Notes actions menu - Craft, 2020, groups document actions; JotFolio needs one note actions menu.
23. New entry with project context - Linear, 2019, shows issue context while creating; JotFolio needs target context in Capture.
24. New canvas from project - Obsidian Canvas, 2022, turns notes into cards; JotFolio needs seeded project canvases.
25. Project metadata - Linear, 2019, records project updates; JotFolio needs visible save feedback and status history.
26. Day detail - Fantastical, 2011, edits day items in place; JotFolio needs editable day context.
27. Space actions - Notion, 2022, shows Teamspace context on pages; JotFolio needs Space visible in entries and search.
28. New Space seed project - Notion, 2022, labels Teamspace setup plainly; JotFolio needs non-weird wording.
29. Space internals - Notion, 2022, manages Teamspaces directly; JotFolio needs archive, unarchive, rename.
30. Constellation filters - Obsidian, 2020, separates graph display and filter controls; JotFolio needs tabs.
31. Constellation focal stack - Roam Research, 2019, keeps link context visible; JotFolio needs breadcrumbs.
32. Compile preview - Readwise Reader, 2022, keeps source evidence attached; JotFolio needs evidence above save.
33. Library settings - Bear, 2016, keeps settings compact; JotFolio needs less preference sprawl.
34. System Health / Updates - Arc, 2023, keeps app/update status clear; JotFolio needs one Health page.
35. Import / Export - Notion, 2016, separates import/export from reset/debug actions; JotFolio needs Advanced.
36. Shortcuts - VS Code, 2015, makes commands searchable and actionable; JotFolio needs clickable demos.
37. Entry detail panel - Notion, 2018, separates page properties and related surfaces; JotFolio needs tabs.
38. Electron menu - VS Code, 2015, makes menu commands visibly affect UI; JotFolio needs renderer feedback.
39. Compile raw to memory in Inbox - Readwise Reader, 2022, keeps Inbox simple; JotFolio should move compile out of triage.
40. Command Center capture-mode quick composer - Raycast, 2020, keeps one launcher path; JotFolio should remove duplicate capture.
41. Command Center planning / review panels - Things 3, 2017, focuses review on real tasks; JotFolio should remove filler panels.
42. Project Smart View shortcut - Notion, 2018, keeps views inside databases; JotFolio should not hide Bases behind projects.
43. Calendar graph/link/review action cluster - Fantastical, 2011, keeps day views on dated work; JotFolio should cut the junk drawer.
44. Split memory modal in normal UI - Readwise Reader, 2022, keeps advanced cleanup in review; JotFolio should hide split until trust work is mature.
45. Appearance theme sprawl - Linear, 2019, ships tight appearance settings; JotFolio should stop drowning users in knobs.
46. Extensions panel - Bear, 2016, wins by focus without plugins; JotFolio should hide plugins until install/use is real.
47. Public npm scripts as product surface - Notion, 2016, never exposes build scripts to users; JotFolio should keep scripts in developer docs.

### ORIGINAL GROUND

1. Constellation - Obsidian, 2020, owns graph display, but JotFolio can make the graph a repair tool instead of graph sightseeing.
2. Calendar navigation - Fantastical, 2011, owns calendar movement, but JotFolio can tie date navigation to journals and local review memory.
3. Canvas board - Figma, 2016, owns canvas controls, but JotFolio can make those controls local-vault aware.
4. Tag suggestions ranked from this vault - Bear, 2016, keeps tagging light, but JotFolio can mix vault frequency with local semantic context.

## COUNT CHECK

- HIGH SIGNAL blocks: 34
- REMOVE blocks: 16
- CHANGE blocks: 35
- EDIT blocks: 19
- ADD blocks: 11
- Total action blocks: 34 + 16 + 35 + 19 + 11 = 115
- Priority stack action items: 30 + 47 + 4 = 81
- Four action buckets ranked: REMOVE + CHANGE + EDIT + ADD = 16 + 35 + 19 + 11 = 81
