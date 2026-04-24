# ADR-0002 — VaultAdapter Interface Contract

- **Date:** 2026-04-23
- **Status:** Proposed — Amended 2026-04-23 per wireframe 11 corruption-recovery requirement
- **Deciders:** Gavin (owner)

---

## Context

Three platform implementations (Electron/Node, Web/File System Access API, Mobile/Capacitor) must be interchangeable behind a single interface. The React layer must never call platform APIs directly. This ADR defines the contract that all implementations must satisfy.

The interface is specified in JSDoc rather than TypeScript because the project is JavaScript. The JSDoc serves as the enforceable contract — future implementations that deviate from it are bugs, not style choices.

---

## Decision

### Core type definitions

```js
/**
 * @typedef {Object} NoteFile
 * @property {string} path    - Vault-relative path, forward slashes, e.g. "notes/my-note.md"
 * @property {string} name    - Filename only, e.g. "my-note.md"
 * @property {string} folder  - Containing folder, vault-relative, e.g. "notes" or "" for root
 * @property {number} size    - File size in bytes
 * @property {number} mtime   - Last modified timestamp, milliseconds since Unix epoch
 * @property {{ code: VaultErrorCode, message: string } | undefined} error
 *   - Present when the file could not be read during list(). The file appears in the list
 *     with its path/name/folder populated but content is unavailable. The UI should surface
 *     broken files (e.g., a "corrupt" badge) rather than silently dropping them.
 *     Added 2026-04-23 per wireframe 11 corruption-recovery requirement.
 */

/**
 * @typedef {'not-found'|'access-denied'|'disk-full'|'path-traversal'|'invalid-path'|'io-error'} VaultErrorCode
 */

/**
 * @typedef {Object} WatchEvent
 * @property {'create'|'change'|'delete'} type
 * @property {string} path - Vault-relative path
 */

/**
 * @typedef {Object} VaultPickResult
 * @property {string} path - Absolute path to the vault folder on disk
 * @property {string} name - Display name (last path segment)
 */
```

### VaultError class

```js
/**
 * Typed error thrown by all VaultAdapter methods on failure.
 * Never swallow errors silently — always throw a VaultError.
 *
 * @class VaultError
 * @extends Error
 * @property {VaultErrorCode} code
 * @property {string} [detail]   - Human-readable supplementary context
 * @property {Error} [cause]     - Original underlying error, if any
 */
```

### VaultAdapter interface

All methods below are mandatory in every implementation. There are no optional methods. If a platform cannot support a method (e.g., `readBinary` on web before binary support lands), it must throw `VaultError` with code `io-error` and a descriptive `detail` — it must not silently no-op.

```js
/**
 * @interface VaultAdapter
 */

/**
 * Open a native folder-picker dialog and return the selected vault path.
 * Returns null if the user cancels without selecting a folder.
 * Must not throw on cancel — only throw VaultError on a genuine failure
 * (e.g., dialog could not open).
 *
 * @returns {Promise<VaultPickResult|null>}
 */
pickVault()

/**
 * Return the currently configured vault path, or null if no vault is open.
 * This is synchronous — implementations must cache the path from pickVault().
 *
 * @returns {string|null}
 */
getVaultPath()

/**
 * Return all .md files in the vault, recursively.
 * Excludes the .jotfolio/ directory (app internals).
 * Returns an empty array if the vault is empty — never throws for empty.
 * Throws VaultError('not-found') if the vault path no longer exists on disk.
 *
 * @returns {Promise<NoteFile[]>}
 */
list()

/**
 * Read the UTF-8 text content of a vault-relative file path.
 * Throws VaultError('not-found') if the file does not exist.
 * Throws VaultError('path-traversal') if path escapes the vault root.
 *
 * @param {string} path - Vault-relative path
 * @returns {Promise<string>}
 */
read(path)

/**
 * Write UTF-8 text content to a vault-relative path.
 * Atomic: writes to a temp file in the same directory, then renames over the target.
 * Implementations MUST guarantee no partial writes survive a crash mid-write.
 * Creates parent directories automatically if they do not exist.
 * Throws VaultError('disk-full') if there is insufficient space.
 * Throws VaultError('path-traversal') if path escapes the vault root.
 *
 * @param {string} path    - Vault-relative path
 * @param {string} content - UTF-8 content to write
 * @returns {Promise<void>}
 */
write(path, content)

/**
 * Create a directory at the vault-relative path.
 * No-op if the directory already exists (idempotent).
 * Creates intermediate directories as needed (mkdir -p semantics).
 * Throws VaultError('path-traversal') if path escapes the vault root.
 *
 * @param {string} path - Vault-relative path
 * @returns {Promise<void>}
 */
mkdir(path)

/**
 * Move or rename a file within the vault.
 * Atomic where the OS supports it (same-filesystem rename).
 * Throws VaultError('not-found') if `from` does not exist.
 * Throws VaultError('path-traversal') if either path escapes the vault root.
 *
 * @param {string} from - Vault-relative source path
 * @param {string} to   - Vault-relative destination path
 * @returns {Promise<void>}
 */
move(from, to)

/**
 * Delete a file at the vault-relative path.
 * Throws VaultError('not-found') if the file does not exist.
 * Does NOT recursively delete directories — only removes files.
 * Throws VaultError('path-traversal') if path escapes the vault root.
 *
 * @param {string} path - Vault-relative path
 * @returns {Promise<void>}
 */
remove(path)

/**
 * Subscribe to filesystem changes within the vault.
 * Callback is called with debounced, deduplicated WatchEvent objects.
 *
 * Debounce window: 50ms. Events for the same path within 50ms are merged
 * into a single delivery. The final event type wins (e.g., create + change → change).
 *
 * No-op if no vault is currently picked — the watcher does nothing until
 * pickVault() has been called and a path is set.
 *
 * Returns an unsubscribe function. Caller must invoke it on cleanup
 * (e.g., in a React useEffect cleanup or app quit handler).
 *
 * @param {(event: WatchEvent) => void} cb
 * @returns {() => void} unsubscribe
 */
watch(cb)

/**
 * Read a binary file (e.g., an image attachment) from the vault.
 * Throws VaultError('not-found') if the file does not exist.
 * Throws VaultError('path-traversal') if path escapes the vault root.
 *
 * @param {string} path - Vault-relative path
 * @returns {Promise<Uint8Array>}
 */
readBinary(path)

/**
 * Write binary data to a vault-relative path.
 * Same atomicity guarantee as write() — temp-file + rename.
 * Creates parent directories automatically.
 *
 * @param {string} path   - Vault-relative path
 * @param {Uint8Array} data
 * @returns {Promise<void>}
 */
writeBinary(path, data)
```

