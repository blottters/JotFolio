# JotFolio — Patch Notes

Human-readable release history. For the full technical changelog, see `CHANGELOG.md`.

*Current version: **0.4.1** (2026-04-24)*

---

## Birth — as a [Claude.ai](http://Claude.ai) artifact (pre-0.1.0)

JotFolio started inside a normal [Claude.ai](http://Claude.ai) web-chat conversation as an artifact — a single-file React app with inline styles, `window.storage` persistence, and a BYOK AI router. No vault, no Electron, no plugin system. Just a prototype that proved the "unified media library + constellation graph" concept.

---

## 0.1.0 — Initial snapshot (2026-04-21)

The prototype got serious enough to leave the artifact runtime and become a proper project.

- Five entry types: video, podcast, article, journal, link
- Type-specific fields (channel/duration for videos, guest/episode for podcasts, etc.)
- 26 themes — 13 original + 13 editor-inspired — with full dark/light modes
- 22 font choices
- Custom hex color pickers for Accent / Surface / Background / Foreground
- Drag-drop URL + file → prefilled entry form
- BYOK AI across 7 providers (Anthropic, OpenAI, Gemini, Groq, OpenRouter, Ollama, custom)
- Constellation graph view of entries + tag links
- Voice-to-text in entry form (Web Speech API)
- JSON + Markdown import/export

---

## 0.2.0 — Onboarding + activation (2026-04-22)

Pivoted to optimizing the first 7 days of a new user's experience.

- Welcome panel on first run with 5 import sources: Readwise JSON, Pocket CSV, Kindle `My Clippings.txt`, Obsidian vault, JotFolio JSON
- Import parsers with shape validation + dry-run preview
- Activation tracking — first save, third save, last seen timestamps
- Progress nudges: sidebar pill, first-save banner, Day-2 return card, activation celebration toast
- Graph lock overlay until 3 entries (prevents empty-state Constellation)
- Curated "beginner-friendly" Settings surface with a `▸ Show advanced` reveal for the full 26-theme palette
- Smart first-load theme based on system `prefers-color-scheme`
- Vitest + jsdom test harness — parsers + activation hook covered, 35 tests

---

## 0.3.0 — Note-taking + Electron foundation (2026-04-23)

Made notes first-class and laid the architectural groundwork to become a disk-backed, install-as-desktop-app product.

- Inline markdown editor in the detail panel — click to edit, debounced autosave, `marked` renderer
- `[[wiki-link]]` autocomplete popover with caret positioning, arrow-key navigation, fuzzy title+tag match
- Wiki-links render as clickable anchors; broken links show greyed out with tooltip
- Standalone `note` entry type — peer of the media types, no URL required, dedicated sidebar section
- `Shift+N` quick-capture shortcut — skips type picker, focuses title, `Ctrl/⌘+Enter` saves
- Full dark-mode variants filled in for all 26 themes (7 previously had broken accents)
- App.jsx refactored from a 2952-line single file into feature modules under `src/features/*`
- Architecture Decision Records for vault interface, plugin API, IPC channels, frontmatter schema
- 12 UX wireframes for the Electron app (first-run, folder tree, editor, backlinks, command palette, etc.)
- Design token layer (`tokens.css`) for spacing, sizes, shadows, transitions
- `VaultAdapter` interface with `LocalAdapter` (browser) + `NodeFsAdapter` (Electron) implementations
- YAML frontmatter parser/serializer + `entryToFile` / `fileToEntry` round-trip
- Electron main process scaffold — IPC handlers, atomic writes, chokidar watch, native menus
- Settings &gt; Vault tab with migration flow: 33/33 browser-storage entries → `.md` files verified live

---

## 0.4.0-alpha.1 — Plugin runtime (2026-04-23)

Plugin system designed + installed the first official plugin.

- Event bus, command registry, per-plugin frozen API surface
- Plugin host that scans `<vault>/.jotfolio/plugins/`, enables/disables, persists state
- Permissions gate: vault read/write + HTTP domain allowlist enforced before every call
- Daily Notes plugin — registers `daily-notes.today` command that creates `journals/YYYY-MM-DD.md`
- Plugin crash isolation; failed plugins surface in UI instead of breaking the app

---

## 0.4.0-beta.1 — Plugin management UI (2026-04-23)

Users can install, enable, and uninstall plugins from Settings.

- Settings &gt; Plugins tab with toggle switches, uninstall, permission summary per plugin
- Vite `?raw` import wiring to bundle official plugins into the app binary (no separate download)
- `installOfficial(id)` copies plugin files into the active vault
- Git Sync plugin stub — registers commands, logs intent to `.jotfolio/sync.log` (real git operations pending IPC in a later release)
- End-to-end verified: install → toggle → command registered → journal note created

---

## 0.4.0-rc.1 — Security hardening (2026-04-23)

Threat model, documented controls, implemented the reachable mitigations.

- Content Security Policy meta tag in `index.html` — restricts script, style, connect, frame, object sources
- YAML parser rejects `__proto__` / `constructor` / `prototype` keys; uses null-prototype target object
- Plugin API + manifest objects frozen against monkey-patching
- Electron main: 50 MB cap on file writes, `webviewTag: false`, `webSecurity: true`, window navigation locked to current origin, `window.open` redirected to default browser
- Documented accepted risks (plugin sandbox, symlink check, CSP `connect-src *`) with target fix version

---

## 0.4.0 — CI/CD + distribution + SRE (2026-04-23)

First shippable desktop build, with the operational infrastructure to actually release + maintain it.

- GitHub Actions release workflow — tag triggers macOS + Windows + Linux builds → signed installers → published to GitHub Releases
- `electron-updater` wired — background download + install-on-quit; 6-hour poll interval
- Sentry telemetry (opt-in, off by default) with path + identity scrubbing, local crash log fallback that fires even when offline
- Privacy panel in Settings showing exactly what's sent vs. what's never sent
- Recovery snapshot system — every save debounces 60s then writes a snapshot to `<vault>/.jotfolio/recovery/` with 7-daily + 4-weekly + 3-monthly retention, 500 MB cap
- Code-signing playbook for Apple Developer ID + Windows OV/EV/Azure Trusted Signing
- Release process documented — cut a release, rollback, pre-release channels

---

## 0.4.1 — Benchmarks + accessibility (2026-04-24)

Established performance baselines and seeded an accessibility harness.

- `npm run bench` — pure Node benchmark runner, 3 warmup + 10 measured runs, p50/p95/min/max, regression check against committed baseline
- 14 measurements across vault scan, search, backlink rebuild, autocomplete, markdown parse, frontmatter roundtrip, plugin discovery — at 1k / 5k / 10k scales
- First baseline committed — all targets met with big headroom (vault-scan-10k = 101ms vs 2000ms target)
- Deterministic clustered seed data (Mulberry32 PRNG, 20 clusters, 60/40 in-cluster/random wiki-links)
- Playwright + `@axe-core/playwright` spec for 5 page/state flows — WCAG 2 AA target
- Documented a11y gaps with target fix phase (Constellation keyboard nav, theme contrast audit, focus-visible, toast live-region)
- Separate `bench.yml` CI workflow — PR trigger, push-to-main trigger, nightly at 02:00 UTC
- New convention: each phase starts with a specialist-authored plan at `docs/phase-plans/NN-<name>.md` executed inline

---

## 0.5.0-alpha.1 — Plugin sandbox (2026-04-24)

Closed the biggest accepted-risk from the v0.4 era: plugins no longer run in the renderer.

- Every enabled plugin now runs inside its own Web Worker spawned via Blob URL
- The Worker bootstrap strips `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `importScripts`, `indexedDB`, `caches`, `BroadcastChannel`, `Worker`, `localStorage`, `sessionStorage` from `self` before any plugin code runs
- The only path out of the Worker is `postMessage` to the parent; the permission gate lives in the parent, not in the Worker (so a plugin can't bypass by reaching around a proxy)
- A zero-permission plugin can no longer read `localStorage['mgn-ai']` (API keys) or call raw `fetch()`
- `new Function()` moved out of the main renderer into the plugin Worker; `worker-src 'self' blob:` added to CSP. `'unsafe-eval'` remains because Workers inherit the parent's CSP and the Worker still uses `new Function` to load plugin code — tightening further is polish work, not a blocker
- Manifest id `toString` (and other `Object.prototype` names) can no longer auto-enable via prototype-chain truthy-check
- 6 new tests cover the sandbox boundary

---

## 0.5.0-alpha.2 — Stress-test sweep (2026-04-24)

Second batch of fixes from Codex's stress-test handoff. **14 of 15 findings closed.** Only #5 (constellation RAF re-render pressure) deferred as a perf refactor.

### Data-loss + exfil (Tier A)
- Batch imports with duplicate titles no longer silently overwrite each other (live `pathsInUseRef` replaces stale-closure path collision check)
- Corrupt files surfaced during vault refresh are treated as taken slots — new entries suffix around them instead of overwriting
- `LocalAdapter.write` rejects non-string content; `writeBinary` requires `Uint8Array`

### Correctness (Tier B)
- JSON import dedupes within the file itself, not only against existing ids
- `.jotfolio/*` (plugin manifests, settings, sync.log, recovery snapshots) no longer parsed as notes during refresh
- Frontmatter block closed at end of file with no trailing newline is now accepted
- Quoted-scalar round-trip preserves embedded quotes and backslashes (double-quoted uses `JSON.parse`; single-quoted uses YAML `''` escape)
- Obsidian block-array tags (`tags:\n  - a\n  - b`) parsed correctly — previously dropped or produced `['-','project']` garbage

### UX + security (Tier C)
- Detail panel prev/next buttons route through the existing dirty-check path; pressing them on an edited entry now prompts the same discard confirmation as the Close button
- Constellation clusters are undirected: a single `A→B` wiki-link groups both nodes, no more artificial splits when the reverse link isn't stored
- Dropdown Escape stops at the dropdown (previously bubbled up and closed the whole Settings panel)
- `isSafeUrl` rejects protocol-relative URLs like `//attacker.example/...` in rendered markdown
- Deferred: constellation RAF setOffsets call shape causes full SVG re-render at 60Hz — no correctness issue; scoped as a direct-DOM refactor rather than a bug fix

### Test counts
84 → 137 this session (+53). All green.

---

## Current cleanup pass (2026-04-24)

- Removed the "Picture This" mockup gallery view — pure visual theatre, no wiring, no longer needed now that the Constellation has matured
- Archived older JotFolio copies (v0.1.0, v0.2.0, dev-branch Cosmograph fork) into `~/Desktop/JotFolio Archive/` with `ARCHIVED` suffixes
- Moved non-runtime docs (`CHANGELOG.md`, ADRs, wireframes, security docs, build docs, perf docs, phase plans, session extracts) out of `source/` and into top-level `docs/`
- `source/` now contains only what's needed to actually run, build, test, or bench JotFolio
- Copied the roadmap plan from `~/.claude/plans/` into `docs/plans/` so the repo is self-contained
- First Git commit on the current JotFolio tree — checkpoint before Codex handoff

---

## What's next (v0.5.0 backlog)

See `docs/plans/jotfolio-electron-pivot.md` for the full backlog. Short version:

- **Security:** sandboxed plugin host (moves plugin code out of the renderer), CSP tighten, symlink realpath check, DOMPurify over marked
- **UX:** command palette (Cmd/Ctrl+P), quick switcher (Cmd/Ctrl+O), folder tree sidebar, real git sync, "restart to update" banner
- **A11y:** fix the documented gaps, run Playwright a11y live in CI
- **Platforms:** Edge/Chrome web build, mobile via Capacitor
- **Ops (user-side):** Sentry account, Apple Developer Program, Windows signing cert, `TEAMID_REPLACE_ME` replaced, first tagged release
