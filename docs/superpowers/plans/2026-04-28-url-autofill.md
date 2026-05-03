# URL Auto-Fill Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user pastes a URL into the New Entry modal, fetch the URL's metadata and auto-fill Title / Notes / type-specific fields (Channel, Guest, etc) / Tags. No AI, no API keys for v1, no "Generate" button — fires automatically when the URL field loses focus.

**Architecture:** All outbound HTTP is done in the Electron main process via IPC. Renderer never makes the call. This bypasses the freshly-tightened CSP `connect-src` allowlist (good — we want one) and keeps arbitrary-URL fetching off the renderer attack surface. Renderer calls `window.api.fetchUrlMetadata(url)` → main process fetches + parses + returns JSON. Adapters per URL pattern: generic Open Graph parser (default), YouTube oEmbed, iTunes Search.

**Tech stack:** Existing Electron 33 + Vite 7 + React 18 + JSX. New module under `source/src/lib/urlMeta/`. Main-process counterpart at `source/src-electron/urlMeta.js`. No new npm dependencies in v1 (use built-in `node:https` + `node:url`).

**Reference docs:**
- Charter: `slatevault_vibe_prompt.md` — §9 Security and Privacy. URL fetching is user-initiated (user pasted the URL). Different from telemetry. Documented + opt-in toggle below.
- Slop-prevention rules: `feedback_ai_slop_prevention_practices.md` — esp. rules 5 (no generic copy), 7 (no `*` wildcards), 11 (self-imposed rules are real).

---

## §0. Gating decisions (Gavin must answer BEFORE any code is touched)

| # | Decision | Why it gates | Default if no answer |
|---|---|---|---|
| **D1** | **Privacy toggle default.** Auto-fill toggle in Settings → Privacy: should it default to ON (auto-fill works out of the box) or OFF (user must enable)? Charter favors OFF (user opts in to any external request); UX favors ON (feature is invisible-magic when on, broken-feeling when off). | Blocks Task 1 | Default OFF. User flips on after onboarding sees the explainer. |
| **D2** | **Adapter scope for v1.** Three adapters cover most cases: generic Open Graph (covers articles, blog posts, most everything else), YouTube oEmbed (covers Videos type), iTunes Search (covers Podcasts type). Ship all three? Or generic-only first then layer the specifics? | Blocks Task 4-6 ordering | Ship all three in v1. Each adapter is a small module + adapter test. |
| **D3** | **Tag-fill behavior.** Pulled tags from URL domain map + page `meta keywords` + `og:article:tag`. Should they replace empty Tags field automatically, OR show as suggestion chips below the field that user clicks to add? | Blocks Task 7 | Suggestion chips. Auto-replace risks user surprise + slop. |
| **D4** | **Failure UX.** Fetch fails (404, timeout, CSP-bounce, parse error): silent (leave fields blank), inline message under URL, or toast? | Blocks Tasks 2 + 4 | Silent. Log to console. User can fill manually — no need to interrupt them. |
| **D5** | **Cache scope.** Same URL pasted twice in same session: refetch or remember? Refetch across app restarts? | Blocks Task 2 | In-memory only, scoped to session. No persistence (avoids stale metadata + privacy footprint of a URL-history file). |

**Gavin: answer D1-D5 before I run any task below.** Defaults above are my recommendations — say "use defaults" or override individually.

---

## File map

**Created:**
- `source/src/lib/urlMeta/index.js` — public API: `fetchMetadata(url, type)` → `Promise<{title, notes, tags, channel?, duration?, guest?, episode?}>`
- `source/src/lib/urlMeta/adapters/openGraph.js` — generic adapter, runs first
- `source/src/lib/urlMeta/adapters/youtube.js` — YouTube oEmbed adapter
- `source/src/lib/urlMeta/adapters/itunes.js` — Apple Podcasts iTunes Search adapter
- `source/src/lib/urlMeta/tagHeuristics.js` — URL → domain category map + meta-keyword parser
- `source/src/lib/urlMeta/domainMap.js` — explicit domain → tag-suggestion map (e.g. `arxiv.org` → `['research', 'paper']`, `youtube.com` → `['video']`, `nytimes.com` → `['news']`). Authored, not generated.
- `source/src/lib/urlMeta/__tests__/openGraph.test.js`
- `source/src/lib/urlMeta/__tests__/youtube.test.js`
- `source/src/lib/urlMeta/__tests__/itunes.test.js`
- `source/src/lib/urlMeta/__tests__/tagHeuristics.test.js`
- `source/src-electron/urlMeta.js` — main-process IPC handler. Fetches + returns JSON. Uses `node:https` + simple HTML parser for `<meta>` tags + dispatches to adapter based on URL pattern.

