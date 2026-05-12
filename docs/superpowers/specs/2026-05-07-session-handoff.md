# JotFolio session handoff — 2026-05-07

> **For:** the next Claude Code session picking this up. Self-contained.
> **Read this whole file before responding to anything.**

## What just happened (this session, condensed)

Three alphas shipped today (5/6 → 5/7), all via subagent armies + standard release flow:

| Alpha | Date | Scope | How it shipped |
|---|---|---|---|
| **0.5.0-alpha.21** | 2026-05-06 | Borrowed 3 LFE ideas: `CONTEXT.md` + `AI_AGENT_GUIDE.md` at repo root, `CHANGELOG-archive.md` rolling window | Manual w/ subagents |
| **0.5.0-alpha.22** | 2026-05-06 | Repo hygiene cleanup — 6 parallel subagents (phantom slayer / plans consolidator / archive archivist / patch notes liquidator / mockup unifier / session extract triager). Killed 3 phantom root files, merged 3 plans folders, archived 6 stale docs, killed PATCH_NOTES.md, collapsed mockup folders | Manual w/ subagent army |
| **0.5.0-alpha.25** | 2026-05-07 | Ripped Git Sync stub + added vault zip export. Pure-JS PKZip STORE builder, zero new npm deps, 9 new tests (637/637 cumulative) | **First autonomous Cron-fired ship.** 3 parallel subagents (gravedigger / zip wrangler / settings smith), integrator pass + release flow done by the cron-fired session itself while Gavin showered. |

## Current state

- **Master HEAD:** `9ac9d2e release: 0.5.0-alpha.22 — repo hygiene cleanup (#24)` on origin
  - Local master may be ahead by 1 commit with the alpha.25 pre-squash version. **Run `git fetch origin master && git reset --hard origin/master` before starting any new work** — same divergence pattern that hits every release here.
- **Source/package.json version:** `0.5.0-alpha.25` (will match origin/master once alpha.25 is squash-merged on remote — verify with `git log --oneline origin/master -3`).
- **Latest GitHub Release:** `v0.5.0-alpha.25` at https://github.com/blottters/JotFolio/releases/tag/v0.5.0-alpha.25 (prerelease, installer + blockmap + latest.yml present).
- **Tests:** 637 / 637 passing.
- **Build:** clean. Bundle ~695 KB main / ~200 KB gzip.

## Repo + tooling map

