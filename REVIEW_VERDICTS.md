# JotFolio Review Verdicts

Phase 1 inventory count: 115.

## HIGH SIGNAL

1. 3 - Search / Quick Switcher route. I open `Search / Quick Switcher` and this is one of the few surfaces that understands how I actually work: type, jump, keep moving. Raycast wins because it treats search as a command layer, and JotFolio is closest to that here.

2. 5 - Notes route. I open `Notes` and I finally get something that resembles a real Markdown workbench instead of a toy text box. Obsidian still beats it on speed and plugin depth, but this is the right center of gravity for JotFolio.

3. 12 - Trash route. I open `Trash` and the restore / delete split is the kind of boring safety this app needs more of. Obsidian makes deletion feel recoverable; JotFolio is moving in that direction here.

4. 28 - Capture modal: note type. I click `Capture`, pick `Note`, and the local path lands in `notes/...md`, which is exactly the file-based promise. This earns its place because it creates real Markdown instead of database fog.

5. 34 - Capture modal: project type. I pick `Project` and the app now treats projects as their own type instead of pretending a note is enough. Linear is better at project structure, but JotFolio at least has the right primitive now.

6. 35 - Capture modal: task type. I pick `Task` and the preview path becomes `tasks/Review smoke task.md`; that is a real object, not fake UI. Todoist is cleaner for task entry, but local Markdown tasks make sense for this product.

7. 37 - Capture modal: raw type / Save to Inbox. I pick `Raw` and `Save to Inbox` matches the messy capture-first workflow. Readwise Reader is good because it respects rough input before cleanup; this is JotFolio's version of that.

8. 40 - Capture modal: template picker and Apply Template. I apply a template and it actually writes structured body content into the capture. Craft handles templates with more polish, but JotFolio having real local templates is high-value.

9. 41 - Capture modal: vault bucket and local path preview. I watch the path change when I switch types, and that makes the local-first promise visible. Most apps hide storage until export day; JotFolio shows the file target up front.

10. 45 - Inbox list, filters, and raw capture queue. I open `Inbox` and it is the correct holding pen for unsorted junk. Notion databases can do this, but JotFolio needs it more because capture is the front door.

11. 51 - Search query field and category tabs. I type into search and the app gives me a broad vault view instead of making me guess where the thing lives. Obsidian search is still faster, but this is a serious surface.

12. 53 - Quick Switcher overlay. I hit `Ctrl+O` and the switcher is the right power-user shortcut. Obsidian's quick switcher is the model here: open anything without touching navigation.

13. 54 - Command Palette overlay. I hit `Ctrl+P` and get a command surface that belongs in a desktop workspace. Raycast and VS Code prove this pattern works; JotFolio should keep expanding actual commands here.

14. 61 - Notes open tabs and note selection rail. I open Notes and the tab row plus left list make it feel like an editor, not a form. Obsidian does this better, but the shape is correct.

15. 62 - Notes Markdown editor and autosave. I edit Markdown and the app treats the body as the main event. That is the product; everything else should justify why it exists around this.

16. 65 - Notes metadata editor. I can edit status, project, date, and tags near the note instead of hunting through Settings. Tana makes metadata first-class; JotFolio should protect this direction.

17. 66 - Notes backlinks / unresolved links rail. I open the rail and backlinks show me graph context where it matters. Logseq and Obsidian both prove backlinks are not decoration; they are navigation.

18. 67 - Create missing note from unresolved link. I click `Create` on an unresolved link and that is exactly how a wiki should grow. This is one of the clearest bridges between writing and graph-building.

19. 69 - Projects list, cards, filters, sort, and layout. I open `Projects` and the filters plus layout controls give it enough structure to be more than a tag page. Linear is still sharper, but this has a real product role.

20. 75 - Tasks route grouping: open, today, overdue, done. I open `Tasks` and the grouping matches how I triage work. Things and Todoist are better at capture speed, but the buckets are correct.

21. 76 - Task checkbox and status update. I click a task checkbox and it changes the underlying entry status. That is small, concrete, and much better than a checkbox-looking decoration.

22. 82 - Spaces list, filter, sort, and status. I open `Spaces` and it finally feels like a real page instead of a sidebar afterthought. Anytype's spaces are heavier, but the idea fits JotFolio well.

