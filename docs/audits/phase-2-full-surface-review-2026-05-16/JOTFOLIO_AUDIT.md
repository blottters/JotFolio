# JOTFOLIO_AUDIT.md

I love what this app is trying to be. That's why this is going to read sharp. A local-first synthesis vault is the kind of tool people will love or abandon based on the first ten interactions, and right now too many of those interactions are below the bar the rest of the work sets.

I'm not auditing this against a Linear or a Raycast because those teams have ten times the engineers. I'm auditing it against itself — against the version of JotFolio that already exists in the code's better moments. The design tokens file is excellent. The keyboard story is mostly there. The plugin sandbox is rigorous. So when I find a `transition: 'width 0.2s'` hardcoded inline in the same Sidebar that has six perfectly good motion tokens defined twenty files away, I take it personally.

Items below are numbered continuously across all three sections so they can be cited cleanly in tickets.

---

## NEEDS CHANGED

### 1. Sidebar icons are Unicode geometry, not icons
**Where:** `source/src/features/sidebar/Sidebar.jsx:18-27`
**The problem:** The primary navigation uses Unicode characters as icons: `⌂` for Command Center, `▱` for Inbox, `⌕` for Search, `▭` for Projects, `▤` for Notes, `□` for Calendar, `⌘` for Constellation, `☑` for Tasks, `▣` for Spaces, `✧` for AI Setup, `⚙` for Settings, `⌫` for Trash. This is what a programmer ships when they haven't picked an icon library yet. The render fidelity changes across fonts, the visual weight is wildly inconsistent (`⌫` is a thin line, `▣` is a heavy block), and the `⌘` glyph used for Constellation is the Mac command key — it's actively misleading to a Mac user.
**What I'm doing about it:** Adopting a single 1.5px-stroke 20px outline icon set (Lucide or a custom set drawn at consistent optical weight) and replacing every nav entry. I'm building an `<Icon name="…" />` component that reads from a single SVG sprite to keep bundle size honest. While I'm there I'm killing the inline ad-hoc Unicode in the empty states (`🔍`, `⌫`, the `+` glyph in `EmptyState.jsx:13,47,45`) and routing them through the same component.
**Why this matters:** Every time a user opens the app they read this sidebar. Inconsistent glyph weight is the visual equivalent of typos in the headlines — it makes everything else feel less considered, even when the underlying engineering is excellent.

### 2. AddModal mashes "capture" and "create" into one shell
**Where:** `source/src/features/add/AddModal.jsx:453` — the title literally reads "Capture / New Entry"
**The problem:** Capture is fast: a thought, a URL, a screenshot. Create is deliberate: a project brief, a research note from a template. The current modal asks the user to choose between ten entry types, pick a template, set tags, choose a content tab, drag a file, configure a source URL, and preview a local path — *before* writing anything. For a fast capture, that's six clicks of overhead. For a deliberate create, the type-picker is the wrong first decision (you usually know what you're making). Trying to serve both flows in one modal serves neither well.
**What I'm doing about it:** Splitting into two surfaces. `QuickCapture` (triggered by `N` or `Cmd+Shift+N`) is a single textarea with a type pill at the bottom — type, hit Enter, done; auto-detects URLs and switches to "link" type silently. `NewEntry` (triggered by `Cmd+N` or "New Entry" from the empty state) is the current modal, but with the type pre-selected from context instead of a 10-cell grid. The current modal keeps the `quickCapture` prop, so the rewiring is mostly routing.
**Why this matters:** The friction of the current modal is the reason people stop capturing. Capture is the input funnel for the entire app — if it's heavy, the vault stays empty.

### 3. QuickSwitcher and CommandPalette are visually identical
**Where:** `source/src/features/quickSwitcher/QuickSwitcher.jsx:208-323` vs `source/src/features/commandPalette/CommandPalette.jsx:128-204`
**The problem:** Same outer modal (`width: 'min(560px, 92vw)'`, `paddingTop: 96`, same `var(--bg)` background, same `border-radius: 8`, same footer hint bar). The only signal telling the user which one they opened is the placeholder copy — "Find or create entry…" vs "Run an app command…". A power user firing `Cmd+O` and `Cmd+P` back-to-back will type a command into the entry switcher half the time. I did it twice while reading the code.
**What I'm doing about it:** Adding a left-side mode pill inside the input bar — "Notes" for QuickSwitcher (with a `▤` glyph), "Commands" for CommandPalette (with a `⌘` glyph) — using the existing entry-type accent colors. The pills are clickable (swap modes without closing). I'm also widening QuickSwitcher to 640px to make it physically distinct, and giving CommandPalette a subtle 1px accent-colored top border so a glance distinguishes them.
**Why this matters:** Two surfaces that do different things must look different. Anything else trains the user's hands to do the wrong thing.

### 4. App.jsx owns the world
**Where:** `source/src/App.jsx:88-200` (file is 800+ lines per CLAUDE.md note)
**The problem:** `useState` calls 1 through 30 are all in the same component: theme, prefs, toasts, sidebar open, detail id, constellation focus, split memory target, settings open, settings tab, folder dialog, folder draft, entry file dialog, trash items, trash busy, trash error, confirm request — and we haven't hit line 200. CLAUDE.md explicitly notes the file violates the project's own 800-line cap. The component is acting as router, state store, command bus, and toast manager all at once.
**What I'm doing about it:** Extracting four slices: `useAppNavigation` (section, view, query, nav stacks), `useAppOverlays` (modals, dialogs, settings, confirm), `useAppToasts` (already partly extracted via `Toasts.jsx`, hoist the timer logic), and `useAppPreferences`. App.jsx becomes a thin shell that wires the providers. The slices are testable in isolation, which is the secondary win.
**Why this matters:** Right now adding a feature requires reading 800 lines to know what state already exists. That's how the same prop gets passed under two names, or how `sidebarWidth` lives in state with no UI to change it (see item 38).

