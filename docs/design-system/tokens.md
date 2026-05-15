# Token Reference

## Compatibility Contract

Existing app surfaces can keep using the legacy theme variables. Every built-in theme must resolve these variables in both light and dark mode:

| Token | Purpose |
| --- | --- |
| `--bg` | App background |
| `--b2` | Secondary surface |
| `--sb` | Sidebar and navigation rail |
| `--cd` | Card and panel surface |
| `--ac` | Primary action/accent |
| `--act` | Text on accent |
| `--tx` | Main text |
| `--t2` | Secondary text |
| `--t3` | Muted text |
| `--br` | Borders and dividers |
| `--rd` | Theme base radius |
| `--fn` | Theme font stack |

## Semantic Aliases

New surfaces should read the `--jf-color-*` aliases instead of raw legacy tokens. The aliases are mapped in `source/src/design/tokens.css` and preserve current behavior.

| Token | Maps To |
| --- | --- |
| `--jf-color-app` | `--bg` |
| `--jf-color-surface` | `--b2` |
| `--jf-color-sidebar` | `--sb` |
| `--jf-color-card` | `--cd` |
| `--jf-color-accent` | `--ac` |
| `--jf-color-accent-text` | `--act` |
| `--jf-color-text` | `--tx` |
| `--jf-color-text-muted` | `--t2` |
| `--jf-color-text-faint` | `--t3` |
| `--jf-color-border` | `--br` |

## Layout Tokens

| Token | Default | Use |
| --- | ---: | --- |
| `--jf-sidebar-width` | `240px` | Main left navigation |
| `--jf-sidebar-width-collapsed` | `56px` | Icon-only navigation |
| `--jf-context-rail-width` | `360px` | Right detail/context rail |
| `--jf-detail-width` | `380px` | Entry detail panel |
| `--jf-topbar-height` | `64px` | Search/capture bar |
| `--jf-statusbar-height` | `28px` | Vault status strip |
| `--jf-content-prose` | `680px` | Readable editor/preview column |
| `--jf-content-wide` | `960px` | Dense list views |

## Density Tokens

Density is set with `html[data-jf-density]`.

| Density | Row | Default control | Panel padding |
| --- | ---: | ---: | ---: |
| `compact` | `30px` | `28px` | `16px` |
| default | `36px` | `32px` | `20px` |
| `spacious` | `42px` | `36px` | `24px` |

## Motion Tokens

Use `--jf-motion-control` for hover/press/focus transitions and `--jf-motion-enter` for panel or route entry. Prefer transform and opacity. Avoid motion that changes layout measurements during interaction.

All motion tokens collapse to instant values under `prefers-reduced-motion: reduce`.

## Theme Foundation

`workstation` is the canonical shell theme for the screenshot-like direction. `obsidian` now shares the same dark foundation so current defaults can support the same app-workspace feel when the temporary forced shell variables are removed.
