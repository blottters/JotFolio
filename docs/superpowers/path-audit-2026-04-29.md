# Path Audit — 2026-04-29

**Generated:** 2026-04-29 (Plumber Pat / T1)
**Plan:** `docs/superpowers/plans/2026-04-29-path-cleanup.md`
**Method:** PowerShell `Test-Path` + `Get-Item -Force` + recursive size sum on dirs

## Results

| Path | Exists | Link Type | Last Modified | Size |
|---|---|---|---|---|
| `C:\Dev\Projects\JotFolio` | yes | real-dir | 2026-04-28 15:55:04 | 1,743,166,744 bytes (~1.62 GiB) |
| `C:\Dev\Coding Agents` | yes | real-dir | 2026-04-22 06:47:50 | 801,242,989 bytes (~764 MiB) |
| `C:\Dev\Projects\JotFolio\docs\mockups` | yes | real-dir | 2026-04-29 11:28:15 | 66,037 bytes |
| `C:\Dev\jotfolio` | **no** | n/a | n/a | n/a |
| `C:\Users\gavin\OneDrive\Desktop` | yes | real-dir | 2026-04-29 17:00:57 | 39,591,307,221 bytes (~36.9 GiB) |
| `C:\Users\gavin\OneDrive\Desktop\JotFolio` | **no** | n/a | n/a | n/a |
| `C:\Users\gavin\OneDrive\Desktop\JotFolio.lnk` | yes | .lnk-shortcut | 2026-04-25 19:16:50 | 2,259 bytes |
| `C:\Users\gavin\OneDrive\Documents\JotFolio Vault` | yes | real-dir | 2026-04-29 12:51:16 | 9,376 bytes |
| `C:\Users\gavin\AppData\Roaming\jotfolio` | yes | real-dir | 2026-04-29 13:37:02 | 9,397,944 bytes (~9.0 MiB) |
| `C:\Users\gavin\AppData\Roaming\JotFolio` | yes | real-dir | 2026-04-29 13:37:02 | 9,397,944 bytes (~9.0 MiB) |

## Findings

- **Canonical source `C:\Dev\Projects\JotFolio` confirmed real-dir.** ~1.62 GiB. Last touched 2026-04-28 (alpha.8 work).
- **`C:\Dev\jotfolio` does NOT exist.** The `launch.json` config `jotfolio` pointing here is broken. Safe to delete (handled by T3).
- **`C:\Users\gavin\OneDrive\Desktop\JotFolio` (no `.lnk`) does NOT exist as a real dir.** The `launch.json` config `jotfolio-desktop` pointing at `OneDrive\Desktop\JotFolio\source` is broken (parent dir missing entirely). Safe to delete (T3).
- **`OneDrive\Desktop\JotFolio.lnk` exists** as a shortcut file (2,259 bytes, mtime 2026-04-25). T4 will inspect target. Out of scope here.
- **AppData case-dup confirmed both reachable.** `jotfolio` and `JotFolio` both resolve to identical mtime + identical recursive size (9,397,944 bytes). Strong signal: NTFS is case-insensitive, both names alias the same physical dir. T2 should verify whether deleting one alias is safe (likely both aliases point at one inode — `Remove-Item` on either may delete the dir entirely). Flagging for T2 owner.
- **Vault dir** `OneDrive\Documents\JotFolio Vault` is small (~9 KiB) — looks like demo vault, not user's primary writing.
- **Mockup dir** confirmed at `docs/mockups`, matches launch.json entry.

## Anomalies for plan owners

1. **AppData case-dup:** identical size + mtime suggests single inode behind two-name view. T2 must NOT do a naive `Remove-Item` on one without verifying — could nuke both. Recommend: rename via `Rename-Item` to canonical case (`JotFolio` per Electron defaults) and observe whether the lowercase alias also disappears. If yes, no second delete needed.
2. **Desktop dir size 36.9 GiB** is unrelated noise — OneDrive root captures everything. Not a plan concern.
3. **`.lnk` mtime 2026-04-25** predates current session by 4 days. Whatever it points at hasn't been re-saved this week.