### Atomicity requirement (transactional writes)

Every `write()` and `writeBinary()` implementation must use the temp-file-then-rename pattern:

1. Write content to `<target-path>.tmp.<random-suffix>` in the same directory.
2. Rename the temp file over the target path.

On POSIX systems this rename is atomic at the OS level. On Windows, `fs.rename` is not atomic when crossing filesystem boundaries, but within the same volume it is. All vault files are within one directory tree on one volume, so this holds.

This guarantee means: if JotFolio crashes mid-write, the user will either have the old complete file or the new complete file. They will never have a half-written file.

Implementations that skip this and use a direct write (open → write → close) are non-conforming, regardless of how unlikely a mid-write crash appears.

---

## Consequences

**Gains:**
- React components and features interact with one clean API. Platform differences are invisible above the adapter layer.
- Typed errors mean the UI can display meaningful messages ("Disk full — free up space and try again") instead of generic failures.
- Atomicity guarantee protects user data — this is load-bearing for a local-first app where there is no server-side recovery.
- The watch() debounce/dedupe contract prevents excessive re-render cascades when external tools (Git, iCloud sync) touch many files at once.

**Trade-offs:**
- `getVaultPath()` is synchronous, which requires implementations to maintain a cached reference. The alternative (making it async) adds await boilerplate at every call site for a value that changes at most once per session.
- Atomic writes require the temp file and target to be on the same filesystem. This is guaranteed because both live under the vault root. Document this assumption in `NodeFsAdapter` — do not attempt cross-device moves.
- The 50ms debounce window is a tuning parameter. It was chosen to handle rapid burst saves from external sync tools. If users report missing events, tighten to 20ms. If they report performance issues on large vaults, widen to 150ms.

---

## Alternatives Considered

**A. Pass-through native errors instead of VaultError**
Rejected. Node `fs` errors include system codes (`ENOENT`, `EACCES`, `ENOSPC`) that vary by OS. The web File System Access API throws `DOMException`. Capacitor throws its own shape. Catching and re-throwing as `VaultError` normalizes all of this to a single error taxonomy the UI can act on.

**B. Observable/stream-based interface instead of watch(callback)**
Considered. RxJS Observables or async iterables would be more ergonomic in some contexts. Rejected because the project does not currently use RxJS, and adding it for one interface would be disproportionate. A callback returning an unsubscribe function is sufficient and matches the React `useEffect` cleanup pattern directly.

**C. Include a `readdir()` method for listing a single directory**
Deferred to v1. `list()` returns all `.md` files across the whole vault. A per-directory scan is not needed for the current feature set (sidebar, search, constellation). Add `readdir(path)` when a folder-tree navigator requires it.

---

## Cross-references

- ADR-0001 defines where adapter implementations live (`src/adapters/`).
- ADR-0003 defines how plugins access a restricted subset of this interface via `plugin.vault.*`.
- ADR-0004 defines the IPC channels that `NodeFsAdapter` wraps.
