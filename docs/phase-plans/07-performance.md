# Phase 7 — Performance Benchmarks + Accessibility

Detailed implementation plan produced by `testing-performance-benchmarker` agent. Executed inline; this file is committed alongside the work as the authoritative reference.

## 1. Bench Harness Architecture

**Location:** `bench/` at project root (not `src/bench/` — keeps bench out of the Vite build graph; not `scripts/bench/` — that implies one-off tooling, not a maintained suite).

**Runtime: pure Node, `npm run bench`.** Every operation we bench (`parse()`, `entryToFile()`, frontmatter, backlink rebuild, plugin discovery) is pure JS with no DOM dependency. `LocalAdapter` uses `localStorage` in the browser; we bench the algorithmic cost with an in-memory stub implementing the same adapter interface. Running in Vitest forces jsdom, adds startup overhead, and makes timing noisier. Electron `NodeFsAdapter` bench is **deferred** — spawning a real Electron process per CI run is not worth the infrastructure cost at this stage.

**Runner:** Single entry `bench/runBench.js` that imports measurement modules from `bench/measure/` and runs them sequentially. One file per domain (vault, frontmatter, search, backlink, plugin, parse). Each module exports an array of `{ id, fn, setup, iterations, warmup }` objects.

**Output:** JSON written to `bench/baseline.json` AND printed to stdout in a human-readable table. Committed JSON is the regression anchor; stdout is for local developer feedback.

**Variance handling:** 3 warm-up runs (discarded), 10 measured runs, report p50/p95/min/max. Drop no outliers — if p95 is bad, that's real signal. CI compares p95 against baseline p95.

## 2. Measurement Catalog

| Name | Setup | What's measured | Target | Variance budget | Failure action |
|---|---|---|---|---|---|
| `vault-scan-1k` | Seed 1k entries in memory | list + read + parse all entries via LocalAdapter stub | <200ms | ±10% | Fail CI |
| `vault-scan-5k` | Seed 5k entries | Same | <1000ms | ±10% | Fail CI |
| `vault-scan-10k` | Seed 10k entries | Same | <2000ms | ±10% | Warn only |
| `search-1k` | Load 1k parsed entries | Title+tag `.includes()` scan, 50 representative queries | <20ms | ±15% | Fail CI |
| `search-5k` | Load 5k parsed entries | Same | <100ms | ±15% | Fail CI |
| `search-10k` | Load 10k parsed entries | Same | <200ms | ±15% | Warn only |
| `backlink-rebuild-1k` | 1k entries loaded | Rebuild full backlink index after single save | <50ms | ±10% | Fail CI |
| `backlink-rebuild-5k` | 5k entries loaded | Same | <150ms | ±10% | Warn only |
| `autocomplete-render` | 5k entries in memory | Compute + filter wiki-link candidates for 3-char prefix, top 20 | <10ms | ±20% | Fail CI |
| `md-parse-10kb` | One 10KB fixture note | Full markdown parse + wiki-link post-process | <5ms | ±15% | Fail CI |
| `frontmatter-roundtrip` | 500-char frontmatter blob | parse + serialize round-trip × 1000 | <50ms total | ±10% | Fail CI |
| `plugin-discover-5` | PluginHost with 5 plugins | `discover()` wall time | <10ms | ±20% | Warn only |
| `plugin-discover-20` | 20 plugins | Same | <30ms | ±20% | Warn only |
| `plugin-discover-50` | 50 plugins | Same | <80ms | ±20% | Warn only |

`cold-boot` measurement runs via Playwright in the a11y step — shared driver.

## 3. Seeding Strategy

Generate on demand, cache in `.tmp/`, `.gitignore` the cache. Re-generation from a deterministic seed is fast (<2s for 10k entries) and reproducible.

**Topology: clustered.** 20 clusters of proportional size. 60% of wiki-links target entries within the same cluster, 40% random. Mirrors worst-case backlink fan-out.

**Dataset sizes:** 10 / 100 / 1k / 5k / 10k entries.

## 4. CI Integration

Separate `bench.yml`. Triggers: on PR, on push to `main`, nightly 02:00 UTC.

Baseline: committed `bench/baseline.json`. Regression threshold: >15% on p95 for any `Fail CI` metric fails the workflow. Improvements require an explicit PR commit updating baseline (never auto-update).

## 5. Accessibility Pass

Tool: `@axe-core/playwright`. Pages: main grid, detail panel, settings modal, add entry modal. Constellation skipped for v0 (canvas-adjacent, no accessible layer).

Target: WCAG AA. Documented gaps in `docs/perf/known-a11y-gaps.md`.

## 6. Dev Dependencies

- `tinybench` (benchmark runner; ESM, zero config)
- `@axe-core/playwright`
- `seedrandom`
- `playwright`

Scripts added to `package.json`:
```json
"bench": "node bench/runBench.js",
"bench:watch": "node --watch bench/runBench.js",
"bench:update-baseline": "node bench/runBench.js --update-baseline",
"a11y": "playwright test bench/a11y/"
```

## 7. File Layout

```
bench/
  runBench.js
  seed.js
  baseline.json
  measure/
    vault.js
    search.js
    backlink.js
    frontmatter.js
    plugin.js
    parse.js
  a11y/
    flows.spec.js
.tmp/                      # git-ignored
.github/workflows/bench.yml
docs/perf/bench-targets.md
docs/perf/known-a11y-gaps.md
```

## 8. Acceptance Criteria

- 14 benchmark measurements defined and passing targets at initial run (or targets revised with written rationale)
- `bench/baseline.json` committed
- `bench.yml` CI workflow
- a11y gaps documented
- `npm run bench` exits 0 on clean checkout

## 9. Risks + Unknowns

- **LocalAdapter in Node context.** No `localStorage`. Bench uses in-memory stub implementing the same interface.
- **Backlink index rebuild cost unknown.** If rebuild is full re-parse (vs incremental), 5k target may be blown. Expect to optimize or revise to warn-only.
- **CI runner hardware variance.** GitHub free-tier ±20%. Widen to 20% threshold if 15% produces false positives.
- **Plugin discovery at 50.** Only 2 real plugins tested. Mock manifests for bench.

## 10. Execution Order

Tasks 1-7 inline, task 8 runs bench + writes baseline, task 11 writes CI workflow. A11y spec + known-gaps = placeholder docs since Playwright requires browser install not in current scope.

---

_Plan authored 2026-04-24 by testing-performance-benchmarker agent. Executed by Claude Code inline._
