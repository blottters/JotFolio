# JotFolio Security Threat Model

- **Date:** 2026-04-23
- **Status:** v0 — matches `0.4.0-rc.1` hardened surface
- **Owner:** Gavin
- **Next review:** before `0.5.0` (when sandboxed extension host ships)

---

## Assets

What we're protecting, in priority order:

1. **User's vault data** — `.md` files on disk. Loss, corruption, exfiltration.
2. **User's API keys + credentials** — stored in `localStorage`/`keychain` by plugins (e.g. Readwise token, OpenRouter key). Exfiltration.
3. **Arbitrary code execution on user's machine** — via JotFolio's Electron process. Compromise the box.
4. **Renderer integrity** — XSS that persists via Markdown bodies, broken frontmatter, or malicious plugin code.
5. **Auto-update channel** — replacing a signed installer with a trojaned one (Phase 6).

---

## Attacker profiles

| # | Attacker | Capability | Motivation |
|---|---------|-----------|-----------|
| A1 | Malicious vault content | Injects crafted Markdown / YAML / wiki-links into a shared or synced vault | Steal data, hijack clicks, pivot to RCE |
| A2 | Malicious plugin | Third-party JS loaded from `<vault>/.jotfolio/plugins/<id>/main.js` | Exfil notes, ransomware, RCE |
| A3 | MITM on plugin HTTP | Intercepts plugin `http.fetch` to plugin's allowlisted domain | Modify responses, steal tokens |
| A4 | Compromised sync backend | Git remote / iCloud / Dropbox used by vault is attacker-controlled | Inject A1 content, rewrite history |
| A5 | Local user (shared machine) | Another user of the OS account reads the vault folder | Read notes, API keys |
| A6 | Update-server compromise | Auto-update feed serves trojaned installer (Phase 6) | Mass RCE |

---

## Entry points (attack surface)

1. `.md` file content → `marked.parse()` → `dangerouslySetInnerHTML` in `NoteBody`
2. YAML frontmatter → `parseYaml()` in `src/lib/frontmatter.js`
3. Wiki-link rendering → `renderWikiLinks()` string replacement
4. Plugin `main.js` → `new Function('api', ...)` evaluation in renderer
5. Plugin `api.http.fetch(url, opts)` → proxied through main (Electron) or `fetch()` (browser)
6. IPC channels exposed by `src-electron/preload.js`
7. Application menu items → send events to renderer
8. Deep-link protocol handler `jotfolio://` (Phase 6)
9. File-association opens (Phase 6)
10. Auto-update feed (Phase 6)

Not in scope for v0: WebRTC, native drag-drop outside window, shared memory.

---

## Risks + mitigations

### R1 — XSS via malicious `.md` body (A1)

**Risk:** crafted Markdown contains raw HTML / scripts, or links like `javascript:` that execute on click.

**Status:** mitigated.
- `marked` is configured with `gfm: true, breaks: true` but no `sanitize: false`. Marked v18 no longer supports `sanitize` — the output is still HTML injected via `dangerouslySetInnerHTML`, so malicious HTML in the source CAN survive.
- **Fix required (Phase 5):** add DOMPurify between `marked.parse()` and render. Do NOT ship `0.4.0` without this.
- CSP (below) limits `script-src` so inline `<script>` won't execute even if it slips through.
- `javascript:` URLs blocked via CSP `script-src 'self'` and `base-uri 'none'`.

### R2 — Prototype pollution via crafted frontmatter (A1)

**Risk:** malicious YAML keys like `__proto__` or `constructor.prototype` escape into the runtime object graph.

**Status:** mitigated.
- `parseYaml()` uses `{}` literal + direct key assignment. Add explicit rejection of `__proto__`, `constructor`, `prototype` keys. (Patch in this phase.)
- Frontmatter objects are consumed read-only in `fileToEntry` — never spread into globals.

### R3 — Path traversal via crafted paths (A1, A2)

**Risk:** plugin code or malicious vault content asks for `../../etc/passwd`, Windows drive letters, symlinks that escape the vault root.

