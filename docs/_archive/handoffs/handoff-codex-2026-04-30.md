# JotFolio handoff for Codex — 2026-04-30

> **Read this whole document before touching code.** It is self-contained. You do not have access to my memory files, my session history, or the user's private notes. Everything you need is here.

---

## 1. Who you're working for

**User: Gavin (GitHub: `blottters`)**

- Smart adult, never coded before. Understands what needs to happen at a high level + can run commands. Does NOT know most software jargon unprompted.
- Primary machine: desktop PC running Windows 11 (NOT a laptop — never tell him to "close the laptop").
- Primary browser: Microsoft Edge (NOT Chrome).
- Voice register: smart-homie-helping-you-ship — short fragments, lowercase casual OK, slang OK in moderation, profanity for emphasis on tech, ~20-30% message frequency. Code/commits/PRs stay clean professional.
- Bans: NEVER say "Great question," "Absolutely," "That's a great idea." NEVER pad with summaries of what he just said. NEVER add hedging.
- He prefers terse default — short answer first, then "want me to elaborate?" — don't dump menus on simple bug fixes.
- Approval verbs: "go" / "execute" / "do it" / "whatever you recommend" → proceed. Don't ask him to re-confirm what he already said clearly.
- He has explicitly OPTED IN to caveman-ultra register. If you can speak in compressed caveman style (drop articles, fragments OK, arrows for causality, abbreviations like DB/auth/config/req/res/fn/impl/dep/repo/env), do so. Code/commits/PRs stay normal English.
- Self-deprecation ("I'm an idiot," "I fucked up") = he caught his own mistake. Move forward. Don't restate, don't reassure.
- "Stand by" / "let me think" → genuinely wait. Don't fill the silence.
- Better safe than sorry on destructive actions — if uncertain, ASK before deleting / force-pushing / overwriting.

## 2. What JotFolio is

A local-first Markdown knowledge workspace, modeled on Obsidian's clean-room educational concept ("SlateVault" internally). Built as an Electron desktop app with a Vite + React renderer. Markdown notes live in a user-chosen vault folder; the app reads/writes them as files with YAML frontmatter.

**The product target:** local-first ✓ · plain-text durable ✓ · graph view ✓ · canvas spatial workspace ✓ · Bases-style filtered views ✓ · command palette ✓ · plugin extension seam ✓ · search ✓ · export/import ✓ · keyword library auto-tagging (NEW, just shipped) ✓.

**Pre-launch.** Alpha.8 just shipped. No public users yet. Repo is public on GitHub but hasn't been promoted.

## 3. Repo + paths (canonical)

