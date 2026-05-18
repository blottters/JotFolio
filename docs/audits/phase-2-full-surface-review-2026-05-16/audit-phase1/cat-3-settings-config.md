# Phase 1 Audit — Category 3: SETTINGS, CONFIG, ENV VARS, FEATURE FLAGS

Branch: `phase2/5174-transformation` @ 18af965
Mode: read-only research. One row per distinct configurable surface.

---

## 3.1 Feature flags

All flags defined in `DEFAULT_FEATURE_FLAGS` (the only flag constant in the codebase). No other top-level flag registries found.

| # | Key | Default | Source file:line | What it gates |
|---|---|---|---|---|
| 1 | `wiki_mode` | `true` | source/src/lib/featureFlags.js:5 | Wiki-type entries showing up in UI (`shouldShowEntryType('wiki')` → `filterEntriesForUI` consumed by `App.jsx:869 visibleEntries`); also gates keyword-rule processing per `useKeywordRules.js:81` comment and the `KNOWLEDGE_FLAG_MAP` in `ConstellationView.jsx:31` + `EmptyState.jsx:5` |
| 2 | `raw_inbox` | `true` | source/src/lib/featureFlags.js:6 | Raw-inbox entry visibility via same `filterEntriesForUI` path; `EmptyState.jsx:8 knowledgeOn` check; `KNOWLEDGE_FLAG_MAP` in Constellation + EmptyState |
| 3 | `review_queue` | `true` | source/src/lib/featureFlags.js:7 | Review-queue entry visibility through `filterEntriesForUI`; included in `knowledgeOn` group in EmptyState |
| 4 | `context_packs` | `false` | source/src/lib/featureFlags.js:9 | Strict opt-in for a still-dark phase. `(orphan-suspect)` — only referenced in featureFlags.js + its test; no production reader of `flags.context_packs` anywhere |
| 5 | `memory_graph_nodes` | `false` | source/src/lib/featureFlags.js:10 | Strict opt-in for a still-dark phase. `(orphan-suspect)` — only featureFlags.js + its test; no production reader |
| 6 | `semanticEdges` | `false` | source/src/lib/featureFlags.js:13 | Phase 2 MiniLM dashed semantic edges in Constellation. Read at `App.jsx:882` to gate `useSemanticIndex` loading, and at `ConstellationView.jsx:270 semanticEnabled` to draw edges |

---

## 3.2 User preferences

Single source: `DEFAULT_PREFS` inline-declared on `source/src/App.jsx:111`. Persisted under storage key `mgn-p` (see 3.3) under the `prefs:` subtree.

| # | Pref key | Default | Type | UI editor (file:line) | Read sites |
|---|---|---|---|---|---|
| 1 | `fontSize` | `13` | number | SettingsPanel.jsx:447, :486 (range slider, Appearance tab) | App.jsx:861 (zoom no-op effect) |
| 2 | `fontFamily` | `''` | string | SettingsPanel.jsx:481 (FontDropdown, Appearance advanced) | App.jsx:591, :595 (resolveThemeVars input) |
| 3 | `userName` | `'Gavin'` | string | **NOT editable in UI** `(orphan-suspect)` — read at App.jsx:1435 + :1492 but no setter UI found anywhere. Hardcoded fallback `\|\| 'Gavin'`. |
| 4 | `cardDensity` | `'comfortable'` | enum: compact/comfortable/spacious | SettingsPanel.jsx:493 (Appearance advanced) | features/card/Card.jsx:11 |
| 5 | `sidebarWidth` | `272` | number | SettingsPanel.jsx:499 (Narrow=180 / Standard=240 / Wide=300, Appearance advanced) | App.jsx:1438 (Sidebar width prop). NOTE: default 272 isn't one of the three UI options — first save snaps to one of 180/240/300 |
| 6 | `defaultView` | `'grid'` | enum: grid/list | SettingsPanel.jsx:531 (Library tab) | App.jsx:634 (initial setView on prefs load) |
| 7 | `defaultSort` | `'date'` | enum: date/title/starred | SettingsPanel.jsx:540 (Library tab) | App.jsx:634 (initial setSort on prefs load) |
| 8 | `showNotesPreview` | `true` | boolean | SettingsPanel.jsx:544–557 (Library "Card Display") | features/card/Card.jsx:33, features/card/Row.jsx:20 |
| 9 | `showDateOnCards` | `true` | boolean | SettingsPanel.jsx:544–557 | features/card/Card.jsx:40–41, features/card/Row.jsx:25 |
| 10 | `showTagsOnCards` | `true` | boolean | SettingsPanel.jsx:544–557 | features/card/Card.jsx:34, features/card/Row.jsx:21 |
| 11 | `defaultLayoutMode` | `'messy'` | string | **NOT editable in UI** `(orphan-suspect)` — read at features/shell/AppRouteContent.jsx:325 with hardcoded `\|\|'messy'` fallback; no SettingsPanel knob, no other writer |
| 12 | `constellationStyle` | `'star'` | enum: star/board/editorial | SettingsPanel.jsx:505 (Appearance advanced) | features/shell/AppRouteContent.jsx:330 |
| 13 | `typeSaturation` | `'signal'` | enum: signal/bone/sepia/cool/mono (plus legacy full/muted handled in UI) | SettingsPanel.jsx:511 (Appearance advanced) | features/shell/AppRouteContent.jsx:331 |
| 14 | `constellationBg` | `'atlas'` | enum: atlas/solid/vignette/grid/constellation | SettingsPanel.jsx:517 (Appearance advanced) | features/shell/AppRouteContent.jsx:332 |
| 15 | `featureFlags` | `DEFAULT_FEATURE_FLAGS` (frozen object) | object | **NOT editable in UI** `(orphan-suspect)` — no SettingsPanel UI exposes individual flag toggles. Only flippable by editing storage or by the alpha.18 migration at App.jsx:631–633 force-resetting to defaults | App.jsx:869, :882, :1463 (passed as `flags` to AppRouteContent + Sidebar + Constellation) |

