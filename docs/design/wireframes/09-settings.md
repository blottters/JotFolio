# Wireframe 09 — Settings

**Goal:** Central control panel for vault, appearance, plugins, sync, and shortcuts. Accessible without disrupting the current note.
**Primary action:** Change a setting and see it take effect.
**Secondary actions:** Navigate sections, close and return to the editor.

**Trigger:** Ctrl/⌘+, (comma) from anywhere, or the settings gear icon in the titlebar.

---

## Layout — Full pane overlay

Settings is a **full pane overlay** covering the editor area (center pane + detail panel). It does NOT cover the sidebar. The sidebar remains interactive while settings is open.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [◉ ◉ ◉]  JotFolio — My Vault              [🔍] [⌘P]           [⚙]  [─][□][✕]│  ← titlebar (unchanged)
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │                                                                  │
│  SIDEBAR   │  ┌─ Settings overlay ──────────────────────────────────────┐   │
│  (still    │  │                                                           │   │
│  active)   │  │   Settings                                           [✕]  │   │  ← close button top-right
│            │  │                                                           │   │
│            │  │  ┌─────────────┬────────────────────────────────────┐   │   │
│            │  │  │             │                                     │   │   │
│            │  │  │  Vault      │  ← active section                  │   │   │
│            │  │  │  ─────────  │                                     │   │   │
│            │  │  │  Theme      │  Content area for selected section  │   │   │
│            │  │  │  AI         │                                     │   │   │
│            │  │  │  General    │  (see individual section layouts    │   │   │
│            │  │  │  Plugins    │   below)                            │   │   │
│            │  │  │  Sync       │                                     │   │   │
│            │  │  │  Shortcuts  │                                     │   │   │
│            │  │  │             │                                     │   │   │
│            │  │  └─────────────┴────────────────────────────────────┘   │   │
│            │  └──────────────────────────────────────────────────────────┘   │
│            │                                                                  │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

**Overlay dimensions:** Full height of the center+detail area. Left edge aligns with the sidebar's right edge. `--b1` background. `--jf-shadow-lg` on the left edge to separate from sidebar.

**Left nav width:** 160px fixed. `--b2` background. Nav items: `--jf-text-sm`, `--t2` color by default, `--tx` color when active, `--cd` background when active.

**Nav order (top to bottom):**
1. Vault
2. Theme *(existing — not redesigned here)*
3. AI *(existing — not redesigned here)*
4. General *(existing — not redesigned here)*
5. Plugins *(links to wireframe 10 content)*
6. Sync
7. Keyboard Shortcuts

**Close behavior:** [✕] button in top-right corner. Also Escape key when no input within the settings panel is focused (if an input has focus, Escape clears the input first, second Escape closes settings — standard pattern).

---

## Section: Vault

```
┌─────────────────────────────────────────────────────────┐
│  Vault                                                    │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  Location                                                 │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ~/Documents/JotFolio                               │  │  ← monospace, read-only, --b2 bg
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  [Open in Finder]     [Change vault location...]          │  ← OS label: Finder on Mac, Explorer on Win/Linux
│                                                           │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  Index                                                    │
│                                                           │
│  [Re-index vault]                                         │
│                                                           │
│  Last indexed: 2026-04-23 at 09:15 · 142 notes           │  ← shown after index, --t3 color
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**"Open in Finder" / "Open in Explorer":** Label is platform-conditional. Mac: "Open in Finder". Windows: "Open in Explorer". Linux: "Open in Files" (or "Open in File Manager" — generic). Uses the same IPC channel as the folder tree context menu (wireframe 03). Triggers the OS file manager at the vault root path.

**"Change vault location…":** Before opening the vault picker (wireframe 01), show an inline warning:

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │  ⚠  Changing the vault location will close the current vault.        │
  │     Any unsaved changes will be saved first.                          │
  │                                                                       │
  │                              [Continue]   [Cancel]                   │
  └─────────────────────────────────────────────────────────────────────┘
```

This replaces the section content area inline — it is NOT a modal. If user clicks Continue: auto-save fires, then the vault picker flow (wireframe 01) opens. If user clicks Cancel: the warning disappears and the Vault section returns to normal.

**"Re-index vault":** Triggers a full re-scan of the vault (reads all `.md` files, rebuilds the link graph index). The button becomes disabled while indexing.

Re-index states:

```
  [Re-index vault]               ← idle state

  [Re-indexing…  ████████░░░░]   ← indexing (progress bar, determinate if file count known)

  ✓  Index complete              ← success, shown for 3s then fades
     142 notes indexed, 3 files skipped.  [View broken files]
```

"View broken files" opens wireframe 11's broken files panel. If count is 0, "3 files skipped" is omitted.

---

## Section: Plugins

See wireframe 10 for the full content of this section. The Plugins nav item links directly to the content defined there. No summary is shown here — the nav item is the entry point.

---

## Section: Sync

