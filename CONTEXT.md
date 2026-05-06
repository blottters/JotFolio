# JotFolio — Context

> AI agent or new contributor reading this for the first time? Start here, then [`AI_AGENT_GUIDE.md`](./AI_AGENT_GUIDE.md).

## What JotFolio is

A **local-first, plain-text, vault-centered knowledge workspace** packaged as an Electron desktop app. React 19 + Vite 7 + JSX (never TSX). Notes, videos, podcasts, articles, journals, links, canvases, and relationship mapping.

Vault = a folder on disk the user owns. Markdown files. No database. No servers. No account.

Tagline: **Plain files, your folders, no servers.**

## Locked vocabulary

Use the left column. Don't substitute.

| Use this | Not this |
|---|---|
| **Entry** | Item, document, asset, record |
| **Note** | (Note is one entry type — don't conflate with Entry) |
| **Vault** | Workspace, library, database |
| **Constellation** | Graph view, network view |
| **Smart Views** | Bases, saved searches |
| **Quick Switcher** (Ctrl+O) | File switcher, Go-to |
| **Command Palette** (Ctrl+P) | Action menu |
| **Ribbon** | Activity bar (the 48px icon column at far left) |
| **Sidebar** | Left pane (the 240px folder/views column right of the ribbon) |
| **Detail panel** | Right pane, inspector |
| **Memory entries** | Wiki/review entries (Karpathy LLM Wiki types) |
| **Compile to memory** | "Promote", "convert", "synthesize" |

## Architecture map

| Concern | Source |
|---|---|
| Product direction & full Karpathy plan | [`docs/karpathy-llm-wiki-handoff.md`](./docs/karpathy-llm-wiki-handoff.md) |
| Active design specs (per release) | [`docs/superpowers/specs/`](./docs/superpowers/specs/) |
| Architecture decisions (ADRs) | [`docs/adr/`](./docs/adr/) |
| Wireframes | [`docs/design/wireframes/`](./docs/design/wireframes/) |
| Phase plans | [`docs/phase-plans/`](./docs/phase-plans/) + [`docs/plans/`](./docs/plans/) |
| Performance baselines | [`docs/perf/`](./docs/perf/) |
| Security model | [`docs/security/`](./docs/security/) |
| Build / release process | [`docs/build/`](./docs/build/) |
| Recent shipped state (last 7 alphas) | [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) |
| Older shipped state (pre-alpha.14) | [`docs/CHANGELOG-archive.md`](./docs/CHANGELOG-archive.md) |

## Stack

- **Renderer** — React 19 + Vite 7 + JSX. Inline styles + CSS variables. No Tailwind, no styled-components, no shadcn, no Material.
- **Main process** — Electron with chokidar vault watching, atomic writes, `webSecurity: true`.
- **Persistence** — Markdown files + YAML frontmatter on disk. Recovery snapshots. JotFolio Trash. No database.
- **AI** — BYOK across 7 providers (Anthropic / OpenAI / Gemini / Groq / OpenRouter / Ollama / custom). Telemetry opt-in only.
- **Plugins** — Web Worker sandbox; per-plugin frozen API surface; permission gate per plugin.
- **Tests** — vitest + Playwright a11y. CI on every PR + tag-pushed installer auto-publish.

## Charter rules (binding)

These come from `docs/karpathy-llm-wiki-handoff.md` and `JotFolio-DESIGN.md`. Don't violate without flagging.

- No external CDN, font, or script in any output. Self-hosted assets only.
- No AI/analytics in shipped product (telemetry is opt-in, single charter exception).
- Local-first. Plain-text durable. Frontmatter is YAML.
- Inline styles + CSS variables only. Square corners (Victory `--rd: 0`).
- JSX, not TSX.
- 1800-line soft cap per file. App.jsx grandfathered.
- Hidden features stay behind feature flags until the engine that backs them ships. No UI without engine.
- Don't claim a stub is shipped. Don't claim a mockup is production. Don't claim auto-update is verified before tagging.

## Current source version

See [`source/package.json`](./source/package.json) `version` field. Tag `v<version>` on origin/master = published GitHub Release with installer.

## Repo

`https://github.com/blottters/JotFolio` (capital J, capital F — case matters for electron-updater). Public, MIT licensed.
