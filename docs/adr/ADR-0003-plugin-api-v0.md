# ADR-0003 — Plugin API v0 Surface

- **Date:** 2026-04-23
- **Status:** Proposed
- **Deciders:** Gavin (owner)

---

## Context

JotFolio's plugin system is a first-class design goal, not a future add-on. Community plugins should be distributable without a JotFolio app update, portable across user machines via vault sync, and safe by default — a malicious or buggy plugin must not be able to corrupt the vault, exfiltrate data to arbitrary domains, or crash the host app.

The v0 surface is intentionally minimal. The goal is to establish a stable, well-secured foundation. A narrow surface ships sooner, is easier to document, and creates strong incentive for community plugins to work within constraints rather than demanding new APIs before the foundation is proven.

This ADR records which four surfaces are included in v0, what each exposes, and why every other surface was deferred.

---

## Decision

### Plugin manifest format

Every plugin must ship a `manifest.json` in its plugin directory. The manifest is the trust document — the app reads it before loading any plugin code.

```json
{
  "id": "daily-notes",
  "name": "Daily Notes",
  "version": "0.1.0",
  "author": "JotFolio",
  "description": "Creates a daily journal entry for today if one does not exist.",
  "main": "main.js",
  "jotfolio_min_version": "0.3.0",
  "permissions": {
    "vault_read": true,
    "vault_write": true,
    "http_domains": ["api.readwise.io"]
  }
}
```

Rules:
- `id` must be lowercase alphanumeric with hyphens only, e.g. `daily-notes`. No dots, underscores, or spaces.
- `jotfolio_min_version` is enforced at load time. A plugin requiring `0.3.0` will not load on `0.2.x`.
- `permissions.http_domains` is an allowlist. An `http.fetch` call to a domain not in this list is blocked by the main process.
- Absent permissions default to `false`. A plugin without `vault_write: true` cannot call `plugin.vault.write()`.
- `main` is a relative path within the plugin directory. It must resolve to a `.js` file. No `.mjs`, no ESM — plugins are CommonJS modules loaded via `require()` in a sandboxed context.

### Plugin loader scan path

Plugins live inside the vault at:

```
<vault>/.jotfolio/plugins/<plugin-id>/manifest.json
<vault>/.jotfolio/plugins/<plugin-id>/main.js
```

This means plugins travel with the vault. If a user syncs their vault via Git, iCloud, or Dropbox, their plugins sync automatically. No separate plugin sync mechanism is needed.

The app scans this directory on launch and after vault change events. If a new plugin directory appears in `.jotfolio/plugins/`, the app loads it without restart — hot-loading is supported for new plugin directories, not for code changes to already-loaded plugins (a reload is required for those).

### v0 API surfaces (4 only)

Plugins receive a single `plugin` object as their module export argument. The four surfaces hang off it.

---

#### Surface 1: `plugin.vault`

Scoped file operations. All paths are vault-relative. The main process enforces the vault root boundary — no `../` escape is possible. Permissions from the manifest gate write operations.

```js
/**
 * @namespace plugin.vault
 *
 * All paths are vault-relative strings, e.g. "notes/my-note.md".
 * Path traversal attempts throw VaultError('path-traversal') and are logged.
 * Methods mirror the VaultAdapter interface (ADR-0002) but are permission-gated.
 */

/** @param {string} path @returns {Promise<string>} */
plugin.vault.read(path)

/** Requires vault_write: true in manifest. @param {string} path @param {string} content @returns {Promise<void>} */
plugin.vault.write(path, content)

/** @returns {Promise<NoteFile[]>} */
plugin.vault.list()

/** Requires vault_write: true. @param {string} from @param {string} to @returns {Promise<void>} */
plugin.vault.move(from, to)

/** Requires vault_write: true. @param {string} path @returns {Promise<void>} */
plugin.vault.remove(path)

/** Requires vault_write: true. @param {string} path @returns {Promise<void>} */
plugin.vault.mkdir(path)

/**
 * Subscribe to vault filesystem changes.
 * Returns unsubscribe function.
 * @param {(event: WatchEvent) => void} cb
 * @returns {() => void}
 */
plugin.vault.watch(cb)
```

