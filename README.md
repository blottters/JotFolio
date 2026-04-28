# JotFolio — v0.5.0-alpha.7

Personal knowledge management system. React 19 + Vite 7 renderer, Electron desktop shell, plugin runtime, vault on disk as `.md` files with YAML frontmatter.

## Layout

```
JotFolio/
  source/         runtime — everything needed to run, build, test, bench
    src/            React UI + lib + adapters + plugins
    src-electron/   Electron main process + preload + updater + telemetry + snapshots
    plugins/        official plugin sources (daily-notes, git-sync)
    bench/          performance bench harness + a11y spec + baseline
    .github/        CI/CD workflows (release, bench)
    package.json    version, deps, scripts
    ...
  docs/           non-runtime — docs, changelog, plans, session history
    CHANGELOG.md    full technical changelog (machine-readable)
    PATCH_NOTES.md  human-readable release history, birth → now
    adr/            architecture decision records
    design/         UX wireframes + design tokens
    security/       threat model + IPC audit + contextBridge surface
    build/          code-signing + release process playbooks
    perf/           bench targets + known a11y gaps
    phase-plans/    specialist-authored per-phase plans
    plans/          roadmap (jotfolio-electron-pivot)
    session-extracts/   historical session notes
    superpowers/        session artifacts from skills plugin
  dist/           stale v0.2.0 build output — not canonical, see source/dist
  README.md       this file
```

## Run in dev (web preview)

```powershell
cd .\source
npm install
npm run dev
```

Opens `http://localhost:5174/`. Vault defaults to browser `localStorage` via the `LocalAdapter` fallback since Electron isn't running.

## Run as Electron desktop app

```powershell
cd .\source
npm install
npm run electron:dev
```

Spawns Vite + Electron side-by-side. Vault lives on real disk in a folder you pick (defaults to `~/Documents/JotFolio`).

## Build production installers

```powershell
cd .\source
npm run electron:build
```

Produces platform-specific installers under `source/dist-electron/`. Requires code-signing secrets for macOS + Windows — see `docs/build/code-signing.md`.

## Run tests

```powershell
cd .\source
npm test
```

84 tests across parsers, onboarding, adapters, frontmatter parser, plugin host, security hardening, and snapshot retention.

## Run benchmarks

```powershell
cd .\source
npm run bench                      # run against baseline, fail if regression > 15%
npm run bench:update-baseline      # run + commit new baseline
```

14 metrics. Baseline at `source/bench/baseline.json`.

## Terminology

JotFolio was built across multiple runtimes. When referring to them:

- **Claude.ai** — the web chat at claude.ai (where JotFolio was born as an artifact)
- **Claude Code** — CLI coding agent in the terminal (most of the v0.3.0 → v0.4.1 work)
- **Claude in Edge** — browser-extension Claude (for browsing tasks)
- **Codex** — OpenAI's coding agent (parallel track)

## Sibling folder

`C:\Users\gavin\OneDrive\Desktop\JotFolio Archive\` — historical snapshots:

- `JotFolio-v0.1.0-ARCHIVED/` — initial snapshot
- `JotFolio-v0.1.0-ARCHIVED.7z` — same, compressed
- `JotFolio-v0.2.0-ARCHIVED/` — onboarding/activation release
- `JotFolio-dev-branch-v0.2.0-cosmograph-ARCHIVED/` — divergent dev branch where the Cosmograph force-sim work happened before the pivot

Nothing in `JotFolio Archive/` is canonical. Reference only.

## Current state

- Version: **0.5.0-alpha.7** (see `docs/CHANGELOG.md` + `docs/PATCH_NOTES.md`)
- Tests: 84/84 passing
- Build: clean, 431 KB (gzip 130 KB)
- Bench: first baseline committed, all targets met
- Electron: scaffolded, never run by user — first run pending

## Telemetry

JotFolio supports **opt-in** crash telemetry via Sentry. It is **off by default**. When you enable it in Settings → Privacy:

- Only crash signal is sent: exception name, sanitized stack frame, app version, platform
- **No** note content, vault paths, file titles, frontmatter, IP, cookies, or request headers
- Source paths in stack traces are sanitized to repo-relative
- Without a configured DSN env var, the telemetry module makes zero network calls (it's lazy-loaded so opted-out users don't even ship the SDK in their bundle)

To disable after enabling: Settings → Privacy → Crash reports → Off. Or unset `SENTRY_DSN` in the build environment to compile telemetry out entirely.

This is the single SlateVault-charter exception to "no external content shipping" — see `slatevault_vibe_prompt.md` memory § Telemetry exception for the conditions.

## What's next

See `docs/plans/jotfolio-electron-pivot.md` for the v0.5.0 backlog — sandboxed plugin host, command palette, quick switcher, folder tree, real git sync, a11y fixes, web build, Capacitor mobile.
