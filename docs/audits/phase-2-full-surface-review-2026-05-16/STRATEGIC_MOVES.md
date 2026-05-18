# Strategic Moves — JotFolio QA

Companion to `TEST_COVERAGE.md`. The inventory says 161/161 passing. That number is true and also a lie. It means every code surface has *a* test, not that every code surface has a test *worth running*. This doc is the part the inventory doesn't tell you. It's the part that decides whether the suite catches the next regression or rubber-stamps it.

Written from the side of someone who's shipped enough green builds that broke prod to know what a green build is worth: nothing, until you've stress-tested the assertions.

---

## TL;DR — the moves in priority order

1. **Add coverage instrumentation.** `@vitest/coverage-v8`. Right now "every file has a test" is the only metric. That's a checkbox. Real number is line/branch coverage, and I'd bet it's under 55%.
2. **Add a CI workflow.** No `.github/workflows/test.yml` was found. 1045 local tests that never run on PRs are a private hobby, not a quality gate.
3. **Add mutation testing.** Stryker. The smoke tests I wrote will all survive most mutants. That's the proof they're weak.
4. **Replace hand-maintained inventory with a generator.** `TEST_COVERAGE.md` will be stale within one PR. Make it a script.
5. **Fix the snapshot sort bug in source, not just in the test.** I patched the test. The bug is in `snapshots.js:121`.
6. **Migrate `src-electron/` to ESM.** The `Module._load` hook in 7 test files is a smell, not a pattern.
7. **Build a `renderWithProviders` helper.** Subagents stubbed providers minimally and inconsistently. Theme/vault context regressions won't bite until prod.
8. **Wire Playwright a11y into `npm test`.** Currently detached. Half the test infrastructure is doing nothing.

The rest of this doc is the line-level version of those eight moves.

---

## ADD

### A1 — Coverage reporting
**Add:** `@vitest/coverage-v8` to devDependencies. Add `"test:coverage": "vitest run --coverage"` script. Add `coverage/` to `.gitignore`.
**Why:** "161/161 tests pass" tells you nothing about how much of the code those tests touch. I wrote 60 smoke tests in 30 minutes. They cover render paths and module exports. Most of the real branching logic — error paths, fallback modes, race conditions — is uncovered. You don't know that without numbers.
**Replaces:** the implicit assumption that file-count coverage equals semantic coverage. It doesn't.
**Tip from the field:** set CI to fail if coverage drops more than 1% between PRs. Don't gate on absolute %, gate on direction. Absolute thresholds either get set too low (useless) or too high (people delete tests to ship).

### A2 — GitHub Actions test workflow
**Add:** `.github/workflows/test.yml` running `npm ci && npm test && npm run a11y` on every push and PR. Matrix on Node 20 + Node 22.
**Why:** The snapshot-sort flake I caught only fires under parallel test load. On a developer's machine with a warm filesystem cache, both writes land on the same ms and the original-order tie-break hides it. On a cold CI runner, same. Locally it passed for me in isolation. **The only place this bug reliably reproduces is in a full parallel run on a clean tree.** That's CI. Without CI, this class of bug ships.
**Replaces:** trust. The current quality story is "the human runs the tests sometimes." That's not a story.
**Tip:** run tests with `--reporter=verbose --no-file-parallelism` once a week in a scheduled job. That's how you find the *next* snapshot-style flake before users do.

### A3 — Mutation testing (Stryker)
**Add:** `@stryker-mutator/core` + `@stryker-mutator/vitest-runner`. Config at `source/stryker.conf.json`. New script `"test:mutate": "stryker run"`.
**Why:** Most of my 60 new tests look like this: `render(<X />); expect(screen.getByRole('button')).toBeInTheDocument()`. A mutant that flips `&&` to `||` inside that component will not be caught by such a test. Stryker tells you that, file by file. The output is brutal and accurate.
**Replaces:** subjective confidence in test quality. Replaces "looks like a test" with "kills mutants."
**Tip:** don't run Stryker in CI on every PR — it's slow. Run weekly. Treat the mutation score per file as the real coverage number. Anything below 60% mutation score is a file that has tests in name only.

