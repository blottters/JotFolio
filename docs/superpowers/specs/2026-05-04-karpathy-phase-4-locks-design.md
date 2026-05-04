# Karpathy Phase 4 — decision locks + build order

**Date:** 2026-05-04
**Status:** ready to build
**Owner:** Gavin
**Depends on:** `docs/karpathy-llm-wiki-handoff.md`, `docs/plans/jotfolio-karpathy-phase-4.md`
**Blocks:** Phase 5 UI (Wiki/Review/Inbox surfaces, Memory Graph Nodes), alpha.18

## Problem

Phase 4 plan exists, scoped end-to-end (`compile()` pure contract, hashing, manifest, supersedes chain, stale detection, deterministic stub compiler, useVault integration, test surface, file list). The plan defers 6 implementation choices to "flag for Gavin before implementing." All 6 need locked answers before code starts. This spec locks them, sets build order, and defines acceptance criteria.

## Decision locks (from Phase 4 §4j)

### 1. Hash algorithm → **djb2**

- Simplest. ~10 lines pure JS.
- Collision risk negligible at this corpus size (≤10K entries).
- ID-based fallback for invalidation provides safety net.
- SHA-256 in pure JS = ~50 lines. Not worth the bytes for this use case.
- Reversible later: hash function lives in `lib/compile/hash.js` behind 3 named exports — swap implementation, keep interface.

### 2. Compiled-id collision with hand-authored wiki → **block + warn, no auto-merge**

- `compile()` calls `index.findDuplicates(canonical_key)`. If a hand-authored wiki entry already owns the canonical_key (i.e., not in `manifest.entries`), emit blocking warning `code: 'canonical-collision-handauthored'` with the conflicting entry id in `sourceIds`.
- Phase 5 UI shows the warning, lets user pick: rename canonical_key on raw source OR delete/lock the hand-authored wiki entry. No automatic merge.

### 3. Manifest schema migration → **version field present, no migration runner v1**

- `manifest.json` includes `"version": 1`.
- `loadManifest` returns empty manifest if file missing OR version mismatch (logs warning).
- v2 builds add migration runner when actually needed. YAGNI for v1.

### 4. Export semantics → **defer to Phase 5+**

- Phase 4 doesn't change export behavior. Compiled entries are real entries in `wiki/`/`review/` folders, so they export by default through existing JotFolio JSON export path.
- "Raw-only export" / "compiled-only export" are Phase 5+ product decisions, not Phase 4 plumbing.

### 5. Concurrency → **accept single-user risk, no lockfile**

- Single-user app, manual compile trigger. Two simultaneous compiles writing manifest = race window measured in milliseconds, only achievable by user with two clicked buttons in different windows.
- Add `manifest.lock` advisory file ONLY if a real second-window scenario emerges in dogfood.

### 6. Phase 5 API surface preview → **lock the contract**

```js
// Phase 5 UI handler:
async function compileSeed(seedRef) {
  const idx = buildVaultIndex(entries);
  const result = compile(seedRef, idx, opts);

  // Show user the diff/preview/warnings
  const accepted = await showCompilePreview(result);
  if (!accepted) return;

  const compiledEntry = {
    id: result.entry.supersedes?.[0] || newId(),
    ...result.entry
  };
  await saveEntry(compiledEntry);

  const manifest = await loadManifest(vault);
  await saveManifest(vault, recordCompilation(manifest, result, compiledEntry.id));
}
```

`CompileResult.warnings` drives the preview's "issues" list. `CompileResult.sources` drives the "compiled from N sources" badge. `CompileResult.confidence` drives the confidence indicator. Phase 5 UI is the consumer of this contract.

## Build order

Phase 4 splits into 6 atomic deliverables. Build in this order so each step is testable independently:

| # | File | Reason |
|---|---|---|
| 1 | `lib/compile/hash.js` + tests | No deps. Other steps need hash. Pure functions, trivial to verify. |
| 2 | `lib/compile/compilers/deterministicStub.js` + tests | Depends only on input shape, no compile() yet. Build the engine that compile() will wrap. |
| 3 | `lib/compile/compile.js` + tests | Wires hash + stub + index together. Depends on 1 + 2. |
| 4 | `lib/compile/manifest.js` + tests | Read/write/recordCompilation/findStale. Independent of compile(), but uses hash. |
| 5 | `lib/compile/index.js` (barrel) | Trivial re-exports. After all individual modules pass. |
| 6 | Wire into existing Phase 3 `vaultIndex` if needed | Confirm `index.findDuplicates(canonical_key)` and `index.lookup(seed)` exist. If not, add them. |

