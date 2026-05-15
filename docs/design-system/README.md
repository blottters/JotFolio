# JotFolio Design System

JotFolio is a local-first workspace for capture, recall, recovery, and connected Markdown work. The interface should feel durable, quiet, and deliberate: more instrument panel than marketing site.

## Design Point Of View

- **Local-first:** surfaces should make file paths, vault status, sync boundaries, and recovery states easy to inspect.
- **Serious workspace:** density is allowed. The app should support scanning, processing, and repeated keyboard work.
- **Human warmth:** color accents and empty states can have personality, while layout and controls stay predictable.
- **Screenshot-aligned shell:** left navigation, top search/capture, right context, and bottom vault status are core workstation parts.
- **No desktop backdrop:** the blue screenshot background represented the desktop outside the app. App backgrounds use theme tokens only.

## Token Layers

The legacy theme contract stays active:

`--bg`, `--b2`, `--sb`, `--cd`, `--ac`, `--act`, `--tx`, `--t2`, `--t3`, `--br`, `--rd`, `--fn`

New work should prefer semantic aliases in `source/src/design/tokens.css`:

`--jf-color-app`, `--jf-color-surface`, `--jf-color-sidebar`, `--jf-color-card`, `--jf-color-accent`, `--jf-color-text`, `--jf-color-border`

This lets the workstation evolve without breaking existing inline styles and older feature panels.

## Color Intent

The workstation foundation uses dark neutral surfaces, restrained blue action color, and high-contrast text. The app shell should read as one continuous workspace, with cards and rails separated by borders and value changes before shadow.

The OKLCH reference ramp in `tokens.css` is the authored color language for new CSS. Theme objects still use hex because theme customization and existing tests expect simple color strings.

## Typography

Use `var(--fn)` for compatibility. For the workstation shell, favor system UI for general controls and JetBrains Mono for vault-technical contexts where file paths, commands, and indexed metadata are present.

Use the `--jf-text-*` scale. Keep letter spacing at `0` for readable app text; reserve uppercase micro-labels for sections and status chips.

## Shape

JotFolio should avoid soft generic rounded cards. Controls sit around `--jf-radius-control`; panels and repeated cards sit around `--jf-radius-surface`; the app window itself is square inside the browser or Electron frame.

## Motion

Motion should clarify state changes: route entry, command palette appearance, row insertion, undo/redo feedback, and drag/drop affordances. Use `--jf-motion-enter` and `--jf-motion-control`; respect reduced motion through the global token fallback.

## Focus

Every interactive element should have a visible `:focus-visible` ring. The global focus token uses the active theme accent with an app-background offset so it remains visible on cards, rails, and popovers.

## Density

The default density is comfortable. `html[data-jf-density="compact"]` and `html[data-jf-density="spacious"]` are available for settings integration. Density changes row height, panel padding, and control height while preserving the same color and layout contract.
