# Phase 1 Audit — Category 1: CODE SURFACE inventory

Repo: `C:\Dev\Projects\JotFolio`. Branch `phase2/5174-transformation` @ `18af965`.
Source root: `C:\Dev\Projects\JotFolio\source\`.

Read-only inventory. No test writing in this phase.

## 1.1 Route handlers

JotFolio is an SPA. "Routes" = `section` string values driving `AppRouteContent.jsx`. Section state lives in `App.jsx` (`useState('command')` initial — `HOME_SECTION` from `appShellState.js:5`). Workstation set declared at `appShellState.js:7`. The route table:

| # | Section ID | Source file:line | What it renders |
|---|---|---|---|
| 1 | `command` (HOME_SECTION) | AppRouteContent.jsx:223 | `<CommandCenterView>` — workstation dashboard |
| 2 | `search` | AppRouteContent.jsx:234 | `<GlobalSearchView>` — global query results |
| 3 | `raw` | AppRouteContent.jsx:247 | `<InboxView>` — raw/inbox capture list |
| 4 | `projects` | AppRouteContent.jsx:256 | `<ProjectsView>` — project rows + canvases |
| 5 | `note` | AppRouteContent.jsx:268 | `<NotesWorkspaceView>` — notes workspace |
| 6 | `tasks` | AppRouteContent.jsx:279 | `<TasksView>` — task rows |
| 7 | `calendar` | AppRouteContent.jsx:280 | `<CalendarView>` — entry timeline by day |
| 8 | `spaces` | AppRouteContent.jsx:281 | `<SpacesView>` — list of spaces |
| 9 | `tags` | AppRouteContent.jsx:290 | `<TagManagerView>` — tag list w/ filter trigger |
| 10 | `settings` | AppRouteContent.jsx:291 | `renderSettingsPanel(true)` (embedded settings) |
| 11 | `ai` | AppRouteContent.jsx:296 | `<AIAssistantView>` — AI setup CTA panel |
| 12 | `templates` | AppRouteContent.jsx:199 | lazy `<TemplatesPanel>` |
| 13 | `trash` | AppRouteContent.jsx:213 | `<TrashView>` — vault trash browser |
| 14 | `graph` | AppRouteContent.jsx:323 | lazy `<ConstellationView>` — knowledge graph |
| 15 | `welcome` | App.jsx:1620 | `<WelcomePanel>` — onboarding overlay |
| 16 | `all` (default) | AppRouteContent.jsx:338 (fallthrough) | Toolbar + filtered Card/Row grid for all entries |
| 17 | `starred` | appShellState.js:11, 36 | Default grid filtered to `entry.starred` |
| 18 | `note` (type filter) | appShellState.js:19 fallthrough | Default grid filtered to `type==='note'` (also for the other entry types when section==type) |
| 19 | `video` | types.js:1 + appShellState.js:18-19 | Default grid filtered to `type==='video'` |
| 20 | `podcast` | types.js:1 + appShellState.js:18-19 | Default grid filtered to `type==='podcast'` |
| 21 | `article` | types.js:1 + appShellState.js:18-19 | Default grid filtered to `type==='article'` |
| 22 | `journal` | types.js:1 + appShellState.js:18-19 | Default grid filtered to `type==='journal'` |
| 23 | `link` | types.js:1 + appShellState.js:18-19 | Default grid filtered to `type==='link'` |
| 24 | `project` | types.js:1 + appShellState.js:18-19 | Default grid filtered to `type==='project'` |
| 25 | `task` | types.js:1 + appShellState.js:18-19 | Default grid filtered to `type==='task'` |
| 26 | `wiki` | types.js:2 + appShellState.js:18-19 | Default grid filtered to `type==='wiki'` |
| 27 | `review` | types.js:2 + appShellState.js:18-19 | Default grid filtered to `type==='review'` |
| 28 | `folder:<path>` (dynamic prefix) | appShellState.js:12-14, App.jsx:337 | Default grid filtered to entries inside that vault folder |
| 29 | `space:<id>` (dynamic prefix) | appShellState.js:15-17, AppRouteContent.jsx:284 | Default grid filtered to entries in that space |
| 30 | `base:<id>` (dynamic prefix) | App.jsx:189, AppRouteContent.jsx:313 | lazy `<BaseExplorer>` — saved query/base view |
| 31 | `canvas:<id>` (dynamic prefix) | App.jsx:196, AppRouteContent.jsx:301 | lazy `<CanvasExplorer>` — freeform canvas board |

## 1.2 Public exports

`source/src/lib/`, `source/src/adapters/`, `source/src/parsers/`, `source/src/plugins/`. One row per export. Tests excluded.

### Adapters

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 1 | `vault` (detected default) | adapters/index.js:21 | adapters/index.js |
| 2 | `VaultError` (re-export) | adapters/index.js:22 | adapters/index.js |
| 3 | `LocalAdapter` (re-export) | adapters/index.js:23 | adapters/index.js |
| 4 | `NodeFsAdapter` (re-export) | adapters/index.js:23 | adapters/index.js |
| 5 | `VaultAdapter` (re-export) | adapters/index.js:24 | adapters/index.js |
| 6 | `NodeFsAdapter` class | adapters/NodeFsAdapter.js:24 | adapters/NodeFsAdapter.js |
| 7 | `LocalAdapter` class | adapters/LocalAdapter.js:105 | adapters/LocalAdapter.js |
| 8 | `VaultAdapter` class | adapters/VaultAdapter.js:51 | adapters/VaultAdapter.js |
| 9 | `VaultError` class | adapters/VaultError.js:14 | adapters/VaultError.js |

### Parsers

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 10 | `parse` (jotfolio) | parsers/jotfolio.js:12 | parsers/jotfolio.js |
| 11 | `parse` (pocket) | parsers/pocket.js:4 | parsers/pocket.js |
| 12 | `parseMarkdown` | parsers/obsidian.js:3 | parsers/obsidian.js |
| 13 | `parseVault` | parsers/obsidian.js:62 | parsers/obsidian.js |
| 14 | `parse` (obsidian → parseVault) | parsers/obsidian.js:75 | parsers/obsidian.js |
| 15 | `parse` (kindle) | parsers/kindle.js:3 | parsers/kindle.js |
| 16 | `parse` (readwise) | parsers/readwise.js:3 | parsers/readwise.js |
| 17 | `SOURCES` | parsers/index.js:7 | parsers/index.js |

### Plugins (engine)

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 18 | `createPluginAPI` | plugins/PluginAPI.js:20 | plugins/PluginAPI.js |
| 19 | `OFFICIAL_PLUGINS` | plugins/officialPlugins.js:23 | plugins/officialPlugins.js |
| 20 | `installOfficial` | plugins/officialPlugins.js:46 | plugins/officialPlugins.js |
| 21 | `PluginHost` class | plugins/PluginHost.js:43 | plugins/PluginHost.js |
| 22 | `pluginHost` (singleton) | plugins/PluginHost.js:320 | plugins/PluginHost.js |
| 23 | `ownManifest` (re-export) | plugins/PluginHost.js:324 | plugins/PluginHost.js |
| 24 | `EventBus` class | plugins/EventBus.js:6 | plugins/EventBus.js |
| 25 | `appBus` (singleton) | plugins/EventBus.js:42 | plugins/EventBus.js |
| 26 | `CommandRegistry` class | plugins/CommandRegistry.js:4 | plugins/CommandRegistry.js |
| 27 | `commands` (singleton) | plugins/CommandRegistry.js:45 | plugins/CommandRegistry.js |
| 28 | `PluginBridge` class | plugins/PluginBridge.js:32 | plugins/PluginBridge.js |

### lib/ root

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 29 | `useOpenRouterCallback` | lib/appHooks.js:6 | lib/appHooks.js |
| 30 | `useAppShortcuts` | lib/appHooks.js:29 | lib/appHooks.js |
| 31 | `exportEntriesJSON` | lib/exports.js:16 | lib/exports.js |
| 32 | `exportVaultBundle` | lib/exports.js:23 | lib/exports.js |
| 33 | `exportEntriesMD` | lib/exports.js:31 | lib/exports.js |
| 34 | `importVaultBundle` | lib/exports.js:70 | lib/exports.js |
| 35 | `importEntriesJSON` | lib/exports.js:98 | lib/exports.js |
| 36 | `DEFAULT_FEATURE_FLAGS` | lib/featureFlags.js:1 | lib/featureFlags.js |
| 37 | `normalizeFeatureFlags` | lib/featureFlags.js:16 | lib/featureFlags.js |
| 38 | `shouldShowEntryType` | lib/featureFlags.js:33 | lib/featureFlags.js |
| 39 | `filterEntriesForUI` | lib/featureFlags.js:41 | lib/featureFlags.js |
| 40 | `FrontmatterError` | lib/frontmatter.js:20 | lib/frontmatter.js |
| 41 | `parse` (frontmatter) | lib/frontmatter.js:34 | lib/frontmatter.js |
| 42 | `FRONTMATTER_EXTRAS_FIELD` | lib/frontmatter.js:176 | lib/frontmatter.js |
| 43 | `MANUAL_LINKS_FIELD` | lib/frontmatter.js:177 | lib/frontmatter.js |
| 44 | `serialize` (frontmatter) | lib/frontmatter.js:208 | lib/frontmatter.js |
| 45 | `stripFrontmatter` | lib/frontmatter.js:250 | lib/frontmatter.js |
| 46 | `slugify` (frontmatter) | lib/frontmatter.js:258 | lib/frontmatter.js |
| 47 | `TYPE_FOLDER` | lib/frontmatter.js:269 | lib/frontmatter.js |
| 48 | `entryToFile` | lib/frontmatter.js:288 | lib/frontmatter.js |
| 49 | `fileToEntry` | lib/frontmatter.js:351 | lib/frontmatter.js |
| 50 | `useDebouncedCallback` | lib/hooks.js:4 | lib/hooks.js |
| 51 | `useSystemDark` | lib/hooks.js:17 | lib/hooks.js |
| 52 | `useEscapeKey` | lib/hooks.js:38 | lib/hooks.js |
| 53 | `useAutoFocus` | lib/hooks.js:52 | lib/hooks.js |
| 54 | `NOTE_MD_CSS` | lib/markdown.js:2 | lib/markdown.js |
| 55 | `injectNoteCss` | lib/markdown.js:23 | lib/markdown.js |
| 56 | `renderWikiLinks` | lib/markdown.js:32 | lib/markdown.js |
| 57 | `escapeHtml` | lib/markdown.js:40 | lib/markdown.js |
| 58 | `sanitizeHtml` | lib/markdown.js:58 | lib/markdown.js |
| 59 | `getCaretCoords` | lib/markdown.js:117 | lib/markdown.js |
| 60 | `detectWikiTrigger` | lib/markdown.js:148 | lib/markdown.js |
| 61 | `CORRUPT_STORAGE_CODE` | lib/storage.js:10 | lib/storage.js |
| 62 | `StorageCorruptionError` class | lib/storage.js:12 | lib/storage.js |
| 63 | `isStorageCorruptionError` | lib/storage.js:25 | lib/storage.js |
| 64 | `storageQuarantineKey` | lib/storage.js:30 | lib/storage.js |
| 65 | `storage` (default object) | lib/storage.js:58 | lib/storage.js |
| 66 | `uid` | lib/storage.js:87 | lib/storage.js |
| 67 | `createEntryId` | lib/storage.js:88 | lib/storage.js |
| 68 | `formatDate` | lib/storage.js:102 | lib/storage.js |
| 69 | `withAlpha` | lib/storage.js:103 | lib/storage.js |
| 70 | `isSafeUrl` | lib/storage.js:108 | lib/storage.js |
| 71 | `normalizeTags` | lib/storage.js:109 | lib/storage.js |
| 72 | `pickEntryFields` | lib/storage.js:113 | lib/storage.js |
| 73 | `startVoiceRecognition` | lib/storage.js:117 | lib/storage.js |
| 74 | `userOptedIn` | lib/telemetry.js:15 | lib/telemetry.js |
| 75 | `setOptIn` | lib/telemetry.js:23 | lib/telemetry.js |
| 76 | `hasDecided` | lib/telemetry.js:31 | lib/telemetry.js |
| 77 | `hydrateOptInFromMain` | lib/telemetry.js:35 | lib/telemetry.js |
| 78 | `init` (telemetry) | lib/telemetry.js:71 | lib/telemetry.js |
| 79 | `captureError` | lib/telemetry.js:99 | lib/telemetry.js |
| 80 | `TYPES` | lib/types.js:1 | lib/types.js |
| 81 | `KNOWLEDGE_TYPES` | lib/types.js:2 | lib/types.js |
| 82 | `ALL_ENTRY_TYPES` | lib/types.js:3 | lib/types.js |
| 83 | `ICON` | lib/types.js:4 | lib/types.js |
| 84 | `LABEL` | lib/types.js:5 | lib/types.js |
| 85 | `STATUSES` | lib/types.js:6 | lib/types.js |
| 86 | `STATUS_LABELS` | lib/types.js:13 | lib/types.js |
| 87 | `displayStatus` | lib/types.js:39 | lib/types.js |
| 88 | `NO_URL_TYPES` | lib/types.js:41 | lib/types.js |
| 89 | `COMMON_FIELDS` | lib/types.js:42 | lib/types.js |
| 90 | `TYPE_FIELDS` | lib/types.js:43 | lib/types.js |
| 91 | `STATUS_DONE` | lib/types.js:58 | lib/types.js |
| 92 | `STATUS_BROKEN` | lib/types.js:59 | lib/types.js |
| 93 | `statusTone` | lib/types.js:60 | lib/types.js |
| 94 | `statusBg` | lib/types.js:65 | lib/types.js |
| 95 | `ALL_STATUS_VALUES` | lib/types.js:66 | lib/types.js |
| 96 | `today` | lib/types.js:67 | lib/types.js |
| 97 | `TYPE_TOKENS` | lib/types.js:88 | lib/types.js |
| 98 | `MEMORY_TOKENS` | lib/types.js:99 | lib/types.js |
| 99 | `TYPE_THEME_LEVELS` | lib/types.js:105 | lib/types.js |
| 100 | `TYPE_SATURATION_LEVELS` | lib/types.js:108 | lib/types.js |
| 101 | `migrateTypeSatToTheme` | lib/types.js:118 | lib/types.js |
| 102 | `applyTypeSat` | lib/types.js:131 | lib/types.js |
| 103 | `attachmentPathFor` | lib/vaultAttachments.js:7 | lib/vaultAttachments.js |
| 104 | `importAttachment` | lib/vaultAttachments.js:13 | lib/vaultAttachments.js |
| 105 | `VaultExportError` class | lib/vaultExportZip.js:5 | lib/vaultExportZip.js |
| 106 | `crc32` | lib/vaultExportZip.js:24 | lib/vaultExportZip.js |
| 107 | `buildZip` | lib/vaultExportZip.js:61 | lib/vaultExportZip.js |
| 108 | `exportVaultAsZip` | lib/vaultExportZip.js:142 | lib/vaultExportZip.js |
| 109 | `normalizeVaultFolder` | lib/vaultPaths.js:1 | lib/vaultPaths.js |
| 110 | `normalizeMarkdownFileName` | lib/vaultPaths.js:13 | lib/vaultPaths.js |
| 111 | `joinVaultPath` | lib/vaultPaths.js:22 | lib/vaultPaths.js |
| 112 | `folderFromPath` | lib/vaultPaths.js:28 | lib/vaultPaths.js |
| 113 | `fileNameFromPath` | lib/vaultPaths.js:34 | lib/vaultPaths.js |
| 114 | `folderContainsPath` | lib/vaultPaths.js:40 | lib/vaultPaths.js |
| 115 | `isInternalVaultPath` | lib/vaultPaths.js:47 | lib/vaultPaths.js |
| 116 | `buildFolderTree` | lib/vaultPaths.js:55 | lib/vaultPaths.js |
| 117 | `TRASH_DIR` | lib/vaultTrash.js:1 | lib/vaultTrash.js |
| 118 | `trashPathFor` | lib/vaultTrash.js:12 | lib/vaultTrash.js |
| 119 | `originalPathFromTrashPath` | lib/vaultTrash.js:19 | lib/vaultTrash.js |
| 120 | `moveToTrash` | lib/vaultTrash.js:29 | lib/vaultTrash.js |
| 121 | `restoreFromTrash` | lib/vaultTrash.js:39 | lib/vaultTrash.js |
| 122 | `getConstellationDemoEntries` | lib/demoEntries.js:41 | lib/demoEntries.js |

### lib/ai

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 123 | `AI_PROVIDERS` | lib/ai/providers.js:3 | lib/ai/providers.js |
| 124 | `getAIConfig` | lib/ai/providers.js:12 | lib/ai/providers.js |
| 125 | `setAIConfig` | lib/ai/providers.js:13 | lib/ai/providers.js |
| 126 | `hasAIKey` | lib/ai/providers.js:14 | lib/ai/providers.js |
| 127 | `aiComplete` | lib/ai/providers.js:18 | lib/ai/providers.js |
| 128 | `OR_VERIFIER_KEY` | lib/ai/openrouter.js:3 | lib/ai/openrouter.js |
| 129 | `startOpenRouterLogin` | lib/ai/openrouter.js:11 | lib/ai/openrouter.js |
| 130 | `exchangeOpenRouterCode` | lib/ai/openrouter.js:17 | lib/ai/openrouter.js |

### lib/base

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 131 | `BASE_FILE_VERSION` | lib/base/baseTypes.js:48 | lib/base/baseTypes.js |
| 132 | `BASE_FILE_EXT` | lib/base/baseTypes.js:49 | lib/base/baseTypes.js |
| 133 | `BASE_DIR` | lib/base/baseTypes.js:50 | lib/base/baseTypes.js |
| 134 | `FILTER_OPS` | lib/base/baseTypes.js:52 | lib/base/baseTypes.js |
| 135 | `VIEW_TYPES` | lib/base/baseTypes.js:53 | lib/base/baseTypes.js |
| 136 | `DEFAULT_COLUMNS` | lib/base/baseTypes.js:57 | lib/base/baseTypes.js |
| 137 | `createEmptyBase` | lib/base/baseTypes.js:67 | lib/base/baseTypes.js |
| 138 | `makeBaseId` | lib/base/baseTypes.js:94 | lib/base/baseTypes.js |
| 139 | `basePath` | lib/base/baseTypes.js:109 | lib/base/baseTypes.js |
| 140 | `normalizeBase` | lib/base/baseTypes.js:121 | lib/base/baseTypes.js |
| 141 | `serializeBase` | lib/base/baseTypes.js:161 | lib/base/baseTypes.js |
| 142 | `evalFilter` | lib/base/queryBase.js:44 | lib/base/queryBase.js |
| 143 | `evalSort` | lib/base/queryBase.js:101 | lib/base/queryBase.js |
| 144 | `applyBase` | lib/base/queryBase.js:134 | lib/base/queryBase.js |
| 145 | `getPropertyKeys` | lib/base/queryBase.js:154 | lib/base/queryBase.js |

### lib/canvas

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 146 | `CANVAS_FILE_VERSION` | lib/canvas/canvasTypes.js:34 | lib/canvas/canvasTypes.js |
| 147 | `CANVAS_FILE_EXT` | lib/canvas/canvasTypes.js:35 | lib/canvas/canvasTypes.js |
| 148 | `CANVAS_DIR` | lib/canvas/canvasTypes.js:36 | lib/canvas/canvasTypes.js |
| 149 | `NODE_TYPES` | lib/canvas/canvasTypes.js:38 | lib/canvas/canvasTypes.js |
| 150 | `KNOWN_NODE_TYPES` | lib/canvas/canvasTypes.js:39 | lib/canvas/canvasTypes.js |
| 151 | `makeCanvasId` | lib/canvas/canvasTypes.js:67 | lib/canvas/canvasTypes.js |
| 152 | `createEmptyCanvas` | lib/canvas/canvasTypes.js:83 | lib/canvas/canvasTypes.js |
| 153 | `canvasPath` | lib/canvas/canvasTypes.js:100 | lib/canvas/canvasTypes.js |
| 154 | `normalizeCanvas` | lib/canvas/canvasTypes.js:163 | lib/canvas/canvasTypes.js |
| 155 | `serializeCanvas` | lib/canvas/canvasTypes.js:202 | lib/canvas/canvasTypes.js |
| 156 | `nextNodeId` | lib/canvas/canvasTypes.js:236 | lib/canvas/canvasTypes.js |
| 157 | `nextEdgeId` | lib/canvas/canvasTypes.js:246 | lib/canvas/canvasTypes.js |
| 158 | `addNode` | lib/canvas/canvasOps.js:22 | lib/canvas/canvasOps.js |
| 159 | `removeNode` | lib/canvas/canvasOps.js:53 | lib/canvas/canvasOps.js |
| 160 | `moveNode` | lib/canvas/canvasOps.js:72 | lib/canvas/canvasOps.js |
| 161 | `resizeNode` | lib/canvas/canvasOps.js:85 | lib/canvas/canvasOps.js |
| 162 | `updateNode` | lib/canvas/canvasOps.js:99 | lib/canvas/canvasOps.js |
| 163 | `addEdge` | lib/canvas/canvasOps.js:118 | lib/canvas/canvasOps.js |
| 164 | `removeEdge` | lib/canvas/canvasOps.js:134 | lib/canvas/canvasOps.js |
| 165 | `updateEdge` | lib/canvas/canvasOps.js:148 | lib/canvas/canvasOps.js |

### lib/command

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 166 | `createCommandRegistry` | lib/command/commandRegistry.js:19 | lib/command/commandRegistry.js |
| 167 | `rankCommands` | lib/command/commandRegistry.js:89 | lib/command/commandRegistry.js |

### lib/compile

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 168 | `compile` | lib/compile/compile.js:115 | lib/compile/compile.js |
| 169 | `compile` (barrel re-export) | lib/compile/index.js:5 | lib/compile/index.js |
| 170 | `loadManifest` (re-export) | lib/compile/index.js:6 | lib/compile/index.js |
| 171 | `saveManifest` (re-export) | lib/compile/index.js:6 | lib/compile/index.js |
| 172 | `recordCompilation` (re-export) | lib/compile/index.js:6 | lib/compile/index.js |
| 173 | `findStale` (re-export) | lib/compile/index.js:6 | lib/compile/index.js |
| 174 | `isCompiledEntry` (re-export) | lib/compile/index.js:6 | lib/compile/index.js |
| 175 | `EMPTY_MANIFEST` (re-export) | lib/compile/index.js:6 | lib/compile/index.js |
| 176 | `hashSourceEntry` (re-export) | lib/compile/index.js:14 | lib/compile/index.js |
| 177 | `hashCompiledArtifact` (re-export) | lib/compile/index.js:14 | lib/compile/index.js |
| 178 | `compositeSourceHash` (re-export) | lib/compile/index.js:14 | lib/compile/index.js |
| 179 | `compileDeterministic` (re-export) | lib/compile/index.js:19 | lib/compile/index.js |
| 180 | `EMPTY_MANIFEST` | lib/compile/manifest.js:27 | lib/compile/manifest.js |
| 181 | `loadManifest` | lib/compile/manifest.js:39 | lib/compile/manifest.js |
| 182 | `saveManifest` | lib/compile/manifest.js:65 | lib/compile/manifest.js |
| 183 | `recordCompilation` | lib/compile/manifest.js:75 | lib/compile/manifest.js |
| 184 | `findStale` | lib/compile/manifest.js:129 | lib/compile/manifest.js |
| 185 | `isCompiledEntry` | lib/compile/manifest.js:176 | lib/compile/manifest.js |
| 186 | `hashSourceEntry` | lib/compile/hash.js:51 | lib/compile/hash.js |
| 187 | `hashCompiledArtifact` | lib/compile/hash.js:72 | lib/compile/hash.js |
| 188 | `compositeSourceHash` | lib/compile/hash.js:83 | lib/compile/hash.js |
| 189 | `compileDeterministic` | lib/compile/compilers/deterministicStub.js:157 | lib/compile/compilers/deterministicStub.js |

### lib/demo

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 190 | `buildFullDemoVaultStore` | lib/demo/fullDemoVault.js:467 | lib/demo/fullDemoVault.js |
| 191 | `maybeSeedFullDemoVaultFromUrl` | lib/demo/fullDemoVault.js:516 | lib/demo/fullDemoVault.js |

### lib/exports

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 192 | `BUNDLE_VERSION` | lib/exports/bundle.js:10 | lib/exports/bundle.js |
| 193 | `BUNDLE_KIND` | lib/exports/bundle.js:11 | lib/exports/bundle.js |
| 194 | `CANVAS_DIR` | lib/exports/bundle.js:17 | lib/exports/bundle.js |
| 195 | `CANVAS_FILE_EXT` | lib/exports/bundle.js:18 | lib/exports/bundle.js |
| 196 | `validateCanvas` | lib/exports/bundle.js:24 | lib/exports/bundle.js |
| 197 | `validateBase` | lib/exports/bundle.js:37 | lib/exports/bundle.js |
| 198 | `buildBundle` | lib/exports/bundle.js:48 | lib/exports/bundle.js |
| 199 | `parseBundle` | lib/exports/bundle.js:66 | lib/exports/bundle.js |

### lib/hooks (subdir)

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 200 | `useSemanticIndex` | lib/hooks/useSemanticIndex.js:22 | lib/hooks/useSemanticIndex.js |

### lib/index (vault index)

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 201 | `createLookupMaps` | lib/index/vaultIndex.js:50 | lib/index/vaultIndex.js |
| 202 | `resolveEntryLinks` | lib/index/vaultIndex.js:85 | lib/index/vaultIndex.js |
| 203 | `buildVaultIndex` | lib/index/vaultIndex.js:114 | lib/index/vaultIndex.js |
| 204 | `getUnresolvedTargets` | lib/index/vaultIndex.js:192 | lib/index/vaultIndex.js |
| 205 | `getBacklinks` | lib/index/vaultIndex.js:206 | lib/index/vaultIndex.js |
| 206 | `getNeighbors` | lib/index/vaultIndex.js:210 | lib/index/vaultIndex.js |
| 207 | `getCluster` | lib/index/vaultIndex.js:229 | lib/index/vaultIndex.js |
| 208 | `searchWiki` | lib/index/vaultIndex.js:235 | lib/index/vaultIndex.js |
| 209 | `searchRaw` | lib/index/vaultIndex.js:245 | lib/index/vaultIndex.js |
| 210 | `getAffinityMatches` | lib/index/vaultIndex.js:255 | lib/index/vaultIndex.js |
| 211 | `getMemoryHealth` | lib/index/vaultIndex.js:269 | lib/index/vaultIndex.js |
| 212 | `getRelationshipScan` | lib/index/vaultIndex.js:282 | lib/index/vaultIndex.js |
| 213 | `RELATIONSHIP_REVIEW_STORAGE_KEY` | lib/index/relationshipReview.js:3 | lib/index/relationshipReview.js |
| 214 | `RELATIONSHIP_REVIEW_STATUSES` | lib/index/relationshipReview.js:4 | lib/index/relationshipReview.js |
| 215 | `RELATIONSHIP_REVIEW_KINDS` | lib/index/relationshipReview.js:5 | lib/index/relationshipReview.js |
| 216 | `relationshipReviewKey` | lib/index/relationshipReview.js:31 | lib/index/relationshipReview.js |
| 217 | `createRelationshipReview` | lib/index/relationshipReview.js:72 | lib/index/relationshipReview.js |
| 218 | `applyRelationshipReview` | lib/index/relationshipReview.js:121 | lib/index/relationshipReview.js |
| 219 | `undoRelationshipReview` | lib/index/relationshipReview.js:156 | lib/index/relationshipReview.js |
| 220 | `rejectRelationshipReview` | lib/index/relationshipReview.js:172 | lib/index/relationshipReview.js |
| 221 | `parseRelationshipReviewLedger` | lib/index/relationshipReview.js:186 | lib/index/relationshipReview.js |
| 222 | `serializeRelationshipReviewLedger` | lib/index/relationshipReview.js:197 | lib/index/relationshipReview.js |
| 223 | `loadRelationshipReviewLedger` | lib/index/relationshipReview.js:201 | lib/index/relationshipReview.js |
| 224 | `saveRelationshipReviewLedger` | lib/index/relationshipReview.js:209 | lib/index/relationshipReview.js |
| 225 | `RELATIONSHIP_DECISIONS_STORAGE_KEY` | lib/index/relationshipDecisions.js:1 | lib/index/relationshipDecisions.js |
| 226 | `RELATIONSHIP_DECISION_STATUSES` | lib/index/relationshipDecisions.js:2 | lib/index/relationshipDecisions.js |
| 227 | `relationshipDecisionKey` | lib/index/relationshipDecisions.js:12 | lib/index/relationshipDecisions.js |
| 228 | `setRelationshipDecision` | lib/index/relationshipDecisions.js:25 | lib/index/relationshipDecisions.js |
| 229 | `clearRelationshipDecision` | lib/index/relationshipDecisions.js:44 | lib/index/relationshipDecisions.js |
| 230 | `relationshipDecisionStatus` | lib/index/relationshipDecisions.js:51 | lib/index/relationshipDecisions.js |
| 231 | `parseRelationshipDecisions` | lib/index/relationshipDecisions.js:55 | lib/index/relationshipDecisions.js |
| 232 | `serializeRelationshipDecisions` | lib/index/relationshipDecisions.js:66 | lib/index/relationshipDecisions.js |
| 233 | `loadRelationshipDecisions` | lib/index/relationshipDecisions.js:70 | lib/index/relationshipDecisions.js |
| 234 | `saveRelationshipDecisions` | lib/index/relationshipDecisions.js:78 | lib/index/relationshipDecisions.js |

### lib/keywordRules

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 235 | `useKeywordRules` | lib/keywordRules/useKeywordRules.js:25 | lib/keywordRules/useKeywordRules.js |
| 236 | `OPT_OUTS_PATH` | lib/keywordRules/optOutTracker.js:25 | lib/keywordRules/optOutTracker.js |
| 237 | `loadOptOuts` | lib/keywordRules/optOutTracker.js:36 | lib/keywordRules/optOutTracker.js |
| 238 | `saveOptOuts` | lib/keywordRules/optOutTracker.js:81 | lib/keywordRules/optOutTracker.js |
| 239 | `addOptOut` | lib/keywordRules/optOutTracker.js:120 | lib/keywordRules/optOutTracker.js |
| 240 | `removeOptOut` | lib/keywordRules/optOutTracker.js:146 | lib/keywordRules/optOutTracker.js |
| 241 | `getOptOutsForEntry` | lib/keywordRules/optOutTracker.js:167 | lib/keywordRules/optOutTracker.js |
| 242 | `parseRules` | lib/keywordRules/parseRules.js:27 | lib/keywordRules/parseRules.js |
| 243 | `escapeRegex` | lib/keywordRules/applyRules.js:7 | lib/keywordRules/applyRules.js |
| 244 | `applyRules` | lib/keywordRules/applyRules.js:43 | lib/keywordRules/applyRules.js |
| 245 | `RULES_PATH` | lib/keywordRules/rulesStorage.js:19 | lib/keywordRules/rulesStorage.js |
| 246 | `RULES_DIR` | lib/keywordRules/rulesStorage.js:22 | lib/keywordRules/rulesStorage.js |
| 247 | `loadRules` | lib/keywordRules/rulesStorage.js:32 | lib/keywordRules/rulesStorage.js |
| 248 | `saveRules` | lib/keywordRules/rulesStorage.js:58 | lib/keywordRules/rulesStorage.js |

### lib/memory

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 249 | `confirmMemory` | lib/memory/confirmMemory.js:26 | lib/memory/confirmMemory.js |
| 250 | `graduateTied` | lib/memory/graduateTied.js:48 | lib/memory/graduateTied.js |
| 251 | `parseFacts` | lib/memory/parseFacts.js:29 | lib/memory/parseFacts.js |
| 252 | `splitMemory` | lib/memory/splitMemory.js:37 | lib/memory/splitMemory.js |

### lib/parser

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 253 | `parseWikilinks` | lib/parser/wikilinks.js:21 | lib/parser/wikilinks.js |
| 254 | `parseInlineTags` | lib/parser/tags.js:21 | lib/parser/tags.js |
| 255 | `parseFrontmatterTags` | lib/parser/tags.js:45 | lib/parser/tags.js |
| 256 | `mergeTags` | lib/parser/tags.js:56 | lib/parser/tags.js |
| 257 | `slugify` (headings) | lib/parser/headings.js:16 | lib/parser/headings.js |
| 258 | `parseHeadings` | lib/parser/headings.js:25 | lib/parser/headings.js |
| 259 | `parseBlockRefs` | lib/parser/blocks.js:12 | lib/parser/blocks.js |
| 260 | `parseEmbeds` | lib/parser/embeds.js:12 | lib/parser/embeds.js |
| 261 | `isImageEmbed` | lib/parser/embeds.js:42 | lib/parser/embeds.js |
| 262 | `findCodeRanges` | lib/parser/codeMask.js:15 | lib/parser/codeMask.js |
| 263 | `isInside` | lib/parser/codeMask.js:70 | lib/parser/codeMask.js |
| 264 | `lineAt` | lib/parser/codeMask.js:77 | lib/parser/codeMask.js |

### lib/plugin (built-ins)

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 265 | `createPluginHost` | lib/plugin/pluginHost.js:17 | lib/plugin/pluginHost.js |
| 266 | `wordCountPlugin` | lib/plugin/builtinPlugins/wordCount.js:11 | lib/plugin/builtinPlugins/wordCount.js |
| 267 | `countWords` | lib/plugin/builtinPlugins/wordCountStats.js:7 | lib/plugin/builtinPlugins/wordCountStats.js |
| 268 | `wordCountSummary` | lib/plugin/builtinPlugins/wordCountStats.js:14 | lib/plugin/builtinPlugins/wordCountStats.js |

### lib/quickSwitcher

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 269 | `rankNotes` | lib/quickSwitcher/quickSwitcherSearch.js:80 | lib/quickSwitcher/quickSwitcherSearch.js |
| 270 | `findExactMatch` | lib/quickSwitcher/quickSwitcherSearch.js:107 | lib/quickSwitcher/quickSwitcherSearch.js |

### lib/random

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 271 | `pickRandomEntry` | lib/random/randomNote.js:5 | lib/random/randomNote.js |

### lib/search

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 272 | `parseSearchQuery` | lib/search/searchVault.js:57 | lib/search/searchVault.js |
| 273 | `matchesQuery` | lib/search/searchVault.js:167 | lib/search/searchVault.js |
| 274 | `searchEntries` | lib/search/searchVault.js:191 | lib/search/searchVault.js |

### lib/semantic

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 275 | `cosineSimilarity` | lib/semantic/similarity.js:5 | lib/semantic/similarity.js |
| 276 | `findTopK` | lib/semantic/similarity.js:20 | lib/semantic/similarity.js |
| 277 | `buildSemanticIndex` | lib/semantic/index.js:94 | lib/semantic/index.js |
| 278 | `reembedEntry` | lib/semantic/index.js:147 | lib/semantic/index.js |
| 279 | `getSimilarEntries` | lib/semantic/index.js:180 | lib/semantic/index.js |
| 280 | `_internals` | lib/semantic/index.js:190 | lib/semantic/index.js |
| 281 | `loadModel` | lib/semantic/embed.js:55 | lib/semantic/embed.js |
| 282 | `embedText` | lib/semantic/embed.js:75 | lib/semantic/embed.js |
| 283 | `_resetModelForTests` | lib/semantic/embed.js:88 | lib/semantic/embed.js |

### lib/templates

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 284 | `TEMPLATE_DIR` | lib/templates/templateStore.js:15 | lib/templates/templateStore.js |
| 285 | `TEMPLATE_EXT` | lib/templates/templateStore.js:16 | lib/templates/templateStore.js |
| 286 | `loadTemplates` | lib/templates/templateStore.js:35 | lib/templates/templateStore.js |
| 287 | `resolveVariables` | lib/templates/templateStore.js:101 | lib/templates/templateStore.js |
| 288 | `applyTemplateToNote` | lib/templates/templateStore.js:179 | lib/templates/templateStore.js |
| 289 | `insertTemplateAtCursor` | lib/templates/templateStore.js:197 | lib/templates/templateStore.js |
| 290 | `TEMPLATE_REFS_FIELD` | lib/templates/templateBacklinks.js:5 | lib/templates/templateBacklinks.js |
| 291 | `templateReferenceKeys` | lib/templates/templateBacklinks.js:15 | lib/templates/templateBacklinks.js |
| 292 | `getEntryTemplateRefs` | lib/templates/templateBacklinks.js:30 | lib/templates/templateBacklinks.js |
| 293 | `addTemplateUsageToEntry` | lib/templates/templateBacklinks.js:41 | lib/templates/templateBacklinks.js |
| 294 | `getTemplateIncoming` | lib/templates/templateBacklinks.js:56 | lib/templates/templateBacklinks.js |
| 295 | `getTemplateOutgoing` | lib/templates/templateBacklinks.js:74 | lib/templates/templateBacklinks.js |

### lib/theme

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 296 | `resolveColorScheme` | lib/theme/resolve.js:4 | lib/theme/resolve.js |
| 297 | `resolveThemeVars` | lib/theme/resolve.js:10 | lib/theme/resolve.js |
| 298 | `assertThemeModePairs` | lib/theme/resolve.js:26 | lib/theme/resolve.js |
| 299 | `buildThemeCss` | lib/theme/themeCss.js:3 | lib/theme/themeCss.js |
| 300 | `getThemeDefaults` | lib/theme/defaults.js:4 | lib/theme/defaults.js |
| 301 | `hexToRgb` | lib/theme/victoryTheme.js:2 | lib/theme/victoryTheme.js |
| 302 | `mixHex` | lib/theme/victoryTheme.js:3 | lib/theme/victoryTheme.js |
| 303 | `luminance` | lib/theme/victoryTheme.js:4 | lib/theme/victoryTheme.js |
| 304 | `deriveVictoryTheme` | lib/theme/victoryTheme.js:5 | lib/theme/victoryTheme.js |
| 305 | `THEMES` | lib/theme/themes.js:1 | lib/theme/themes.js |
| 306 | `THEME_VAR_CONTRACT` | lib/theme/themes.js:63 | lib/theme/themes.js |
| 307 | `getThemeContractIssues` | lib/theme/themes.js:107 | lib/theme/themes.js |
| 308 | `FONTS` | lib/theme/themes.js:123 | lib/theme/themes.js |
| 309 | `DEFAULT_VICTORY_COLORS` | lib/theme/themes.js:133 | lib/theme/themes.js |

### lib/workstation

| # | Export name | Source file:line | Module |
|---|---|---|---|
| 310 | `buildProjectRows` | lib/workstation/workstationData.js:183 | lib/workstation/workstationData.js |
| 311 | `buildTaskRows` | lib/workstation/workstationData.js:224 | lib/workstation/workstationData.js |
| 312 | `buildCalendarDays` | lib/workstation/workstationData.js:245 | lib/workstation/workstationData.js |
| 313 | `buildTagRows` | lib/workstation/workstationData.js:286 | lib/workstation/workstationData.js |
| 314 | `buildSpaceRows` | lib/workstation/workstationData.js:349 | lib/workstation/workstationData.js |
| 315 | `buildGlobalSearchResults` | lib/workstation/workstationData.js:409 | lib/workstation/workstationData.js |
| 316 | `buildCommandCenterModel` | lib/workstation/workstationData.js:456 | lib/workstation/workstationData.js |

## 1.3 Vault mutations

Vault-write surface: every place that writes/removes/moves/mkdirs against the vault adapter (filesystem or browser fallback). The adapter contract is the chokepoint — see `VaultAdapter.js:35-39`. Tests excluded.

| # | Mutation | Source file:line | Side effect |
|---|---|---|---|
| 1 | `VaultAdapter.write` (interface) | adapters/VaultAdapter.js:61 | Abstract — write file content (atomic) |
| 2 | `VaultAdapter.mkdir` (interface) | adapters/VaultAdapter.js:63 | Abstract — create folder |
| 3 | `VaultAdapter.move` (interface) | adapters/VaultAdapter.js:65 | Abstract — rename / move file |
| 4 | `VaultAdapter.remove` (interface) | adapters/VaultAdapter.js:67 | Abstract — delete file |
| 5 | `VaultAdapter.rmdir` (interface) | adapters/VaultAdapter.js:69 | Abstract — remove empty folder |
| 6 | `VaultAdapter.writeBinary` (interface) | adapters/VaultAdapter.js:75 | Abstract — write binary (attachments) |
| 7 | `NodeFsAdapter` (concrete IPC client) | adapters/NodeFsAdapter.js:24 | Electron renderer wrapper around IPC ops |
| 8 | `LocalAdapter` (browser fallback) | adapters/LocalAdapter.js:105 | localStorage-backed vault writer |
| 9 | `saveEntry` (useVault hook) | features/vault/useVault.js:163 | vault.write entry-as-markdown + remove old path on rename |
| 10 | `deleteEntry` (useVault hook) | features/vault/useVault.js:200 | moveToTrash entry's _path |
| 11 | `moveToTrash` | lib/vaultTrash.js:29 | vault.mkdir(.jotfolio/trash) + vault.move into trash |
| 12 | `restoreFromTrash` | lib/vaultTrash.js:39 | vault.mkdir target folder + vault.move out of trash |
| 13 | `trashPathFor` | lib/vaultTrash.js:12 | (helper — not a mutation; included as path producer) |
| 14 | `originalPathFromTrashPath` | lib/vaultTrash.js:19 | (helper — not a mutation) |
| 15 | `importAttachment` | lib/vaultAttachments.js:13 | vault.mkdir + vault.writeBinary attachments folder |
| 16 | `attachmentPathFor` | lib/vaultAttachments.js:7 | (helper path producer) |
| 17 | `exportVaultAsZip` | lib/vaultExportZip.js:142 | reads vault, writes zip artifact (no vault mutation but caller may write file) |
| 18 | `buildZip` | lib/vaultExportZip.js:61 | (in-memory, no vault mutation) |
| 19 | `saveOptOuts` | lib/keywordRules/optOutTracker.js:81 | vault.mkdir `_jotfolio` + vault.write OPT_OUTS_PATH |
| 20 | `saveRules` | lib/keywordRules/rulesStorage.js:58 | vault.mkdir `_jotfolio` + vault.write RULES_PATH |
| 21 | `saveManifest` | lib/compile/manifest.js:65 | vault.write MANIFEST_PATH (compile manifest) |
| 22 | `saveRelationshipReviewLedger` | lib/index/relationshipReview.js:209 | localStorage write only (not vault — but is a persistent mutation; flagged) |
| 23 | `saveRelationshipDecisions` | lib/index/relationshipDecisions.js:78 | localStorage write only |
| 24 | `setAIConfig` | lib/ai/providers.js:13 | localStorage write (`mgn-ai`) |
| 25 | `setOptIn` (telemetry) | lib/telemetry.js:23 | localStorage write (+ optionally Electron settings file via main) |
| 26 | `setRelationshipDecision` | lib/index/relationshipDecisions.js:25 | (in-memory return; persisted by callers via saveRelationshipDecisions) |
| 27 | `clearRelationshipDecision` | lib/index/relationshipDecisions.js:44 | (in-memory return; persisted by callers) |
| 28 | semantic index cache write | lib/semantic/index.js:78 | vault.mkdir `.jotfolio` + vault.write CACHE_PATH |
| 29 | App save canvas | App.jsx:796 | vault.write `canvases/<id>.canvas.json` |
| 30 | App save base | App.jsx:713 | vault.write basePath(id) |
| 31 | App create template | App.jsx:981 | vault.write `templates/<slug>.md` |
| 32 | App save template body | App.jsx:990 | vault.write template.path (serialized frontmatter) |
| 33 | App folder mkdir | App.jsx:428 | vault.mkdir(folder) |
| 34 | App folder delete (recurse) | App.jsx:398-401 | moveToTrash each affected file + vault.rmdir empty folders |
| 35 | App empty trash | App.jsx:490 | vault.remove each trash item |
| 36 | App permanent-delete trash item | App.jsx:473 | vault.remove(path) |
| 37 | App entry file move/rename | App.jsx:531 | vault.move(entry._path, target) |
| 38 | App import bases | App.jsx:1287 | vault.write basePath(b.id) per imported base |
| 39 | App import canvases | App.jsx:1294 | vault.write `canvases/<id>.canvas.json` per imported canvas |
| 40 | Settings delete vault item | features/settings/SettingsPanel.jsx:106 | vault.remove(confirming.path) |
| 41 | Settings empty namespace | features/settings/SettingsPanel.jsx:107 | vault.remove per item in matching set |
| 42 | PluginHost ensure settings dir | plugins/PluginHost.js:88 | vault.mkdir `.jotfolio/settings` |
| 43 | PluginHost write plugin settings | plugins/PluginHost.js:91 | vault.write SETTINGS_PATH |
| 44 | PluginHost vault.write proxy | plugins/PluginHost.js:206 | (perm-checked) vault.write for plugin |
| 45 | PluginHost vault.mkdir proxy | plugins/PluginHost.js:208 | (perm-checked) vault.mkdir for plugin |
| 46 | PluginHost vault.move proxy | plugins/PluginHost.js:209 | (perm-checked) vault.move for plugin |
| 47 | PluginHost vault.remove proxy | plugins/PluginHost.js:210 | (perm-checked) vault.remove for plugin |
| 48 | PluginHost uninstall removes plugin files | plugins/PluginHost.js:309 | vault.remove each file owned by plugin |
| 49 | PluginBridge `vault.write` RPC | plugins/PluginBridge.js:141 | bridges remote plugin write |
| 50 | PluginBridge `vault.mkdir` RPC | plugins/PluginBridge.js:149 | bridges remote plugin mkdir |
| 51 | PluginBridge `vault.move` RPC | plugins/PluginBridge.js:153 | bridges remote plugin move |
| 52 | PluginBridge `vault.remove` RPC | plugins/PluginBridge.js:157 | bridges remote plugin remove |
| 53 | PluginAPI vault.write | plugins/PluginAPI.js:33 | plugin-facing wrapper for vault.write |
| 54 | PluginAPI vault.mkdir | plugins/PluginAPI.js:41 | plugin-facing wrapper for vault.mkdir |
| 55 | PluginAPI vault.move | plugins/PluginAPI.js:45 | plugin-facing wrapper for vault.move |
| 56 | PluginAPI vault.remove | plugins/PluginAPI.js:49 | plugin-facing wrapper for vault.remove |
| 57 | pluginWorker vault.write RPC stub | plugins/pluginWorker.js:54 | worker-side proxy |
| 58 | pluginWorker vault.mkdir RPC stub | plugins/pluginWorker.js:56 | worker-side proxy |
| 59 | pluginWorker vault.move RPC stub | plugins/pluginWorker.js:57 | worker-side proxy |
| 60 | pluginWorker vault.remove RPC stub | plugins/pluginWorker.js:58 | worker-side proxy |
| 61 | installOfficial writes plugin files | plugins/officialPlugins.js:56 | vault.write per official-plugin file |
| 62 | Electron IPC `vault:write` | src-electron/main.js:218 | atomic temp+rename write to disk, snapshots.schedule(rel) |
| 63 | Electron IPC `vault:mkdir` | src-electron/main.js:247 | fs.mkdir recursive |
| 64 | Electron IPC `vault:move` | src-electron/main.js:253 | fs.rename, mkdir parent if needed |
| 65 | Electron IPC `vault:remove` | src-electron/main.js:278 | fs.unlink |
| 66 | Electron IPC `vault:rmdir` | src-electron/main.js:287 | fs.rmdir (empty only) |
| 67 | Electron IPC `vault:writeBinary` | src-electron/main.js:305 | atomic binary write |
| 68 | Electron IPC `snapshot:restore` | src-electron/main.js:243 | overwrite vault file with snapshot content |
| 69 | snapshots.take (recovery writer) | src-electron/snapshots.js:83 | mkdir + writeFile under `.jotfolio/recovery/<date>/...` |
| 70 | snapshots.restore | src-electron/snapshots.js:125 | tmp+rename write back over current file |
| 71 | snapshots.prune | src-electron/snapshots.js:144 | fs.rm recursive on retention-pruned dirs |

## 1.4 Package scripts

From `source/package.json` (the only `package.json` with scripts; root repo has none).

| # | Script name | Command | Purpose |
|---|---|---|---|
| 1 | `dev` | `vite` | Dev server on port 5174 (vite.config.js) |
| 2 | `build` | `vite build` | Production build to `dist/` |
| 3 | `preview` | `vite preview` | Serve `dist/` for local preview |
| 4 | `test` | `vitest run` | Run all unit tests once |
| 5 | `test:watch` | `vitest` | Run tests in watch mode |
| 6 | `electron:dev` | `concurrently -k "npm run dev" "wait-on http://localhost:5174 && electron ."` | Launch Vite + Electron in parallel for dev |
| 7 | `electron:build` | `npm run build && electron-builder` | Build renderer + package Electron installer |
| 8 | `build:testing` | `vite build && electron-builder --win --config electron-builder.testing.yml --publish never` | Build Windows test installer with alt config, no publish |
| 9 | `bench` | `node bench/runBench.js` | Run perf bench suite once |
| 10 | `bench:watch` | `node --watch bench/runBench.js` | Bench in watch mode |
| 11 | `bench:update-baseline` | `node bench/runBench.js --update-baseline` | Update perf baselines |
| 12 | `a11y` | `playwright test bench/a11y/` | Run axe-core/Playwright accessibility tests |

## 1.5 Background jobs

Triggers, timers, lifecycle hooks, IPC handlers. Renderer-side `setInterval` watchdog in `ConstellationView.jsx` is animation-loop tooling, not a true background job, but listed for completeness.

| # | Job/handler | Source file:line | Trigger |
|---|---|---|---|
| 1 | snapshots.schedule debounce timer | src-electron/snapshots.js:75 | setTimeout(60s) per `vault:write`; fires `take()` once writes settle |
| 2 | snapshots prune interval | src-electron/snapshots.js:214 | setInterval(1h) + immediate first run via `startPrune` |
| 3 | snapshots.startPrune lifecycle hook | src-electron/snapshots.js:212 | Called from `vault:pick` IPC + on restore-last-vault during `createWindow` |
| 4 | updater initial check delay | src-electron/updater.js:63 | setTimeout(3s) after main window mount → `checkForUpdatesAndNotify` |
| 5 | updater repeat check interval | src-electron/updater.js:64 | setInterval(15min) → `checkForUpdatesAndNotify` |
| 6 | autoUpdater 'error' listener | src-electron/updater.js:26 | electron-updater event → `update:status` IPC push |
| 7 | autoUpdater 'checking-for-update' | src-electron/updater.js:31 | electron-updater event → renderer status |
| 8 | autoUpdater 'update-available' | src-electron/updater.js:35 | electron-updater event |
| 9 | autoUpdater 'update-not-available' | src-electron/updater.js:39 | electron-updater event |
| 10 | autoUpdater 'download-progress' | src-electron/updater.js:43 | electron-updater event |
| 11 | autoUpdater 'update-downloaded' | src-electron/updater.js:52 | electron-updater event |
| 12 | IPC `update:check` | src-electron/updater.js:73 | renderer requests on-demand update check |
| 13 | IPC `update:install-now` | src-electron/updater.js:85 | renderer requests immediate quit+install |
| 14 | telemetry init (Sentry main) | src-electron/telemetry.js:70 | Called on module load in `main.js` |
| 15 | telemetry process.on('uncaughtException') | src-electron/telemetry.js:73 | Node process event → local crash log |
| 16 | telemetry process.on('unhandledRejection') | src-electron/telemetry.js:74 | Node process event → local crash log |
| 17 | app.whenReady → createWindow | src-electron/main.js:426 | Electron app ready → spawn BrowserWindow |
| 18 | app.on('window-all-closed') | src-electron/main.js:437 | All windows closed → quit (non-darwin) |
| 19 | app.on('activate') | src-electron/main.js:441 | macOS activate → re-create window if none |
| 20 | process.on('uncaughtException') (main) | src-electron/main.js:446 | Node process event → console.error |
| 21 | process.on('unhandledRejection') (main) | src-electron/main.js:447 | Node process event → console.error |
| 22 | mainWindow `closed` listener | src-electron/main.js:420 | Window close → null out ref + stopWatcher |
| 23 | mainWindow `will-navigate` | src-electron/main.js:381 | Pre-nav guard — blocks off-origin navigation |
| 24 | mainWindow `did-attach-webview` | src-electron/main.js:395 | Logs blocked webview attach attempts |
| 25 | webContents.setWindowOpenHandler | src-electron/main.js:370 | window.open / target=_blank → deny + maybe shell.openExternal |
| 26 | chokidar watcher 'add' | src-electron/main.js:105 | FS create event → IPC `vault:watch:event` |
| 27 | chokidar watcher 'change' | src-electron/main.js:106 | FS change event → IPC `vault:watch:event` |
| 28 | chokidar watcher 'unlink' | src-electron/main.js:107 | FS delete event → IPC `vault:watch:event` |
| 29 | IPC `vault:pick` | src-electron/main.js:120 | Renderer asks for folder picker; persists vault + starts watcher/snapshots |
| 30 | IPC `vault:current` | src-electron/main.js:139 | Renderer query for current vault path |
| 31 | IPC `vault:list` | src-electron/main.js:143 | Renderer recursive directory listing |
| 32 | IPC `vault:read` | src-electron/main.js:208 | Renderer file read (UTF-8) |
| 33 | IPC `vault:write` | src-electron/main.js:218 | Renderer atomic write; triggers snapshots.schedule |
| 34 | IPC `snapshot:list` | src-electron/main.js:240 | Renderer asks for snapshot history of a file |
| 35 | IPC `snapshot:restore` | src-electron/main.js:243 | Renderer requests snapshot restore |
| 36 | IPC `vault:mkdir` | src-electron/main.js:247 | Renderer mkdir |
| 37 | IPC `vault:move` | src-electron/main.js:253 | Renderer rename/move |
| 38 | IPC `vault:remove` | src-electron/main.js:278 | Renderer file delete |
| 39 | IPC `vault:rmdir` | src-electron/main.js:287 | Renderer empty-folder delete |
| 40 | IPC `vault:readBinary` | src-electron/main.js:297 | Renderer binary file read |
| 41 | IPC `vault:writeBinary` | src-electron/main.js:305 | Renderer atomic binary write |
| 42 | IPC `app:open-external` | src-electron/main.js:322 | Renderer requests opening an external URL (https/mailto only) |
| 43 | IPC `app:show-item-in-folder` | src-electron/main.js:329 | Renderer requests OS file reveal |
| 44 | IPC `app:relaunch` | src-electron/main.js:334 | Renderer requests app.relaunch + exit |
| 45 | IPC `app:userDataPath` | src-electron/main.js:339 | Renderer asks for userData dir |
| 46 | IPC `telemetry:getOptIn` | src-electron/main.js:341 | Renderer queries telemetry opt-in state |
| 47 | IPC `telemetry:setOptIn` | src-electron/main.js:345 | Renderer sets telemetry opt-in |
| 48 | ConstellationView RAF-watchdog interval | features/constellation/ConstellationView.jsx:491 | setInterval fallback when RAF stalls during graph layout |

---

Total: **165 items across 5 subcategories** (31 routes + 316 exports + 71 vault mutations + 12 package scripts + 48 background jobs/handlers — exports list dominates; raw subcategory item counts: 1.1=31, 1.2=316, 1.3=71, 1.4=12, 1.5=48 = **478 rows total**).