23. 83 - Selected Space metrics and health panels. I select a Space and see entries, projects, tasks, and health in one place. That is useful because a Space should answer "what is happening here?" without a scavenger hunt.

24. 87 - Constellation layout, style, and background controls. I open `Constellation` and the controls are real enough to shape how the map behaves. Obsidian Graph has knobs too, and JotFolio needs these because one graph view will not fit every vault.

25. 90 - Graph Health / Relationship Scan panel. I open `Relationship Scan` and this is the best product idea in the app. Obsidian shows a graph; JotFolio can win by telling me what is missing, stale, disconnected, or worth linking.

26. 91 - Relationship decision actions: accept, reject, ignore, clear. I want AI suggestions to ask, not vandalize my notes, and these decision states are the right safety layer. Tana and Mem drift into magic too easily; JotFolio should stay review-first.

27. 93 - Memory detail panel: confirm, split, trace, close. I open a memory and `Confirm`, `Split`, and `Trace claims to sources` are the right primitives for trust. The close affordance was necessary because getting trapped in a panel is unacceptable.

28. 96 - Canvas list, create, open, and delete. I open Canvas and the list/create/open/delete flow has a clear reason to exist. Obsidian Canvas is the obvious comparison, and JotFolio needs this for visual planning.

29. 98 - Base explorer list, create, open, delete. I open Bases and the explorer gives saved views a home. Notion databases do this with more confidence, but a local Markdown vault needs queryable views.

30. 99 - Base view filters, sorts, columns, and table/card/gallery views. I use filters and sorts and they turn entries into something closer to a working database. This is one of the few places JotFolio can compete with Notion without selling out to cloud storage.

31. 105 - AI Keys settings: provider, key, model, test connection. I open `AI Keys` and the copy says provider setup only, which is honest. That is better than a fake AI chat tab that pretends the product has source-grounded answers today.

32. 109 - Privacy settings and telemetry opt-in. I open `Privacy` and opt-in crash reporting belongs in a local-first app. Bear and Obsidian win trust by staying quiet with user data; JotFolio must keep this explicit.

33. 114 - Electron preload API: vault, app, snapshots, updater, telemetry, plugin placeholder. I care that disk access runs through a narrow bridge instead of a renderer free-for-all. That is invisible to most users, but it protects the whole product.

34. 115 - Keyboard shortcuts and input affordances. I press `Ctrl+K`, `Ctrl+O`, `Ctrl+P`, `N`, `/`, and `Escape`, and the app mostly behaves like a desktop tool. VS Code and Obsidian set the bar here; JotFolio is right to copy that muscle memory.

## REMOVE

35. 10 - AI Setup route. I click `AI Setup` in the main sidebar and it tells me chat is not ready. Then get it out of main navigation; Settings already has `AI Keys`, and a dead main route smells like hype.

36. 23 - Notifications bell. I click the bell and it just dumps me into Inbox. If there are no real notifications, the bell is theater; remove it until it has actual alerts, due reviews, sync trouble, or failed saves.

37. 31 - Capture modal: podcast type. I pick `Podcast` and it is just another Markdown capture with a different icon. Readwise Reader handles podcasts with transcript, source, and progress context; JotFolio should remove this type until it does something podcast-specific.

38. 32 - Capture modal: video type. I pick `Video` and again get a generic form. If there is no timestamp, transcript, channel/source handling, or watch state, this is fake categorization.

39. 42 - Capture modal: attachment drop / Attachment tab. I click `Attachment` and it feels like a promise without a proper attachment manager. Either show attached files with open/remove/reveal actions or remove the tab.

40. 49 - Inbox compile raw to memory. I click compile-style flows and the product language gets too big too fast. Until source claim review is painfully clear, `Compile raw to memory` should not sit beside normal Inbox actions.

41. 58 - Command Center session goals / priorities / reflection copy. I open Command Center and see session-goal language that feels generated, not earned. Linear shows actual assigned work; JotFolio should remove fake coaching copy.

42. 59 - Command Center capture-mode quick composer. I switch modes and the capture bits compete with the real `Capture` button. One capture front door is enough.

43. 60 - Command Center planning / review mode panels. I click around planning and review modes and they feel like dashboard filler. If the panels do not create or change real vault work, cut them.