### 5. Toasts have a fixed 3-second lifetime for everything
**Where:** `source/src/App.jsx:116` — `setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000)`
**The problem:** Success toasts and error toasts get the same dwell. An error that the user needs to read and act on (`Operation failed: ENOENT no such file or directory in vault/notes/...`) disappears in three seconds whether the user finished reading or not. Worse, `Toasts.jsx:6` sets `whiteSpace: 'nowrap'`, so long error messages get clipped past the viewport edge. And `pointerEvents: 'none'` means the user can't even click to acknowledge — they can only wait or miss it.
**What I'm doing about it:** New signature: `toast(msg, { type, dwell, action })`. Success: 3s. Info: 5s. Error: persistent until dismissed, with a visible close button. Wrap long messages (`white-space: pre-wrap; max-width: 360px`). Move `pointerEvents: 'auto'` onto individual toasts so close + action click through, keep `pointerEvents: 'none'` on the container so it doesn't intercept clicks behind it. While I'm there, the toast stack at `bottom: 80, right: 24` collides with the status bar on small windows — I'll anchor to the workstation bottom edge with a `--jf-statusbar-height` offset.
**Why this matters:** Errors that vanish are bugs the user can't report. A storage corruption error scrolling past in three seconds is exactly the moment you needed the user's attention most.

### 6. EmptyState reads like a manual page, not an empty state
**Where:** `source/src/features/emptystate/EmptyState.jsx:30`
**The problem:** "Entries are the core objects in JotFolio. A note, media item, journal, or link is one entry in your vault." That's onboarding copy. It runs every time the user filters to a section with no results. The fifth time a user filters to "Tasks" with no tasks and sees this paragraph, they're not learning what an entry is — they're being condescended to.
**What I'm doing about it:** Two paths. First entry ever (vault count == 0) → keep the explainer; this is the only place it's still earning its space. Section is non-empty but filter returns nothing → existing "No matches" path is fine. Section is empty but vault is not (e.g., no tasks yet) → short copy per section: "Tasks let you track work-in-flight. Create one with `T` or the + button." The pattern is one sentence of *what this section is for* plus one sentence of *how to start*, no more.
**Why this matters:** Empty states are read more than any other surface in productivity tools. Treat them like marketing copy — short, opinionated, specific.

### 7. Every modal reinvents focus trapping
**Where:** `source/src/features/quickSwitcher/QuickSwitcher.jsx:19-55`, `source/src/features/commandPalette/CommandPalette.jsx:10-46`, `source/src/onboarding/WelcomePanel.jsx:6-42` — same `FOCUSABLE_SELECTOR` constant and same `containTabFocus` function duplicated three times verbatim
**The problem:** Three copies of the same 35-line focus trap. The day one of them fixes a bug (e.g., handling `aria-hidden` on shadow DOM), the other two stay broken. AddModal also has a focus trap but uses a *different* hook (`useEscapeKey`, `useAutoFocus`). Four modals, two implementations, no consistency about who owns dismissal behavior.
**What I'm doing about it:** Building `<Modal>` at `source/src/features/primitives/Modal.jsx` with the focus trap, escape handling, backdrop click, scroll lock, and `aria-modal` wiring built in. Migrating WelcomePanel, QuickSwitcher, CommandPalette, AddModal, AppConfirmDialog, EntryFileDialog, TagManageDialog, InsertTemplateModal, CompilePreviewModal, SplitMemoryModal. Yes, that's ten modals. They all need it.
**Why this matters:** A productivity tool's reputation is made in keyboard correctness. If `Tab` ever leaves a modal into the background, the trust is broken.

### 8. Hardcoded hex colors all over inline styles
**Where:** Sampling: `source/src/features/trash/TrashView.jsx:34,35,41` (`#b91c1c`, `#ef4444`), `source/src/features/add/AddModal.jsx:570,838,852` (`#f87171`, `#f59e0b`, `#ef4444`), `source/src/features/settings/SettingsPanel.jsx:47,51,63` (`#ef4444`, `#10b981`)
**The problem:** `source/src/design/tokens.css` defines `--jf-color-danger: #dc3f4f`, `--jf-color-warning: #c78318`, `--jf-color-success: #2b9464`. Then half the components ignore them and write Tailwind's red-500 / red-700 / amber-500 inline. The whole point of the token file is one source of truth for color. Right now if a user with red-green colorblindness asks me to retune danger, I have to grep 26 files instead of editing one variable.
**What I'm doing about it:** Adding `--jf-color-danger-strong`, `--jf-color-danger-soft`, `--jf-color-success-strong`, `--jf-color-warning-strong` to tokens (the granularity I need exists in the inline values). Replacing every hardcoded hex. Adding an eslint rule (or a simple grep in CI) that flags inline hex outside `tokens.css` and `themes.js`.
**Why this matters:** A design system that isn't enforced is fiction. Right now JotFolio has fiction.

