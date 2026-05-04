# Folder/file tree + Trash polish — design

**Date:** 2026-05-04
**Status:** mostly shipped, residual polish punch-list
**Owner:** Gavin
**Ship target:** alpha.17 (already in dirty tree, verified by Thread A)

## Problem

Context pack §17 ("What Gavin may ask next") lists 4 polish items for folder tree + Trash:

1. Make folders cleaner and more like the provided screenshot
2. Move Trash below/near Settings and use a recycle-bin icon
3. Add folder delete x with confirmation
4. Make templates and folders feel connected

Audit current dirty-tree state against each.

## Audit results

| Concern | Status | Evidence |
|---|---|---|
| Trash near Settings | ✅ done | `Ribbon.jsx:81-83` — `marginTop: 'auto'` pushes Settings + Trash to bottom; Trash rendered after Settings |
| Recycle-bin style icon | ✅ done | `Ribbon.jsx:23` — standard trash-can SVG (24×24, hairline stroke, matches Victory aesthetic). "Recycle bin" framing satisfied by the affordance, not literal recycle arrows. |
| Folder delete x with confirm | ✅ done | `Sidebar.jsx:151-161` — delete button on every folder row, `App.jsx` handler shows confirm modal explaining "files inside move to JotFolio Trash" |
| File delete x | ✅ done | `Sidebar.jsx:171-181` — delete button on every file row in folder tree |
| Templates folder integration | ✅ done | `Sidebar.jsx` folder tree includes `templates/` as folder; clicking opens Template Library; clicking a template file opens that template |
| Trash dedicated view (not `.jotfolio/trash/...` in folder tree) | ✅ done | TrashView.jsx is dedicated route; trash files do NOT appear in regular folder tree (`vaultPaths.js` filters them out) |
| Empty state for trash | ✅ done | "Trash is empty" + descriptive copy verified live |
| Trash badge count on ribbon | ✅ done | `Ribbon.jsx:48` — count chip overlay on trash icon |

## Verified live (Thread A acceptance gates)

All 8 acceptance gates from Thread A passed for folder/Trash work:
- Folder tree renders folders + nested files
- Delete x on every row (folder + file)
- Confirm modal explains destination ("files move to Trash")
- Trash icon position correct
- Trash view loads with Empty Trash + Refresh actions

**Net: thread E is mostly already-done, captured in alpha.17 ship slice.**

## Residual polish items (deferred — taste calls need eyeball)

These are subjective UX touches that need screenshot-driven critique. Not blockers for alpha.17.

| # | Item | Why deferred |
|---|---|---|
| P1 | Folder row hover state — subtle background vs none | Need to see at scale (20+ folders) before deciding |
| P2 | File row indent depth (currently 31px + 13px per nested level) | Visual taste — feels right at depth 1, may feel cramped at depth 3+ |
| P3 | Delete x hover affordance — opacity transition? color shift? | Currently always visible at low opacity. Some users want hover-only. Consider after dogfood. |
| P4 | Folder count badge style (currently 99-radius pill with hairline border) | Could match existing tag count badges for consistency |
| P5 | Templates folder special-case — distinct icon vs regular folder? | Currently uses `📁`. A subtle distinction (`📐` or accent color) might improve "templates feel like real files" perception |
| P6 | Trash icon when count > 0 — keep monochrome or accent color? | Badge already provides count signal. Icon color shift on items-present could be redundant. |
| P7 | Empty Trash button — needs warning-color treatment? | Currently neutral. `var(--err)` border on hover would signal destructive nature. |
| P8 | Confirm modal copy precision — "Delete folder X? Files move to Trash. Folder shells removed." vs more terse | Verify wording feels honest, not bureaucratic |

**Strategy:** ship alpha.17 with current polish level. Run a 1-day dogfood pass. Critique with screenshots. Address P1-P8 in alpha.20+ as a focused polish batch (after Phase 4/5 substantive work in alpha.18/19).

## Self-verify (alpha.17 polish gates)

Already passed via Thread A:
- ✅ Trash icon in ribbon
- ✅ Trash positioned below Settings
- ✅ Folder delete buttons render
- ✅ File delete buttons render
- ✅ Trash dedicated view loads
- ✅ Templates folder navigates to Template Library

Additional verification (one-time, run before alpha.17 tag):

```bash
# Dev server with seeded fixture vault (use existing demo entries)
# Visual check via Claude Preview:
#   1. Sidebar shows folders sorted alphabetically — confirm articles/journals/links/notes/podcasts/templates/videos
#   2. Each folder shows file count badge
#   3. Click a folder → highlights, files visible nested
#   4. Click delete x on a folder with files → confirm modal mentions Trash destination
#   5. Click delete x on a file → confirm modal exists
#   6. Confirm modal "Cancel" closes without action
#   7. Confirm modal "Delete" moves item to Trash, file disappears from tree
#   8. Open Trash view → deleted item present
#   9. Click "Restore" on item → returns to original folder location
#  10. Empty Trash → all items gone, view shows empty state
#  11. Refresh button polls latest trash state without full reload
```

Each step = pass/fail. Any fail = blocker for alpha.17.

## Out of scope

- Drag-and-drop file reordering between folders (alpha.20+)
- Folder rename (currently delete-and-recreate; rename is a Phase 6 vault adapter add)
- Multi-folder bulk delete (alpha.20+)
- Folder color/icon customization (post-1.0)
- Nested folder creation depth limit enforcement (currently unlimited, may need cap at depth 6)

## Risks

1. **Empty Trash is destructive + irreversible.** Current copy: "Empty Trash". Consider strengthening to "Permanently Delete N Items" with N pre-filled. Adds clarity, no scope creep — purely copy edit.
2. **Folder rmdir on non-empty folder** — `LocalAdapter.rmdir` should refuse if children remain (UI checks first, but adapter must enforce too). Verify adapter test covers this case in `__tests__/LocalAdapter.test.js` — that file is in dirty tree.
3. **Trash count badge perf at large counts (1000+)** — `Math.min(99, count)` pattern already in place via "99+" display. ✓

## Recommended copy edits (zero-risk improvements)

| Location | Current | Proposed | Why |
|---|---|---|---|
| Empty Trash button | "Empty Trash" | "Permanently delete N items" | More honest about action |
| Trash empty state | "Trash is empty" | "Trash is empty. Deleted entries appear here before permanent deletion." | Already done — verified live |
| Folder delete confirm | (current copy) | Verify lists destination "JotFolio Trash" not internal `.jotfolio/trash/` | Don't leak internal paths |

These are 5-minute edits, zero risk. Ship in alpha.17 alongside existing dirty work.

## Conclusion

Thread E is largely complete. Ship as part of alpha.17 (Thread A scope). Residual polish (P1-P8) deferred to alpha.20+ batch after Phase 4/5 substantive work lands.