```
┌─────────────────────────────────────────────────────────┐
│  Sync                                                     │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  Sync is powered by the git-sync plugin.                  │
│                                                           │
│  Install it from your vault's plugin directory to         │
│  configure Git-based sync.                                │
│                                                           │
│  Plugin location:                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ~/Documents/JotFolio/.jotfolio/plugins/git-sync/   │  │  ← monospace, read-only
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  [Installation instructions ↗]                            │  ← external link, opens in system browser
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**When git-sync plugin IS installed** (detected by the presence of `.jotfolio/plugins/git-sync/manifest.json`): Replace the placeholder content with the plugin's settings UI. In v0, this state is always the placeholder — git-sync does not ship with JotFolio. The detection logic must be implemented so the Sync section auto-upgrades when the plugin is installed.

The plugin path shown uses the live vault path (not hardcoded). Composed as: `<vaultPath>/.jotfolio/plugins/git-sync/`.

---

## Section: Keyboard Shortcuts

```
┌─────────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                                       │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  BUILT-IN SHORTCUTS                                       │
│                                                           │
│  Action                    Default         Custom         │
│  ─────────────────────────────────────────────────────   │
│  Open command palette      ⌘P              [click to set] │
│  Open quick switcher       ⌘O              [click to set] │
│  New note                  ⌘N              [click to set] │
│  Open settings             ⌘,              [click to set] │
│  Toggle sidebar            ⌘\              [click to set] │
│  Toggle detail panel       ⌘⇧R             [click to set] │
│  Open vault in Finder      ⌘⇧O             [click to set] │
│  Toggle edit/preview       ⌘E              [click to set] │
│  Force save                ⌘S              [click to set] │
│  Toggle frontmatter        ⌘⇧F             [click to set] │
│  Toggle backlinks          ⌘⇧B             [click to set] │
│  Rename selected item      F2              [click to set] │
│                                                           │
│  [Reset all to defaults]                                  │
│                                                           │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  PLUGIN SHORTCUTS                                         │
│  ⓘ  Plugin shortcuts are set in each plugin's            │
│     manifest.json and cannot be rebound here.            │
│                                                           │
│  Action                    Plugin          Shortcut       │
│  ─────────────────────────────────────────────────────   │
│  Open today's journal      daily-notes     ⌘⇧D           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Rebind flow:** Click a row in the Custom column → that cell becomes an active capture input:

```
  Open command palette      ⌘P              [Press keys…  ]   ← input state, pulsing border
```

While the capture input is active, the next key combination pressed (excluding Escape and Tab) is recorded as the custom shortcut. Modifier keys alone (Shift, Ctrl, Alt, ⌘) do not trigger capture — require at least one non-modifier key.

**Conflict detection:** If the recorded combination matches an existing shortcut:

```
  Open command palette      ⌘P              ⌘O   ⚠ Conflicts with: Open quick switcher
```

The conflict warning appears inline below the row. The custom shortcut is NOT saved until the conflict is resolved (either by changing the shortcut for this action, or by changing the conflicting action's shortcut first). The [Save] mechanism is implicit — setting a non-conflicting combo saves automatically on blur.

**Reset all to defaults:** Does NOT use `window.confirm()`. Instead, shows an inline warning card:

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │  ⚠  Reset all custom shortcuts to their defaults?                    │
  │     This cannot be undone.                                            │
  │                                                                       │
  │                              [Reset all]   [Cancel]                  │
  └─────────────────────────────────────────────────────────────────────┘
```

The warning card replaces the [Reset all to defaults] button inline. Clicking [Reset all]: clears all custom shortcuts from `ui-state.json` and the table reverts to showing only default shortcuts. Clicking [Cancel]: warning card disappears.

**Plugin shortcuts section:** Read-only. Shows hotkeys registered via `options.hotkey` in `plugin.commands.register()` calls (ADR-0003). The rebind UI is stubbed in v0 — the "click to set" interaction is absent. Instead, each row in the plugin section has no Custom column cell — only the registered hotkey is shown.

**Shortcuts persistence:** Custom shortcuts stored in `<vault>/.jotfolio/ui-state.json` under `customShortcuts: { [actionId]: string }`. Applied at app startup via the keyboard event system.

---

## Keyboard navigation within Settings

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | Move focus between controls within the active section |
| Arrow Up / Down | When focus is in the left nav, move between nav items |
| Enter | Activate focused button or nav item |
| Escape | Close settings (if no input is focused; if input focused, blur it first) |
| Ctrl/⌘+, | Close settings (toggle behavior — same shortcut that opened it) |

---

## States

**Settings first open after vault creation:** Vault section is shown by default (most relevant on first use — confirm vault location).

**Subsequent opens:** Restore the last-viewed section (persisted to `ui-state.json` under `lastSettingsSection`).

**Indexing in progress when settings opens:** The Re-index vault button shows the in-progress state if a re-index was already running.

---

## Responsive behavior

**1200w:** Full three-column layout (sidebar | settings nav | settings content) as shown.
**900w:** Left settings nav collapses to a `<select>` dropdown at the top of the content area. Selecting a section from the dropdown switches the content. The pattern is simpler than a collapsible nav and avoids a double-drawer complexity.

---

## Implementation notes

- Settings overlay is a portal component, same approach as command palette (wireframe 07). Rendered at root of React tree. `z-index: var(--jf-z-modal)` (200) — below command palette (300) so if palette is opened from within settings, it renders on top.
- Left nav active state: driven by React state (`activeSection`), not by URL routing. No hash changes. Settings is not a separate route.
- The Vault section's vault path display: read from the app's `vaultPath` context. Updates in real time if vault path changes.
- Platform-conditional button labels ("Open in Finder" vs "Open in Explorer"): use `html[data-platform]` attribute (wireframe 12 / tokens.css) to apply different label text. In React: read from an `useElectronPlatform()` hook that returns `'mac' | 'win' | 'linux'`.
- Custom shortcut capture: use a `keydown` event listener attached to the capture input. Prevent default on all keys while capturing. Reconstruct the combo string in display format (e.g., `Ctrl+Shift+K` on Windows, `⌘⇧K` on Mac).
