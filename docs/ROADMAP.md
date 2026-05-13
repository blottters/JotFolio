# JotFolio — Roadmap

Last updated: 2026-05-11
Current version: v0.5.0-alpha.25 (shipped 2026-05-07)
North-star milestone: **public beta of v0.5.0**

This file replaces the stale `docs/adr/TASKS.md` (Phase 2–7 of the original Electron pivot — those phases all shipped between v0.4.0 and v0.5.0-alpha.22).

---

## ASAP — Blocks the public beta

These five items gate the v0.5.0 beta. None can be skipped. Order matters because some unlock the next.

### 0. Human-only async — START NOW (run in parallel with everything below)

These have lead time outside your control. Kick them off this week so they finish in time for alpha.27.

- [ ] **Apply to SignPath OSS** at https://about.signpath.io/foundation — free for open-source, weeks to approve. Blocks alpha.27 signed installer.
- [ ] **Sketch the JotFolio brand mark / logo concept.** Blocks alpha.27 favicon + app icon.
- [ ] **Open GitHub Discussions** on the repo. Post a "beta testers wanted" thread. Cross-post to r/Obsidian, r/PKMS, r/SelfHosted when beta.1 ships.

### 1. alpha.23 — Onboarding redesign — needs your design input

Multi-step welcome flow for new users.

