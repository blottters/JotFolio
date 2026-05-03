# JotFolio — v0.5.0-alpha.12

Local-first mixed-media synthesis vault. JotFolio turns notes, videos, podcasts, articles, journals, and links into portable markdown entries, then helps organize them with user-authored keyword automation, saved views, canvases, and relationship maps. Plugins and AI are supporting layers; the durable product promise is a vault you can inspect, migrate, and keep.

## Product stance

- **Local-first markdown vault:** desktop entries live as `.md` files with YAML frontmatter in a folder the user controls.
- **Mixed-media capture:** one `entry` model covers notes, videos, podcasts, articles, journals, and links.
- **Keyword Library as automation:** user-authored rules tag and link entries without hiding the logic in opaque AI.
- **Synthesis surfaces:** Constellation, Bases, and Canvases help users connect and work across material.
- **Privacy by default:** imports and vault workflows are local-first; crash telemetry is opt-in.

## Layout

```
JotFolio/
  source/         runtime — everything needed to run, build, test, bench
    src/            React UI + lib + adapters + plugins
    src-electron/   Electron main process + preload + updater + telemetry + snapshots
    plugins/        official plugin sources and workflow add-ons
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

433 tests across parsers, onboarding, adapters, frontmatter parser, plugin host, security hardening, vault behavior, plugin behavior, attachments, folder paths, trash behavior, and snapshot retention.

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

- Version: **0.5.0-alpha.12** (see `docs/CHANGELOG.md` + `docs/PATCH_NOTES.md`)
- Tests: **433/433 passing** (`npm test` run locally on 2026-05-03)
- Build: renderer build clean for the alpha.12 workflow-baseline work; unsigned local Windows installer built as `JotFolio-Setup-0.5.0-alpha.12.exe`
- A11y: automated Playwright + axe flow suite passed 5/5 locally on 2026-05-03 against the current alpha line; packaged keyboard/forced-colors/reduced-motion/zoom screenshots were smoke-tested; NVDA is not installed on this machine and Narrator was not launched automatically
- Bench: baseline exists, but the latest local `npm run bench` run failed regression thresholds on 2026-05-02 and should not be described as green until investigated
- Electron: packaged smoke test launched from `app.asar` and reported **0.5.0-alpha.12**; any already-installed desktop copy will not show alpha.12 until the alpha.12 installer is run or auto-update receives a published alpha.12 release

## Telemetry

JotFolio supports **opt-in** crash telemetry via Sentry. It is **off by default**. When you enable it in Settings → Privacy:

- Only crash signal is sent: exception name, sanitized stack frame, app version, platform
- **No** note content, vault paths, file titles, frontmatter, IP, cookies, or request headers
- Source paths in stack traces are sanitized to repo-relative
- Without a configured DSN env var, the telemetry module makes zero network calls (it's lazy-loaded so opted-out users don't even ship the SDK in their bundle)

To disable after enabling: Settings → Privacy → Crash reports → Off. Or unset `SENTRY_DSN` in the build environment to compile telemetry out entirely.

This is the single SlateVault-charter exception to "no external content shipping" — see `slatevault_vibe_prompt.md` memory § Telemetry exception for the conditions.

## What's next

See `docs/plans/jotfolio-electron-pivot.md` for the historical pivot plan plus the current open backlog. The major remaining items are packaged Electron smoke verification, richer trash empty/delete controls, large-import progress/trust cues, useful official workflow plugins, manual accessibility verification, and the broader web/mobile continuity work.
