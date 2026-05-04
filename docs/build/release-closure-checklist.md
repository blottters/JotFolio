# Release Closure Checklist

Use this checklist before calling any JotFolio release, remediation, or GitHub cleanup task complete.

The goal is to prevent vague leftover risks. Every known issue must end in one of four states:

- `Fixed`: verified in code, docs, release assets, installed app, or GitHub settings.
- `Accepted for alpha`: intentionally allowed for this alpha, with the reason written down.
- `Blocked externally`: cannot be completed without something outside the repo, such as a signing certificate.
- `Moved to follow-up`: assigned to a named branch, PR, issue, or explicit next task.

## Version Closure

- Confirm `source/package.json` and `source/package-lock.json` have the same version.
- Confirm the installed desktop app reports the same file version.
- Confirm changelog, patch notes, README, and release docs do not describe an older alpha as current.
- Confirm the git tag is new, immutable, and points at the merged release commit.
- Confirm the GitHub Release title, tag, installer filename, blockmap, and update manifest all use the same version.

## Product Closure

- Confirm user-facing UI matches the behavior that shipped.
- Rename or remove labels that imply unshipped behavior.
- If a visual reference includes a feature that was not built, document it as `Moved to follow-up`.
- Confirm empty states and help text explain what the user can actually do today.

## Test Closure

- Run unit tests.
- Run production build.
- Run automated accessibility checks.
- Run a browser smoke test for the changed workflow.
- For Electron releases, build the installer and smoke the installed app.
- If a test cannot run, classify it as `Blocked externally` or `Moved to follow-up`; do not leave it as a vague risk.

## GitHub Closure

- Check open PRs after merging.
- Close obsolete stale PRs only after confirming they would not add useful current work.
- Keep major dependency upgrades separate from feature releases.
- Merge only maintenance PRs with fresh required checks.
- Leave risky major upgrades open until packaged app testing is complete.

## Security And Signing Closure

- Confirm production dependency audit status.
- Confirm GitHub Actions and CodeQL checks are current.
- If the Windows installer is unsigned, classify it as `Blocked externally` until a code-signing certificate or signing service is configured.
- Do not claim a signed release unless the installer signature was verified.

## Final Report Format

Every final release/task summary should include:

- `Fixed`
- `Accepted for alpha`
- `Blocked externally`
- `Moved to follow-up`
- `Verification`
