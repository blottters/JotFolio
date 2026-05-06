# Skills alignment — CLI vs Desktop — 2026-04-30

Diff of `cli-skills-audit-2026-04-30.md` vs `desktop-skills-audit-2026-04-30.md`. READ-ONLY analysis. Zero mutations to either source. No installs/uninstalls/config edits proposed (only recommended in §6).

Voice: caveman ultra. Code/commits/PRs stay normal. Errors quoted exact.

---

## 1. Side-by-side counts

| Category | CLI | Desktop | Notes |
|---|---|---|---|
| Binary version | `2.1.123` (`~/.local/bin/claude.exe`) | `1.5354.0.0` (MSIX `WindowsApps`) + embedded CC `2.1.121` | Desktop bundles older CC than standalone CLI (2.1.121 vs 2.1.123). |
| Plugins (CC-style) | 5 installed | 0 (desktop can't load CC plugins natively) | Desktop only sees plugins via embedded CC reading shared `~/.claude/`. |
| Marketplaces (CC-style) | 5 registered | 0 | Same as above — desktop-native = none. |
| Skills (plugin + user) | 131 (89+20+14+5+1+2) | 0 desktop-native; reads same 131 via embedded CC | Shared dir `~/.claude/skills` + `~/.claude/plugins`. |
| Agents (plugin + user) | 27 | 0 desktop-native | Same surface via embedded CC. |
| Commands (plugin + user) | 7 | 0 desktop-native | Same surface via embedded CC. |
| Hooks | 3 wired (UserPromptSubmit ×2, PostToolUse ×1) + 1 statusLine | 0 desktop-native | Hooks run inside CC harness only. |
| MCP svrs (user-config) | 0 | 0 in `claude_desktop_config.json` | Both files empty of `mcpServers` key. |
| MCP svrs (DXT bundles) | n/a (CC has no DXT mechanism) | **8** | Desktop-only delivery svc. |
| MCP svrs (harness-provided) | many `mcp__*` in deferred list | n/a | Harness/remote env-injected, not user config. |
| Connectors (HTTP) | n/a | server-side only (none local) | Account-level state, invisible to fs. |
| Cowork svc | n/a (CLI doesn't host it) | running (`cowork-svc` proc + `cowork-enabled-cli-ops.json` etc.) | Desktop-only runtime. |

---

## 2. Shared surfaces

Both surfaces read/write the same on-disk state in these spots:

- **`C:\Users\gavin\.claude\skills\`** → 2 user skills (`sandbox-bypass`, `ship-electron-update`). Embedded CC inside desktop loads same dir → same 2 skills exposed in desktop's CC panel.
- **`C:\Users\gavin\.claude\plugins\`** → 5 plugins, 131 skills, 24 plugin agents, 7 plugin commands. Desktop's embedded CC sees identical set.
- **`C:\Users\gavin\.claude\agents\`** → 3 user agents (slop-judge-code/copy/visual). Same on both.
- **`C:\Users\gavin\.claude\settings.json` + `settings.local.json`** → enabledPlugins map, hooks, statusLine. Embedded CC respects them.
- **`C:\Users\gavin\AppData\Roaming\Claude\claude-code\2.1.121\claude.exe`** → embedded CC binary inside desktop. Reads from the SAME `~/.claude` tree as standalone CLI → effectively any CC config change propagates to desktop instantly.

**Conclusion:** every CC plugin/skill/agent/cmd/hook in the CLI inventory ALSO appears inside desktop's CC panel (via embedded binary). The "desktop has 0 skills" line in the desktop audit is technically true (no native dir) but practically misleading — it sees all 131 via the embedded CC.

---

## 3. CLI-only items

Things the CLI can do/load but desktop-native (non-CC) cannot:

- **Plugins** — `agency-agents`, `agency-game-development`, `superpowers`, `caveman`, `slop-judge`. Desktop-native has no plugin loader.
- **Marketplaces** — all 5 (`claude-plugins-official`, `gavin-local-marketplace`, `karpathy-skills`, `caveman`, `slop-judge-marketplace`). Desktop UI doesn't browse them.
- **Hooks** — `UserPromptSubmit` (×2: `reaction-worker.mjs`, `skill-activator.js`), `PostToolUse` (`reaction-worker.mjs`), statusLine (`caveman-statusline.ps1`). Desktop chrome itself doesn't fire these — only the embedded CC does, and only inside CC sessions.
- **CC commands** — `/brainstorm`, `/execute-plan`, `/write-plan` (superpowers), `/caveman`, `/caveman-commit`, `/caveman-review`, `/slop-judge`. Desktop-native has no `/cmd` palette, only the CC panel exposes them.
- **CC user-level skills** — `sandbox-bypass`, `ship-electron-update`. Same caveat — only loadable via embedded CC.
- **CC user-level agents** — `slop-judge-code/copy/visual`. Same caveat.
- **Standalone CC binary** at `~/.local/bin/claude.exe` (v2.1.123) — newer than the desktop-bundled one (v2.1.121).

---

## 4. Desktop-only items

Things the desktop has that the CLI does NOT see (no `.mcp.json` at user or project level):

- **DXT-bundled MCP svrs (8):**
  1. `ant.dir.ant.anthropic.filesystem` — Filesystem MCP (node)
  2. `ant.dir.cursortouch.windows-mcp` — Windows-MCP (python/uv) → tools `App`, `Click`, `Clipboard`, `FileSystem`, `Move`, `MultiEdit`, `MultiSelect`, `Notification`, `PowerShell`, `Process`, `Registry`, `Scrape`, `Screenshot`, `Scroll`, `Shortcut`, `Snapshot`, `Type`, `Wait`
  3. `ant.dir.gh.apify.apify-mcp-server` — Apify (node)
  4. `ant.dir.gh.elevenlabs.agents-mcp-app` — ElevenLabs Agents
  5. `ant.dir.gh.elevenlabs.elevenlabs-player` — ElevenLabs Player
  6. `ant.dir.gh.silverstein.pdf-filler-simple` — PDF Tools
  7. `ant.dir.gh.wonderwhy-er.desktopcommandermcp` — Desktop Commander
  8. `postman-mcp-server` — Postman MCP
- **Cowork svc** — `cowork-svc` proc, `cowork-enabled-cli-ops.json`, `bridge-state.json`, `buddy-tokens.json`, `vm_bundles/`, `claude-code-vm/`, `local-agent-mode-sessions/` → only desktop runs this.
- **DXT install ledger** — `extensions-installations.json`, `extensions-blocklist.json`. CLI has no equivalent.
- **HTTP connectors** — server-side state per Claude.ai account (none local but desktop UI surfaces them). CLI doesn't render connectors.
- **Chrome native-host pairing** — `ChromeNativeHost/` dir + `chrome-native-host.log` → CIC extension bridge lives in desktop only.
- **Git worktree registry** — `git-worktrees.json` (Cowork tracking). CLI has worktree skills but no central registry file.

---

## 5. Misalignment risks

| # | Risk | Detail | Severity |
|---|---|---|---|
| 1 | **MCP visibility gap** | Desktop has 8 DXT MCPs (Filesystem, Windows-MCP, Apify, ElevenLabs ×2, PDF, Desktop Commander, Postman). Standalone CLI sessions see ZERO of them. CLI sessions inside CC harness → no PDF/Apify/Postman/Windows-MCP tooling. Desktop CC panel inherits them. | HIGH |
| 2 | **Embedded CC version drift** | Desktop ships CC `2.1.121`, standalone CC is `2.1.123`. Two-patch drift → potential hook/skill behavior diff, statusLine API delta, plugin-loader fixes missing on desktop side. | MED |
| 3 | **slop-judge enabledPlugins mismatch** | `slop-judge@slop-judge-marketplace` installed but NOT in `enabledPlugins`; harness loads it anyway. Desktop's embedded CC reads same `settings.json` → same ambiguity. If the loader behavior changes upstream → slop-judge silently disappears from BOTH surfaces simultaneously. | MED |
| 4 | **Hook fan-out asymmetry** | `reaction-worker.mjs` + `skill-activator.js` fire on every `UserPromptSubmit` in CC sessions. Desktop-native chats (non-CC panel) bypass these → user prompts in the chat surface get ZERO hook processing. Easy to forget. | MED |
| 5 | **`reprune-marketplace.ps1` orphan** | Script on disk in `~/.claude/hooks/` but NOT wired in any settings. Dead code on both surfaces. Could be intentional (manual run) or stale. | LOW |
| 6 | **`sandbox-bypass` skill malformed** | Dir contains `references/` only, no `SKILL.md` at root. Both surfaces will fail to load it the same way → consistent breakage, but breakage. | LOW |
| 7 | **Connector blind spot from CLI** | Desktop UI shows account-level HTTP connectors. CLI sessions can't see/invoke them at all → CLI users may not know what tools are server-side bound to the account. | LOW |
| 8 | **Cowork ops gated to desktop** | `cowork-enabled-cli-ops.json` is read by desktop's Cowork svc to allow which CC ops; standalone CLI bypasses this allowlist entirely. If the user thinks Cowork limits their CLI → wrong. | LOW |
| 9 | **DXT API key lock-in** | Apify/ElevenLabs/Postman API keys live in `Claude Extensions Settings/<bundle-id>.json` (desktop). Porting these MCPs CLI-side requires re-entering keys in `.mcp.json` env block → not transparently shared. | LOW |
| 10 | **Embedded CC sessions stored under desktop** | `claude-code-sessions/` inside Roaming\Claude → desktop-CC transcripts. Standalone CLI sessions live elsewhere (CCD/projects dir). Two separate transcript stores → search across both is on the user. | LOW |

**Misalignment count: 10 surfaces drift.**

---

## 6. Recommendation table — every gap from §3 + §4 covered

| Item | Current state | Action | Reason |
|---|---|---|---|
| **Filesystem MCP** | desktop DXT only | **port** via CC `.mcp.json` (project-level at `C:\Dev\Coding Agents\.mcp.json` or user-level `~/.claude.json` `mcpServers`) | CLI sessions get same fs scoping w/o leaning on built-in Read/Write. Marginal — CC already has Read/Write. |
| **Windows-MCP** | desktop DXT only | **port** CLI-side | High leverage. CLI sessions doing Windows automation currently fall back to PowerShell tool only. PowerShell/Registry/Screenshot/Click/Type tools unavailable to CLI. |
| **Apify MCP** | desktop DXT only | **port** if Gavin uses Apify from CLI sessions; **leave** if desktop-only workflow | Optional. Driven by usage. |
| **ElevenLabs Agents MCP** | desktop DXT only | **leave** | TTS/voice work tends to happen in desktop chat sessions where audio playback is in-band. CLI can't play audio anyway. |
| **ElevenLabs Player MCP** | desktop DXT only | **leave** | Same — audio playback only useful w/ desktop UI. |
| **PDF Tools MCP** | desktop DXT only | **port** CLI-side | High leverage. JotFolio + general PDF fill/merge/split/extract → CLI sessions can't do any of it today. Read tool reads PDFs but can't fill/merge/split. |
| **Desktop Commander MCP** | desktop DXT only | **leave** (or port w/ caution) | Massive overlap w/ CC built-in Bash/Read/Write/Edit. Porting → tool dupe + permission noise. Leave unless specific feature needed. |
| **Postman MCP** | desktop DXT only | **port** if API testing is a CLI workflow, else leave | Context-dependent. |
| **Cowork svc** | desktop only | **leave intentional** | Cowork is desktop-app architecture (MSIX-packaged, Electron-hosted, VM bundles). No CLI equivalent exists or should. |
| **HTTP Connectors** | server-side, desktop UI surfaces | **leave intentional** | Account-state, not local config. CLI exposure = upstream Anthropic decision, not a local fix. |
| **Chrome native-host pairing** | desktop only | **leave intentional** | CIC extension (Edge in Gavin's case) requires desktop-app host. CLI has no native-msg bridge. |
| **Git worktrees registry** | desktop tracks `git-worktrees.json` | **leave intentional** | Cowork-side bookkeeping. CLI has `using-git-worktrees` skill that operates on git directly w/o a registry. |
| **DXT install ledger** | desktop only | **leave intentional** | Desktop-side install mechanism. No CLI MCP-installer concept yet. |
| **Plugins (5)** | CLI-loaded + visible via embedded CC | **leave intentional + consolidate** | Already shared. No port needed. Consolidation = audit `enabledPlugins` to make slop-judge state explicit (add it OR remove it). |
| **Marketplaces (5)** | CLI-side registry | **leave intentional** | Same — embedded CC reads identical state. |
| **Hooks (3 + statusLine)** | CC-only execution | **leave intentional** | Desktop-native chat surface won't ever fire CC hooks. Document this — don't port. If hook coverage in plain desktop chats matters → escalate to Anthropic, not local fix. |
| **CC `/brainstorm` `/execute-plan` `/write-plan`** | CC-panel only | **leave intentional** | Slash cmds are CC-protocol. Desktop chat has its own `/` cmd palette. Distinct surfaces by design. |
| **`/caveman` `/caveman-commit` `/caveman-review`** | CC-panel only | **leave intentional** | Same. |
| **`/slop-judge`** | CC-panel only | **leave intentional** | Same. |
| **`sandbox-bypass` user skill** | shared, malformed (no SKILL.md) | **fix** — add `SKILL.md` at root or move `references/` under a proper skill dir | Both surfaces affected. One fix → both. |
| **`ship-electron-update` user skill** | shared, healthy | **leave** | Working. |
| **`slop-judge-code/copy/visual` user agents** | shared | **consolidate** — decide: keep user-level OR rely on the 21-agent set inside the slop-judge plugin. Today both exist → name collision risk if loader changes. | Avoid future drift when plugin loader resolves slop-judge-code from two sources. |
| **`reprune-marketplace.ps1` orphan** | on disk, not wired | **decide** — wire it (`PreToolUse` or schedule) OR delete. Don't leave dead. | Reduces surface confusion. |
| **Standalone CC `2.1.123` vs embedded `2.1.121`** | drift | **align** — let desktop auto-update its embedded CC, OR pin both to a known version | Avoids "works in CLI, broken in desktop CC panel" surprises. |
| **Session transcript stores** | CLI sessions → CCD projects dir; desktop CC sessions → `Roaming\Claude\claude-code-sessions\` | **leave intentional** — but document the two paths so search isn't a hunt | No clean way to merge today. Awareness = fix. |

---

## Verification

- [x] Diff doc saved at `C:\Dev\Projects\JotFolio\docs\superpowers\skills-alignment-2026-04-30.md`
- [x] §1 counts table present
- [x] §2 shared surfaces present
- [x] §3 CLI-only items present
- [x] §4 desktop-only items present
- [x] §5 misalignment risks present (10 entries)
- [x] §6 recommendation table covers EVERY gap from §3 (plugins, marketplaces, hooks, CC commands, user skills, user agents, standalone CC binary) + §4 (8 DXT MCPs, Cowork svc, DXT ledger, connectors, Chrome native-host, worktree registry)
- [x] Zero mutations beyond this new diff doc
- [x] No MCP installs performed
