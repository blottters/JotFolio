# JotFolio Test Coverage Inventory

Branch: `phase2/5174-transformation` @ `18af965`
Generated: 2026-05-16

Type in { route, api, component, mutation, job, cli }
Test Status in { missing, exists, passing, failing }

| # | Feature | Source File | Type | Test Status | Test File |
|---|---------|-------------|------|-------------|-----------|
| 1 | App root shell | source/src/App.jsx | component | passing | source/src/App.notesEditor.test.jsx + App.workstation.test.jsx |
| 2 | App route content | source/src/features/shell/AppRouteContent.jsx | route | passing | source/src/features/shell/AppRouteContent.ai.test.jsx + .notes.test.jsx + .notesEditor.regression.test.jsx |
| 3 | App shell state | source/src/features/shell/appShellState.js | api | passing | source/src/features/shell/appShellState.test.js |
| 4 | App confirm dialog | source/src/features/shell/AppConfirmDialog.jsx | component | passing | source/src/features/shell/AppConfirmDialog.test.jsx |
| 5 | Entry file dialog | source/src/features/shell/EntryFileDialog.jsx | component | passing | source/src/features/shell/EntryFileDialog.test.jsx |
| 6 | Add modal | source/src/features/add/AddModal.jsx | component | passing | source/src/features/add/AddModal.test.jsx |
| 7 | Bases explorer | source/src/features/bases/BaseExplorer.jsx | component | passing | source/src/features/bases/BaseExplorer.test.jsx |
| 8 | Base view | source/src/features/bases/BaseView.jsx | component | passing | source/src/features/bases/BaseView.test.jsx |
| 9 | Canvas explorer | source/src/features/canvas/CanvasExplorer.jsx | component | passing | source/src/features/canvas/CanvasExplorer.test.jsx |
| 10 | Canvas view | source/src/features/canvas/CanvasView.jsx | component | passing | source/src/features/canvas/CanvasView.test.jsx |
| 11 | Note card | source/src/features/card/Card.jsx | component | passing | source/src/features/card/Card.test.jsx |
| 12 | Note row | source/src/features/card/Row.jsx | component | passing | source/src/features/card/Row.test.jsx |
| 13 | Command palette | source/src/features/commandPalette/CommandPalette.jsx | component | passing | source/src/features/commandPalette/CommandPalette.test.jsx |
| 14 | Built-in commands | source/src/features/commandPalette/builtinCommands.js | api | passing | source/src/features/commandPalette/builtinCommands.test.js |
| 15 | Compile preview modal | source/src/features/constellation/CompilePreviewModal.jsx | component | passing | source/src/features/constellation/CompilePreviewModal.test.jsx |
| 16 | Constellation state overlay | source/src/features/constellation/ConstellationStateOverlay.jsx | component | passing | source/src/features/constellation/ConstellationStateOverlay.test.jsx |
| 17 | Constellation view | source/src/features/constellation/ConstellationView.jsx | component | passing | source/src/features/constellation/ConstellationView.test.jsx |
| 18 | Memory detail panel | source/src/features/constellation/MemoryDetailPanel.jsx | component | passing | source/src/features/constellation/MemoryDetailPanel.test.jsx |
| 19 | Memory node | source/src/features/constellation/MemoryNode.jsx | component | passing | source/src/features/constellation/MemoryNode.test.jsx |
| 20 | Split memory modal | source/src/features/constellation/SplitMemoryModal.jsx | component | passing | source/src/features/constellation/SplitMemoryModal.test.jsx |
| 21 | Constellation visuals | source/src/features/constellation/constellationVisuals.js | api | passing | source/src/features/constellation/constellationVisuals.test.js |
| 22 | Constellation layout | source/src/features/constellation/layout.js | api | passing | source/src/features/constellation/layout.test.js |
| 23 | Constellation node renderers | source/src/features/constellation/nodeRenderers.jsx | component | passing | source/src/features/constellation/nodeRenderers.test.jsx |
| 24 | Constellation components | source/src/features/constellation/* | component | passing | source/src/features/constellation/__tests__/components.test.js |
| 25 | Detail panel | source/src/features/detail/DetailPanel.jsx | component | passing | source/src/features/detail/DetailPanel.test.jsx |
| 26 | Font dropdown | source/src/features/dropdowns/FontDropdown.jsx | component | passing | source/src/features/dropdowns/FontDropdown.test.jsx |
| 27 | Hex input | source/src/features/dropdowns/HexInput.jsx | component | passing | source/src/features/dropdowns/HexInput.test.jsx |
| 28 | Generic select | source/src/features/dropdowns/Select.jsx | component | passing | source/src/features/dropdowns/Select.test.jsx |
| 29 | Theme dropdown | source/src/features/dropdowns/ThemeDropdown.jsx | component | passing | source/src/features/dropdowns/ThemeDropdown.test.jsx |
| 30 | Dropdown bus | source/src/features/dropdowns/bus.js | api | passing | source/src/features/dropdowns/bus.test.jsx |
| 31 | Note body editor | source/src/features/editor/NoteBody.jsx | component | passing | source/src/features/editor/NoteBody.test.jsx |
| 32 | Empty state | source/src/features/emptystate/EmptyState.jsx | component | passing | source/src/features/emptystate/EmptyState.test.jsx |
| 33 | Notes workspace view | source/src/features/notes/NotesWorkspaceView.jsx | component | passing | source/src/features/notes/NotesWorkspaceView.test.jsx + regression |
| 34 | Plugin panel slot | source/src/features/plugins/PluginPanelSlot.jsx | component | passing | source/src/features/plugins/PluginPanelSlot.test.jsx |
| 35 | Tag suggestions | source/src/features/primitives/TagSuggestions.jsx | component | passing | source/src/features/primitives/TagSuggestions.test.jsx |
| 36 | Toasts | source/src/features/primitives/Toasts.jsx | component | passing | source/src/features/primitives/Toasts.test.jsx |
| 37 | Properties panel | source/src/features/properties/PropertiesPanel.jsx | component | passing | source/src/features/properties/PropertiesPanel.test.jsx |
| 38 | Quick switcher | source/src/features/quickSwitcher/QuickSwitcher.jsx | component | passing | source/src/features/quickSwitcher/QuickSwitcher.test.jsx |
| 39 | Ribbon | source/src/features/ribbon/Ribbon.jsx | component | passing | source/src/features/ribbon/Ribbon.test.jsx |
| 40 | Keyword rules panel | source/src/features/settings/KeywordRulesPanel.jsx | component | passing | source/src/features/settings/KeywordRulesPanel.test.jsx |
| 41 | Plugins settings panel | source/src/features/settings/PluginsPanel.jsx | component | passing | source/src/features/settings/PluginsPanel.test.jsx |
| 42 | Privacy panel | source/src/features/settings/PrivacyPanel.jsx | component | passing | source/src/features/settings/PrivacyPanel.test.jsx |
| 43 | Settings panel | source/src/features/settings/SettingsPanel.jsx | component | passing | source/src/features/settings/SettingsPanel.test.jsx + safety |
| 44 | Updates panel | source/src/features/settings/UpdatesPanel.jsx | component | passing | source/src/features/settings/UpdatesPanel.test.jsx |
| 45 | Sidebar | source/src/features/sidebar/Sidebar.jsx | component | passing | source/src/features/sidebar/Sidebar.test.jsx |
| 46 | Tag manage dialog | source/src/features/tags/TagManageDialog.jsx | component | passing | source/src/features/tags/TagManageDialog.test.jsx |
| 47 | Insert template modal | source/src/features/templates/InsertTemplateModal.jsx | component | passing | source/src/features/templates/InsertTemplateModal.test.jsx |
| 48 | Templates panel | source/src/features/templates/TemplatesPanel.jsx | component | passing | source/src/features/templates/TemplatesPanel.test.jsx |
| 49 | Toolbar | source/src/features/toolbar/Toolbar.jsx | component | passing | source/src/features/toolbar/Toolbar.test.jsx |
| 50 | Trash view | source/src/features/trash/TrashView.jsx | component | passing | source/src/features/trash/TrashView.test.jsx |
| 51 | Update banner | source/src/features/updater/UpdateBanner.jsx | component | passing | source/src/features/updater/UpdateBanner.test.jsx |
| 52 | Vault picker | source/src/features/vault/VaultPicker.jsx | component | passing | source/src/features/vault/VaultPicker.test.jsx |
| 53 | useVault hook | source/src/features/vault/useVault.js | api | passing | source/src/features/vault/useVault.test.js |
| 54 | Notes rail | source/src/features/workstation/NotesRail.jsx | component | passing | source/src/features/workstation/NotesRail.test.jsx |
| 55 | Workspace top bar | source/src/features/workstation/WorkspaceTopBar.jsx | component | passing | source/src/features/workstation/WorkspaceTopBar.test.jsx |
| 56 | Workstation views | source/src/features/workstation/WorkstationViews.jsx | component | passing | source/src/features/workstation/WorkstationViews.test.jsx |
| 57 | Command center view | source/src/features/workstation/* | component | passing | source/src/features/workstation/CommandCenterView.test.jsx |
| 58 | Workspace context rail notes | source/src/features/workstation/* | component | passing | source/src/features/workstation/WorkspaceContextRail.notes.test.jsx |
| 59 | Welcome panel | source/src/onboarding/WelcomePanel.jsx | component | passing | source/src/onboarding/WelcomePanel.test.jsx |
| 60 | Onboarding activation | source/src/onboarding/activation.js | api | passing | source/src/onboarding/__tests__/activation.test.js |
| 61 | Import modal | source/src/onboarding/ImportModal.jsx | component | passing | source/src/onboarding/ImportModal.test.jsx |
| 62 | Onboarding nudges | source/src/onboarding/nudges.jsx | component | passing | source/src/onboarding/nudges.test.jsx |
| 63 | OpenRouter AI provider | source/src/lib/ai/openrouter.js | api | passing | source/src/lib/ai/openrouter.test.js |
| 64 | AI providers registry | source/src/lib/ai/providers.js | api | passing | source/src/lib/ai/providers.test.js |
| 65 | App hooks | source/src/lib/appHooks.js | api | passing | source/src/lib/appHooks.test.jsx |
| 66 | Base types | source/src/lib/base/baseTypes.js | api | passing | source/src/lib/base/baseTypes.test.js |
| 67 | Query base | source/src/lib/base/queryBase.js | api | passing | source/src/lib/base/queryBase.test.js |
| 68 | Canvas ops | source/src/lib/canvas/canvasOps.js | api | passing | source/src/lib/canvas/canvasOps.test.js |
| 69 | Canvas types | source/src/lib/canvas/canvasTypes.js | api | passing | source/src/lib/canvas/canvasTypes.test.js |
| 70 | Command registry (lib) | source/src/lib/command/commandRegistry.js | api | passing | source/src/lib/command/commandRegistry.test.js |
| 71 | Compile pipeline | source/src/lib/compile/compile.js | api | passing | source/src/lib/compile/compile.test.js |
| 72 | Compile index | source/src/lib/compile/index.js | api | passing | source/src/lib/compile/index.test.js |
| 73 | Deterministic stub compiler | source/src/lib/compile/compilers/deterministicStub.js | api | passing | source/src/lib/compile/compilers/deterministicStub.test.js |
| 74 | Compile hash | source/src/lib/compile/hash.js | api | passing | source/src/lib/compile/hash.test.js |
| 75 | Compile manifest | source/src/lib/compile/manifest.js | api | passing | source/src/lib/compile/manifest.test.js |
| 76 | Full demo vault | source/src/lib/demo/fullDemoVault.js | api | passing | source/src/lib/demo/fullDemoVault.test.js |
| 77 | Demo entries | source/src/lib/demoEntries.js | api | passing | source/src/lib/demoEntries.test.js |
| 78 | Exports (legacy) | source/src/lib/exports.js | api | passing | source/src/lib/exports.test.js |
| 79 | Export bundle | source/src/lib/exports/bundle.js | api | passing | source/src/lib/exports/bundle.test.js |
| 80 | Feature flags | source/src/lib/featureFlags.js | api | passing | source/src/lib/featureFlags.test.js |
| 81 | Frontmatter parser | source/src/lib/frontmatter.js | api | passing | source/src/lib/frontmatter.test.js |
| 82 | Lib hooks | source/src/lib/hooks.js | api | passing | source/src/lib/hooks.test.jsx |
| 83 | useSemanticIndex hook | source/src/lib/hooks/useSemanticIndex.js | api | passing | source/src/lib/hooks/useSemanticIndex.test.js |
| 84 | Relationship decisions | source/src/lib/index/relationshipDecisions.js | api | passing | source/src/lib/index/relationshipDecisions.test.js |
| 85 | Relationship review | source/src/lib/index/relationshipReview.js | api | passing | source/src/lib/index/relationshipReview.test.js |
| 86 | Vault index | source/src/lib/index/vaultIndex.js | api | passing | source/src/lib/index/vaultIndex.test.js |
| 87 | Apply keyword rules | source/src/lib/keywordRules/applyRules.js | api | passing | source/src/lib/keywordRules/applyRules.test.js |
| 88 | Opt-out tracker | source/src/lib/keywordRules/optOutTracker.js | api | passing | source/src/lib/keywordRules/optOutTracker.test.js |
| 89 | Parse keyword rules | source/src/lib/keywordRules/parseRules.js | api | passing | source/src/lib/keywordRules/parseRules.test.js |
| 90 | Keyword rules storage | source/src/lib/keywordRules/rulesStorage.js | api | passing | source/src/lib/keywordRules/rulesStorage.test.js |
| 91 | useKeywordRules hook | source/src/lib/keywordRules/useKeywordRules.js | api | passing | source/src/lib/keywordRules/useKeywordRules.test.js |
| 92 | Markdown render/sanitize | source/src/lib/markdown.js | api | passing | source/src/lib/__tests__/markdownUrl.test.js + security/__tests__/hardening.test.js |
| 93 | Confirm memory | source/src/lib/memory/confirmMemory.js | api | passing | source/src/lib/memory/confirmMemory.test.js |
| 94 | Graduate tied memory | source/src/lib/memory/graduateTied.js | api | passing | source/src/lib/memory/graduateTied.test.js |
| 95 | Parse facts | source/src/lib/memory/parseFacts.js | api | passing | source/src/lib/memory/parseFacts.test.js |
| 96 | Split memory | source/src/lib/memory/splitMemory.js | api | passing | source/src/lib/memory/splitMemory.test.js |
| 97 | Parser: blocks | source/src/lib/parser/blocks.js | api | passing | source/src/lib/parser/parser.test.js |
| 98 | Parser: codeMask | source/src/lib/parser/codeMask.js | api | passing | source/src/lib/parser/parser.test.js |
| 99 | Parser: embeds | source/src/lib/parser/embeds.js | api | passing | source/src/lib/parser/parser.test.js |
| 100 | Parser: headings | source/src/lib/parser/headings.js | api | passing | source/src/lib/parser/parser.test.js |
| 101 | Parser: tags | source/src/lib/parser/tags.js | api | passing | source/src/lib/parser/parser.test.js |
| 102 | Parser: wikilinks | source/src/lib/parser/wikilinks.js | api | passing | source/src/lib/parser/parser.test.js |
| 103 | WordCount panel plugin | source/src/lib/plugin/builtinPlugins/WordCountPanel.jsx | component | passing | source/src/lib/plugin/builtinPlugins/WordCountPanel.test.jsx |
| 104 | wordCount plugin entry | source/src/lib/plugin/builtinPlugins/wordCount.js | api | passing | source/src/lib/plugin/builtinPlugins/wordCount.test.js |
| 105 | wordCount stats | source/src/lib/plugin/builtinPlugins/wordCountStats.js | api | passing | source/src/lib/plugin/builtinPlugins/wordCountStats.test.js |
| 106 | Plugin host (lib) | source/src/lib/plugin/pluginHost.js | api | passing | source/src/lib/plugin/pluginHost.test.js |
| 107 | Quick switcher search | source/src/lib/quickSwitcher/quickSwitcherSearch.js | api | passing | source/src/lib/quickSwitcher/quickSwitcherSearch.test.js |
| 108 | Random note | source/src/lib/random/randomNote.js | api | passing | source/src/lib/random/randomNote.test.js |
| 109 | Search vault | source/src/lib/search/searchVault.js | api | passing | source/src/lib/search/searchVault.test.js |
| 110 | Semantic embed | source/src/lib/semantic/embed.js | api | passing | source/src/lib/semantic/embed.test.js |
| 111 | Semantic index | source/src/lib/semantic/index.js | api | passing | source/src/lib/semantic/index.test.js |
| 112 | Semantic similarity | source/src/lib/semantic/similarity.js | api | passing | source/src/lib/semantic/similarity.test.js |
| 113 | Snapshot retention | source/src/lib/snapshotRetention | api | passing | source/src/lib/snapshotRetention.test.js |
| 114 | Local storage helper | source/src/lib/storage.js | api | passing | source/src/lib/storage.test.js |
| 115 | Lib telemetry | source/src/lib/telemetry.js | api | passing | source/src/lib/telemetry.test.js |
| 116 | Template backlinks | source/src/lib/templates/templateBacklinks.js | api | passing | source/src/lib/templates/templateBacklinks.test.js |
| 117 | Template store | source/src/lib/templates/templateStore.js | api | passing | source/src/lib/templates/templateStore.test.js |
| 118 | Theme defaults | source/src/lib/theme/defaults.js | api | passing | source/src/lib/theme/defaults.test.js |
| 119 | Theme resolve | source/src/lib/theme/resolve.js | api | passing | source/src/lib/theme/resolve.test.js |
| 120 | Theme CSS | source/src/lib/theme/themeCss.js | api | passing | source/src/lib/theme/themeCss.test.js |
| 121 | Theme registry | source/src/lib/theme/themes.js | api | passing | source/src/lib/theme/themes.test.js |
| 122 | Victory theme | source/src/lib/theme/victoryTheme.js | api | passing | source/src/lib/theme/victoryTheme.test.js |
| 123 | Lib types | source/src/lib/types.js | api | passing | source/src/lib/types.test.js |
| 124 | Vault attachments | source/src/lib/vaultAttachments.js | mutation | passing | source/src/lib/vaultAttachments.test.js |
| 125 | Vault export zip | source/src/lib/vaultExportZip.js | mutation | passing | source/src/lib/vaultExportZip.test.js |
| 126 | Vault paths | source/src/lib/vaultPaths.js | api | passing | source/src/lib/vaultPaths.test.js |
| 127 | Vault trash | source/src/lib/vaultTrash.js | mutation | passing | source/src/lib/vaultTrash.test.js |
| 128 | Workstation data | source/src/lib/workstation/workstationData.js | api | passing | source/src/lib/workstation/workstationData.test.js |
| 129 | Local adapter | source/src/adapters/LocalAdapter.js | api | passing | source/src/adapters/__tests__/LocalAdapter.test.js |
| 130 | Node FS adapter | source/src/adapters/NodeFsAdapter.js | api | passing | source/src/adapters/NodeFsAdapter.test.js |
| 131 | Vault adapter interface | source/src/adapters/VaultAdapter.js | api | passing | source/src/adapters/VaultAdapter.test.js |
| 132 | Vault error class | source/src/adapters/VaultError.js | api | passing | source/src/adapters/VaultError.test.js |
| 133 | Adapters index | source/src/adapters/index.js | api | passing | source/src/adapters/index.test.js |
| 134 | JotFolio parser | source/src/parsers/jotfolio.js | api | passing | source/src/parsers/__tests__/jotfolio.test.js |
| 135 | Kindle parser | source/src/parsers/kindle.js | api | passing | source/src/parsers/__tests__/kindle.test.js |
| 136 | Obsidian parser | source/src/parsers/obsidian.js | api | passing | source/src/parsers/__tests__/obsidian.test.js |
| 137 | Pocket parser | source/src/parsers/pocket.js | api | passing | source/src/parsers/__tests__/pocket.test.js |
| 138 | Readwise parser | source/src/parsers/readwise.js | api | passing | source/src/parsers/__tests__/readwise.test.js |
| 139 | Plugin command registry | source/src/plugins/CommandRegistry.js | api | passing | source/src/security/__tests__/hardening.test.js |
| 140 | Plugin event bus | source/src/plugins/EventBus.js | api | passing | source/src/plugins/EventBus.test.js |
| 141 | Plugin API surface | source/src/plugins/PluginAPI.js | api | passing | source/src/security/__tests__/hardening.test.js |
| 142 | Plugin bridge | source/src/plugins/PluginBridge.js | api | passing | source/src/plugins/PluginBridge.test.js |
| 143 | Plugin host (worker) | source/src/plugins/PluginHost.js | api | passing | source/src/plugins/__tests__/PluginHost.test.js |
| 144 | Official plugins | source/src/plugins/officialPlugins.js | api | passing | source/src/plugins/officialPlugins.test.js |
| 145 | Plugin worker | source/src/plugins/pluginWorker.js | job | passing | source/src/plugins/pluginWorker.test.js |
| 146 | Plugin sandbox hardening | source/src/plugins/* | api | passing | source/src/plugins/__tests__/sandbox.test.js |
| 147 | Electron main process | source/src-electron/main.js | job | passing | source/src-electron/main.test.js |
| 148 | Electron menus | source/src-electron/menus.js | job | passing | source/src-electron/menus.test.js |
| 149 | openExternalSafe (electron) | source/src-electron/openExternalSafe.js | api | passing | source/src-electron/openExternalSafe.test.js |
| 150 | Electron preload | source/src-electron/preload.js | job | passing | source/src-electron/preload.test.js |
| 151 | Electron snapshots | source/src-electron/snapshots.js | job | passing | source/src-electron/snapshots.test.js |
| 152 | Electron telemetry | source/src-electron/telemetry.js | job | passing | source/src-electron/telemetry.test.js |
| 153 | Electron auto-updater | source/src-electron/updater.js | job | passing | source/src-electron/updater.test.js |
| 154 | CLI: dev (vite) | source/package.json#scripts.dev | cli | passing | source/src/__tests__/packageScripts.test.js |
| 155 | CLI: build (vite) | source/package.json#scripts.build | cli | passing | source/src/__tests__/packageScripts.test.js |
| 156 | CLI: preview (vite) | source/package.json#scripts.preview | cli | passing | source/src/__tests__/packageScripts.test.js |
| 157 | CLI: bench | source/package.json#scripts.bench | cli | passing | source/src/__tests__/packageScripts.test.js |
| 158 | CLI: a11y (playwright) | source/package.json#scripts.a11y | cli | passing | source/src/__tests__/packageScripts.test.js |
| 159 | CLI: electron:build | source/package.json#scripts.electron:build | cli | passing | source/src/__tests__/packageScripts.test.js |
| 160 | CLI: build:testing | source/package.json#scripts.build:testing | cli | passing | source/src/__tests__/packageScripts.test.js |
| 161 | Test harness setup | source/src/test-setup.js | api | passing | source/src/test-setup.test.js |

Total features: 161

## Phase 4 verification

Full suite run @ 2026-05-16:
- Suites: 388/388 passing
- Tests:  1045/1045 passing
- success: True

Row counts: passing=161, missing=0, failing=0.

Coverage: 161/161 features passing.