| Concern | Location |
|---|---|
| **Code** | `C:\Dev\Projects\JotFolio` |
| **Workspace (this dir)** | `C:\Dev\Coding Agents` |
| **Repo URL** | `https://github.com/blottters/JotFolio` (capital J, capital F — case matters) |
| **Discoverability** | `CONTEXT.md` + `AI_AGENT_GUIDE.md` at repo root — **ALWAYS READ THESE FIRST** |
| **Active design specs** | `docs/superpowers/specs/2026-05-*-*-design.md` |
| **Architecture doc** | `docs/karpathy-llm-wiki-handoff.md` (load-bearing, the Karpathy LLM Wiki direction) |
| **Recent CHANGELOG** | `docs/CHANGELOG.md` (last 7 alphas, ~145 lines) |
| **Older CHANGELOG** | `docs/CHANGELOG-archive.md` (pre-alpha.14) |
| **Project-level memory** | `C:\Users\gavin\.claude\projects\C--Dev-Projects-JotFolio\memory\` |
| **Workspace memory** | `C:\Users\gavin\.claude\projects\C--Dev-Coding-Agents\memory\MEMORY.md` |
| **Global instructions** | `C:\Users\gavin\.claude\CLAUDE.md` |
| **Dev server config** | `source/.claude/launch.json` (port 5174). Use Claude Preview MCP, not Bash, to start. |

## Roadmap state — where we are toward beta

The 25-step roadmap from this session is in chat history (now cleared). Reduced version, ordered:

### Critical path to beta (must ship)

1. **alpha.23 — onboarding redesign.** Multi-step welcome flow: vault picker → sample-vault offer → first-entry walkthrough → Constellation tour → Settings tour. **Needs Gavin's design input.** Brainstorming skill is the right entry point. NOT done.
2. **alpha.24 — bundle code-split.** Lazy-load Constellation, Editor, Settings, modals, plugin worker. Target <400 KB initial bundle. **Mechanical, can autoship via subagents.** NOT done.
3. ~~alpha.25 — rip Git Sync~~ DONE this session.
4. **alpha.26 — a11y pass.** NVDA + Narrator + 200% + 400% zoom + keyboard-only. **Needs Gavin's ears for screen reader walkthrough.** NOT done.
5. **alpha.27 — brand + signing cert.** Real favicon, app icon set, SignPath OSS cert wired into CI. **Blocked on SignPath OSS approval (Gavin must apply if he hasn't).**
6. **alpha.28 — cross-platform** (OPTIONAL — recommend skipping for first beta, ship Windows-only first). macOS + Linux installers. Needs Apple Developer ID ($99/yr) for macOS.
7. **alpha.29 — vault format freeze + final dep upgrade.** Last alpha before beta gate.
8. **beta.1 → beta.5** — bugfix-only soak cycle.
9. **v0.5.0** — 14 days zero P0/P1 in beta = green light to drop prerelease tag.

### Optional / deferred

- Karpathy Phase 6 (Context Packs) → push to v0.6
- Karpathy Phase 7 (Agent governance) → v0.6
- MiniLM Phase 2 (semantic search) → v0.7
- Cross-platform → v0.6 if not done by beta

### Async human-only items

- **SignPath OSS application** at https://about.signpath.io/foundation. Free for OSS. Days-to-weeks approval. Blocks alpha.27.
- **Brand mark sketch** — needs Gavin's visual decision, blocks alpha.27 favicon.
- **Beta tester recruitment** — open GitHub Discussions, post on r/Obsidian / r/PKMS / r/SelfHosted.
- **Apple Developer ID** ($99/yr) — only if shipping macOS in alpha.28.

## Standard release flow (this is THE pattern)

For every alpha:

1. Write design spec under `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md`.
2. Dispatch parallel subagents on **disjoint file paths** (per `pattern_parallel_subagent_dispatch.md` in agent memory).
3. Each subagent gets: caveman directive + file paths + acceptance criteria + fun nickname (per `feedback_subagent_nicknames.md`).
4. Verify each subagent's output independently.
5. Integrator pass (you do this — touches shared files).
6. `npm test` in `source/` — must stay green.
7. `npm run build` — must exit clean.
8. Visual smoke via Claude Preview if observable.
9. Bump `source/package.json` + `source/package-lock.json` to next alpha.
10. Add `## [<version>] — <date>` section to `docs/CHANGELOG.md`.
11. Commit, tag `v<version>`, push tag (CI builds installer), push commits to `release/<version>` branch.
12. Open PR via `gh pr create`.
13. Poll CI for green (max 12 min).
14. Resolve any CodeQL review threads.
15. Admin-merge squash + delete branch.
16. Mark GitHub Release prerelease (`gh release edit <tag> --prerelease`).
17. Verify auto-update will land on installed binary (~15 min poll cycle).

## Known divergence pattern (you WILL hit this)

After pushing alpha.X and opening PR, the PR may show `CONFLICTING` because previous releases were squash-merged on origin/master while local master has individual commits. Fix:

```bash
cd "C:/Dev/Projects/JotFolio"
git fetch origin master
git reset --soft origin/master      # keep changes staged, drop divergent history
git status --short                  # verify only intended deltas present
git commit -m "release: 0.5.0-alpha.X — <slug>"
git push --force-with-lease origin master:refs/heads/release/0.5.0-alpha.X
```

Then re-poll PR. Should now be `MERGEABLE`.

## Subagent dispatch pattern

Working pattern verified across alpha.17 (4+5 subagents), alpha.19 (3), alpha.22 (6), alpha.25 (3 autonomous):