### 9. Z-index layering is fictional
**Where:** `source/src/features/shell/AppConfirmDialog.jsx:11` (`zIndex: 80`), `source/src/features/add/AddModal.jsx:419` (`zIndex: 320`), `source/src/features/quickSwitcher/QuickSwitcher.jsx:202` (`zIndex: 200`), `source/src/features/commandPalette/CommandPalette.jsx:123` (`zIndex: 200`), `source/src/onboarding/WelcomePanel.jsx:75` (`zIndex: 300`)
**The problem:** Tokens define a clean scale: `--jf-z-sidebar: 10`, `--jf-z-detail: 20`, `--jf-z-command-palette: 80`, `--jf-z-popover: 100`, `--jf-z-modal: 300`, `--jf-z-toast: 500`, `--jf-z-tooltip: 600`. Nothing in the app uses them. Worse: `AppConfirmDialog` ships at z-index 80, which is *below* `AddModal` (320) and *below* `QuickSwitcher` (200). If the user opens AddModal, edits a dirty form, then triggers a confirm dialog from inside, the confirm renders behind the modal it's guarding. That's not theoretical — the dirty-discard confirm at `AddModal.jsx:844` is inline because the proper confirm dialog would render under the modal.
**What I'm doing about it:** Every overlay reads from tokens. AppConfirmDialog → `var(--jf-z-modal-confirm)` (new token at 400, above modals). AddModal → `var(--jf-z-modal)`. QuickSwitcher / CommandPalette → `var(--jf-z-command-palette)` (raise to 220 so they sit above sidebar but below modals). WelcomePanel → `var(--jf-z-modal)`. The "inline discard confirm" pattern at AddModal.jsx:844 goes away — it becomes a real `<AppConfirmDialog>` instance via `requestConfirm`.
**Why this matters:** A confirm dialog hidden behind the modal it's confirming is a worst-class bug — the user can't see what they're being asked, can't cancel, can't proceed. Today it happens to be hidden by the inline-confirm workaround, which is itself a smell.

### 10. AppConfirmDialog auto-focuses the destructive button
**Where:** `source/src/features/shell/AppConfirmDialog.jsx:34` — `<button autoFocus type="submit" ...>` is the Confirm/Delete button
**The problem:** Open the dialog, press Enter — destructive action fires. The pattern across well-built apps (Notion, Linear, even native Windows dialogs for irreversible operations) is: focus Cancel on dangerous tone, focus Confirm on safe/informational tone. JotFolio focuses Confirm regardless of tone.
**What I'm doing about it:** Branch on `request.tone`. `danger` → `autoFocus` on Cancel button. `warning` → `autoFocus` on Cancel. `info` → `autoFocus` on Confirm (default OK behavior). Also adding `e.key === 'Enter'` guard: if focus is on Cancel, Enter cancels; if focus is on Confirm, Enter confirms. Currently the form `onSubmit` fires on any Enter regardless of focus, which is wrong.
**Why this matters:** The "delete forever" path should be hard to fire accidentally. Right now it's two keystrokes from any state.

### 11. Two "Apply Template" buttons in one modal
**Where:** `source/src/features/add/AddModal.jsx:721` (next to the template `<select>`) and `source/src/features/add/AddModal.jsx:881` (in the footer action bar)
**The problem:** Two buttons, same `applyTemplate` handler, in the same modal, 160 lines apart. The footer one duplicates a quiet button that's already adjacent to its trigger surface. Either the inline one is sufficient (the dropdown + apply is a natural pair) or the footer one is sufficient (consistent action footer), but not both. The user has to figure out which one wins, and the fact that both call the same handler doesn't reassure — it makes the user wonder if they do *slightly* different things.
**What I'm doing about it:** Keep the inline button next to the template select. Delete the footer one. Apply-template-from-footer was probably a leftover from before the select got its own apply affordance. While I'm in the footer, that row needs a hierarchy pass anyway (see item 30).
**Why this matters:** Duplicated affordances make every interaction a riddle. The right number of "Apply Template" buttons is one.

---

## NEEDS EDITED

### 12. EmptyState copy is generic across sections
**Where:** `source/src/features/emptystate/EmptyState.jsx:28-31`
**The problem:** For section "tasks", the heading reads "No tasks yet" — that's good. Then the body reads "Entries are the core objects in JotFolio. A note, media item, journal, or link is one entry in your vault." That's wrong for tasks; tasks have their own model. Every section gets the same generic body.
**What I'm doing about it:** Section-specific copy in a lookup map:
- `tasks`: "Tasks track work in flight. Open with `Enter`, complete with `Space`."
- `projects`: "Projects bundle related notes, links, and tasks. Start one with a working title — you can refine it later."
- `note`: "Notes are the connective tissue of the vault. Start with anything — a snippet, a quote, a half-formed idea."
- `journal`: "Journals are dated; today's entry pre-fills when you press `N`."
The "Press N or click +" hint stays — it's the right call to action.
**Why this matters:** Generic copy reads like the developer didn't care. Specific copy reads like the developer used the tool.

### 13. The dirty-discard confirm inflates the modal mid-flow
**Where:** `source/src/features/add/AddModal.jsx:844-863`
**The problem:** When user has unsaved changes and tries to close, an inline warning card appears *inside the modal body*, pushing the action footer down and (on small viewports) potentially clipping the buttons. It looks like an in-flow message, not a guard. The user's eye is still on the title field they were editing.
**What I'm doing about it:** Removing the inline card. Route through `requestConfirm` from `App.jsx`. The proper `<AppConfirmDialog>` overlays the modal, focuses Cancel (per item 10), and reads "Discard this capture? You'll lose unsaved tags, notes, and the title you typed." (per item 17). The current inline pattern stops being needed once z-indexes are correct (item 9).
**Why this matters:** Mid-flow layout shifts are the kind of thing power users put up with and casual users walk away from.

### 14. QuickSwitcher placeholder over-promises
**Where:** `source/src/features/quickSwitcher/QuickSwitcher.jsx:222` — `placeholder="Find or create entry…"`
**The problem:** The placeholder says "or create entry", but creating only happens when the typed text doesn't match any existing entry exactly *and* the user either selects the Create row or hits `Shift+Enter`. A user who types a fuzzy match thinking it'll create gets the existing entry opened instead. The current copy implies "type anything and either find or create" — but actually "find takes priority, create requires a deliberate action."
**What I'm doing about it:** New placeholder: `"Find entry — Shift+↵ to create new"`. Three words removed, one keystroke hint added. The hint matches the existing footer language so the user learns the shortcut.
**Why this matters:** A placeholder is a promise. Broken promises in productivity tools are why users stop trusting the UI.