**Status:** mitigated.
- `LocalAdapter.normalizePath` rejects `..`, absolute paths, backslashes, drive letters. Verified by tests.
- `src-electron/main.js` `resolveSafe` resolves the relative path against `vaultRoot` and rejects if the result does not start with `vaultRoot + path.sep`. This catches `..` even after `path.resolve`.
- **Gap (Phase 6):** symlink following is not yet rejected. If an attacker places `a-symlink → /etc/passwd` inside the vault, `resolveSafe` still accepts it because the resolved path is technically under vault root (symlink resolution happens later). Add `realpath` check + reject files whose realpath escapes vault.

### R4 — Malicious plugin code reaches outside the permission gate

**Risk (original):** plugin `main.js` has full access to `window`, DOM, and anything reachable from the renderer global scope.

**Status: MITIGATED (v0.5.0-alpha.1, 2026-04-24).** Plugin code now runs inside a dedicated Web Worker per plugin.

**Mitigation details:**
- `src/plugins/pluginWorker.js` is the Worker bootstrap. First thing it runs: `self.fetch = undefined; self.XMLHttpRequest = undefined; self.WebSocket = undefined; self.EventSource = undefined; self.importScripts = undefined; self.indexedDB = undefined; self.caches = undefined; self.BroadcastChannel = undefined; self.Worker = undefined; self.SharedWorker = undefined; self.ServiceWorker = undefined; self.Notification = undefined; self.localStorage = undefined; self.sessionStorage = undefined;`
- A Web Worker by spec has no `window`, no `document`, no DOM access. The bootstrap removes the remaining network + storage primitives that Workers would otherwise have.
- The only channel out of the Worker is `postMessage` to the parent. The parent (`src/plugins/PluginBridge.js`) runs the permission-gated API. A plugin cannot bypass the gate by reaching around a proxy, because there is no proxy — the API is RPC over postMessage and permissions are enforced in the parent's RPC router.
- Plugin `main.js` is loaded via Blob URL (`worker-src 'self' blob:` in CSP), not `eval` — `'unsafe-eval'` dropped from `script-src`.
- Verified by `src/plugins/__tests__/sandbox.test.js`: zero-permission plugin cannot read/write vault; `self.fetch`, `self.localStorage`, `self.XMLHttpRequest`, `self.WebSocket`, `self.EventSource`, `self.importScripts`, `self.indexedDB`, `self.caches`, `self.BroadcastChannel`, `self.Worker` all `typeof === 'undefined'` after bootstrap; `http.fetch` allowlist enforced in parent (plugin can't call raw fetch); terminating the bridge unregisters all commands.

**Residual risk:** a plugin can still CPU-spin or attempt denial-of-service by posting large/frequent messages. The host has a 30-second command timeout per RPC; rate limiting is not yet implemented. **Accepted risk** — renderer is trusted context, self-DoS is low impact, user can disable the plugin.

**Compat note:** v0.4.x tests (non-Worker environments like jsdom) fall back to the pre-v0.5 unsandboxed path inside `PluginHost._instantiateUnsandboxed`. Production always has `Worker`. Fallback is only used if `typeof Worker === 'undefined'`.

### R5 — Plugin network exfiltration (A2, A3)

**Risk:** plugin uses `http.fetch` to POST notes to attacker server.

**Status: MITIGATED (v0.5.0-alpha.1).**
- `http.fetch` checks `new URL(url).hostname` against manifest's `http_domains` allowlist — enforced in the parent RPC router, not in the Worker.
- Plugin can no longer bypass by using raw `fetch()` in the Worker scope: the bootstrap strips `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` from `self` before any plugin code runs. A real Web Worker has no other path to the network.
- CSP `connect-src *` remains — per-plugin allowlist is not composable into a single meta-CSP value without runtime rewrites. The effective allowlist now lives in the parent RPC router, which is the actual guard. CSP `connect-src` is a belt-and-suspenders defense only; main guard moved to the parent-side `http.fetch` handler.

### R6 — Unsafe IPC input (A1, A2)

**Risk:** attacker crafts IPC arguments that cause main-process fs operations to escape vault or exhaust resources.

**Status:** mitigated.
- Every path-accepting handler calls `resolveSafe`.
- Content length not capped — a plugin could write a 4GB file and fill disk. **Add `MAX_FILE_SIZE = 50 MB` guard in `vault:write` / `vault:writeBinary`** (Phase 5).
- No rate limiting on IPC calls; a plugin could spin and saturate the event loop. **Accepted v0 risk** — renderer is trusted context, DoS against self is low impact.

### R7 — `shell.openExternal` on attacker-controlled URL (A1)

**Risk:** user clicks a wiki-link or note link that opens `smb://evil-share` or `file://` in default handler.

**Status:** mitigated.
- `app:open-external` handler rejects anything not matching `^https?://`.
- Rendered anchor links in `NoteBody` have no click handler beyond React's default (open in same window), which for `javascript:` URLs is still blocked by CSP.

### R8 — Auto-update channel compromise (A6)

**Status:** deferred to Phase 6.
- Require HTTPS update feed with pinned cert / HSTS.
- Code-sign both Windows (EV cert) + Mac (Developer ID + notarization).
- `electron-updater` verifies signatures before applying; do not disable that check.

### R9 — User mistakes / social engineering (A2)

**Status:** partial mitigation — policy + UX.
- First-enable permission dialog (wireframe 10) surfaces what each plugin wants.
- Permission-diff re-prompt on version update.
- Plugin origin = vault folder — no marketplace means users explicitly copy files in, reducing drive-by install risk.

---

## Security controls summary

| Control | Where | Ships in |
|---|---|---|
| Path traversal rejection | `src-electron/main.js:resolveSafe`, `LocalAdapter:normalizePath` | 0.3.0 |
| Atomic writes (no partial on crash) | `src-electron/main.js:vault:write` | 0.3.0 |
| Typed errors on IPC | `VaultError` throw + serialize | 0.3.0 |
| Plugin permission gate | `PluginAPI:vaultScoped` + `httpScoped` | 0.4.0-alpha.1 |
| Plugin host domain allowlist | `PluginAPI:httpScoped` | 0.4.0-alpha.1 |
| `Object.freeze` on plugin API + manifest | `PluginAPI` | 0.4.0-rc.1 (this phase) |
| Prototype-pollution key block in YAML parser | `frontmatter.js` | 0.4.0-rc.1 |
| DOMPurify over marked output | `NoteBody` | 0.4.0-rc.1 |
| CSP meta tag | `index.html` | 0.4.0-rc.1 |
| BrowserWindow: block `new-window`, nav to non-file URLs, webview | `src-electron/main.js` | 0.4.0-rc.1 |
| Write size cap (50MB) | `src-electron/main.js` | 0.4.0-rc.1 |
| Symlink realpath check | `src-electron/main.js` | 0.5.0 |
| Sandboxed plugin host | separate BrowserWindow | 0.5.0 |
| Code signing + notarization | electron-builder + CI | 0.5.0 (Phase 6) |

---

## Known v0 gaps accepted

1. ~~Plugins run in renderer JS context (R4).~~ **Closed 2026-04-24 in v0.5.0-alpha.1 via Web Worker sandbox.**
2. CSP `connect-src *` because plugin allowlist is not yet composable into CSP. **Deprioritized** — post-sandbox, the effective guard is the parent-side RPC router, not CSP. CSP is now belt-and-suspenders only.
3. Symlink traversal not yet blocked (R3 gap) — still open, targets 0.5.x.
4. IPC rate limiting absent (R6 gap) — still open, low priority.
5. ~~Extension-host sandbox not yet implemented.~~ **Closed 2026-04-24** — sandboxed via Web Worker.
6. Worker is a less strict boundary than a separate OS process. An attacker who finds a Worker-escape bug in Chromium/V8 can still reach the renderer. That is a browser bug, not a JotFolio bug — tracked as a known engineering risk but not an app-level accepted risk.

All tracked in the project roadmap with target version. No gap is silent.

---

## References

- ADR-0001 — Monorepo layout
- ADR-0002 — VaultAdapter interface (amended)
- ADR-0003 — Plugin API v0 (notes accepted risk on sandbox)
- ADR-0004 — IPC channel map
- ADR-0005 — Frontmatter schema
- Wireframe 10 — Plugin management permissions UX