### A4 — `renderWithProviders` test helper
**Add:** `source/src/test/renderWithProviders.jsx` exporting a `render()` wrapper that mounts components with default theme context, vault context, toast context, and any other React context the app uses in real life.
**Why:** Three parallel subagents each invented their own provider stubs for components needing context. They're now inconsistent across 26 component test files. The day someone refactors a context provider, half the tests break for the wrong reason ("undefined is not a function") and the right reason (the component genuinely broke) is invisible in the noise.
**Replaces:** ad-hoc per-test provider mocking. Centralizes the "what does a JotFolio component need to mount" answer in one place.
**Tip:** when you build it, also export a `renderHook` variant. Cuts hook-test boilerplate by ~80%.

### A5 — Inventory generator script
**Add:** `source/scripts/generate-test-coverage.js`. Walks `src/`, `src-electron/`, `parsers/`, `plugins/`, `adapters/`. Cross-references against `*.test.*` files. Emits `TEST_COVERAGE.md`.
**Why:** The current `TEST_COVERAGE.md` is a snapshot of one moment. The next person who adds `features/calendar/Calendar.jsx` won't think to update it. Six months from now it'll be wrong and nobody will trust it. Generated docs stay accurate; hand-maintained docs rot.
**Replaces:** the file I wrote. Keep the format, drop the manual labor.
**Tip:** wire it as a pre-commit hook. If `TEST_COVERAGE.md` is out of sync with `src/`, commit blocked. That's how you keep documentation alive.

### A6 — At least one real semantic-search integration test
**Add:** `source/src/lib/semantic/__tests__/integration.test.js`. Loads the actual MiniLM model via `@xenova/transformers`. Tagged with `it.slow()` or behind `RUN_SLOW_TESTS=1`. Asserts an end-to-end embedding has expected dimensionality and that two semantically-similar inputs produce vectors with cosine > 0.5.
**Why:** My batch-B subagent mocked the entire ONNX runtime in `semantic/embed.test.js`. That means we have zero coverage of the actual model integration. The day `@xenova/transformers` ships a breaking change to its API, every mock-based test still passes and the app still ships broken. Mocks are useful, but you need at least one test that proves the real thing works.
**Replaces:** complete reliance on mocks for the AI subsystem.
**Tip:** run slow tests nightly, not per-PR. Tag them. Use `describe.runIf(process.env.RUN_SLOW_TESTS)`.

### A7 — Playwright visual regression
**Add:** screenshot assertions to existing Playwright a11y tests. One screenshot per critical view (workstation, notes editor, constellation). Diff against baseline in CI.
**Why:** Inline-styles + CSS variables means a one-char typo in `tokens.css` cascades silently across every component. No vitest test will catch a color regression. Visual regression will.
**Replaces:** the assumption that "renders without crash" means "looks right."
**Tip:** check baselines into Git LFS, not regular Git. Screenshots bloat the repo.

---

## EDIT

### E1 — Fix snapshot sort at source, not test
**File:** `source/src-electron/snapshots.js:121`
**Current:** `out.sort((a, b) => b.mtime - a.mtime);`
**Change to:** `out.sort((a, b) => (b.date.localeCompare(a.date)) || (b.mtime - a.mtime));`
**Why:** I stabilized the test by forcing explicit `utimes` on the snapshot files. That makes the test pass. It does not fix the bug. **In production, if two snapshots land in the same millisecond — which happens during burst saves — they sort by insertion order, and the user sees yesterday's snapshot above today's in the UI.** The date string is the snapshot's identity. Sort by it. Mtime is the tie-break.
**Replaces:** mtime-only sort. Keeps mtime as secondary so within-day snapshots still order correctly.
**Tip:** after this change, revert my `utimesSync` patch in `snapshots.test.js:50-55`. The test should pass without it. If it doesn't, the fix is wrong.

