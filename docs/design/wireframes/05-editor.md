# Wireframe 05 — Editor (Center Pane, Note Open)

**Goal:** Read and write a note. Frontmatter visible but non-distracting. Backlinks reachable without leaving the editor.
**Primary action:** Edit note body.
**Secondary actions:** Toggle frontmatter, switch render/edit mode, follow wiki-links, view backlinks.

---

## Layout — Edit mode

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─ Toolbar ────────────────────────────────────────────────────────────┐   │
│  │ 📁 notes / philosophy  >  On Stoicism     [Edit] [Preview]  [···]    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Frontmatter panel (collapsed by default) ───────────────────────────┐   │
│  │ ▶  Frontmatter  —  type: note  · tags: #philosophy #reading  · ★    │   │  ← collapsed bar
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Editor body ────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  # On Stoicism                                                        │   │
│  │                                                                       │   │
│  │  The practice begins with what you control.                           │   │
│  │  Marcus Aurelius writes in [[Meditations]] that…                      │   │  ← wiki-link
│  │                                                                       │   │
│  │  ## Core practices                                                    │   │
│  │                                                                       │   │
│  │  - Negative visualization                                             │   │
│  │  - The view from above                                                │   │
│  │  - Amor fati                                                          │   │
│  │                                                                       │   │
│  │  █                                                                    │   │  ← cursor
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Backlinks bar (collapsed) ──────────────────────────────────────────┐   │
│  │ ▶  3 notes link to this                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Frontmatter expanded

```
  ┌─ Frontmatter panel (expanded) ───────────────────────────────────────┐
  │ ▼  Frontmatter                                                        │
  │                                                                       │
  │  Title    [On Stoicism_____________________________________]          │
  │  Type     note  (read-only — changing type is a delete+recreate)     │
  │  Tags     [#philosophy ×]  [#reading ×]  [+ add tag]                 │
  │  Status   [active ▼]                                                  │
  │  Starred  [☑]                                                         │
  │  Created  2026-04-20 14:30  (read-only)                              │
  │  Modified 2026-04-23 09:15  (read-only — auto-updated on save)       │
  │  ID       550e8400-...  (read-only)                                   │
  │                                                                       │
  └───────────────────────────────────────────────────────────────────────┘
```

**Frontmatter is folded by default. Rationale:** Users spend 90% of time in the body. The frontmatter is metadata infrastructure — relevant when you need it, invisible when you don't. The collapsed bar shows enough context (type + key tags + star) to confirm you're in the right note without requiring expansion.

**Editing frontmatter fields:**
- Title: inline text input. On Enter or blur: updates the `title` field in frontmatter and calls `vault.write()`. Does NOT rename the file (per ADR-0005: title and filename are decoupled).
- Tags: tag-pill input. Type to add, click `×` to remove. Saves on blur.
- Status: dropdown. Options: active, archived, inbox, (custom free-form text option at bottom).
- Starred: checkbox.
- Type, Created, Modified, ID: read-only displays. Not editable inline.

---

## Layout — Preview mode

