# Verification report — TEST_COVERAGE.md
Generated: 2026-05-16

Method: full vitest suite run (`cd source && npx vitest run`) plus per-file content audit
of every test path cited in TEST_COVERAGE.md. No source files modified.

## Summary
- Total rows: 161
- Unique test file paths on disk: 154
- Vitest full-suite result: **154 files / 1045 tests passing, exit 0**
- Rows with FAIL: **0**
- Rows with WEAK (smoke-only or fail-soft): **5**
- Rows fully verified (file exists + test passes + meaningful assertions): 156 of 161

## FAIL — Check 1 (file missing)

None. Every test path cited in TEST_COVERAGE.md exists on disk.

The only "near miss" worth flagging: row 43 ("Settings panel") cites the test as
`source/src/features/settings/SettingsPanel.test.jsx + safety`. The "safety"
shorthand refers to `SettingsPanel.safety.test.js` (note: `.js`, not `.jsx`).
Both files exist; no FAIL.

| Row # | Feature | Cited test file | Reason |
|---|---|---|---|
| — | — | — | — |

## FAIL — Check 2 (test fails in isolation)

None. Full vitest suite runs green:

```
Test Files  154 passed (154)
     Tests  1045 passed (1045)
  Duration  44.86s
```

Stderr noise during the run (not failures, but worth listing — see "stderr noise"
section at the end):
- `CommandCenterView.test.jsx` — one `act(...)` warning
- `VaultPicker.test.jsx` — two `act(...)` warnings
- `PluginHost.test.js` — intentional plugin-crash log from negative test
- `storage.test.js` — intentional corrupt-JSON log from quarantine test

| Row # | Feature | Test file | Vitest output excerpt |
|---|---|---|---|
| — | — | — | — |

## FAIL — Check 3 (placeholder/tautology assertion)

None at the file level. One **`it()` block** inside an otherwise-real file
contains a tautology, but the other 7 `it()` blocks in the same file assert
real behavior, so the file as a whole passes Check 3:

| Row # | Feature | Test file | Offending pattern | Line |
|---|---|---|---|---|
| 147 | Electron main process | `source/src-electron/main.test.js` | `expect(true).toBe(true)` (placeholder body in `it('loads without throwing under a mocked electron module')`) | 63 |

Note this is **not** a Check 3 FAIL because (a) the same file has 7 other `it()`
blocks that assert real channel/handler wiring, (b) the comment on line 62
documents the intent ("If require above threw, beforeAll would surface it"), and
(c) the next `it()` immediately asserts that all IPC handlers were registered.
Flagging here for visibility only.

Scan results that produced zero hits:
- No `expect(1).toBe(1)` / `expect(0).toBe(0)` anywhere in `source/src`
- No `it.skip(`, `it.todo(`, `xit(`, `xdescribe(`, `test.skip(`,
  `describe.skip(` anywhere in `source/src` or `source/src-electron`
- No `describe`/`it` block found with zero `expect(` calls (manual scan of
  every test file)

## WEAK — Smoke-only (passes, exists, no behavior assert)

These 5 rows pass and the cited files exist, but the tests are either shape-only,
self-implementing the algorithm under test, or the file is so minimal it does
not exercise the production code in a meaningful way. Each is described below.

