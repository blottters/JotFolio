# CC CLI inventory — 2026-04-30

## Binary
- Path: `C:\Users\gavin\.local\bin\claude.exe`
- Version: 2.1.123 (Claude Code)

## Installed plugins (5)
| Plugin | Version | Scope | Path |
|---|---|---|---|
| `agency-game-development@gavin-local-marketplace` | 0.1.0 | user | `C:\Users\gavin\.claude\plugins\cache\gavin-local-marketplace\agency-game-development\0.1.0` |
| `agency-agents@gavin-local-marketplace` | 0.1.0 | user | `C:\Users\gavin\.claude\plugins\cache\gavin-local-marketplace\agency-agents\0.1.0` |
| `superpowers@claude-plugins-official` | 5.0.7 | user | `C:\Users\gavin\.claude\plugins\cache\claude-plugins-official\superpowers\5.0.7` |
| `caveman@caveman` | 84cc3c14fa1e | user | `C:\Users\gavin\.claude\plugins\cache\caveman\caveman\84cc3c14fa1e` |
| `slop-judge@slop-judge-marketplace` | 2.0.0 | user | `C:\Users\gavin\.claude\plugins\marketplaces\slop-judge` |

Note: `slop-judge` lives in the marketplaces dir (not the cache dir) — it is sourced from a local directory marketplace. Enabled-plugins map in `settings.json` enables 4 of the 5 (`agency-agents`, `agency-game-development`, `superpowers`, `caveman`); `slop-judge` is installed but NOT in `enabledPlugins` — its skills/agents/commands still surfaced in the active skill list, so the harness is loading it anyway (likely auto-enabled on install).

## Marketplaces (5)
| Name | Source | URL/path |
|---|---|---|
| `claude-plugins-official` | github | `anthropics/claude-plugins-official` |
| `gavin-local-marketplace` | directory | `C:\Dev\Projects\cowork-marketplace` |
| `karpathy-skills` | github | `forrestchang/andrej-karpathy-skills` (registered, no plugins installed from it) |
| `caveman` | github | `JuliusBrussee/caveman` |
| `slop-judge-marketplace` | directory | `C:\Users\gavin\.claude\plugins\marketplaces\slop-judge` |

## Plugin contents (per plugin)

### agency-agents (gavin-local-marketplace, v0.1.0)
- Skills: 89
  - academic-anthropologist, academic-geographer, academic-historian, academic-narratologist, academic-psychologist, accounts-payable-agent, agentic-identity-trust, agents-orchestrator, automation-governance-architect, blockchain-security-auditor, compliance-auditor, data-consolidation-agent, design-brand-guardian, design-image-prompt-engineer, design-inclusive-visuals-specialist, design-ui-designer, design-ux-architect, design-ux-researcher, design-visual-storyteller, design-whimsy-injector, engineering-ai-data-remediation-engineer, engineering-ai-engineer, engineering-autonomous-optimization-architect, engineering-backend-architect, engineering-cms-developer, engineering-code-reviewer, engineering-data-engineer, engineering-database-optimizer, engineering-devops-automator, engineering-email-intelligence-engineer, engineering-embedded-firmware-engineer, engineering-feishu-integration-developer, engineering-filament-optimization-specialist, engineering-frontend-developer, engineering-git-workflow-master, engineering-incident-response-commander, engineering-mobile-app-builder, engineering-rapid-prototyper, engineering-security-engineer, engineering-senior-developer, engineering-software-architect, engineering-solidity-smart-contract-engineer, engineering-sre, engineering-technical-writer, engineering-threat-detection-engineer, engineering-wechat-mini-program-developer, identity-graph-operator, lsp-index-engineer, macos-spatial-metal-engineer, product-behavioral-nudge-engine, product-feedback-synthesizer, product-manager, product-sprint-prioritizer, product-trend-researcher, project-management-experiment-tracker, project-management-jira-workflow-steward, project-management-project-shepherd, project-management-studio-operations, project-management-studio-producer, project-manager-senior, report-distribution-agent, specialized-civil-engineer, specialized-cultural-intelligence-strategist, specialized-developer-advocate, specialized-document-generator, specialized-french-consulting-market, specialized-korean-business-navigator, specialized-mcp-builder, specialized-model-qa, specialized-salesforce-architect, specialized-workflow-architect, support-analytics-reporter, support-executive-summary-generator, support-finance-tracker, support-infrastructure-maintainer, support-legal-compliance-checker, support-support-responder, terminal-integration-specialist, testing-accessibility-auditor, testing-api-tester, testing-evidence-collector, testing-performance-benchmarker, testing-reality-checker, testing-test-results-analyzer, testing-tool-evaluator, testing-workflow-optimizer, visionos-spatial-engineer, xr-cockpit-interaction-specialist, xr-immersive-developer, xr-interface-architect, zk-steward
