# Phase 4 — Compilation Pipeline

Companion plan to `docs/karpathy-llm-wiki-handoff.md`. Phase 4 builds the
manual, deterministic compilation layer that turns raw notes into compiled
wiki/review entries. Production-safe, dark by default, no LLM dependency in
this phase.

Status: **planned, not implemented.** Phases 1–3 shipped (commits `1c5096b`,
`b080b02`, `58a439c`). Phase 4 will land behind the existing `wiki_mode`
feature flag.

---

## 4a. Pure compile contract (no I/O)

**File:** `source/src/lib/compile/compile.js`

**Signature:** `compile(seed, index, options) -> CompileResult`

- `seed`: entry object, entry id, or a `canonical_key` string. Resolution
  order: id → canonical_key → title (via `index.lookup`).
- `index`: a built `vaultIndex` from Phase 3. Pure dependency injection —
  `compile()` does NOT call `buildVaultIndex` itself.
- `options`: `{ compiler = 'deterministic-stub', now = () => new Date().toISOString(),
  minSources = 1, wikiConfidenceThreshold = 0.7, includeTypes = ['raw'] }`.

**Source selection:** start from seed, take the seed's connected component
(`getCluster`) intersected with `includeTypes`, plus any entries sharing
`canonical_key`. Deduplicate by id. Stable sort by `(created ASC, id ASC)`
for determinism.

**Emit decision:**
- `wiki` if `sources.length >= minSources && computedConfidence >= wikiConfidenceThreshold && warnings.blocking.length === 0`.
- `review` otherwise.
- Never both. Re-running with stronger inputs is how `review` graduates to
  `wiki` via the supersedes chain (4d).

**CompileResult shape:**

```js
{
  entry: { type, title, notes, canonical_key, aliases, provenance,
           confidence, freshness, source_type, valid_from,
           review_after, review_status, supersedes, retrieval_keywords, tags },
  sources: [{ id, hash, title, type }],   // ordered, deterministic
  sourceHash: string,                     // composite hash of all source hashes
  compiledHash: string,                   // hash of compiled body+frontmatter
  confidence: number,
  warnings: [{ code, message, sourceIds? }],
  emitted: 'wiki' | 'review',
  compiler: { name, version }
}
```

**No I/O.** `compile()` returns the artifact for the caller to persist (or
discard). This is the firewall against accidental writes.

**Acceptance:** unit tests pass, `compile()` is referentially transparent
given fixed `now`, identical seed+index+options yield byte-identical output.

---

## 4b. Hash + provenance

**File:** `source/src/lib/compile/hash.js`

- `hashSourceEntry(entry) -> string` — stable hash of `{ id, type, title,
  notes, canonical_key, aliases (sorted), source_type, valid_from }`.
  Excludes `modified` (timestamp churn) and `_path` (filesystem detail).
  Excludes `links` (derived).
- `hashCompiledArtifact({ body, frontmatter }) -> string` — over canonicalized
  JSON of frontmatter (keys sorted, volatile fields like `modified`/`id`
  excluded) plus body.
- `compositeSourceHash(sources) -> string` — hash of sorted list of
  `{ id, hash }` pairs.

**Algorithm:** djb2 in pure JS. No crypto dependency (constraint: no installs).
32-hex output is fine — collision risk negligible for this corpus size, and
we have id-based fallback for invalidation.

**Provenance recorded on output:**
- `provenance`: array of source entry ids (already a flat string array per
  frontmatter schema — fits the parser).
- Per-source hash recorded in the **manifest**, not in entry frontmatter
  (keeps the YAML flat and human-readable, avoids nested maps).

---

## 4c. Manifest

**File:** `source/src/lib/compile/manifest.js`

**Storage location:** `<vault>/.jotfolio/compiled/manifest.json`. Lives under
`.jotfolio/` so it's already excluded by `useVault.refresh`. One file, JSON,
easy to read/diff. Compiled artifacts themselves are real entries living in
`wiki/` or `review/` folders — they ARE in the vault and ARE entries; the
manifest is the only thing in `.jotfolio/compiled/`.

**Why not store compiled artifacts under `.jotfolio/compiled/`?** Two reasons:
1. They need to be searchable, linkable, and visible to retrieval — that
   means they must flow through `useVault` like any entry.
2. Constellation/index already filters knowledge-types by feature flag; no
   new exclusion plumbing needed.

The handoff text says "add `.jotfolio/compiled/`" but the more honest read of
locked-constraint #5 ("compiled is derived, not canonical") is that compiled
entries can live in-vault as long as the manifest tracks their derived
status. The `.jotfolio/compiled/` directory exists only for the manifest.

**Manifest shape:**

