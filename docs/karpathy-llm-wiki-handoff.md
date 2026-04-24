# JotFolio Karpathy LLM Wiki Handoff

Last updated: 2026-04-24

## Paths

- Repo root:
  - `C:\Users\gavin\OneDrive\Desktop\JotFolio`
- Runtime root for all npm commands:
  - `C:\Users\gavin\OneDrive\Desktop\JotFolio\source`
- Living handoff file:
  - `C:\Users\gavin\OneDrive\Desktop\JotFolio\docs\karpathy-llm-wiki-handoff.md`

## Why this plan exists

The product conclusion that led to this work was explicit:

- The target is the Karpathy-style LLM Wiki method.
- The target is not “generic RAG database first.”
- The target is not “embed AI into the app runtime.”
- The target is not “plain note storage with an agent pointed at the vault.”

The conclusion reached in discussion was:

- When people use Obsidian as a second brain for Claude Code in the way the user wants, the pattern is usually closer to Karpathy’s LLM Wiki model than to vanilla note-taking.
- That model means:
  - raw material goes in
  - durable knowledge gets compiled out
  - retrieval prefers compiled/wiki knowledge first
  - raw material remains as provenance/evidence
  - the graph becomes a visible retrieval/debugging surface
- JotFolio should therefore become AI-ready and agent-ready without becoming AI-dependent.
- The app itself must own structure, schema, lifecycle rules, review, and retrieval.
- External agents such as Claude Code can later consume and write through those rules, but should not define the data model.

This direction was chosen because:

- JotFolio is already local-first and markdown-first.
- The vault is durable and human-readable.
- Frontmatter, tags, links, and Constellation already provide symbolic and graph primitives.
- A compiled wiki model is more governable and inspectable than opaque repeated raw retrieval alone.
- The app is live in production, so the rollout must be staged, dark-launched, and backward-compatible.

## Execution constraints still in force

These constraints were active during this work and should still be assumed unless Gavin explicitly changes them:

- Dev-server-only mode.
- Do not run `npm install`.
- Do not run `npm ci`.
- Do not add dependencies.
- Do not run:
  - `npm run electron:dev`
  - `npm run electron:build`
  - `npm run bench`
  - `npm run a11y`
- Do not modify:
  - `src-electron/`
  - `plugins/`
  - `bench/`
  - `.github/`
  without explicit approval.
- All npm commands run from:
  - `C:\Users\gavin\OneDrive\Desktop\JotFolio\source`
- Repo root is:
  - `C:\Users\gavin\OneDrive\Desktop\JotFolio`
- Production is live, so the rollout must remain backward-compatible and dark by default.

## Current objective

Implement the production-safe opening slice of the Karpathy-style LLM Wiki roadmap.

Current execution scope:
- Phase 1: Safe foundation
- Phase 2: Raw / Wiki / Review data model
- Phase 3: Index and retrieval core

## Locked decisions

- JotFolio remains local-first and markdown-first.
- New knowledge features are dark-launched behind feature flags.
- Existing vaults must remain fully compatible.
- No destructive migration.
- No automatic compilation.
- No automatic agent write path.
- `raw`, `wiki`, and `review` are first-class vault entry kinds but hidden by default.
- The Karpathy method is the architectural target:
  - `raw` is source material
  - `wiki` is compiled durable knowledge
  - `review` is generated or intermediate knowledge not yet trusted
  - retrieval should prefer `wiki` over `raw`
  - Constellation is intended to become a second-brain inspection surface
- The rollout is production-safe by design:
  - feature flags default off
  - no reinterpretation of existing entry types
  - no automatic background compilation
  - no automatic external-agent write path
  - no compiled artifact is canonical source of truth
- New schema fields are intentionally flat because the current frontmatter parser supports a constrained YAML subset and nested maps are out of scope for this live production slice.

## Completed checkpoints

- [x] Established and documented the product direction: Karpathy-style compiled wiki over generic RAG-first behavior.
- [x] Added the living handoff document so progress survives session limits and can transfer to Claude Code cleanly.
- [x] Added feature-flag utility with production-safe defaults.
- [x] Added schema support for Karpathy-aligned frontmatter fields.
- [x] Added hidden-by-default entry kinds: `raw`, `wiki`, `review`.
- [x] Updated import validation to accept new entry kinds without exposing them in current UI.
- [x] Updated main app filtering so hidden knowledge entries do not alter current production library or graph behavior unless flags are enabled.
- [x] Added pure vault index/retrieval helpers for canonical lookup, aliases, backlinks, neighbors, clusters, raw/wiki search, affinity matches, and memory-health diagnostics.
- [x] Switched vault wiki-link derivation to the shared index layer so title, alias, and canonical-key matching are deterministic.
- [x] Fixed a production-facing regression discovered during Phase 3 work: activation/onboarding now keys off visible entries instead of total entries, so hidden knowledge entries do not advance visible-product onboarding state.

