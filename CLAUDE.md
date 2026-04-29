# JotFolio — Claude Code project instructions

## Canonical paths
- **Source:** `C:\Dev\Projects\JotFolio` (this dir)
- **Vault (live app data):** `C:\Users\gavin\OneDrive\Documents\JotFolio Vault\`
- **Installed binary settings:** `%APPDATA%\JotFolio\settings.json` (case after T2 cleanup)
- **Installed binary exe:** `C:\Users\gavin\AppData\Local\Programs\JotFolio\JotFolio.exe`
- **Marketplace clone (separate project):** `C:\Dev\Projects\cowork-marketplace`

## Path traps to avoid
- `C:\Users\gavin\OneDrive\Desktop\JotFolio.lnk` is the installed-app shortcut, NOT source. Don't read or write through it.
- Don't `cd` to `C:\Dev\jotfolio` — doesn't exist.
- The `.snapshots/` dir at repo root mirrors source for backups; ignore it in searches.
- The symlink at `C:\Dev\Coding Agents\jotfolio` resolves here. Both paths work; prefer the canonical one in commits + memories.

## Working from outside this dir
If a Claude Code session starts in `C:\Dev\Coding Agents\`:
- For git/gh ops: prefix with `cd C:\Dev\Projects\JotFolio &&` OR `cd jotfolio &&` (uses symlink)
- For file reads: use the absolute canonical path `C:\Dev\Projects\JotFolio\...`

## Build commands
- Dev server: `cd source && npm run dev` (port 5174)
- Test: `cd source && npm test`
- Build: `cd source && npm run build`
- Electron dev: `cd source && npm run electron:dev`
- Electron package: `cd source && npm run electron:build`

## Stack
- Vite 7 + React 19 (JSX, not TSX)
- Electron 32
- Inline styles + CSS variables (no Tailwind)
- Self-hosted fonts via Fontsource (Inter, Lora, Fraunces, JetBrains Mono, Caveat)
- ONNX runtime (planned for v0.7 MiniLM features)

## Charter (binding)
SlateVault Vibe prompt. See `~/.claude/projects/C--Dev-Coding-Agents/memory/slatevault_vibe_prompt.md` for full text.
Key rules:
- Local-first, plain-text durable
- Parser as pure functions
- No AI/analytics in shipped product (telemetry is the explicit charter exception, opt-in only)
- 800-line cap per file (currently violated by App.jsx 809; deferred refactor)