```json
{
  "version": 1,
  "entries": {
    "<compiledEntryId>": {
      "compiler": { "name": "deterministic-stub", "version": "0.1" },
      "sources": [{ "id": "...", "hash": "..." }],
      "sourceHash": "...",
      "compiledHash": "...",
      "compiledAt": "ISO",
      "supersedes": "<previousCompiledId|null>",
      "emitted": "wiki|review",
      "history": []
    }
  }
}
```

**API:**
- `loadManifest(vault) -> Manifest` (reads via `vault.read`; missing file →
  empty manifest, never throws).
- `saveManifest(vault, manifest) -> Promise`
- `recordCompilation(manifest, compileResult, compiledEntryId) -> Manifest`
  (pure, returns new manifest object).
- `findStale(manifest, currentEntries) -> [{ compiledId, reason, staleSourceIds }]`
  — recomputes `hashSourceEntry` for each source listed, compares to
  recorded hash. Reasons: `source-changed`, `source-deleted`,
  `source-list-mismatch`.
- `isCompiledEntry(manifest, entryId) -> boolean` — used by UI/retrieval to
  flag derived entries vs hand-authored wiki.

**Compiled vs hand-written wiki distinction:** an entry is "compiled" iff it
appears in `manifest.entries`. Hand-authored wiki entries are absent from the
manifest. No frontmatter flag needed; manifest is the single source of truth
for derivation. This avoids a schema migration.

**Acceptance:** round-trip serialize/deserialize, missing manifest tolerated,
schema-version field present.

---

## 4d. Supersedes chain on re-compile

When `compile()` is run for a seed that already has a compiled entry in the
manifest:

1. Locate previous compiled id via `manifest` (lookup by `canonical_key` or
   by seed id → compiled id reverse map).
2. New `CompileResult.entry.supersedes = [previousCompiledId]` (existing
   flat-array schema field).
3. Caller (Phase 5 UI) decides: replace in place (overwrite file, keep id)
   OR write new entry and mark old `superseded_by`. **Recommendation:
   replace in place** for the manual MVP — simpler invalidation, single id
   per canonical_key, supersedes points to the prior compiled hash recorded
   in manifest history. Add `manifest.entries[id].history = [...]` ring
   buffer (max 5) so prior hashes are inspectable.
4. `review` → `wiki` graduation: when an existing review is re-compiled and
   now meets wiki threshold, emit replaces the review entry, manifest moves
   it from `emitted: 'review'` to `emitted: 'wiki'`, the file relocates from
   `review/` to `wiki/` via `entryToFile` type-folder routing (already
   supported in `frontmatter.js`).

---

## 4e. Stale detection (no auto-recompile)

**File:** stale logic lives in `manifest.js` (`findStale`) and is exposed via
a thin selector.

- `getStaleCompiled(vault, index) -> StaleReport[]` — pure read, returns
  list. Never triggers compilation.
- Phase 5 UI surfaces this as a badge ("3 wiki entries stale"). User clicks
  recompile manually.
- Stale != broken. Stale entries remain valid, retrievable, served. They
  just carry a `freshness: 'stale'` annotation when displayed (computed at
  read-time, not persisted, to avoid file churn).

**Acceptance:** edit a raw source's body → `findStale` returns the dependent
compiled id with `reason: 'source-changed'`. Delete a raw source → `reason:
'source-deleted'`.

---

## 4f. Deterministic stub compiler (Phase 4 ships without LLM)

**File:** `source/src/lib/compile/compilers/deterministicStub.js`

Function: `compileDeterministic(sources, options) -> { body, frontmatter, confidence, warnings }`.

Behavior:
- Title: longest common title prefix, or seed title.
- Body: templated markdown — `## Summary` (first 200 chars of seed notes),
  `## Sources` (bulleted list of `[[wiki-link]]` to each source),
  `## Open Questions` (placeholder).
- `confidence`: `min(0.9, 0.3 + 0.15 * sources.length)` — heuristic,
  deterministic.
- `retrieval_keywords`: union of source keywords + tags.
- `aliases`: union of source titles when distinct from the chosen title.
- Warnings: `single-source` (if `sources.length === 1`), `no-canonical-key`
  (if seed lacks one), `mixed-types` (if sources span unexpected types).

**Phase 7 hook:** `options.compiler` selects the implementation. Registry
pattern:

```js
const COMPILERS = { 'deterministic-stub': compileDeterministic };
// later: COMPILERS['agent-v1'] = compileViaAgent;
```

Agent compiler will satisfy the same interface and return the same
`CompileResult` shape. Phase 4 ships without ever importing an agent module
— the deterministic stub is the entire shipped implementation.

**Acceptance:** stub is pure JS, no async, no fetch, no `window` access.
Runs in test environment without mocks.

---

## 4g. Integration with useVault

**Decision: `compile()` is a pure function exported from `lib/compile/`. It
does NOT live in `useVault`.**

