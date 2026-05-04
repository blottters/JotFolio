# alpha.17 scope split — design

**Date:** 2026-05-04
**Status:** verified, awaiting ship approval
**Owner:** Gavin
**Related:** `docs/karpathy-llm-wiki-handoff.md`, context pack §7

## Problem

Working tree post-alpha.16 contains 21 modified + 2 untracked paths spanning 5 distinct slices of work. Bundling all into alpha.17 = wide blast radius (one regression takes down five features) AND violates two stated rules:

1. **"Hidden features being presented as real"** — Knowledge surfaces (Inbox/Wiki/Review) are visible in sidebar but Phase 4 compilation pipeline isn't shipped, so users can't actually compile a wiki entry. UI without engine.
2. **Git Sync stub** is logged in `officialPlugins.js` as an official workflow plugin while only logging sync intent to `.jotfolio/sync.log` — it does no real Git operations. Plugin presented as functional.

## Decision

alpha.17 ships the Trash + folder polish work. Knowledge re-enable + Git Sync expose are surgically reverted to stay dark.

| Slice | alpha.17? | Why |
|---|---|---|
| Trash dedicated view (TrashView.jsx + ribbon + settings + adapter rmdir support) | ✅ ship | clean, useful, real |
| Folder tree polish (sidebar shows files, delete x with confirms) | ✅ ship | matches user-stated UX preference, real |
| Folder rmdir adapter support | ✅ ship | required by Trash + folder delete, real |
| Templates panel polish | ✅ ship | minor (16 lines), part of folder tree integration |
| Knowledge re-enable (raw_inbox/wiki_mode/review_queue default true) | ❌ **revert** | Phase 4 compile engine not shipped; UI without engine |
| Git Sync exposed in `OFFICIAL_PLUGINS` | ❌ **revert** | stub presented as real plugin |
| Concept mockups (`mockups/`) | ❌ leave untracked | concept artifacts, not runtime |

## Surgical revert plan

### 1. `source/src/lib/featureFlags.js`

Revert `DEFAULT_FEATURE_FLAGS` to all `false` for `wiki_mode`, `raw_inbox`, `review_queue`. Restore strict `=== true` checks in `normalizeFeatureFlags` so saved prefs remain the source of truth (no forced override).

```js
export const DEFAULT_FEATURE_FLAGS = Object.freeze({
  wiki_mode: false,
  raw_inbox: false,
  review_queue: false,
  context_packs: false,
  memory_graph_nodes: false,
});

export function normalizeFeatureFlags(input) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    wiki_mode: source.wiki_mode === true,
    raw_inbox: source.raw_inbox === true,
    review_queue: source.review_queue === true,
    context_packs: source.context_packs === true,
    memory_graph_nodes: source.memory_graph_nodes === true,
  };
}
```

### 2. `source/src/lib/featureFlags.test.js`

Mirror the revert. Tests assert defaults are all `false` and that `normalize` returns `false` for any non-`true` input.

### 3. `source/src/plugins/officialPlugins.js`

Drop the two `git-sync` `?raw` imports + remove `wrap('git-sync', ...)` from `OFFICIAL_PLUGINS`. Plugin file remains on disk under `source/plugins/git-sync/` for future activation.

### 4. UI flag-gated surfaces — keep, don't revert

Changes in `App.jsx`, `Sidebar.jsx`, `AddModal.jsx`, `Toolbar.jsx`, `EmptyState.jsx`, `ConstellationView.jsx`, `SettingsPanel.jsx` that render Knowledge sections are flag-gated. With flags reverted to `false`, these surfaces remain inert at runtime. The plumbing stays so Phase 4 → alpha.18 only needs to flip flags, not re-add UI.

### 5. `mockups/` directory

Leave untracked. Add to `.gitignore` only if accidental commit becomes a risk. For alpha.17, keep out of git history.

## Self-verify checklist

Run in order. Any FAIL = stop, do not commit.

```bash
# 1. Targeted unit tests for reverted files
cd C:/Dev/Projects/JotFolio/source
npm test -- featureFlags officialPlugins
# expect: PASS, defaults all false, OFFICIAL_PLUGINS does not include git-sync

# 2. Full test suite
npm test
# expect: all tests pass, no flag-related regressions

# 3. Vite build
npm run build
# expect: clean build, no missing imports for git-sync (we dropped them)

# 4. Dev server eyeball at http://localhost:5174/
#    a. Open default vault
#    b. Confirm Sidebar shows: All Entries, Notes, Articles, Podcasts, Videos, Journals, Links — NO Inbox, NO Wiki, NO Review section
#    c. Open Settings > Plugins — confirm Daily Notes is listed, Git Sync is NOT
#    d. Open Add Entry modal — confirm type buttons do NOT include Inbox/Wiki/Review
#    e. Open Constellation type filter — confirm raw/wiki/review NOT in legend
#    f. Open ribbon — confirm Trash icon visible near Settings
#    g. Click a folder in sidebar — confirm delete x appears with confirm modal
#    h. Click Trash from ribbon — confirm dedicated Trash view loads with restore/permanent/empty actions

# 5. Smoke `git status --short` — confirm only intended file reverts
git status --short
# expect: 21 still-modified files become 19 modified (featureFlags + officialPlugins reverted to clean), 2 untracked (mockups/, source/src/features/trash/) unchanged
# Wait — featureFlags has 2 files (.js + .test.js). So 21 → 18 modified after 3 reverts.
```

## Acceptance gates

| Gate | Pass criteria |
|---|---|
| Unit tests | 25 file-pass minimum (current baseline), 0 fail |
| Build | exit 0, no errors |
| Bundle size | within 10% of alpha.16 baseline (no major regression) |
| Eyeball checks 4a-4h | all 8 visible behaviors confirmed |
| Git status | exactly 18 M + 2 ?? (3 file reverts from 21 M) |