---

#### Surface 2: `plugin.commands`

Registers a command in the application command palette. Commands are the primary UI entry point for plugins — no ribbon, no custom sidebar panels, no settings UI in v0. A command is a named action the user can invoke by name.

```js
/**
 * Register a command in the command palette.
 *
 * @param {string} id       - Unique within this plugin, e.g. "create-today"
 * @param {() => void | Promise<void>} handler - Called when the user invokes the command
 * @param {Object} [options]
 * @param {string} [options.name]   - Display name in palette. Defaults to id.
 * @param {string} [options.hotkey] - Optional keybind, e.g. "Ctrl+Shift+D"
 * @param {string} [options.icon]   - Optional icon name from JotFolio's icon set
 * @returns {void}
 */
plugin.commands.register(id, handler, options)
```

Hotkey conflicts: if two plugins register the same hotkey, the second registration wins and a warning is logged to the plugin console. The first plugin's hotkey binding is removed.

---

#### Surface 3: `plugin.events`

Subscribe to application lifecycle events. Plugins use this to react to user activity without polling.

```js
/**
 * Subscribe to an application event.
 *
 * @param {string} eventName
 * @param {(payload: any) => void} cb
 * @returns {() => void} unsubscribe function — call this on plugin unload
 */
plugin.events.on(eventName, cb)
```

Available events in v0:

| Event name      | Payload shape                          | When fired                                      |
|-----------------|----------------------------------------|-------------------------------------------------|
| `app-ready`     | `{}`                                   | After all plugins have loaded and UI has mounted |
| `app-quit`      | `{}`                                   | Before the Electron window closes               |
| `vault-change`  | `WatchEvent`                           | Debounced file change in vault (mirrors watch)  |
| `note-open`     | `{ id: string, path: string }`         | User opens a note for viewing/editing           |
| `note-save`     | `{ id: string, path: string }`         | Note is saved to disk                           |
| `note-create`   | `{ id: string, path: string, type: string }` | New note created                         |
| `note-delete`   | `{ id: string, path: string }`         | Note moved to trash or deleted                  |

Plugins must call their unsubscribe functions when they receive `app-quit`. The loader calls plugin `onUnload()` if defined, giving plugins a chance to clean up watchers and subscriptions. A plugin that does not unsubscribe will have its listeners garbage-collected when the process exits — but clean unsubscription is expected.

---

#### Surface 4: `plugin.http`

Proxied HTTP requests through the Electron main process. This exists to bypass CORS restrictions that would otherwise block renderer-side fetch calls to external APIs.

```js
/**
 * Make an HTTP request proxied through the main process.
 * Only domains listed in manifest.permissions.http_domains are permitted.
 * Attempting to fetch a non-allowlisted domain throws an error immediately
 * without making a network request.
 *
 * @param {string} url
 * @param {RequestInit} [options] - Subset of fetch options: method, headers, body
 * @returns {Promise<{ status: number, headers: Object, body: string }>}
 */
plugin.http.fetch(url, options)
```

Note: `plugin.http.fetch` returns a plain object, not a `Response` instance. This is deliberate — serializing a `Response` across IPC is complex and the value-add over a plain `{ status, headers, body }` triple is minimal for plugin use cases. Plugins needing streaming responses must poll.

---

### Example plugin (Daily Notes)

```js
// .jotfolio/plugins/daily-notes/main.js
module.exports = function(plugin) {
  plugin.commands.register('create-today', createTodayNote, {
    name: 'Open today\'s journal',
    hotkey: 'Ctrl+Shift+D'
  });

  async function createTodayNote() {
    const today = new Date().toISOString().slice(0, 10); // "2026-04-23"
    const path = `journals/${today}.md`;
    const files = await plugin.vault.list();
    const exists = files.some(f => f.path === path);
    if (!exists) {
      const content = `---\nid: ${crypto.randomUUID()}\ntype: journal\ntitle: ${today}\nentry_date: ${today}\ncreated: ${new Date().toISOString()}\nmodified: ${new Date().toISOString()}\nstarred: false\ntags: []\nstatus: active\n---\n\n`;
      await plugin.vault.write(path, content);
    }
    // Note: opening the note in the editor requires a future UI surface (v1)
  }
};
```