Rationale: keeps I/O explicit, keeps `useVault` uncluttered, makes testing
trivial (no React render needed), respects locked constraint #3 (no
automatic agent write path — pure functions can't write).

**Persistence flow (caller code, lives in Phase 5 UI handler):**

```js
const idx = buildVaultIndex(entries);
const result = compile(seedId, idx, { ...opts });
if (userAccepts(result)) {
  const compiledEntry = { id: previousCompiledId || newId(), ...result.entry };
  await saveEntry(compiledEntry);                    // existing useVault API
  const manifest = await loadManifest(vault);
  const next = recordCompilation(manifest, result, compiledEntry.id);
  await saveManifest(vault, next);
}
```

**No `useVault` changes required for Phase 4.** Phase 5 will add a thin
`useCompile()` hook wrapping this flow + state for the UI. Footprint in
Phase 4 = zero modifications to existing files except a feature-flag
reference.

**Feature flag:** Phase 4 ships behind existing `wiki_mode` flag. The lib
code is always importable (it's pure), but no UI surface exposes it. Phase 5
wires the trigger.

---

## 4h. Test surface

**File:** `source/src/lib/compile/compile.test.js`
- `compile()` with 1 raw source → emits `review` with `single-source` warning.
- `compile()` with 3 linked raw sources sharing canonical_key → emits `wiki`,
  confidence ≥ 0.7.
- Determinism: same inputs + fixed `now` → byte-identical CompileResult
  across two calls.
- Round-trip: raw → compile → wiki entry → re-compile with same inputs →
  `supersedes` points at prior compiled id, body unchanged (idempotent).
- Re-compile with one source edited → new `compiledHash`, supersedes set,
  manifest updated.
- Seed resolution: by id, by canonical_key, by title — all reach same result.

**File:** `source/src/lib/compile/manifest.test.js`
- Serialize/deserialize round-trip.
- Missing manifest → empty manifest, no throw.
- `findStale` detects edited / deleted / unchanged sources correctly.
- History ring buffer caps at 5.

**File:** `source/src/lib/compile/hash.test.js`
- Stable across runs.
- `modified` field changes do NOT change `hashSourceEntry`.
- `notes` body change DOES change hash.
- Field order in input object does not affect hash.

**Acceptance:** all tests pass under existing `npm test` from `source/`. No
new dependencies.

---

## 4i. File list (created vs modified)

**New (all under `source/src/lib/compile/`):**
- `compile.js`
- `compile.test.js`
- `hash.js`
- `hash.test.js`
- `manifest.js`
- `manifest.test.js`
- `compilers/deterministicStub.js`
- `compilers/deterministicStub.test.js`
- `index.js` (barrel re-export — `compile`, `loadManifest`, `saveManifest`,
  `findStale`, `recordCompilation`, `isCompiledEntry`)

**Modified: none in Phase 4.** Hard zero. Phase 5 will modify UI files.

This is intentional. The handoff demands "minimize footprint, dark by
default." A pure subdirectory addition with zero touches to existing files
is the safest possible landing.

---

## 4j. Risks and unresolved questions

**Resolved:**
- Determinism: yes, mandatory. Stub compiler is deterministic. Agent
  compiler in Phase 7 will need a seed/temperature=0 contract or an explicit
  `compiler.nondeterministic: true` flag.
- LLM dependency: deferred to Phase 7. Phase 4 ships stub-only,
  contract-clean.
- Storage location: compiled entries live in vault (`wiki/`, `review/`
  folders). Only the manifest lives under `.jotfolio/compiled/`.

**Unresolved — flag for Gavin before implementing:**

1. **Hash algorithm:** djb2 vs FNV-1a vs a tiny SHA-256 implementation.
   djb2 is simplest; SHA-256 is more conventional but adds ~50 lines of
   code. **Recommend djb2.**
2. **Compiled-id collision with hand-authored wiki:** if a user hand-creates
   a wiki entry with the same `canonical_key` as a compiled one, who wins?
   **Recommend:** `compile()` detects this via index `duplicates.canonical`
   and emits a blocking warning; user resolves manually. No automatic merge.
3. **Manifest schema migration:** version field is in place, but no
   migration runner. Acceptable for v1; flag if v2 ever arrives.
4. **Export semantics:** existing handoff risk note says full-vault export
   is unresolved. Compiled entries will export by default since they're real
   entries. If users want raw-only export, that's a Phase 5+ product
   decision, not Phase 4's problem.
5. **Concurrency:** two simultaneous compiles writing the same manifest
   race. Single-user app, manual trigger only — acceptable risk. Add a
   `manifest.lock` advisory file later if multi-window becomes a concern.
6. **Phase 5 API surface preview:** `compile()` returns `CompileResult`; UI
   button calls compile, shows diff/preview, on accept calls `saveEntry` +
   `saveManifest`. The `CompileResult.warnings` array drives the preview's
   "issues" panel.