### 15. CommandPalette placeholder is forgettable
**Where:** `source/src/features/commandPalette/CommandPalette.jsx:137` — `placeholder="Run an app command…"`
**The problem:** "Run an app command" is technically correct and tells the user nothing. The user already knows they opened a command palette; what they don't know is what kinds of commands are in it.
**What I'm doing about it:** `placeholder="Run a command — toggle theme, export vault, open settings…"` Three examples primed by what the registry actually offers. Reads as a teaser, not a category label.
**Why this matters:** First-run discoverability. The user doesn't know what's in the palette until they look. Show them by example.

### 16. Trash uses the backspace glyph as its icon
**Where:** `source/src/features/trash/TrashView.jsx:47,58` — `<div ... aria-hidden="true">⌫</div>`
**The problem:** `⌫` is the erase-backwards keyboard symbol, not a trash icon. The Sidebar nav for Trash uses the same glyph at `Sidebar.jsx:47`. The icons are technically pointing to deletion but they're pointing to *the wrong kind of deletion* — backspace is "remove the previous character," not "trash this file."
**What I'm doing about it:** Replace with a proper trash icon — a 20px outline trash-can SVG, same stroke weight as the rest of the (forthcoming, item 1) Lucide-style set. Both the sidebar nav and the TrashView empty state get the same component.
**Why this matters:** Iconography is the user's mental map of the app. Wrong icons map to wrong actions in muscle memory.

### 17. Discard confirm copy is filler
**Where:** `source/src/features/add/AddModal.jsx:859` — `"Discard this capture? Your changes will be lost."`
**The problem:** "Your changes will be lost" is the placeholder copy every confirmation dialog ships with. It's true and forgettable. The user is about to make a destructive decision and the prompt is generic.
**What I'm doing about it:** New copy, varies by what's dirty: if tags + body present, "You'll lose the title, tags, and notes you typed." If only the title is present, "You'll lose the title you typed." If only body, "You'll lose the notes you wrote." Each variant tells the user *exactly* what they're throwing away. The button stays "Discard" (good) — I'd consider changing it to "Throw away" to match the trash metaphor, but "Discard" is the iOS/Notion convention and there's no upside to deviating.
**Why this matters:** Specific copy reads as the system seeing the user. Generic copy reads as the system shrugging.

### 18. Toasts clip long messages
**Where:** `source/src/features/primitives/Toasts.jsx:6` — `whiteSpace: 'nowrap'`
**The problem:** Storage corruption toast is `Storage recovery needed for ${err.key}` — that key can be a 60-character localStorage path. `whiteSpace: 'nowrap'` means it runs past the viewport, the user sees `Storage recovery needed for jf:vault:no…` and the meaningful part is hidden.
**What I'm doing about it:** `white-space: normal; max-width: 360px; line-height: 1.4`. Two-line toasts are fine; clipped messages are not.
**Why this matters:** Errors users can't read are errors they can't act on.

### 19. TrashView buttons fire without confirmation
**Where:** `source/src/features/trash/TrashView.jsx:67-74`
**The problem:** "Restore" and "Delete forever" both fire immediately on click. The "Delete forever" button has the right copy and the right danger color, but the wrong behavior — a single click triggers irreversible deletion. The parent (`App.jsx`) has `requestConfirm` available; this view doesn't use it.
**What I'm doing about it:** Wrap both handlers in `requestConfirm` calls with proper copy:
- Restore: `{ title: 'Restore file', message: 'Restore "${name}" to ${originalPath}? If a file already exists at that path, the restore will be cancelled.', confirmLabel: 'Restore', tone: 'info' }`
- Delete forever: `{ title: 'Delete permanently', message: 'Permanently delete "${name}". This cannot be undone.', confirmLabel: 'Delete forever', tone: 'danger' }`
Restore is reversible-ish (it just moves the file), so the confirm is informational. Delete is irreversible, so the confirm is hardened (focus Cancel per item 10).
**Why this matters:** Irreversible actions one click away is exactly the bug class that ends with a support ticket and a refund.

### 20. AddModal tag input has no placeholder
**Where:** `source/src/features/add/AddModal.jsx:662-685` — the `<input id="capture-tag-input">` has `aria-label="Add tag"` but no `placeholder`
**The problem:** The tag field looks empty. A new user sees a blank box next to "Tags" with no prompt. They don't know that Enter or comma submits, that they can type free text, or that the `⌄` button reveals suggestions.
**What I'm doing about it:** `placeholder="Add a tag, press Enter"`. Five words, complete sentence, tells the user the affordance. The suggestion-reveal button gets a `title="Show suggestions"` tooltip.
**Why this matters:** Hidden affordances aren't features — they're trivia.

### 21. The remove-tag glyph reads as literal "x"
**Where:** `source/src/features/add/AddModal.jsx:659` — `{tag} <span style={{color: 'var(--t3)'}}>x</span>`
**The problem:** Lowercase Latin `x` is being used as a close-button glyph. It reads as text — "research x" looks like the tag is named "research x". Compare to the close button on the modal itself at AddModal.jsx:476, which correctly uses `×` (U+00D7 multiplication sign) at 24px.
**What I'm doing about it:** Replace with `×` (`×`), or better, an inline 10x10 SVG cross to match the rest of the icon set after item 1 lands. Add a hover state — the current glyph has no affordance feedback at all.
**Why this matters:** Tiny but constant. Every tag chip is a small visual lie about its dismiss control.

