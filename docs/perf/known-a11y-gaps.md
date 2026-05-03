# Known Accessibility Gaps

Documented WCAG AA violations deferred to later phases. Any violation NOT listed here must be fixed before the PR that introduced it merges.

## Status

Playwright + `@axe-core/playwright` a11y suite at `bench/a11y/flows.spec.js` now runs against built app states in CI. It covers main grid, detail panel, settings modal, add-entry modal, and quick-capture modal.

Latest local automated verification: 5/5 flows passed on 2026-05-02 against the current alpha line.

This file tracks gaps that still require manual assistive-technology verification or broader theme coverage beyond the automated flow suite.

## Foreseen gaps

### 1. Constellation view (canvas + SVG hybrid)

- **Pages affected:** `/` with Constellation view active
- **Status:** improved in the current alpha line with focusable graph nodes plus an accessible graph list for keyboard and screen-reader users.
- **Remaining verification:** manual screen-reader pass on NVDA/Narrator, high contrast, and 200%/400% zoom.

### 2. Inline text contrast on 26 theme variants

- **Pages affected:** all
- **Status:** Minimal light automated-flow contrast fixed in the current alpha line.
- **Remaining verification:** computed contrast audit across all 26 themes and dark-mode variants.

### 3. Focus-visible outline on dropdowns

- **Pages affected:** Settings > theme/font dropdowns
- **Likely violations:** focus ring may disappear inside some dropdown panels due to overflow clipping
- **Target fix:** v0.5.0 — audit + switch to `outline-offset` with `var(--jf-focus-ring)` token applied uniformly
- **Workaround:** none; known AT-usability issue

### 4. Command palette + quick switcher

- **Pages affected:** command palette, quick switcher
- **Status:** both flows now exist in the current alpha line, but this file still lacks a dedicated manual keyboard + screen-reader verification pass for them.
- **Remaining verification:** keyboard trap check, result announcement behavior, focus restoration, and screen-reader output on NVDA/Narrator.

### 5. Toast notifications (closed)

- **Pages affected:** all; toasts render via `src/features/primitives/Toasts.jsx`
- **Status:** fixed in the current alpha line. Toast container now exposes `role="status"` with `aria-live="polite"`.
- **Remaining verification:** none beyond normal regression coverage.

## Not gaps

Dark mode detection via `prefers-color-scheme` (shipped v0.3.0) works correctly and respects user-level settings. Reduced-motion (`prefers-reduced-motion`) already disables transitions in `tokens.css`. Keyboard shortcuts (`N`, `Shift+N`, `/`) are discoverable via Settings > Shortcuts. Toast live-region semantics are now in place and no longer belong in the open-gap list.

## Process

When a11y suite runs live:
1. Real findings replace this file's "Foreseen gaps" section entirely
2. Any gap not already listed here gets a PR that EITHER fixes it OR adds an entry with target fix phase
3. No silent suppressions — `axe-core/playwright` `disable` config must have a comment referencing the matching entry here
