# Wireframe 12 — Window Chrome & Native Integration

**Goal:** JotFolio feels like a real desktop app on each OS, not a web page in a frame. Integrates with tray, dock, taskbar, file associations, native menus.

---

## Window chrome

**Decision: native frame per OS.** No custom-drawn title bar in v0.

**Why not frameless:** a custom title bar has to re-implement window dragging, resize edges, snap assist (Windows), full-screen animation (Mac), tiling (Linux). Obsidian ships both modes ("native title bar" toggle in settings); default on Windows is native, default on Mac is frameless. Replicating frameless well costs 2+ weeks. Defer to v1.

- **Mac:** native traffic lights (close/minimize/zoom) top-left. Integrated toolbar style (`titleBarStyle: 'hiddenInset'` in BrowserWindow) so our own toolbar sits flush with the traffic lights — visually native but still uses OS window controls.
- **Windows:** standard title bar with minimize/maximize/close top-right. App icon top-left. Title = "Vault Name — JotFolio".
- **Linux:** whatever the desktop environment provides (GNOME, KDE, etc.). No custom chrome.

---

## Title format

```
<Note title if open> — <Vault name> — JotFolio
```

Examples:
- App just launched, no note: `JotFolio Vault — JotFolio`
- Note open: `On Stoicism — JotFolio Vault — JotFolio`
- Unsaved changes: prepend `•` (`• On Stoicism — ...`)

---

## Application menu (macOS menu bar + Windows/Linux window menu)

```
JotFolio                  File                  Edit                  View
  About JotFolio            New Note (⌘N)         Undo (⌘Z)            Toggle Sidebar (⌘\)
  Preferences… (⌘,)         New Note from Tpl…    Redo (⇧⌘Z)           Toggle Detail (⌘⇧\)
  ─                         Quick Capture (⇧⌘N)   ─                    ─
  Open Vault…               ─                     Cut/Copy/Paste       Command Palette (⌘P)
  Recent Vaults ▸           Open Quick Switcher   Find (⌘F)            Quick Switcher (⌘O)
  ─                         Close Tab (⌘W)        Find in Vault (⌘⇧F)  Constellation (⌘G)
  Services ▸                ─                     ─                    ─
  Hide JotFolio (⌘H)        Open in File Mgr      Jump to Today (⌘T)   Zoom In/Out (⌘+/⌘−)
  Quit JotFolio (⌘Q)        Reveal in Finder      ─                    Actual Size (⌘0)
                            ─                     Spell Check          Enter Full Screen (⌃⌘F)
                            Import…
                            Export…

Plugins                   Window                Help
  Daily Notes: Today        Minimize (⌘M)        JotFolio Help
  Git Sync: Sync Now        Zoom                 Release Notes
  ─                         ─                    ─
  Manage Plugins…           Bring All to Front   Report an Issue
                            ─                    Discord / Community
                            <Open windows list>
```

- `Plugins` menu is populated dynamically from `commands.register()` entries whose `menu: 'plugins'` option is set. Plugins without that option show up only in the command palette.
- On Windows/Linux: same menu but under standard menu bar or hamburger depending on OS.

---

## System tray (menu bar on Mac)

Click tray icon → small popup:

```
┌─────────────────────────────────┐
│  📝  JotFolio                   │
│  ─────────────────────────────  │
│  Quick Capture        ⇧⌘N       │
│  Open Today's Note    ⌘T        │
│  ─────────────────────────────  │
│  Show JotFolio                  │
│  Quit                           │
└─────────────────────────────────┘
```

Toggle in Settings > General: "Keep in tray when closed" (default on). Closing the main window minimizes to tray instead of quitting. Explicit Quit from tray menu or Cmd+Q kills.

Hides the full app quickly; `Show JotFolio` or clicking tray icon opens the main window (or focuses it if already open).

---

## Dock / Taskbar

- **Mac dock icon:** right-click → Quick Capture, Open Today's Note, Show JotFolio, Quit. Uses `app.dock.setMenu()`.
- **Windows taskbar jump list:** same menu items via `app.setJumpList()`.
- **Linux:** depends on WM. Skip custom jump list; default behavior fine.