### 22. AddModal close button has no hover or focus styling
**Where:** `source/src/features/add/AddModal.jsx:461-477`
**The problem:** 24px `×` glyph, no background, no border, no hover state, no focus ring (tokens define `--jf-focus-ring-offset` but inline styles don't apply it). On keyboard, tabbing through the modal lands on this button with zero visual indication.
**What I'm doing about it:** Add `:hover` via inline `onMouseEnter`/`onMouseLeave` state (since this is inline-style land), bumping background to `rgba(255,255,255,0.06)`. On focus-visible, apply `box-shadow: var(--jf-focus-ring)`. Increase hit target to 32x32 (`width: 32, height: 32, display: 'grid', placeItems: 'center'`) — currently the touch target is whatever 24px of `×` glyph happens to be, which is sub-spec for any pointer-based interaction guideline.
**Why this matters:** The close button is one of the two most-clicked controls in any modal. It deserves the same care as the primary CTA.

### 23. Footer keyboard hints have no accessible labels
**Where:** `source/src/features/commandPalette/CommandPalette.jsx:196-199`, `source/src/features/quickSwitcher/QuickSwitcher.jsx:315-319`
**The problem:** The footer hint bar reads (visually) "↑↓ navigate · ↵ run · Esc close". A screen reader reads "up down navigate, return run, escape close" if it can parse the glyphs at all — VoiceOver often reads `↑↓` as "up arrow down arrow" but `↵` as nothing, depending on font. The hints are advisory text without proper ARIA.
**What I'm doing about it:** Wrap each in a `<span role="text" aria-label="Up and down arrows navigate the list">↑↓ navigate</span>`. Or — better — convert to a `<dl>` semantically:
```jsx
<dl><dt aria-hidden="true">↑↓</dt><dd>Navigate</dd></dl>
```
with `dt` styled inline as a kbd-style chip. Group with a `<section aria-label="Keyboard shortcuts">` wrapper.
**Why this matters:** A productivity tool that ships a screen-reader-hostile shortcut bar is sending a clear message about who it's for.

### 24. Ellipsis inconsistency
**Where:** Sample: `source/src/features/add/AddModal.jsx:595` (`Thinking…`), `source/src/features/settings/SettingsPanel.jsx:52` (`Working...`), `source/src/features/quickSwitcher/QuickSwitcher.jsx:222` (`Find or create entry…`), `source/src/features/trash/TrashView.jsx:32` (`Refreshing...`)
**The problem:** Some strings use `…` (U+2026), some use `...` (three dots). Inconsistent across the same product, often within the same component file.
**What I'm doing about it:** Standardize on `…` everywhere. One pass across the codebase via grep + replace. Add a documented convention to CONTRIBUTING — single character, not three dots.
**Why this matters:** Typographic discipline is the cheapest form of polish. Free.

### 25. NoteBody toolbar uses ambiguous symbols
**Where:** `source/src/features/editor/NoteBody.jsx:8-21`
**The problem:** `⌁` for link (this is the "electric arrow" symbol, not a chain link), `<>` for inline code (acceptable but weak compared to the standard `</>` glyph), `□` for image (a generic square — same glyph as the Calendar nav icon in item 1, so they read as the same affordance), `▦` for table (better, but still inconsistent stroke weight with the rest). The H1/H2/B/I letters are fine.
**What I'm doing about it:** Replace with the SVG icon set from item 1: link icon (chain), code icon (angle brackets), image icon (mountain-in-frame), table icon (grid). Letters for H1/H2/B/I stay, but render in JetBrains Mono via `--fn-mono` token (which already exists) for visual consistency with the kbd-style hint chips elsewhere.
**Why this matters:** The editor toolbar is the surface the user spends the most time looking at. It deserves the most polish.

### 26. AppConfirmDialog uses a hardcoded border-radius
**Where:** `source/src/features/shell/AppConfirmDialog.jsx:15` — `borderRadius: '10px'`
**The problem:** Tokens define `--jf-radius-lg: 9px`. Hardcoded 10px is one pixel off the system value and one of three radii in this single file (the buttons at lines 30 and 36 use `'8px'`). Three radii for one dialog.
**What I'm doing about it:** Dialog shell → `var(--jf-radius-lg)`. Buttons → `var(--jf-radius-control)` (which composes correctly with the theme's `--rd`). One pass across the file, then a sweep for other inline-px radii in inline styles.
**Why this matters:** A design token only earns its keep when it's used. One file at a time, the codebase has to align.

### 27. "Manage Tags" sidebar item uses a + icon
**Where:** `source/src/features/sidebar/Sidebar.jsx:41` — `<NavItem icon="+" label="Manage Tags" ...>`
**The problem:** `+` is the universal "add" affordance. This action opens a *management* dialog where users can rename, merge, and delete tags. The icon promises "add a tag," the action delivers a tag-management modal. Mismatch.
**What I'm doing about it:** Icon changes to `⚙` (or, post-item-1, the gear SVG). Label stays "Manage Tags". If we want to keep an "add tag" affordance separate (we should), it goes inside the management dialog as a primary action.
**Why this matters:** Icons set expectations. Wrong icon, wrong expectation, broken flow.

### 28. The "Unsaved" indicator is invisible
**Where:** `source/src/features/add/AddModal.jsx:456-460` — `<span aria-live="polite" style={{marginLeft: 12, fontSize: 11, color: 'var(--t3)', fontWeight: 700}}>Unsaved</span>`
**The problem:** `--t3` is the faint tertiary text color. The indicator that the user has unsaved work is rendered in the same color as decorative metadata. There's no dot, no badge, no visual hierarchy. A user scanning the header bar will not see it.
**What I'm doing about it:** Pulsing 6px dot in `var(--jf-color-warning)` followed by the word "Unsaved" in `var(--t2)` (medium muted, not faint). Animation: `@keyframes jf-pulse { 0%, 100% { opacity: 0.5 } 50% { opacity: 1 } }`, 1.4s ease-in-out infinite. Disabled under `prefers-reduced-motion` (tokens already wire this — see `tokens.css:241-256`).
**Why this matters:** The whole point of the dirty indicator is to warn before discard. Invisible warnings warn nobody.

