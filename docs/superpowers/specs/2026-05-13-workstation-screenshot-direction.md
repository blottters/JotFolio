# JotFolio workstation screenshot direction

**Date:** 2026-05-13
**Status:** product/design input captured
**Owner:** Gavin
**Visual reference:** `JotFolio_passed_images_01-21` screenshot set
**Scope:** full-app workstation flow, not a single-screen reskin

## Goal

Use the 21 passed screenshots as the north-star for JotFolio's product shell:
local-first desktop workspace, dense but calm, every view connected by search,
capture, local paths, tags, backlinks, unresolved links, Smart Views, and a
right-side detail panel.

This is not approval to ship decorative mock surfaces. Per charter, no UI ships
without a real engine behind it.

## Gavin decision

The Constellation idea can stay. The screenshot's Constellation look/style should
not be copied.

Keep:
- Relationship exploration across entries.
- Selected-entry context.
- Backlinks, unresolved links, neighbors, clusters, and trace-to-source behavior.
- Navigation from any entry into Constellation and back.

Do not copy:
- Hub-and-spoke icon diagram as the primary look.
- Bright circular icon nodes as the visual default.
- Screenshot 08's overall graph styling.

Prefer a distinct JotFolio Constellation language: quieter, more spatial, more
like a knowledge field than an app diagram. This should align with the roadmap's
Cosmography direction, but can ship in smaller steps before the full v0.8 rebuild.

## Product Shell Contract

The screenshots consistently show one shell:

- Left navigation with command center, inbox, search, projects, notes, calendar,
  Constellation, tasks, AI assistant, spaces, tags, settings, and trash.
- Top command strip with back/forward, global search, capture, quick switcher,
  command palette, and status/action icons.
- Main work surface tuned per route.
- Right detail panel that updates based on selected entry, project, tag, task,
  day, template, provider, plugin, trash item, or Smart View.
- Bottom status bar with vault health, indexed-file counts, sync status, and
  recovery/snapshot signals.

The flow is the feature: users should be able to capture something, classify it,
open it, connect it, turn it into memory, find it again, and recover/export it
without context falling apart.

## Screenshot Map

| # | Screen | Adopted behavior |
|---|---|---|
| 01 | Command Center | Dashboard of vault health, recent captures, active Smart View, memory/compile status, mini relationship preview, selected-entry detail. |
| 02 | Inbox | Capture queue with review, tag, route, flag, bulk actions, and right-rail today/recent context. |
| 03 | Capture / New Entry | One modal for note, journal, article, podcast, video, link, canvas, raw; suggested tags, matching entries, backlinks, unresolved links, path preview, template application. |
| 04 | Search / Quick Switcher | Global search across entries, projects, notes, tags, backlinks, canvases, memory; result selection populates right detail. |
| 05 | Projects | Project cards plus table, stats, local path, recent entries, Smart Views, and project-scoped actions. |
| 06 | Notes / Markdown Editor | Full editor workspace with tabs, markdown toolbar, edit/preview/backlinks modes, right inspector. |
| 07 | Calendar / Journal | Month/week/day planning, daily journal entries, entries on selected date, memory reviews due, linked projects/tags. |
| 08 | Knowledge Graph / Constellation | Functional idea accepted; visual style rejected. See Constellation section. |
| 09 | Tasks | Entry-linked tasks with due date, priority, backlinks, local path, source entry, and safety context. |
| 10 | AI Assistant | BYOK contextual assistant grounded in selected entries, wiki/review memory, raw sources, citations, draft-only controls. Must remain local-first and opt-in. |
| 11 | Spaces | High-level grouping over folders, projects, tags, Smart Views, and captures; space details in right panel. |
| 12 | Tags | Tag management with aliases, linked entries, unresolved refs, keyword rules, Smart Views using tag, rename/merge/delete safeguards. |
| 13 | Settings overview | Settings as route, not floating afterthought; vault, editor, templates, Smart Views, shortcuts, BYOK AI, plugins, safety, export, recovery. |
| 14 | Vault safety/export/recovery | Snapshots, export zip, integrity check, restore preview, trash, warnings, local-only assurances. |
| 15 | BYOK provider settings | Provider table, local key storage, test connection, enabled surfaces, privacy commitments. |
| 16 | Plugins permission gate | Plugin list with sandbox, frozen API, per-permission review and revoke controls. |
| 17 | Trash | Deleted-file table, restore/permanent-delete detail panel, backlinks impact, restore target. |
| 18 | Template Library | Three-pane template editor with variables, usages, references, outgoing links, unresolved targets. |
| 19 | Smart Views | Saved query lenses with filter/sort/group/save, result table, detail panel, local path awareness. |
| 20 | Compile to Memory | Multi-step compile workflow: select sources, preview body, source evidence, metadata, warnings, output target, explicit save choice. |
| 21 | Power-user synthesis | Final shell target: command center as operational cockpit, not marketing homepage. |

## Flow Requirements

### Capture to Entry

