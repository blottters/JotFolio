# Memory Graph Nodes (Karpathy Phase 5) — design

**Date:** 2026-05-04
**Status:** spec, awaiting Phase 4 ship
**Owner:** Gavin
**Depends on:** Phase 4 compilation pipeline (`docs/plans/jotfolio-karpathy-phase-4.md`, `docs/superpowers/specs/2026-05-04-karpathy-phase-4-locks-design.md`)
**Visual reference:** `mockups/context-memory-concept.html` (the "Memory Graph Nodes shown from Constellation workflow" mock built 2026-05-04 by Codex+Gavin)
**Ship target:** alpha.19

## Problem

Phase 4 produces compiled wiki/review entries with `confidence`, `provenance`, `supersedes`, `freshness`. Today's Constellation renders all entries as identical-looking nodes — no visual distinction for memory entries, no surface for confirming/splitting/merging memories, no visible link from a memory to the source notes that synthesized it. Phase 5 adds that surface.

This spec also locks the **graduate-tied-memories mechanic** that Gavin sketched verbally (the "unlock" concept) — modeling it as confidence-threshold promotion rather than achievement-style unlocking, to avoid gamification framing inappropriate for a tool.

## Visual contract — what the mockup specifies

| Element | Mockup spec | Phase 5 must deliver |
|---|---|---|
| Memory node | Distinct accent border, 160×110px, `memory node - confidence X%` label | Render any entry with `type ∈ {wiki, review}` differently from regular entries |
| Confidence | Static `82%` label | Pull from `entry.confidence` (Phase 4 output, range 0-1, show as %) |
| Source evidence panel | Lists each linked source with `linked N times` count | For a selected memory, show entries from `manifest.entries[id].sources` plus `link count` from vaultIndex |
| Facts held | 3 bullets of node's claimed facts | Parse from compiled body's `## Summary` section (Phase 4 deterministic stub generates this) |
| Status line | "needs review - last confirmed YYYY-MM-DD" | Compute from `entry.review_status` + `entry.valid_from` / `entry.review_after` |
| Actions | Confirm memory, Split into smaller memories, Add memory | Three explicit handlers (see "Actions" below) |
| Layout modes | Affinity / Cluster / Memory only | Reuse existing Constellation layout modes + add `Memory only` filter |
| Ghost nodes | Toggleable | Already exists in current Constellation (`getCluster` includes unresolved wikilinks) |

## Architecture

### Component shape

```
ConstellationView (existing)
├── nodes
│   ├── EntryNode (existing — notes/articles/etc.)
│   └── MemoryNode (NEW — wiki/review entries)
├── side panel (existing)
│   └── MemoryDetailPanel (NEW — when selected node is wiki/review)
└── toolbar (existing)
    └── + "Memory only" filter button (NEW)
```

### MemoryNode

```jsx
function MemoryNode({entry, onSelect, isSelected}) {
  const confidencePct = Math.round((entry.confidence ?? 0) * 100);
  const isStale = entry.freshness === 'stale';
  const isReview = entry.type === 'review';
  return (
    <div
      data-memory-node
      data-confidence={confidencePct}
      data-stale={isStale}
      onClick={() => onSelect(entry.id)}
      style={{
        border: `2px solid ${isSelected ? 'var(--ac)' : 'var(--br)'}`,
        background: isReview ? 'var(--b2)' : 'var(--cd)',
        opacity: isStale ? 0.7 : 1,
        ...
      }}>
      <strong>{entry.title}</strong>
      <small>{firstSentence(entry.notes)}</small>
      <span className="memory-meta">
        memory · {confidencePct}% · {isReview ? 'review' : 'wiki'}{isStale && ' · stale'}
      </span>
    </div>
  );
}
```

### MemoryDetailPanel

Renders in the existing right detail panel slot when selected entry is wiki/review:

