# JotFolio session handoff — 2026-05-15

## Purpose

This document is for opening a fresh Codex chat thread and continuing the current JotFolio work without losing context.

JotFolio is currently being reshaped into a local-first, power-user workspace for notes, projects, tasks, capture, search, calendar, Constellation, and eventually MiniLM-assisted relationship building. Gavin wants the UI to match the approved dark desktop-app screenshots very closely, with real functionality behind every visible feature.

## Repo and Runtime

- Repo: `C:\Dev\Projects\JotFolio`
- App source: `C:\Dev\Projects\JotFolio\source`
- Dev server URL: `http://127.0.0.1:5174/`
- Demo data URL: `http://127.0.0.1:5174/?demo=full&reset=1`
- Current user: Gavin
- Current date at handoff: 2026-05-15

## Required Reading for New Thread

Read these first:

1. `C:\Dev\Projects\JotFolio\CONTEXT.md`
2. `C:\Dev\Projects\JotFolio\AI_AGENT_GUIDE.md`
3. `C:\Dev\Projects\JotFolio\docs\CHANGELOG.md`
4. `C:\Dev\Projects\JotFolio\docs\changes\jotfolio-ui-overhaul-ledger.md`
5. This file.

Follow `AGENTS.md` output shape:

- Observed:
- Inferred:
- Changes made:
- Tests/commands run:
- Remaining risks:

## User Preferences and Product Direction

- Keep explanations simple and plain English.
- Gavin wants the app to look and function like the approved screenshots, not as a loose inspiration.
- Dark charcoal desktop-app shell is the active visual direction.
- No fake screens. If a feature appears, it needs real behavior or must be clearly marked as not ready.
- Do not let MiniLM silently rewrite notes. AI should suggest; Gavin reviews; JotFolio applies safely; undo/backup must exist before write automation.
- Constellation should keep the relationship-map idea but not copy a screenshot style blindly.
- Relationship Scan belongs in Knowledge Graph / Constellation and should come before MiniLM link-writing.

## Current Agent Situation

The plan called for six agents:

1. Shell/navigation/top bar/sidebar/status bar
2. Command Center/Capture/Inbox/Search
3. Notes/Projects/Tasks/Calendar
4. Constellation/Canvas/Bases/Smart Views
5. Settings/Trash/Recovery/Export/Plugins/AI
6. Tests/accessibility/keyboard shortcuts/browser console/build risks

Tried to spawn all six workers, but every spawn failed with:

```text
collab spawn failed: agent thread limit reached
```

Gavin asked how to clear agents. Answer given: close old/background agent threads in the Codex app, or paste active agent IDs/names so they can be closed/reused. Once slots are free, retry spawning the six agents with strict no-overlap file ownership.

## Current Dirty Worktree Snapshot

At handoff, the worktree is intentionally dirty with recent uncommitted work.

Modified:

```text
docs/CHANGELOG.md
docs/changes/jotfolio-ui-overhaul-ledger.md
source/src/App.jsx
source/src/App.workstation.test.jsx
source/src/features/add/AddModal.jsx
source/src/features/add/AddModal.test.jsx
source/src/features/constellation/ConstellationView.jsx
source/src/features/constellation/ConstellationView.test.jsx
source/src/features/notes/NotesWorkspaceView.css
source/src/features/notes/NotesWorkspaceView.jsx
source/src/features/notes/NotesWorkspaceView.regression.test.jsx
source/src/features/workstation/WorkspaceTopBar.jsx
source/src/features/workstation/WorkstationViews.test.jsx
source/src/lib/index/vaultIndex.js
source/src/lib/index/vaultIndex.test.js
```

Untracked:

```text
source/dev-server-5174.log
source/dist-electron-testing/
```

Do not revert these without Gavin explicitly asking. Some modified Notes files came from earlier UI work in the same session.

## What Was Recently Implemented

### Notes UI polish

Notes was already rebuilt into a full Markdown editor workspace. Recent polish moved it closer to `06_PASS_Notes_Markdown_Editor.png`:

- Tab row and editor controls share one top row.
- Duplicate large note title above editor was removed.
- Toolbar uses compact editor icons and thin dividers.
- Info rail shows Tags, Backlinks, Unresolved links, Properties, File, and Actions.
- Empty duplicate metadata rows are filtered so File and Actions stay visible.

### Capture modal Escape fix

Problem:

- Capture / New Entry did not close with `Escape` while the title field was focused.

Root cause:

- Shared `useEscapeKey` ignores editable targets by default.
- Capture modal autofocuses the title field.

Fix:

- `AddModal` now calls `useEscapeKey(true, () => tryClose(), { includeEditableTargets: true })`.

Test:

- Added `closes with Escape while the title field is focused` to `AddModal.test.jsx`.

### Global Search shortcut fix

Problem:

- UI showed `⌘K`, but `Ctrl/Cmd+K` did not open Search globally.

Fix:

