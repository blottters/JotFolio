# Wireframe 10 — Plugin Management

**Goal:** User sees what plugins run against their vault, what each wants, and can toggle/uninstall each.
**Primary action:** Enable or disable a plugin.
**Secondary actions:** Review permissions, uninstall, view plugin folder, check for crashes.
**Surface:** Settings > Plugins tab (tab added in wireframe 09).

---

## Layout — Plugins tab

```
┌─ Settings: Plugins ─────────────────────────────────────────────────────────┐
│                                                                              │
│  Plugins live at <vault>/.jotfolio/plugins/                        [Open ↗] │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 📅  Daily Notes                                           [●─── on]    │ │
│  │     v0.1.0 · JotFolio · Creates a note for each day                    │ │
│  │     Permissions: vault read, vault write                               │ │
│  │     [Configure] [View folder] [Uninstall]                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 🔗  Git Sync                                              [●─── on]    │ │
│  │     v0.1.0 · JotFolio · Commits + pushes vault on save                 │ │
│  │     Permissions: vault read, vault write, http: github.com             │ │
│  │     [Configure] [View folder] [Uninstall]                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 📥  Readwise Import                                       [──●─  off]  │ │
│  │     v0.2.3 · @rw-community · Pulls highlights from Readwise           │ │
│  │     Permissions: vault write, http: api.readwise.io                   │ │
│  │     [Configure] [View folder] [Uninstall]                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Failed to load ───────────────────────────────────────────────────────┐ │
│  │ ⚠️  Graph-Embed                                           [disabled]    │ │
│  │     v0.0.9 · @third-party                                              │ │
│  │     Error: manifest.json missing "main" field                          │ │
│  │     [View error log] [View folder] [Remove]                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ℹ️  Install a plugin by dropping its folder into                            │
│     <vault>/.jotfolio/plugins/ and restarting JotFolio.                      │
│     There is no marketplace in this version.                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Permission review flow (enabling for first time)

When user toggles a disabled plugin ON for the first time:

```
┌─ Enable Readwise Import? ──────────────────────────────────────────────────┐
│                                                                              │
│  This plugin wants permission to:                                            │
│                                                                              │
│    📝  Read files in your vault                                              │
│    ✍️  Write files in your vault                                              │
│    🌐  Make network requests to:                                             │
│         • api.readwise.io                                                    │
│                                                                              │
│  Plugin code will run inside JotFolio. Only enable plugins you trust.        │
│                                                                              │
│                                         [Cancel]  [Enable]                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Why shown once, not every launch:** repeated nags train users to click-through. Capture the informed-consent moment on first enable; toggle state persists from there. If plugin updates its `permissions` block in a future version, show this modal again with the diff highlighted ("now also wants: http: evernote.com").

---

## States

- **No plugins installed** — empty state: illustration + "Drop a plugin folder into `<path>` and restart" + link to "How plugins work" doc. No install button (no marketplace).
- **Plugin loaded, not enabled** — toggle off by default after first install. Never auto-enable.
- **Plugin enabled, healthy** — runs in background; status dot green next to name in the plugin row (not shown in ASCII above; render via `--ac` dot, 6px).
- **Plugin crashed at runtime** — row shows red border, error preview, "[View error log]" opens a modal with the stack trace. Plugin auto-disabled until user manually re-enables (reloading might crash again).
- **Plugin manifest invalid** — row moved to "Failed to load" section as shown.
- **Permission diff on update** — when plugin version changes, re-show permission modal with new permissions highlighted. Plugin stays disabled until re-approved.

---

## Interactions

- Toggle switch: click — debounced 400ms to avoid rapid flipping. Flips plugin enabled state and writes to `<vault>/.jotfolio/settings/plugins.json`. If enabling and permissions not yet granted, open permission modal first.
- `[Configure]` — opens plugin-defined settings view. In v0 this is just a basic form generated from plugin's `settings.schema.json` (deferred to plugin API v1 for real schema). For v0, shows a button: "Open config file" that opens the plugin's own JSON in system default editor.
- `[View folder]` — opens `<vault>/.jotfolio/plugins/<id>/` in Finder/Explorer via `app:show-item-in-folder` IPC.
- `[Uninstall]` — confirms, then deletes the plugin folder. Does NOT remove data the plugin wrote to the vault (notes it created are regular `.md` files, user keeps them).
- `[Remove]` (on failed plugin) — same as uninstall. Skip confirmation because the plugin isn't working.

---

## Keyboard

- `Tab` / `Shift+Tab` — cycle between plugin rows.
- `Space` — toggle enabled.
- `Enter` on a row — open Configure.
- `Delete` — uninstall (with confirm).

---

## Error states

- **Permission denied writing to `<vault>/.jotfolio/`** — show banner: "Plugin settings can't be saved. Vault `.jotfolio` folder is not writable." + link to vault permissions diagnostic.
- **Plugin folder manually deleted while app running** — row disappears on next refresh; no error thrown.
- **Two plugins declare the same `id`** — second one fails to load with error: "Duplicate plugin id `daily-notes`. See `<path>`". Both shown in Failed section.

---

## Responsive

- At 900px window width: plugin row collapses permission list into "…" — tap to expand inline.
- At <600px: this entire Settings panel goes full-screen (mobile wrap, post-Capacitor).

---

## Out of scope (v0)

- Marketplace / directory
- Auto-update for plugins
- Plugin ratings / reviews
- Sandboxed plugin process (v0 runs in renderer per ADR-0003; v1 adds extension host)

---

## Implementation notes

- Source: `src/features/settings/PluginsPanel.jsx` (new file in Phase 4)
- Data: loaded via `plugin:list` IPC channel (ADR-0004) on mount + poll every 5s while settings open
- Icons: emoji from plugin manifest's `icon` field fallback `🔌`
- Permission list rendered from manifest's `permissions` block (ADR-0003)