- **Selected memory** — title + status line ("needs review - last confirmed Y-M-D" or "confirmed Y-M-D")
- **Facts held by this node** — parsed from `## Summary` body section
- **Source evidence** — list from `manifest.entries[entry.id].sources` cross-referenced with `vaultIndex.lookup(sourceId)` for title + count from `vaultIndex.getBacklinks(entry.id).length` for "linked N times"
- **Middle of the job** — copy block explaining current state (review = "synthesis under review", wiki = "trusted memory")
- **Actions** (three buttons):
  - `Confirm memory` — see Actions §below
  - `Split into smaller memories` — see Actions §below
  - `Trace claims to sources` — opens scoped Constellation focal mode showing only this memory + its sources + their links

## Actions

### Confirm memory

```js
async function confirmMemory(entryId, vault, manifest) {
  const entry = vault.get(entryId);
  if (entry.type !== 'review' && entry.type !== 'wiki') throw new Error('not a memory');

  const updated = {
    ...entry,
    review_status: 'confirmed',
    valid_from: new Date().toISOString(),
    // Bump confidence to threshold if it's a review entry being promoted
    confidence: entry.type === 'review' && entry.confidence < 0.7 ? 0.7 : entry.confidence
  };

  // If this is a review entry meeting wiki threshold, graduate it to wiki
  if (entry.type === 'review' && updated.confidence >= 0.7) {
    updated.type = 'wiki';
    // entryToFile() relocates to wiki/ folder via existing Phase 2 routing
  }

  await saveEntry(updated);

  // Trigger graduate-tied check (see below)
  return graduateTied(updated, vault, manifest);
}
```

### Split into smaller memories

```js
async function splitMemory(entryId, splits, vault, manifest) {
  // splits: [{ title, sourceIds: [...] }, ...]
  // Each split becomes a new compile() invocation with a subset of original sources
  const original = vault.get(entryId);
  const idx = buildVaultIndex(vault.entries);

  const newMemories = [];
  for (const split of splits) {
    const result = compile(split.sourceIds[0], idx, {
      ...defaultCompileOpts,
      // Force the compile() source set to only these split sourceIds
      sourceFilter: ids => ids.filter(id => split.sourceIds.includes(id))
    });
    result.entry.title = split.title;
    result.entry.supersedes = [original.id];
    const newId = makeId();
    await saveEntry({ id: newId, ...result.entry });
    newMemories.push(newId);
  }

  // Mark original as superseded
  await saveEntry({ ...original, superseded_by: newMemories });
  return newMemories;
}
```

Phase 5 UI shows a split-flow modal: original memory at top, two-column source allocation (drag sources from "Original" into "Split A" / "Split B"), live preview of each child's compile() output. User can iterate before committing.

### Trace claims to sources

Pure UI, no data mutation. Uses existing focal-stack + `getCluster(memoryId, ['raw'])` to dim non-source nodes.

## Graduate-tied-memories mechanic (Gavin's "unlock" concept, reframed)

**Premise:** when a memory is confirmed, downstream memories that depend on it via `supersedes` chain or shared `canonical_key` may now meet their wiki-promotion threshold. The Constellation should surface these as candidates.

**Not "unlock."** Framing matters. JotFolio is a tool, not a game. We model this as **confidence propagation + promotion eligibility** — describes data semantics, not achievement-style gating.

**Algorithm:**

```js
function graduateTied(confirmedMemory, vault, manifest) {
  const tied = findTiedReviewEntries(confirmedMemory, vault, manifest);
  // tied = review entries where:
  //   1. (confirmedMemory.id) appears in their supersedes chain, OR
  //   2. They share canonical_key with confirmedMemory, OR
  //   3. They are downstream compile-derived entries with confirmedMemory as source

  const eligible = tied.filter(e => {
    // Recompute confidence under new conditions: confirmed source = +0.1 confidence boost
    const recomputedConfidence = recomputeWithSourceConfirmation(e, confirmedMemory, vault);
    return recomputedConfidence >= 0.7 && !hasBlockingWarnings(e);
  });

  // Don't auto-promote. Surface a UI prompt: "3 review memories are now eligible for promotion."
  return { tied, eligible };
}
```