## In-progress checkpoint

- [x] Run Phase 3 test/build verification.
- [x] Review retrieval/index regressions in existing vault flows.

## Detailed history of work completed so far

This section is intentionally additive and explicit so Claude Code can take over without reconstructing context from chat.

### Pre-implementation context that led here

- The application was evaluated as a possible persistent-memory substrate for Claude Code and similar agents.
- The conclusion was:
  - JotFolio was not yet a correct agent-memory system
  - but it had the right substrate: local-first markdown vault, stable frontmatter, tags, links, graph views, adapter pattern
- The missing layers identified in discussion were:
  - a memory/wiki schema
  - provenance/confidence/freshness discipline
  - lifecycle/review rules
  - retrieval/write governance
  - eventual MCP/API access later
- The Obsidian/Karpathy model was then adopted as the correct target instead of plain note-taking or generic RAG.

### Existing work already present in repo before this execution slice

These were already present before the Karpathy implementation slice began and remain relevant context:

- Theme/system-mode fixes had already been completed earlier.
- Stress-test and hardening work had already landed.
- The plugin sandbox had already been moved to a Web Worker model before this slice.
- The repo was already on the `0.5.0-alpha.2` line when this work started.
- There were also existing uncommitted demo-loader changes in:
  - `source/src/App.jsx`
  - `source/src/features/settings/SettingsPanel.jsx`
  - `source/src/lib/demoEntries.js`
  - `source/src/lib/demoEntries.test.js`
- Those dirty files were preserved and not reverted.
- No new commit was created during this Karpathy rollout slice.
- Current base commit at start of this work remained:
  - `f8229e9 fix: plugin sandbox (Web Worker) + Codex stress-test sweep → v0.5.0-alpha.2`
- Current package version during this work remained:
  - `0.5.0-alpha.2`

### Phase 1: Safe foundation

Implemented:

- Added `src/lib/featureFlags.js` with production-safe defaults:
  - `wiki_mode: false`
  - `raw_inbox: false`
  - `review_queue: false`
  - `context_packs: false`
  - `memory_graph_nodes: false`
- Added tests in `src/lib/featureFlags.test.js`.
- Wired `App.jsx` to normalize and persist `prefs.featureFlags`.
- Added visible-entry filtering so hidden knowledge kinds do not leak into:
  - library results
  - counts
  - tags/tag counts
  - Constellation inputs
  - onboarding and activation visible flows
  - detail navigation
  - settings stats input
- Added the living handoff document for continuity.

Outcome:

- Existing visible behavior remained intact for normal users because all new flags default to off.

### Phase 2: Raw / Wiki / Review data model

Implemented:

- Extended `src/lib/types.js` with:
  - `KNOWLEDGE_TYPES = ['raw', 'wiki', 'review']`
  - `ALL_ENTRY_TYPES`
- Added icons/labels/status sets for those internal knowledge kinds.
- Extended `src/lib/frontmatter.js` to support flat Karpathy-aligned schema fields:
  - `aliases`
  - `canonical_key`
  - `confidence`
  - `freshness`
  - `source_type`
  - `provenance`
  - `valid_from`
  - `review_after`
  - `review_status`
  - `supersedes`
  - `superseded_by`
  - `graph`
  - `retrieval_priority`
  - `retrieval_keywords`
- Added type-folder routing in frontmatter conversion:
  - `raw -> inbox/`
  - `wiki -> wiki/`
  - `review -> review/`
- Updated:
  - `src/parsers/jotfolio.js`
  - `src/lib/exports.js`
  so JotFolio JSON can accept the new entry kinds.
- Added frontmatter tests proving round-trip behavior for the new schema.

Outcome:

- Mixed vaults can now contain normal entries plus `raw/wiki/review` entries.
- New entry kinds persist correctly but remain hidden from default product surfaces.

### Phase 3: Index and retrieval core

Implemented:

- Added `src/lib/index/vaultIndex.js` as the pure internal retrieval layer.
- Added `src/lib/index/vaultIndex.test.js`.
- The index layer now provides:
  - title/alias/canonical-key lookup
  - resolved wiki-link derivation
  - backlinks
  - undirected adjacency
  - connected components / cluster membership
  - `searchWiki`
  - `searchRaw`
  - `getNeighbors`
  - `getCluster`
  - `getAffinityMatches`
  - `getMemoryHealth`