### 29. EmptyState button uses a literal "+" glyph
**Where:** `source/src/features/emptystate/EmptyState.jsx:45` — `+ {isType?`Add ${LABEL[section].slice(0,-1)}`:'New Entry'}`
**The problem:** Same `+` text glyph as everything else, no visual weight, no spacing, no icon. The button is the primary CTA of an empty state — should be the strongest visual element on the page.
**What I'm doing about it:** Replace with an SVG plus icon at 14px, paired with the label, properly kerned (8px gap). Increase button height from `9px 18px` padding to use `--jf-control-lg` (40px height). For first-run empty state (no entries anywhere), the button also gets a subtle 1.4s glow animation to draw the eye — turned off after first interaction so it doesn't keep nagging.
**Why this matters:** The first CTA in a productivity tool decides whether the user creates their first entry or closes the app.

### 30. The "Clear filters" button uses × as a verb prefix
**Where:** `source/src/features/emptystate/EmptyState.jsx:20` — `<button>× Clear filters</button>`
**The problem:** `×` followed by text reads as "close, clear filters" — two affordances in one button. The standard convention is `× Clear` (× = the action, Clear = the label) *or* `Clear filters` (label alone, no glyph). Putting `×` at the front of a verb phrase mixes metaphors.
**What I'm doing about it:** Drop the `×`. The button label becomes `Clear filters` with a small filter icon at the left (post-item-1) to ground the action. The button keeps its accent background; that's where the visual weight should be.
**Why this matters:** Read your own buttons out loud. "Times-clear-filters" is not how anyone speaks.

### 31. Sidebar uses a magic transition duration
**Where:** `source/src/features/sidebar/Sidebar.jsx:16` — `transition: 'width 0.2s'`
**The problem:** 200ms doesn't match any of the four motion tokens (`--jf-t-fast: 90ms`, `--jf-t-med: 170ms`, `--jf-t-slow: 280ms`). It's been picked by feel and committed without consulting the system. Also: no easing function specified, so the browser falls back to `ease`, which is wrong for layout transitions (overshoots).
**What I'm doing about it:** `transition: width var(--jf-t-med) var(--jf-ease-out)`. Cleaner curve, in-system timing, future motion retuning happens at the token level.
**Why this matters:** Animation consistency is the difference between an app feeling crafted and feeling thrown together. Four arbitrary durations is the latter.

---

## NEEDS ADDED

### 32. There is no global undo
**Where:** Whole app — there's no `Cmd+Z` handler anywhere. Closest thing is the Trash, which is a separate recovery flow.
**The problem:** Delete an entry: it goes to Trash, the user gets a toast, and that's it. To recover, the user has to navigate to Trash, find the entry, click Restore. Compare to Linear/Notion: any destructive action shows a "deleted • undo" toast for ~8 seconds, and `Cmd+Z` works for the last action regardless of where the user is.
**What I'm doing about it:** Building `useUndoStack()` at `source/src/lib/hooks/useUndoStack.js`. Registers a one-action history (last destructive op). Bound to `Cmd+Z` globally (with input-element guard so it doesn't break text editing). Destructive toasts get an "Undo" action button that calls the registered undo function. Single-action stack is intentional — multi-step undo invites confusion and the Trash exists for deeper recovery.
**Why this matters:** Reversibility is the foundation of confidence in a tool. Without it, every delete is a small commitment, and small commitments accumulate into hesitation.

### 33. There is no keyboard cheatsheet
**Where:** Whole app — `?` key is unbound; no "Show shortcuts" affordance anywhere.
**The problem:** The app has `N`, `Cmd+O`, `Cmd+P`, `Cmd+K`, `Cmd+Shift+N`, `Esc`, plus modal-specific bindings like `Shift+Enter` in QuickSwitcher. None of this is discoverable without reading the source. The empty state hints at `N`. The QuickSwitcher footer hints at its bindings. The CommandPalette footer hints at its own. There is no single surface that lists them all.
**What I'm doing about it:** Bind `?` (and `Cmd+/`) to open a `<KeyboardCheatsheet>` overlay. Two columns: Global (open palette, open switcher, new entry, toggle sidebar, focus search) and Context (per-section bindings inferred from the registry). Renders the same kbd-style chips used in the footer hints. Reachable from CommandPalette as the command "Show keyboard shortcuts" (already discoverable that way once it exists).
**Why this matters:** Power users measure productivity tools by what they can do without touching the mouse. Hidden shortcuts make the tool look amateur even when the shortcuts are good.

### 34. AddModal has no draft persistence
**Where:** `source/src/features/add/AddModal.jsx` — close the modal, draft is gone (dirty prompt notwithstanding).
**The problem:** User types a 300-word capture, gets a phone call, accidentally closes the modal, hits "Discard" by reflex — draft is gone. The modal warns about discarding but offers no "save as draft" path. The vault has an Inbox section (`raw_inbox` flag); drafts should land there as a sub-state.
**What I'm doing about it:** Auto-persist draft to `localStorage` under `jf:draft:capture` on every keystroke (debounced 500ms). On modal mount, if a draft exists and the user didn't open the modal with `initialTitle` set, show a small banner: "You have an unsaved capture from 4 minutes ago. [Restore] [Discard]". On successful save, clear the draft. On explicit discard via the dirty confirm, clear the draft. On accidental browser close, the draft survives.
**Why this matters:** Lost work is the single most damaging trust event a productivity tool can inflict. The fix is cheap; the trust dividend is large.

### 35. No loading skeleton for entries
**Where:** `source/src/App.jsx:75-85` — `LazyOverlay` renders a centered "Loading..." text fallback.
**The problem:** When the vault is loading (cold start, vault switch), users see a blank shell with "Loading..." in the center. No layout, no sense of structure, no perceived speed. Then the entries pop in and the layout reflows.
**What I'm doing about it:** Building `<EntryCardSkeleton>` and `<EntryRowSkeleton>` — shimmer placeholders matching the actual card/row dimensions. The shimmer uses `--jf-color-surface` to `--jf-color-card` gradient sliding at 1.4s, disabled under `prefers-reduced-motion` (static gray instead). LazyOverlay grows a `variant` prop: `text` (current behavior, for tiny overlays) and `skeleton` (renders 6 skeleton entries in current view mode).
**Why this matters:** Perceived performance is a separate axis from actual performance. Skeletons buy you ~400ms of subjective patience.

