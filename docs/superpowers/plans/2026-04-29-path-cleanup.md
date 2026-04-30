# Path Sprawl Cleanup Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the multi-root path sprawl that caused 12+ incidents in the 2026-04-29 session. Establish a single source of truth for JotFolio source, vault, and Claude Code working dir. Retire memories that exist solely as workarounds.

**Architecture:** Don't move JotFolio. Use Windows directory symlinks (`mklink /D`) + targeted deletions. Anywhere a different root needs to access JotFolio, link to the canonical path. Keep OneDrive vault unchanged (free sync = free backup). De-duplicate AppData case. Update launch configs, memories, and shortcuts to point at one path each.

**Tech stack:** Windows 11 + Git Bash + PowerShell. No new dependencies.

**Reference incidents (verbatim from session 2026-04-29 audit):**
- Vibe Narc v2 had to correct path mid-run (`OneDrive\Desktop\JotFolio` → `C:\Dev\Projects\JotFolio`)
- SlateVault charter `.txt` source file went missing from cited Desktop path
- `launch.json` has 3 of 5 JotFolio configs pointing at stale paths
- Two `%APPDATA%` config dirs (`jotfolio/` and `JotFolio/`)
- Demo data drift: dev server A loaded demo, dev server B read different vault config, click tests flailed
- `.snapshots/` mirror returned phantom search results

---

## §0. Gating decisions (Gavin must answer BEFORE any code touches anything)

