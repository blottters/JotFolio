# IPC Audit

Every IPC channel exposed from `src-electron/main.js` to the renderer via `src-electron/preload.js`, with its input contract, output shape, validation, and trust boundary.

Reviewed against the threat model — each row either mitigates a threat or accepts a documented risk.

---

## Channels (as of 0.5.0-alpha.14)

| Channel | Direction | Input | Output | Validation | Trust |
|---|---|---|---|---|---|
| `vault:pick` | renderer → main | — | `{ path, name } \| null` | User OS dialog controls choice | Renderer-supplied nothing; user picks path via native dialog |
| `vault:current` | renderer → main | — | `string \| null` | — | Main-maintained state; no user input |
| `vault:list` | renderer → main | — | `NoteFile[]` (may include `error` field per ADR-0002) | Walks vault root, skips dotfiles except `.jotfolio`, only emits `.md` | Scan runs as main-process user, cannot escape because `walk()` starts at `vaultRoot` |
| `vault:read` | renderer → main | `path: string` | `string` (utf8) | `resolveSafe(path)` asserts path stays inside vault | High-risk channel; traversal attempts blocked |
| `vault:write` | renderer → main | `path: string, content: string` | `undefined` | `resolveSafe` + atomic write via temp+rename. **v0.4.0-rc.1 adds 50MB size cap.** | Writes land inside vault only |
| `vault:mkdir` | renderer → main | `path: string` | `undefined` | `resolveSafe` | Low risk |
| `vault:move` | renderer → main | `from: string, to: string` | `undefined` | `resolveSafe` on both. Destination parent mkdir'd. | Traversal on either arg rejected |
| `vault:remove` | renderer → main | `path: string` | `undefined` | `resolveSafe` | Cannot delete outside vault |
| `vault:readBinary` / `writeBinary` | renderer → main | `path: string[, data: Uint8Array]` | `Uint8Array \| undefined` | `resolveSafe` + 50MB cap on writeBinary | Same path safety as text variants |
| `vault:watch:event` | main → renderer (send) | — | `{ type: 'create'\|'change'\|'delete', path: string }` | chokidar emits paths relative to vaultRoot; converted before send | One-way push; no renderer-supplied input |
| `app:open-external` | renderer → main | `url: string` | `undefined` | **Strict:** only `^https?://` accepted. All other protocols rejected with `VaultError('invalid-path')` | Blocks `file://`, `smb://`, `javascript:`, `jotfolio://`, etc. |
| `app:show-item-in-folder` | renderer → main | `relPath: string` | `undefined` | `resolveSafe` before calling `shell.showItemInFolder` | Can only reveal files inside vault |
| `app:relaunch` | renderer → main | — | never (exits process) | — | Trivial; benign |
| `app:userDataPath` | renderer → main | — | `string` | — | Read-only lookup |
| `snapshot:list` | renderer → main | `relPath: string` | `SnapshotRecord[]` | Snapshot module is scoped to current vault root | Lists recovery snapshots for a vault file |
| `snapshot:restore` | renderer → main | `relPath: string, date: string` | restore result | Snapshot module is scoped to current vault root | Restores a recovery snapshot for a vault file |
| `update:check` | renderer → main | — | `{ ok, info?, error? }` | Packaged updater owns remote lookup | Manual check-now trigger; no renderer URL input |
| `update:install-now` | renderer → main | — | process restarts | — | Applies already-downloaded update |
| `update:status` | main → renderer (send) | — | `{ state, version?, message?, percent? }` | Main-originated updater event | Drives banner and Settings > Updates |
| `telemetry:getOptIn` | renderer → main | — | `{ enabled, decided }` | Read-only settings lookup | Keeps Privacy UI aligned with main-process opt-in gate |
| `telemetry:setOptIn` | renderer → main | `enabled: boolean` | `{ ok, enabled?, error? }` | Coerces to boolean; writes only telemetry preference | Enables/disables opt-in crash telemetry in Electron settings |
| `menu:*` events | main → renderer (send) | — | — | Strings dispatched from native menu clicks; renderer treats as commands | Main-originated; treated as trusted |
| **Reserved / not yet wired** | | | | | |
| `plugin:list`, `plugin:enable`, `plugin:disable`, `plugin:uninstall` | | | | Phase 4b currently runs plugin host in renderer; IPC wiring lands when plugin process moves out-of-renderer (0.5.0) |
| `http:fetch` | | | | Proxy wiring lands in 0.5.0 when plugin sandbox process needs CORS bypass. Until then plugins use `window.fetch` from renderer. |