- App global key handler now routes `Ctrl/Cmd+K` to Search / Quick Switcher.
- Top search field no longer opens Command Palette on `Ctrl/Cmd+K`; it keeps Search active.

Test:

- Updated `App.workstation.test.jsx` to verify `Ctrl+K` opens Search / Quick Switcher.

### Relationship Scan foundation

Problem:

- Imported notes can appear disconnected in Constellation because the graph only connects real relationships: `[[wiki links]]`, saved links, project references, tags, canvases, backlinks, unresolved links, and memory sources.
- Gavin wants MiniLM to eventually create suggested relationships, but safe review/apply/undo must come first.

Fix:

- Added `getRelationshipScan(index)` in `source/src/lib/index/vaultIndex.js`.
- Added a visible `Relationship Scan` panel inside Constellation.
- The panel reports:
  - disconnected notes
  - unresolved wiki-link targets
  - metadata/tag gaps

Important:

- This does not let MiniLM write links yet.
- This is the safe pre-AI graph-health layer.

Tests:

- Added `summarizes relationship scan gaps from real index data` in `vaultIndex.test.js`.
- Added Constellation UI test for the `Relationship Scan` panel.

## Verification Already Run

Focused verification:

```text
npm test -- --run src/features/add/AddModal.test.jsx src/App.workstation.test.jsx src/lib/index/vaultIndex.test.js src/features/constellation/ConstellationView.test.jsx
Result: 4 files passed, 26 tests passed.
```

Full test suite:

```text
npm test -- --run
Result: 89 files passed, 754 tests passed.
```

Production build:

```text
npm run build
Result: passed.
```

Known existing build warnings:

- Some chunks are larger than 500 KB.
- `onnxruntime-web` uses direct eval.
- `src/lib/semantic/embed.js` and `src/lib/semantic/similarity.js` are dynamically imported by `App.jsx` but also statically imported by `src/lib/semantic/index.js`, so current dynamic import does not fully split them out.

Live app smoke:

```text
Opened http://127.0.0.1:5174/?demo=full&reset=1
Confirmed Ctrl+K opens Search / Quick Switcher.
Opened Knowledge Graph.
Opened Relationship Scan.
Relationship Scan panel rendered.
```

## Next Best Work

Start here:

1. Clear agent slots or reuse active agent IDs.
2. Retry six-agent spawn with no-overlap ownership.
3. If agents are still blocked, continue inline in small verified batches.

Priority batch:

1. Replace browser `prompt()` flows for rename/move with real in-app modals.
2. Tighten Capture → Inbox → Notes flow so captures naturally become notes/tasks/projects/links and can be found again.
3. Expand Relationship Scan into a proper Constellation tab/section with graph-health guidance.
4. Add review/apply/undo safety for relationship suggestions.
5. Only after that, build MiniLM suggestion generation for wiki links, tags, project references, and related notes.
6. Address semantic/MiniLM bundle warnings by truly lazy-loading AI code only when Relationship Scan / AI features need it.

## Six-Agent No-Overlap Rules to Reuse

Every agent must:

- State exact files it intends to edit before editing.
- Stay inside its lane.
- Use systematic debugging: prove the behavior before fixing.
- Use TDD where practical: failing test first, then minimal code.
- Report bugs outside its lane instead of silently fixing them.
- List files changed and tests run in its final report.

Shared app-level files are locked by default. If multiple agents need the same file, the integrator decides ownership first.

## Exact Prompt to Start the New Thread

Paste this into the new Codex thread:

```text
Read this handoff first:
C:\Dev\Projects\JotFolio\docs\superpowers\specs\2026-05-15-session-handoff.md

Then continue JotFolio from that state.

Goal:
Use the six-agent no-overlap plan if agent slots are available. If agent slots are still blocked, continue inline in small verified batches.

First actions:
1. Inspect git status.
2. Read the handoff, changelog, and UI overhaul ledger.
3. Do not revert existing dirty files.
4. Verify the app still runs at http://127.0.0.1:5174/.
5. Continue with the next priority batch: replace browser prompt rename/move flows with real app modals, then tighten Capture → Inbox → Notes.

Rules:
- No fake features.
- Use systematic debugging for bugs.
- Use TDD where practical.
- Verify before claiming done.
- Keep Gavin-facing explanations simple.
- Update changelog and ledger with every behavior made functional.
```

## Hard Stops

Stop and ask Gavin before:

- Deleting data.
- Running destructive cleanup.
- Adding new dependencies.
- Changing auth/security behavior.
- Letting MiniLM auto-write note content without review/apply/undo.
- Reverting existing dirty changes.

## End State at Handoff

The first verified batch is in place:

- Capture Escape works from focused fields.
- `Ctrl/Cmd+K` opens Search globally.
- Constellation has a first Relationship Scan panel.
- Full tests and build passed after these changes.

The broader six-agent overhaul is not complete because agent slots were full.