| # | Decision | My recommend | Why |
|---|---|---|---|
| **D1** | **Canonical source path** | `C:\Dev\Projects\JotFolio` | Already there. Git remote stable. CI/CD references it. Don't move. |
| **D2** | **Canonical CC working dir** | Keep `C:\Dev\Coding Agents` for general CC sessions. Add symlink `C:\Dev\Coding Agents\jotfolio` → `C:\Dev\Projects\JotFolio` for one-command access. | Doesn't break global CLAUDE.md's CC defaults. Symlink is reversible. |
| **D3** | **Vault path** | Keep `C:\Users\gavin\OneDrive\Documents\JotFolio Vault\` | OneDrive sync = free off-site backup. Don't touch. |
| **D4** | **AppData case dup** | Pick ONE — let Electron decide. Inspect both, keep the one Electron actually writes to (check `lastUpdated` mtime), delete the other. | Windows is case-insensitive on the filesystem but case-sensitive in some APIs. Two dirs is a latent bug. |
| **D5** | **OneDrive Desktop `.lnk` shortcut** | Repoint to the installed-binary `.exe`, NOT to source. Or delete entirely. | Currently shadows source-path searches. Caused multiple "file does not exist" errors. |
| **D6** | **Project-level `CLAUDE.md` for JotFolio** | YES — write `C:\Dev\Projects\JotFolio\CLAUDE.md` w/ canonical paths + traps. CC auto-reads it when in repo. | Prevents future sessions from re-discovering the sprawl. Self-documenting. |

**Gavin: lock D1-D6 before T1 below runs.** Defaults above are mine — say "use defaults" or override individually.

---

## File map

**Created:**
- `C:\Dev\Projects\JotFolio\CLAUDE.md` — project-level instructions w/ canonical paths
- `C:\Dev\Coding Agents\jotfolio` (symlink, dir) → `C:\Dev\Projects\JotFolio`

**Modified:**
- `C:\Dev\Coding Agents\.claude\launch.json` — strip stale configs, rename `jotfolio-real` → `jotfolio`
- `C:\Users\gavin\.claude\projects\C--Dev-Coding-Agents\memory\slatevault_vibe_prompt.md` — remove cited Desktop path, note source file is missing OR has been recreated
- `C:\Users\gavin\.claude\projects\C--Dev-Coding-Agents\memory\project_jotfolio_facts.md` — verify trap docs reflect post-cleanup state
- `C:\Users\gavin\.claude\projects\C--Dev-Coding-Agents\memory\MEMORY.md` — refresh entries that touch paths

**Deleted (per D4 outcome):**
- One of `C:\Users\gavin\AppData\Roaming\jotfolio\` OR `C:\Users\gavin\AppData\Roaming\JotFolio\` — whichever Electron isn't using

**Replaced (per D5 outcome):**
- `C:\Users\gavin\OneDrive\Desktop\JotFolio.lnk` — repointed to installed `.exe` OR deleted

**Untouched:**
- `C:\Dev\Projects\JotFolio\` source — stays put
- `C:\Users\gavin\OneDrive\Documents\JotFolio Vault\` — stays put
- `C:\Dev\Projects\cowork-marketplace\` — stays put (separate concern)

---

## Tasks

### T1: Inventory + map the sprawl

**Goal:** Single source of truth for "where does JotFolio live right now."

- [ ] **Step 1:** Run audit script — write results to `docs/superpowers/path-audit-2026-04-29.md`:

```powershell
# In PowerShell
$paths = @(
  "C:\Dev\Projects\JotFolio",
  "C:\Dev\Coding Agents\jotfolio",
  "C:\Dev\Coding Agents\.claude\launch.json",
  "C:\Dev\jotfolio",
  "C:\Users\gavin\OneDrive\Desktop\JotFolio",
  "C:\Users\gavin\OneDrive\Desktop\JotFolio.lnk",
  "C:\Users\gavin\OneDrive\Documents\JotFolio Vault",
  "C:\Users\gavin\AppData\Roaming\jotfolio",
  "C:\Users\gavin\AppData\Roaming\JotFolio"
)
$paths | ForEach-Object {
  $exists = Test-Path $_
  $type = if (Test-Path $_) { (Get-Item $_ -Force).LinkType } else { "n/a" }
  $modified = if ($exists) { (Get-Item $_ -Force).LastWriteTime } else { "n/a" }
  [PSCustomObject]@{ Path = $_; Exists = $exists; LinkType = $type; LastModified = $modified }
} | Format-Table -AutoSize
```

- [ ] **Step 2:** Save the output. Confirm what's a real dir, what's a `.lnk`, what's a phantom.
- [ ] **Step 3:** No commit yet — informational only.

---

### T2: Resolve `%APPDATA%` case duplication (per D4)

**Slop-trap to avoid:** Don't `rm -rf` either dir without backing up first. If both have unique data, merge before delete. AppData = user state, irrecoverable if wiped.

- [ ] **Step 1:** Compare contents:

```powershell
Get-ChildItem "C:\Users\gavin\AppData\Roaming\jotfolio" -Recurse | Sort-Object FullName
Get-ChildItem "C:\Users\gavin\AppData\Roaming\JotFolio" -Recurse | Sort-Object FullName
```

- [ ] **Step 2:** Diff `settings.json` files:

```bash
diff /c/Users/gavin/AppData/Roaming/jotfolio/settings.json /c/Users/gavin/AppData/Roaming/JotFolio/settings.json
```

- [ ] **Step 3:** Identify the active one:
  - Open the installed JotFolio app
  - Change a setting (e.g. theme)
  - Check which `settings.json` got new mtime → that's the live one

- [ ] **Step 4:** Backup BOTH to `C:\Dev\Backups\jotfolio-appdata-2026-04-29\` before any delete:

```powershell
$bak = "C:\Dev\Backups\jotfolio-appdata-2026-04-29"
New-Item -Path $bak -ItemType Directory -Force
Copy-Item "C:\Users\gavin\AppData\Roaming\jotfolio" -Destination "$bak\jotfolio" -Recurse -Force
Copy-Item "C:\Users\gavin\AppData\Roaming\JotFolio" -Destination "$bak\JotFolio" -Recurse -Force
```

- [ ] **Step 5:** Delete the inactive one:

```powershell
# Replace <inactive-name> with whichever is dead
Remove-Item "C:\Users\gavin\AppData\Roaming\<inactive-name>" -Recurse -Force
```

- [ ] **Step 6:** Restart JotFolio. Confirm settings persist + vault loads.

- [ ] **Step 7:** No git commit — this is system-level, not in the repo.

---

### T3: Clean up `launch.json`

**Slop-trap to avoid:** Don't delete a config that other tooling references. Search the codebase + plugins for any string match before removing.

- [ ] **Step 1:** Grep for `jotfolio-desktop`, `jotfolio` (the broken one), and any other config name in your `.claude/` plus `~/.claude/` + plugin caches:

```bash
grep -rn "jotfolio-desktop\|jotfolio-mockup" /c/Users/gavin/.claude /c/Dev/Coding\ Agents 2>/dev/null | head -20
```

- [ ] **Step 2:** Edit `C:\Dev\Coding Agents\.claude\launch.json`:
  - **Delete** `"name": "jotfolio"` config (path `C:\Dev\jotfolio` doesn't exist)
  - **Delete** `"name": "jotfolio-desktop"` config (points at .lnk)
  - **Rename** `"name": "jotfolio-real"` → `"name": "jotfolio"` (now THE canonical config)
  - **Keep** `"jotfolio-mockup"` — already fixed earlier this session

Final state should be:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "cowork-field-guide", ... },
    {
      "name": "jotfolio",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev", "--prefix", "C:\\Dev\\Projects\\JotFolio\\source"],
      "port": 5174
    },
    { "name": "cic-preview", ... },
    {
      "name": "jotfolio-mockup",
      "runtimeExecutable": "python",
      "runtimeArgs": ["-m", "http.server", "5175", "--directory", "C:/Dev/Projects/JotFolio/docs/mockups"],
      "port": 5175
    }
  ]
}
```