44. 73 - Project Smart View creation. I click the project smart view action and it creates another abstract object I now have to understand. Notion gets away with databases because they are central; JotFolio should remove this shortcut until Bases are clearly explained.

45. 81 - Calendar link, review memory, and graph actions. I open a day detail and the action cluster feels like a junk drawer. Keep journal creation, but remove graph/review/link shortcuts until calendar has a real planning flow.

46. 92 - Semantic edges / MiniLM relationship suggestions. I do not want invisible meaning-math drawing edges unless I can audit every suggestion. Hide semantic edges until Graph Health has review cards, reasons, and undo.

47. 95 - Split memory modal. I open memory tooling and `Split` is too advanced for the current product state. Keep the idea in the engine, but remove it from normal UI until memory review is mature.

48. 101 - Appearance settings: theme, mode, scale, font, colors, density, Constellation style. I open Appearance and there are too many knobs for an app that still has unfinished workflows. Keep dark/light, scale, and font; remove theme sprawl from the main path.

49. 108 - Extensions / plugins panel. I open `Extensions` and it reads like future architecture exposed too early. Obsidian plugins work because the ecosystem exists; JotFolio should hide this until a normal user can install one safely.

50. 113 - Public npm scripts: dev, build, preview, test, electron, bench, a11y. I am a user, not the repo maintainer, so these are not product features. Keep them for developers, but do not let scripts or build vocabulary leak into product planning as if users care.

## CHANGE / EDIT / ADD

51. 1 - Command Center route. I open Command Center and it still feels like a dashboard trying to justify itself. Make it a real home: resume last note, process Inbox, open active project, continue today's task.

52. 2 - Inbox route. I open Inbox and the shape is right, but processing is still too fuzzy. Make every raw capture show three clear buttons: `Make note`, `Make task`, `Make link`.

53. 4 - Projects route. I open Projects and it has controls, but the product needs stronger project anatomy. Add milestones, next action, linked notes, open tasks, and recent changes before adding more views.

54. 6 - Calendar route. I open Calendar and it looks useful, but it is not yet as practical as Cron, Fantastical, or Google Calendar for planning. Make it a journal and review calendar first, not a fake scheduling app.

55. 7 - Constellation route. I open Constellation and the map is interesting, but graph pictures alone do not pay rent. Make Graph Health the default panel because that tells me what to fix.

56. 8 - Tasks route. I open Tasks and the buckets are good, but entry editing is still too split between the row and detail panel. Add fast inline due date, priority, project, and repeat-free status changes.

57. 9 - Spaces route. I open Spaces and the new page is the right move, but it needs stronger editing. Add rename, archive, color naming, and rules that visibly apply to entries.

58. 11 - Settings route. I open Settings and it is crowded because it holds real settings plus half the product's unfinished concepts. Split it into `Preferences`, `Safety`, and `Advanced` so normal users do not drown.

59. 13 - Tags / Tag Manager route. I open Tag Manager and it filters tags, but it does not manage them enough. Add rename, merge, delete, description, and affected-entry preview like Bear and Obsidian users expect.

60. 14 - Templates route. I open Templates and the editor exists, but applying templates is still too hidden. Put template use directly in Notes and Capture with variable preview before insertion.

61. 15 - Canvas Explorer route. I open Canvas Explorer and it is a list gate before the real canvas. Add thumbnails or last-edited previews, because a visual tool with text-only rows is missing the point.

62. 16 - Base / Smart View route. I open a Base and it is powerful but under-explained. Notion makes the database mental model obvious; JotFolio needs plain copy like "saved filtered list" everywhere.

63. 17 - All Entries / Library route. I open the library and it is useful, but it is now less important than Notes, Inbox, Search, and Spaces. Keep it as `All Entries`, but stop making it feel like the home screen.

64. 18 - Welcome flow. I start from a blank vault and the first-run path needs fewer choices. Show four actions only: create note, capture raw thought, create project, load sample vault.

65. 19 - Back / forward navigation buttons. I click the arrows and they work, but they are visually too small for how often navigation breaks flow. Add disabled tooltips and show the destination on hover.

66. 20 - Top search field. I click the top search field and it routes to Search, but the field itself feels passive. Make typing there immediately search the vault and show top results below it, like Raycast.

