# Wireframe 04 — File List (Center Pane, Browse Mode)

**Goal:** Show the notes in the currently selected folder (or smart view). Let user find and open a note fast.
**Primary action:** Click a note to open it.
**Secondary actions:** Sort, toggle card/row view, multi-select, filter.

---

## Layout — List (row) view, folder selected

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─ Toolbar ────────────────────────────────────────────────────────────┐   │
│  │ 📁 notes / philosophy                                                 │   │  ← breadcrumb
│  │ [🔍 Search in folder...]   [Filter ▼]   [↕ Modified]   [ ⊞  ⊟ ]     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ 📄  On Stoicism                          ★    Modified 2h ago        │   │
│  │     "The obstacle is the way. Begin with…"   #philosophy  #reading   │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ 📄  Reading List 2026                         Modified yesterday      │   │
│  │     "Meditations, Feynman Lectures, DDIA…"   #reading                │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ 📄  Untitled                                  Modified 3 days ago     │   │
│  │     (no body preview)                        —                       │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  🎬  Feynman on Curiosity                ★    Modified last week      │   │
│  │      cornell.edu · 1:02:34               #physics  #feynman          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  4 notes                                                                     │  ← footer count
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Card (grid) view, same folder

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─ Toolbar ────────────────────────────────────────────────────────────┐   │
│  │ 📁 notes / philosophy                                                 │   │
│  │ [🔍 Search in folder...]   [Filter ▼]   [↕ Modified]   [ ⊞  ⊟ ]     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ 📄 ★            │  │ 📄              │  │ 📄              │             │
│  │                 │  │                 │  │                 │             │
│  │ On Stoicism     │  │ Reading List    │  │ Untitled        │             │
│  │                 │  │ 2026            │  │                 │             │
│  │ The obstacle is │  │ Meditations,    │  │ (empty)         │             │
│  │ the way. Begin  │  │ Feynman…        │  │                 │             │
│  │ with…           │  │                 │  │                 │             │
│  │                 │  │                 │  │                 │             │
│  │ 2h ago          │  │ Yesterday       │  │ 3 days ago      │             │
│  │ #philosophy     │  │ #reading        │  │ —               │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │ 🎬 ★            │                                                         │
│  │                 │                                                         │
│  │ Feynman on      │                                                         │
│  │ Curiosity       │                                                         │
│  │                 │                                                         │
│  │ Last week       │                                                         │
│  │ #physics        │                                                         │
│  └─────────────────┘                                                         │
│                                                                              │
│  4 notes                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Toolbar elements (left to right)

**Breadcrumb:** Shows current context. Examples:
- `📁 notes` — a root-level folder
- `📁 notes / philosophy` — a nested folder
- `★ Starred` — smart view
- `🕐 Recent` — smart view
- `🏷 #reading` — tag filter

Clicking any breadcrumb segment navigates up to that level.

**Search input:** `[🔍 Search in folder...]`
- Placeholder changes based on context: "Search in notes/philosophy…", "Search starred notes…"
- Search is local to the current folder/view (not global vault search).
- Global vault search is in the titlebar (separate — opens command palette pre-seeded with the query).
- Keystroke filtering: filters the list in real time. No debounce needed for <500 notes. Debounce 150ms for larger vaults.
- Matches on: `title`, `tags`, body preview text. Highlights matched characters in the row title.
- Pressing Escape clears the search field and restores the full list.

**Filter dropdown:** `[Filter ▼]`
Opens a popover (not a modal):
```
┌──────────────────────┐
│ Filter by type       │
│ ○ All                │
│ ○ Notes only         │
│ ○ Videos only        │
│ ○ Podcasts only      │
│ ○ Articles only      │
│ ○ Journals only      │
│ ──────────────────── │
│ ☑ Starred only       │
│ ──────────────────── │
│        [Clear]       │
└──────────────────────┘
```
Active filter shows a blue dot on the Filter button. Clicking Clear removes all filters.

