# Wireframe 06 — Backlinks Panel

**Goal:** Surface incoming links to the current note without leaving the editor. Fast to dismiss, detailed when needed.
**Primary action:** Expand panel to see which notes reference this one.
**Secondary actions:** Click a result to navigate to it, dismiss unlinked mentions section.

**Decision: Backlinks panel lives at the bottom of the editor (inline), NOT in a right sidebar.**

Rationale: JotFolio v0 is single-pane. A right sidebar requires a pane-split architecture that does not exist in v0 (views.* deferred per ADR-0003). The bottom panel mirrors the frontmatter panel pattern established in wireframe 05 — a collapsed bar that expands inline. This keeps the implementation consistent and lets the same pattern serve two different metadata surfaces.

---

## Layout — Collapsed state (default)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─ Editor body ────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  # On Stoicism                                                        │   │
│  │                                                                       │   │
│  │  The practice begins with what you control.                           │   │
│  │  Marcus Aurelius writes in [[Meditations]] that…                      │   │
│  │                                                                       │   │
│  │  █                                                                    │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Backlinks bar (collapsed) ──────────────────────────────────────────┐   │
│  │ ▶  3 notes link to this                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Collapsed bar anatomy:**
- Fold chevron `▶`
- Label: "N notes link to this" where N = total backlink count (linked + unlinked mentions combined)
- When count is 0: "No notes link to this" (no chevron — nothing to expand)
- Bar uses `--b2` background, `--tx` text, same visual weight as the frontmatter bar in wireframe 05

---

## Layout — Expanded state (linked + unlinked mentions)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─ Editor body ────────────────────────────────────────────────────────┐   │
│  │  # On Stoicism                                                        │   │
│  │                                                                       │   │
│  │  … body content …                                                     │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Backlinks panel (expanded) ─────────────────────────────────────────┐   │
│  │ ▼  3 notes link to this                                              │   │
│  │                                                                       │   │
│  │  LINKED MENTIONS  (2)                                                 │   │  ← section header
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │                                                                       │   │
│  │  📄  Daily Reflection                                                 │   │
│  │      notes/daily-reflection.md                                        │   │  ← path in --t3
│  │      "…the Stoic practice described in [[On Stoicism]] maps          │   │  ← context snippet
│  │       directly to the morning routine I've been…"                    │   │
│  │                                                                       │   │
│  │  📄  Reading List                                                     │   │
│  │      notes/reading-list.md                                            │   │
│  │      "…next on my list after finishing [[On Stoicism]] is the        │   │
│  │       Enchiridion by Epictetus…"                                      │   │
│  │                                                                       │   │
│  │  UNLINKED MENTIONS  (1)                                               │   │  ← only shown if count > 0
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │                                                                       │   │
│  │  📄  Philosophy Notes                                                 │   │
│  │      notes/philosophy-notes.md                                        │   │
│  │      "…On Stoicism is the most accessible entry point into Marcus     │   │
│  │       Aurelius for modern readers. Start there…"                      │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Result row anatomy

```
  📄  [Note title — large, --tx]
      [vault-relative path — small, --t3]
      "[…context snippet up to 120 chars around the mention…]"   ← italic, --t2
```

**Context snippet rules:**
- Centered on the mention text. Show up to 60 chars before and 60 chars after.
- Trim at word boundaries. Add `…` prefix/suffix when truncated.
- The mention text itself is shown in `--ac` color within the snippet (bold for linked mentions, normal weight for unlinked).
- Max 2 lines displayed. If the snippet would exceed 2 lines (rare), cut at 2 lines with `…`.

**Result row hover state:** `--b2` background. Cursor: pointer.
**Selected row (keyboard navigation):** `--cd` background + 2px `--ac` left border.

---

## Section rules

**Linked Mentions section:**
- Always shown when the panel is expanded, even if count is 0 (shows "No linked mentions" placeholder in that case).
- Counts explicit `[[Title]]` wiki-link references from the vault link graph index.

**Unlinked Mentions section:**
- Only rendered when count > 0. Hidden entirely when there are no unlinked mentions.
- Counts occurrences of the current note's title (exact string match, case-insensitive) in other notes' body text, where that occurrence is NOT already a wiki-link.
- Rationale: unlinked mentions are a "soft" signal — showing the section when empty adds visual noise for no value. Linked mentions are always shown because the user expects to see the section when the panel is open.

