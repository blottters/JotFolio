# ADR-0004 — IPC Channel Map

- **Date:** 2026-04-23
- **Status:** Proposed
- **Deciders:** Gavin (owner)

---

## Context

Electron's renderer process runs in a sandboxed browser context. It cannot access Node APIs (`fs`, `path`, `shell`) directly. All privileged operations must go through the main process via IPC. The preload script acts as the only bridge, using `contextBridge` to expose a typed API on `window.electron`.

This ADR defines every IPC channel in v0 — its direction, payload shape, response shape, and which layer invokes it. It also defines the security constraints applied to every inbound request.

---

## Decision

### Architectural rules

1. **No raw `ipcRenderer` in the renderer.** The renderer never calls `ipcRenderer.invoke()` or `ipcRenderer.send()` directly. All IPC goes through `window.electron`, which is exposed by the preload via `contextBridge`. This is enforced by not exposing `ipcRenderer` through the bridge at all.

2. **All path inputs are canonicalized and boundary-checked.** Every channel that accepts a `path` argument runs two checks in the main process handler before any filesystem operation:
   - Canonicalize: resolve the path relative to the vault root using `path.resolve(vaultRoot, inputPath)`.
   - Boundary check: verify the resolved absolute path starts with `vaultRoot + path.sep`. If it does not, return a `VaultError('path-traversal')` error immediately without performing any I/O.

3. **Channels are namespaced.** All channels use the `namespace:action` format. The namespaces are `vault`, `plugin`, `http`, and `app`.

4. **Push notifications for watch use `event.sender.send`.** The `vault:watch` channel is the only channel that pushes data from main to renderer outside of a request/response cycle. The main process calls `event.sender.send('vault:watch-event', payload)` to push change events to the subscribing renderer window.

---

### Channel table

| Channel | Direction | Payload schema | Response schema | Invoked by |
|---|---|---|---|---|
| `vault:pick` | renderer → main | `{}` | `{ path: string, name: string } \| null` | `window.electron.vault.pick()` |
| `vault:list` | renderer → main | `{}` | `NoteFile[]` | `window.electron.vault.list()` |
| `vault:read` | renderer → main | `{ path: string }` | `{ content: string }` | `window.electron.vault.read(path)` |
| `vault:write` | renderer → main | `{ path: string, content: string }` | `{}` | `window.electron.vault.write(path, content)` |
| `vault:move` | renderer → main | `{ from: string, to: string }` | `{}` | `window.electron.vault.move(from, to)` |
| `vault:remove` | renderer → main | `{ path: string }` | `{}` | `window.electron.vault.remove(path)` |
| `vault:mkdir` | renderer → main | `{ path: string }` | `{}` | `window.electron.vault.mkdir(path)` |
| `vault:watch` | renderer → main | `{}` | `{}` (ack only) | `window.electron.vault.watch()` — subscribes once per window |
| `vault:watch-event` | main → renderer | `WatchEvent` | n/a (push) | Main process fs.watch listener |
| `vault:unwatch` | renderer → main | `{}` | `{}` | `window.electron.vault.unwatch()` |
| `plugin:list` | renderer → main | `{}` | `PluginManifest[]` | `window.electron.plugin.list()` |
| `plugin:enable` | renderer → main | `{ id: string }` | `{}` | `window.electron.plugin.enable(id)` |
| `plugin:disable` | renderer → main | `{ id: string }` | `{}` | `window.electron.plugin.disable(id)` |
| `plugin:uninstall` | renderer → main | `{ id: string }` | `{}` | `window.electron.plugin.uninstall(id)` |
| `http:fetch` | renderer → main | `{ url: string, options: RequestInit, pluginId: string }` | `{ status: number, headers: object, body: string }` | `window.electron.http.fetch(url, options, pluginId)` |
| `app:open-external` | renderer → main | `{ url: string }` | `{}` | `window.electron.app.openExternal(url)` |
| `app:show-item-in-folder` | renderer → main | `{ path: string }` | `{}` | `window.electron.app.showItemInFolder(path)` |
| `app:relaunch` | renderer → main | `{}` | `{}` | `window.electron.app.relaunch()` |

---

### Security rules per channel

**`vault:read`, `vault:write`, `vault:move`, `vault:remove`, `vault:mkdir`**
- Path canonicalization + boundary check (described above).
- `vault:write` uses temp-file-then-rename atomicity (see ADR-0002).
- `vault:remove` only removes files, not directories.

**`http:fetch`**
- The `pluginId` in the payload is used to look up the plugin's `manifest.permissions.http_domains` allowlist.
- The main process parses `url`, extracts the hostname, and checks it against the allowlist.
- If the hostname is not in the allowlist, the request is rejected with a `403`-style error object before any network call is made.
- The main process performs the actual `fetch()` call, not the renderer. This is what bypasses CORS.
- Redirect following is disabled by default (`redirect: 'error'`). Plugins that follow redirects must handle them manually. This prevents a redirect from escaping the domain allowlist.

**`app:open-external`**
- URL must begin with `https://` or `mailto:`. Anything else is rejected.
- `http://` URLs are blocked (downgrade attack vector).
- `file://` URLs are blocked (could open local paths outside vault).