**Sort control:** `[↕ Modified]`
Cycles through on click: Modified (desc) → Modified (asc) → Created (desc) → Created (asc) → Name (A→Z) → Name (Z→A) → back.
Current sort direction shown in the label. Alternatively, a small dropdown:
```
┌──────────────────┐
│ ● Modified ↓     │
│ ○ Modified ↑     │
│ ○ Created ↓      │
│ ○ Created ↑      │
│ ○ Name A→Z       │
│ ○ Name Z→A       │
└──────────────────┘
```

**View toggle:** `[ ⊞  ⊟ ]`
- `⊞` = card grid view (selected state: filled/active).
- `⊟` = list/row view (selected state: filled/active).
- Persisted per-folder to `ui-state.json`. Default: row view.

---

## Row (list) item anatomy

```
[type icon]  [title]                  [★ if starred]   [relative timestamp]
             [body preview, 1 line]                    [tags, up to 3]
```

- **Type icons:** 📄 note, 🎬 video, 🎙 podcast, 📰 article, 📅 journal, 🔗 link
- **Title:** `--tx` color, `--jf-text-md` size, font-weight 500.
- **Body preview:** First 100 chars of body text, frontmatter stripped. `--t2` color, `--jf-text-sm` size. If body is empty: `(no content)` in `--t3`.
- **Timestamp:** Relative (`2h ago`, `yesterday`, `Apr 20`). Full ISO timestamp shown in tooltip on hover.
- **Tags:** Up to 3 tags shown as pills (`--b2` bg, `--t2` text, `--jf-radius-pill`). If more: `+N more` pill.
- **Star:** `--ac` color when starred. Clicking the star icon toggles `starred` in frontmatter and calls `vault.write()`. No confirmation needed.
- **Selected state:** `--cd` background, `--ac` left border (3px).
- **Hover state:** `--b2` background.

---

## Card item anatomy

```
┌──────────────────────────────┐
│ [type icon]           [★]   │  ← header row
│                              │
│ [Title text, up to 2 lines] │
│                              │
│ [Body preview, 2–3 lines]   │
│                              │
│ [relative date]  [tags…]    │  ← footer row
└──────────────────────────────┘
```

- Card width: fixed 200px. Grid uses `repeat(auto-fill, minmax(200px, 1fr))` with `--jf-space-4` gap.
- Card height: fixed 160px. Body preview is clamped with `overflow: hidden; -webkit-line-clamp: 3`.
- `--jf-radius-md` corners. `--jf-shadow-sm` box-shadow. `--b2` background.
- Selected: `--ac` border (2px), `--jf-shadow-md`.
- Hover: `--jf-shadow-md`, slight `translateY(-1px)` transform (80ms ease).

---

## Multi-select

- Ctrl/⌘+click: add individual items to selection.
- Shift+click: range select.
- When ≥2 selected, a selection toolbar appears above the list:
  ```
  ┌─────────────────────────────────────────────────────────┐
  │  3 notes selected         [Move to…] [Delete] [★ Star]  │
  └─────────────────────────────────────────────────────────┘
  ```
- "Delete" shows inline warning (not a modal): "Delete 3 notes from disk? This cannot be undone."
- "Move to…" opens a folder picker dropdown showing the folder tree.
- Escape clears selection.

---

## Empty state

**Folder is empty:**
```
             This folder is empty.

         [ + Create a note here ]
```

**Search returns no results:**
```
         No notes match "stoicism"

         [ Clear search ]   [ Create "stoicism" as a new note ]
```
"Create as new note" pre-fills the new note title with the search string and places the file in the current folder.

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Arrow Up/Down | Move selection between notes |
| Enter | Open selected note (loads in center pane / detail panel) |
| Space | Preview selected note in detail panel without navigating away |
| Ctrl/⌘+A | Select all visible notes |
| Delete / Backspace | Delete selected note(s) (with inline confirmation) |
| F2 | Rename selected note's file |
| Ctrl/⌘+F | Focus search field in toolbar |

---

## Responsive behavior

**1200w:** Card grid shows 3–4 columns. Row view has generous padding.
**900w:** Card grid shows 2 columns. Row view unchanged. If detail panel is open as slide-over, the file list remains scrollable underneath.