### Prefs-shaped fields used as migration markers (written, never user-editable):
| # | Key | Default | Source file:line | Purpose |
|---|---|---|---|---|
| 16 | `constellationSignalDefaultAlpha26` | absent → set `true` on first load post-alpha.26 | App.jsx:618–625 | One-shot migration marker for the alpha.26 Constellation signal defaults rewrite |
| 17 | `featureFlagsResetAlpha18` | absent → set `true` on first load post-alpha.18 | App.jsx:631–633 | One-shot migration marker for re-enabling knowledge flags. References dropped marker `featureFlagsResetAlpha17` in comment, suggesting prior generations existed and are gone now |

---

## 3.3 localStorage / window.storage keys

Includes both `localStorage.*` direct calls and `storage.set/get` (which wraps `window.storage` in artifact mode, falling back to `localStorage`). One row per distinct key.

| # | Key | Default ns | Write site(s) | Read site(s) | Notes |
|---|---|---|---|---|---|
| 1 | `mgn-p` | mgn-* (legacy) | App.jsx:671 (via storage.set) | App.jsx:607 (storage.get); demo seeder fullDemoVault.js:503 also writes | Bundle of `{theme, darkMode, sidebarOpen, customColors, prefs}` |
| 2 | `mgn-e` | mgn-* | (legacy entries — no current writer in app code) | features/vault/useVault.js:215 (migration read-once) | LEGACY_KEY = mgn-e — migration only. `(orphan-suspect)` for writes — no production writer; only test code writes |
| 3 | `mgn-vault-migrated` | mgn-* | App.jsx:662 (storage.set) | App.jsx:655 (storage.get) | Boolean flag: legacy-vault migration completed once |
| 4 | `mgn-onboarded` | mgn-* | onboarding/activation.js:76 (setOnboarded); demo seeder fullDemoVault.js:547; SettingsPanel.jsx:589 (removeItem to reopen welcome) | onboarding/activation.js:69 (isOnboarded) | Bool — first-run welcome dismiss |
| 5 | `mgn-activation` | mgn-* | onboarding/activation.js:40 (writeActivation), :87 (migrateIfNeeded) | onboarding/activation.js:29 (readActivation), :139 (storage-event listener in useActivation) | `{firstSaveAt, thirdSaveAt, lastSeenAt, bannersDismissed[]}` |
| 6 | `mgn-events` | mgn-* | onboarding/activation.js:119 (logEvent) | onboarding/activation.js:125 (readEventLog) — **but readEventLog is only called from tests in prod code search; no in-app reader.** `(orphan-suspect)` — write-heavy from App.jsx:222, WelcomePanel.jsx (5 sites), never displayed or exported in app UI |
| 7 | `mgn-settings-advanced` | mgn-* | features/settings/SettingsPanel.jsx:368 | features/settings/SettingsPanel.jsx:366 | Bool — show/hide advanced Appearance fields |
| 8 | `mgn-ai` | mgn-* | lib/ai/providers.js:13 (setAIConfig) | lib/ai/providers.js:12 (getAIConfig) | AI config bundle `{enabled, provider, model, key, customUrl}` |
| 9 | `mgn-or-pkce` (sessionStorage) | mgn-* | lib/ai/openrouter.js:13 | lib/ai/openrouter.js:18; lib/appHooks.js:10 | OpenRouter PKCE verifier (sessionStorage, not localStorage) |
| 10 | `mgn-telemetry` | mgn-* | lib/telemetry.js:24, :40, :46 (setOptIn + hydrate) | lib/telemetry.js:17 (userOptedIn), :32 (hasDecided) | `{enabled, decidedAt, source?}` — opt-in record |
| 11 | `jf-vault-local` | jf-* | adapters/LocalAdapter.js:99 (saveStore); demo seeder fullDemoVault.js:546 | adapters/LocalAdapter.js:74 (loadStore) | Browser-fallback virtual vault (entire vault as one JSON blob in localStorage) |
| 12 | `jf-command-center-focus-mode` | jf-* | App.jsx:180 | App.jsx:130 | String enum — last-selected focus mode (`'deep-work'`, `'planning'`, `'capture'`, `'review'`) |
| 13 | `jf-command-center-mode-state` | jf-* | features/workstation/WorkstationViews.jsx:642 | features/workstation/WorkstationViews.jsx:631 | Per-mode state bundle `{deepWork, planning, capture, review}` with reflection/goals etc |
| 14 | `jf-relationship-decisions` | jf-* | lib/index/relationshipDecisions.js:80 (saveRelationshipDecisions); called by features/constellation/ConstellationView.jsx:182, :189 | lib/index/relationshipDecisions.js:72; ConstellationView.jsx:61 (loadRelationshipDecisions in useState initializer) | Graph health "accepted/rejected/ignored" decisions |
| 15 | `jf-relationship-review-ledger` | jf-* | lib/index/relationshipReview.js:211 (saveRelationshipReviewLedger) — **export not called from any production caller (only test).** `(orphan-suspect)` — fully reachable load/save fns exported but no in-app wiring; `loadRelationshipReviewLedger` never imported outside its own test file | lib/index/relationshipReview.js:203 — same orphan status | The whole "review ledger" surface appears unwired |
| 16 | `jf-demo-seed-status` | jf-* | lib/demo/fullDemoVault.js:536, :549 | **no production reader found** `(orphan-suspect)` — written by demo seeder, never read in app code or surfaced in UI | Status record `{status, reason, existingFileCount, seededAt}` |
| 17 | Quarantine keys: `${k}.corrupt.${stamp}` | dynamic | lib/storage.js:41 (localStorage), :39 (window.storage) | (manual recovery surface — no automated reader) | Generated per-call by storageQuarantineKey; not a fixed key |