**Modified:**
- `source/src-electron/main.js` — register `ipcMain.handle('url-metadata:fetch', ...)`
- `source/src-electron/preload.js` — expose `window.api.fetchUrlMetadata = (url) => ipcRenderer.invoke('url-metadata:fetch', url)`
- `source/src/features/add/AddModal.jsx` — `onBlur` on URL field calls fetchMetadata, fills Title / Notes / type-specific fields if those fields are empty (never overwrites user input), shows tag suggestion chips
- `source/src/features/settings/PrivacyPanel.jsx` — new toggle "Auto-fill from URL" with explainer copy
- `source/src/lib/prefs.js` (or wherever default prefs live) — add `urlAutoFill: false` to defaults
- `README.md` — small "URL auto-fill" subsection under Privacy + how-to-disable

---

## Dependency map

```
[D1] ──── Task 1 (Privacy toggle)
[D4] ──── Task 2 (IPC plumbing) ─┐
                                 ├── Task 4 (Wire AddModal)
[D2] ──── Task 3 (OG adapter) ───┤
[D2] ──── Task 5 (YouTube)       │
[D2] ──── Task 6 (iTunes)        │
[D3] ──── Task 7 (Tag suggest) ──┘
                                 │
                                 └── Task 8 (Tests + smoke)
```

**Parallel groups:**
- Group A: Tasks 1, 3, 5, 6, 7 — independent modules. Buildable in parallel.
- Group B: Task 2 — IPC plumbing solo.
- Group C: Task 4 — AddModal wire-up. Depends on A + B done.
- Group D: Task 8 — tests + smoke. Last.

---

## Tasks

### Task 1: Privacy toggle + pref default

**Files:**
- Modify: `source/src/features/settings/PrivacyPanel.jsx` — add toggle row
- Modify: prefs default location — add `urlAutoFill: false` (per D1)

**Slop-trap to avoid:** Don't write the explainer copy as marketing fluff. Banned: "Magically populate fields with one click" / "Save time and effort." Use specific, charter-aligned copy: "Fetch title + description from URLs you paste. Off by default. When on, JotFolio sends only the URL to its host (the same host you'd visit by clicking the link). No AI, no analytics, no cross-site sharing."

- [ ] **Step 1:** Add `urlAutoFill: false` to `DEFAULT_PREFS` (or whatever the pref defaults object is named). Confirm decode path in `prefs.js` reads it.
- [ ] **Step 2:** In `PrivacyPanel.jsx`, add a toggle row after the existing Privacy items. Use the existing `togBtn(state)` + `togDot(state)` pattern from elsewhere in SettingsPanel for visual consistency.
- [ ] **Step 3:** Verify in dev — open Settings → Privacy, toggle visible, click toggles state, persists across reload.
- [ ] **Step 4:** Commit (deferred — bundled with the AddModal wire-up so the toggle ships together with the feature it controls).

---

### Task 2: IPC plumbing for main-process fetch

**Files:**
- Create: `source/src-electron/urlMeta.js`
- Modify: `source/src-electron/main.js` — register IPC handler
- Modify: `source/src-electron/preload.js` — expose `window.api.fetchUrlMetadata(url)`

**Slop-trap to avoid:** Don't pull `node-fetch` or `axios` as a dependency. Use `node:https` (built-in). Also don't treat the URL string as trusted on the main side — validate it (parseable URL, http/https only, no `file://`, no `chrome-extension://`, no internal IPs unless explicitly allowlisted for localhost via D2). One bad input shouldn't crash the main process.

- [ ] **Step 1:** Create `source/src-electron/urlMeta.js` with:
  - `validateUrl(input)` → throws if not http/https or unparseable
  - `fetchHtml(url)` using `node:https`. Set 10-second timeout. Set User-Agent to something honest (e.g. `JotFolio/0.5.0-alpha.11 (https://github.com/blottters/JotFolio)`). Follow up to 5 redirects.
  - `parseHead(html)` — regex-extract `<meta name|property="..." content="...">` pairs into a map. Don't pull a full HTML parser dep.
  - `dispatch(url, html)` — pattern-match URL, route to adapter, return result.
