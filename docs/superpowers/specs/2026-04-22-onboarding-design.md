# JotFolio — Onboarding & Activation (Sub-project D)

**Status:** Design · **Date:** 2026-04-22 · **Version target:** 0.2.0

## Context

JotFolio (v0.1.0) ships with 26 themes, 22 fonts, UI-scale slider, BYOK AI with 7 providers, graph view with 3 layouts, and ~20 settings surfaces. A user test in roleplay and the cross-competitor research sweep both flagged the same problem: **first-run is a customization cliff.** New users hit Settings before they add their first entry, get overwhelmed, churn.

Competitor research confirms target-persona (reflective power user, 25-40, PKM-curious, privacy-conscious) responds to either:
1. **Import-first** (Readwise, Raindrop) — library populates from existing sources on signup
2. **Sample-vault** (Obsidian Help Vault) — preloaded tutorial content

Truly-empty (Apple Notes) loses this audience because they expect affordance; guided-tour (Arc, Tana) adds friction they already paid elsewhere.

This spec defines the day-1 flow that hits our activation bar.

## Goal

Get new users to **3+ entries within 7 days** with minimal friction, while preserving power-user depth for users who want it.

## Non-goals

- Convert audiences outside target persona (casual consumers, teams, non-technical)
- Force paid-tier conversion during onboarding
- Teach every feature in first 5 minutes
- Backend analytics / A/B testing infra

## Activation definition

**Activated = 3+ entries added within 7 days of first app load.**

Measured via `mgn-activation.firstSaveAt` and `entries.length`. All onboarding mechanics optimize toward this threshold. Below 3 entries = user did not activate; empirically unlikely to return.

## First-run flow (pattern F: Import + Start-Here + Skip)

### Trigger
Panel renders when `localStorage['mgn-e']` is empty **and** `localStorage['mgn-onboarded']` is unset.

### Layout — single screen, three zones

**Zone 1 — Import (top, prominent)**

Header: `Bring your library over`
Subtitle: `Optional. Works with what you've already got.`

Source rows (click → format-specific modal with dry-run preview):
- 📚 Readwise — paste export URL or upload `readwise.json`
- 📎 Pocket — upload `ril_export.csv`
- 📘 Kindle — upload `My Clippings.txt`
- 📁 Obsidian vault — drag folder
- 📄 JotFolio JSON — prior export from this app

Each import confirms with `Import N entries?` before committing.

**Zone 2 — Start fresh (bottom)**

Header: `Or start from scratch`

Three quick-action cards:
- 🔗 `Paste your first URL` → opens AddModal, URL field focused
- 🎨 `Pick a theme` → Settings → Appearance, preview mode
- ✦ `See the graph` → empty Constellation with overlay hint

**Zone 3 — Skip (footer)**

Small text link: `Skip — show empty library`
Action: set `mgn-onboarded=true`, close panel, no further prompts.

### Dismissal rules

- Auto-close on: successful import, first entry added, skip click
- Never re-appears once `mgn-onboarded=true`
- Settings → Data gains a `Reopen welcome` item for regretful skippers
- Esc key = same as Skip
- Tab-traversable, focus-trapped

### Edge case

If entries exist but `mgn-onboarded=false` (interrupted import, data imported externally): suppress panel, set flag silently.

## Progressive settings disclosure

### Day-1 visible (Settings → Appearance)

- **Theme** — 6 curated presets: Glass · Minimal · Sakura · Ink · Cobalt · Neo-Brutal (Aa swatch grid)
- **Mode** — Light / System / Dark
- **Font** — 5 curated: Inter · Geist · Lora · JetBrains Mono · Playfair Display
- **UI Scale** slider
- **Enable AI features** single toggle

### Advanced (collapsed by default)

Link `Advanced ›` at bottom of Appearance tab. Tap reveals:
- All 26 themes
- All 22 fonts
- Custom Colors (Accent / Surface / Background / Foreground with hex inputs)
- Card Density
- Sidebar Width
- Reset to default

Persists once opened: `prefs.advancedOpen=true` means it stays open next session (user self-declared power user).

### Tab changes