```
  ┌─ Toolbar ────────────────────────────────────────────────────────────┐
  │ 📁 notes / philosophy  >  On Stoicism     [Edit] [Preview]  [···]    │
  └──────────────────────────────────────────────────────────────────────┘

  ┌─ Rendered content ──────────────────────────────────────────────────┐
  │                                                                      │
  │  On Stoicism                                                         │  ← rendered H1
  │  ─────────────────────────────────────────────────────────          │
  │                                                                      │
  │  The practice begins with what you control.                          │
  │  Marcus Aurelius writes in Meditations that…                         │  ← wiki-link rendered as link
  │                                                                      │
  │  Core practices                                                      │  ← rendered H2
  │                                                                      │
  │  • Negative visualization                                            │
  │  • The view from above                                               │
  │  • Amor fati                                                         │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

**Mode switching:**
- `[Edit]` and `[Preview]` are a two-button toggle group in the toolbar.
- Keyboard: Ctrl/⌘+E toggles between edit and preview.
- Default: edit mode. Rationale: this is a writing app, not a reading app. Open in edit mode; let the user switch to preview to check rendering.
- The toggle state persists per-note to `ui-state.json` under `noteViewModes: { [noteId]: 'edit' | 'preview' }`.

---

## Toolbar elements

**Breadcrumb:** `📁 notes / philosophy  >  On Stoicism`
Clicking folder segments navigates to file list for that folder. Clicking the note title: no action (you're already here).

**[Edit] / [Preview] toggle:** See above.

**[···] overflow menu:**
```
┌─────────────────────────┐
│ Copy note link          │  ← copies [[On Stoicism]] to clipboard
│ Open in new pane        │  ← (v1 — deferred)
│ Reveal in Finder        │
│ Export as PDF           │  ← (v1 — deferred)
│ ──────────────────────  │
│ Delete note             │
└─────────────────────────┘
```
"Delete note" shows the same inline confirmation pattern (not a modal).

---

## Wiki-link behavior

**In edit mode:**
- `[[` triggers the wiki-link autocomplete (already in NoteBody.jsx).
- Rendered in editor as blue underlined text using `--ac` color.
- Ctrl/⌘+click on a wiki-link: navigate to that note (load it in place of current note).
- Hover on wiki-link: show tooltip preview of the linked note's first 100 chars.

**In preview mode:**
- Wiki-links rendered as clickable text. Click to navigate.
- Unresolved links (no matching `title` in vault): rendered in `--t3` color with a `?` indicator. Clicking an unresolved link creates a new note with that title.

---

## Auto-save

- Auto-save on 500ms idle after last keystroke. Calls `vault.write(path, fullContent)`.
- Fires `note-save` event (ADR-0003: plugins can subscribe).
- Save status shown in toolbar breadcrumb area: `Saved` (fades out after 2s) or `Saving…` (during write).
- If `vault.write()` throws: show a persistent error banner below the toolbar:
  ```
  ⚠  Could not save. Disk may be full or file may be locked.  [Retry]  [Copy content]
  ```
  "Copy content" copies the full note text to clipboard so the user can paste it elsewhere to avoid data loss.

---

## Frontmatter display detail

**Collapsed bar shows:**
- Fold chevron `▶`
- Label "Frontmatter"
- Type badge: `note` / `video` / etc. in `--b2` background pill
- First 2 tags as colored pills
- `★` if starred (filled `--ac` color)

**Clicking the bar or the `▶` chevron:** Expands the panel. Chevron becomes `▼`.
**Keyboard:** When focus is in the bar, Space or Enter toggles it.

---

## Backlinks bar

See wireframe 06 for detail. Summary here: a collapsed bar at the bottom of the editor, showing a count. Expanding it shows the backlinks list inline below the body.

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/⌘+E | Toggle edit / preview mode |
| Ctrl/⌘+S | Force save immediately (normally auto-save handles this) |
| Ctrl/⌘+Shift+F | Toggle frontmatter panel |
| Ctrl/⌘+Shift+B | Toggle backlinks panel |
| Ctrl/⌘+Click on wiki-link | Navigate to linked note |
| Escape | If frontmatter or backlinks panel has focus, collapse it. Otherwise: deselect note (return to file list). |

---

## States

**Unsaved changes (if auto-save fails):**
A dot indicator appears in the browser tab / window title: `• On Stoicism — JotFolio`.

**Note not found (file deleted externally while open):**
```
┌───────────────────────────────────────────────────────────────────┐
│ ⚠  This file was deleted or moved outside JotFolio.               │
│    Your unsaved changes are preserved below.                       │
│                                                                    │
│                    [Save as new file]   [Discard]                  │
└───────────────────────────────────────────────────────────────────┘
[editor body still shown, editable, unsaved content preserved]
```

**Note externally modified (mtime changed since load):**
```
┌───────────────────────────────────────────────────────────────────┐
│ ⚠  This file was modified by another app.                          │
│                    [Reload from disk]   [Keep my version]          │
└───────────────────────────────────────────────────────────────────┘
```
Triggered by `vault:watch-event` with `type: 'change'` on the open file's path.

---

## Responsive behavior

**1200w:** Editor in center pane. Detail panel at right shows note metadata / backlinks separately (see wireframe 06).
**900w:** Detail panel collapsed. Editor is full-width. Frontmatter and backlinks panels both inline within the editor scroll area.
