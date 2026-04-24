# Wireframe 08 — Quick Switcher

**Goal:** Navigate to any note by title with minimal keystrokes.
**Primary action:** Type a note title fragment, press Enter to open.
**Secondary action:** Create a new note when no match exists.

**Trigger:** Ctrl/⌘+O from anywhere in the app.

---

## Layout — Empty query (recent notes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│           ┌──────────────────────────────────────────────────┐              │
│           │ 🔍 Search notes…                                  │              │  ← input, 20% from top
│           ├──────────────────────────────────────────────────┤              │
│           │                                                   │              │
│           │  RECENT                                           │              │
│           │  ─────────────────────────────────────────────   │              │
│           │                                                   │              │
│           │  On Stoicism                                      │              │  ← selected (first by default)
│           │  notes/on-stoicism.md              #philosophy   │              │  ← path + tag pills
│           │                                                   │              │
│           │  Daily Reflection                                 │              │
│           │  notes/daily-reflection.md                        │              │
│           │                                                   │              │
│           │  Feynman on Curiosity                             │              │
│           │  videos/feynman-on-curiosity.md    #physics  #feynman│           │
│           │                                                   │              │
│           │  Reading List                                     │              │
│           │  notes/reading-list.md             #reading       │              │
│           │                                                   │              │
│           │  2026-04-22                                       │              │
│           │  journals/2026-04-22.md                           │              │
│           │                                                   │              │
│           │  Philosophy Notes                                 │              │
│           │  notes/philosophy-notes.md         #philosophy    │              │
│           │                                                   │              │
│           │  On the Stoic Week                                │              │
│           │  notes/on-the-stoic-week.md                       │              │
│           │                                                   │              │
│           │  The Tyranny of the Rocket Equation               │              │
│           │  articles/the-tyranny-of-the-rocket-equation.md  │              │
│           │                                                   │              │
│           └──────────────────────────────────────────────────┘              │
│                                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Container:** Identical to command palette — 560px max-width, centered horizontally, top edge at 20% from window top. `--jf-shadow-popover` shadow. `--b1` background. `--jf-radius-lg` border radius.

Visual consistency with the command palette is intentional. The two overlays feel like a system, not separate widgets. The only visible difference: placeholder text, search icon in input, and the absence of category headers in results.

**Recent notes:** Up to 8 most recently opened notes, sorted by recency (most recent first). Stored in `<vault>/.jotfolio/ui-state.json` under `recentNotes: string[]` (array of note IDs). Updated on every note open.

---

## Layout — Active search (query typed)

```
           ┌──────────────────────────────────────────────────┐
           │ 🔍 stoic_                                         │
           ├──────────────────────────────────────────────────┤
           │                                                   │
           │  On [Stoic]ism                                    │  ← highlighted match
           │  notes/on-stoicism.md              #philosophy    │
           │                                                   │
           │  On the [Stoic] Week                              │
           │  notes/on-the-stoic-week.md                       │
           │                                                   │
           │  Daily Reflection                                 │  ← partial match on "stoic" in tag? No.
           │                                                   │  ← search is titles only — this wouldn't appear
           │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
           │  + Create "stoic" as new note                    │  ← always last item
           │                                                   │
           └──────────────────────────────────────────────────┘
```

**Search scope: titles only.** The query is matched against the `title` field from each note's frontmatter (per ADR-0005). Body text, tags, paths, and authors are NOT searched here — that is a full-text search feature, not a switcher.

**Matching:** Case-insensitive fuzzy match over titles. Character-by-character subsequence match (same algorithm as command palette). Matched characters highlighted in `--ac` color, `font-weight: 600`.

**Sort order:** Exact prefix match > substring match > fuzzy match. Within each tier, sort by recency (most recently opened first). This means a note you opened yesterday ranks above an alphabetically-earlier note you haven't touched in a month.

---

## Result row anatomy

```
  [Note title — --jf-text-md, --tx, matched chars in --ac bold]
  [vault-relative path — --jf-text-sm, --t3]           [tag pills — right-aligned]
```

**Tag pills:** Small rounded pills, `--b2` background, `--t2` text, `--jf-text-xs` size, `--jf-radius-pill` border-radius, horizontal padding `--jf-space-2`.

**Tag overflow:** If more than 3 tags, show the first 2 tags and a `+N more` pill (e.g., `+2 more`). The `+N more` pill uses `--t3` text color.

**File path:** Vault-relative (e.g., `notes/on-stoicism.md`), NOT the OS absolute path. The vault root is implicit.

