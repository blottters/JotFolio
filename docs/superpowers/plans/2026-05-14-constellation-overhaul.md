# Constellation Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Constellation's visual and control layer while preserving the existing graph layout engine, keyboard access, reduced-motion handling, and vault data flow.

**Architecture:** Keep `layout.js` and graph derivation intact. Add a Constellation-specific visual system for node roles, edges, background, controls, legend, and empty states. Use existing React/SVG, theme variables, and test setup.

**Tech Stack:** React 19, SVG, inline style conventions already used by JotFolio, Vitest, Testing Library, Vite.

---

### Task 1: Constellation Color Language

**Files:**
- Modify: `source/src/lib/types.js`
- Modify: `source/src/lib/types.test.js`

- [x] Add a brighter Constellation color theme named `signal` to `TYPE_TOKENS`.
- [x] Keep existing `bone`, `sepia`, `cool`, and `mono` values unchanged for compatibility.
- [x] Update `TYPE_THEME_LEVELS` to include `signal`.
- [x] Add tests that `signal` exists for every base type and `applyTypeSat('note', 'signal')` returns the signal token.

### Task 2: Constellation Surface System

**Files:**
- Create: `source/src/features/constellation/constellationVisuals.js`
- Test: `source/src/features/constellation/constellationVisuals.test.js`

- [x] Add pure helpers for node role, node fill/stroke, edge tone, and group summary.
- [x] Treat `raw`, `wiki`, `review`, unresolved nodes, starred nodes, active nodes, and hub nodes as first-class visual states.
- [x] Test each helper with deterministic sample nodes.

### Task 3: Graph Header And Controls

**Files:**
- Modify: `source/src/features/constellation/ConstellationView.jsx`
- Test: `source/src/features/constellation/ConstellationView.test.jsx`

- [x] Replace the crowded top strip with a two-row header: title/metrics/focus breadcrumb, then compact controls.
- [x] Keep all existing actions: back, layout mode, missing links toggle, search, tag filter, type filter, memory-only, reset.
- [x] Add accessible labels and keep keyboard shortcuts.
- [x] Test that core controls still render and missing-link keyboard create still works.

### Task 4: Node And Edge Rendering

**Files:**
- Modify: `source/src/features/constellation/ConstellationView.jsx`
- Modify: `source/src/features/constellation/nodeRenderers.jsx`
- Test: `source/src/features/constellation/nodeRenderers.test.jsx`

- [x] Apply the new visual helpers to SVG nodes and edges.
- [x] Make default nodes more legible: stronger strokes, clearer labels, better active/focal contrast.
- [x] Make memory and unresolved nodes visually distinct without relying only on muted color.
- [x] Preserve pointer drag, focus drill, Alt-open, and keyboard activation behavior.

### Task 5: Background, Legend, And State Cards

**Files:**
- Modify: `source/src/features/constellation/ConstellationView.jsx`
- Modify: `source/src/features/constellation/ConstellationStateOverlay.jsx`
- Test: `source/src/features/constellation/ConstellationStateOverlay.test.jsx`

- [x] Replace the star-field feel with a quiet vault-map surface: subtle radial field, axis lines, and cluster depth cues.
- [x] Replace the legend with a compact map key that explains role, color, missing links, memory, focus, drag, and shortcuts.
- [x] Keep empty/error copy specific and actionable.

### Task 6: Settings Integration

**Files:**
- Modify: `source/src/App.jsx`
- Modify: `source/src/features/settings/SettingsPanel.jsx`
- Test: `source/src/features/settings/SettingsPanel.test.jsx`

- [x] Default new demo/current prefs to `typeSaturation: 'signal'` for Constellation color only.
- [x] Add `Signal` as a selectable Constellation type color theme.
- [x] Keep existing saved prefs valid through `applyTypeSat`.

### Task 7: Verification

**Files:**
- No source edits expected unless tests reveal a root cause.

- [x] Run `npm test -- src/features/constellation src/lib/types.test.js src/features/settings/SettingsPanel.test.jsx`.
- [x] Run `npm run build`.
- [x] Open `http://127.0.0.1:5174/?demo=full&reset=1`.
- [x] Inspect Constellation in the browser with demo data.
- [x] Re-score Constellation visual look, controls, keyboard/a11y, and engine.

**Completion note:** Visual look moves from 5 to 7.5, controls from 6 to 7.5, keyboard/a11y remains 8, layout engine remains protected at 8. The next worthwhile lift is stronger label collision handling for dense graphs.
