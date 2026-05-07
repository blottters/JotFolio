# alpha.25 — autonomous execution handoff

**Date:** 2026-05-07
**Status:** queued for autonomous fire via Cron
**Owner:** Gavin (away during execution)
**Read this entire file before doing any other action.**

## Why you're here

This file fired you via a scheduled Cron prompt while Gavin was away. He cleared his Claude Code context before walking out, so you have NO conversation history. You have:

- This file.
- `CONTEXT.md` at repo root.
- `AI_AGENT_GUIDE.md` at repo root.
- `~/.claude/CLAUDE.md` (global instructions, banned phrases, voice register, code style).
- The full JotFolio codebase at `C:\Dev\Projects\JotFolio`.

That's enough. Don't ask Gavin questions — he's not at the keyboard.

## Mission

**Ship JotFolio v0.5.0-alpha.25.** One alpha. One release. Stop after it ships. Do NOT chain into alpha.26+ — those need Gavin's input.

## Scope

Two changes:

1. **Rip Git Sync stub.**
   - Delete `source/plugins/git-sync/` directory entirely (`git rm -r`).
   - Verify `source/src/plugins/officialPlugins.js` does NOT import or reference `git-sync` (already done in alpha.17 — confirm).
   - Search the codebase for any remaining `git-sync` references and clean them up. Use `grep -rn "git-sync\|gitSync\|git_sync" source/` and report any hits before deleting.

2. **Add "Export vault as zip" button to Settings → Vault.**
   - Place between the existing vault picker and the trash review section.
   - Implements: read every entry via `vault.list()` + `vault.read(path)`, build a single zip in-memory using a tiny pure-JS zip library OR Node's built-in `zlib` + a hand-rolled zip header (zip is simple — DEFLATE per file + central directory).
   - **No new heavy dependencies.** If you must add one, it must be `< 50 KB minified` and have zero transitive deps. The lightweight option: implement zip header writing by hand. Search for "tiny zip pure js" patterns. If you can't ship without a dep, halt and document the blocker — Gavin will decide.
   - Browser fallback: trigger download via `Blob` + `URL.createObjectURL` + `<a download>` click trick.
   - Electron fallback: use existing IPC bridge to write zip to user-chosen path via native `fs.writeFile`. Add a new IPC handler `vault:export-zip` if needed.
   - File name pattern: `jotfolio-vault-export-YYYY-MM-DD.zip`.
   - Below the button, add a small paragraph in `var(--t3)` text: *"Want continuous sync across devices? JotFolio stays out of that game. Use Obsidian Sync, Syncthing, Dropbox, or iCloud Drive on your vault folder."*
   - Add 5-8 unit tests covering: vault listing → zip structure correctness, empty-vault edge case, path-traversal safety (entry with `../` in path must error or be sanitized), large-vault smoke (100 fixtures).

## Build order

1. Read `CONTEXT.md` and `AI_AGENT_GUIDE.md` first. Use `Read` tool, do NOT skim.
2. Read `source/src/plugins/officialPlugins.js` to confirm git-sync already absent from the official plugin list.
3. Read `source/src/features/settings/SettingsPanel.jsx` `tab==='vault'` block to understand where the new button goes.
4. Read `source/src/adapters/VaultAdapter.js` to see existing `list` + `read` signatures.
5. Read `source/src-electron/main.js` + `source/src-electron/preload.js` to understand IPC bridge pattern.
6. Write the spec at `docs/superpowers/specs/2026-05-07-rip-git-sync-zip-export-design.md` with concrete file changes + test list. No need to be elaborate; this is for the audit trail.
7. Dispatch parallel subagents:
   - **"git-sync gravedigger"** — delete `source/plugins/git-sync/` + audit references.
   - **"zip wrangler"** — write the zip-builder pure function in `source/src/lib/vaultExportZip.js` + tests.
   - **"settings smith"** — wire the export button + paragraph copy into SettingsPanel. Depends on zip wrangler's exports — coordinate or do serially.
8. Integrator (you): wire IPC handlers if Electron path needed, run full test suite, verify build, run live verification via Claude Preview if a preview server is available.

## Standard release flow (do every step)

Follow `AI_AGENT_GUIDE.md` § Standard Release Flow exactly. Numbered there. Includes:
- Bump `source/package.json` + `source/package-lock.json` to `0.5.0-alpha.25`.
- Add CHANGELOG entry under `## [0.5.0-alpha.25] — 2026-05-07`.
- Commit, tag `v0.5.0-alpha.25`, push tag, push commits to `release/0.5.0-alpha.25` branch.
- Open PR via `gh pr create`.
- Wait for CI green (poll every 30s, max 12 min).
- Resolve any review threads (CodeQL bots may comment).
- `gh pr merge <num> --squash --delete-branch --admin`.
- Run `gh release edit v0.5.0-alpha.25 --prerelease`.
- Verify GitHub Release page shows installer + blockmap + latest.yml + isPrerelease=true.

## Known divergence pattern (you WILL hit this)

After `git push origin v0.5.0-alpha.25` + `git push origin master:refs/heads/release/0.5.0-alpha.25`, the PR may show as `CONFLICTING` because previous releases were squash-merged on origin/master, but local master has individual commits. Fix:

```bash
cd "C:/Dev/Projects/JotFolio"
git fetch origin master
git reset --soft origin/master         # keep your alpha.25 changes staged, drop divergent history
git status --short                     # verify only alpha.25 deltas present
git commit -m "release: 0.5.0-alpha.25 — rip Git Sync stub + add zip export"
git push --force-with-lease origin master:refs/heads/release/0.5.0-alpha.25
```

Then re-poll PR. Should now be `MERGEABLE`.

## Verification gates

**Do NOT proceed to commit if any of these fail:**

