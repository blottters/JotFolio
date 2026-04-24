# Wireframe 01 — First Run / Vault Picker

**Goal:** Get the user into a vault in one decision. No account, no config, no choice paralysis.
**Primary action:** Create new vault (default path pre-filled).
**Secondary actions:** Pick existing folder, learn what a vault is.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [native window chrome — see wireframe 12]                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│                                                                           │
│                         JotFolio                                          │
│                    ─────────────────────                                  │
│                    Your notes live on disk,                               │
│                    in a folder you own.                                   │
│                                                                           │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │  Create a new vault                                              │    │
│   │  ─────────────────────────────────────────────────────────────  │    │
│   │  Folder: ~/Documents/JotFolio          [Change...]              │    │
│   │                                                                  │    │
│   │                      [ Create vault ]                           │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │  Open an existing vault                                          │    │
│   │  ─────────────────────────────────────────────────────────────  │    │
│   │                                                                  │    │
│   │                    [ Choose folder... ]                         │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│                    What is a vault?  (inline expander)                    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

**"What is a vault?" expander content (shown inline, no modal):**
> A vault is a folder on your Mac or PC. JotFolio reads and writes plain `.md` files inside it.
> Your files are yours — open them in any text editor, sync with Git, or move them any time.

---

## States

### Happy path — Create new vault
1. Screen loads. "Create a new vault" card shows. Folder path is pre-filled: `~/Documents/JotFolio`.
2. User clicks **[Create vault]**.
3. App calls `vault.mkdir()` on the folder path, then calls `vault.pick()` with the created path set as initial.
   - If `~/Documents/JotFolio` already exists: proceed, do not error.
   - If parent `~/Documents` is not writable: skip to error state (write permission).
4. Vault opens. Main layout (wireframe 02) replaces this screen. No animation needed.

### Happy path — Open existing folder (has .md files)
1. User clicks **[Choose folder...]**.
2. Native folder picker opens (`vault.pick()` → `vault:pick` IPC).
3. User selects a folder and confirms.
4. App runs `vault.list()` on the chosen path.
5. If count ≥ 1:

```
┌─────────────────────────────────────────────────────────────────┐
│  Open an existing vault                                          │
│  ─────────────────────────────────────────────────────────────  │
│  ~/Documents/my-notes                                            │
│                                                                  │
│  ✓  Found 47 notes                                               │
│                                                                  │
│                      [ Open this vault ]                        │
│                          [Change...]                             │
└─────────────────────────────────────────────────────────────────┘
```

6. User clicks **[Open this vault]**. Main layout appears.

### Edge case — Folder has no .md files
After picker returns, `vault.list()` returns empty array.

```
┌─────────────────────────────────────────────────────────────────┐
│  Open an existing vault                                          │
│  ─────────────────────────────────────────────────────────────  │
│  ~/Documents/empty-folder                                        │
│                                                                  │
│  ⚠  No .md files found in this folder.                          │
│     This vault will start empty — that's fine.                  │
│                                                                  │
│                      [ Open this vault ]                        │
│                          [Change...]                             │
└─────────────────────────────────────────────────────────────────┘
```

The warning is advisory. User can still open it. Do NOT block them.

### Edge case — Folder without write permission
`vault.pick()` returns the path. App attempts a probe write (`vault.write('.jotfolio/.probe', '')`) and catches `VaultError('access-denied')`.

```
┌─────────────────────────────────────────────────────────────────┐
│  Open an existing vault                                          │
│  ─────────────────────────────────────────────────────────────  │
│  /Volumes/Backup/notes                                           │
│                                                                  │
│  ✗  JotFolio can't write to this folder.                        │
│     Check folder permissions or choose a different location.    │
│                                                                  │
│                      [Choose folder...]                          │
└─────────────────────────────────────────────────────────────────┘
```

The "Create new vault" card remains unchanged above. User can switch to it.

### Edge case — User cancels the folder picker
`vault.pick()` returns `null` (per ADR-0002: must not throw on cancel).
UI reverts to initial state silently. No error message shown.

### Loading state — vault.list() in progress
Between folder selection and file count display, show a spinner inside the "Open existing" card:

```
│  ~/Documents/my-notes                                            │
│                                                                  │
│  Scanning...  ●●●                                                │
```

Timeout: if `vault.list()` does not resolve in 5s, show:
```
│  ✗  Took too long to scan this folder. It may be very large     │
│     or inaccessible. Try a different location.                   │
│                           [Change...]                            │
```

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Enter | Activate focused button |
| Tab / Shift+Tab | Move focus between buttons |
| Space | Toggle "What is a vault?" expander |

No Escape shortcut — there is nowhere to escape to on first run.

---

## Responsive behavior

**1200w:** Layout as shown above. Two cards side-by-side are fine but stacked vertically is also acceptable.
**900w (minimum):** Both cards stack vertically. Max-width 560px centered. Padding 24px horizontal.

---

## Implementation notes

- The folder path in "Create a new vault" is a read-only text display, not an editable input.
  Clicking **[Change...]** opens the native folder picker, same as the "Open existing" flow.
- After a successful vault open, persist the vault path in Electron's `app.getPath('userData')/config.json`
  so the app can re-open the same vault on next launch without showing this screen.
- On re-launch with a saved vault path: skip this screen entirely. Go directly to main layout.
  If the saved path no longer exists, show this screen again with the error:
  ```
  The vault at ~/Documents/JotFolio could not be found.
  It may have been moved or deleted.
  ```
