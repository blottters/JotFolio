# JotFolio Slop-Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 10 highest-ROI hits from the v2 / 336-item slop-judge audit on JotFolio without introducing new slop in the process.

**Architecture:** Each fix is a self-contained, atomic change. Decisions Gavin needs to make are front-loaded as **GATING DECISIONS** in §0 — code work cannot start until those are answered. Fixes are then sequenced by dependency + risk, with a clear "what slop-trap to avoid" called out for each. Each commit is single-purpose to keep blame trails honest.

**Tech Stack:** Electron 33 + Vite 7 + React 18 (JSX) + inline styles with CSS variables. Source at `C:\Dev\Projects\JotFolio\source\`. Charter at `slatevault_vibe_prompt.md` memory.

**Reference docs:**
- Audit findings: prior session — Vibe Narc v2 / 336-item rubric returned 11 hits (10 fixed here, 1 deferred = App.jsx 800-line cap)
- Slop-prevention rules: `feedback_ai_slop_prevention_practices.md`
- Charter: `slatevault_vibe_prompt.md` + source file at `C:\Users\gavin\OneDrive\Desktop\Prompts - Markdowns- Claude Docs\Prompts\# OpenClaw Complete Reference Guide.txt`

---

## §0. Gating decisions (Gavin must answer BEFORE any code is touched)

| # | Decision | Why it gates | Default if no answer |
|---|---|---|---|
| **D1** | **Telemetry charter call.** Amend the SlateVault charter to allow opt-in scrubbed crash reporting (current implementation is opt-in, lazy-loaded, scrubs email/IP/cookies/headers/source paths)? Or rip `lib/telemetry.js` + `src-electron/telemetry.js` entirely and update README/charter docs to match? | Blocks fix #6 + affects fix #2 (CSP allowlist for Sentry DSN) | Hold the work. Don't guess. |
| **D2** | **Font shortlist.** The user-facing FontDropdown currently exposes **22 families**. Pick the curated set we self-host. Recommendation: keep the **6 strongest** (1 sans, 2 serif, 1 mono, 2 display) + always offer System UI + Georgia. Drop the other 16 from the dropdown entirely (they were AI-default cluster anyway). My picks if Gavin defers: **Inter (sans), Lora (body serif), Fraunces (display serif), JetBrains Mono (mono), Caveat (handwriting accent)**, with System UI + Georgia + monospace as system-fallback fonts (no download). | Blocks fix #3. The "cut to 3-4" framing in audit is too aggressive; user dropdown is a real feature. | If no answer: ship my 5-font shortlist. |
| **D3** | **Tagline / description.** Need a real one-line product description for OG meta + README + about modal. Banned: "Transform your workflow," "Unlock potential," "Seamless integration," "Powerful note-taking app." Charter-aligned candidates: "Markdown notes that survive your tools." / "Plain files, your folders, no servers." / "A local-first knowledge workspace for plain-text people." | Blocks fix #4 + #1 (README sync) | If no answer: use "Plain files, your folders, no servers." (charter-aligned, specific, ungeneric) |
| **D4** | **Theme color for `<meta name="theme-color">`.** Light/dark? Pick one. The app defaults to user-customizable themes — pick the brand-anchor color. | Blocks fix #4 | Use `#151415` (matches `DEFAULT_VICTORY_COLORS.fg` in `themes.js`) |
| **D5** | **Empty-state copy.** Replace `"Nothing here yet"`. Banned: anything that could appear in any product. Candidates: `"No entries in this view. Press N to add one."` / `"Library's empty. Drop a URL or press N."` / `"This view is empty. Try clearing filters or press N to add."` | Blocks fix #5 | Use the third (most actionable, mentions filter context) |

**Gavin: answer D1-D5 before I run any task below.** I'll not pick defaults silently — too many slop-traps if I auto-default on copy / fonts / charter. If Gavin says "use defaults" then I lock the defaults above and proceed.