| Row # | Feature | Test file | What it tests | Why weak |
|---|---|---|---|---|
| 91 | useKeywordRules hook | `source/src/lib/keywordRules/useKeywordRules.test.js` | Hook exports a function, takes 1 arg, return shape has 5 documented keys | File header literally states: *"We don't try to exercise the full runtime behavior end-to-end here — the underlying pure modules have their own dedicated test files (419+ tests) that cover algorithm correctness. This file just verifies the hook's public surface area is intact."* 5/5 `it()` blocks are `typeof === 'function'` / `toHaveProperty` / `toEqual({rules:[]})` shape checks. Zero behavior tests. |
| 113 | Snapshot retention | `source/src/lib/snapshotRetention.test.js` | A locally-defined `pickRetained()` function | The cited source file `source/src/lib/snapshotRetention` does **not exist on disk**. The retention logic actually lives in `source/src-electron/snapshots.js` (`prune()` function). The test file inlines its own copy of the retention algorithm at lines 8–27 (`function pickRetained(dates, today)`) and tests that copy instead of the real production code. Comment on line 2 admits: *"Main fs interaction tested manually per src-electron/README.md."* Algorithm regressions in `snapshots.js prune()` would not be caught by this test. |
| 161 | Test harness setup | `source/src/test-setup.js` → `source/src/test-setup.test.js` | localStorage round-trip in jsdom | Entire file is 8 lines, single `it()`: writes `'v'` to `localStorage` and reads it back. Verifies the jsdom test environment is configured, not anything about `test-setup.js` itself. Acceptable as a sentinel, but provides no coverage of `test-setup.js`. |
| 24 | Constellation components | `source/src/features/constellation/__tests__/components.test.js` | A locally-defined `computeComponents()` BFS | File header (lines 1–8) admits: *"The grouping logic belongs to `ConstellationView.jsx` inline, but the algorithm is pure and testable. We re-implement the same shape here so the test asserts the expected result against hand-constructed pools."* The test defines its own `computeComponents` at lines 11–42 and exercises that, not the real BFS code inside `ConstellationView.jsx`. If the inline BFS drifts, this test stays green. |
| 72 | Compile index | `source/src/lib/compile/index.test.js` | Barrel re-exports + EMPTY_MANIFEST is JSON-roundtrippable | 2/2 `it()` blocks. First just iterates 11 export names and calls `toBeDefined()` on each — proves the barrel file doesn't drop exports, but tests no behavior. Second JSON-round-trips `EMPTY_MANIFEST`. Behavior is tested in the individual `compile.test.js`, `manifest.test.js`, `hash.test.js` and `deterministicStub.test.js` files (rows 71, 73, 74, 75), so coverage is not absent from the codebase — just absent from this row's test. |

### Borderline cases reviewed but not flagged WEAK

- **Row 14 (builtinCommands)** — Has a `typeof dispose === 'function'` check, but the same `it()` also calls `dispose()` and asserts `cmds.length === 0`. Real behavior.
- **Row 104 (wordCount plugin entry)** — First `it()` is shape-only (`expect(typeof activate).toBe('function')`), but the second `it()` calls `activate()` and asserts the toast string. Adequate.
- **Row 121 (theme registry)** — Mix of shape (`Array.isArray(FONTS)`) and contract (`getThemeContractIssues()).toEqual([])`). The contract check is a real assertion.
- **Row 30 (dropdown bus)** — One `it()` asserts `_dropdownBus instanceof EventTarget` (shape), but the rest of the file tests `useSingleOpenDropdown` and `useClickOutside` behavior.
- **Row 140 (Plugin event bus)** — Has a final shape assertion (`appBus instanceof EventBus`), but the 6 prior `it()` blocks test on/emit/clear/unsubscribe behavior thoroughly.
- **Row 131 (VaultAdapter)** — Two `it()` blocks, second includes `typeof off === 'function'`, but both also verify the base-class throws semantics. Real contract test.
- **Row 130 (preload), Row 145 (pluginWorker), Row 153 (updater)** — Mix shape checks (`expect(typeof exposed.vault.read).toBe('function')`) with real behavior tests (IPC routing, message handling, event wiring). Adequate.
- **Row 1 / Row 2 mocking** — `App.notesEditor.test.jsx`, `App.workstation.test.jsx`, `AppRouteContent.*.test.jsx` mock `useVault` and the adapter wholesale. Tests verify the render shell + routing, not vault behavior. This is the right boundary for shell tests — real adapter is tested separately.

## Per-row file existence summary

All 161 rows resolved to existing files. Multi-file rows (`X + Y` syntax)
all verified:

| Row | Files | All exist? |
|---|---|---|
| 1 | `App.notesEditor.test.jsx`, `App.workstation.test.jsx` | yes |
| 2 | `AppRouteContent.ai.test.jsx`, `.notes.test.jsx`, `.notesEditor.regression.test.jsx` | yes |
| 33 | `NotesWorkspaceView.test.jsx`, `NotesWorkspaceView.regression.test.jsx` | yes |
| 43 | `SettingsPanel.test.jsx`, `SettingsPanel.safety.test.js` | yes (note: safety variant is `.js`) |
| 92 | `__tests__/markdownUrl.test.js`, `security/__tests__/hardening.test.js` | yes |
| 139 | `security/__tests__/hardening.test.js` (also row 92, 141) | yes |
| 141 | `security/__tests__/hardening.test.js` (also row 92, 139) | yes |