---

## Empty state (no backlinks at all)

When the note has zero incoming links and zero unlinked mentions, the collapsed bar reads "No notes link to this" with no chevron. Clicking it has no effect.

When the user explicitly opens the panel via keyboard shortcut while count is 0:

```
┌─ Backlinks panel ────────────────────────────────────────────────────────┐
│ ▼  No notes link to this                                                  │
│                                                                            │
│   No linked or unlinked mentions found in your vault.                     │
│                                                                            │
│   Try linking from another note:  [[On Stoicism]]                         │  ← note title shown in wiki-link syntax
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

The `[[On Stoicism]]` example is copyable (click copies to clipboard).

---

## Click behavior

**Single click on a result row:** Navigates to that note in the current pane (replaces the current note). This is the only navigation mode in v0 — single pane, no tabs, no split.

"Open in new tab" is explicitly deferred. It requires the views.* surface (ADR-0003) which is not in v0. Do not show a disabled "Open in new pane" option — omit it entirely to avoid confusion.

**History:** Navigating via backlinks is a navigation action. The back button (if implemented) should handle it. This wireframe does not define the back/forward navigation stack — that is a separate concern.

---

## Data source

The panel reads from the in-memory link graph index, which is:
- Built on vault load by scanning all `.md` files for `[[Title]]` patterns and resolving them to note IDs per ADR-0005 wiki-link encoding rules.
- Rebuilt after every note save (the `note-save` event per ADR-0003 events surface).
- Never persisted to disk as source-of-truth (the index cache at `.jotfolio/index.json` is a performance cache only — it is always reconstructible).

The panel does not query disk on open. It reads from the already-built in-memory index. Panel open time should be effectively instant (<5ms for vaults up to 10,000 notes).

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/⌘+Shift+B | Toggle backlinks panel open/closed |
| Arrow Down / Arrow Up | Move focus between result rows (when panel is focused) |
| Enter | Open the focused result note in current pane |
| Escape | Collapse panel and return focus to editor body |

Tab from the editor body does not enter the backlinks panel automatically — focus must be explicitly moved via Ctrl/⌘+Shift+B or by clicking a result.

---

## States

**Loading (index not yet built):**
Panel bar shows "Scanning vault…" instead of the link count. A spinner replaces the chevron. Once the index is ready, the bar updates automatically.

**Stale (note was just saved, index is rebuilding):**
The panel content shows its previous state with a subtle "Updating…" indicator in the section header. Does not flash or blank out during the rebuild. Rebuild is fast enough (<200ms for most vaults) that a loading state is only shown if it exceeds 500ms.

**Note with no title in frontmatter (ADR-0005 violation / parse error):**
Unlinked mention search requires a title to search for. If the current note has no parseable title, the Unlinked Mentions section shows: "Cannot search for unlinked mentions — this note has no title in its frontmatter."

---

## Responsive behavior

**1200w:** Backlinks panel is inline at the bottom of the editor scroll area (as shown above). On wide viewports, the detail panel in the right sidebar (wireframe 02) also shows a collapsed backlinks section — that is a summary only. Expanding it there opens the full panel in the editor.

**900w:** Same inline behavior. No right sidebar at this width (auto-collapsed per wireframe 02). The backlinks panel is the only way to see backlinks at 900w.

---

## Implementation notes

- The collapsed bar and expanded panel are the same component with a toggled state, matching the `FrontmatterPanel` implementation pattern from wireframe 05. Reuse the same expand/collapse animation (CSS `max-height` transition, `--jf-t-med` duration).
- The panel is part of the editor scroll container — it scrolls with the content, it does not stick to the bottom of the viewport. The user scrolls down to see it, or uses Ctrl/⌘+Shift+B to jump focus to it.
- Context snippet highlighting: use a `<mark>` element with `background: transparent; color: var(--ac); font-weight: 600` for linked mentions, `background: transparent; color: var(--ac)` for unlinked mentions. Do not use a solid highlight background — it clashes with the note body's theme colors.
- Result count in collapsed bar: `linkedCount + unlinkedCount`. Recompute on every index rebuild.
- Accessibility: the collapsed bar is a `<button role="button" aria-expanded="false/true">`. The expanded panel is `role="region" aria-label="Backlinks"`. Each result row is a `<button>` (not an `<a>` — there is no URL to link to).