- **Single message, multiple Agent tool calls** — they fire in parallel.
- Each subagent prompt is **fully self-contained** — assume zero shared context.
- Caveman directive at top of each prompt (mandatory per `feedback_caveman_ultra_locked.md`).
- Fun nicknames riffing on the job (per memory rule).
- File-path scoping prevents conflicts.
- Acceptance gates ("test count must equal X", "must pass `npx vitest run <path>`") for verification.
- Integrator (you) handles shared files (App.jsx, ConstellationView.jsx, etc.) — never let two subagents touch the same file.

## Autonomous-ship pattern (alpha.25 proved it works)

For mechanical alphas with no design choice (alpha.25 was rip-git-sync + zip export):

1. Write a self-contained handoff doc at `docs/superpowers/specs/YYYY-MM-DD-alpha-X-autonomous-execution.md`. Include: mission, scope, build order, verification gates, hard-stop conditions, divergence pattern playbook, acceptance summary, logging requirement.
2. Set up redundant audit logs at:
   - Desktop: `C:\Users\gavin\OneDrive\Desktop\JotFolio-alpha-X-automation-log.md`
   - Project memory: `C:\Users\gavin\.claude\projects\C--Dev-Projects-JotFolio\memory\alpha-X-automation-log.md`
3. Use `CronCreate` with the prompt instructing the future session to read the handoff + execute. NB: `durable=true` flag is currently NOT honored — Cron is session-only. Keep CC Electron open during run.
4. Pick fire time avoiding `:00` and `:30` minutes (per CronCreate rules).
5. Hard rules in the handoff: don't ship if tests fail, don't add new heavy npm deps, don't skip prerelease flag, don't chain other alphas.

When the cron fires, the autonomous session reads handoff → reads `CONTEXT.md` + `AI_AGENT_GUIDE.md` → dispatches subagents → integrates → ships → writes status doc → exits.

**alpha.25 ran in 21 minutes end-to-end.** First time JotFolio shipped without human at keyboard.

## Voice / register

**CAVEMAN MODE FULL ACTIVE** per session header. Always:
- Drop articles (a/an/the), filler (just/really/basically), pleasantries (sure/of course), hedging.
- Fragments OK. Short synonyms.
- Code blocks unchanged. Errors quoted exact.
- Pattern: `[thing] [action] [reason]. [next step].`
- Off only for: security warnings, irreversible action confirmations, multi-step sequences where fragment order risks misread, user asks to clarify or repeats question.

**Approval verbs (`go`, `do it`, `whatever you recommend`) → proceed.** Don't re-confirm.

**Self-deprecation (`I'm an idiot`)** = he caught his own mistake. Move forward, no reassurance.

**Banned phrases:** "Great question", "Absolutely", "That's a great idea". Don't preamble. Don't pad.

## Charter rules (binding — don't violate)

From `CONTEXT.md` § Charter rules:
- No external CDN, font, or script in any output.
- No AI/analytics in shipped product (telemetry opt-in only, single charter exception).
- Local-first. Plain-text durable. Frontmatter is YAML.
- Inline styles + CSS variables only. Square corners (Victory `--rd: 0`).
- JSX, not TSX.
- 1800-line soft cap per file. App.jsx grandfathered.
- Hidden features stay behind feature flags until the engine that backs them ships. **No UI without engine.**
- Don't claim a stub is shipped. Don't claim a mockup is production.

## What's currently dark / unfinished

- **Karpathy Phase 4 compile lib** — shipped behind `wiki_mode` flag, lib-only, pure functions. No UI consumer (the "Compile to memory" button uses deterministic stub, not LLM).
- **Karpathy Phase 5 memory graph node UI** — shipped behind `wiki_mode` flag. UI exists, paths through ConstellationView, alpha.18 wired the basics.
- **Phase 6 (Context Packs)** — mockup at `docs/mockups/context-memory-concept.html`. Not implemented.
- **Phase 7 (agent governance)** — not started.
- **AI plumbing** — `aiComplete()` in `lib/ai/providers.js`. ONLY consumer in shipped UI is Settings → AI "Test connection" button. No real AI feature is shipped.

## Memory files for context

Most useful entries in `~/.claude/projects/C--Dev-Coding-Agents/memory/MEMORY.md`:

- `feedback_destructive_op_boundary.md` — concrete list of what auto-runs vs what needs confirm
- `feedback_always_execute_fixes.md` — diagnosis approval = execution approval
- `feedback_keep_orchestrating.md` — once Gavin says go, don't stop for menu-style questions
- `feedback_subagent_nicknames.md` — every subagent gets a fun nickname
- `pattern_parallel_subagent_dispatch.md` — parallel pattern documented
- `feedback_caveman_ultra_locked.md` — caveman persists + propagates to subagents
- `feedback_terse_default.md` — short answer first, ask before elaborating
- `feedback_concrete_rules_only.md` — every directive needs syntax-level trigger + violation example

Project-level memory at `~/.claude/projects/C--Dev-Projects-JotFolio/memory/`:
- `alpha-25-automation-log.md` — last autonomous run

## Active session state at handoff

- **Caveman mode:** FULL
- **Dev server:** running at http://localhost:5174 via Claude Preview MCP (`mcp__Claude_Preview__preview_start` with config `jotfolio`)
- **Server ID (this session — may be stale):** `fd81164d-10ed-4dcb-957a-0cacb82cf659`
- **Last conversation thread before handoff:** Gavin asked for a live AI demo. Concluded: no shipped feature actually invokes AI beyond Settings → AI "Test connection" button. Offered options A/B/C/D. No selection made before this handoff request.
- **Cron jobs scheduled:** none currently. (Earlier `1b15b906` already fired and completed alpha.25 ship.)

## What to do first in a fresh session

1. **Read** `CONTEXT.md` + `AI_AGENT_GUIDE.md` at the JotFolio repo root. They exist for this exact reason.
2. **Read this handoff doc** if you haven't already (you're reading it now).
3. **Sync local to origin:** `cd "C:/Dev/Projects/JotFolio" && git fetch origin master && git reset --hard origin/master`.
4. **Confirm state:** `git log --oneline -3` should show alpha.25 (and possibly alpha.22 squash) at HEAD. Tests should be 637 if you run them.
5. **Pick next focus.** Most likely options:
   - **alpha.23 onboarding redesign** — needs Gavin's design input. Use brainstorming skill to talk through scope.
   - **alpha.24 bundle code-split** — mechanical. Can autoship via subagents.
   - **alpha.26 a11y pass** — needs Gavin's ears for NVDA/Narrator. Spec it out, hand the human steps to him.
   - **Async humans:** check whether Gavin has applied to SignPath OSS / sketched a brand mark / opened beta-tester Discussions.
6. **If Gavin asks for a live AI demo again,** the answer is still: only test-connection is wired. Offer to build a tiny "Summarize note" feature as alpha.X if a real AI demo is required.

## Don't do these

- Don't claim a feature works without verifying live.
- Don't `git push --force` to master directly. Always go via `release/<version>` branch + PR.
- Don't skip the `--prerelease` flag on alpha tags.
- Don't change vault format. Don't touch frontmatter schema. Vault format is being frozen at alpha.29.
- Don't ship alpha.X+1 if alpha.X has open P0/P1 issues.
- Don't ask Gavin questions you can answer by reading `CONTEXT.md` / `AI_AGENT_GUIDE.md` / `CHANGELOG.md`.
- Don't preamble. Don't pad. Caveman mode FULL.
- Don't add npm deps without explicit approval.
- Don't mix framework surface (`docs/`, `CLAUDE.md`, `CONTEXT.md`, `AI_AGENT_GUIDE.md`) and product code (`source/`).

## Where this handoff lives

- **Primary (this file):** `C:\Users\gavin\OneDrive\Desktop\JotFolio-handoff-2026-05-07.md` (Desktop, OneDrive-backed)
- **Mirror in repo:** `C:\Dev\Projects\JotFolio\docs\superpowers\specs\2026-05-07-session-handoff.md` (will be created next)

When the next session opens, paste either path or the contents into Claude Code. Or just say "read `JotFolio-handoff-2026-05-07.md` on Desktop" — Claude will know what to do.

---

*End of handoff. Cron jobs cleared. Dev server still running on 5174. Last commit on local master: alpha.25 release. Auto-update on installed binary will pull alpha.25 within the next 15-min poll if it hasn't already.*
