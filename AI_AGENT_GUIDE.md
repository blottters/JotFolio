# AI Agent Guide — JotFolio

> Six questions every AI agent (or new contributor) asks at session start. Each answer lives in a single file. Look up the answer; don't guess.

## The six questions

| # | Question | Where the answer lives |
|---|---|---|
| 1 | **Who am I?** What persona / contract am I operating under? | [`CLAUDE.md`](./CLAUDE.md) — global instructions, banned phrases, voice register, code style |
| 2 | **What step am I on? What's next?** | [`source/package.json`](./source/package.json) `version` field shows current release line. `gh pr list --state open` shows in-flight work. `git log --oneline -5` shows recent history. |
| 3 | **What's in active working memory?** | [`docs/superpowers/specs/`](./docs/superpowers/specs/) — dated design specs per release (e.g. `2026-05-04-alpha-17-scope-split-design.md`). The spec for the version currently being shipped is the active mission. |
| 4 | **What's already true in this codebase?** | [`CONTEXT.md`](./CONTEXT.md) — product definition, locked vocabulary, architecture map. [`docs/karpathy-llm-wiki-handoff.md`](./docs/karpathy-llm-wiki-handoff.md) — full Karpathy LLM Wiki direction (the load-bearing architecture doc). [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) — last 7 alphas of shipped state. |
| 5 | **What am I forbidden from doing?** | [`CLAUDE.md`](./CLAUDE.md) — banned phrases, no-mockup-as-real, no-stub-as-shipped, anti-pattern list. `CONTEXT.md` charter rules section. |
| 6 | **How should I write what I write?** | [`CLAUDE.md`](./CLAUDE.md) style register, jargon rule, banned copy. `CONTEXT.md` locked vocabulary. Project conventions: JSX (not TSX), inline styles + CSS vars, square corners, no Tailwind. |

## Boundary rules

**Framework surface vs product code.** The framework lives in `docs/`, root-level instruction files (`CLAUDE.md`, `CONTEXT.md`, `AI_AGENT_GUIDE.md`), and CI config under `.github/`. Everything in `source/` is product code. Don't mix the two.

**Memory has retention, not infinite scrollback.** Recent shipped state lives in `CHANGELOG.md` (last 7 alphas, ~125 lines). Older lives in `CHANGELOG-archive.md`. When asked "what shipped recently?", read `CHANGELOG.md` — not chat history, not git log.

## Subagent / sub-pipeline patterns

JotFolio has used parallel subagent dispatch for multi-file alphas. Convention: pass each subagent a self-contained task with disjoint file paths so they don't conflict. Subagents get fun nicknames riffing on the job (per `feedback_subagent_nicknames.md` in agent memory).

Examples shipped:
- alpha.17: 4 parallel subagents for Karpathy Phase 4 (hash hyena / stub stenographer / manifest mortician / compile cobbler).
- alpha.17: 5 more for Phase 5 UI (fact forager / memory mechanic / panel painter / split shaman / wire wizard).
- alpha.19: 3 for Constellation redesign (token tinkerer / variant virtuoso / state shaman).

Pattern: write a brief design spec under `docs/superpowers/specs/`, dispatch parallel subagents with file paths + acceptance criteria + caveman directive, verify each independently, integrate results, commit + tag + PR.

## Where things you might look for actually live

| Looking for... | It's here |
|---|---|
| Type colors / palette themes | [`source/src/lib/types.js`](./source/src/lib/types.js) — `TYPE_TOKENS`, `applyTypeSat()` |
| Karpathy compile pipeline | [`source/src/lib/compile/`](./source/src/lib/compile/) |
| Memory graph node helpers | [`source/src/lib/memory/`](./source/src/lib/memory/) |
| Constellation graph view | [`source/src/features/constellation/`](./source/src/features/constellation/) |
| Vault adapter pattern | [`source/src/adapters/`](./source/src/adapters/) |
| Plugin Web Worker host | [`source/src/plugins/`](./source/src/plugins/) |
| Settings panel | [`source/src/features/settings/`](./source/src/features/settings/) |
| Onboarding (welcome / activation / nudges) | [`source/src/onboarding/`](./source/src/onboarding/) |
| CI workflows | [`source/.github/workflows/`](./source/.github/workflows/) |
| Dev server config | [`source/.claude/launch.json`](./source/.claude/launch.json) (port 5174) |

## Standard release flow

1. Write design spec under `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md`.
2. (If multi-file:) dispatch parallel subagents with disjoint paths.
3. Verify subagent output independently (run their tests).
4. Integrate (touch shared files yourself).
5. Run `npm test` (in `source/`) — must stay green.
6. Run `npm run build` — must exit clean.
7. Visual smoke via Claude Preview if observable in browser.
8. Bump version in `source/package.json` + `source/package-lock.json`.
9. Add `## [<version>] — <date>` section to `docs/CHANGELOG.md`.
10. Update `docs/PATCH_NOTES.md` current-version line.
11. Commit, tag `v<version>`, push tag (CI builds installer), push commits to `release/<version>` branch.
12. Open PR, wait CI green, resolve any review threads, admin-merge squash.
13. Mark GitHub Release as prerelease (`gh release edit <tag> --prerelease`).
14. Verify auto-update lands on installed binary (~15 min poll).

## Constraints to keep in mind

Per `docs/karpathy-llm-wiki-handoff.md`:
- Dev-server-only mode unless a build is explicitly authorized
- No `npm install` / `npm ci` without explicit authorization (locks dependencies)
- Don't touch `src-electron/`, `plugins/`, `bench/`, `.github/` without explicit approval
- All npm commands run from `source/`

## When this guide goes stale

Update it. It's a single page. The cost of keeping it current is one edit per release; the cost of letting it rot is every future agent re-deriving context from chat history.
