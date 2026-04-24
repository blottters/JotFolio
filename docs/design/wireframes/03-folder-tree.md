# Wireframe 03 — Folder Tree (Left Sidebar)

**Goal:** Replace type-based navigation with a real filesystem folder tree, while keeping media types and tags accessible.
**Primary action:** Navigate to a folder, expand/collapse tree nodes.
**Secondary actions:** Create folder, rename (F2), delete, drag note between folders.

---

## Position

Folder tree occupies the upper section of the left sidebar (240px default width). Below it: Smart Views section. Below that: Tags section. Fixed [+ New] button at bottom.

---

## Layout

```
┌──────────────────────────────────────────────────┐
│ My Vault                                    [←]  │  ← vault name + collapse toggle
│ ──────────────────────────────────────────────── │
│                                                  │
│  FOLDERS                              [⊕ folder] │  ← section header + new folder button
│                                                  │
│  ▼ 📁 notes              (12)                    │  ← expanded folder
│      📄 On stoicism                              │  ← file row
│      📄 Reading list                            │
│      ▶ 📁 philosophy      (4)                   │  ← collapsed subfolder
│      📄 Untitled                                │
│  ▶ 📁 videos              (8)                   │  ← collapsed folder
│  ▶ 📁 podcasts            (3)                   │
│  ▶ 📁 journals            (31)                  │
│  ▶ 📁 articles            (7)                   │
│    📄 loose-note.md        —                    │  ← vault-root file (no folder)
│                                                  │
│  SMART VIEWS                                     │
│  ── ★  Starred            (5)                   │
│  ── 🕐 Recent            (20)                   │
│  ── 🔗 Unlinked           (3)                   │
│                                                  │
│  TAGS                                            │
│  ── #reading              (11)                  │
│  ── #work                  (7)                  │
│  ── #philosophy             (4)                 │
│  ── #feynman                (1)                 │
│                              [show all tags...] │
│                                                  │
│ ──────────────────────────────────────────────── │
│ [+ New note]                                     │
└──────────────────────────────────────────────────┘
```

---

## Tree node anatomy

**Folder row:**
```
  [▶/▼] [📁 icon] [folder name]    [(count)]   [···]
```
- `▶` = collapsed, `▼` = expanded. Clicking the chevron OR the folder name toggles expand/collapse.
- `(count)` = number of `.md` files recursively within that folder. Shown in `--t3` color. Hidden when zero.
- `[···]` = context menu button, visible on hover only.

**File row:**
```
       [📄 icon] [note title]
```
- Indented 16px per nesting level.
- Title comes from frontmatter `title` field (not filename).
- Clicking the file row selects it and populates the file list / center pane.
- Currently selected file row is highlighted with `--cd` background + `--ac` left border (2px).

---

## Interactions

### Expand/collapse
- Click chevron or folder name to toggle.
- State persisted to `<vault>/.jotfolio/ui-state.json` under key `expandedFolders: string[]`.
- Keyboard: when focus is on a folder row, Right arrow expands, Left arrow collapses (if expanded) or moves focus to parent (if collapsed).

### Create folder
- Click `[⊕ folder]` button in section header, OR right-click any folder → "New folder".
- A new row appears inline, in edit mode:
  ```
  ▼ 📁 notes
       📁 [__________________]   ← inline text input, auto-focused
  ```
- Input is placed inside the currently selected folder, or at root if nothing is selected.
- Pressing Enter commits. Pressing Escape cancels and removes the inline row.
- On commit: calls `vault.mkdir('notes/new-folder-name')`. If name is empty, cancels.
- Duplicate name: shows inline error: "A folder with that name already exists."

### Rename (F2)
- Select a folder or file row, press F2 (or right-click → Rename).
- The name text becomes an inline editable field in-place:
  ```
  ▶ 📁 [philosophy_________]
  ```
- Enter commits. Escape cancels.
- On folder rename: calls `vault.move('notes/old-name', 'notes/new-name')`. All child paths update.
- On file rename: renames the file on disk. Title in frontmatter is NOT automatically updated. (Rationale: filename and title are deliberately decoupled per ADR-0005. Warn the user: "This renames the file on disk. The note's title stays unchanged.")
  Warning shown inline below the rename field:
  ```
  ⓘ  Renaming the file doesn't update the note's title. Edit the title inside the note.
  ```

### Delete
- Right-click → Delete, or select + Delete key.
- Inline confirmation replaces the row (not a modal — see global rules):
  ```
  Delete "philosophy"? This removes 4 notes from disk.
  [Delete]   [Cancel]
  ```