**Surface in UI:** when a confirm action returns `eligible.length > 0`, show a non-blocking toast: `"3 tied memories are now eligible for confirmation. Review them →"` linking to a filtered Constellation view of just those 3.

**No automatic promotion.** Confirmation is always explicit, per memory. The mechanic just surfaces candidates that wouldn't otherwise be visible.

**Confidence propagation rule (locked):**
- A review entry's `confidence` is recomputed when one of its sources gets confirmed.
- Boost = `+0.05 per confirmed source, capped at +0.15 total`.
- Recompute happens lazily on next render or explicit "refresh tied" action — not on every save.
- This stays consistent with Phase 4's deterministic stub algorithm: confidence = base heuristic + small confirmation bonus, never a leap.

## Layout modes

Existing Constellation has Affinity / Cluster / Similarity layouts. Phase 5 adds:

| Mode | Behavior |
|---|---|
| `Memory only` | Filter visible nodes to `type ∈ {wiki, review}`. Edges only between memories (via `supersedes` chain + `canonical_key` sharing). Other entries dimmed/hidden per user toggle. |

Existing layout modes remain. `Memory only` is a filter, not a layout — composes with whichever layout is active.

## File list

| File | Status | Purpose |
|---|---|---|
| `source/src/features/constellation/MemoryNode.jsx` | NEW | Renders wiki/review entry as memory node with confidence/stale visuals |
| `source/src/features/constellation/MemoryDetailPanel.jsx` | NEW | Right-panel content when selected entry is memory |
| `source/src/features/constellation/SplitMemoryModal.jsx` | NEW | UI for splitting a memory into children |
| `source/src/features/constellation/ConstellationView.jsx` | MODIFY | Branch on entry.type to render MemoryNode vs EntryNode; add Memory-only filter button |
| `source/src/lib/memory/confirmMemory.js` | NEW | Pure: takes entry + vault + manifest → returns updated entry + graduate side effects |
| `source/src/lib/memory/splitMemory.js` | NEW | Pure: takes entry + split config + vault → returns new memory entries |
| `source/src/lib/memory/graduateTied.js` | NEW | Pure: finds tied review entries newly eligible for promotion |
| `source/src/lib/memory/parseFacts.js` | NEW | Pure: extract bullet facts from compiled `## Summary` body section |
| `source/src/App.jsx` | MODIFY | Wire memory action handlers, pass to ConstellationView |
| Tests for each new lib module | NEW | F1-F8 below |

Estimated: 8 new files + 2 modified, ~900-1100 lines including tests.

## Acceptance criteria

### Functional

| # | Test | Pass criteria |
|---|---|---|
| F1 | Render memory node | Wiki entry appears with accent border + `memory · X% · wiki` meta line |
| F2 | Render review node | Review entry appears with secondary background + `memory · X% · review` |
| F3 | Stale memory rendering | Entry with `freshness: 'stale'` rendered at 0.7 opacity + `· stale` in meta |
| F4 | Confirm review entry meeting threshold | Type changes to wiki, file relocates wiki/, manifest emitted updated |
| F5 | Confirm wiki entry already trusted | Status updated to confirmed, no type change |
| F6 | Split memory into 2 children | 2 new entries created, supersedes set, original marked superseded_by |
| F7 | Graduate tied — confirmation surfaces eligible candidates | Confirming source X with 1 dependent review meeting threshold returns `eligible: [reviewId]` + toast surfaces |
| F8 | Graduate tied — no eligible | Confirming source with no tied review meeting threshold returns `eligible: []`, no toast |
| F9 | Source evidence panel | Selected memory shows N source rows with title + `linked N times` derived from vaultIndex backlinks |
| F10 | Memory-only filter | Toggle hides non-memory entries from canvas, preserves memory edges |
| F11 | Trace-to-sources focal mode | Click action enters focal stack scoped to memory + its sources only |
| F12 | Determinism on confidence boost | Confirming same source twice produces same confidence value (boost is idempotent — checks `valid_from` to avoid double-counting) |

