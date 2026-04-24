# Wireframe 02 — Main Layout (3-Pane Shell)

**Goal:** Persistent, predictable desktop shell. Sidebar + content + detail panel.
**Primary action:** Navigate notes, open a note.
**Secondary actions:** Collapse sidebar, collapse detail panel, open command palette, open settings.

---

## Window chrome decision: Frameless with custom titlebar

**Decision: Frameless Electron window with a custom 40px titlebar strip.**

Rationale:
- Native window chrome on Windows uses the default Windows-10 era titlebar that does not respect the active theme. With 26 themes, this looks bad on dark themes.
- macOS traffic lights on a frameless window look and feel native and Obsidian has normalized this pattern for desktop note apps.
- Windows: custom titlebar shows app name + drag region + standard min/max/close buttons rendered in HTML/CSS. They match the active theme. `--jf-platform-win` class on `<html>` controls this.
- Mac: frameless window with `trafficLightPosition` set, native traffic lights at left, drag region covers the rest of the titlebar strip.
- Linux: same as Windows custom titlebar. `--jf-platform-linux` class.

The 40px titlebar strip is part of the app shell, not a separate component. It is `app-region: drag` except over clickable controls.

---

## Layout — 1200w (default desktop)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [◉ ◉ ◉]  JotFolio — My Vault              [🔍] [⌘P]           [⚙]  [─][□][✕]│  ← titlebar 40px
├────────────┬───────────────────────────────────────┬───────────────────────  │
│            │                                        │                         │
│  SIDEBAR   │         CENTER PANE                   │   DETAIL PANEL          │
│  240px     │         (flex: 1, min 480px)           │   380px                 │
│  min-width │                                        │   collapsible           │
│            │                                        │                         │
│ [≡ Vault]  │  ┌─ Toolbar (48px) ─────────────────┐ │  [←] Note title         │
│            │  │ [Search...] [Filter▼] [↕] [⊞ ⊟]  │ │  ─────────────────────  │
│  ▼ Notes   │  └──────────────────────────────────┘ │                         │
│    ▷ Work  │                                        │  Frontmatter / body     │
│    ▷ Ideas │  File list / editor content            │  detail                 │
│  ▶ Videos  │  (see wireframe 04 / 05)               │                         │
│  ▶ Podcasts│                                        │  Backlinks (collapsed   │
│  ▶ Journal │                                        │  by default)            │
│            │                                        │                         │
│  ── Tags ──│                                        │                         │
│  #reading  │                                        │                         │
│  #work     │                                        │                         │
│            │                                        │                         │
│  ── Views──│                                        │                         │
│  Starred   │                                        │                         │
│  Recent    │                                        │                         │
│            │                                        │                         │
│  [+ New]   │                                        │  [Open in editor ↗]     │
└────────────┴───────────────────────────────────────┴─────────────────────────┘
```

---

## Layout — 900w (minimum supported width)

At 900w, the detail panel auto-collapses. Sidebar collapses to icon rail (40px) or can be toggled.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [◉ ◉ ◉]  JotFolio                               [🔍] [⌘P]   [⚙] [─][□][✕] │
├──────┬──────────────────────────────────────────────────────────────────────┤
│  ≡   │  ┌─ Toolbar ─────────────────────────────────────────────────────┐  │
│  📁  │  │ [Search...] [Filter▼] [↕] [⊞ ⊟]                              │  │
│  🏷  │  └───────────────────────────────────────────────────────────────┘  │
│  ★   │                                                                       │
│  🕐  │  File list (full width)                                               │
│      │                                                                       │
│      │  Clicking a note opens the detail panel as a slide-over (380px,      │
│      │  covers part of the file list, dismissed by clicking outside or       │
│      │  pressing Escape)                                                     │
│      │                                                                       │
│ [+]  │                                                                       │
└──────┴───────────────────────────────────────────────────────────────────── ┘
```

Icon rail icons (top to bottom): Folder tree, Tags, Starred, Recent.
Tooltip on hover with label.

---

## Titlebar elements (left to right)