| What | Path |
|---|---|
| **Source code** | `C:\Dev\Projects\JotFolio` |
| Renderer source | `source/src/` |
| Electron main process | `source/src-electron/` |
| Mockups (HTML, design exploration) | `docs/mockups/` |
| Plans (markdown, plan-of-record per feature) | `docs/superpowers/plans/` |
| Audits | `docs/superpowers/` |
| Vault (live app data — Gavin's actual notes) | `C:\Users\gavin\OneDrive\Documents\JotFolio Vault\` |
| Installed binary settings | `%APPDATA%\jotfolio\settings.json` (case may vary on Windows NTFS — case-insensitive, single physical dir) |
| Installed binary exe | `C:\Users\gavin\AppData\Local\Programs\jotfolio\JotFolio.exe` |
| GitHub repo | https://github.com/blottters/JotFolio |
| Symlink for convenience | `C:\Dev\Coding Agents\jotfolio` → `C:\Dev\Projects\JotFolio` |

**Trap:** `C:\Users\gavin\OneDrive\Desktop\JotFolio (installed).lnk` is the installed-app shortcut, NOT source. Don't read or write through it. The `.lnk` was renamed to make this obvious.

## 4. Stack

- **Vite 7** + **React 19** + **JSX** (NOT TypeScript)
- **Electron 32** desktop shell (auto-update via `electron-updater` against GitHub Releases)
- **Inline styles + CSS variables** (`var(--ac)`, `var(--tx)`, `var(--bg)`, etc) — NO Tailwind, NO CSS Modules, NO styled-components
- **Self-hosted fonts via Fontsource** — Inter, Lora, Fraunces, JetBrains Mono, Caveat (5 families bundled, no Google Fonts CDN at runtime)
- Test framework: **Vitest**
- YAML parser: **`js-yaml`** (already a dep)
- Built artifact: NSIS Windows installer + auto-updating Electron binary

## 5. SlateVault charter (MUST follow)

JotFolio's internals are governed by a written design charter. Every architectural decision must conform to these rules:

### Workflow rule
Plan → Build → Test → Verify → Ship. No skipping plan. No fabricating implementation details. Unknown details = label them unknown + pick conservative.

### Plan format (before any code)
A. Observed · B. Inferred · C. Unverified · D. Architecture · E. Build Plan (small + reversible + testable) · F. Acceptance Criteria

### End-of-task format
Observed · Inferred · Unverified · Changed · Verified · Remaining risks/blockers · Next step

### 8 non-negotiable design principles
1. **Local-first** — notes are files, not proprietary DB rows
2. **Plain-text durability** — Markdown readable outside the app
3. **Transparent metadata** — YAML frontmatter only, no hidden side-channel
4. **Derived indexes** — backlinks/graph/tags/headings/search rebuild from files
5. **No lock-in** — export = copy the vault folder
6. **No misleading claims** — never imply this IS Obsidian or uses Obsidian internals
7. **Testability** — parsing/indexing/link extraction/backlink/frontmatter/graph = **pure functions**, not buried in React components
8. **Small safe implementation first, polish second**

### Security floor (do not violate)
- No external server calls with note content
- No analytics · No tracking scripts
- No arbitrary plugin code from user input — plugin system is internal/demo only
- Sanitize rendered Markdown HTML; avoid `dangerouslySetInnerHTML` unless sanitized
- No secrets in local storage
- No "end-to-end encryption" claims unless implemented + tested

### Telemetry exception (amended 2026-04-28)
Optional opt-in crash telemetry IS permitted — but only if every condition holds:
1. **Explicitly opt-in** — no default-on collection. User must enable in Settings.
2. **Scrubbed of PII** — strip email, IP, cookies, request headers; sanitize source paths to repo-relative.
3. **DSN-gated** — absent DSN env var = zero network calls. No fallback ping.
4. **Lazy-loaded** — telemetry module stays out of the main bundle for opted-out users.
5. **Documented in README** with disable instructions.

Note content, vault paths, file titles, and frontmatter must NEVER appear in telemetry payloads. Telemetry is for crash signal only — exception names + sanitized stack frames + version + platform.

Implementation reference: `source/src/lib/telemetry.js` + `source/src-electron/telemetry.js` (as of alpha.7) meet all five conditions.

### 10-Phase build order (all shipped in JotFolio)
1. Vault + note core
2. Markdown parsing + metadata cache
3. Backlinks + outgoing links
4. Graph view ("Constellation")
5. Properties + Bases-style views
6. Canvas
7. Command palette
8. Plugin-like extension seam (Word Count is the example plugin)
9. Search
10. Export/import (vault bundle round-trip)

### Failure handling rule
If you can't finish in one pass:
- Don't pretend success
- Ship the most complete working subset
- State what's missing + exact next steps
- Preserve implemented artifacts
- Prioritize core correctness over polish

## 6. Slop-prevention rules (write-time discipline)

These are 11 patterns that have shipped slop in past sessions. Every one is a syntax-level trigger you should check before writing the line.

1. **Charter-check before any external resource.** When you're about to write `<link href="https://`, `<script src="https://`, `import "https://"`, `fetch('https://...')`, `@import url("https://...")` — pause and re-read the charter line "no external content shipping." This applies to every file in the repo, INCLUDING mockups, demos, fixtures, READMEs. The browser fetches whatever's in `<head>` regardless of "this is just a mockup." Especially when copy-pasting a `<head>` block from another file.

2. **Don't ship a TODO admission as the implementation.** If you write a comment like "true X would require Y" and then ship the not-Y version, you've shipped a known-bad. Either finish it or yank the feature. No "ship the half + admit it in a comment."

3. **Use existing tokens before reaching for defaults.** Before writing any inline magic value (easing curve, color hex, spacing px, radius px, shadow), grep the project for an existing token. Default values that match Material/Tailwind are AI-tell signatures. JotFolio defines tokens in `source/src/design/tokens.css` and `source/src/lib/theme/tokens.css`.

4. **Same inline-style cluster ≥3 times = primitive.** When you notice the third copy-paste of the same inline-style cluster, extract to a primitive component immediately.

5. **Generic copy is AI-tell.** Any copy that could belong to any product is AI residue. Banned: "Transform your workflow," "Unlock potential," "Seamless integration," "Cutting-edge AI platform," generic CTAs ("Learn More" / "Get Started" without action context). Write in JotFolio's specific domain voice.

6. **HTML head metadata is a shipping prerequisite.** Public-shipping HTML needs the full head profile: title, description, og:title, og:description, og:image, theme-color, favicon, apple-touch-icon. Missing these = default-framework profile.

7. **No `*` wildcards in security policies.** CSP, CORS, fetch allowlists — explicit allowlist over wildcard, even when convenient.

8. **One source of truth for version.** Only one place owns the version string. README, app About modal, footer credit, splash screen — all should sync from package.json.

9. **≥10 useState calls in one component = state machine.** When a component crosses ~10 useState calls, it's a state machine. Switch to useReducer + discriminated state, or extract a custom hook, or split into context.

10. **`.toLocaleString()` always takes a locale arg.** Always pass `'en-US'` (or whatever locale) explicitly. Even single-locale apps benefit (deterministic output, easier i18n later).

11. **Self-imposed code rules are real.** JotFolio has a project-rule: no file > 800 lines. Currently `App.jsx` is 824 (over the cap by 24). Don't push it further than necessary; refactor when you cross.

## 7. Project conventions

- **Named exports over default exports.** `export function ComponentName(...)`. Not `export default function`.
- **Named functions over anonymous arrow functions** in component definitions.
- **NEVER use IIFEs in artifact code.** Any IIFE pattern (`x || (() => {})()`, ternary IIFE, etc.) breaks the claude.ai JSX transpiler. Use if/else assignment or named functions.
- **`useId()` for every form element** — never duplicate IDs across conditional renders.
- **`window.confirm()` is BANNED.** Use inline UI (warning + "proceed anyway" button) — see how `KeywordRulesPanel.jsx` Re-scan button uses inline two-step confirm pattern.
- **Inline styles with CSS variables** (`var(--ac)`, `var(--tx)`, etc) for all dynamic styling.
- **Code must be COMPLETE.** No `// ... rest of your code here` truncation. No `// TODO` without implementing. If a file is too long, split into logical chunks — don't skip content.

## 8. Build / test / run commands

```bash
# All commands run from source/ (NOT repo root):
cd C:\Dev\Projects\JotFolio\source

npm install        # install deps
npm run dev        # Vite dev server at http://localhost:5174
npm test           # Vitest test runner — current count: 424/424 should be green
npm run build      # production build (outputs to source/dist/)
npm run electron:dev    # Electron dev mode w/ Vite
npm run electron:build  # Electron production build (creates installer)
```

## 9. Git workflow

- **Default branch on GitHub:** `main` (was `master`, flipped during a private/public toggle artifact)
- **Active development branch:** `master` (where all real history lives)
- Branching strategy: feature branches (`feat/<name>`) → PR into `master`
- Commit format: Conventional Commits (`feat(scope): description`, `fix(scope): description`, `docs:`, `chore(release):`, etc)
- Commit messages always include `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` when written by Claude
- **Currently on:** `master`, fully merged + pushed
- **Last release:** `v0.5.0-alpha.11` (current aligned prerelease line)

## 10. Auto-update pipeline

- `electron-updater` polls GitHub for `latest.yml`, restart-now banner fires when new release detected
- Polling: 3s after launch, then every 15min
- Repo MUST stay public for unauthenticated `latest.yml` requests to succeed
- CI workflow: `.github/workflows/release.yml` triggers on `git push --tags v*`
- 6 known traps documented in memory `pattern_electron_update_pipeline.md`

## 11. What just shipped (alpha.10 release line)

### Keyword Library Phase 1 — the headline feature

User-curated YAML rules at `_jotfolio/keyword-rules.yaml` inside their vault map trigger words to tags + wikilinks. On entry save, JotFolio scans title + notes + URL for triggers, auto-applies matching tags. Per-entry opt-outs persist in `_jotfolio/keyword-opt-outs.yaml`. Settings panel for managing rules. "Apply rules to existing entries" re-scan button with two-step inline confirm.

**Files added:**
- `source/src/lib/keywordRules/parseRules.js` (+ test) — YAML → typed rules, pure
- `source/src/lib/keywordRules/applyRules.js` (+ test) — (entry, rules, optOuts) → matches, pure. Uses Unicode-aware word boundaries (handles CJK, accented Latin, Cyrillic correctly).
- `source/src/lib/keywordRules/rulesStorage.js` (+ test) — vault read/write, async
- `source/src/lib/keywordRules/optOutTracker.js` (+ test) — per-entry opt-out memory, mostly pure
- `source/src/lib/keywordRules/useKeywordRules.js` (+ test) — React hook orchestrating all of the above
- `source/src/features/settings/KeywordRulesPanel.jsx` — Settings UI

**Files modified:**
- `source/src/App.jsx` (824 lines, was 989 mid-flight) — uses `useKeywordRules` hook
- `source/src/features/settings/SettingsPanel.jsx` — Keyword Rules tab routing

**Test count:** 424/424 green. **Build:** clean. **Slop-judge audit:** 0/35 hits.

### Path cleanup
Multi-root path sprawl resolved: project-level `CLAUDE.md` added at repo root documenting canonical paths, symlink at `C:\Dev\Coding Agents\jotfolio`, launch.json cleaned up, `.lnk` shortcut renamed for clarity, AppData case-aliasing investigated (single physical dir confirmed via inode marker test — naive deletion would have nuked user state).

### Project-level CLAUDE.md
At `C:\Dev\Projects\JotFolio\CLAUDE.md` — documents canonical paths, build commands, charter pointers. Future Claude Code sessions auto-load this when working in the repo.

## 12. Roadmap (ranked + scoped)

### v0.6 (next)
- **Keyword Library Phase 1.8 polish** — `--warn` theme token + sweep amber hex hardcoded in KeywordRulesPanel Re-scan button
- **Constellation discovery mode** (small) — add a 4th layout mode that's pure force-directed (edge-weighted, no tag/date weighting), set as default for power users. Existing `computeAffinityLayout` in `source/src/features/constellation/ConstellationView.jsx:97` already does force-directed math, just needs new weighting + button + default flip.

### v0.7
- **MiniLM Phase 2** — on-device embedding model bundled with app (~50MB ONNX). Powers:
  - Universal semantic search (replaces keyword search)
  - Smart wikilink suggestions while typing
  - Similar-notes panel on every open note
  - Smart tag suggestions (pairs with keyword library — fills gaps the rules don't reach)
  - Auto-clustering view ("themes you didn't see")
  - Untagged-note batch classifier
  - Onboarding clustering pass (bootstrap new users)
  - Near-duplicate detection
  - Semantic-edges layer on Constellation
  - Wikilink ambiguity resolver
  - + 6 more secondary unlocks
- **Workshop / Library dual-mode shell** — toggle between current categorical sidebar + the file-tree always-on-right-panel layout from `docs/mockups/frontpage.html`
- **CodeMirror live-preview Markdown editor** — replace plain textarea with WYSIWYG-ish editor

### v0.8+
- **Founder-trained Personalized Classifier** — train a small classification model on Gavin's actual tagged notes via Hugging Face AutoTrain → bundle the trained ONNX file with JotFolio v0.7 → users get pre-tuned tagging out of the box. Defensible product moat. Idea note saved at `vault/notes/personalized-classifier-autotrain.md`.
- **Plugin API exposing embedding service** — let community plugins call `embed(text)` + `similar(noteId)` for new feature categories
- **External plugin loader** at `%APPDATA%\jotfolio\plugins\` (manual drop-in plugins, sandboxed)
- **App icon / brand mark** — currently default Electron atom, table-stakes for shipping
- **Code-signing cert** — removes Windows SmartScreen warning ($200/yr)
- **Capacitor mobile build** — iOS + Android via web build wrap
- **Karpathy Wiki layer revival** — feature flag currently off; raw → wiki compile pattern compounds with MiniLM features

### Constellation graph (special area)
- Currently uses bespoke polar/cluster/affinity layout w/ type-colored nodes (red ribbon path).
- Power-user "green ribbon" path scoped: drop type colors, plain-click = open note (Obsidian-style), keep "Constellation" name. NOT BUILT yet — design call still open whether to ship the dual-mode or improve the current one.
- 4-level cosmography vision (Deep Field → Galaxy → System → Observatory) is locked in memory but unbuilt.
- Authored "Expeditions" (named flight paths through the library, sharable as artifacts) — concept, mockup pending Gavin.

## 13. Charter conflicts to know about

- **MiniLM bundles a 50MB model file.** Charter says "no external content shipping." Resolution: model file is application code (bundled at install), not user data. Charter line was about RUNTIME content fetching, not install-time deps. Same exemption as bundling React/Electron/etc.
- **HF AutoTrain training step** sends Gavin's tagged notes to HF cloud once (the ONE training run). Resolution: this is a one-time DEV workflow that Gavin opts into, not part of the running product. Same charter exemption as user uploading a doc to ChatGPT.
- **Telemetry** is the documented amendment — opt-in scrubbed crash reporting permitted under 5 conditions (see §5).

## 14. Where the design memory lives

If you need design rationale or product vision context, you can read these files (Gavin's local memory, but they're plain markdown — open and read):

`C:\Users\gavin\.claude\projects\C--Dev-Coding-Agents\memory\`

Notable files:
- `slatevault_vibe_prompt.md` — full charter
- `feedback_ai_slop_prevention_practices.md` — the 11 write-time slop rules
- `vibecoded_audit_framework.md` — 7-layer post-write audit framework
- `feedback_concrete_rules_only.md` — meta-rule: every directive needs a syntax-level trigger
- `feedback_filesystem_mutation_verification.md` — verify-before-mutate for filesystem ops
- `jotfolio_keyword_library_planned.md` — feature concept doc
- `jotfolio_cosmography_vision.md` — Constellation 4-level rebuild target
- `pattern_electron_update_pipeline.md` — full electron release recipe + 6 known traps
- `MEMORY.md` — index of all memory files

## 15. Plans (plan-of-record per feature)

`C:\Dev\Projects\JotFolio\docs\superpowers\plans\`:
- `2026-04-28-slop-fixes.md` — completed (alpha.10 line prep)
- `2026-04-28-url-autofill.md` — DEPRECATED (rejected in favor of keyword library)
- `2026-04-29-path-cleanup.md` — completed
- `2026-04-30-keyword-library-phase1.md` — completed (alpha.10 line)

When you write a new plan, follow the same template structure (gating decisions §0, file map, dependency map, tasks with checkboxes, slop-traps per task, acceptance criteria, smallest valuable subset).

## 16. Mockups (design exploration)

`C:\Dev\Projects\JotFolio\docs\mockups\`:
- `frontpage.html` — future-layout Workshop mode mockup (file-tree + always-on right column)
- `keyword-library.html` — two-layer feature concept (rules + MiniLM)

Run via Python http.server on port 5175 (config in `C:\Dev\Coding Agents\.claude\launch.json` → `jotfolio-mockup`).

## 17. Audits

`C:\Dev\Projects\JotFolio\docs\superpowers\`:
- `cli-skills-audit-2026-04-30.md` — CC CLI skills/plugins/MCP inventory
- `desktop-skills-audit-2026-04-30.md` — Claude.ai desktop app inventory
- `skills-alignment-2026-04-30.md` — diff + recommendations
- `path-audit-2026-04-29.md` — path sprawl audit

## 18. PRs / open issues / known gaps

**No open PRs** — `feat/keyword-library` was merged into `master`, with the repo now aligned to the alpha.11 line.

**Known soft-fails (deferred, not blocking):**
- Hardcoded amber hex `#f59e0b` in `KeywordRulesPanel.jsx` Re-scan button (need `--warn` theme token + sweep)
- App.jsx 824 lines (over 800 cap by 24 — Hook Hannah brought it down from 989 but still over; further extraction possible)
- Re-scan button: missing fake-progress-bar UX during long re-scans on big vaults (acceptable for vaults <1000 entries)

**Known infrastructure gaps:**
- No public release announcement / Show HN / marketing
- No app icon (default Electron atom)
- No code-signing cert (Windows SmartScreen warning on install)
- No vault encryption recommendation in README
- No backup recommendation for users (vault corruption mid-write recovery story)
- No mobile build (Capacitor wrap planned but not started)
- No Sentry DSN configured (telemetry code shipped, just no DSN env var yet)
- `main` vs `master` divergence on GitHub (default branch flip artifact, needs cleanup)

## 19. Things that have been REJECTED (don't re-propose)

- **URL auto-fill on entry add** — was scoped, rejected. Keyword library wins for tagging; URL auto-fill returns less value for more complexity.
- **Score Constellation** — visualization concept (notes as music notation on staves). Cut from JotFolio specifically — saved for a future companion app (music tracker / habit tracker).
- **3D rotational gyroscope Orrery view** — walked back from cosmography vision because 3D rotation kills mental-map preservation.

## 20. Start of every session

Before touching anything:
1. `cd C:\Dev\Projects\JotFolio`
2. `git status` — confirm clean working tree
3. `git pull` — sync any changes
4. Read `CLAUDE.md` (project root) for canonical paths
5. Verify dev server boots: `cd source && npm run dev` → http://localhost:5174 should render
6. Verify tests pass: `cd source && npm test` → expect 424+ green

## 21. End of every meaningful change

Before claiming done:
1. Run `npm test` — green or fail-list
2. Run `npm run build` — clean or error-paste
3. `git status` — confirm only the files you intended got modified
4. If shipping: bump `package.json` version, commit, tag w/ `v<version>`, `git push origin <branch> && git push --tags`

## 22. Questions Codex might have

**Q: Do I need to install anything?**
A: `cd C:\Dev\Projects\JotFolio\source && npm install` — that's it. All other deps are already in `package.json`.

**Q: How do I run the app?**
A: For renderer-only (faster iteration): `npm run dev` → http://localhost:5174. For Electron desktop wrap: `npm run electron:dev`.

**Q: How do I run tests?**
A: `npm test` from `source/` dir.

**Q: Where do I write a new feature?**
A: `source/src/features/<feature-name>/` for UI surfaces. `source/src/lib/<feature-name>/` for pure-function logic. Mirror the keyword library structure (`src/lib/keywordRules/` + `src/features/settings/KeywordRulesPanel.jsx`).

**Q: How do I add a Settings tab?**
A: See how `KeywordRulesPanel` was added in `source/src/features/settings/SettingsPanel.jsx` (tab list + render switch). Follow that pattern.

**Q: Can I add a npm dep?**
A: Default no. Check if existing deps cover the need first. If you must add: get Gavin's approval first. He prefers minimal dep surface.

**Q: Can I use TypeScript?**
A: No. JotFolio is JSX. Don't introduce TS without an explicit migration plan.

**Q: Can I use Tailwind / styled-components / CSS Modules?**
A: No. Inline styles + CSS variables only. JotFolio's design language is built around `var(--ac)`/`var(--tx)`/`var(--bg)` tokens.

**Q: How do I get the user's vault path?**
A: `useVault()` hook returns `{ vaultInfo, vaultAdapter }`. The `vaultAdapter` exposes `read/write/mkdir/list` methods. Don't bypass it — go through the adapter pattern.

**Q: What if a test is flaky?**
A: Don't ship flaky. If a test is genuinely flaky, mark it `it.skip()` w/ a comment explaining why + open a follow-up issue. But first try: clearer assertions, no shared mutable state, no time-based assertions w/o fake timers.

**Q: What if I disagree with the charter?**
A: Tell Gavin. Don't silently violate. The charter is the contract.

**Q: When in doubt?**
A: Ask. Better safe than sorry on destructive actions. Pause + ping is cheaper than guess + corrupt.

---

## End of handoff

If you're picking this up cold: read sections 1-7 first (user, project, paths, stack, charter, slop rules, conventions). Then sections 11-13 (what just shipped, roadmap, charter conflicts). Sections 14-22 are reference.

Last shipped commit reference in this handoff is superseded by the current aligned tag/version line `v0.5.0-alpha.11`.

Tests: 424/424 green. Build: clean. Branch: `master`. Working tree: clean.
