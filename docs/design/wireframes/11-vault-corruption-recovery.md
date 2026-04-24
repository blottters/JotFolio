# Wireframe 11 — Vault Corruption & Recovery

**Goal:** A broken file or folder never crashes the whole app. User can see what broke, open raw text, and recover from snapshots.
**Primary action:** Keep reading/writing healthy notes despite one bad file.
**Secondary actions:** Open raw text, restore from snapshot, quarantine, re-scan vault.

---

## Failure modes covered

1. **Malformed YAML frontmatter** — `---\ntitle: Unclosed [bracket\n---\nbody` — parser throws.
2. **File unreadable** — permission denied, encoding issue, locked by another process.
3. **Missing required field** — e.g., `type:` missing from frontmatter.
4. **Duplicate IDs** — two files share the same UUID.
5. **Orphan wiki-link target** — `[[Foo]]` where no note titled "Foo" exists.
6. **Deleted file still referenced** — note referenced in links array but file gone from disk.
7. **Whole vault unreadable** — folder deleted, permission revoked, disk ejected.

Only 1–6 are per-file. Case 7 is app-level.

---

## Per-file broken state (inside the editor)

```
┌─ notes / broken-frontmatter.md ─────────────────────────────────────────────┐
│  ⚠️  This note couldn't be loaded                                            │
│                                                                              │
│  Reason: Malformed YAML frontmatter at line 3                                │
│          Expected closing quote, got end of block                            │
│                                                                              │
│  The file is still on disk — nothing was deleted.                            │
│                                                                              │
│  [Open raw text]  [Try recovery snapshot]  [Move to quarantine]             │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                              │
│  Raw content (read-only):                                                    │
│                                                                              │
│     ---                                                                      │
│     title: "Unclosed bracket                                                 │
│     tags: [philosophy]                                                       │
│     ---                                                                      │
│     The body of the note is still here.                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

- `[Open raw text]` — opens the `.md` file in system default editor via `app:show-item-in-folder` + OS-level open. User can fix the YAML manually. On next JotFolio focus, re-parse.
- `[Try recovery snapshot]` — shows list of snapshots from `<vault>/.jotfolio/recovery/` with timestamps. Selecting one previews the content, `[Restore]` overwrites current file (confirm first, keep broken version in `<vault>/.jotfolio/recovery/quarantine/`).
- `[Move to quarantine]` — moves file to `<vault>/.jotfolio/recovery/quarantine/<timestamp>-<filename>` and removes from note list. User can inspect later.

**Never auto-delete a broken file.** Preserve user data.

---

## Vault-wide corruption banner

If more than 1 file fails to parse on the same scan, show a persistent banner at top of the app:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  3 notes couldn't be loaded.  [Review issues]  [Dismiss for now]         │
└──────────────────────────────────────────────────────────────────────────────┘
```

`[Review issues]` opens a modal with one row per broken file:

```
┌─ Vault issues ──────────────────────────────────────────────────────────────┐
│                                                                              │
│  📄  notes/broken-yaml.md                                                    │
│      Malformed YAML at line 3                                                │
│      [Open raw] [Recovery] [Quarantine]                                      │
│                                                                              │
│  📄  journals/2026-04-22.md                                                  │
│      Missing required field: type                                            │
│      [Open raw] [Recovery] [Quarantine]                                      │
│                                                                              │
│  📄  videos/deleted-by-mistake.md                                            │
│      Referenced by 2 notes but file not found on disk                        │
│      [Recreate empty] [Remove references]                                    │
│                                                                              │
│                                         [Re-scan vault]  [Close]             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Snapshot model

Snapshots saved to `<vault>/.jotfolio/recovery/<iso-date>/<relative-path>.md`:
- **Frequency:** on every save, write the previous version to snapshot before overwriting. Debounced 60s — if user edits 50 times in a minute, one snapshot covers the period.
- **Retention:** keep last 7 daily, 4 weekly, 3 monthly — Obsidian pattern. Oldest age out.
- **Size cap:** 500MB total. Oldest snapshots deleted first once cap hit.
- **Location:** inside the vault so Git/iCloud/Dropbox sync carries them. Opt-out in Settings > Vault > "Disable recovery snapshots".

Per-file snapshot view:

```
┌─ Recover "On Stoicism" ─────────────────────────────────────────────────────┐
│                                                                              │
│  Select a version to preview:                                                │
│                                                                              │
│  ○ Current (on disk)                      2026-04-23 09:15  — broken         │
│  ● 2026-04-23 09:12                       178 lines         — last good      │
│  ○ 2026-04-23 08:47                       165 lines                          │
│  ○ 2026-04-22 22:03                       160 lines                          │
│  ○ 2026-04-21 14:20                       145 lines                          │
│  ○ 2026-04-20 09:00                       138 lines                          │
│                                                                              │
│  ┌─ Preview ───────────────────────────────────────────────────────────┐    │
│  │ # On Stoicism                                                        │    │
│  │                                                                      │    │
│  │ The practice begins with what you control...                         │    │
│  │ [truncated — 178 lines]                                              │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│                        [Cancel]  [Restore selected version]                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

Restore = copy snapshot over current file; current (broken) file moved to `quarantine/`.

---

## Vault-level failure (case 7)

If the vault folder itself can't be read on app start:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                         ⚠️  Vault not available                              │
│                                                                              │
│         /Users/gavin/Documents/JotFolio                                      │
│                                                                              │
│         This folder couldn't be read.                                        │
│         It may have been moved, deleted, or the drive disconnected.          │
│                                                                              │
│         [Pick a different vault]  [Try again]  [Quit]                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

No side sidebar rendered until resolved. No "last known" notes shown — risks showing stale copies user thinks are live.

---

## Interactions

- Broken-file editor view: body is read-only (can't save edits to a file we couldn't parse). Forces user to pick a recovery action.
- "Recreate empty" on missing file: creates a stub with just the base frontmatter (`id`, `type`, `title` inferred from link text). Lets the old wiki-links resolve instead of dangling.
- Re-scan trigger: `[Re-scan vault]` button in issues modal + auto re-scan on window focus.

---

## Keyboard

- `Esc` inside issues modal — close.
- `Enter` on a row — open raw.
- `Cmd/Ctrl+Shift+R` anywhere — force vault re-scan.

---

## Error telemetry (Phase 6 SRE)

Each corruption event logs:
- error code (per VaultError enum, ADR-0002)
- anonymized path (hash)
- file size
- timestamp

Sent only if user opted in. Never logs file contents.

---

## Implementation notes

- Source: `src/features/errors/BrokenNoteView.jsx` + `VaultIssuesModal.jsx` (new Phase 3/6)
- Broken-file state surfaced via `VaultAdapter.list()` returning `NoteFile[]` including files with `error` field populated (extension to ADR-0002 — flag this to architect)
- Recovery snapshots managed by SRE plugin or main-process module, not a plugin — it's a core guarantee

---

## ADR-0002 conflict flagged

ADR-0002's `list()` returns `NoteFile[]` with `{ path, name, folder, size, mtime }`. This wireframe requires a `{ ...fields, error?: VaultError }` extension so broken files still surface in the list (instead of silently dropping them). Propose updating ADR-0002 with an `error` field or adding a separate `listIssues()` method.