### 36. Sidebar has no resize handle
**Where:** `source/src/App.jsx:111` (`sidebarWidth: 272` in DEFAULT_PREFS), but no UI to adjust it
**The problem:** Width is persisted in prefs, defaulting to 272px. There's no drag handle, no settings input, no command-palette command. The pref exists in state and gets written nowhere meaningful.
**What I'm doing about it:** Adding a 4px-wide drag handle on the sidebar's right edge. `cursor: col-resize` on hover. Drag updates `sidebarWidth` in prefs, persisted. Min: 200px. Max: 400px. Double-click resets to default. Also expose "Sidebar: Reset width" in CommandPalette for keyboard-only users.
**Why this matters:** A pref that ships with no UI is a half-finished feature. Either ship the handle or remove the pref.

### 37. QuickSwitcher empty-vault state offers no path forward
**Where:** `source/src/features/quickSwitcher/QuickSwitcher.jsx:242-244` — `<div>No entries yet.</div>` flat
**The problem:** Empty centered text. No CTA, no shortcut hint, no "create one" affordance. The user opened the switcher specifically to find or create an entry, and the empty state offers neither.
**What I'm doing about it:** New empty-vault content: a centered illustration (post-item-1 icon set), heading "Your vault is empty," subheading "Start typing to capture your first entry, or hit `N` to open the full capture.", with the input still focused. Once the user types anything, the Create row appears as it does today.
**Why this matters:** The first time a new user opens the switcher with an empty vault is the moment to convert them. Flat text fails the moment.

### 38. PrivacyPanel has no at-a-glance summary
**Where:** `source/src/features/settings/PrivacyPanel.jsx` (not read line-by-line, but the pattern is clear from the test file and the other settings panels)
**The problem:** Users who care about privacy want a one-line answer: "What does this app collect?" The current panel (based on the existing tests) requires reading multiple sections to construct that answer. The charter (CLAUDE.md) is explicit: "No AI/analytics in shipped product (telemetry is the explicit charter exception, opt-in only)." That promise is the lede; bury it in section three and you waste it.
**What I'm doing about it:** Add a hero card at the top of PrivacyPanel: a green check + "JotFolio does not collect your vault content. Ever." Below: a short list of what *is* collected (opt-in telemetry events) with a link to the existing controls. The rest of the panel stays as-is, but the user can leave after reading 60 words.
**Why this matters:** Privacy is a brand promise. Brand promises belong at the top of the page, not in section three.

### 39. There is no global save-state indicator
**Where:** Nowhere in the app shell — `source/src/App.jsx:88-200` has no top-level save indicator
**The problem:** Notes save on debounced keystroke (`NoteBody.jsx:103-117`). The user has no app-level confirmation that their last action persisted. The dirty-indicator pattern in AddModal exists for the capture flow but not for the main editor or for vault operations generally.
**What I'm doing about it:** Adding a `<SaveStatusIndicator>` to `WorkspaceTopBar`. States: `saved` (faint check + "Saved" in `--t3`), `saving` (subtle spinner + "Saving"), `error` (warning dot + "Save failed — retry"). Wires to the existing toast + reportError infrastructure. Vault operations push to the same indicator. Persistence: indicator never disappears completely — even in `saved` state, the check stays visible at low opacity so users know the system is alive.
**Why this matters:** Confidence in a writing tool comes from never wondering whether your work is safe. Always-visible save state is how you earn that confidence.

### 40. CommandPalette has no "Recent" section
**Where:** `source/src/features/commandPalette/CommandPalette.jsx:60-76` — on open, query resets to empty and `filtered` is empty, so the user sees "No commands match."
**The problem:** Open palette, see "No commands match." Type a single character to see commands. The discovery cost is 0 keystrokes but the *perceived* cost is "this thing is empty." Compare with Raycast: opens to recent + top commands.
**What I'm doing about it:** When `query === ''`, show "Recent commands" section (last 5 executed, persisted to localStorage) followed by "Suggested" (curated registry entries — open settings, export vault, toggle theme). Once user types, current rank-by-query takes over. Recent list updates on `exec()`.
**Why this matters:** Empty palettes feel broken. Populated palettes feel intelligent.

### 41. Trash has no batch operations
**Where:** `source/src/features/trash/TrashView.jsx:53-77`
**The problem:** Trash items can be restored or deleted forever — one at a time. "Empty Trash" exists at the top, but there's no "Select multiple" → "Restore selected" or "Delete selected" path. The `trashBatch(item.path)` function at line 8 *already groups items by batch*, so the data layer supports it.
**What I'm doing about it:** Add checkboxes per row (left side, sized to `--jf-control-sm`). Header gets a "Select all in batch" toggle when filtered by batch. Add bulk action bar that slides up when ≥1 item selected: "Restore selected (N)" + "Delete selected (N)". Both gated by `requestConfirm`. The existing single-item Restore / Delete forever buttons stay — small selections are still common.
**Why this matters:** Cleaning up after a botched import means processing dozens of entries. One-by-one is hostile to the actual recovery use case.

### 42. Sidebar uses `aria-pressed` instead of `aria-current`
**Where:** `source/src/features/sidebar/Sidebar.jsx:57` (NavItem) — `ariaPressed={active}`
**The problem:** `aria-pressed` is for toggle buttons (on/off states). Navigation items are not toggles — selecting one navigates the app. The correct ARIA is `aria-current="page"` (or `"location"` depending on framing). Screen readers will announce nav items as "pressed/not pressed" instead of "current page."
**What I'm doing about it:** `<Pressable>` primitive grows an `ariaCurrent` prop. NavItem uses it: `ariaCurrent={active ? 'page' : undefined}`. The Tags filter buttons stay on `aria-pressed` (they ARE toggles — pressed = filter applied). The TagManageDialog trigger goes from `aria-pressed` to a regular button (it opens a dialog, not a toggle).
**Why this matters:** ARIA correctness isn't pedantry. Screen reader users navigate by these announcements. Wrong semantics is wrong navigation.

