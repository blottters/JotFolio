# Release Process

Tagged release → GitHub Actions builds all 3 platforms in parallel → signed installers + auto-update manifests published to GitHub Releases.

---

## Prerequisites (one-time)

- GitHub repo secrets set per `code-signing.md`
- Sentry project created, `SENTRY_DSN` + `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` added to repo secrets
- `package.json` build.publish points at the correct `owner/repo`

## Cutting a release

1. Ensure `master` is green: `npm test`, `npm run build`, and `npm run a11y`.
2. Bump version in `source/package.json` and `source/package-lock.json` following SemVer (`CHANGELOG.md` has bump rules).
3. Update `CHANGELOG.md` — new `[x.y.z] — YYYY-MM-DD` section with `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`, `Security` subsections as applicable.
4. Commit: `git commit -am "release: 0.5.0-alpha.9"`.
5. Tag: `git tag v0.5.0-alpha.9`.
6. Push: `git push && git push --tags`.
7. GitHub Actions picks up the tag, runs `.github/workflows/release.yml`, builds signed installers for macOS + Windows + Linux.
8. When done, a draft GitHub Release exists with all assets attached. Edit release notes (pull from CHANGELOG), then publish.

## Pre-release / beta channels

Use tags like `v0.4.0-beta.1`. `electron-updater` respects SemVer pre-release tags — users on stable don't auto-update to betas.

To expose beta channel:
- Settings → Advanced (future) → "Update channel" → `stable | beta`. Default stable.
- Not yet implemented; current default = stable, betas require manual download.

## Hotfix

Bump patch version (`0.4.0` → `0.4.1`), same flow. Users on `0.4.0` auto-update within 6 hours (our poll interval).

## Rollback

If a release is broken:
1. Immediately delete the release on GitHub (users who already auto-updated cannot be rolled back; offer support instructions).
2. Delete the corresponding `latest.yml` / `latest-mac.yml` / `latest-linux.yml` assets from prior releases that reference the broken version.
3. Re-publish the previous healthy release as `latest` so clients polling pick up the older manifest.
4. Investigate root cause. Tag hotfix. Re-release.

## Release notes template

Paste in the GitHub Release body:

```md
## What's new

<2-5 bullets, user-facing outcomes>

## Fixes

<bugs closed, reference issues>

## Developer notes

<breaking changes, new APIs, deprecations>

## Full changelog

https://github.com/blottters/jotfolio/blob/v0.5.0-alpha.9/CHANGELOG.md#050-alpha9---2026-05-01

## Checksums

<published automatically by electron-builder as .sha256 files alongside installers>
```

## Telemetry: Sentry release tracking

Every tagged release creates a new Sentry release via the `@sentry/cli releases new` step in CI. This:
- Uploads source maps so stack traces resolve to readable files
- Marks the release in Sentry for regression detection
- Links issues to the commit that introduced them (via `git` integration)

If `SENTRY_AUTH_TOKEN` is not set, the step is skipped — no release is created, but the build still succeeds.

## Auto-update flow in detail

1. App starts → `updater.setup(mainWindow)` called in `src-electron/main.js`
2. 30s after launch: `autoUpdater.checkForUpdatesAndNotify()` fires
3. Every 6 hours thereafter: same check
4. `electron-updater` reads `https://github.com/blottters/jotfolio/releases/latest/download/latest.yml` (Mac: `latest-mac.yml`, Linux: `latest-linux.yml`)
5. Parses version → compares with `app.getVersion()` → if newer exists, starts download in background
6. Download completes → renderer receives `update:status` event with `state: 'ready'` → optional UI banner prompts user to restart now
7. User quits app → electron-updater replaces the binary → next launch runs the new version

Signatures are verified before the swap. Disabling that check is NOT done.

## Renderer update UI

Not yet wired in v0 — pure background updates, no banner. Phase 6.5 adds a Settings > Updates tab showing current version + check-now + "restart to update" button. Until then, users get seamless background updates with no interruption.

## Disabling auto-update for a specific user

Users on restrictive networks can set env var `JOTFOLIO_DISABLE_UPDATES=1` before launching. `updater.setup` checks this and no-ops if set. (Implementation detail; add check to `updater.js` if this becomes a real request.)
