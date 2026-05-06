# Claude.ai desktop app inventory — 2026-04-30

Read-only audit of the Anthropic Claude desktop app install on this Windows 11 PC. All credentials redacted.

## Binary

- **Path:** `C:\Program Files\WindowsApps\Claude_1.5354.0.0_x64__pzs8sxrjxfjjc\app\Claude.exe`
- **Version:** `1.5354.0.0` (encoded in the package family name)
- **Install method:** MSIX / Microsoft Store sideload (no entry in classic `Uninstall` registry hive; lives under `WindowsApps\`)
- **Install date:** n/a — MSIX manifest not parsed in this audit; no `InstallDate` key exposed by Store apps
- **Currently running:** yes (multiple `Claude.exe` PIDs observed during audit, plus a `cowork-svc` helper process)
- **Co-located CLI:** `C:\Users\gavin\AppData\Roaming\Claude\claude-code\2.1.121\claude.exe` (Claude Code CLI, NOT the desktop app — listed for disambiguation only)

## MCP servers (from `claude_desktop_config.json`) (0)

The file `C:\Users\gavin\AppData\Roaming\Claude\claude_desktop_config.json` exists but contains **only `preferences`** — no `mcpServers` key. The desktop app does not load MCP servers from the legacy `claude_desktop_config.json` block on this install. Instead, all MCP servers come through the new **Claude Extensions (DXT bundles)** mechanism — see next section.

| Name | Command | Args | Env (redacted) |
|---|---|---|---|
| _(none in claude_desktop_config.json)_ | — | — | — |

## Claude Extensions / DXT-bundled MCP servers (8)

Location: `C:\Users\gavin\AppData\Roaming\Claude\Claude Extensions\<bundle-id>\manifest.json`
Per-extension user config (incl. API keys): `C:\Users\gavin\AppData\Roaming\Claude\Claude Extensions Settings\<bundle-id>.json` — NOT read in this audit; only manifest `mcp_config` shown.

| Bundle ID | Display name | Version | Type | Command | Args (literal `${__dirname}` is the bundle dir) | Env (redacted) |
|---|---|---|---|---|---|---|
| `ant.dir.ant.anthropic.filesystem` | Filesystem | 0.2.2 | node | `node` | `${__dirname}/dist/index.js`, `${user_config.allowed_directories}` | (none) |
| `ant.dir.cursortouch.windows-mcp` | Windows-MCP | 0.7.1 | python (uv) | `uv` | `--directory`, `${__dirname}`, `run`, `windows-mcp` | `ANONYMIZED_TELEMETRY=[user_config]`, `MODE=[user_config]`, `SANDBOX_ID=[REDACTED]`, `API_KEY=[REDACTED]`, `WINDOWS_MCP_PROFILE_SNAPSHOT=[user_config]`, `WINDOWS_MCP_SCREENSHOT_BACKEND=[user_config]`, `WINDOWS_MCP_DEBUG=[user_config]` |
| `ant.dir.gh.apify.apify-mcp-server` | Apify | 0.9.17 | node | `node` | `${__dirname}/dist/stdio.js`, `--tools`, `${user_config.tools}` | `APIFY_TOKEN=[REDACTED]` |
| `ant.dir.gh.elevenlabs.agents-mcp-app` | ElevenLabs Agents MCP App | 1.0.0 | node | `node` | `${__dirname}/server/index.js`, `--stdio` | `ELEVENLABS_API_KEY=[REDACTED]` |
| `ant.dir.gh.elevenlabs.elevenlabs-player` | ElevenLabs Player | 1.0.0 | node | `node` | `${__dirname}/dist/server.js` | `ELEVENLABS_API_KEY=[REDACTED]`, `ELEVENLABS_OUTPUT_DIR=[user_config]` |
| `ant.dir.gh.silverstein.pdf-filler-simple` | PDF Tools (View/Fill/Merge/Split/Manage Pages/Extract) | 0.7.3 | node | `node` | `${__dirname}/server/index.js` | `DEFAULT_PDF_DIR=${DOCUMENTS}`, `DEFAULT_PROFILES_DIR=${HOME}/.pdf-toolkit-files` |
| `ant.dir.gh.wonderwhy-er.desktopcommandermcp` | Desktop Commander | 0.2.40 | node | `node` | `${__dirname}/dist/index.js` | `MCP_DXT=true`, `NODE_ENV=production` |
| `postman-mcp-server` | Postman MCP Server (Minimal) | 2.3.6 | node | `node` | `${__dirname}/dist/src/index.js` | `POSTMAN_API_KEY=[REDACTED]` |

## Connectors (n/a)

The desktop app's HTTP-based "Connectors" feature does not store its config in any file enumerated in `Roaming\Claude\`. Connector state is fetched from the Claude.ai account at runtime (server-side) and surfaced via the desktop app UI. No local connector file present in this install. Counts here reflect what's local — actual account-side connectors are not visible from the filesystem.

| Name | Type | URL | Auth status |
|---|---|---|---|
| _(none stored locally)_ | — | — | — |

## Skills found in desktop app config (0)

The desktop app does not have a dedicated `skills/` or `plugins/` dir under `%APPDATA%\Claude\`. Skills surfaced inside the desktop app's Claude Code panel are loaded by the embedded Claude Code CLI from `C:\Users\gavin\.claude\skills\` and `C:\Users\gavin\.claude\plugins\` — NOT from any path under `%APPDATA%\Claude\`. The desktop app itself is skill-agnostic; it ships MCP via the Extensions mechanism above.

- _(no desktop-app-only skill dir exists)_

## Other config files in AppData

Location root: `C:\Users\gavin\AppData\Roaming\Claude\`

| File | Purpose |
|---|---|
| `claude_desktop_config.json` | Desktop app preferences only (no MCP servers in this install) — paired Chrome extension ID, trusted local-agent-mode folders, sidebar mode, Cowork/CCD scheduled-tasks toggles, bypass-permissions flag |
| `config.json` | Locale/theme + OAuth token cache (encrypted blob) + DXT allowlist caches per workspace + window position + remote-uploads/marketplace migration flags |
| `Local State` | Chromium/Electron local state |
| `Preferences` | Chromium/Electron preferences |
| `bridge-state.json` | Cowork bridge state |
| `buddy-tokens.json` | Cowork buddy auth tokens |
| `cowork-enabled-cli-ops.json` | Cowork → Claude Code CLI op allowlist |
| `extensions-blocklist.json` | DXT extension blocklist |
| `extensions-installations.json` | DXT install ledger |
| `git-worktrees.json` | Active worktree registry |
| `window-state.json` | Window geometry persistence |
| `lockfile` | Single-instance lockfile |
| `claude-code/` | Embedded Claude Code CLI binary (v2.1.121) |
| `claude-code-sessions/` | CC session transcripts |
| `claude-code-vm/` | Cowork VM bundles |
| `local-agent-mode-sessions/` | Local-agent-mode session state |
| `vm_bundles/` | Cowork sandbox VM bundles |
| `pending-uploads/` | Upload staging |
| `Claude Extensions/` | Installed DXT bundle source trees |
| `Claude Extensions Settings/` | Per-extension user_config values (incl. API keys) |
| `logs/`, `sentry/`, `Crashpad/` | Diagnostic / crash telemetry |
| `Cache/`, `Code Cache/`, `GPUCache/`, `DawnGraphiteCache/`, `DawnWebGPUCache/`, `Network/`, `Session Storage/`, `Local Storage/`, `IndexedDB/`, `blob_storage/`, `Shared Dictionary/`, `SharedStorage*`, `WebStorage/`, `VideoDecodeStats/`, `InterestGroups/`, `Conversions*`, `DIPS*`, `Partitions/`, `Service Worker/`, `shared_proto_db/` | Standard Chromium/Electron storage substrates |
| `ant-did/` | Anthropic device-identity store |
| `ChromeNativeHost/` | Native messaging host for the Chrome extension pairing |
| `fcache/` | Filesystem cache |
| `backups/` | App-side backup snapshots |

Local-only diagnostic dir: `C:\Users\gavin\AppData\Local\Claude\Logs\` → `chrome-native-host.log` (single file).

## Counts summary

- **Total MCP servers (in `claude_desktop_config.json`):** 0
- **Total MCP servers (DXT-bundled extensions):** 8
- **Total connectors stored locally:** 0 (n/a — server-side state)
- **Total skills bound to the desktop app config:** 0 (CC-side skills load from `~/.claude/skills`, not desktop-app dir)
- **Total Claude Extensions installed:** 8

## Notes

- Desktop app IS installed — MSIX-packaged build `1.5354.0.0`, Cowork-flavored (evidenced by `cowork-svc` process, `coworkScheduledTasksEnabled`, `dispatchCodeTasksPermissionMode`, `local-agent-mode-sessions/`, `vm_bundles/`).
- This is the modern desktop app architecture: MCP servers are delivered as **Claude Extensions / DXT bundles**, NOT as `mcpServers` entries in `claude_desktop_config.json`. Anyone looking for the legacy MCP block in this install will find an empty preferences-only file and incorrectly conclude no MCP is wired up.
- Every API key surfaced through `${user_config.*}` placeholders in manifests resolves at runtime from `Claude Extensions Settings\<bundle-id>.json`. Those files were NOT opened in this audit per the read-only / no-secrets rule.
- Paths checked and confirmed missing: `C:\Program Files\Claude`, `C:\Program Files (x86)\Claude`, `C:\Program Files\Anthropic`, `C:\Users\gavin\AppData\Local\AnthropicClaude`, `C:\Users\gavin\AppData\Local\Programs\Claude`, `C:\Users\gavin\AppData\Local\anthropic-claude`, Start Menu shortcuts under both per-user and per-machine roots, classic Uninstall registry under HKLM/HKCU + WOW6432.