**`plugin:uninstall`**
- Deletes `<vault>/.jotfolio/plugins/<id>/` directory after verifying the path is inside `.jotfolio/plugins/`.
- Performs an unload of the plugin's event listeners and commands before deletion.

---

### contextBridge surface

The preload script exposes exactly this shape on `window.electron`. Nothing else.

```js
// src-electron/preload.js (structure — not implementation)
contextBridge.exposeInMainWorld('electron', {
  vault: {
    pick:    ()              => ipcRenderer.invoke('vault:pick'),
    list:    ()              => ipcRenderer.invoke('vault:list'),
    read:    (path)          => ipcRenderer.invoke('vault:read', { path }),
    write:   (path, content) => ipcRenderer.invoke('vault:write', { path, content }),
    move:    (from, to)      => ipcRenderer.invoke('vault:move', { from, to }),
    remove:  (path)          => ipcRenderer.invoke('vault:remove', { path }),
    mkdir:   (path)          => ipcRenderer.invoke('vault:mkdir', { path }),
    watch:   (cb)            => {
      ipcRenderer.invoke('vault:watch');
      ipcRenderer.on('vault:watch-event', (_, event) => cb(event));
      return () => ipcRenderer.invoke('vault:unwatch');
    },
  },
  plugin: {
    list:      ()     => ipcRenderer.invoke('plugin:list'),
    enable:    (id)   => ipcRenderer.invoke('plugin:enable', { id }),
    disable:   (id)   => ipcRenderer.invoke('plugin:disable', { id }),
    uninstall: (id)   => ipcRenderer.invoke('plugin:uninstall', { id }),
  },
  http: {
    fetch: (url, options, pluginId) => ipcRenderer.invoke('http:fetch', { url, options, pluginId }),
  },
  app: {
    openExternal:      (url)  => ipcRenderer.invoke('app:open-external', { url }),
    showItemInFolder:  (path) => ipcRenderer.invoke('app:show-item-in-folder', { path }),
    relaunch:          ()     => ipcRenderer.invoke('app:relaunch'),
  },
});
```

No other properties are exposed. The renderer has no access to `ipcRenderer`, `remote`, `shell`, `fs`, or any other Electron/Node API.

---

### Error propagation

When a main process handler throws (including `VaultError`), the error is serialized and re-thrown in the renderer via the `ipcRenderer.invoke` rejection. The contextBridge preserves promise rejection.

Serialization format: `{ code: VaultErrorCode, message: string, detail?: string }`. The VaultError class in the renderer deserializes this back into a typed VaultError. Callers in the React layer should handle `VaultError` by code, not by message string.

---

## Consequences

**Gains:**
- Complete inventory of every cross-process call. Any channel not in this table is unauthorized and should be rejected by `ipcMain` if it appears.
- Path canonicalization + boundary check in one place (main process) means the renderer cannot accidentally introduce path traversal regardless of how it constructs paths.
- Domain allowlist enforcement in main process means plugins cannot sneak requests to unlisted domains by composing URLs at runtime.
- `window.electron` shape is explicit and auditable. Adding a new channel requires updating this ADR, which creates a natural review checkpoint.

**Trade-offs:**
- Every async operation crosses a process boundary, which adds latency (~0.5–2ms per call). For vault operations, this is acceptable — notes are not written at sub-millisecond rates.
- The `vault:watch` subscription model (one subscription per window) means multiple React components subscribing to `window.electron.vault.watch()` would register multiple IPC listeners. The adapter layer (`NodeFsAdapter`) must deduplicate this into a single IPC subscription and fan out to local subscribers. This is the adapter's responsibility, not the IPC layer's.
- `http:fetch` response body is a string. Binary responses (images, PDFs) are base64-encoded. This is a known limitation for v0 — binary plugin HTTP responses will require `btoa`/`atob` round-tripping. Acceptable for the expected v0 plugin use cases (API calls, not file downloads).

---

## Alternatives Considered

**A. Expose `ipcRenderer` directly via contextBridge**
Rejected. This is the anti-pattern Electron's security docs explicitly warn against. It gives the renderer unrestricted IPC access, bypassing all channel-level input validation.

**B. Use a custom protocol (`jotfolio://`) for vault file access instead of IPC**
Considered. Custom protocols can serve vault files directly to the renderer without IPC overhead. Rejected for v0 because the security model for custom protocols (CSP, CORS headers, origin isolation) is more complex than IPC, and the performance difference is not meaningful for text files. Reconsider for binary attachment serving in v1 — serving images via custom protocol avoids the base64 overhead.

**C. Merge `vault:watch` and `vault:list` into a single reactive subscription**
Rejected. Conflating "get current state" with "subscribe to changes" creates a stateful channel that is harder to reason about. Keep them separate — `vault:list` is a one-shot read, `vault:watch` is an ongoing subscription.

---

## Cross-references

- ADR-0001 defines `src-electron/ipc/` as the location for main process channel handlers.
- ADR-0002 defines VaultAdapter interface, which `NodeFsAdapter` satisfies by wrapping these IPC channels.
- ADR-0003 defines how `plugin.http.fetch()` maps to the `http:fetch` channel.