**Row height:** Auto (content-driven). Title on line 1, path + tags on line 2. Min height `--jf-control-lg` (44px). Tags may push the row taller on wide titles — acceptable.

**Selected row (keyboard):** `--cd` background, 2px `--ac` left border.
**Hover:** `--b2` background.

---

## Create new note fallback

The "Create as new note" action is always the **last item** in the results list, separated from note results by a thin divider line. It is shown whenever the query is non-empty, regardless of how many results appear.

```
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  + Create "stoic week notes" as new note
```

**When there are zero note matches:** The create action becomes the only item and is auto-selected (no divider needed — nothing above it).

**When invoked (Enter or click):**
1. Close the quick switcher.
2. Create a new note: `type: note`, `title: <query>`, filename slug derived from title per ADR-0005 rules, placed in the default `notes/` folder.
3. Open the new note in the editor immediately.
4. The editor opens with the cursor in the body (after the frontmatter block), ready to type.

**If a note with that title already exists** (exact title match, case-insensitive): The create action is hidden — the existing note is already in the results above. This avoids creating duplicates by accident.

---

## Empty state (no matches, no recent notes)

This only happens on a completely fresh vault with no notes at all.

```
           ┌──────────────────────────────────────────────────┐
           │ 🔍 Search notes…                                  │
           ├──────────────────────────────────────────────────┤
           │                                                   │
           │   No notes yet.                                   │
           │                                                   │
           │   Type a title to create your first note.         │
           │                                                   │
           └──────────────────────────────────────────────────┘
```

As soon as the user types, the create-new-note action appears.

---

## No-match state (query typed, no results)

```
           ┌──────────────────────────────────────────────────┐
           │ 🔍 xkzq_                                          │
           ├──────────────────────────────────────────────────┤
           │                                                   │
           │   No notes match "xkzq"                           │
           │                                                   │
           │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
           │  + Create "xkzq" as new note                     │  ← auto-selected
           │                                                   │
           └──────────────────────────────────────────────────┘
```

---

## Keyboard navigation

| Key | Action |
|-----|--------|
| Arrow Down | Move selection to next result (wraps to top from create action) |
| Arrow Up | Move selection to previous result (wraps to create action from top) |
| Enter | Open selected note / invoke create action |
| Escape | Close without navigating |
| Tab | Same as Arrow Down |
| Shift+Tab | Same as Arrow Up |

The create-new-note action participates in keyboard navigation — Arrow Down past the last note result selects it. Arrow Down from the create action wraps to the first note result.

---

## Relationship to Command Palette (wireframe 07)

See wireframe 07 for the comparison table. Quick summary:

- Quick Switcher: note titles, navigation only, create-new fallback.
- Command Palette: action names, plugin commands, system actions.

They share the same visual container and open animation. A user who accidentally opens the wrong one can press Escape and open the other.

---

## States

**Opening animation:** Same as command palette — fade in + 8px slide down over `--jf-t-fast`.

**Closing:** Fade out over `--jf-t-fast`.

**Input value:** NOT persisted between opens. Every open starts fresh with an empty input.

**Vault indexing in progress:** If the link graph index is still being built (first launch of a large vault), the switcher still works — it reads directly from the file list array (which is populated before the link graph). Search may be slightly slower on very large vaults but remains functional.

---

## Responsive behavior

**1200w:** Switcher as shown. 560px max-width, centered.
**900w:** Same. Minimum 24px margin on each side. No behavior change — the switcher is always a floating overlay.

---

## Implementation notes

- The quick switcher is a portal component rendered at the same root level as the command palette. Both use the same overlay backdrop (they should never be open simultaneously).
- The note list for search comes from the vault's in-memory note index (same source as the file list in wireframe 04). No disk reads on open.
- Fuzzy match: same implementation as the command palette. If a shared `fuzzyMatch(query, candidates)` utility doesn't already exist, create one and share it between both overlays.
- The "create new note" action uses `vault.write()` to create the file (per ADR-0002), then fires a `note-create` event (per ADR-0003) so plugins can react.
- Recent notes list (`recentNotes` in `ui-state.json`): on every `note-open` event, prepend the note ID, deduplicate by ID, trim to 8 entries. This runs in the renderer, not the main process.
- Accessibility: overlay `role="dialog"` with `aria-label="Quick Switcher"`. Input is `role="combobox"` with `aria-expanded` and `aria-controls` pointing to the results list. Results list is `role="listbox"`. Each result row is `role="option"` with `aria-selected`.
