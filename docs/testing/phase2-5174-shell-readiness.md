# Phase 2 Worker 6 Readiness Checklist

Scope: the current JotFolio shell served at `http://127.0.0.1:5174/`.

## Automated Gates

- `npm test`
  - Covers workstation data derivation, shell route rendering, keyboard access, confirmation guards, and existing vault/index/plugin/parser coverage.
- `npm run build`
  - Confirms the transformed shell still compiles into the production web bundle.
- `npm run bench`
  - Includes workstation derivation for 1k and 5k entry vaults.
- `npm run a11y`
  - Requires the app server to be running on `5174` unless `A11Y_BASE_URL` is set.

## Visual Sweep

- Home route opens to Command Center with `Good morning, Gavin`.
- The app background is dark shell chrome only; no blue desktop backdrop is part of the app.
- Left navigation routes render without shifting the top bar, context rail, or vault status bar.
- Command Center, Search, Projects, Tasks, Calendar, Spaces, Tag Manager, Settings, and Trash each have a clear title and non-empty state.
- Empty vault states explain what is missing and offer a next action.
- Constellation remains visually distinct from the screenshot reference while preserving backlinks, clusters, unresolved links, and memory.

## Accessibility Sweep

- Sidebar items are reachable with Tab and activate with Enter and Space.
- `/` focuses the top search field when a modal or detail panel is not open.
- Ctrl/Cmd+P opens the command palette, focuses its search input, and Esc closes it.
- Every icon-only control has an accessible name.
- Focus rings are visible against the dark shell.
- Reduced-motion preference is respected for any new transitions.
- Command Center, route panels, Settings, modals, and Trash actions pass WCAG AA axe checks.

Known tracked gaps in the Playwright a11y spec:

- None for the current 5174 shell flows. New gaps should be fixed before they are added to an allow-list.

## Confirmation And Recovery

- Restore from Trash asks before mutating files.
- Permanent delete asks before mutating files.
- Empty Trash asks before mutating files.
- Canceling any of the above leaves vault adapter move/remove calls untouched.
- Recovery/export copy tells the user whether the action is a full vault backup or a limited entry export.

## Performance Sweep

- Workstation derivation stays under the committed bench targets:
  - `workstation-derive-1k`: p95 under 300 ms.
  - `workstation-derive-5k`: p95 under 1800 ms warning threshold.
- Main shell route switching should not recreate heavy graph/canvas views until selected.
- No route change should cause visible layout shift in top bar, left nav, right rail, or status bar.
- Bundle warnings remain tracked; large chunks should be handled by the code-quality/performance lanes.