Rows 97–102 (parser sub-modules) all point to a single file
`source/src/lib/parser/parser.test.js` — exists, 8371 bytes, covers all six
sub-modules (blocks, codeMask, embeds, headings, tags, wikilinks) in one suite.

## stderr noise during full suite (Check 2 soft signal)

Vitest emitted 4 stderr blocks during the run. All passing — flagged here per
the task's "real-bug noise" rule:

| Test file | Test | Stderr content | Category |
|---|---|---|---|
| `src/features/workstation/CommandCenterView.test.jsx` | "makes mode panels interactive instead of static mockups" | "An update to CommandCenterView inside a test was not wrapped in act(...)" | Real-bug noise — React state update outside act() |
| `src/features/vault/VaultPicker.test.jsx` | "invokes onPick when the pick button is clicked" | "An update to VaultPicker inside a test was not wrapped in act(...)" (×2) | Real-bug noise — React state update outside act() |
| `src/plugins/__tests__/PluginHost.test.js` | "crashing plugin code marks status=failed" | `PluginHost: plugin "test-plugin" crashed: Error: boom` | Expected — this test deliberately crashes a plugin to verify the error path |
| `src/lib/storage.test.js` | "quarantines corrupt values and blocks overwrite of the original key" | `storage: corrupt value for mgn-e SyntaxError: ...` | Expected — this test deliberately seeds corrupt JSON to verify quarantine |

The two `act(...)` warnings are real bugs worth fixing (or wrapping the
offending interactions) but do not cause the tests to fail today.

## Tautology scan results (Check 3 raw output)

- `expect(true).toBe(true)`: **1 match** — `src-electron/main.test.js:63`
  (described above; not a file-level FAIL because 7 other `it()` blocks in
  the same file assert real handler registration and IPC routing).
- `expect(1).toBe(1)`: **0 matches**
- `expect(0).toBe(0)`: **0 matches**
- `it.skip(` / `it.todo(` / `xit(` / `xdescribe(` / `test.skip(`: **0 matches**
  across `source/src` and `source/src-electron`.

## Smoke-shape scan results (`expect(typeof X).toBe('function')`)

- 6 files in `source/src` use this pattern: `EventBus.test.js`,
  `VaultAdapter.test.js`, `wordCount.test.js`, `builtinCommands.test.js`,
  `useKeywordRules.test.js`, `pluginHost.test.js`.
- 5 files in `source/src-electron` use it: `snapshots.test.js`,
  `preload.test.js`, `updater.test.js`, `telemetry.test.js`, `menus.test.js`.

Of these 11, only `useKeywordRules.test.js` (row 91) is **shape-only**. The
other 10 use shape checks as a starter assertion before testing real behavior.

## Notes for the maintainer

1. **Row 113 (snapshotRetention)** is the most concerning of the WEAK five.
   The cited source path doesn't exist; production retention code is in
   `source/src-electron/snapshots.js prune()`. Either:
   - Move the retention algorithm into the `source/src/lib/snapshotRetention.js`
     file the row claims, and have both the test and `snapshots.js` import it; OR
   - Update the test to actually import and exercise `snapshots.js prune()`; OR
   - Update TEST_COVERAGE.md to clarify the row tests a hand-rolled copy of the
     algorithm, not production code.
2. **Row 24 (constellation components)** has the same shape — the BFS lives
   inline in `ConstellationView.jsx`, and the test self-implements a copy.
   Either extract the BFS to a pure module or import it explicitly from
   `ConstellationView.jsx` so the test exercises real code.
3. **Row 91 (useKeywordRules)** explicitly defers behavior coverage to the
   four pure-module rows (87–90), which are robust. The current shape-only
   test is defensible but should be flagged in TEST_COVERAGE.md as
   "shape-only" rather than asserted as passing.
4. **Row 161 (test-setup)** is a sentinel for the jsdom environment, not a
   test of `test-setup.js` itself. Consider renaming to `jsdom-env.test.js`
   so the file name reflects intent.
5. **Row 147 (Electron main)** — the placeholder `expect(true).toBe(true)`
   at line 63 should be deleted or replaced with `expect(ipcHandlers.size).toBeGreaterThan(0)`
   so the assertion is meaningful.

Rows requiring attention: 0 + 5 = 5. All others pass all three checks.