---

## 3.4 Environment variables

| # | Name | Read site (file:line) | Default fallback | Scope |
|---|---|---|---|---|
| 1 | `SENTRY_DSN` | source/src-electron/telemetry.js:14 | `''` (empty → telemetry init no-op) | Electron main process; build-time injected, ignored if absent |
| 2 | `VITE_SENTRY_DSN` | source/src-electron/telemetry.js:14 (fallback) AND source/src/lib/telemetry.js:8 (renderer) | `''` | Both processes — exposed via Vite to renderer; also used by main as fallback when `SENTRY_DSN` absent |
| 3 | `VITE_APP_VERSION` | source/src/lib/telemetry.js:9 | `'0.0.0-dev'` | Renderer (Vite-exposed) — used as Sentry release tag |
| 4 | `import.meta.env.PROD` | source/src/lib/telemetry.js:85 | — (Vite-injected boolean) | Renderer — sets Sentry environment label (`'production'` vs `'development'`) |
| 5 | `A11Y_BASE_URL` | source/bench/a11y/flows.spec.js:18 | `'http://127.0.0.1:5174'` | Playwright a11y bench only |

No `.env*` files committed (gitignored per `.gitignore:14-18`). All four production-relevant vars are injected at build time via CI or local dev shell.

---

## 3.5 Config files