### 43. No skip-to-content link
**Where:** `source/src/App.jsx` — the rendered DOM starts with the sidebar, then the workspace
**The problem:** Keyboard or screen-reader users land on the sidebar first. To reach the editor, they have to Tab through Inbox, Search, Projects, Notes, Calendar, Constellation, Tasks, Spaces, AI Setup, every tag, Manage Tags, Settings, Trash — about 16 tab stops minimum. Standard a11y pattern: a `<a href="#main">Skip to content</a>` that's visually hidden until focused.
**What I'm doing about it:** Adding the link as the first focusable element in `App.jsx`. Visible only on `:focus-visible` (positions absolute, top-left, accent background, 8px padding). Targets `<main id="main" tabIndex={-1}>` on the workspace container. Wires to existing focus management without breaking the sidebar's tab order for users who want it.
**Why this matters:** Without a skip link, the app is functionally unusable for keyboard-only users with anything to do.

### 44. Mobile responsiveness is undocumented and partly broken
**Where:** Whole app — JotFolio is Electron-first, but the modals use `vw`/`vh` units and the build serves a web target via Vite
**The problem:** The dev server runs at `localhost:5174`; the app loads in any browser. Sidebar at 272px on a 375px-wide mobile viewport eats 73% of the screen. AddModal is `min(968px, calc(100vw - 28px))` which means on mobile it spans the viewport — but its grid layouts (`gridTemplateColumns: 'minmax(0, 1.1fr) minmax(240px, 0.9fr)'` at line 574) require ~520px to render legibly. The app neither supports mobile nor explicitly refuses it. It just degrades silently.
**What I'm doing about it:** Two paths, pick one. Path A: declare desktop-only, add a mobile splash at `<= 640px` viewport that reads "JotFolio is desktop-first. Visit on a wider screen or install the desktop app." Path B: commit to responsive — sidebar collapses to drawer below 640px, modals become full-screen sheets, the AddModal grid stacks. I recommend Path A for v0.5 (matches the Electron-first identity), with the splash including a "Try anyway" link to bypass for users who insist. Path B can be a v0.7 effort.
**Why this matters:** "Sort of works on mobile" is worse than either "works" or "doesn't work." Pick a stance.

### 45. No focus-visible feedback on inline-styled buttons
**Where:** Many. Sample: `source/src/features/add/AddModal.jsx:461,554,690,721,753,839,840,860,861,881,884,894` — most inline `<button>` elements have no explicit focus styling
**The problem:** Tokens define `--jf-focus-ring-offset` (`tokens.css:163`) and `:focus-visible` is wired globally (`tokens.css:218-221`). But the global rule sets `outline: none` and applies `box-shadow: var(--jf-focus-ring-offset)`. Inline `style={{...}}` on buttons doesn't override this — the global focus ring should still apply via the CSS rule. *However*, several buttons have inline `outline: 'none'` (e.g., AddModal close button at line 472 doesn't have it, but tab navigation across multiple buttons shows the ring inconsistently because some buttons have inline `box-shadow` that competes). The ring is technically applied but visually unreliable across the modal surface.
**What I'm doing about it:** Audit pass: any inline `style` that sets `box-shadow` on a button gets a sibling `:focus-visible` style added via a small `useFocusStyle()` hook (returns inline style based on focus-visible state from React's `useFocusVisible` polyfill or a custom `onFocus`/`onBlur` + `:focus-visible` selector via a CSS class). Where inline styling is fighting the global ring, switch to a `Button` primitive that handles focus + hover state once. This is also the right time to introduce `<Button variant="primary|quiet|danger">` to retire the four flavors of `modalButtonStyle()` scattered across files.
**Why this matters:** Keyboard navigation is the test of whether a productivity tool was built for productivity users. If the focus ring flickers or disappears across a modal, the answer is no.

---

## TALLY
- Needs Changed: 11
- Needs Edited: 20
- Needs Added: 14
- Total: 45

## WHAT I'D FIX FIRST

If I were sitting next to the engineer for one week, I'd pick **items 1, 9, and 34**, in that order.

Item 1 — replacing the Unicode geometry sidebar icons — is the single change that will most reshape the visual perception of the app. A proper icon set unifies the sidebar, the empty states, the toolbars, and (post-item-16) the trash. It's also the gateway to a real design language, because every other inline glyph hack becomes visible against a coherent baseline. Cost: a week of careful work. Payoff: every screenshot of the app suddenly looks like a real product.

Item 9 — the z-index layering bug where confirm dialogs render *under* the modals they're meant to confirm — is the highest-severity correctness issue in the audit. It's currently masked by an inline-confirm workaround (AddModal.jsx:844), but that workaround is itself a smell that's leaking into other files. Fix the z-index tokens, fix the layering, retire the workaround, and the modal architecture gets to be honest again. Cost: a day. Payoff: the whole overlay system stops being a tower of carefully-balanced hacks.

Item 34 — draft persistence in AddModal — is the change that earns the most trust per line of code. The user types, the user gets distracted, the user comes back — the draft is still there. Notion built half its reputation on never losing your work. JotFolio's charter is "plain files, your folders, no servers" — the trust contract is even stronger here, and right now it's broken at the capture boundary. Cost: half a day. Payoff: users stop hesitating before they capture, because they know nothing they type is one accidental click away from being gone.

Ship those three this week. The rest of the audit is the next two months of work, but those three are the difference between "this is a side project" and "this is a tool I rely on."