### E2 — Tighten the smoke tests
**Files:** all 26 component test files written by batch A.
**Current:** Most contain `render(...); expect(...).toBeInTheDocument()`. One interaction at most.
**Change to:** Per spec ("renders without crash + one interaction"), each should have:
- A render assertion against the *content* the component renders, not just its DOM presence.
- An interaction that mutates state, with an assertion that the state mutation was observable in the DOM.
- A negative-path assertion (component with missing/empty props renders gracefully, not "throws").
**Why:** A smoke test that says "the modal exists" doesn't catch the bug where the modal renders empty because a prop changed shape. Each component test should answer "what does this component do, and how do I tell?" — not "did `render()` return without throwing?"
**Replaces:** weak smoke tests with weak assertions. Same file count, real signal.
**Tip:** if you can't think of an interaction to test, the component is probably presentational and shouldn't have been on the list. Either prune it or test the parent that drives it.

### E3 — Move test setup into one place
**Files:** `source/src-electron/*.test.js` (7 files), each duplicates the `Module._load` hook.
**Change to:** Extract to `source/src-electron/__test__/electron-mock.js` exporting `installElectronMock()` + `restoreElectronMock()`. Each test calls them in `beforeAll`/`afterAll`.
**Why:** 7 files × ~10 lines of identical boilerplate = 70 lines of duplicated mock setup. The day someone changes the mock shape (adds a new electron API), you fix it in 7 places or miss one.
**Replaces:** copy-paste mocking with a helper.
**Tip:** while you're there, do the same for the `vi.mock('@xenova/transformers')` block currently duplicated between `semantic/embed.test.js` and `semantic/index.test.js`.

### E4 — Make `useVault.test.js` exercise the real failure modes
**File:** `source/src/features/vault/useVault.test.js`
**Why:** This is the hook that gates the entire vault adapter lifecycle. A bug here breaks the entire app on cold start. Current test (pre-existing, not mine) needs to cover: adapter swap mid-session, adapter failure on mount, race between two simultaneous `setVault()` calls.
**Replaces:** narrow happy-path coverage of the most important hook in the app.
**Tip:** when a hook owns a critical lifecycle, test it the way an integration test would — drive it through a series of state transitions and assert the side effects. Don't unit-test individual setters.

---

## REPLACE

### R1 — `Module._load` hooks → ESM electron tests
**Replace:** the `Module._load` interception in all 7 `src-electron/*.test.js` files.
**With:** Migrate `src-electron/` from `"type": "commonjs"` to `"type": "module"`. Update Electron entry to ESM (`main.js` → ESM exports). Use vitest's native `vi.mock('electron')` from there.
**Why:** Electron 28+ supports ESM main process. The repo is on Electron 41. The CJS choice is a legacy decision, and it's costing you mockability. The `Module._load` hack works but it's brittle — it depends on Node internals, and one of these days a Node minor will break it. The fix is the migration, not more hooks.
**Replaces:** brittle Node-internal mocking with idiomatic vitest mocking.
**Tip:** do the migration in one PR with no other changes. Conversions like this are bug magnets when bundled with feature work.

### R2 — Hand-maintained inventory → generated inventory
See A5. Replace the static `TEST_COVERAGE.md` with the output of the generator script. The generator runs in CI, fails the build if the inventory is stale.
**Replaces:** trust-based documentation with tooling-enforced documentation.

### R3 — `localStorage` test-setup → vault-state test-setup
**File:** `source/src/test-setup.js`
**Current:** Only clears `localStorage` between tests.
**Replace with:** A setup that also clears in-memory caches for any singleton (theme registry, plugin host, command registry). Most singletons in `src/lib/` leak state across tests if you don't reset them.
**Why:** I saw at least one batch report mention "pre-existing failures" that didn't reproduce in isolation. That's a textbook sign of shared singleton state. Test isolation is non-negotiable; right now isolation is partial.
**Replaces:** "good enough" test isolation with real isolation.
**Tip:** if you can't reset a singleton, that singleton is a design problem. Refactor it into a factory.

---

## REMOVE

### X1 — `dist-electron-testing/` and the side-by-side installer config (if no longer used)
**Files:** `source/dist-electron-testing/`, `source/electron-builder.testing.yml`, `npm run build:testing` script.
**Why:** Build artifacts in source control are a smell. If `build:testing` is still actively used for parallel-install testing, document it in README and add it to CI. If not, delete it. Nothing rots faster than dual build configs maintained "just in case."
**Verify before removing:** `git log --all -- electron-builder.testing.yml` to see last meaningful use. If older than 60 days and no open issues reference it, kill it.
**Replaces:** dual-build complexity with single-build clarity. Or, if kept, formal documentation of when to use it.