| # | File | Purpose | Distinct settings |
|---|---|---|---|
| 1 | `source/package.json` | NPM manifest + electron-builder embedded `build:` block | Top-level: `name`, `private:true`, `version` (0.5.0-alpha.25), `description`, `author`, `type:module`, `main:src-electron/main.js`. `scripts:` (dev, build, preview, test, test:watch, electron:dev, electron:build, build:testing, bench, bench:watch, bench:update-baseline, a11y). `overrides:` (onnxruntime-web pinned to 1.26.0). `build:` (electron-builder config): `appId:com.jotfolio.app`, `productName:JotFolio`, `artifactName:${productName}-Setup-${version}.${ext}`, `directories.output:dist-electron`, `files:[dist/**/*, src-electron/**/*]`, `publish.provider:github` + `owner:blottters` + `repo:JotFolio` + `releaseType:release`, `mac:{category:public.app-category.productivity, target:[dmg,zip], hardenedRuntime:true, gatekeeperAssess:false, entitlements:build/entitlements.mac.plist, entitlementsInherit, notarize:false}`, `win.target:[nsis]`, `linux:{target:[AppImage,deb], category:Office}` |
| 2 | `source/vite.config.js` | Vite build config | `base:'./'` (relative for file:// in packaged Electron), `plugins:[react()]`, `server.port:5174` |
| 3 | `source/vitest.config.js` | Vitest test config | `plugins:[react()]`, `test.environment:'jsdom'`, `test.setupFiles:['./src/test-setup.js']`, `test.globals:true`, `test.exclude:['node_modules/**','dist/**','dist-electron/**','bench/**']` |
| 4 | `source/electron-builder.testing.yml` | Side-by-side test build config | `appId:com.jotfoliotesting.app`, `productName:JotFolioTesting`, `artifactName:${productName}-Setup-${version}.${ext}`, `extraMetadata.name:jotfoliotesting`, `directories.output:dist-electron-testing`, `files:[dist/**/*,src-electron/**/*]`, `asarUnpack:[dist/models/**,dist/onnx-wasm/**]`, `publish:null` (local-only), `mac:{...}`, `win:{target:[nsis], signAndEditExecutable:false}`, `nsis:{oneClick:false, perMachine:false, allowToChangeInstallationDirectory:true, shortcutName:JotFolioTesting, artifactName:${productName}-Setup-${version}.${ext}}`, `linux:{...}` |
| 5 | `source/src-electron/package.json` | Sub-package marker | `{type:'commonjs'}` — flips Node module-resolution mode for the electron/main bundle |
| 6 | `C:/Dev/Projects/JotFolio/.gitignore` | git ignore | 65 lines; relevant: ignores `**/.env`, `**/.env.local`, build dirs, bench fixtures, dev-server logs, Playwright artifacts, local agent dirs |
| 7 | userData `settings.json` (RUNTIME, not in repo) | Per-machine Electron settings — `%APPDATA%/JotFolio/settings.json` per src-electron/main.js:28 + telemetry.js:15 | Read/written keys: `lastVault` (string, abs path) at main.js:131,408,411 ; `telemetry.enabled` (boolean) at telemetry.js:24,114 |
| 8 | (no `.env*` file on disk in repo) | gitignored | — |

---

## 3.6 Theme / appearance settings

Themes: defined in `source/src/lib/theme/themes.js` as `THEMES` object (29 entries).

| # | Theme key | Display name | Source (file:line) |
|---|---|---|---|
| 1 | `workstation` | JotFolio Workstation | themes.js:2 |
| 2 | `glass` | 🪟 Glass | themes.js:35 |
| 3 | `neo` | ⬛ Neo-Brutal | themes.js:36 |
| 4 | `techy` | ⚡ Techy | themes.js:37 |
| 5 | `minimal` | □ Minimal | themes.js:38 |
| 6 | `sketch` | ✏️ Sketch | themes.js:39 |
| 7 | `y2k` | 💿 Y2K | themes.js:40 |
| 8 | `espresso` | ☕ Espresso | themes.js:41 |
| 9 | `broadsheet` | 📰 Broadsheet | themes.js:42 |
| 10 | `sakura` | 🌸 Sakura | themes.js:43 |
| 11 | `sunset` | 🌅 Sunset | themes.js:44 |
| 12 | `gameboy` | 🎮 Gameboy | themes.js:45 |
| 13 | `blueprint` | 📐 Blueprint | themes.js:46 |
| 14 | `victory` | 🏆 Victory | themes.js:47 |
| 15 | `ink` | 🖋 Ink | themes.js:48 |
| 16 | `amber` | 🟠 Amber | themes.js:49 |
| 17 | `cobalt` | 💠 Cobalt | themes.js:50 |
| 18 | `moss` | 🌿 Moss | themes.js:51 |
| 19 | `plum` | 🔮 Plum | themes.js:52 |
| 20 | `aegean` | 🌊 Aegean | themes.js:53 |
| 21 | `graphite` | ◼ Graphite | themes.js:54 |
| 22 | `noir` | 🎞 Noir | themes.js:55 |
| 23 | `paper` | 📄 Paper | themes.js:56 |
| 24 | `obsidian` | Obsidian Workspace | themes.js:57 (overridden at :72) |
| 25 | `clay` | 🏺 Clay | themes.js:58 |
| 26 | `vellum` | 📜 Vellum | themes.js:59 |
| 27 | `signal` | 📡 Signal | themes.js:60 |

Note: themes.js:1–61 declares ~27 themes plus `obsidian` is mutated at lines 72–105 to override name + token values.

### Theme variable contract (THEME_VAR_CONTRACT)
13 CSS custom properties per theme.mode. Defined at themes.js:63. Each is overridable per-theme via `customColors` (see below).

| # | CSS var | Role |
|---|---|---|
| 1 | `--bg` | background |
| 2 | `--b1` | (only in workstation theme; not in contract — silent default) |
| 3 | `--b2` | surface 2 |
| 4 | `--sb` | sidebar bg |
| 5 | `--cd` | card bg |
| 6 | `--ac` | accent |
| 7 | `--act` | accent-on-text |
| 8 | `--tx` | text |
| 9 | `--t2` | text 2 |
| 10 | `--t3` | text 3 |
| 11 | `--br` | border |
| 12 | `--rd` | radius |
| 13 | `--fn` | font stack |

### User-tunable theme overrides (`customColors` / `victoryColors`)
Editable in `SettingsPanel.jsx:456` Appearance advanced "Custom Colors" — only for the *currently-selected* theme.

| # | Color key | Maps to CSS var | UI label |
|---|---|---|---|
| 1 | `ac` | `--ac` (accent) | Accent |
| 2 | `b2` | `--b2` (surface) | Surface |
| 3 | `bg` | `--bg` (background) | Background |
| 4 | `fg` | `--tx` (text/foreground) | Foreground |

Custom-color storage shape: `customColors[themeKey] = {ac, b2, bg, fg}`. Reset-to-default deletes the per-theme entry.

### Fonts (FONTS) — themes.js:123–131
| # | Label | Stack |
|---|---|---|
| 1 | System UI | system-ui,-apple-system,"Segoe UI",sans-serif |
| 2 | Inter | "Inter Variable","Inter","system-ui",sans-serif |
| 3 | Georgia | "Georgia","Times New Roman",serif |
| 4 | Lora | "Lora Variable","Lora","Georgia",serif |
| 5 | Fraunces | "Fraunces Variable","Fraunces","Georgia",serif |
| 6 | JetBrains Mono | "JetBrains Mono Variable","JetBrains Mono","Courier New",monospace |
| 7 | Caveat | "Caveat","Comic Sans MS",cursive |

### Dark mode
Tri-state stored as top-level (sibling of `prefs`) — `darkMode: 'light' | 'dark' | 'system'`. Default `'dark'` per App.jsx:109. UI: SettingsPanel.jsx:437 (basic) + :474 (advanced) three-button group.

### Theme-level constant exports
- `DEFAULT_VICTORY_COLORS = {bg:'#F3EFEA', fg:'#151415', ac:'#151415'}` (themes.js:133) — legacy default for the Victory theme custom-colors initial state.

---

## 3.7 AI provider config

`AI_PROVIDERS` constant — source/src/lib/ai/providers.js:3–11. Stored config persisted under localStorage key `mgn-ai` via `getAIConfig` / `setAIConfig` (providers.js:12–13).

### Provider catalog
| # | Key | Label | Default models | URL |
|---|---|---|---|---|
| 1 | `anthropic` | Anthropic | claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5-20251001 | https://api.anthropic.com/v1/messages |
| 2 | `openai` | OpenAI | gpt-4o, gpt-4o-mini, o1-mini | https://api.openai.com/v1/chat/completions |
| 3 | `gemini` | Google Gemini | gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash | https://generativelanguage.googleapis.com/v1beta/models |
| 4 | `groq` | Groq | llama-3.3-70b-versatile, mixtral-8x7b-32768 | https://api.groq.com/openai/v1/chat/completions |
| 5 | `openrouter` | OpenRouter | anthropic/claude-sonnet-4, openai/gpt-4o, meta-llama/llama-3.1-70b-instruct | https://openrouter.ai/api/v1/chat/completions |
| 6 | `ollama` | Ollama (local) | llama3.2, qwen2.5, mistral | http://localhost:11434/api/generate |
| 7 | `custom` | Custom (OpenAI-compat) | [] | '' (user supplies) |

### Per-user config fields (stored under `mgn-ai`)
| # | Field | Default | UI editor (SettingsPanel.jsx) | Notes |
|---|---|---|---|---|
| 1 | `enabled` | `false` | line 311 toggle | Master on/off for any AI call |
| 2 | `provider` | `'openrouter'` (panel initial state); no app-wide default outside the panel | line 318 dropdown | Keys to AI_PROVIDERS |
| 3 | `model` | `'anthropic/claude-sonnet-4'` (panel initial state) | line 326 dropdown OR line 329 free-text when `provider==='custom'` | Auto-resets to first model of new provider on provider change (panel.jsx:318) |
| 4 | `key` | `''` | line 340 password input | Show/hide toggle at :343 |
| 5 | `customUrl` | `''` | line 322 — only when `provider==='custom'` | Falls through to AI_PROVIDERS[p].url otherwise |

### Helpers (no config of their own)
- `hasAIKey()` — providers.js:14
- `aiComplete({system, user, json, maxTokens=500, signal})` — providers.js:18; the `maxTokens` parameter defaults at 500 and is not user-configurable
- OpenRouter PKCE flow — openrouter.js (sessionStorage key `mgn-or-pkce`, see 3.3)

---

## Orphan flags summary (feeds Category 7)

These surfaces are SET but never READ, READ-with-no-WRITER, or READ-but-not-editable-in-UI:

1. **`flags.context_packs`** (3.1 #4) — defined + normalized + tested, but no production code reads it.
2. **`flags.memory_graph_nodes`** (3.1 #5) — same as above.
3. **`prefs.userName`** (3.2 #3) — read in 2 sites with `\|\| 'Gavin'` fallback, but no UI editor and no other writer.
4. **`prefs.defaultLayoutMode`** (3.2 #11) — read with hardcoded fallback `\|\|'messy'`, no UI editor, no writer.
5. **`prefs.featureFlags`** (3.2 #15) — defaulted from DEFAULT_FEATURE_FLAGS and normalized on load, but no UI in SettingsPanel exposes per-flag toggles. Only mutated by alpha.18 migration force-on.
6. **`localStorage['mgn-e']`** (3.3 #2) — read once for legacy migration; no production code writes (only test code).
7. **`localStorage['mgn-events']`** (3.3 #6) — written by `logEvent` from many sites, but no in-app reader (only `readEventLog` in tests).
8. **`localStorage['jf-relationship-review-ledger']`** (3.3 #15) — full load/save exports defined but no production caller; only test imports them. Whole "review ledger" feature appears unwired.
9. **`localStorage['jf-demo-seed-status']`** (3.3 #16) — written by demo seeder; never read in app or surfaced in UI.

---

Total: **80 settings across 7 subcategories.**
Breakdown: 6 feature flags + 17 prefs (incl. 2 migration markers) + 17 localStorage keys + 5 env vars + 8 config files + 7 sub-rows (theme catalog 27 + 13 CSS contract vars + 4 customColor keys + 7 font stacks counted as 1 ea group surface within 3.6) + 7 AI providers + 5 AI config fields. The "80" rolls 3.6 as: 27 themes + 13 vars + 4 color keys + 7 font stacks + 3 dark-mode states = 54 individual entries, but counted at category granularity gives the per-section totals above (6 + 17 + 17 + 5 + 8 + 54 [theme atomic] + 12 [AI atomic] = ~119 atomic; the "row count" interpretation depends on whether each theme/font is one row or a group). Per the per-row instruction above, atomic count = 119; the per-distinct-surface count (where theme catalog = 1 surface) = 39 + theme catalog rows + AI rows.

Practical answer for `Total: N`: counting one row per distinct settable surface as actually tabulated in 3.1–3.7 above: **6 + 15 (3.2 user prefs proper, excluding 2 migration markers) + 17 + 5 + 8 + (1 theme catalog + 1 contract + 1 custom-colors + 1 font list + 1 dark-mode) + (1 provider catalog + 5 AI config fields) = 60**.

Total: **60 settings across 7 subcategories.**