Each step gets its own commit. Each commit ships green tests. Phase 4 lands as 5-6 commits, not one big blob.

## Acceptance criteria

### Per-module gates

```bash
# Step 1
npm test -- lib/compile/hash
# expect: 4 tests pass — stable across runs, modified-field-excluded, body-change-detected, key-order-invariant

# Step 2
npm test -- lib/compile/compilers/deterministicStub
# expect: 3+ tests — single-source warns, multi-source confidence formula, deterministic output

# Step 3
npm test -- lib/compile/compile
# expect: 6 tests per plan §4h — single-source→review, 3-source→wiki, determinism, idempotent re-compile, source-edit invalidates, seed resolution by id/canonical_key/title

# Step 4
npm test -- lib/compile/manifest
# expect: round-trip, missing-file-tolerated, findStale detects edited/deleted/unchanged, history ring buffer 5

# Final integration gate
npm test
# expect: 443 + new tests, all green, no existing-suite regression

npm run build
# expect: exit 0, no missing imports, bundle size within 5% of alpha.17
```

### Functional gates

| # | Test | Pass criteria |
|---|---|---|
| F1 | Compile with 1 raw source, no canonical_key | Returns `emitted: 'review'` + warnings include `single-source` + `no-canonical-key` |
| F2 | Compile with 3 linked raw sources sharing canonical_key | Returns `emitted: 'wiki'`, `confidence ≥ 0.7`, no blocking warnings |
| F3 | Re-compile same seed | New `compiledHash` if any source changed body, otherwise byte-identical CompileResult |
| F4 | Compile when `canonical_key` collides with hand-authored wiki | Emits `canonical-collision-handauthored` blocking warning, `emitted` = original lower tier (review) |
| F5 | `findStale` after editing a source body | Returns the dependent compiled id with `reason: 'source-changed'` |
| F6 | `findStale` after deleting a source | Returns dependent with `reason: 'source-deleted'` |
| F7 | `loadManifest` on missing file | Returns empty manifest, no throw |
| F8 | `recordCompilation` then `findStale` with no changes | Returns empty array (nothing stale) |
| F9 | History ring buffer | After 6 recompiles, `manifest.entries[id].history.length === 5` |
| F10 | Determinism | Same seed + same index + fixed `now` → byte-identical CompileResult on two invocations |

### Self-verify harness

Add `lib/compile/__tests__/integration.test.js` running F1-F10 against an in-memory vault fixture. CI runs this on every PR.

## Out of scope (Phase 4 ships without these)

- Agent / LLM compiler. `options.compiler = 'deterministic-stub'` is the only registered compiler.
- Background auto-recompile. Manual trigger only.
- UI surface. Phase 5 owns Wiki/Review/Inbox views, compile button, preview modal.
- Export semantics changes. Compiled entries export as regular entries via existing JSON export.
- Manifest migration runner. `version: 1` is hardcoded.
- Concurrency lockfile.

## Risks

1. **Phase 3 `vaultIndex` API gaps.** Plan assumes `index.lookup(seed)`, `index.findDuplicates(canonical_key)`, `getCluster(seed, includeTypes)` exist. If any is missing, add to vaultIndex.js as part of step 6.
2. **`hashCompiledArtifact` field-order sensitivity.** Frontmatter must be canonicalized (sorted keys) before hash, otherwise re-saving same entry produces new hash. Test F3 covers this.
3. **Body content with mixed line endings (CRLF vs LF).** djb2 over body bytes ≠ djb2 over normalized body. Decision: hash AFTER `\r\n` → `\n` normalization. Document in `hash.js` JSDoc.
4. **Manifest path under `.jotfolio/compiled/manifest.json`.** That dir doesn't exist yet on user vaults. `saveManifest` must `mkdir -p` equivalent. Existing `vault.write` may auto-create; verify before assuming.

## Estimated scope

7 new files. ~600-800 lines including tests. Zero modifications to existing files (Phase 4 is pure addition).

## Ship target

alpha.18. Phase 4 lands behind existing `wiki_mode` flag (importable lib code, no UI). Flag stays off in alpha.18. **Phase 5 in alpha.19** flips the flag and exposes Wiki/Review/Inbox surfaces with compile button.

## Next action

Implement Step 1 (`hash.js`) in a separate session. Reference this spec + `docs/plans/jotfolio-karpathy-phase-4.md` for full context. Don't skip the per-module gate before moving to next step.