67. 21 - Capture top-bar button. I click `Capture` and it opens the right modal, but it defaults to note even when context suggests another type. On Projects, default project-related capture; on Spaces, carry that Space.

68. 22 - Quick action lightning button. I click the lightning button and it is not obvious what it means. Rename or replace it with a real visible action, because mystery icons waste clicks.

69. 24 - User avatar / settings entry. I click the `G` avatar and it opens settings, which is fine but not discoverable. Add a small menu with profile name, vault path, Settings, Privacy, and About.

70. 25 - Sidebar tag shortcuts. I click a tag and it filters entries, but the sidebar becomes huge in real vaults. Add tag pinning and collapse long tag lists.

71. 26 - Sidebar folder tree. I open folders and it matters because files are the product. Add rename/move/create actions inline and make folder deletion warnings show exactly what files move.

72. 27 - Vault status bar. I read the status bar and it tells me local vault, entry count, trash, issues, and semantic state. Make each segment clickable so status becomes action, not wallpaper.

73. 29 - Capture modal: journal type. I pick Journal and it preloads a daily template, which is close. Make journal date front-and-center and route saved journals to Calendar automatically.

74. 30 - Capture modal: article type. I pick Article and it still relies on manual source paste. Add title extraction and duplicate source detection strong enough to feel like Readwise Reader.

75. 33 - Capture modal: link type. I pick Link and it should behave like a bookmark manager. Add fetch-title, domain display, duplicate warning, and open-source preview.

76. 36 - Capture modal: canvas type. I pick Canvas and it creates a canvas, but the capture form still looks like a note form. Give Canvas its own slim dialog: name, description, seed cards.

77. 38 - Capture modal: Source URL field and Open source URL. I paste a URL and the validation is good, but the field is dumb. Add duplicate detection by normalized URL and show the existing entry before save.

78. 39 - Capture modal: tags and tag suggestions. I use tags and the local suggestions are useful, but the default suggestion list still feels generic. Rank tags from this vault first, not stock words.

79. 43 - Capture modal: Save to Project. I see `Save to Project` disabled unless a project context exists, which is honest. Show why it is disabled and let me pick a project right there.

80. 44 - Capture modal: discard / Escape flow. I press Escape in the title field and the discard guard appears. That is the right behavior; add `Ctrl+Enter` text near the save button so the shortcut is discoverable.

81. 46 - Inbox processing actions: make note / task / link. I want Inbox to be the sorting station, not just another list. Add conversion buttons that preserve the original id or write a clear conversion trace.

82. 47 - Inbox attach-to-project behavior. I try to connect raw captures to projects and the flow is not obvious enough. Add a project picker with recent projects first.

83. 48 - Inbox archive / trash actions. I want to clear Inbox without destroying work. Add Archive as its own state and keep Trash for actual removal.

84. 50 - Bulk selection and bulk trash. I select multiple entries and can move them to trash, which is useful but risky. Add a confirmation that lists count and first few titles.

85. 52 - Search result detail rail and Open action. I click a result and the detail rail helps, but the search route still makes me work too hard to act. Add keyboard selection, Enter to open, and preview hotkeys.

86. 55 - Search actions for tags, spaces, canvases, bases, templates, and entries. I search across object types and that is the right breadth. Make result type badges stronger and let me filter by object type with the keyboard.

87. 56 - Command Center focus mode tabs. I switch focus modes and the UI changes, but the payoff is thin. Each mode should change the first three actions, not just the vibe.

88. 57 - Command Center pinned / recent item actions. I click recent items and that part is useful. Let me pin notes/projects manually and sort pins by drag or recent use.

89. 63 - Notes preview mode. I switch to Preview and it works, but it should be side-by-side as an option. Obsidian users expect edit, preview, and split view.

90. 64 - Notes Markdown toolbar. I click toolbar buttons and some inserted values still feel generic. Toolbar inserts should be useful by default: selected text wrap, URL prompt in-app, image picker, table starter.

91. 68 - Notes reveal / copy / more actions. I open More and get copy/reveal actions, but they are scattered between rail and editor. Consolidate note actions into one menu with clear labels.

92. 70 - Project detail rail. I open a project and the rail should be the project command center. Add next action, milestone, recent note, task rollup, and status edit.

