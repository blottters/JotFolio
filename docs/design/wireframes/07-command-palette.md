# Wireframe 07 — Command Palette

**Goal:** Keyboard-first access to every app action without leaving the keyboard.
**Primary action:** Type to find and invoke a command.
**Secondary actions:** Browse categories, invoke a recent command, discover plugin commands.

**Trigger:** Ctrl/⌘+P from anywhere in the app.

---

## Layout — Browseable state (empty query)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│           ┌──────────────────────────────────────────────────┐              │
│           │ > _                                               │              │  ← input, 20% from top
│           ├──────────────────────────────────────────────────┤              │
│           │                                                   │              │
│           │  RECENT                                           │              │  ← small-caps header
│           │  ─────────────────────────────────────────────   │              │
│           │  ◷  Open today's journal          Plugin · daily-notes│         │
│           │  ◷  New note                                Vault │              │
│           │  ◷  Toggle sidebar                         View  │              │
│           │                                                   │              │
│           │  VAULT                                            │              │
│           │  ─────────────────────────────────────────────   │              │
│           │  📝  New note                           ⌘N        │              │
│           │  📓  New journal entry                           │              │
│           │  📁  Open vault in Finder/Explorer      ⌘⇧O      │              │
│           │                                                   │              │
│           │  NAVIGATION                                       │              │
│           │  ─────────────────────────────────────────────   │              │
│           │  🔀  Switch note...                     ⌘O        │              │
│           │  ★   Open Starred                                 │              │
│           │  🕐  Open Recent                                  │              │
│           │                                                   │              │
│           │  PLUGIN                                           │              │
│           │  ─────────────────────────────────────────────   │              │
│           │  📅  Open today's journal   Plugin · daily-notes  │              │
│           │  🔗  Sync vault              Plugin · git-sync   │              │
│           │                                                   │              │
│           │  SYSTEM                                           │              │
│           │  ─────────────────────────────────────────────   │              │
│           │  ⚙   Open settings                      ⌘,        │              │
│           │  🔄  Reload vault                                 │              │
│           │  ✕   Quit JotFolio                      ⌘Q        │              │
│           │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │              │
│           │  ▫   Export as PDF              Coming soon       │              │  ← dimmed
│           │                                                   │              │
│           └──────────────────────────────────────────────────┘              │
│                                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Container:** 560px max-width, centered horizontally. Top edge at 20% from window top (not vertically centered). `--jf-shadow-popover` shadow. `--b1` background. `--jf-radius-lg` border radius.

**Backdrop:** Full-window semi-transparent overlay (`--b1` at 60% opacity, backdrop-filter: blur(2px)). Clicking the backdrop DOES dismiss the palette. This differs from a modal — there is no "are you sure" gate. Escape also dismisses.

**Input field:** Full width, no border, `--b1` background, `--tx` text, `--jf-text-lg` size, 16px padding horizontal. Placeholder: "Search commands…". Auto-focused on open. Cleared on close.

---

## Layout — Active search (query typed)

```
           ┌──────────────────────────────────────────────────┐
           │ > journal_                                        │
           ├──────────────────────────────────────────────────┤
           │                                                   │
           │  📓  New j[ournal] entry                  Vault   │  ← fuzzy match highlighted
           │  📅  Open today's j[ournal]    Plugin · daily-notes│  ← category badge replaces shortcut
           │  🔗  Sync vault                Plugin · git-sync  │  ← partial match on "git"? no — no match
           │                                                   │
           │  No more results                                  │  ← shown when list ends (not "no results")
           │                                                   │
           └──────────────────────────────────────────────────┘
```

**When query is active:**
- Category section headers collapse. Results show flat.
- Each result row shows: icon | command name (with match chars highlighted in `--ac`) | category badge (right-aligned, `--t3` color, small font)
- Category badge format: `Vault` / `Navigation` / `System` for built-in categories. `Plugin · plugin-id` for plugin commands.
- Matching: case-insensitive fuzzy match against command name. Substring match is sufficient — no prefix required. "jrnl" matches "New journal entry" if the chars appear in order. Matched characters highlighted with `color: var(--ac); font-weight: 600`.
- Results sorted: exact prefix matches first, then substring matches, then fuzzy matches. Within each tier, alphabetical.
- "Coming soon" commands are excluded from search results (they are only shown in the browseable state where they provide roadmap context).

---

## Result row anatomy

```
  [icon]  [command name with highlighted chars]   [badge or shortcut]
```

- **Icon:** 18px (--jf-icon-md). Built-in commands use app icons. Plugin commands use a generic plug icon unless the plugin manifest specifies one.
- **Command name:** `--jf-text-md`, `--tx` color. Highlighted match chars: `--ac` color, `font-weight: 600`.
- **Badge / shortcut:** Right-aligned. If the command has a keyboard shortcut: show it (e.g., `⌘N`). If it has no shortcut but has a category: show the category badge. Plugin commands always show `Plugin · plugin-id` badge.
- **Row height:** `--jf-control-lg` (44px).
- **Hover:** `--b2` background.
- **Selected (keyboard):** `--cd` background, 2px `--ac` left border.