## Version + ship sequence (after acceptance)

1. `source/package.json`: `0.5.0-alpha.16` → `0.5.0-alpha.17`
2. `source/package-lock.json` root + package version bump
3. `docs/CHANGELOG.md`: add `## [0.5.0-alpha.17] - 2026-05-04` section listing Trash + folder polish + adapter rmdir + delete x confirms
4. `docs/PATCH_NOTES.md`: bump current version line
5. `npm test && npm run build` — final verify
6. Commit per CLAUDE.md style
7. Tag `v0.5.0-alpha.17`
8. Push commits + tag → CI publishes
9. Verify GitHub Release marked prerelease, installer asset present
10. **Do not** publish until Gavin explicitly approves the eyeball + ship

## Rollback plan

If eyeball fails on any 4a-4h:

```bash
# Restore reverted files from current dirty state (before our reverts wrote)
git checkout source/src/lib/featureFlags.js source/src/lib/featureFlags.test.js source/src/plugins/officialPlugins.js
# Re-apply Codex's flag flip + git-sync expose
# Then debug specific failure without re-reverting
```

If post-tag regression discovered: alpha.17 stays published (no tag move per rule §0.5), alpha.18 fixes immediately. Per rule §0.6: never re-tag.

## Out of scope

- Phase 4 compilation pipeline (separate spec)
- Memory graph nodes Phase 5 (separate spec)
- Confirm-to-unlock memory mechanic (separate spec)
- Code-signing cert (external, blocked)
- alpha.13 toolbar audit (orthogonal)

## Risks

1. **Sidebar.jsx** has 79 lines of changes mixing folder tree work with Knowledge surface rendering. Need to confirm Knowledge sidebar block is flag-gated. If hardcoded, requires inline edit to wrap in `flags.wiki_mode &&` guard. Verified during eyeball step 4b.
2. Saved user prefs from earlier dev runs may have `wiki_mode: true` cached in localStorage. After revert, `normalizeFeatureFlags` still returns `false` only for `=== true` ⇒ saved `true` survives ⇒ surfaces re-appear. Verify via clearing localStorage + reloading dev server.
3. CRLF/LF line-ending warnings on git diff = harmless but noisy. Acceptable.

## Execution log (2026-05-04)

### What actually happened

Risk #1 fired hard. Codex-era Knowledge surfaces were rendered **unconditionally** — not flag-gated — in 4 component files. The featureFlags.js revert alone could not hide them. Required surgical flag-gating edits to:

| File | Change | Lines |
|---|---|---|
| `source/src/features/sidebar/Sidebar.jsx` | Added `flags={}` prop, derived `visibleKnowledgeTypes` filter, wrapped Knowledge header+items in conditional render | +4 |
| `source/src/features/add/AddModal.jsx` | Added `flags={}` prop, derived `visibleEntryTypes`, replaced `ALL_ENTRY_TYPES` in radiogroup with filtered set + dynamic grid columns | +3 |
| `source/src/features/constellation/ConstellationView.jsx` | Added `flags={}` prop + `KNOWLEDGE_FLAG_MAP`, derived `visibleEntryTypes`, replaced 2 `ALL_ENTRY_TYPES` references (filter dropdown + legend) | +3 |
| `source/src/features/emptystate/EmptyState.jsx` | Added `flags={}` prop, derived `visibleEntryTypes` + `knowledgeOn`, gated copy mention of inbox/wiki/review + filtered type buttons | +5 |
| `source/src/App.jsx` | Pass `flags={prefs.featureFlags}` to Sidebar, AddModal, ConstellationView, EmptyState callsites | +4 |

These edits stay in alpha.17. They make the existing Knowledge UI plumbing genuinely gated rather than aspirationally gated. When Phase 4 ships and flags flip on, the same UI lights up — no further wiring needed.

### Risk #2 confirmation

Local dev environment had `mgn-p.prefs.featureFlags.{wiki_mode,raw_inbox,review_queue}: true` cached. Cleared via `localStorage.setItem` on the live preview server. Reload behaved as expected. No production users had this state since alpha.12-16 never shipped flipped flags.

### Acceptance gate results

| Gate | Expected | Actual | Pass |
|---|---|---|---|
| Targeted unit tests (featureFlags) | 3 pass | 3 pass | ✓ |
| Full test suite | 0 fail | 443/443 pass | ✓ |
| Vite build | exit 0 | clean, 407ms | ✓ |
| Bundle size | within 10% | 654 KB main / 188 KB gzip — same as alpha.16 | ✓ |
| 4b Sidebar — no Knowledge | absent | absent | ✓ |
| 4c Plugins — Daily Notes only, no Git Sync | confirmed | confirmed | ✓ |
| 4d AddModal — 6 type buttons | 6 | 6 (Notes/Videos/Podcasts/Articles/Journals/Links) | ✓ |
| 4e Constellation legend | 6 types | 6 types | ✓ |
| 4f Trash icon in ribbon | present | aria-label="Trash" button found | ✓ |
| 4g Folder delete x with confirm | present | "Delete folder X" buttons rendered | ✓ |
| 4h Trash view dedicated layout | loads with Empty Trash + Refresh | confirmed | ✓ |
| Git status scope | 18 M + 2 ?? real-work | 18 M + 4 ?? (real-work 2 + spec doc + .claude/ project config) | ✓ |

All 12 gates green. Ready for ship sequence (version bump → changelog → tag → release).

**Awaiting:** explicit go-verb from Gavin to execute version bump + tag + release per §"Version + ship sequence".