- Agents: 1 — `agency-agents-router.md`
- Commands: 0

### agency-game-development (gavin-local-marketplace, v0.1.0)
- Skills: 20
  - blender-addon-engineer, game-audio-engineer, game-designer, godot-gameplay-scripter, godot-multiplayer-engineer, godot-shader-developer, level-designer, narrative-designer, roblox-avatar-creator, roblox-experience-designer, roblox-systems-scripter, technical-artist, unity-architect, unity-editor-tool-developer, unity-multiplayer-engineer, unity-shader-graph-artist, unreal-multiplayer-architect, unreal-systems-engineer, unreal-technical-artist, unreal-world-builder
- Agents: 1 — `agency-game-development-router.md`
- Commands: 0

### superpowers (claude-plugins-official, v5.0.7)
- Skills: 14
  - brainstorming, dispatching-parallel-agents, executing-plans, finishing-a-development-branch, receiving-code-review, requesting-code-review, subagent-driven-development, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans, writing-skills
- Agents: 1 — `code-reviewer.md`
- Commands: 3 — `brainstorm.md`, `execute-plan.md`, `write-plan.md`

### caveman (caveman, v84cc3c14fa1e)
- Skills: 5 — caveman, caveman-commit, caveman-help, caveman-review, compress
- Agents: 0
- Commands: 3 — `caveman-commit.toml`, `caveman-review.toml`, `caveman.toml`

### slop-judge (slop-judge-marketplace, v2.0.0)
- Skills: 1 — slop-judge
- Agents: 21 — slop-judge.md, slop-judge-a11y, slop-judge-animation, slop-judge-api, slop-judge-asset, slop-judge-auth, slop-judge-brand, slop-judge-build, slop-judge-code, slop-judge-copy, slop-judge-dataviz, slop-judge-email, slop-judge-forensic, slop-judge-form, slop-judge-i18n, slop-judge-layout, slop-judge-mobile, slop-judge-motion, slop-judge-routing, slop-judge-state, slop-judge-visual
- Commands: 1 — `slop-judge.md`