- **AI tab** day-1 empty state: `AI features off. Enable in Appearance to configure.` Full AI config (provider, model, key, OAuth) appears only after toggle ON.
- **Data tab** day-1: Export JSON + Export Markdown + Library Stats + `Reopen welcome` button (visible to all users, regardless of skip state). Import JSON moves under Advanced.
- **Library tab** day-1: Default View, Default Sort. Card Display toggles under Advanced.
- **Shortcuts tab** unchanged.

### No deprecations

Every existing feature still exists. Advanced expando = one click deeper. Users can revert state by clicking back.

### Escape hatch

Curated theme grid has inline `More themes ›` link → opens Advanced.

## Progress nudges

Five surfaces. Never more than one steady-state nudge active at a time — priority order: `return-card > banner > pill > lock`. The **activation celebration** (surface #5) is a one-shot ephemeral toast that bypasses the priority chain and can co-render.

1. **Sidebar progress pill** — `[2/3]` beside All Entries, until activation. Transforms to `✦ Graph unlocked` one-shot toast at third save.

2. **Post-first-entry banner** — dismissible slim banner above grid for ~24h after first save: `First save logged. Add 2 more to unlock your graph → [+ Add another]`.

3. **Graph lock state** — Constellation sidebar item grayed until entry count ≥ 3. Click while locked: `✦ Graph unlocks at 3 entries. You have 2.` + quick-add button. Unlock bloom animation (nodes fade in + bob) on 3rd save.

4. **Day-2 return card** — if `(now - lastSeenAt) ≥ 18h` and `entries.length ∈ {1,2}`: empty-state area shows `Yesterday you saved "<title>." Two more and your graph comes alive.` Uses real entry title. One-shot per calendar day.

5. **Activation celebration** — entry #3 triggers toast `✦ Your graph is live. Three saves, one thread.` and routes focus to Constellation.

All nudges silent after `entries.length >= 3`. Never pester an activated user.

## Smart defaults on first load

- **Mode** — `System` (honors `prefers-color-scheme`)
- **Theme** — Glass (dark) / Minimal (light) based on detected mode
- **Font** — theme default (each theme carries `--fn`)
- **UI Scale** — 100%
- **AI features** — OFF
- **Card Display** — notes ON, date ON, tags ON (current)
- **View / Sort** — Grid / Newest (current)

## Data / state

### New localStorage keys

```js
mgn-onboarded: boolean
mgn-activation: {
  firstSaveAt: string | null,   // ISO
  thirdSaveAt: string | null,
  lastSeenAt: string,
  bannersDismissed: NudgeId[],  // enum: 'post-first-banner' | 'day2-return' | 'graph-lock-overlay'
                                 //       | 'progress-pill' | 'activation-celebration'
                                 // Shared between nudge components + dismiss handler.
}
mgn-settings-advanced: boolean  // advanced expando preference
```

### Migration

On first run of v0.2.0 code against existing v0.1.0 data (entries present, keys absent):
- Set `mgn-onboarded = true`
- Build `sorted = [...entries].sort((a,b) => Date.parse(a.date) - Date.parse(b.date))` — migration must not depend on array ordering, which is user-reorderable at runtime
- Set `mgn-activation.firstSaveAt = sorted[0].date`
- Set `mgn-activation.thirdSaveAt = sorted[2]?.date ?? null`
- Existing users never see onboarding retroactively

### Computed, not stored

- Activation status (`entries.length >= 3`)
- Day-2 trigger
- Nudge visibility rules

## Success metrics

### Primary
- % new users with 3+ entries in first 7 days · target **≥40%** (vs 15-25% PKM baseline; import-first lifts this)

### Secondary
- Import / fresh / skip split at first-run
- Time-to-first-save · target **< 3 min** from load
- Time-to-third-save · target **< 48h**
- Advanced settings open-rate (power-user persona confirmation)
- Skip-to-empty rate — **> 50% = onboarding too heavy**, iterate

### Instrumentation

Local-only event log (no backend in MVP). Events logged to `localStorage['mgn-events']` (capped FIFO to 500):
- `onboard.start`
- `onboard.import.{readwise|pocket|kindle|obsidian|json}`
- `onboard.fresh.{url|theme|graph}`
- `onboard.skip`
- `entry.added`
- `nudge.{first-banner|pill|lock|day2-return|celebration}.{shown|dismissed}`

Exportable via Settings → Data → `Export event log` for self-inspection.

## Component architecture

Files affected in `src/App.jsx`:

- **New:** `WelcomePanel` component — imports zone, start-fresh zone, skip link
- **New:** `ImportModal` — per-source variants (Readwise, Pocket, Kindle, Obsidian, JSON)
- **New:** `ProgressPill`, `FirstSaveBanner`, `GraphLockOverlay`, `Day2ReturnCard`, `ActivationToast` — nudge surfaces
- **Modified:** `SettingsPanel` — Appearance tab splits into curated + Advanced; AI tab gated on enable toggle; Data tab reshuffled; `mgn-settings-advanced` state threaded through
- **Modified:** `ConstellationView` — lock state render when entries < 3
- **Modified:** `App` — mount `WelcomePanel` based on `mgn-onboarded`; activation state tracker; migration effect on mount
- **New helpers:** `useActivation()` hook returning `{count, isActivated, firstSaveAt, thirdSaveAt, shouldShowDay2Card}`; `useOnboardState()` for panel visibility

### Unit boundaries

Each new component:
- `WelcomePanel` — props: `onComplete()`; no outside deps beyond `entries` count check via hook
- `ImportModal` — props: `source`, `onImport(entries[])`, `onClose()`; pure parser per source type
- Nudge components — props: `activation`, `onDismiss(id)`; rendered based on priority selector

Testable in isolation: each component has deterministic inputs, no side effects beyond the dismiss callback.

## Import parsers (contract per source)

Each parser = `function parse(file: File | string): Promise<Entry[]>`, returns array shaped like existing `Entry` type.

- **Readwise** — JSON schema documented at readwise.io; map `highlights[]` → `Entry` where source URL/title present
- **Pocket** — CSV columns `url,title,time_added,tags,status`; map 1:1
- **Kindle** `My Clippings.txt` — regex-parse the `==========` delimited blocks; each highlight becomes a journal entry with source-book title
- **Obsidian vault** — `.md` files; first H1 = title, rest = notes, tags extracted from `#tag` matches and frontmatter
- **JotFolio JSON** — own export format; validates shape, merges by id, skips dupes

All parsers are **all-or-nothing at parse time**: if any record fails validation, the whole import is rejected with a toast before any state change. Once a valid entry array is produced, the **commit** into `entries` state + localStorage can be chunked (e.g. 100-item batches) with a progress bar; on mid-commit failure (e.g. storage quota), chunks already committed are rolled back and the user sees an error. Parse = atomic; commit = chunked-transactional.

## Error handling

- Import parse failure → toast with specific error, no state change
- Corrupt file → rejected before commit, preview modal shows error
- localStorage quota exceeded during import → chunked commit with progress bar, rollback on mid-fail
- Missing migration fields → set to sane default, log once
- Unknown onboarding state (manual localStorage tampering) → treat as fresh install

## Testing strategy

- Unit: each parser against fixture files (sample Readwise export, Pocket CSV, My Clippings excerpt, vault folder, own JSON)
- Component: `WelcomePanel` renders given empty entries; hides when count > 0 or skipped; imports trigger `onComplete`; skip sets flag
- Integration: fresh localStorage → welcome shows → click skip → library visible → flag persists. Repeat for each import source.
- Migration: seed localStorage with v0.1.0 state → mount App → verify `mgn-onboarded=true`, no welcome rendered
- Nudge priority: activation={1 entry, returned after 20h} → day2 card rendered, banner suppressed. Each priority combination tested.
- Activation flow: add 1 → banner shown; add 2 → pill updates; add 3 → celebration + graph unlocks
- Regression: existing users with entries unaffected; settings opened on day 1 shows curated only

## Rollout

- **v0.2.0 minor bump** — new feature set, no breaking changes to data
- Migration auto-runs on first load
- Behind no feature flag — straight release
- Rollback path: user rolls back to v0.1.0 snapshot on Desktop, their entries still work (additive keys only)

## Open questions (for implementation phase)

- Readwise JSON export — URL-based (requires API key from their side) vs local file upload? → Start file-only, add URL in v0.2.1
- Obsidian vault import — link resolution (`[[wikilinks]]` → JotFolio links) in v0.2.0 or defer? → Defer; plain-text body only for MVP
- Day-2 return card — trigger on `lastSeenAt ≥ 18h` or calendar-day boundary? → 18h rolling, simpler