93. 71 - New entry with project context. I create an entry from a project and context carrying is correct. Make the project relationship visible in the capture title bar so I know where the entry will land.

94. 72 - New canvas from a project. I click new canvas from a project and it should seed the canvas with project notes and tasks. A blank canvas from project context is a missed chance.

95. 74 - Project status and tags editing. I edit project metadata and it should save fast, but the controls need more confidence. Add inline save feedback and history of status changes.

96. 77 - Task detail / open / add task actions. I add a task and can open it, but the task form is too note-like. Give tasks a compact form with title, due, project, priority, and notes below.

97. 78 - Calendar month / week / day navigation. I move through Calendar views and the controls are acceptable. Add keyboard arrows and a visible current-day marker that does not depend on color alone.

98. 79 - Calendar day detail rail. I open a day and the detail panel shows entries, reviews, projects, tags, and path. Make it editable: add journal, assign task date, drag entry to date.

99. 80 - Calendar journal creation. I click `New Journal Entry` and that is the calendar's strongest use. Make daily journals one-click and idempotent, so today's journal opens if it already exists.

100. 84 - Space actions: create note, capture, open graph. I click the Space actions and they are useful, but they need to carry space context everywhere. The entry detail and search result should show the Space afterwards.

101. 85 - New Space seed project. I create a space seed and it becomes a project, which is a clever bridge but not obvious. Rename the action to `Create Space Project` and explain it in one line.

102. 86 - Space filtered list, tags, task checkbox, and archive view. I use Space internals and it starts to feel like a work room. Add archive/unarchive and rename instead of hiding behind status filters.

103. 88 - Constellation filters, title search, unresolved toggle, memory-only toggle. I use the graph filters and they help, but the controls are visually dense. Move Graph Health, filters, and style into clear tabs.

104. 89 - Constellation node open, focal stack, reset, zoom, and pan. I click nodes and the focal stack is useful, but it is still easy to get lost. Add a minimap or breadcrumb that always explains where I am.

105. 94 - Compile preview modal: save as wiki or review. I preview compile output and the review gate is the right idea. Make source evidence impossible to miss before saving.

106. 97 - Canvas board cards, edges, pan, zoom, edit, and remove. I use the board and it works like an early Obsidian Canvas clone. Add snap, multi-select, keyboard delete, and visible edge labels.

107. 100 - Templates create, edit, save, apply, variables, and backlinks. I create and edit templates, but variables need a real preview. Show exactly what will be inserted into the active note.

108. 102 - Vault & Recovery settings: vault picker, migrate, export zip, skipped files. I open Vault & Recovery and this is critical, but export needs a preflight. Show file count, skipped files, estimated size, and manifest before export.

109. 103 - Library settings: default view, sort, card display. I change defaults and they make sense, but these are preferences, not strategy. Keep them compact and out of the way.

110. 104 - System Health and Updates settings. I open System Health and Updates and they answer important questions, but they are split. Combine version, runtime, update check, vault path, and relaunch into one health page.

111. 106 - Import / Export settings: JSON, Markdown, sample data, welcome reset. I open Import/Export and it mixes user backup tools with demo/dev tools. Move sample data and welcome reset into Advanced.

112. 107 - Shortcuts settings reference. I open Shortcuts and the list is helpful, but passive. Add editable shortcuts later or at least clickable actions that demonstrate the shortcut.

113. 110 - Entry detail panel: edit, save, delete, voice input, links, backlinks, similar entries. I open an entry detail and it is powerful but cramped. Split it into tabs: Info, Edit, Links, Recovery, Similar.

114. 111 - Entry file actions: reveal, rename file, move folder, snapshots. I use rename and move and the app finally stopped using browser prompts, which matters. Add conflict previews and show the exact before/after path in every file operation.

115. 112 - Electron menu: File, Edit, View, Window, Help. I use the menu and it has the right desktop actions, but several menu commands need visible confirmation in the renderer. If `Toggle Detail` or `Find in Vault` fires, the UI should clearly move.

## Coverage Math

- HIGH SIGNAL: 34
- REMOVE: 16
- CHANGE / EDIT / ADD: 65
- Total: 34 + 16 + 65 = 115
- Phase 1 inventory count: 115
