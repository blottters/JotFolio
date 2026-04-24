# Known Accessibility Gaps

Documented WCAG AA violations deferred to later phases. Any violation NOT listed here must be fixed before the PR that introduced it merges.

## Status

Playwright + `@axe-core/playwright` a11y suite at `bench/a11y/flows.spec.js` is stubbed for Phase 7. A full pass requires `npm install` + `npx playwright install` (browser binaries), both out of the default CI runner setup. Target: first real a11y run in v0.5.0 CI.

Until that run, we document foreseeable gaps based on code review. When Playwright runs, this doc will be overwritten with actual findings.

## Foreseen gaps

### 1. Constellation view (canvas + SVG hybrid)

- **Pages affected:** `/` with Constellation view active
- **Likely violations:** no accessible alternative for graph positions, nodes only clickable via mouse, no keyboard traversal of the graph
- **Target fix:** v0.5.0 — add arrow-key node navigation + screen-reader text equivalent listing "N notes connected to this note: [list]"
- **Workaround:** sidebar list + detail panel serve same browsing path for keyboard + AT users

### 2. Inline text contrast on 26 theme variants

- **Pages affected:** all
- **Likely violations:** several themes (e.g. `sakura`, `y2k`, `glass`) may miss WCAG AA 4.5:1 on body text or 3:1 on UI icons
- **Target fix:** v0.5.0 — computed-contrast audit across all 26 themes, auto-adjust `--t3` / `--br` tokens when below threshold
- **Workaround:** `minimal`, `paper`, `obsidian`, `ink` themes all pass AA on manual inspection; list as "accessible themes" in Settings

### 3. Focus-visible outline on dropdowns

- **Pages affected:** Settings > theme/font dropdowns
- **Likely violations:** focus ring may disappear inside some dropdown panels due to overflow clipping
- **Target fix:** v0.5.0 — audit + switch to `outline-offset` with `var(--jf-focus-ring)` token applied uniformly
- **Workaround:** none; known AT-usability issue

### 4. Command palette + quick switcher

- **Pages affected:** command palette, quick switcher (both deferred to Phase 4b.5 / 0.5.0)
- **Likely violations:** not yet implemented, will need `role="combobox"`, `aria-activedescendant`, live-region result announcements
- **Target fix:** will be designed in from the start of the 0.5.0 implementation, not retrofitted

### 5. Toast notifications

- **Pages affected:** all; toasts render via `src/features/primitives/Toasts.jsx`
- **Likely violations:** toasts probably lack `role="status"` / `aria-live="polite"` on the container
- **Target fix:** v0.4.1 (quick patch) — add `role="status"` to the toast list container
- **Workaround:** none

## Not gaps

Dark mode detection via `prefers-color-scheme` (shipped v0.3.0) works correctly and respects user-level settings. Reduced-motion (`prefers-reduced-motion`) already disables transitions in `tokens.css`. Keyboard shortcuts (`N`, `Shift+N`, `/`) are discoverable via Settings > Shortcuts.

## Process

When a11y suite runs live:
1. Real findings replace this file's "Foreseen gaps" section entirely
2. Any gap not already listed here gets a PR that EITHER fixes it OR adds an entry with target fix phase
3. No silent suppressions — `axe-core/playwright` `disable` config must have a comment referencing the matching entry here