---

## Preload surface (what the renderer sees)

Exposed via `contextBridge.exposeInMainWorld('electron', ...)`:

```ts
window.electron = {
  vault: {
    pick(): Promise<{path,name}|null>
    currentPath(): Promise<string|null>
    list(): Promise<NoteFile[]>
    read(path): Promise<string>
    write(path, content): Promise<void>
    mkdir(path): Promise<void>
    move(from, to): Promise<void>
    remove(path): Promise<void>
    readBinary(path): Promise<Uint8Array>
    writeBinary(path, data): Promise<void>
    watch(cb): () => void                // fan-out under hood
  },
  app: {
    openExternal(url): Promise<void>
    showItemInFolder(relPath): Promise<void>
    relaunch(): Promise<void>
    userDataPath(): Promise<string>
  },
  snapshots: {
    list(relPath): Promise<SnapshotRecord[]>
    restore(relPath, date): Promise<void>
  },
  updater: {
    check(): Promise<{ok:boolean, info?:unknown, error?:string}>
    installNow(): Promise<void>
    onStatus(cb): () => void
  },
  telemetry: {
    getOptIn(): Promise<{enabled:boolean, decided:boolean}>
    setOptIn(enabled): Promise<{ok:boolean, enabled?:boolean, error?:string}>
  },
  plugin: {
    list(): Promise<[]>
    enable(id): throws
    disable(id): throws
  },
  platform: 'darwin' | 'win32' | 'linux',
};
```

Nothing else from `ipcRenderer`, `process`, `require`, `Buffer`, `fs`, etc. is exposed. `contextIsolation: true` + `nodeIntegration: false` enforce this.

---

## Validation rules (canonical)

### `resolveSafe(rel)` — `src-electron/main.js`

```
if vaultRoot is null → throw 'not-available'
if rel is empty / not a string → throw 'invalid-path'
if rel contains '\' → throw 'invalid-path'
if rel is absolute → throw 'invalid-path'
if any segment is '..' → throw 'path-traversal'
abs = path.resolve(vaultRoot, rel)
if abs does NOT start with vaultRoot + path.sep and abs !== vaultRoot → throw 'path-traversal'
return abs
```

**Gap (tracked):** `resolveSafe` does not call `realpath`. A symlink inside the vault whose target is outside the vault passes `resolveSafe`'s string comparison but physically reads/writes outside. Fix = call `fs.realpath(abs)` then re-check prefix. Ships in 0.5.0.

### Size caps

- `vault:write` + `vault:writeBinary` reject payloads > 50 MB with `VaultError('io-error', 'payload too large')`. Caps both string and `Uint8Array` via `Buffer.byteLength` / `.byteLength`.

### URL scheme allowlist

- `app:open-external` accepts only `http:` + `https:` via `^https?://` regex on trimmed input. Everything else → `VaultError('invalid-path', 'Only http(s) URLs allowed')`.

---

## Denylist

Explicit operations NOT exposed by design:

- Arbitrary shell execution (`child_process.spawn`, `exec`)
- Arbitrary fs access outside vault (`fs.readFile`, `fs.writeFile`, etc.)
- Raw `ipcRenderer.send` / `on` from renderer
- `remote` module (deprecated in Electron; also `@electron/remote` not installed)
- `webview` tag (blocked at `web-preferences` level)
- `window.open` from renderer (blocked via `setWindowOpenHandler`)
- Navigation to non-local URLs (blocked via `will-navigate` handler)

These blocks are asserted in `src-electron/main.js` per v0.4.0-rc.1.

---

## Review cadence

Every minor version bump. Diff IPC surface vs this document. Any new channel must:

1. Have a row in the table above.
2. Declare validation rules.
3. Cross-reference which threat-model risk it addresses or accepts.
4. Pass at least one happy-path test + one attacker-path test.

No undocumented IPC channels.