### Build gates

```bash
# Step-by-step (each = own commit, own tests)
npm test -- lib/memory/parseFacts
npm test -- lib/memory/confirmMemory
npm test -- lib/memory/splitMemory
npm test -- lib/memory/graduateTied
npm test -- features/constellation/MemoryNode
npm test -- features/constellation/MemoryDetailPanel
npm test
npm run build
```

### Visual gate

Open dev server, navigate to Constellation, confirm:
- Wiki entries render with accent border + visible `memory` label
- Review entries render with secondary surface
- Click memory → right panel populates with facts + source evidence + 3 actions
- Click "Memory only" → graph reduces to memory nodes only
- Confirm a review entry meeting threshold → it relocates to wiki/, toast appears if tied entries graduate

### Test fixture

Add `tests/fixtures/memory-graph-cluster.json` — a minimal vault with:
- 8 raw entries
- 3 wiki entries (1 confirmed, 1 needs-review, 1 stale)
- 2 review entries (1 with confirmed source, 1 with all-unconfirmed sources)
- supersedes chain demonstrating split-from-original

This fixture seeds F1-F12 + makes the dev server show populated state.

## Out of scope

- Memory merge (combining 2 memories into 1) — defer to alpha.20+. Conceptually inverse of split, semantically more complex (which canonical_key wins?).
- Manual confidence override — defer. Phase 4's deterministic stub is the only confidence source for now.
- Memory expiration / auto-stale background scan — defer. `findStale` is read-only Phase 4; auto-recompile is Phase 7.
- Cross-vault memory imports — out of scope.
- LLM-assisted memory drafting — Phase 7 territory.

## Risks

1. **Confidence boost double-counting on re-confirm.** F12 covers this via `valid_from` check, but spec the exact boost formula in `recomputeWithSourceConfirmation` JSDoc to prevent drift.
2. **Split modal UX is the hardest piece.** Drag-allocation of sources between two columns is fiddly. If alpha.19 timeline tightens, ship split as a 2-step text wizard ("rename to: __, allocate sources by ID list") and revisit visual split UI in alpha.20.
3. **Memory-only filter performance.** Filtering 500+ nodes via React state on toggle = potential jank. Memoize the filtered set, gate edge rendering. Bench with `tests/fixtures/large-vault.json` (1000 entries) before ship.
4. **Phase 4's `parse facts from ## Summary` assumption.** If user hand-edits compiled wiki entry and removes `## Summary` section, `parseFacts()` returns empty. Handle gracefully — show "No facts extracted, view body" link.
5. **MemoryDetailPanel competes with existing detail panel.** Conditionally render based on selected entry type. Don't add a third panel — same slot, branched content.

## Anti-gamification guardrails

To keep "graduate-tied-memories" mechanic from feeling like a game:

- **No XP, points, badges, or progress bars** beyond the confidence percentage that's already meaningful Phase 4 data.
- **No "unlock" / "earn" / "achievement" copy.** Use neutral verbs: "promote," "confirm," "graduate," "verify."
- **No celebratory animation** on confirm. The action should feel like saving a file, not winning a level.
- **No artificial scarcity.** All memories are visible at all times; the mechanic only changes which are *eligible for promotion*, never what's *visible*.
- **Confirmation requires user click.** Auto-confirm is forbidden. Even when confidence ≥ threshold, promotion is explicit.

These rules are LOCKED — do not relax in Phase 5 implementation.

## Ship target

alpha.19. Behind `wiki_mode` flag (same as Phase 4). When user flips wiki_mode on, Memory Graph Node UI becomes available alongside compile button. alpha.18 = Phase 4 dark plumbing, alpha.19 = Phase 5 visible surfaces.
