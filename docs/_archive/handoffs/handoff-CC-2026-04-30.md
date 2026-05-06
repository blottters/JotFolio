# CC handoff — 2026-04-30

Pickup-where-we-left-off doc for the next Claude Code session. Memory files cover the rest — this is the working-state diff.

## Repo state (canonical paths)

- **Source:** `C:\Dev\Projects\JotFolio` (NOT the OneDrive `.lnk`)
- **Vault (live app data):** `C:\Users\gavin\OneDrive\Documents\JotFolio Vault\`
- **Symlink:** `C:\Dev\Coding Agents\jotfolio` → `C:\Dev\Projects\JotFolio` (works both ways)
- **Repo:** github.com/blottters/JotFolio (PUBLIC again as of 2026-04-30)
- **Branch state:**
  - `master` → includes the prerelease work that now rolls up under the alpha.11 line
  - `feat/keyword-library` → already merged into master (PR #1 landing)
  - `main` (default branch on GitHub) → only `Initial commit`, divergent — needs sync or restore master-as-default

## Last shipped

- **`v0.5.0-alpha.11`** → aligned prerelease tag/version line
- Includes: Keyword Library Phase 1 + 1.5 + 1.6 + 1.7, path cleanup, project CLAUDE.md, slop-prep work
- Tests: 424/424 green
- Build: clean

## Phase 1 status (Keyword Library)

✅ Layer 1 done — rules engine + Settings UI + save-flow integration + Re-scan vault button

Files added:
- `source/src/lib/keywordRules/{parseRules,applyRules,rulesStorage,optOutTracker,useKeywordRules}.js` + tests
- `source/src/features/settings/KeywordRulesPanel.jsx`

Files modified: `App.jsx` (823 lines, hook-extracted), `SettingsPanel.jsx`

## Active brainstorm threads

1. **MiniLM Phase 2** — concept locked, no plan written. Three flagship features: universal semantic search, smart wikilink suggestions while typing, similar-notes panel. Plus 13 other unlocks queued.
2. **Founder-trained Personalized Classifier (HF AutoTrain)** — idea note saved at `vault/notes/personalized-classifier-autotrain.md`. v0.7 territory.
3. **Cosmography 4-level Constellation** — image prompt generated, awaiting Gavin's image-gen output + design call.
4. **Authored Constellations (Expeditions)** — image prompt generated, Gavin doing mockup himself.
5. **Karpathy Wiki layer revival** — feature flag off currently, my recommend = revive (raw → wiki compile pattern compounds with MiniLM features).
6. **Workshop / Library dual-mode shell** — UI restructure deferred, may pair with Phase 2 ship.

## Open decisions

- Phase 2 plan timing — write now or after `--warn` token sweep?
- Karpathy Wiki revive vs rip
- App icon / brand mark (still default Electron atom)
- main vs master branch — restore master as default OR migrate to main

## Last orchestration

Session ran 9 subagents end-to-end:
- Phase 1A: Parser Patty, Apply Andy, Storage Stan, OptOut Olive (parallel pure-function builds)
- Phase 1C: UI Ursula, Wire Wally, Backfill Bertha (serial UI + integration)
- Phase 1D: Reality Checker, Pen-Tester Pete, Slop Sniffer (parallel adversarial review — Pete caught 3 silent-correctness bugs, all fixed inline)
- Phase 1.5: Flag-Check Frank, Error-Path Edna, Dead-Code Dexter, Validator Val (parallel soft-fix sweep)
- Phase 1.6: Hook Hannah (extracted useKeywordRules → App.jsx 989 → 823)
- Phase 1.7: UX Polish Polly (Re-scan button entry count + inline confirm)
- Path cleanup: Plumber Pat (saved AppData from inode-aliased deletion), Doc Drafter, Memory Janitor
- Audit chain: CLI Inventory Cal, Desktop Inventory Dani, Diff Dan
- Alignment fixes: MCP Porter Mort, Config Cleaner Carl

## MCP / skills alignment ops landed today

- Project-level `.mcp.json` at `C:\Dev\Coding Agents\.mcp.json` adds `windows-mcp` + `pdf-tools` to CLI sessions
- `slop-judge` plugin now in enabledPlugins map
- 3 user-level slop-judge agent dupes deleted (backup at `C:\Dev\Backups\agents-cleanup-2026-04-30\`)
- `sandbox-bypass` skill repaired
- `reprune-marketplace.ps1` annotated as manual-run-only

## Next CC session checklist

1. Read `MEMORY.md` index — 7 new feedback memories landed today
2. Confirm CI current prerelease published successfully (https://github.com/blottters/JotFolio/releases)
3. Verify auto-update fires on Gavin's installed alpha.7 binary (15-min poll cycle)
4. Decide on next: Phase 2 plan vs `--warn` token sweep vs Karpathy revive
5. If MCP tools `mcp__windows-mcp__*` + `mcp__pdf-tools__*` listed in deferred-tools → trust prompt was approved; otherwise prompt Gavin to approve

## Caveman lock

User locked **caveman ULTRA** 2026-04-30. Persists across turns + propagates into every subagent dispatch. See `feedback_caveman_ultra_locked.md`. Off only for "stop caveman" / "normal mode" / explicit level switch / auto-clarity scenarios.

## Memory files added today

- `feedback_terse_default.md` (already existed, see memory)
- `feedback_prototype_vs_production.md`
- `vibecoded_audit_framework.md`
- `feedback_ai_slop_prevention_practices.md`
- `feedback_no_time_estimates.md`
- `feedback_concrete_rules_only.md`
- `feedback_filesystem_mutation_verification.md`
- `feedback_keep_orchestrating.md`
- `feedback_caveman_ultra_locked.md`
- `user_pc_not_laptop.md`
- `slatevault_vibe_prompt.md` (amended w/ telemetry exception)
- `jotfolio_keyword_library_planned.md`
- `session_2026-04-28_jotfolio_alpha8_prep.md`

Read `MEMORY.md` for the full index.
