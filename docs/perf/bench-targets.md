# Benchmark Targets + Rationale

Committed baseline at `bench/baseline.json`. Rerun `npm run bench` locally — compares p95 against baseline. Regressions >15% fail CI for `fail`-mode metrics.

## Targets

| Metric | Target | Mode | Rationale |
|---|---|---|---|
| `vault-scan-1k` | <200ms | fail | Opening a 1k-note vault is the fast path; any user notices >200ms |
| `vault-scan-5k` | <1000ms | fail | Stated roadmap target. 5k notes = realistic power-user vault |
| `vault-scan-10k` | <2000ms | warn | Edge case. Matches roadmap. Warn-only until we see users hit this |
| `search-1k` | <20ms | fail | Keystroke-driven; must stay under 16ms frame budget at small scale |
| `search-5k` | <100ms | fail | Roadmap target. Still responsive |
| `search-10k` | <200ms | warn | Acceptable with indexing degradation; full-text upgrade planned v1 |
| `backlink-rebuild-1k` | <50ms | fail | Runs on every save; must not stutter typing |
| `backlink-rebuild-5k` | <150ms | warn | Full re-scan; incremental rebuild is v1 optimization |
| `autocomplete-render` | <10ms | fail | Wiki-link popover must feel instant |
| `md-parse-10kb` | <5ms | fail | Detail panel render path; called on every note switch |
| `frontmatter-roundtrip` | <50ms (per 1000 ops) | fail | Bulk save/load scenarios (import, migration) |
| `plugin-discover-5` | <10ms | warn | Boot critical path only once per session |
| `plugin-discover-20` | <30ms | warn | Same |
| `plugin-discover-50` | <80ms | warn | Same; establishes linear scaling |

## First-run results (2026-04-24, Node 24, win32 x64)

All metrics passed targets with significant headroom:

- `vault-scan-10k` landed at 101ms vs 2000ms target (~20× under). Actual scan cost dominated by `JSON.parse`-free frontmatter parser — efficient enough that `backlink-rebuild-5k` at 13.7ms vs 150ms target raises question whether incremental rebuild is worth building before we see real usage.
- `autocomplete-render` and `plugin-discover-*` effectively free (<0.1ms). The warn-mode targets exist as tripwires for future regressions, not current pressure.
- `search-10k` at 118ms/200ms is closest to target. Full-text search upgrade (inverted index) is queued for v1 if users build vaults past 10k.

Full table in baseline.json.

## When to revise a target

A target becomes "too tight" if:
- Hardware envelope changes (CI runner spec shifts, free tier throttles)
- Algorithm is fundamentally replaced (e.g., full-text index)
- Dataset shape changes (e.g., images/attachments inflate entry size)

Bump the target in this file AND in `bench/runBench.js` TARGETS map in the same PR. Commit message: `bench: revise <metric> target <old>→<new>` with rationale.

## When to NOT revise a target

A target stays fixed if:
- A plausible optimization exists but isn't implemented yet (track as tech debt, don't loosen)
- Regression came from a feature shortcut (revert the shortcut, don't mask it)
- CI was flaky on a single run (re-run, don't adjust)

## CI regression threshold

`bench.yml` fails if any `fail`-mode metric regresses >15% on p95 vs committed baseline. `warn`-mode metrics log but don't fail. The 15% gives headroom for GitHub Actions hardware jitter (~10% observed) without masking real regressions.

If jitter causes false positives, widen to 20% in the same PR that documents the widening (`bench: widen threshold 15→20% — reason`).

## Revision history

| Date | Change | Author |
|---|---|---|
| 2026-04-24 | Initial baseline captured on Windows/Node 24. All targets passing. | Phase 7 initial run |
