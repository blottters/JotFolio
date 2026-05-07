# alpha.25 — rip Git Sync + add zip export

**Date:** 2026-05-07
**Status:** executing
**Owner:** Gavin (autonomous run via Cron)
**Companion:** `2026-05-07-alpha-25-autonomous-execution.md` (parent handoff)

## Why

Git Sync ships as a stub — logs intent to `.jotfolio/sync.log`, no real Git operations. Charter rule: don't ship stubs as features. alpha.17 already removed it from `OFFICIAL_PLUGINS`; the source on disk is the last vestige. Real sync is a v0.7 product question, not v0.5.

Replace with a deterministic, no-server alternative: export the entire vault as a zip the user can sync via any tool they already trust (Syncthing, Dropbox, Obsidian Sync, iCloud).

## Files

### Removed
- `source/plugins/git-sync/` (entire directory).

### New
- `source/src/lib/vaultExportZip.js` — pure zip builder. STORE-only (no DEFLATE) so we don't add a compression dep. Uses Web Crypto for CRC-32 via a tiny precomputed table.
- `source/src/lib/vaultExportZip.test.js` — 5-8 tests.

### Modified
- `source/src/features/settings/SettingsPanel.jsx` — `VaultPanel` gets a new "Export vault as zip" button + sync-fallback paragraph, placed between `<VaultPicker/>` and `<TrashReview/>`.

## Architecture

Pure browser-renderer flow. No new IPC needed — `vault.list()` + `vault.read(path)` + `vault.readBinary(path)` already exist on every adapter (LocalAdapter, NodeFsAdapter).

Renderer code path:
1. Call `vault.list()` to get all NoteFile entries.
2. For each entry, call `vault.readBinary(path)` to get bytes.
3. Build a zip with the STORE method (uncompressed entries) — no DEFLATE means no `pako` or similar dep.
4. Trigger download via `Blob` + `URL.createObjectURL` + synthetic `<a download>` click.

STORE-only zip is bigger on disk than DEFLATE but acceptable: average vault is ≤10 MB, even uncompressed. Tradeoff: zero runtime deps, ~120 lines of JS, test coverage straightforward.

## Zip structure (STORE method, ZIP64 not needed)

Per `Coding-PKZIP-spec` essentials:
- For each file: Local File Header (LFH) + raw file bytes (no compression).
- After all files: Central Directory Header (CDH) for each file.
- After central directory: End of Central Directory Record (EOCD).

CRC-32 needed per file. Implement via a 256-entry lookup table (computed once at module load).

API:
```js
/**
 * @param {Array<{path: string, bytes: Uint8Array}>} entries
 * @returns {Uint8Array} the zip blob
 */
export function buildZip(entries) { ... }
```

Plus a renderer-side helper:
```js
/**
 * @param {VaultAdapter} vault
 * @returns {Promise<Blob>}
 */
export async function exportVaultAsZip(vault) { ... }
```

## Path safety

Reject any entry whose path contains `..` after normalization or starts with `/`. Throw `VaultExportError('path-unsafe', path)`. Tested.

## Tests

In `source/src/lib/vaultExportZip.test.js`:

1. Empty vault → returns valid empty zip (just EOCD).
2. Single file → LFH + content + CDH + EOCD; bytes round-trip via `unzipper` or manual parse.
3. Multiple files → preserves order, all CRCs match.
4. Path traversal — entry with `path: '../escape.md'` → throws `VaultExportError('path-unsafe')`.
5. Absolute path — entry with `path: '/etc/passwd'` → throws `VaultExportError('path-unsafe')`.
6. Large smoke — 100 small files → zip builds in <500ms, structure valid.
7. CRC-32 matches a known fixture (compute against `'hello world'` bytes, expected `0x0d4a1185`).
8. Empty file (zero-byte content) — handled correctly, CRC = 0.

## UI copy

Button text: **Export vault as zip**

Paragraph below button (`var(--t3)` text, fontSize 11):
> Want continuous sync across devices? JotFolio stays out of that game. Use Obsidian Sync, Syncthing, Dropbox, or iCloud Drive on your vault folder.

File name pattern: `jotfolio-vault-export-YYYY-MM-DD.zip`.

## Verification gates

Per parent handoff: `npm test` green, `npm run build` clean, no mystery files in `git status`. PR ships via standard release flow + admin-merge squash + mark prerelease.

## Subagent dispatch

Three parallel:
- **git-sync gravedigger** — delete `source/plugins/git-sync/`, audit residual refs.
- **zip wrangler** — write `vaultExportZip.js` + tests.
- **settings smith** — wire button + paragraph into VaultPanel after zip wrangler exports its function.

Settings smith runs after zip wrangler since it imports `exportVaultAsZip`. Gravedigger is fully independent.