Badge on Mac dock: shows unread count if a plugin registers one (v1 feature — stub for now).

---

## File associations

**Default: off.** Association with `.md` is fighting territory — user probably has VS Code, Obsidian, Typora, etc. already registered. Don't steal the association silently.

In Settings > General: "Register JotFolio as `.md` handler" toggle. When on:
- Mac: `electron.app.setAsDefaultProtocolClient('markdown')` + `Info.plist` document types
- Windows: registry entries under `HKCU\Software\Classes\.md` + ProgID
- Linux: `.desktop` file with MimeType=text/markdown

When user double-clicks a `.md` file and JotFolio is default:
- If file is inside current vault → open that note
- If file is outside vault → prompt: "Open vault at <parent folder>?" or "Import as new note to current vault?"

---

## Deep links (protocol handler)

Register `jotfolio://` protocol. Links like `jotfolio://open?id=<uuid>` or `jotfolio://open?path=<encoded-path>` open the app and navigate to that note.

Useful for:
- Plugin links in web pages (browser extension web-clipper, phase 4 plugin)
- Inter-app automation (Alfred workflow, Raycast extension, iOS Shortcut)
- Reminder apps linking "see note"

Security: protocol handler only accepts `open` actions and paths relative to the current vault. No arbitrary command execution.

---

## Close / quit behavior

- **Mac:** close window → app stays running in dock (standard Mac behavior). Cmd+Q quits.
- **Windows / Linux:** close window → minimizes to tray if "Keep in tray when closed" is on, otherwise quits. Close-to-tray can be turned off in Settings.
- **Force quit mid-save:** atomic file writes per ADR-0002 mean no partial writes. On next launch, app re-reads vault fresh.

---

## Auto-launch on login

Settings > General: "Launch JotFolio on login" (default off). Uses `app.setLoginItemSettings()` on Mac/Windows, `.desktop` Autostart on Linux.

---

## Full-screen

- `Ctrl/Cmd+F` → Find in current note (existing behavior, don't break)
- `Ctrl/Cmd+Shift+F` → Find in vault
- `F11` (Windows/Linux) or `Ctrl+Cmd+F` (Mac) → true OS full-screen. Hides all chrome except content.
- "Focus mode" (hides sidebar + detail panel, just editor) → `Ctrl/Cmd+Shift+Z` — app-level, not OS full-screen.

---

## Notifications

Deferred to Plugin API v1 (`notifications.show()` — see ADR-0003). Core app sends one notification only: update-available banner (via auto-update, Phase 6).

---

## Icons

- **App icon:** 1024×1024 PNG, rounded-square treatment on Mac, square on Windows. Deliver as `.icns` (Mac), `.ico` (Windows), `.png` set (Linux). Source file tracked in repo under `assets/icons/`.
- **Tray icon:** 16×16 and 32×32, monochrome template image on Mac (renders white on dark menu bar, black on light). Colored on Windows.
- **Document icon** (for associated `.md` files): distinct from app icon, has a small "JF" watermark. Only rendered when file association is on.

---

## Platform detection in renderer

Preload exposes `window.electron.platform = 'darwin' | 'win32' | 'linux'`. CSS can branch via class added to `<html>`:

```css
html.jf-platform-mac .some-element { ... }
html.jf-platform-win .some-element { ... }
```

Set in main.jsx on boot based on `window.electron.platform`.

---

## Design-token integration

- `--jf-platform-mac` / `--jf-platform-win` / `--jf-platform-linux` flags in tokens.css act as hooks for platform-specific overrides (e.g., Mac gets larger hit targets for traffic-light area).

---

## Out of scope (v0)

- Custom title bar (frameless mode)
- Multiple windows (one vault = one window)
- Picture-in-picture floating note
- Native share sheet integration
- Touch Bar (Mac, deprecated)
- Taskbar thumbnails with live preview (Windows)

---

## Implementation notes

- Source: `src-electron/main.ts` (window + menu + tray setup), `src-electron/menus.ts`, `src-electron/protocol.ts`
- Menu built dynamically on app ready, re-built when plugins register new commands
- Tray icon built only if Settings > General > "Show tray icon" is on (default on)
- Deep-link protocol handler registered in `main.ts` before app ready event