- `npm test` in `source/` — every test passes (current baseline 628; expect ~636 with 5-8 new zip tests).
- `npm run build` — exit 0, no errors.
- `git status --short` after staging — shows ONLY the intended alpha.25 delta. No mystery files.

**Do NOT mark release prerelease until:**
- PR merged on origin/master.
- GitHub Release v0.5.0-alpha.25 exists with installer asset.

## Hard stop conditions

If ANY of these happen, halt + write a status doc to `docs/superpowers/specs/2026-05-07-alpha-25-halted.md` describing the failure + what state the repo is in. Do NOT push/merge:

- Tests fail and you can't isolate the failure to the changed code in 3 attempts.
- Build fails with an error you don't recognize.
- A subagent reports back with a regression in unrelated tests.
- You need to add a new npm dependency you can't justify under the "< 50 KB minified, zero transitive deps" rule.
- The zip implementation requires more than 200 lines of hand-rolled code (signal that you should use a tiny lib instead — but don't add it without escalation).
- You cannot resolve the PR-conflicting state via `git reset --soft origin/master`.
- CI fails on the PR after force-push.

For every halt, write the status doc + leave repo in clean uncommitted state. Do NOT commit half-work.

## Anti-patterns (don't do these)

- Don't ship alpha.26 / .27 / .29 as a follow-up. Stop after alpha.25.
- Don't change the vault format. Don't touch frontmatter schema.
- Don't add bundling changes (alpha.24's job — separate).
- Don't add onboarding changes (alpha.23's job — separate).
- Don't update CONTEXT.md / AI_AGENT_GUIDE.md unless directly required by the alpha.25 work.
- Don't ask Gavin questions. He's not there.
- Don't run `git push --force` to master directly. Always go via `release/<version>` branch + PR.
- Don't skip the prerelease flag.

## Logging requirement (MANDATORY — write as you work)

**Two log files exist for the audit trail. You MUST update both at three points: start, midpoints, and end.**

1. **Primary log (Desktop, OneDrive-backed):** `C:\Users\gavin\OneDrive\Desktop\JotFolio-alpha-25-automation-log.md`
2. **Mirror (project memory dir):** `C:\Users\gavin\.claude\projects\C--Dev-Projects-JotFolio\memory\alpha-25-automation-log.md`

Both files have a "Live updates" section with `[HH:MM] event` format. **Append timestamped entries to both copies as you work.** Specifically:

- `[HH:MM] cron fired, session woke up` — first entry
- `[HH:MM] read handoff + CONTEXT + AI_AGENT_GUIDE`
- `[HH:MM] dispatched subagents: <names>`
- `[HH:MM] subagent <name> reported: <test count, file count>`
- `[HH:MM] integration complete, npm test: <result>`
- `[HH:MM] npm run build: <result>`
- `[HH:MM] commit + tag pushed`
- `[HH:MM] PR #<num> opened`
- `[HH:MM] CI status: <state>`
- `[HH:MM] PR merged`
- `[HH:MM] release marked prerelease`
- `[HH:MM] DONE — shipped` (or `HALT — <reason>` if hard-stop fires)

Then fill in the **"Final state"** section in BOTH log files at end of run:
- Shipped? Y/N
- Final test count
- Bundle size from build output
- GitHub Release URL
- Halt reason if applicable
- Recommended next session focus for Gavin

## In-repo status doc (separate from logs)

ALSO write a one-paragraph in-repo status doc at `docs/superpowers/specs/2026-05-07-alpha-25-status.md` summarizing the same info. This is the audit trail that ships with the repo (the Desktop log is for Gavin's personal accountability).

Then end your turn. Do NOT chain. Do NOT ScheduleWakeup. Do NOT dispatch additional subagents. Do NOT write further code.

## Voice / register

Caveman full per active session header. Drop articles, fragments OK, short synonyms. Code/commits/PRs in normal English (per CLAUDE.md boundary). Errors quoted exact.

## Subagent dispatch pattern

Per `feedback_subagent_nicknames.md` in agent memory: every subagent gets a fun/inappropriate nickname riffing on its job. Per `pattern_parallel_subagent_dispatch.md`: single message with multiple Agent calls when work is independent. Each subagent gets a self-contained prompt with caveman directive + file paths + acceptance criteria.

## Critical paths in the codebase

- Settings panel block to modify: `source/src/features/settings/SettingsPanel.jsx`, `tab==='vault'` branch around line 470 (verify with grep).
- Vault adapter API: `source/src/adapters/VaultAdapter.js` exports `vault.list()` (returns entries) and `vault.read(path)` (returns string content).
- Electron IPC bridge: `source/src-electron/preload.js` exposes `window.electron.vault.*` to renderer. New IPC needs handler in `main.js` + bridge in `preload.js`.
- Test fixture pattern: see `source/src/lib/compile/manifest.test.js` for an in-memory vault mock pattern.

## Acceptance summary

- [ ] `source/plugins/git-sync/` directory deleted.
- [ ] No remaining `git-sync` / `gitSync` references in `source/`.
- [ ] `source/src/lib/vaultExportZip.js` exists with pure-function zip builder.
- [ ] 5-8 new tests pass, including path-traversal safety + empty-vault + large-vault.
- [ ] Settings → Vault has visible "Export vault as zip" button + sync-fallback paragraph.
- [ ] Live verification (if preview available): clicking button on demo vault triggers zip download.
- [ ] All existing tests still pass.
- [ ] `npm run build` clean.
- [ ] PR merged to master via `release/0.5.0-alpha.25`.
- [ ] GitHub Release `v0.5.0-alpha.25` published with installer + blockmap + latest.yml.
- [ ] Release marked prerelease.
- [ ] Status doc written.

Read this file, then start. Don't reply to Gavin — execute and exit.