- Switched `useVault` refresh-time wiki-link derivation to use the shared index instead of a local title-only resolver.
- Alias and canonical-key matching are now part of the retrieval substrate.
- Corrected a regression in `App.jsx` so activation uses visible entry count rather than total vault entry count.

Outcome:

- The app now has an internal deterministic retrieval substrate suitable for future compilation, review, context-pack generation, and eventual agent access.
- This layer is internal-only. No new user-facing workflow was added in this slice.
- The only intentional visible-product behavior change in this phase was:
  - activation/onboarding now keys off visible entries instead of total entries
- Everything else in this phase remains dark/internal by design.

### Verification completed across the work so far

- Phase 1/2 verification:
  - `npm test`
  - `npm run build`
  - `Invoke-WebRequest http://127.0.0.1:5174/`
- Phase 3 verification:
  - `npm test`
  - `npm run build`
  - `Invoke-WebRequest http://127.0.0.1:5174/`
- Latest verified state at this handoff:
  - `24` test files passed
  - `147` tests passed
  - build passed
  - live dev server returned `200`

## Pending checkpoints

- Phase 4: compilation pipeline
- Phase 5: Inbox / Wiki / Review surfaces
- Phase 6: context packs
- Phase 7: controlled agent-write readiness

## Files changed

- `src/lib/featureFlags.js`
- `src/lib/featureFlags.test.js`
- `src/features/vault/useVault.js`
- `src/lib/index/vaultIndex.js`
- `src/lib/index/vaultIndex.test.js`
- `src/lib/types.js`
- `src/lib/frontmatter.js`
- `src/parsers/jotfolio.js`
- `src/lib/exports.js`
- `src/App.jsx`

## Additional relevant files already dirty before this slice and intentionally preserved

- `src/features/settings/SettingsPanel.jsx`
- `src/lib/demoEntries.js`
- `src/lib/demoEntries.test.js`

## Current worktree state at handoff

At the moment of this handoff, the worktree is dirty and uncommitted. Current relevant status:

- Modified:
  - `src/App.jsx`
  - `src/features/settings/SettingsPanel.jsx`
  - `src/features/vault/useVault.js`
  - `src/lib/exports.js`
  - `src/lib/frontmatter.js`
  - `src/lib/frontmatter.test.js`
  - `src/lib/types.js`
  - `src/parsers/jotfolio.js`
- Untracked:
  - `docs/karpathy-llm-wiki-handoff.md`
  - `src/lib/demoEntries.js`
  - `src/lib/demoEntries.test.js`
  - `src/lib/featureFlags.js`
  - `src/lib/featureFlags.test.js`
  - `src/lib/index/`

Claude Code should verify `git status --short` before doing further work and should not assume any of this has been committed.

Exact `git status --short` snapshot at handoff:

```text
 M src/App.jsx
 M src/features/settings/SettingsPanel.jsx
 M src/features/vault/useVault.js
 M src/lib/exports.js
 M src/lib/frontmatter.js
 M src/lib/frontmatter.test.js
 M src/lib/types.js
 M src/parsers/jotfolio.js
?? ../docs/karpathy-llm-wiki-handoff.md
?? src/lib/demoEntries.js
?? src/lib/demoEntries.test.js
?? src/lib/featureFlags.js
?? src/lib/featureFlags.test.js
?? src/lib/index/
```

## Highest-priority takeover requirement before Phase 4

This is operationally important and should be treated as the first takeover step before new feature work.

Priority order:

1. Review the dirty worktree first.
2. Separate pre-existing dirty files from this Karpathy rollout slice.
3. Do not revert anything unless Gavin explicitly authorizes it.
4. Checkpoint the currently validated state before starting Phase 4, but only if Gavin authorizes commits.
5. If commits are not authorized, keep the worktree intact and continue carefully from the documented dirty state.

Why this is high priority:

- Production is live.
- The repo is not clean.
- There are both pre-existing dirty files and new rollout files in the same worktree.
- Starting Phase 4 without first establishing worktree boundaries increases the risk of:
  - mixing unrelated changes
  - losing pre-existing work
  - misattributing files to the wrong phase
  - making a later handoff or rollback materially harder

Claude Code should therefore treat worktree review and checkpoint handling as higher priority than beginning new implementation.

What Claude Code should not do first:

- Do not begin Phase 4 immediately.
- Do not clean or revert the worktree.
- Do not assume dirty files are all from one slice of work.
- Do not commit unless Gavin explicitly authorizes commits.
- Do not touch Electron/bench/a11y/dependency-install paths under the existing dev-only constraints.