- On confirm: calls `vault.remove()` on each file in the folder recursively, then `vault.remove()` on the folder itself. (Note: per ADR-0002, `vault.remove()` only removes files. Folder removal needs a separate IPC channel not yet in ADR-0004. See ADR conflict below.)
- Deletion is immediate. No trash. Warn user with bold text: "This cannot be undone."

### Drag note between folders
- Drag a file row and drop it onto a folder row.
- While dragging: the file row shows 50% opacity. Hovered folder row shows `--ac` highlight border.
- On drop: calls `vault.move(oldPath, newFolder + '/' + filename)`.
- Cannot drag folders (v0 scope — too many edge cases with recursive moves). Folders have `draggable="false"`.
- Cannot drag onto Smart Views or Tags (they are read-only computed views).

### Context menu (right-click or [···] button)
**On folder:**
- New note here
- New folder here
- Rename (F2)
- Reveal in Finder / Show in Explorer
- Delete

**On file:**
- Open note
- Rename file (F2) — with warning about title decoupling
- Move to folder... (opens folder picker within the tree)
- Reveal in Finder / Show in Explorer
- Delete

---

## Media types — how they are surfaced

**Decision: Default type-based folders + Smart Views. Not virtual folders.**

The ADR-0005 default file naming (`notes/`, `videos/`, `podcasts/`, etc.) means media types land in their own real folders automatically. The folder tree shows them as real folders. No virtual folder layer needed.

For users who reorganize their vault (move videos into a `research/` folder), the Smart Views fill the gap:
- Smart Views filter by frontmatter `type` field. "Videos" smart view = all entries where `type: video` regardless of folder.
- Smart Views are listed below the folder tree, not mixed into it.
- v0 Smart Views are hardcoded: Starred, Recent, Unlinked. Type-based smart views (All Videos, All Podcasts) are a v1 addition — they require a smart view config UI.

This is a deliberate ADR-0005 alignment: the folder is a user-controlled location, the `type` field is the machine-readable type. Both are true simultaneously. The UI respects both.

---

## Tags

- Tags section shows tags derived from frontmatter `tags:` arrays across all notes.
- Sorted by frequency (most-used first), max 6 visible, then "show all tags..." link.
- Clicking a tag sets the file list filter to that tag.
- Tags are not editable from the sidebar — edit them inside the note's frontmatter.
- No tag nesting in v0. `#parent/child` syntax is stored as a single flat tag string.

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Arrow Up/Down | Move focus between rows |
| Right arrow | Expand folder (if collapsed) |
| Left arrow | Collapse folder (if expanded) / move to parent |
| Enter | Open selected note / toggle folder |
| F2 | Rename selected item |
| Delete | Delete selected item (with inline confirmation) |
| Ctrl/⌘+Shift+N | New folder (in currently focused folder) |

---

## States

**Loading:** Skeleton tree (3 placeholder folder rows, shimmer animation).
**Empty vault (no folders):** Shows only the root with `[+ New note]` and `[⊕ folder]` visible.
**Search active (toolbar search in use):** Folder tree is still visible but all nodes that contain no matches are visually dimmed (`opacity: 0.4`). Matched nodes stay full opacity.

---

## ADR Conflict — Folder Deletion

**Flagged conflict with ADR-0002 and ADR-0004.**

ADR-0002 specifies: `vault.remove(path)` deletes a single file only. "Does NOT recursively delete directories."
ADR-0004's channel table has no `vault:rmdir` channel.

Folder deletion UX (described above) requires recursive removal. Two options:
1. Add `vault:rmdir` IPC channel that takes `{ path: string, recursive: boolean }`.
2. Have the renderer call `vault.remove()` on each file individually, then call a new `vault.rmdir()` that removes the now-empty directory.

**Proposed ADR-0002 update:** Add `rmdir(path)` to VaultAdapter interface — removes an empty directory only (not recursive). The renderer is responsible for emptying it first via `vault.remove()` calls. This keeps the adapter atomic operations simple and puts orchestration in the feature layer, consistent with the existing interface philosophy.

**Proposed ADR-0004 update:** Add `vault:rmdir` to channel table: `{ path: string }` → `{}`. Subject to same path-traversal checks. Does not delete non-empty directories (errors with `io-error` + detail "Directory not empty").

---

## Responsive behavior

**1200w:** Full sidebar as shown.
**900w:** Sidebar collapses to 40px icon rail. Clicking the folder icon on the rail opens the sidebar as a side-drawer overlay (z-index above center pane, closes on outside click or Escape).