- [ ] **Step 2:** In `main.js`, register: `ipcMain.handle('url-metadata:fetch', async (_, url) => { try { return await fetchAndParse(url) } catch (e) { return { error: e.message } } })`. Always returns; never throws to renderer.
- [ ] **Step 3:** In `preload.js`, add: `fetchUrlMetadata: (url) => ipcRenderer.invoke('url-metadata:fetch', url)` inside the existing `contextBridge.exposeInMainWorld('api', { ... })` block.
- [ ] **Step 4:** Smoke test from devtools console: `await window.api.fetchUrlMetadata('https://example.com')` returns `{ title: 'Example Domain', notes: '...' }`.
- [ ] **Step 5:** Commit (with Task 4 — the renderer doesn't use it yet).

---

### Task 3: Open Graph adapter (generic, runs first)

**Files:**
- Create: `source/src/lib/urlMeta/adapters/openGraph.js`
- Create: `source/src/lib/urlMeta/__tests__/openGraph.test.js`

**Slop-trap to avoid:** Don't fall back to `<title>` tag if `og:title` is missing — fall back to `twitter:title`, then `<title>`, then the URL hostname as last resort. Skipping the chain lands generic placeholder titles ("Untitled" or the raw URL) which is a slop tell.

Don't truncate `og:description` to a fixed length. Some descriptions are 2 sentences (perfect for Notes), some are 200-word abstracts (also fine for Notes). Let the user trim. Truncating creates a "..." pattern that reads as scraped, not authored.

- [ ] **Step 1:** Implement `parseOpenGraph(metaMap, url)`:
  ```js
  function parseOpenGraph(meta, url) {
    return {
      title: meta['og:title'] || meta['twitter:title'] || meta['title'] || new URL(url).hostname,
      notes: meta['og:description'] || meta['twitter:description'] || meta['description'] || '',
      // type-specific extraction:
      url,
    };
  }
  ```
- [ ] **Step 2:** Test cases (with fixture HTML samples in `__tests__/fixtures/`):
  - arxiv.org page → `{title: 'Mixtral of Experts', notes: 'We introduce Mixtral 8x7B...'}`
  - Blog post with only `<title>` and no `og:` → falls through chain
  - URL with no metadata at all → returns hostname as title
- [ ] **Step 3:** Commit (with Task 5/6/7 — adapter cluster).

---

### Task 4: Wire AddModal to call fetcher on URL blur

**Files:**
- Modify: `source/src/features/add/AddModal.jsx`

**Slop-traps to avoid:**
- **No "Generate" button.** Fires on `onBlur` of URL input (or paste, debounced 300ms).
- **Never overwrite user-edited fields.** Only fill EMPTY fields. If Title already has user input, leave it. Same for every field.
- **No spinner with "Generating with AI..." copy.** Tiny inline indicator next to URL field, no copy. Or skip indicator entirely (operation is fast; if it fails, silent per D4).
- **Don't auto-fire on first render** if URL field already has a value (e.g. from drag-drop). Only fire on user-driven URL change.
- **Don't enable when toggle is OFF.** Read `prefs.urlAutoFill`; bail early if false.

- [ ] **Step 1:** Add a `useEffect` (or inline handler) on the URL input's `onBlur` that:
  ```js
  if (!prefs.urlAutoFill) return;
  if (!urlInput) return;
  if (lastFetchedUrl === urlInput) return; // session cache
  const meta = await window.api.fetchUrlMetadata(urlInput);
  if (meta.error) return; // silent
  setForm(f => ({
    title: f.title || meta.title || '',
    notes: f.notes || meta.notes || '',
    channel: f.channel || meta.channel || '',
    // ...etc per type
  }));
  setSuggestedTags(meta.tags || []);
  setLastFetchedUrl(urlInput);
  ```
- [ ] **Step 2:** Add suggestion-chip render below Tags field (if Task 7 / D3 = chips). Click chip = add to current Tags input value.
- [ ] **Step 3:** Visual check in dev:
  - Toggle OFF → paste URL → fields don't fill (correct)
  - Toggle ON → paste URL → blur → fields fill within ~1s
  - Re-paste same URL → cached, no fetch (check Network tab in dev)
  - Pre-fill Title manually → paste URL → Title NOT overwritten

---

### Task 5: YouTube oEmbed adapter

**Files:**
- Create: `source/src/lib/urlMeta/adapters/youtube.js`
- Create: `source/src/lib/urlMeta/__tests__/youtube.test.js`

**Slop-trap to avoid:** Don't fall back to scraping the YouTube watch page HTML if oEmbed fails. YouTube actively rotates anti-scrape selectors. oEmbed is the official keyless API — if it fails, return generic OG result instead.

- [ ] **Step 1:** URL pattern detection: `youtube.com/watch?v=` OR `youtu.be/` OR `youtube.com/shorts/`.
- [ ] **Step 2:** Hit `https://www.youtube.com/oembed?url=<encoded-url>&format=json`. Parse JSON.
- [ ] **Step 3:** Map fields:
  ```js
  return {
    title: oembed.title,
    channel: oembed.author_name,
    notes: '', // oEmbed doesn't return description; leave for user
    duration: '', // not in oEmbed; flag for v2 (YT Data API needs key)
    url,
  };
  ```
- [ ] **Step 4:** Test fixtures.
- [ ] **Step 5:** Commit (cluster with Tasks 3 + 6 + 7).

---

### Task 6: iTunes Podcast Search adapter

**Files:**
- Create: `source/src/lib/urlMeta/adapters/itunes.js`
- Create: `source/src/lib/urlMeta/__tests__/itunes.test.js`

**Slop-trap to avoid:** When the URL is a generic podcast website (e.g. `lexfridman.com/podcast`) the search query gets derived from the page title. Don't ship a default search like `?term=podcast` — that returns garbage. If query derivation fails, bail to generic OG adapter.

- [ ] **Step 1:** URL pattern: `podcasts.apple.com/`, `lexfridman.com/podcast`, etc. Hard to enumerate — for v1, only trigger iTunes adapter when URL host is `podcasts.apple.com`. Other podcast URLs fall through to generic OG.
- [ ] **Step 2:** Parse `podcasts.apple.com/.../id1234567890` URL → extract collectionId. Hit `https://itunes.apple.com/lookup?id=<collectionId>`.
- [ ] **Step 3:** Map: `title: result.trackName`, `guest: result.artistName`. Episode # would need RSS feed fetch (deferred to v2).
- [ ] **Step 4:** Tests.
- [ ] **Step 5:** Commit.

---

### Task 7: Tag heuristics (domain map + meta keywords)

**Files:**
- Create: `source/src/lib/urlMeta/domainMap.js`
- Create: `source/src/lib/urlMeta/tagHeuristics.js`
- Create: `source/src/lib/urlMeta/__tests__/tagHeuristics.test.js`

**Slop-traps to avoid:**
- **Don't seed `domainMap.js` with generic AI defaults** like `[ai, research, dev]`. Authored, not auto-generated. Pick deliberate domain → tag mappings:
  - `arxiv.org` → `['research', 'paper']`
  - `youtube.com` / `youtu.be` → `['video']`
  - `podcasts.apple.com` → `['podcast']`
  - `nytimes.com` / `washingtonpost.com` → `['news']`
  - `medium.com` → `[]` (Medium spans every topic; domain isn't a tag signal)
  - `github.com` → `['code']`
  - Others — leave unmapped, let `og:article:tag` carry the load
- **Don't strip `#` from suggestions** — they're already plain strings; the chip UI adds the visual `#`.
- **Don't ship a "smart" keyword extractor** in v1 — frequency analysis on body text without NLP context = AI slop. Either pull from explicit `meta keywords` / `og:article:tag` (deterministic) or leave Tags blank.

- [ ] **Step 1:** Build `domainMap.js` as a hand-authored object literal. ~15-20 entries max for v1. Cover the URL patterns the user is most likely to paste (Gavin's actual feed history can inform this).
- [ ] **Step 2:** `extractTagsFromMeta(metaMap)` — pulls and splits `meta[name="keywords"]` + `meta[property="og:article:tag"]` (can repeat). Dedupe. Trim. Lowercase.
- [ ] **Step 3:** `getDomainTags(url)` — parse hostname, lookup in map.
- [ ] **Step 4:** Combine + dedupe + cap at 6 suggestions.
- [ ] **Step 5:** Tests.
- [ ] **Step 6:** Commit (with Tasks 3 + 5 + 6 cluster).

---

### Task 8: Tests + manual smoke + acceptance

**Files:**
- Create: `source/src/lib/urlMeta/__tests__/integration.test.js` (mocked fetch)

**Slop-trap to avoid:** Don't ship integration tests that hit real network in CI. Mock the IPC handler with fixture JSON responses. Real-network tests in CI are flaky AND slow AND charter-noisy.

- [ ] **Step 1:** Mock `window.api.fetchUrlMetadata` with fixture responses.
- [ ] **Step 2:** Render AddModal in test, simulate paste + blur, assert fields populated correctly.
- [ ] **Step 3:** Manual smoke (real network, dev only):
  - Paste arxiv URL into Articles tab → Title + Notes filled
  - Paste YouTube URL into Videos tab → Title + Channel filled
  - Paste podcasts.apple.com URL into Podcasts tab → Title + Guest filled
  - Toggle off in Settings → repeat above → fields don't fill
  - Pre-fill Title manually → paste URL → Title preserved (not overwritten)
- [ ] **Step 4:** Run full test suite — confirm no regressions in existing 369 tests.

---

## Acceptance criteria (whole plan)

- [ ] Privacy toggle defaults to OFF, persists across restarts
- [ ] Toggle ON: pasting a URL into AddModal populates Title + Notes + type-specific fields if those are empty
- [ ] Tag suggestion chips appear when domain map matches OR meta keywords present
- [ ] Toggle OFF: zero outbound fetches confirmed via dev tools Network tab
- [ ] User-edited fields never overwritten by auto-fill
- [ ] Network failures handled silently (per D4) — no toast, no banner, console.warn only
- [ ] Same URL re-pasted in same session: cache hit, no second fetch
- [ ] CSP `connect-src` allowlist NOT widened (renderer never makes the call; main process bypasses CSP)
- [ ] Test suite: previously-passing 369 tests still pass + 4-6 new test files for adapters
- [ ] README updated with Privacy + auto-fill subsection

---

## What this plan does NOT cover

- **AI-powered content tagging** — separate scope (BYOK, gated behind AI features toggle)
- **YouTube video duration** — needs YouTube Data API key. Defer to v2.
- **Podcast episode # extraction** — needs RSS feed fetch + parse. Defer to v2.
- **Body-text keyword extraction (basic NLP)** — flagged as slop trap. AI-powered version is the right form for this; defer.
- **OG image preview** — fetched but not yet rendered. Could ship in a v1.1 with a thumbnail above the URL field.
- **Multi-URL paste** (e.g. paste 5 URLs, each becomes a separate entry) — separate feature.

---

## Risk + dependency notes (no time estimates per `feedback_no_time_estimates.md`)

- **Smallest scope:** Tasks 1 + 2 + 3 + 4 = generic OG only. Skips YouTube + iTunes + tags. Ships an 80% feature.
- **Risk: HTML parsing fragility.** Generic OG works for ~95% of well-formed pages. Sites with broken markup or aggressive bot-protection (Cloudflare challenges, paywall walls) will return empty or 403. Failure UX is silent per D4 — user fills manually.
- **Risk: charter alignment.** Auto-fill sends URL to its host. The charter line is "do not send note content to any external server." URL = note content (it's the entry's URL field). The reading I'm using: this is functionally identical to the user clicking the link in their browser. Same destination, same data shape. Different from telemetry (which would send note content to a JotFolio-controlled aggregator). If Gavin disagrees with this reading, feature gets reframed as opt-in only with extra-strong consent copy.
- **Dependency: Electron IPC must already be working.** Confirmed earlier in session — preload.js + main.js + contextBridge already in use for filesystem ops. New IPC channel follows existing pattern.
- **Irreversibility:** none. Toggle OFF in Settings disables the entire pipeline; the IPC handler returns early. Code can be deleted without leaving residue.

---

## Next step after this plan ships

Re-run slop-judge v2 audit specifically to check the AddModal + new adapter modules — confirm no regressions on Code/Forensic/Asset layers.