1. User clicks Capture or presses the shortcut.
2. User chooses type and supplies minimal input.
3. JotFolio suggests tags, matching entries, possible backlinks, unresolved links,
   template, folder, and local path.
4. Save target is explicit: inbox, project, folder, or template-applied entry.
5. Saved entry appears immediately in Inbox/recent captures and is navigable by
   search and Quick Switcher.

### Entry to Context

1. Selecting any entry opens a right detail panel.
2. Detail panel shows tags, local path, file status, backlinks, unresolved links,
   related entries, actions, and Constellation access.
3. User can reveal file, open editor, open in Constellation, copy local path,
   move/rename safely, compile to memory when eligible, or link/unlink entries.

### Search to Work

1. Global search returns grouped results, not only entries.
2. Selecting a result updates the right detail panel without losing the result set.
3. Actions from the detail panel route into editor, Constellation, file reveal,
   Smart View, or project context.

### Compile to Memory

1. Compile is a review workflow, not a magic one-click conversion.
2. User chooses sources.
3. JotFolio shows source evidence, confidence, hash/provenance, warnings,
   decision rationale, compiled draft, and output target.
4. Save is explicit: review memory or wiki memory.
5. Saved memory becomes a first-class entry with links back to source evidence.

### Maintain and Recover

1. Every destructive action routes through JotFolio Trash or explicit permanent
   delete confirmation.
2. Vault safety surfaces must show local path, snapshot state, indexed count,
   export availability, integrity status, and warnings.
3. Export and recovery actions must be real file operations, not placeholder UI.

## Engine Backing Required

Already partly backed:
- Vault adapter and local file paths.
- Entries, tags, frontmatter, links, backlinks, unresolved links.
- Quick Switcher and command palette.
- Templates and template backlinks.
- Smart Views/Bases.
- Canvases.
- Trash.
- Export vault as zip.
- Plugin host and permission model.
- BYOK provider test connections.
- Compile library and compile preview path.

Needs engine work before matching screenshots:
- Projects as first-class folder/project objects with stats and actions.
- Spaces as first-class grouping layer.
- Calendar/journal planning route.
- Entry-linked tasks route.
- Tag manager with rename/merge/alias/rules safeguards.
- Settings route consolidation around vault safety, BYOK, plugins, export, and
  recovery.
- AI Assistant beyond provider testing. Must be real BYOK, source-grounded,
  citation-bearing, and opt-in.
- Command Center cockpit with real metrics from vault/index/compile/trash.
- Full Constellation visual redesign distinct from screenshot 08.

## Constellation Direction

Do the functional work from the screenshots, but redesign the look:

- Preserve relationship exploration and selected-entry detail.
- Avoid the screenshot's centered icon-wheel graph as the default.
- Prefer a field/galaxy/cluster vocabulary: scale, density, proximity, labels,
  selection halos, and quiet edge treatment.
- Keep existing layout ideas where useful: messy, clusters, affinity, focal
  stack, unresolved pseudo-nodes, memory-only filter.
- Add a stronger right-panel handshake: selected node details, neighbors,
  backlinks, unresolved links, source-trace actions.
- Make it feel native to JotFolio's vault model, not like a generic diagramming
  mockup.

Acceptance test for Constellation visual work: a user should recognize it as the
place to explore relationships, but not mistake it for screenshot 08.

## Implementation Slices

1. **Shell alignment:** top command strip, persistent right detail slot, bottom
   vault status bar, route names matching locked vocabulary.
2. **Command Center cockpit:** real vault/index/recent/Smart View/memory/trash
   modules; no fake metrics.
3. **Capture + Inbox flow:** capture modal with suggestions, path preview,
   routing, and inbox queue actions.
4. **Search + detail handshake:** grouped global results with selected-result
   detail panel and route actions.
5. **Editor + templates:** editor route and template library share the same
   path/backlink/unresolved-link inspector model.
6. **Management routes:** projects, spaces, tags, Smart Views, tasks, calendar.
   Each must have real data model and mutations before UI is exposed.
7. **Settings/safety:** consolidate vault safety, export, recovery, BYOK, and
   plugin permission gates into route-level settings.
8. **Compile to memory:** expand current compile modal into the six-step review
   flow from screenshot 20.
9. **Constellation restyle:** keep idea, change visual language, wire detail
   panel and trace-source behavior.

## Non-goals

- Do not build a marketing homepage.
- Do not make screenshot-perfect static pages.
- Do not expose AI assistant features until a real provider-backed flow exists.
- Do not add external services, CDN assets, or opaque databases.
- Do not make Constellation look like screenshot 08.

## Success Criteria

- Every visible screen is backed by real vault data or a clearly gated engine.
- Navigation preserves context across capture, search, detail, edit, memory, and
  recovery flows.
- Right detail panel works consistently across object types.
- Local-first state is always visible: path, index, sync/no-sync, recovery.
- Constellation keeps its purpose but gets a distinct visual identity.
