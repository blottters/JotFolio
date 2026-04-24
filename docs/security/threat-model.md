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

### R4 — Malicious plugin runs in renderer (A2)

**Risk:** plugin `main.js` has full access to `window`, DOM, and anything reachable from the renderer global scope.

**Status:** accepted risk for v0 per ADR-0003.
- Plugin API v0 is the advertised surface — but `main.js` can reach around it via `window.fetch`, `window.localStorage`, DOM, etc.
- Mitigations in place (Phase 5):
  - Plugin manifest + API object are `Object.freeze`d so plugin cannot swap out functions at runtime.
  - Permissions checked inside PluginAPI before every `vault.*` call; bypassable via `window.vault` direct access because adapter is not frozen.
  - `window.electron.vault` is exposed to renderer (not scoped per plugin); a malicious plugin can call it directly and ignore its manifest permissions. **This is the real gap.**
- **v1 plan:** run plugins in a sandboxed extension host (separate `BrowserWindow` with `nodeIntegration: false, contextIsolation: true, sandbox: true`, postMessage bridge, no DOM access). Plugin code gets the frozen API and nothing else. Tracked as "Phase 5.5 — sandboxed plugins" in the roadmap.
- Until then: **users should only enable trusted plugins**. The permission dialog in wireframe 10 sets expectations; it does not enforce them at runtime.

### R5 — Plugin network exfiltration (A2, A3)

**Risk:** plugin uses `http.fetch` to POST notes to attacker server.

**Status:** partially mitigated.
- `http.fetch` checks `new URL(url).hostname` against manifest's `http_domains` allowlist.
- Plugin can bypass by using `window.fetch` directly (R4 applies).
- CSP `connect-src` restricts origins the renderer can reach to `self` + explicitly allowed domains. Plugin allowlist entries must be injected into CSP dynamically, which is fragile. **Current compromise:** CSP allows `connect-src *` for v0 because the allowlist is per-plugin, not global. Revisit in v1 when plugins run in their own context with their own CSP.

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

1. Plugins run in renderer JS context (R4). Users trust plugins.
2. CSP `connect-src *` because plugin allowlist is not yet composable into CSP (R5).
3. Symlink traversal not yet blocked (R3 gap).
4. IPC rate limiting absent (R6 gap).
5. Extension-host sandbox not yet implemented (ADR-0003 accepted risk).

All tracked in the project roadmap with target version. No gap is silent.

---

## References

- ADR-0001 — Monorepo layout
- ADR-0002 — VaultAdapter interface (amended)
- ADR-0003 — Plugin API v0 (notes accepted risk on sandbox)
- ADR-0004 — IPC channel map
- ADR-0005 — Frontmatter schema
- Wireframe 10 — Plugin management permissions UX