### X2 — Dead branches on origin
**Files:** branches `release/0.5.0-alpha.12`, `release/0.5.0-alpha.13`, `feature/templates-folders-alpha15`, `feature/template-backlinks-alpha16`.
**Why:** These are released or abandoned. Stale branches clutter `git branch -a` output and confuse anyone (including future-Claude) auditing the repo. Tag the release branches, then delete them.
**Tip:** Add a branch protection rule that auto-deletes merged feature branches. GitHub has this built in.

### X3 — Pre-existing failure reports in the subagent outputs
**Action:** None on disk, but for the record: two subagents reported "pre-existing failures" in files that the other subagent had just created. That's a race, not a finding. **Disregard those reports.** The only valid suite state is the final run after all three subagents finished: 1045/1045 green. Reports from mid-run are noise.
**Why call this out:** Future readers of the session log will see those "failures" mentioned and may chase ghosts. They aren't real.

---

## Tooling — the senior-engineer kit, in priority order

1. **`@vitest/coverage-v8`** — line/branch coverage. The single most useful metric you don't have.
2. **Stryker** — mutation testing. The truth-teller about test quality.
3. **Playwright + axe-core** — already installed. Wire it into `npm test`. You're 5 lines of config away from a11y enforcement on every commit.
4. **`@testing-library/user-event`** — verify it's used, not just `fireEvent`. `user-event` simulates real user behavior (focus, key sequences) and catches accessibility-adjacent bugs that `fireEvent.click` doesn't.
5. **MSW (Mock Service Worker)** — for `lib/ai/openrouter.js` and any future HTTP. `vi.mock('fetch')` is a hack; MSW is the right shape.
6. **`vitest --ui`** — interactive runner. When you're debugging a single failing test, this saves you a thousand reruns.
7. **`vitest bench`** — already supported. Benchmark the hot paths (parser, search, semantic index) and assert no regression. You have a `bench/` directory; use vitest's native bench API for in-suite perf gates.
8. **`tinyspy` or `vi.spyOn` everywhere** — replace any `console.log`-as-debugging-tool with proper spies. Spies fail loudly; logs are noise.
9. **GitHub Actions matrix:** test on Node 20 + 22, Electron stable + beta. Catches version-skew bugs before users do.
10. **Renovate** — keep dependencies current. Stale deps are slow-burn bugs.

---

## What the inventory hides

The shape of the truth:

- **Tests written by me:** 60. Most are smoke tests. Honest mutation score: probably 20–35%.
- **Tests written before me:** 96 files, mature, generally strong. Honest mutation score: probably 50–70%.
- **Real line coverage of the codebase:** unknown until you wire A1. My guess: 55–65%.
- **Real branch coverage:** lower. Guess: 35–50%. Edge cases are where smoke tests die.
- **Real critical-path coverage (paths a user actually hits):** likely high (workstation, notes, constellation are well-tested). The risk is in the long tail — adapters, electron lifecycle, plugin sandbox, semantic indexing.

**If you only do one thing from this doc:** A1 + A2. Get coverage numbers in CI. Then you'll know where to put the next ten hours of test work, instead of guessing.

---

## What's next if you keep the same energy

1. Run A1 today. Get the coverage number. Add it to the README badge.
2. Wire A2 this week. Make the green build mean something.
3. Run A3 in a quiet hour. Read the report. You will be unhappy. That's the point.
4. Pick the five files with the worst mutation score and rewrite their tests properly.
5. Do E1 + E3 in one PR.
6. Do R1 in its own PR, no other changes.
7. Schedule a quarterly review of `TEST_COVERAGE.md` (or the generated version). Drift is inevitable. Catch it on a clock.

The 161/161 number is real. The work it represents is real. The work it doesn't represent — coverage depth, mutation resistance, CI enforcement, the slow tests — is real too, and it's the gap between "we have tests" and "we have a quality bar." Close that gap.