## User-level skills (2)
- `sandbox-bypass` → `C:\Users\gavin\.claude\skills\sandbox-bypass\` (contains `references/` only — no `SKILL.md` at root, may be malformed)
- `ship-electron-update` → `C:\Users\gavin\.claude\skills\ship-electron-update\SKILL.md`

## User-level agents (3)
- `slop-judge-code` → Score a code build against Code + Forensic layers of the slop rubric (35 items: 3 T1 + 19 T2 + 13 T3). Inspects imports, file structure, naming, comments, configs, package.json, README, git history, build artifacts. Honors tier flag. Triggers: "audit my code for slop", "is this generated", "/slop-judge-code".
- `slop-judge-copy` → Score against Copy layer (13 items, all T1). Headline templates, em-dash density, buzzwords, generic CTAs, emoji-prefixed headers, microcopy boilerplate, apology voice, round stat numbers, templated testimonial titles. Triggers: "audit my copy", "/slop-judge-copy".
- `slop-judge-visual` → Score against Visual + Layout + Motion + Asset layers (41 items: 31 T1 + 8 T2 + 2 T3). Returns verdict glyphs + file:line evidence. Defaults to T1 only. Triggers: "audit my UI for slop", "/slop-judge-visual".

Note: `_archive_pre-slop-judge-plugin/` directory contains 9 older slop-judge agent files — kept as historical archive, not loaded by harness.

## User-level commands (0)
- n/a — `C:\Users\gavin\.claude\commands\` does not exist.

## Hooks
| Event | Matcher | Command |
|---|---|---|
| UserPromptSubmit | * | `node "C:/Dev/buddy-build/reaction-worker.mjs"` |
| UserPromptSubmit | * | `node "C:/Users/gavin/.claude/hooks/skill-activator.js"` |
| PostToolUse | `Bash\|Edit\|Write` | `node "C:/Dev/buddy-build/reaction-worker.mjs"` |
| (statusLine, not a hook) | — | `powershell -ExecutionPolicy Bypass -File "C:\Users\gavin\.claude\plugins\cache\caveman\caveman\84cc3c14fa1e\hooks\caveman-statusline.ps1"` |

Hook scripts on disk in `C:\Users\gavin\.claude\hooks\`:
- `reprune-marketplace.ps1` (1624 bytes) — present but NOT wired in `settings.json`
- `skill-activator.js` (2860 bytes) — wired

## MCP servers
| Name | Type | Endpoint |
|---|---|---|
| (none in user config) | — | — |

- `C:\Users\gavin\.claude\settings.json` — no `mcpServers` key.
- `C:\Users\gavin\.claude\settings.local.json` — only contains `remote.defaultEnvironmentId`.
- `C:\Users\gavin\.claude.json` (CC user state) — `mcpServers` key absent / empty.
- Project `.mcp.json` at `C:\Dev\Coding Agents\.mcp.json` — does not exist.

The many `mcp__*` tools surfaced in the deferred-tools list (Claude_Preview, Claude_in_Chrome, Desktop_Commander, ElevenLabs, PDF_Tools, Windows-MCP, computer-use, scheduled-tasks, mcp-registry, ccd_*, plugin_*, and 10+ UUID-named servers) are provisioned by the harness / remote environment, NOT by user-level config. They do not appear in the local user inventory and are out-of-scope for a user-config audit.

## Counts summary
- Total plugins (installed): **5**
- Total skills (across all sources): **131**
  - agency-agents: 89, agency-game-development: 20, superpowers: 14, caveman: 5, slop-judge: 1, user-level: 2
- Total agents (across all sources): **6**
  - agency-agents: 1, agency-game-development: 1, superpowers: 1, slop-judge plugin: 21, user-level: 3 → wait, recount: 1+1+1+21+3 = **27**. The 21 slop-judge sub-agents in the plugin overlap with 3 user-level slop-judge agents (different files; user-level kept code/copy/visual after archiving 9 older variants). Counting all distinct agent files = **27**.
- Total commands (across all sources): **7**
  - superpowers: 3, caveman: 3, slop-judge: 1, user-level: 0
- Total hooks: **3** (UserPromptSubmit×2, PostToolUse×1) — plus 1 statusLine command (not strictly a hook)
- Total MCP servers (user config): **0** (harness-provided MCPs are separate)

## Paths that did not exist
- `C:\Users\gavin\.claude\commands\` — n/a
- `C:\Dev\Coding Agents\.mcp.json` — n/a

## JSON parse errors
- None. All 4 JSON files (`installed_plugins.json`, `known_marketplaces.json`, `settings.json`, `settings.local.json`, `.claude.json`) parsed cleanly.

## Footprint summary
5 plugins → 129 plugin skills + 24 plugin agents + 7 plugin commands; 2 user skills + 3 user agents + 0 user commands; 3 user hooks + 1 statusLine; 0 user-configured MCP servers (all MCP tooling comes from the harness/remote env). Total active skill surface ≈ 131, dominated by `agency-agents` (89 specialist roles).