- Vault picker
- Sample-vault offer (so they're not staring at empty space)
- First-entry walkthrough
- Constellation tour
- Settings tour

**Why you specifically:** the flow shape is a design call, not a mechanical build. Brainstorming skill is the right entry point. Once shape is locked, subagents can build it.

### 2. alpha.24 — Bundle code-split — can be autoshipped

Lazy-load Constellation, Editor, Settings, modals, plugin worker. Target: under 400 KB initial bundle.

Mechanical work. Subagents can ship it via the standard release flow. **One human check:** verify Suspense fallbacks don't flicker in the packaged Electron app (file:// loading behaves differently from Vite dev server).

### 3. alpha.25 — Vault zip export — ALREADY SHIPPED 2026-05-07

Listed for completeness. First end-to-end autonomous Cron-fired ship. 21 minutes start-to-finish.

### 4. alpha.26 — Accessibility pass — needs your ears

Walk through the app with:
- NVDA (screen reader)
- Narrator (Windows built-in)
- 200% and 400% zoom
- Keyboard only (no mouse)

**Why you specifically:** screen reader behavior is judged by listening, not reading. Subagents can fix issues you find, but can't run the test.

### 5. alpha.27 — Brand + signed installer — blocked on outside approvals

- Real favicon
- App icon set (Windows .ico, future Mac .icns, Linux .png)
- SignPath OSS certificate wired into the CI release workflow

Cannot ship until SignPath approval lands AND brand mark is decided. That's why item 0 is at the top of this list.

### 6. alpha.28 — Cross-platform (optional, recommend skipping for first beta)

macOS + Linux installers. macOS requires an Apple Developer ID ($99/year). Recommendation: Windows-only for the first beta, add others after you have real users.

### 7. alpha.29 — Vault format freeze + final dependency upgrade

Last alpha before beta. Once a user has been writing real notes in this format, the schema can't change without a migration plan. Your sign-off required.

### 8. beta.1 through beta.5 — Bugfix-only soak

Pure bugfix releases. No new features. 14 days with zero Priority-0 or Priority-1 bugs reported = green light to drop the `prerelease` tag and ship v0.5.0 as a real version.

---

## Next steps — After v0.5.0 ships

### v0.6 — Karpathy Phase 6/7 + mobile + small Constellation upgrade

- **Karpathy Phase 6 — Context Packs.** Click a button, get a compact markdown bundle of relevant facts, decisions, procedures, project state, open questions, source evidence, and stale-knowledge warnings. Ready to paste into an external AI tool.
- **Karpathy Phase 7 — Controlled agent-write governance.** Rules for letting AI helpers write back into your vault. Provenance required, confidence required, lock protection, review-after handling, dry-run mode. No agent writes happen yet — this is the rules engine that gates them when they do.
- **Mobile via Capacitor.** iOS + Android builds talking to the same vault folder via cloud sync.
- **Constellation discovery mode.** A 4th layout: pure force-directed (no tag or date weighting), so links between notes shape the picture. Finds surprising connections.
- **Keyword Library Phase 1.8.** Small polish — add `--warn` theme token and sweep one hardcoded amber hex out of `KeywordRulesPanel`.

### v0.7 — Semantic layer + UI upgrades

- **MiniLM Phase 2 — on-device semantic understanding.** Bundle a 50 MB ONNX (Open Neural Network Exchange — a format for ML models) at install time so the app understands what notes *mean*, not just what words they contain. Powers: universal semantic search, smart wikilink suggestions while typing, similar-notes panel, smart tag suggestions, auto-clustering, untagged-note batch classifier, semantic edges on the Constellation view, wikilink ambiguity resolver, plus six more secondary features.
- **Workshop / Library dual-mode shell.** Toggle between the current categorical sidebar and a file-tree-always-visible layout. New users get categories; power users get the tree.
- **CodeMirror live-preview editor.** Type `# heading` and it actually looks like a heading right there in the editor, not just in a separate preview pane.

### v0.8 and later — Differentiator features

- **Founder-trained personalized classifier.** Train a small ML model on Gavin's actual tagged notes via HuggingFace AutoTrain. Bundle the result with the app so new users get a pre-tuned tagger. Defensible moat — generic Obsidian clones can't ship this.
- **Cosmography Constellation rebuild.** The full 4-level scale stack: Deep Field → Galaxy → System → Observatory. Stable galaxy IDs across all four zoom levels. Gravitational lens, accretion disk for AI-candidate links, nebulae prompting "name this theme," voids prompting bridge notes, dark-matter toggle, filaments at wide zoom. Vision is locked; plumbing is not built. Aesthetics started landing in alpha.19 / alpha.20.
- **Authored Constellations ("Expeditions").** Named flight paths through your library that you can save and share. Concept is locked; mockup is pending.

### v1.x — Plugin ecosystem maturity

Plugin API expansion: ribbon (toolbar buttons), settings panels, custom views, OAuth login storage, secure keychain access, webhooks, AI tool surfaces, MCP (Model Context Protocol — a standard for AI tools to call external services), schedulers, notifications, clipboard. Each added carefully because each is a new attack surface.

### Post-launch — Web build

`WebFsaAdapter` using the File System Access API (a browser feature that lets a web page read and write a folder on your hard drive with your permission). Adapter shape is already defined. Implementation hasn't started.

---

## Carried backlog — No deadline, do whenever

These are real but not urgent. Pick them up between feature alphas or during repo-hygiene passes.

### Security follow-ups

- [ ] Add `realpath` check in `src-electron/main.js:resolveSafe` to catch symlink shenanigans
- [ ] Mirror that same check in the snapshot restore path
- [ ] Tighten Content Security Policy — drop `connect-src *`, revisit `'unsafe-eval'` in the plugin loader
- [ ] Wrap `marked.parse()` output with DOMPurify before insertion into the DOM

### Performance

- [ ] Investigate why these benchmark targets regressed: `frontmatter-roundtrip`, `search-5k`, `backlink-rebuild-1k`, `vault-scan`
- [ ] Build an incremental backlink rebuild + full-text search index — only if the current linear scan stops fitting in the performance envelope

### Maybe-someday

- [ ] Real Git Sync as a proper plugin via a new `git:*` IPC channel + spawn subprocess. The fake stub was killed in alpha.25. A real implementation can come back if user demand justifies the maintenance cost.

---

## Rejected — Locked decisions, do not revisit unless something fundamental changes

These were considered, sometimes specced, sometimes half-built, then cut. The reasons are documented so future-you doesn't re-litigate them.

| Rejected | Reason |
|---|---|
| Score Constellation (library as musical staff) | Notes pile up in bursts, not evenly — view would look empty most of the time. Source code preserved at commit `f86e6f1` for a future music or habit-tracker app. |
| URL auto-fill on entry add | Keyword Library handles this for every entry type, not just URL-based ones. |
| 3D rotational Orrery view | Rotation breaks the mental map of where things are. |
| VM2 plugin sandbox | Known sandbox escapes. Web Workers are safer. |
| Turborepo / Nx monorepo from day one | Overhead unjustified. Revisit only if the plugin SDK becomes a separately publishable package. |
| JSON sidecar files for entry metadata | Doubles the file count, confuses external tools. The YAML header inside the `.md` works fine. |
| Generic RAG database as the Karpathy alternative | The whole point of Karpathy framing is *not* opaque retrieval. The compiled-wiki model is governable and inspectable; a RAG DB is neither. |
| Embedded AI in the app runtime | AI-ready, not AI-dependent. The app owns structure and lifecycle; AI agents visit through plugins. |
| Persisting the `links` array in frontmatter | Derived data causes Git merge conflicts on synced vaults. Always recompute from the body. |
| Telemetry without scrubbing | Permitted only with five strict conditions: opt-in, scrubbed PII, DSN-gated, lazy-loaded, README-documented. |
| "Picture This" mockup gallery | Pure visual theatre with no working buttons. Removed during cleanup. |
| Git Sync as an official plugin (the original stub) | It logged sync intent but did no real Git operations. Worse than not having it. Killed in alpha.25. |

---

## Locked architecture — Do not change without an ADR amendment

| Decision | Where |
|---|---|
| Monorepo layout — single src tree, no Turborepo | ADR-0001 |
| VaultAdapter interface — single contract across platforms | ADR-0002 |
| Plugin API v0 — four surfaces only: vault, commands, events, http.fetch | ADR-0003 (amended by A.2 to add Web Worker sandbox) |
| IPC channel map — namespaced, path-canonicalized, allowlist-enforced | ADR-0004 |
| Frontmatter schema — UUID v4 id, derived links, atomic writes | ADR-0005 |
| Karpathy Phase 4 locks — djb2 hash, block-on-collision, pure compile function | `docs/superpowers/specs/2026-05-07-rip-git-sync-zip-export-design.md` and `2026-05-04-karpathy-phase-4-locks-design.md` |
| Charter rules — no external CDN, no AI in shipped product, JSX (never TSX), 1800-line soft cap, no stubs as features, no UI without engine | `CONTEXT.md` |

---

## Maintenance — Files to delete after this roadmap is committed

- `docs/adr/TASKS.md` — Phase 2–7 task list from 2026-04-23. All those phases shipped. Delete or move to `docs/_archive/`. **Decision needed: which?**

---

## How to use this file

- **Working on the next alpha?** Look at the "ASAP — Blocks the public beta" section. Pick the lowest-numbered item not yet shipped.
- **Sizing up "what could we do next quarter?"** Look at the "Next steps — After v0.5.0 ships" section.
- **Wondering "did we already decide on X?"** Check "Rejected" first, then "Locked architecture."
- **Auto-running an unattended ship?** This file + `CONTEXT.md` + `AI_AGENT_GUIDE.md` is the agent's complete bootstrap.