## Tests run

- `npm test`
- `npm run build`
- `Invoke-WebRequest http://127.0.0.1:5174/`
- Phase 3 rerun:
  - `npm test`
  - `npm run build`
  - `Invoke-WebRequest http://127.0.0.1:5174/`

## Open risks

- New schema fields use flat frontmatter keys such as `retrieval_priority` and `retrieval_keywords`, matching the current parser’s non-nested YAML subset.
- Hidden entries remain exportable and importable; they are only suppressed from current production UI by feature flags.
- Hidden entries can still participate in internal derived links because the vault index is intentionally built across the full corpus. UI surfaces filter them back out, but export semantics remain full-vault rather than visible-library-only.
- Export semantics are still unresolved at a product level:
  - current export behavior remains effectively full-vault
  - current visible product behavior remains visible-library-only
  - Claude Code should not silently redefine that contract without explicit product intent
- Search behavior in the new index is intentionally ranked rather than exact-only:
  - exact title/alias/canonical matches rank highest
  - weaker body/keyword matches can also return
  - that is acceptable for Phase 3 internal retrieval, but UI-facing retrieval may later want stronger presentation rules
- No Phase 4 compilation artifacts exist yet.
- No Phase 5 Inbox/Wiki/Review user surfaces exist yet.
- No Phase 6 context-pack generation exists yet.
- No Phase 7 governed external-agent write path exists yet.

## Planned next steps for Claude Code takeover

Claude Code should take over from this point starting with Phase 4 only. The correct next sequence is:

### Phase 4: Compilation pipeline

Goal:
- make JotFolio behave like an LLM Wiki instead of just storing typed knowledge records

Current truth before takeover:

- Phase 4 has not started.
- No `.jotfolio/compiled/` contract or artifact code exists yet in this rollout.
- No manifest exists yet.
- No source-hash invalidation exists yet.
- No review-entry generation pipeline exists yet.

Required work:
- add `.jotfolio/compiled/`
- add a manifest for compiled artifacts
- add source-hash tracking and invalidation
- ensure compiled artifacts are rebuildable and non-canonical
- keep generation manual-only
- route generated knowledge into `review/` entries, not directly into trusted `wiki/`
- preserve citations/provenance back to raw/library sources

Important production constraints:
- no destructive migration
- no background auto-refresh
- no canonical truth inside `.jotfolio/compiled/`
- manual user content must not become trapped in compiled-only outputs

### Phase 5: Inbox / Wiki / Review surfaces

Goal:
- expose the workflow to users without contaminating the current library experience

Required work:
- add user-facing `Inbox`, `Wiki`, and `Review` work modes/surfaces
- keep `Library` as default
- add actions:
  - compile into wiki
  - accept
  - reject
  - edit
  - merge
  - mark stale
  - lock
  - promote/demote between library and wiki roles
- update Constellation to distinguish:
  - raw nodes
  - wiki nodes
  - review nodes
  - typed edges

Important production constraints:
- default visible experience must stay coherent for existing users
- raw and review should remain opt-in or clearly segregated
- do not overwhelm the main library with internal/system objects

### Phase 6: Context packs

Goal:
- prepare for Claude Code style retrieval without adding transport yet

Required work:
- implement internal context-pack generation
- output compact, project-scoped, markdown-exportable packs
- include:
  - facts
  - decisions
  - procedures
  - active project state
  - open questions
  - source evidence
  - stale/low-confidence warnings
- retrieval order should prefer compiled/wiki knowledge first and raw second

### Phase 7: Controlled agent-write readiness

Goal:
- prepare safe future external writes

Required work:
- add governance:
  - provenance required
  - confidence required
  - canonical merge/update rules
  - lock protection
  - review-after handling
- add diagnostics:
  - duplicate canonical entries
  - stale wiki pages
  - orphaned raw material
  - conflicting claims
  - hidden graph islands
- add dry-run mode for future external writes

Important production constraints:
- no auto-write in production by default
- human review remains required until the governance layer is proven

## Claude Code first 5 minutes

Order matters:

1. Read this handoff fully.
2. Run `git status --short`.
3. Separate pre-existing dirty files from Karpathy rollout files.
4. Decide checkpoint/commit path only if Gavin explicitly authorizes commits.
5. Only after that, begin Phase 4.

## Exact next step if handoff happens now

Phase 4. Add a rebuildable compilation layer under `.jotfolio/compiled/` with a manifest, source-hash invalidation, and manual-only generation into `review/` entries while keeping compiled artifacts non-canonical.