---

## "Coming soon" commands

```
  ▫   Export as PDF              Coming soon
```

- Shown only in the browseable (empty query) state, at the bottom of their category section, after a thin divider line.
- Dimmed: `opacity: 0.45`.
- Cursor: default (not pointer — not clickable).
- Tooltip on hover: "(Coming soon)" — shown via `title` attribute or a custom tooltip at `--jf-z-tooltip`.
- Not invokable. Enter key skips over them when navigating with arrows.
- Rationale: hiding deferred features entirely means users can't discover the roadmap. Showing them dimmed communicates "this is planned" without creating false expectations.

---

## Recent commands

- Stored in `<vault>/.jotfolio/ui-state.json` under `recentCommands: string[]` (array of command IDs, most recent first, max 5).
- Updated on every invocation: prepend the invoked command ID, deduplicate, trim to 5.
- Only shown in the browseable state (empty query), as the first section "RECENT".
- Plugin commands appear in Recent if they were invoked recently.
- If no commands have been invoked yet (fresh install): Recent section is omitted entirely.

---

## Keyboard navigation

| Key | Action |
|-----|--------|
| Arrow Down | Move selection to next result |
| Arrow Up | Move selection to previous result |
| Enter | Invoke selected command |
| Escape | Close palette without invoking anything |
| Tab | Move selection to next result (same as Arrow Down — for discoverability) |
| Shift+Tab | Move selection to previous result |

- Selection wraps: Arrow Down on the last item moves to the first item (and vice versa).
- Focus never leaves the input field. Arrow key navigation moves the visual selection highlight, not DOM focus.
- Mouse hover also highlights a row. Enter invokes the hovered row, not just the arrow-selected one. (Reconcile: keyboard selection takes precedence if both are active — last interaction wins.)

---

## Relationship to Quick Switcher (wireframe 08)

The command palette and quick switcher are **composable, not competing.**

| | Command Palette | Quick Switcher |
|---|---|---|
| Opens with | Ctrl/⌘+P | Ctrl/⌘+O |
| Purpose | Run ACTIONS | Navigate to NOTES |
| Search scope | Command names | Note titles only |
| Categories | Yes | No |
| Plugin commands | Yes | No |
| Create new note | Via "New note" action | Via query fallback |

The command palette includes a "Switch note…" action (Navigation category) that, when invoked, closes the palette and opens the quick switcher. They chain — the palette is the discovery surface, the switcher is the navigation surface.

---

## Plugin commands

Plugin commands registered via `plugin.commands.register(id, handler, options)` (ADR-0003) appear in the PLUGIN category automatically. The display name comes from `options.name` if provided, otherwise falls back to the command `id`.

The keyboard shortcut for a plugin command comes from `options.hotkey` in the manifest. If no hotkey was registered, no shortcut badge is shown — just the `Plugin · plugin-id` category badge.

If a plugin is disabled, its commands are removed from the palette immediately (no restart required — per ADR-0003 hot-load behavior).

---

## Empty state (no results)

```
           ┌──────────────────────────────────────────────────┐
           │ > xkzq_                                           │
           ├──────────────────────────────────────────────────┤
           │                                                   │
           │   No commands match "xkzq"                        │
           │                                                   │
           └──────────────────────────────────────────────────┘
```

The palette stays open. The user can continue typing or press Escape.

---

## States

**Opening animation:** The container fades in and slides down 8px over `--jf-t-fast` (80ms). No spring — keep it crisp.

**Closing:** Reverse of opening. Fades out over `--jf-t-fast`.

**Input value:** NOT persisted between opens. Every open starts with an empty input and the browseable state.

**Plugin load failure:** If a plugin crashed (per wireframe 10 failure states), its commands are excluded from the palette. No indication in the palette itself — the failure is surfaced in Settings > Plugins.

---

## Responsive behavior

**1200w:** Palette as shown. Centered at 560px max-width.
**900w:** Same behavior. At narrow window widths, the palette may be close to full width — add 24px padding on each side as a minimum margin. Min width 320px.

---

## Implementation notes

- The palette is a portal component rendered at the root of the React tree (`document.body`), not inside the editor or sidebar subtree. This ensures it always renders above everything else at `z-index: var(--jf-z-popover)` (300).
- Command registry: maintained in a `commandRegistry` module. Each entry: `{ id, name, icon, category, shortcut, handler, pluginId?, available: boolean }`. The palette reads this registry on every open (no caching — the registry is already in memory).
- Fuzzy match implementation: a simple character-by-character substring search is sufficient for v0. If the command list grows past 100 entries, consider `fuse.js` (already in npm ecosystem, no new dependencies needed). Do not implement Levenshtein distance for v0 — it adds false matches on short queries.
- Backdrop `z-index`: the backdrop layer sits between the palette (`--jf-z-popover: 300`) and the app content. Use `z-index: 299` for the backdrop so the palette sits above it.
- The input field must call `e.stopPropagation()` on keydown for Arrow Up/Down and Enter to prevent the editor below from receiving those keys while the palette is open.
