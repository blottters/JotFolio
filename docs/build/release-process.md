# Release Process

Tagged release → GitHub Actions builds all 3 platforms in parallel → signed installers + auto-update manifests published to GitHub Releases.

---

## Prerequisites (one-time)

- GitHub repo secrets set per `code-signing.md`
- Sentry project created, `SENTRY_DSN` + `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` added to repo secrets
- `package.json` build.publish points at the correct `owner/repo`

## Cutting a release

1. Ensure the branch you are releasing from is green: `npm test`, `npm run build`, and `npm run a11y`.
2. Bump version in `source/package.json` and `source/package-lock.json` following SemVer (`CHANGELOG.md` has bump rules).
3. Update `docs/CHANGELOG.md` — new `[x.y.z] — YYYY-MM-DD` section with `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`, `Security` subsections as applicable.
4. Commit: `git commit -am "release: 0.5.0-alpha.15"`.
5. Tag: `git tag v0.5.0-alpha.15`.
6. Push: `git push && git push --tags`.
7. GitHub Actions picks up the tag, runs `source/.github/workflows/release.yml`, builds signed installers for macOS + Windows + Linux.
8. When done, a GitHub Release has the generated assets attached. Confirm the notes match `docs/CHANGELOG.md`, then publish or edit as needed.

## Pre-release / beta channels

Use tags like `v0.4.0-beta.1`. `electron-updater` respects SemVer pre-release tags — users on stable don't auto-update to betas.

To expose beta channel:
- Settings → Advanced (future) → "Update channel" → `stable | beta`. Default stable.
- Not yet implemented; current default = stable, betas require manual download.

## Hotfix

Bump patch version (`0.4.0` → `0.4.1`), same flow. Packaged clients check roughly 3 seconds after launch and then every 15 minutes while open; downloaded updates install on quit unless the user triggers "Restart now" from the renderer banner.

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

https://github.com/blottters/jotfolio/blob/v0.5.0-alpha.15/docs/CHANGELOG.md#050-alpha15---2026-05-04

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
2. ~3s after launch: `autoUpdater.checkForUpdatesAndNotify()` fires
3. Every 15 minutes thereafter: same check while the app stays open
4. `electron-updater` reads `https://github.com/blottters/jotfolio/releases/latest/download/latest.yml` (Mac: `latest-mac.yml`, Linux: `latest-linux.yml`)
5. Parses version → compares with `app.getVersion()` → if newer exists, starts download in background
6. While downloading, renderer receives `update:status` with `state: 'downloading'`; when complete it receives `state: 'ready'`
7. User quits app → electron-updater replaces the binary → next launch runs the new version

Signatures are verified before the swap. Disabling that check is NOT done.

Windows installer artifacts use `JotFolio-Setup-${version}.exe`; keep that filename aligned with `latest.yml` or updater downloads will fail.

## Renderer update UI

Shipped partially in the current alpha line:
- Download progress banner for `state: 'downloading'`
- Ready-to-install banner with `Restart now`
- Settings > Updates tab with current version, check-now, update status, and error display

Not shipped yet:
- channel selector / update preferences UI

## Disabling auto-update for a specific user

No supported opt-out environment variable exists in the current code. If a disable flag is ever added, document it only after `src-electron/updater.js` actually implements it.