**Mac:**
```
[● ● ●]  [sidebar toggle icon]  JotFolio — Vault Name          [search] [cmd+P]  [settings]
```
Traffic lights at system-specified position. Drag region covers middle. Right side: search icon, command palette icon, settings gear.

**Windows / Linux:**
```
[sidebar toggle icon]  JotFolio — Vault Name   [search] [cmd+P]  [settings]   [─] [□] [✕]
```
Custom min/max/close buttons at right. They use `--tx` / `--ac` / `--bg` from active theme. Close button hover: red background (`#e81123` on Windows to match system convention). Min/max: `--b2` hover.

---

## Sidebar sections (see wireframe 03 for folder tree detail)

**Top:** Vault name + collapse toggle (clicking collapses sidebar to 40px icon rail).
**Middle:** Folder tree (replaces the current type-based "MEDIA" list).
**Virtual Smart Views (below folder tree):**
- Starred — all entries where `starred: true`
- Recent — all entries sorted by `mtime`, last 20
- Unlinked — entries with no incoming backlinks (orphans)
**Bottom:** [+ New Note] button. Always visible.

---

## Pane resize

- Sidebar and detail panel widths are user-resizable via drag handles (4px wide, `--br` color, cursor: col-resize).
- Sidebar min 180px, max 360px.
- Detail panel min 300px, max 520px.
- Widths persisted to `<vault>/.jotfolio/ui-state.json` after drag end (debounced 500ms).

---

## Menu bar items (native menu, registered via Electron Menu API)

**Mac menu bar:**
- JotFolio: About, Preferences (⌘,), Hide, Quit
- File: New Note (⌘N), Open Vault (⌘⇧O), Close Vault, Open Vault in Finder
- Edit: Undo, Redo, Cut, Copy, Paste, Select All
- View: Toggle Sidebar (⌘\), Toggle Detail Panel (⌘⇧R), Command Palette (⌘P), Quick Switcher (⌘O)
- Window: Minimize, Zoom, standard window items
- Help: Documentation, Report Issue

**Windows/Linux (menu hidden by default — accessed via Alt key or app menu button):**
Same items, adapted shortcuts (Ctrl instead of ⌘). The hamburger menu icon in titlebar opens the app menu as a dropdown. Alt key shows native menu bar per platform convention.

---

## Keyboard shortcuts (global, active at all times)

| Shortcut | Action |
|----------|--------|
| Ctrl/⌘+P | Open command palette |
| Ctrl/⌘+O | Open quick switcher |
| Ctrl/⌘+N | New note |
| Ctrl/⌘+, | Open settings |
| Ctrl/⌘+\ | Toggle sidebar |
| Ctrl/⌘+Shift+R | Toggle detail panel |
| Ctrl/⌘+Shift+O | Open vault in Finder/Explorer |
| Escape | Dismiss active modal/palette/panel overlay |

---

## States

**Loading (vault.list() in progress on launch):**
Center pane shows skeleton rows (3–5 placeholder bars, `--b2` background, `--jf-t-slow` pulse animation). Sidebar shows skeleton tree items. Titlebar present immediately.

**Empty vault (zero notes):**
```
           ┌──────────────────────────────────────┐
           │                                      │
           │   No notes yet.                      │
           │                                      │
           │   [ + Create your first note ]       │
           │                                      │
           │   or drag a folder of .md files      │
           │   anywhere on this window            │
           │                                      │
           └──────────────────────────────────────┘
```
Drag-and-drop target: user can drag a folder onto the window to set it as vault (triggers the same flow as "Open existing vault").

**Error — vault path missing:**
Shown as a banner at top of center pane (not a modal — user can still navigate settings).
```
┌───────────────────────────────────────────────────────────────────┐
│ ⚠ Vault not found at ~/Documents/JotFolio. Was it moved?          │
│                              [Locate vault]   [Open new vault]   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Responsive behavior

**≥1200w:** All three panes visible simultaneously.
**900–1199w:** Detail panel auto-collapses to slide-over on note open. Sidebar stays visible but narrower (200px default).
**<900w:** Not a supported layout (desktop app, minimum window width enforced at 900px via `BrowserWindow.minWidth`).