---

## File map (what gets created/modified)

**Modified:**
- `README.md` — version sync (fix #1) + tagline (fix #3 D3 input)
- `source/index.html` — CSP tighten (fix #2), fonts self-host (fix #3), OG/meta head (fix #4)
- `source/package.json` — possibly: description field (fix #4 input)
- `source/package-lock.json` — sync (fix #10)
- `source/src/features/emptystate/EmptyState.jsx:25` — copy (fix #5)
- `source/src/features/constellation/ConstellationView.jsx:555,573` — easing token (fix #7)
- `source/src/features/settings/SettingsPanel.jsx:82` — placeholder (fix #8)
- `source/src/lib/plugin/builtinPlugins/WordCountPanel.jsx:17,25` — locale arg (fix #9)
- `source/src/lib/plugin/builtinPlugins/wordCount.js:22` — locale arg (fix #9)
- `source/src/lib/theme/themes.js` — FONTS array trimmed (fix #3 D2 input)

**Created (if D2 says self-host):**
- `source/public/fonts/Inter-Variable.woff2` (or whichever 5 are picked)
- `source/public/fonts/Lora-Variable.woff2`
- `source/public/fonts/Fraunces-Variable.woff2`
- `source/public/fonts/JetBrainsMono-Variable.woff2`
- `source/public/fonts/Caveat-Variable.woff2`
- `source/public/fonts/fonts.css` — `@font-face` declarations
- `source/public/favicon.ico` (fix #4)
- `source/public/icon.png` 512×512 (fix #4)
- `source/public/apple-touch-icon.png` 180×180 (fix #4)

**Created (charter docs, if D1 says amend):**
- Append "Telemetry exception" clause to charter source file

**Deleted:**
- `C:\Dev\Projects\JotFolio\ci-fail.log` (fix #10) — already gitignored, just remove from disk
- `C:\Dev\Projects\JotFolio\dist\` (fix #10) — stale v0.2.0 build artifact at repo root

**Possibly deleted (if D1 says rip):**
- `source/src/lib/telemetry.js`
- `source/src-electron/telemetry.js`
- `lib/main.js` references to telemetry

---

## Dependency + parallelization map

```
[D1] ──── Task 6 (telemetry)
[D2] ──── Task 3 (fonts) ─────┐
[D3] ──── Task 4 (OG meta) ───┤── must serialize: both touch index.html
[D4] ──── Task 4 (OG meta) ───┘
[D5] ──── Task 5 (EmptyState)

Independent (run any time after gating):
  Task 1 (README)
  Task 2 (CSP)
  Task 7 (easing)
  Task 8 (placeholder)
  Task 9 (toLocaleString)
  Task 10 (cleanup)
```

**Parallel groups (can be worked simultaneously):**
- Group A: Tasks 1, 7, 8, 9 — single-line micro-fixes, all isolated. **Single commit cluster.**
- Group B: Task 2 — solo commit (security)
- Group C: Tasks 3 → 4 — must run sequentially (both edit index.html)
- Group D: Task 5 — solo commit
- Group E: Task 6 — solo commit, depends on D1 outcome
- Group F: Task 10 — solo commit, can run anytime

**Estimated time:** ~1.5 hours total assuming D1 = "amend charter" (lighter than rip).

---

## Tasks

### Task 1: Sync README version

**Files:**
- Modify: `README.md:1` — heading
- Modify: `README.md:103` — version line
- Modify (if Gavin uses D3 default): `README.md:1` — tagline subline

**Slop-trap to avoid:** Don't add version-shield badge (e.g. shields.io GitHub release badge) without thinking — adds external CDN dependency and runs counter to the local-first charter for a self-contained README. If badges are wanted, defer to a separate task.

- [ ] **Step 1: Confirm current state**

```bash
grep -n "v0\.4\.1\|0\.4\.1\|alpha\.7" README.md
```

Expected: line 1 + line 103 contain `0.4.1`.

- [ ] **Step 2: Edit README.md heading + version**

Change line 1 from `# JotFolio — v0.4.1` to `# JotFolio — v0.5.0-alpha.7`.
Change line 103 from `Version: **0.4.1**` to `Version: **0.5.0-alpha.7**`.

- [ ] **Step 3: Verify**

```bash
grep -n "0\.5\.0-alpha\.7" README.md
grep -n "0\.4\.1" README.md
```

Expected: first finds 2 hits (line 1 + 103). Second finds 0.

- [ ] **Step 4: Commit (deferred — bundled with Task 7/8/9 in Group A)**

---

### Task 2: Tighten CSP `connect-src`

**Files:**
- Modify: `source/index.html:18`

**Slop-trap to avoid:** Don't paste a CSP recipe from Stack Overflow or shipped Webpack templates. Build the allowlist from the actual fetch call sites in code. Missing one breaks AI provider features at runtime.

- [ ] **Step 1: Inventory all outbound fetch origins in source code**

```bash
cd /c/Dev/Projects/JotFolio/source
grep -rn "fetch(" src/lib/ai/ 2>/dev/null
grep -rn "https://" src/lib/ 2>/dev/null | grep -v "googleapis\|gstatic\|github.com"
```

Confirm origins are exactly the expected: openrouter.ai, api.anthropic.com, api.openai.com, localhost (Ollama). Add `https://o.ingest.sentry.io` if D1 = "amend charter" (telemetry kept).

- [ ] **Step 2: Edit `source/index.html:18`**

Change the `connect-src *` segment of the CSP `<meta http-equiv="Content-Security-Policy">` to the explicit allowlist:

```
connect-src 'self' https://openrouter.ai https://api.anthropic.com https://api.openai.com http://localhost:11434 http://127.0.0.1:11434
```

If D1 = amend charter (telemetry kept), append `https://*.ingest.sentry.io` (or the actual DSN host).

- [ ] **Step 3: Run dev server + smoke-test AI provider call**

```bash
cd source && npm run dev
```

Open dev tools console, watch for any "blocked by CSP" violations. Use the Settings AI tab to ping each provider config (no real API call needed if any 200/401/403 reaches the origin = CSP passed).

- [ ] **Step 4: Commit**

```bash
cd /c/Dev/Projects/JotFolio
git add source/index.html
git commit -m "security(csp): replace connect-src wildcard with explicit allowlist"
```

---

### Task 3: Self-host fonts (depends on D2)

**Blocks:** Task 4 (must be first; both touch index.html lines 25-27).

**Files:**
- Modify: `source/index.html:25-27` — remove Google Fonts preconnect + stylesheet link, add local fonts CSS link
- Modify: `source/src/lib/theme/themes.js` — trim `FONTS` array to D2 shortlist
- Create: `source/public/fonts/<font>-Variable.woff2` × shortlist count
- Create: `source/public/fonts/fonts.css` — `@font-face` declarations

**Slop-trap to avoid:** Don't pull from `fonts.bunny.net` or another CDN as a "more privacy-friendly Google Fonts" — that's still external content. Charter says local-first. Files must live on disk, shipped with the app.

Also: don't pick **Inter as primary** purely because it's the safe default. Inter IS the AI-default cluster signature. If we keep it, do so because it pairs with our specific UI — not because every AI demo uses it. (D2 default keeps Inter for compatibility with existing user prefs; Lora + Fraunces + Caveat add the personality.)

- [ ] **Step 1: Download Variable Font WOFF2 files for shortlist**

For each font in D2 (default = Inter, Lora, Fraunces, JetBrains Mono, Caveat):
- Download from official Google Fonts repo on GitHub (e.g. `https://github.com/rsms/inter/releases`, `https://github.com/cyrealtype/Lora-Cyrillic`, `https://github.com/undercasetype/Fraunces`, `https://github.com/JetBrains/JetBrainsMono`, `https://github.com/EbenSorkin/Caveat`).
- Save as `source/public/fonts/<Family>-Variable.woff2`. Variable fonts give us the full weight range in one file (~50-200KB each).
- Verify license is OFL (Open Font License) — these all are.

- [ ] **Step 2: Create `source/public/fonts/fonts.css`**

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-Variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "Lora";
  src: url("/fonts/Lora-Variable.woff2") format("woff2-variations");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}
/* ...repeat for each font */
```

- [ ] **Step 3: Edit `source/index.html`**

Remove lines 25-27 (Google preconnect + stylesheet `<link>`). Replace with:

```html
<link rel="stylesheet" href="/fonts/fonts.css">
```

- [ ] **Step 4: Edit `source/src/lib/theme/themes.js`**

Trim the `FONTS` array to the D2 shortlist + always-available system fonts:

```js
export const FONTS = [
  {label:'System UI',stack:'system-ui,-apple-system,"Segoe UI",sans-serif'},
  {label:'Inter',stack:'"Inter","system-ui",sans-serif'},
  {label:'Georgia',stack:'"Georgia","Times New Roman",serif'},
  {label:'Lora',stack:'"Lora","Georgia",serif'},
  {label:'Fraunces',stack:'"Fraunces","Georgia",serif'},
  {label:'JetBrains Mono',stack:'"JetBrains Mono","Courier New",monospace'},
  {label:'Caveat',stack:'"Caveat","Comic Sans MS",cursive'},
];
```

(System UI + Georgia first so they're the no-download fallbacks if a user prefs an older font that's been removed from the list — handle that migration in code if needed.)

- [ ] **Step 5: User pref migration safety check**

```bash
grep -rn "fontFamily" source/src/lib/prefs.js source/src/App.jsx | head -5
```

Confirm that if a user's saved `fontFamily` matches a removed font, the resolver falls back to the theme default rather than crashing. If not, add migration in `source/src/lib/prefs.js` to wipe unknown fontFamily values on load.

- [ ] **Step 6: Run dev server + visual check**

```bash
cd source && npm run dev
```

Open Settings → Appearance → Font dropdown. Confirm 7 entries shown (5 self-hosted + 2 system). Switch between each, confirm it actually renders that face (not silent fallback to system).

Open dev tools Network tab on cold reload. Confirm zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`. Confirm 5 woff2 files load from `/fonts/*`.

- [ ] **Step 7: Commit**

```bash
cd /c/Dev/Projects/JotFolio
git add source/public/fonts/ source/index.html source/src/lib/theme/themes.js
git commit -m "feat(fonts): self-host font shortlist, drop Google Fonts CDN"
```

---

### Task 4: Add OG/meta head profile (depends on Task 3 + D3 + D4)

**Files:**
- Modify: `source/index.html:24` — head block expansion
- Modify: `source/package.json:5` — add `description` + `author` (audit hit BRAND.13 from v1)
- Create: `source/public/favicon.ico` — multi-resolution
- Create: `source/public/icon.png` — 512×512
- Create: `source/public/apple-touch-icon.png` — 180×180

**Slop-trap to avoid:** Don't write `og:description` as marketing fluff. Use the same line as D3 tagline, verbatim. Don't add `og:image` pointing at a placeholder URL — either ship a real image or omit the tag (omitted is fine for a desktop app pre-marketing).

Don't pick a generic indigo `#6366f1` for `theme-color`. Use the actual brand color from the codebase (D4 = `#151415`).

Don't add `<meta name="generator" content="Vite">` — generator metadata is a forensic AI-tell.

- [ ] **Step 1: Generate icon assets**

If Gavin doesn't have a brand mark yet (audit-known: he doesn't), use a placeholder generator that's domain-specific, not a default Electron atom or a gradient circle:

```bash
# Create a simple monogram-style favicon using a tool like https://favicon.io
# OR use a real SVG → multi-res ICO with imagemagick if available locally
```

If no icon source exists, **flag this back to Gavin and skip favicon for now**. Don't ship a placeholder favicon — that's worse than no favicon (counts as both A.06 hit AND ships fake brand surface). Add `<!-- TODO: real icon assets -->` HTML comment at the head block instead.

- [ ] **Step 2: Edit `source/package.json`**

Add the `description`, `author`, `keywords`, and ensure `repository`:

```json
{
  "name": "jotfolio",
  "version": "0.5.0-alpha.7",
  "description": "<D3 tagline>",
  "author": {
    "name": "Gavin (blottters)",
    "url": "https://github.com/blottters"
  },
  "keywords": ["markdown", "notes", "local-first", "knowledge-base", "obsidian-style"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/blottters/JotFolio"
  },
  ...rest
}
```

- [ ] **Step 3: Edit `source/index.html` head block**

After the existing `<title>JotFolio</title>`, add:

```html
<meta name="description" content="<D3 tagline>">
<meta name="theme-color" content="<D4 hex>">

<!-- Open Graph -->
<meta property="og:title" content="JotFolio">
<meta property="og:description" content="<D3 tagline>">
<meta property="og:type" content="website">
<meta property="og:url" content="https://github.com/blottters/JotFolio">

<!-- Icons (if D2 step 1 succeeded) -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="/icon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

If favicon assets are not available, omit the icon `<link>` lines and add the TODO comment.

- [ ] **Step 4: Verify**

```bash
cd source && npm run dev
```

View `http://localhost:5174/` source. Confirm head block has description + theme-color + og tags. Run Lighthouse SEO audit (`npm run lighthouse` if it exists, or manually in dev tools) — should score above the previous baseline.

- [ ] **Step 5: Commit**

```bash
cd /c/Dev/Projects/JotFolio
git add source/index.html source/package.json source/public/
git commit -m "feat(meta): add OG metadata, theme-color, package description"
```

---

### Task 5: Replace EmptyState copy (depends on D5)

**Files:**
- Modify: `source/src/features/emptystate/EmptyState.jsx:25`

**Slop-trap to avoid:** Don't replace one generic phrase with another. "Your library is empty" is the same family as "Nothing here yet." Specific = mentions the user action available right now (press N, drop URL, clear filter).

Also: don't add an emoji to "humanize" the empty state. That's the AI-friendly-microcopy pattern (📭 / 📚 / 💡 + cliché phrase). Skip.

- [ ] **Step 1: Read current code**

```bash
sed -n '20,35p' source/src/features/emptystate/EmptyState.jsx
```

Confirm the literal at line 25 + understand surrounding context (filter state passed in via props).

- [ ] **Step 2: Replace literal**

Change `'Nothing here yet'` to D5 default: `"This view is empty. Try clearing filters or press N to add."`

If the component is rendered both for "no entries at all" AND for "no entries match the filter," consider conditional copy:
- No entries total: `"No entries in your vault yet. Press N to add your first."`
- Filter applied, no matches: `"No entries match this filter. Clear it or press N to add a new one."`

Read the EmptyState code to confirm which case applies. If both cases pass through the same component, branch on a `hasFilters` prop.

- [ ] **Step 3: Verify**

Visual check in dev server — open the app on an empty vault, confirm new copy renders. Apply a tag filter that matches nothing — confirm the filter-specific copy (if branched) renders.

- [ ] **Step 4: Commit (bundled in Group A or solo)**

```bash
git add source/src/features/emptystate/EmptyState.jsx
git commit -m "copy(empty): product-specific empty-state messaging"
```

---

### Task 6: Resolve telemetry charter conflict (depends on D1)

**Files (if D1 = amend charter):**
- Modify: `C:\Users\gavin\OneDrive\Desktop\Prompts - Markdowns- Claude Docs\Prompts\# OpenClaw Complete Reference Guide.txt` — append "Telemetry exception" clause to §9 SECURITY AND PRIVACY REQUIREMENTS
- Modify: `C:\Users\gavin\.claude\projects\C--Dev-Coding-Agents\memory\slatevault_vibe_prompt.md` — sync the same exception
- Modify: `README.md` — add "Telemetry" subsection documenting opt-in scrubbed crash reporting + how to disable

**Files (if D1 = rip):**
- Delete: `source/src/lib/telemetry.js`
- Delete: `source/src-electron/telemetry.js`
- Modify: `source/src-electron/main.js:21-24` — remove telemetry imports + init calls
- Modify: `source/package.json` — drop `@sentry/electron` from devDependencies (already not in dependencies)
- Modify: `README.md` — remove or rewrite any telemetry mentions
- Modify: any settings UI that shows a "telemetry" toggle

**Slop-trap to avoid (if amending charter):** Don't write the exception clause as a vague "we may collect anonymous usage data" — that's the AI-default privacy policy phrasing. Be specific: opt-in only, scrubbed (list scrubbed fields), DSN-gated, lazy-loaded. Quote the exact behaviors in the implementation.

**Slop-trap to avoid (if ripping):** Don't leave dead Sentry imports or `@sentry/electron` in `package-lock.json`. After deleting code, run `npm install` to refresh the lockfile and verify no orphan dependencies remain.

- [ ] **Step 1 (path A — amend):** Read current charter §9, draft amendment language

Open the charter source file. Locate §9 SECURITY AND PRIVACY REQUIREMENTS. Add a new line:

```
- Optional opt-in crash telemetry is permitted IF: (1) explicitly opt-in (no default-on collection), (2) scrubbed of PII (email, IP, cookies, request headers, source paths sanitized to relative), (3) DSN-gated so absent DSN = zero network calls, (4) lazy-loaded so it stays out of the main bundle for opted-out users, (5) documented in README with disable instructions.
```

- [ ] **Step 1 (path B — rip):** Inventory + delete

```bash
cd /c/Dev/Projects/JotFolio
grep -rn "telemetry\|@sentry" source/src/ source/src-electron/ source/package.json
```

Map every reference. Delete the two files. Remove imports + init calls from main.js. Drop the dev dependency. Run `cd source && npm install` to sync lockfile.

- [ ] **Step 2: Sync derived docs**

For path A: append amendment to `slatevault_vibe_prompt.md` memory + add README "Telemetry" subsection.
For path B: remove all telemetry mentions from README + any docs/ subsection.

- [ ] **Step 3: Verify**

For path A: charter source + memory now both contain the exception clause verbatim.
For path B: `grep -rn "telemetry\|@sentry" source/` returns zero hits. Run `cd source && npm run dev` — confirm app boots without errors.

- [ ] **Step 4: Commit**

For path A:
```bash
git add README.md
# Charter source is outside repo — manually note the change
git commit -m "docs(charter): document opt-in scrubbed telemetry exception"
```

For path B:
```bash
git add source/src/lib/telemetry.js source/src-electron/telemetry.js source/src-electron/main.js source/package.json source/package-lock.json README.md
# Note: deletions show in git add via -A or via the deleted file paths
git commit -m "feat(privacy): remove telemetry per charter (no external content shipping)"
```

---

### Task 7: Wire ConstellationView easings to existing token

**Files:**
- Modify: `source/src/features/constellation/ConstellationView.jsx:555` — outer `<g>` transition
- Modify: `source/src/features/constellation/ConstellationView.jsx:573` — edge `<line>` transition

**Slop-trap to avoid:** Don't replace `cubic-bezier(0.4,0,0.2,1)` with another raw cubic-bezier value because "the token doesn't quite fit." If the token doesn't fit, audit your token definitions — but don't drop new defaults inline. Audit found `--jf-ease-in-out: cubic-bezier(0.83, 0, 0.17, 1)` in `tokens.css:64`. That's the right choice for cluster transitions (smoother in/out than Material's bias-toward-out curve).

- [ ] **Step 1: Read current state**

```bash
sed -n '550,580p' source/src/features/constellation/ConstellationView.jsx
```

Confirm two `cubic-bezier(0.4,0,0.2,1)` literals exist at line 555 + within transition string on 573.

- [ ] **Step 2: Verify token exists**

```bash
grep -n "jf-ease-in-out\|jf-ease-out" source/src/lib/theme/tokens.css
```

Confirm `--jf-ease-in-out` is defined.

- [ ] **Step 3: Replace literals**

Line 555: change `cubic-bezier(0.4,0,0.2,1)` to `var(--jf-ease-in-out)`.
Line 573: change all four `cubic-bezier(0.4,0,0.2,1)` instances inside the multi-property transition string to `var(--jf-ease-in-out)`.

- [ ] **Step 4: Visual check**

Run dev server. Open Constellation view. Click a node to focus-drill — confirm the cluster transitions still feel right (not too snappy, not too sluggish). If `--jf-ease-in-out` produces a noticeably different feel than Material's curve, evaluate whether the new feel is *better* (likely) or *worse* (rare). If worse, that's signal to tune the token, not to revert to Material.

- [ ] **Step 5: Commit (bundled in Group A)**

---

### Task 8: Replace `api.example.com` placeholder

**Files:**
- Modify: `source/src/features/settings/SettingsPanel.jsx:82`

**Slop-trap to avoid:** Don't replace it with `https://api.your-company.com` (still generic). Use a real provider's actual endpoint as the example, since that's what users will likely paste anyway:

- OpenRouter: `https://openrouter.ai/api/v1/chat/completions`
- OpenAI: `https://api.openai.com/v1/chat/completions`
- Anthropic: `https://api.anthropic.com/v1/messages`

Pick the most-likely-to-be-pasted (OpenRouter for BYOK general use).

- [ ] **Step 1: Read context**

```bash
sed -n '75,90p' source/src/features/settings/SettingsPanel.jsx
```

Confirm placeholder use + surrounding label/aria-label text.

- [ ] **Step 2: Replace**

Change `placeholder="https://api.example.com/v1/chat/completions"` to `placeholder="https://openrouter.ai/api/v1/chat/completions"`.

- [ ] **Step 3: Commit (bundled in Group A)**

---

### Task 9: Pin `toLocaleString` locale at 3 sites

**Files:**
- Modify: `source/src/lib/plugin/builtinPlugins/WordCountPanel.jsx:17`
- Modify: `source/src/lib/plugin/builtinPlugins/WordCountPanel.jsx:25`
- Modify: `source/src/lib/plugin/builtinPlugins/wordCount.js:22`

**Slop-trap to avoid:** Don't pass a hardcoded `'en-US'` if the app already has a locale source-of-truth (e.g. user pref or system detect). Check `source/src/lib/i18n/` first. If no i18n exists yet (which the audit suggests), `'en-US'` is fine as the explicit pin.

- [ ] **Step 1: Confirm no existing i18n source**

```bash
ls source/src/lib/i18n/ 2>/dev/null
grep -rn "useLocale\|i18n\.locale" source/src/ 2>/dev/null | head -5
```

Expected: dir doesn't exist, no hits. If hits exist, route through that source instead of hardcoding.

- [ ] **Step 2: Replace each call**

`WordCountPanel.jsx:17`: change `count.toLocaleString()` → `count.toLocaleString('en-US')`.
`WordCountPanel.jsx:25`: same pattern.
`wordCount.js:22`: same pattern.

- [ ] **Step 3: Verify**

```bash
grep -n "toLocaleString" source/src/lib/plugin/builtinPlugins/
```

Expected: every match has an explicit first argument.

- [ ] **Step 4: Commit (bundled in Group A)**

---

### Task 10: Cleanup (lockfile sync + dist/ + ci-fail.log)

**Files:**
- Modify: `source/package-lock.json` — regenerate via `npm install`
- Delete: `C:\Dev\Projects\JotFolio\ci-fail.log`
- Delete: `C:\Dev\Projects\JotFolio\dist\` (entire folder)
- Verify: `.gitignore` already excludes both (audit said yes)

**Slop-trap to avoid:** Don't run `npm audit fix` while syncing the lockfile — that's a separate concern and conflates security advisory bumps with the sync we want. Just `npm install` (no flags), commit the lockfile delta.

Don't run `git rm -rf dist/` if dist/ is only on disk and not tracked — `rm -rf` is enough. Use `git rm --cached` only if it shows up in `git status`.

- [ ] **Step 1: Sync lockfile**

```bash
cd /c/Dev/Projects/JotFolio/source
npm install
```

Verify: `git diff package-lock.json` shows expected dependency tree changes (no devDep additions you didn't intend).

- [ ] **Step 2: Delete repo-root junk**

```bash
cd /c/Dev/Projects/JotFolio
rm ci-fail.log
rm -rf dist
ls -la | grep -E "ci-fail|^d.*dist$"
```

Expected: zero matches.

- [ ] **Step 3: Confirm gitignore handles future re-creation**

```bash
grep -E "^(ci-fail\.log|dist/|/dist/)$" .gitignore
```

Expected: matches found (audit said yes — verify).

- [ ] **Step 4: Commit lockfile only**

```bash
cd source
git add package-lock.json
git commit -m "chore(deps): sync package-lock.json"
```

(`ci-fail.log` and `dist/` don't need to be in a commit — they're already gitignored, removal from disk is sufficient.)

---

## Group A combined commit (Tasks 1, 5, 7, 8, 9)

After all five micro-fixes are made, single commit:

```bash
cd /c/Dev/Projects/JotFolio
git add README.md \
        source/src/features/emptystate/EmptyState.jsx \
        source/src/features/constellation/ConstellationView.jsx \
        source/src/features/settings/SettingsPanel.jsx \
        source/src/lib/plugin/builtinPlugins/WordCountPanel.jsx \
        source/src/lib/plugin/builtinPlugins/wordCount.js
git commit -m "fix(slop): version sync, empty-state copy, easing token, locale pin, real api example"
```

(Optional: split into 5 commits if blame trail is wanted per file.)

---

## Acceptance criteria (whole plan)

- [ ] Re-run slop-judge v2 audit — verify hit count drops from 11 to ≤2 (App.jsx 800-line cap is deferred; charter resolution may close 1 more)
- [ ] `npm run build` succeeds — Electron packager produces a working alpha.11 candidate
- [ ] Cold reload of dev server shows zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`
- [ ] CSP violations log is empty after using AI provider features
- [ ] User-pref-saved `fontFamily` migration handles dropped fonts gracefully (no crash, falls back to theme default)
- [ ] README, package.json, and any About modal all show `0.5.0-alpha.7` (no drift)
- [ ] Charter (source file + memory copy) reflects D1 outcome
- [ ] All commits are atomic + single-purpose

---

## What we're NOT fixing in this plan

- **App.jsx 809 lines (over 800-line cap)** — separate refactor, deferred. Track as a follow-up plan: `2026-04-29-app-jsx-split.md` or similar.
- **State-soup (30+ useState in App.jsx)** — same as above; pairs with the file-split refactor since the state likely splits along the same boundaries.
- **`useState` → `useReducer` migration for the `section` finite-state machine** — also part of the split refactor.
- **Animation deep-cuts beyond the two ConstellationView easings** — none flagged in the v2 audit, no work to do.

---

## Next step after this plan ships

Re-run `slop-judge` v2 to confirm hits dropped. If verdict band moves to 0-5 ("site has its own design language"), JotFolio is ship-ready for public alpha launch. Otherwise, audit the remaining hits and write a follow-up plan.