- [ ] **Step 3:** Test — `preview_start jotfolio` and `preview_start jotfolio-mockup`. Both should boot.

- [ ] **Step 4:** Commit (the launch.json change is in `Coding Agents` workspace, not JotFolio repo — commit there if it's tracked, else leave as local-only edit).

---

### T4: Resolve `OneDrive\Desktop\JotFolio.lnk` (per D5)

**Slop-trap to avoid:** Don't delete a shortcut Gavin uses daily without confirming. The shortcut is part of his desktop launch flow.

- [ ] **Step 1:** Inspect what the .lnk points at:

```powershell
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut("C:\Users\gavin\OneDrive\Desktop\JotFolio.lnk")
[PSCustomObject]@{
  TargetPath = $shortcut.TargetPath
  WorkingDirectory = $shortcut.WorkingDirectory
  Arguments = $shortcut.Arguments
}
```

- [ ] **Step 2:** Decide:
  - **If TargetPath is the source dir** (`C:\Dev\Projects\JotFolio`): repoint to the installed `.exe` (per D5 default). Path likely `C:\Users\gavin\AppData\Local\Programs\JotFolio\JotFolio.exe` — verify.
  - **If TargetPath is already the `.exe`**: rename the `.lnk` from `JotFolio.lnk` → `JotFolio (installed).lnk` so it's clear it's the binary, not source.

- [ ] **Step 3:** Repoint (if needed):

```powershell
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut("C:\Users\gavin\OneDrive\Desktop\JotFolio (installed).lnk")
$shortcut.TargetPath = "C:\Users\gavin\AppData\Local\Programs\JotFolio\JotFolio.exe"
$shortcut.WorkingDirectory = "C:\Users\gavin\AppData\Local\Programs\JotFolio"
$shortcut.Save()

# Delete the old misleading one
Remove-Item "C:\Users\gavin\OneDrive\Desktop\JotFolio.lnk" -Force
```

- [ ] **Step 4:** Double-click the new shortcut to verify it launches.

---

### T5: Symlink for CC workspace (per D2)

**Slop-trap to avoid:** Windows symlinks need either admin OR developer mode enabled. If neither, `mklink` errors silently. Verify access first.

- [ ] **Step 1:** Confirm developer mode is on:

```powershell
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" -Name "AllowDevelopmentWithoutDevLicense" -ErrorAction SilentlyContinue
```

If returns `1`, dev mode is on. If 0 or absent, enable via Settings → Privacy & security → For developers → Developer Mode, OR run from elevated PowerShell.

- [ ] **Step 2:** Create the symlink:

```cmd
:: From elevated cmd OR with dev mode on:
mklink /D "C:\Dev\Coding Agents\jotfolio" "C:\Dev\Projects\JotFolio"
```

- [ ] **Step 3:** Verify:

```bash
ls -la "/c/Dev/Coding Agents/jotfolio"
# should show as a symlink with -> target
cd "/c/Dev/Coding Agents/jotfolio" && pwd
# should resolve to /c/Dev/Projects/JotFolio
```

- [ ] **Step 4:** Add to `.gitignore` of the `Coding Agents` workspace (if it has a git repo) so the symlink doesn't get committed.

---

### T6: Add project-level `CLAUDE.md` to JotFolio (per D6)

**Slop-trap to avoid:** Don't duplicate global CLAUDE.md content. Project CLAUDE.md should be JotFolio-specific only.

- [ ] **Step 1:** Create `C:\Dev\Projects\JotFolio\CLAUDE.md`:

```markdown
# JotFolio — Claude Code project instructions

## Canonical paths
- **Source:** `C:\Dev\Projects\JotFolio` (this dir)
- **Vault (live app data):** `C:\Users\gavin\OneDrive\Documents\JotFolio Vault\`
- **Installed binary settings:** `%APPDATA%\JotFolio\settings.json` (case after T2 cleanup)
- **Installed binary exe:** `C:\Users\gavin\AppData\Local\Programs\JotFolio\JotFolio.exe`
- **Marketplace clone (separate project):** `C:\Dev\Projects\cowork-marketplace`

## Path traps to avoid
- `C:\Users\gavin\OneDrive\Desktop\JotFolio.lnk` is the installed-app shortcut, NOT source. Don't read or write through it.
- Don't `cd` to `C:\Dev\jotfolio` — doesn't exist.
- The `.snapshots/` dir at repo root mirrors source for backups; ignore it in searches.
- The symlink at `C:\Dev\Coding Agents\jotfolio` resolves here. Both paths work; prefer the canonical one in commits + memories.

## Working from outside this dir
If a Claude Code session starts in `C:\Dev\Coding Agents\`:
- For git/gh ops: prefix with `cd C:\Dev\Projects\JotFolio &&` OR `cd jotfolio &&` (uses symlink)
- For file reads: use the absolute canonical path `C:\Dev\Projects\JotFolio\...`

## Build commands
- Dev server: `cd source && npm run dev` (port 5174)
- Test: `cd source && npm test`
- Build: `cd source && npm run build`
- Electron dev: `cd source && npm run electron`

## Stack
- Vite 7 + React 18 (JSX, not TSX)
- Electron 33
- Inline styles + CSS variables (no Tailwind)
- Self-hosted fonts via Fontsource (Inter, Lora, Fraunces, JetBrains Mono, Caveat)
- ONNX runtime (planned for v0.7 MiniLM features)

## Charter (binding)
SlateVault Vibe prompt. See `~/.claude/projects/C--Dev-Coding-Agents/memory/slatevault_vibe_prompt.md` for full text.
Key rules:
- Local-first, plain-text durable
- Parser as pure functions
- No AI/analytics in shipped product (telemetry is the explicit charter exception, opt-in only)
- 800-line cap per file (currently violated by App.jsx 809; deferred refactor)
```

- [ ] **Step 2:** Commit to JotFolio repo:

```bash
cd /c/Dev/Projects/JotFolio
git add CLAUDE.md
git commit -m "docs: add project-level CLAUDE.md with canonical paths

Future Claude Code sessions auto-load this when working in the repo.
Documents the path canonicals + the OneDrive .lnk trap + build commands.
Stops re-discovering the path sprawl every session."
```

---

### T7: Update memories that cite stale paths

**Slop-trap to avoid:** Don't blanket-overwrite memory files. Each one has its own scope; edit precisely.

- [ ] **Step 1:** `slatevault_vibe_prompt.md` — find the line citing `C:\Users\gavin\OneDrive\Desktop\Prompts - Markdowns- Claude Docs\...`. Replace with:

```markdown
**Source file location:** As of 2026-04-29, the original `.txt` charter is missing from its previously-cited Desktop path. This memory file is the operational reference. If the source `.txt` is recreated, link it here and remove this note.
```

- [ ] **Step 2:** `project_jotfolio_facts.md` — verify all 6 traps still apply post-cleanup. Remove ones the cleanup fixes (e.g. ".lnk shortcut at OneDrive Desktop" if T4 deleted it).

- [ ] **Step 3:** `MEMORY.md` index — refresh entries that mention paths, ensuring they cite `C:\Dev\Projects\JotFolio`.

- [ ] **Step 4:** No git commit — memories live outside the JotFolio repo.

---

### T8: Verification

**Goal:** Every incident from §0's reference list now fails to reproduce.

- [ ] **Step 1:** Open a fresh Claude Code session. Without re-reading any memory, ask Claude to "open JotFolio and run the test suite." Should succeed via the new `CLAUDE.md` on first try, without diagnosis tokens.

- [ ] **Step 2:** Re-run vibe-narc audit on path layer. Should not flag any path drift.

- [ ] **Step 3:** Test auto-update flow:
  - Confirm installed app still polls + reads correct AppData
  - Push a tiny test release if needed (alpha.7.1) to validate update polling
  - If repo is private, expect 401 — that's the known issue, not the cleanup's fault

- [ ] **Step 4:** Walk through all `launch.json` configs — every one should boot or be deleted. No stale references.

- [ ] **Step 5:** Search `~/.claude/projects/.../memory/` for any lingering reference to `OneDrive\Desktop\JotFolio` (other than pointing at the .lnk for the installed binary). Should be zero hits in source-related contexts.

---

## Acceptance criteria

- [ ] One canonical source path (`C:\Dev\Projects\JotFolio`), referenced consistently
- [ ] One `%APPDATA%` config dir (case decided + dup deleted)
- [ ] `launch.json` has only working configs, none pointing at stale paths
- [ ] OneDrive Desktop `.lnk` either points at installed binary (renamed) or is deleted
- [ ] CC workspace has symlink `jotfolio → C:\Dev\Projects\JotFolio` for easy `cd`
- [ ] Project-level `CLAUDE.md` ships in JotFolio repo
- [ ] Memories no longer cite missing or stale paths
- [ ] Fresh Claude Code session can open + work on JotFolio without path-discovery overhead
- [ ] Auto-update polling still works (don't break Electron updater)
- [ ] Vault data unchanged (zero risk to user notes)

---

## What this plan does NOT cover

- **Moving JotFolio to a different root.** Specifically rejected. Don't move code; symlink instead.
- **Migrating the vault.** OneDrive sync is intentional. Stays.
- **Marketplace plugin source vs cache split.** Separate concern. Plugin marketplace at `C:\Dev\Projects\cowork-marketplace` stays where it is. The cache lives separately by Claude Code's design.
- **GitHub repo settings.** Auto-update + private/public flag is a separate decision tree.
- **`.snapshots/` dir cleanup.** That's a backup mechanism; leave it alone unless it's bloating the repo.

---

## Risk + dependency notes

- **T2 (AppData de-dup) is the only step with real data risk.** Backup before delete; verify both before choosing the survivor.
- **T4 (`.lnk` repoint) is irreversible only via re-creation.** Trivial to redo if mistaken.
- **T5 (symlink) requires Windows developer mode OR admin shell.** If neither is available, skip — the canonical path still works without the symlink.
- **T6 (`CLAUDE.md` add) is the highest-leverage low-risk task.** Future sessions immediately benefit. Do this even if every other task gets deferred.
- **No task touches the user's vault data.** Zero risk to notes.

---

## Smallest valuable subset

If you only do ONE thing from this plan, do **T6 (project `CLAUDE.md`)**. That single file prevents 80% of future path-discovery tax.

If you do TWO things: T6 + T3 (clean up launch.json).

If you do THREE: T6 + T3 + T2 (resolve AppData dup).

The rest layer in over time.

---

## Next step after this plan ships

Add a memory note `path-cleanup-resolved-2026-04-29.md` documenting what was done so future sessions don't re-investigate the sprawl. Cross-reference from `project_jotfolio_facts.md`.