---

### Deferred to v1 — full list with rationale

The following surfaces are explicitly excluded from v0. This is not a backlog — it is a deliberate decision to keep v0 shippable and auditable.

| Surface | Why deferred |
|---|---|
| `ribbon.*` | Requires a UI slot in the app shell that does not exist yet. Adding ribbon support before the app shell is stable creates a UI API that will change. |
| `settings.*` | Plugin settings panels require a settings registry, a UI container, and a serialization format. None of these exist. Plugins in v0 use hardcoded defaults or read from a file in the vault. |
| `views.*` | Custom sidebar panels, editor extensions, and pane views require a Slate or CodeMirror plugin API on top of JotFolio's editor. The editor integration architecture is not finalized. |
| `oauth.*` | OAuth flows require browser pop-ups, redirect URL handling, and token storage. The security model for storing tokens cross-platform is not designed. `http.fetch` with a manually configured API key covers 90% of v0 plugin use cases. |
| `keychain.*` | Secure credential storage requires platform-specific implementations (macOS Keychain, Windows Credential Manager, libsecret on Linux). Worth doing right; worth deferring until after v0 ships. |
| `webhook.listen` | Incoming webhooks require an always-on local HTTP server. This conflicts with Electron's single-window model and introduces port conflict risks. Deferred until there is a demonstrated plugin need. |
| `ai.complete` | Wrapping the AI surface for plugins requires an API key management strategy and rate-limit accounting. JotFolio's own AI features are not fully designed yet. |
| `mcp.expose` / `mcp.consume` | Model Context Protocol integration is a significant surface. It belongs in a dedicated ADR and is a v1+ concern. |
| `scheduler.every` | Recurring background tasks require a persistent scheduler that survives window minimize/hide. The Electron architecture does not yet include a persistent background process. |
| `notifications` | Wraps `Notification` API. Useful but not blocking any v0 plugin use case. Low effort to add in v1. |
| `clipboard` | Read/write access to the clipboard is a privacy-sensitive permission that needs deliberate UX (user consent model). Not needed for any planned v0 plugin. |

---

## Consequences

**Gains:**
- Four surfaces are easy to document, easy to audit, and easy to test.
- Vault-root boundary enforcement and domain allowlists mean a compromised plugin cannot exfiltrate arbitrary data or reach arbitrary hosts.
- Plugins living in the vault means zero separate distribution infrastructure for v0 (no plugin marketplace, no update server).
- The command palette as the primary plugin UI entry point is consistent with established Obsidian/VS Code patterns that users already understand.

**Trade-offs:**
- No settings UI means power users who want configurable plugins must edit a JSON file in the vault or accept a command-based configuration flow. This is acceptable for a technical early adopter audience.
- No `views.*` means plugins cannot extend the editor or sidebar. The Daily Notes example can create files but cannot open them — that is a v1 gap.
- CommonJS-only plugin format means ES module plugins are not supported. This simplifies the loader considerably and is a worthwhile constraint for v0.

---

## Alternatives Considered

**A. Use a VM2 or vm2-sandbox for plugin isolation**
Rejected. VM2 has known escapes. The correct isolation model is a separate renderer process (like VS Code extension host). That is a significant architectural investment. For v0, isolation is enforced by permission checks in the main process IPC handlers. The plugin code runs in the renderer's JavaScript context, which means a malicious plugin can theoretically interact with the DOM. This is an accepted risk for v0 — document it, address it in v1 with a sandboxed worker or extension host process.

**B. Expose the full VaultAdapter interface to plugins without permission gating**
Rejected. Permission gating is the entire point of the plugin model. An ungated adapter would make the manifest security declarations meaningless.

**C. Use ESM plugins with dynamic import()**
Deferred to v1. Electron's handling of ESM in renderer context has changed across versions. CommonJS is the safe default for v0.

---

## Cross-references

- ADR-0002 defines VaultAdapter interface that `plugin.vault.*` wraps.
- ADR-0004 defines the `http:fetch` IPC channel that `plugin.http.fetch()` invokes.
