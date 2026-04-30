# Keyword Library — Phase 1 (Rules Engine)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. **TDD discipline mandatory** — all parser/applier/storage/opt-out modules are pure functions; test-first or it doesn't ship.

**Goal:** Ship Phase 1 of the Keyword Library — user-curated `[words] → label` rules that auto-tag entries on save. Pure local, no ML, no fetch. Layer 1 of the two-layer feature shown in `docs/mockups/keyword-library.html`. Phase 2 (MiniLM) is a separate plan.

**Architecture:** Four pure-function modules in `src/lib/keywordRules/` (parser, applier, storage, opt-out tracker) → Settings UI panel → save-flow integration in `App.jsx` → "Re-scan vault" button for retroactive application. Rules live in `_jotfolio/keyword-rules.yaml` inside the user's vault. Per-entry opt-outs live in `_jotfolio/keyword-opt-outs.yaml` (separate file to avoid polluting user's markdown frontmatter).

**Tech stack:** Existing Vite 7 + React 19 + JSX + Electron. New dep: `js-yaml` (MIT, ~30KB) for YAML parsing — verify nothing equivalent already exists in JotFolio's deps before adding.

**Reference docs:**
- Mockup: `docs/mockups/keyword-library.html` (the two-layer concept; Phase 1 builds Layer 1 only)
- Charter: `slatevault_vibe_prompt.md` memory — pure-function rule, plain-text durability, derived indexes
- Slop-prevention: `feedback_ai_slop_prevention_practices.md` — 11 write-time rules
- Concrete-rules-only: `feedback_concrete_rules_only.md` — every directive must have syntax-level trigger
- Filesystem mutation verification: `feedback_filesystem_mutation_verification.md` — verify before any rm/repoint

---

## §0. Gating decisions (LOCKED earlier in session)

| # | Decision | Locked value |
|---|---|---|
| **D1** | Library storage location | `_jotfolio/keyword-rules.yaml` in vault root |
| **D2** | Match surfaces | Title + notes body + URL field (NOT frontmatter, NOT attached files for v1) |
| **D3** | Match form | Case-insensitive word-boundary regex (no fuzzy, no stemming, no NLP) |
| **D4** | Auto-apply behavior | Auto-apply on save (deterministic). User can remove auto-tag → opt-out remembered. |
| **D5** | Retroactive scan | Yes, separate "Re-scan vault" button in Settings → applies rules to all existing entries |
| **D6** | Conflict resolution | User wins. Per-entry opt-outs persist so removed auto-tags don't re-add on next save. |

NEW for Phase 1:

| # | Decision | Locked value |
|---|---|---|
| **D7** | Opt-out storage | Separate file `_jotfolio/keyword-opt-outs.yaml`, NOT frontmatter |
| **D8** | YAML parser | `js-yaml` (verify not already a dep first) |
| **D9** | Auto-apply default for NEW rules | ON. User flip in Settings if they want suggest-only mode (Phase 2 enhancement). |

---

## File map

**Created:**
- `source/src/lib/keywordRules/parseRules.js` — `parseRules(yamlString) → KeywordRules | { error }`
- `source/src/lib/keywordRules/parseRules.test.js`
- `source/src/lib/keywordRules/applyRules.js` — `applyRules(entry, rules, optOuts) → { tags: string[], links: string[], firedRules: string[] }`
- `source/src/lib/keywordRules/applyRules.test.js`
- `source/src/lib/keywordRules/rulesStorage.js` — `loadRules(vaultAdapter)` + `saveRules(vaultAdapter, rules)` — vault read/write
- `source/src/lib/keywordRules/rulesStorage.test.js`
- `source/src/lib/keywordRules/optOutTracker.js` — `loadOptOuts(vaultAdapter)`, `saveOptOuts(vaultAdapter, optOuts)`, `addOptOut(optOuts, entryId, tag)`, `getOptOutsForEntry(optOuts, entryId)`
- `source/src/lib/keywordRules/optOutTracker.test.js`
- `source/src/features/settings/KeywordRulesPanel.jsx` — Settings tab UI (rule list, add/edit/delete, "Re-scan vault" button)

**Modified:**
- `source/src/App.jsx` — save-flow integration (run applyRules after saveEntry, merge tags + links, track opt-outs)
- `source/src/features/settings/SettingsPanel.jsx` — add "Keyword Rules" tab routing to KeywordRulesPanel
- `source/package.json` — add `js-yaml` (only if not already present)
- `README.md` — document the feature in a new section
- `CLAUDE.md` (project) — note new module under tech stack

**Untouched:**
- Existing parser at `source/src/lib/frontmatter.js` — keyword rules don't change frontmatter format
- Existing index at `source/src/lib/index/vaultIndex.js` — auto-tags persist via existing entry save flow
- Constellation, Bases, Canvas, etc — keyword library doesn't reach into those

---

## Charter checks (every agent must verify)

| Check | How |
|---|---|
| Parser is a pure function | No side effects, no I/O, takes string input, returns object output |
| Applier is a pure function | Takes (entry, rules, optOuts) → returns matches. No mutation of inputs. |
| Storage uses existing vaultAdapter pattern | Match how other vault files are written (e.g. how canvases are saved) |
| YAML is plain-text durable | User can `notepad keyword-rules.yaml` and edit by hand |
| No external server calls | Zero `fetch` / `https` / network code |
| No AI defaults seeded | Empty `keyword-rules.yaml` on first run, user authors all rules |
| No emoji microcopy in UI | "Add rule" not "✨ Add rule" |
| No generic copy | "Auto-tagging on save" not "Manage your rules" |
| Word-boundary regex only | `\\bword\\b` style, no `.match()` substring |

---

## Phase 1 task ownership

**Phase 1A — Parallel pure-function modules (TDD-first):**

Each agent owns ONE module + its test. No file overlap. Build in parallel.

| # | Agent | Owns |
|---|---|---|
| A1 | Parser Patty | `parseRules.js` + `parseRules.test.js` |
| A2 | Apply Andy | `applyRules.js` + `applyRules.test.js` |
| A3 | Storage Stan | `rulesStorage.js` + `rulesStorage.test.js` |
| A4 | OptOut Olive | `optOutTracker.js` + `optOutTracker.test.js` |

**Phase 1B — Audit:**

| # | Agent | Action |
|---|---|---|
| B1 | slop-judge-code | Audit the 8 new files (4 modules + 4 tests) for code-layer slop tells |

**Phase 1C — Serial UI/integration:**

| # | Agent | Owns |
|---|---|---|
| C1 | UI Ursula | `KeywordRulesPanel.jsx` (new) |
| C2 | Wire Wally | `App.jsx` modifications (save-flow integration + Settings panel routing) |
| C3 | Backfill Bertha | "Re-scan vault" handler + button in KeywordRulesPanel |

**Phase 1D — The Enforcer (parallel review):**

| # | Agent | Action |
|---|---|---|
| D1 | testing-reality-checker | Default verdict NEEDS-WORK. Reject without overwhelming evidence. |
| D2 | superpowers:code-reviewer | Adversarial review against plan + charter |
| D3 | slop-judge-code | Re-audit final state |

---

## Module specs (each agent reads ONLY their section)

### parseRules.js (Parser Patty's spec)

**Purpose:** Parse YAML rules file into a typed object the applier can consume.

**Signature:**
```js
parseRules(yamlString: string): KeywordRules | { error: string }
```

**KeywordRules shape:**
```js
{
  rules: [
    { tag: "ai", triggers: ["GPT", "Claude", "LLM"], links: ["AI Index"] },
    { tag: "frontend", triggers: ["React", "JSX"], links: ["Frontend Stack"] },
  ]
}
```

**Input YAML format (locked):**
```yaml
ai:
  triggers: [GPT, Claude, LLM, transformer, embedding]
  links: [AI Index]

frontend:
  triggers: [React, JSX, useState, Vite]
  links: [Frontend Stack]
```

**Test cases (write FIRST, before any implementation):**
- ✅ Valid YAML w/ 3 rules → returns `{ rules: [{tag, triggers, links}, ...] }`
- ✅ Empty YAML string → returns `{ rules: [] }`
- ✅ Missing `links:` field → defaults to `[]`
- ✅ Missing `triggers:` field on a rule → that rule is dropped, error not thrown
- ✅ Invalid YAML syntax → returns `{ error: "..." }`, doesn't throw
- ✅ Tag name w/ spaces or special chars → kept verbatim, no normalization
- ✅ Triggers as a string instead of array → coerced to single-element array
- ✅ Duplicate tags in YAML → last one wins (no dedupe error)

**Slop-traps:**
- Don't add fuzzy validation ("did you mean...?") — return error, let UI handle
- Don't auto-fix bad YAML — strict parse only
- Don't seed default rules — empty input = empty output
- Don't add `console.log` for debugging — return errors via the return value

---

### applyRules.js (Apply Andy's spec)

**Purpose:** Given an entry + rules + opt-outs, return which tags + wikilinks should be auto-applied.

**Signature:**
```js
applyRules(entry, rules, optOutsForEntry): {
  tags: string[],         // tags to suggest/apply (excluding opt-outs)
  links: string[],        // wikilinks to suggest/apply (excluding opt-outs)
  firedRules: string[],   // names of rules that matched
  matchedTriggers: { [ruleName]: string[] }  // which triggers fired per rule
}
```

**Match algorithm (locked):**
1. For each rule:
   - Build a single regex: `/\\b(trigger1|trigger2|...)\\b/i` (case-insensitive, word-boundary)
   - Test against `entry.title + " " + entry.notes + " " + entry.url`
   - If any match: rule fires
2. For each fired rule:
   - If `rule.tag` not in `optOutsForEntry`, add to `tags`
   - For each link in `rule.links`: if not in `optOutsForEntry`, add to `links`
3. Dedupe outputs

**Test cases (TDD):**
- ✅ Entry body contains "GPT-4" + rule has trigger "GPT" → fires (word boundary on hyphen)
- ✅ Entry body contains "GPTRulez" → does NOT fire (word boundary check)
- ✅ Match is case-insensitive ("gpt" matches trigger "GPT")
- ✅ Match against title (entry title "About GPT" + no body)
- ✅ Match against URL (URL contains "youtube.com" + trigger "youtube")
- ✅ Multiple rules fire on same entry → all tags + links collected
- ✅ Opt-out for tag "ai" → that rule fires but tag excluded from output
- ✅ Empty rules array → returns `{ tags: [], links: [], firedRules: [] }`
- ✅ Entry w/ undefined fields (no notes) → handles gracefully, no crash
- ✅ Special regex chars in trigger ("C++", ".NET") → escaped properly, matches literal

**Slop-traps:**
- Don't fall back to substring match if word-boundary fails — explicit no-fuzzy
- Don't lowercase rule.tag in output (preserve user's case)
- Don't sort outputs by alphabet (preserve rule-firing order — it's information)
- Don't add Levenshtein / fuzzy distance as a "feature" — that's Phase 2 ML territory

---

### rulesStorage.js (Storage Stan's spec)

**Purpose:** Read/write the rules YAML file in the user's vault.

**Signature:**
```js
async loadRules(vaultAdapter): KeywordRules | { error: string }
async saveRules(vaultAdapter, rulesObject): { ok: true } | { error: string }
```

**Locked:**
- File path within vault: `_jotfolio/keyword-rules.yaml`
- Use existing `vaultAdapter` pattern (mirror how `bases` or `canvases` persist) — DO NOT bypass the adapter
- If file missing: `loadRules` returns `{ rules: [] }`, no error
- `saveRules` creates parent dir `_jotfolio/` if missing
- Serialize via `js-yaml` w/ `noRefs: true` and 2-space indent

**Test cases (TDD):**
- ✅ Load missing file → returns empty rules, no error
- ✅ Load valid file → returns parsed rules
- ✅ Load corrupt YAML → returns `{ error: "..." }`, doesn't crash app
- ✅ Save creates `_jotfolio/` dir if missing
- ✅ Save round-trip: save rules → load rules → identical object
- ✅ Save with empty rules array → writes valid YAML (or empty file)
- ✅ Save preserves trigger order from input

**Slop-traps:**
- Don't bypass vaultAdapter (charter: vault is the source of truth)
- Don't write to `localStorage` as a fallback (charter: plain-text durability)
- Don't add a "rules database" concept — file IS the database
- Don't auto-version the file (no `keyword-rules.v2.yaml` migrations in Phase 1)

---

### optOutTracker.js (OptOut Olive's spec)

**Purpose:** Track which auto-applied tags/links the user has explicitly removed per entry, so rules don't re-add them on next save.

**Signature:**
```js
async loadOptOuts(vaultAdapter): { [entryId: string]: string[] }
async saveOptOuts(vaultAdapter, optOuts): { ok: true } | { error: string }
addOptOut(optOuts, entryId, tagOrLink): updatedOptOuts  // pure function
removeOptOut(optOuts, entryId, tagOrLink): updatedOptOuts  // pure function (un-opt-out)
getOptOutsForEntry(optOuts, entryId): string[]  // pure function
```

**Locked:**
- File path: `_jotfolio/keyword-opt-outs.yaml`
- Format:
  ```yaml
  entry-id-12345:
    - ai
    - frontend
  entry-id-67890:
    - stoic
  ```
- Pure functions for `add`/`remove`/`get` (no I/O)
- `load`/`save` are async (vault I/O)

**Test cases (TDD):**
- ✅ Load missing file → returns `{}`
- ✅ Add opt-out: `addOptOut({}, "id1", "ai")` → `{ id1: ["ai"] }`
- ✅ Add same opt-out twice → no duplicate
- ✅ Remove opt-out: `removeOptOut({id1: ["ai"]}, "id1", "ai")` → `{ id1: [] }`
- ✅ Remove non-existent → no-op (idempotent)
- ✅ getOptOutsForEntry on missing entry → returns `[]`
- ✅ Save round-trip preserves data
- ✅ Pure functions don't mutate inputs (test by checking original after call)

**Slop-traps:**
- Don't store opt-outs in entry frontmatter (D7 lock — separate file)
- Don't track WHICH rule produced the opt-out (just track the tag — rules can change)
- Don't auto-prune opt-outs for deleted entries in Phase 1 (Phase 2 hygiene)
- Don't expire opt-outs on time (user opted out, that's permanent until they un-opt)

---

## Phase 1C tasks (serial)

### UI Ursula — KeywordRulesPanel.jsx

**Purpose:** Settings panel UI for viewing + editing rules + triggering re-scan.

**Locked:**
- Lives in `source/src/features/settings/KeywordRulesPanel.jsx`
- Imported into existing `SettingsPanel.jsx` as a new tab "Keyword Rules"
- Layout: list of rules at top (each row: tag chip, trigger chips, link chips, edit/delete buttons), "+ Add rule" button below, "Re-scan vault" button at bottom
- Edit/Add opens an inline form (NOT a modal) — input for tag, comma-separated triggers, comma-separated links

**Slop-traps:**
- No emoji prefixes on labels
- Copy: "Add rule" not "✨ Add rule"; "Triggers" not "Magic words"; "Apply to existing entries" not "🔮 Re-scan"
- No placeholder rules seeded
- No "Generate suggestions" button (that's Phase 2)
- Use existing JotFolio Settings styles (eyebrow uppercase headers, var(--ac) accent, etc) — mirror what's in `SettingsPanel.jsx` so a/b sections look native

### Wire Wally — App.jsx integration

**Purpose:** Hook applyRules into the save flow so new entries get auto-tagged.

**Locked changes:**
- After every `saveEntry` call: load rules + opt-outs → run applyRules → merge results into entry.tags + entry.links → save again if anything was added
- Track which tags came from rules (so removing them adds opt-out)
- Add a `_keyword_applied` provenance field to the entry record (NOT the markdown — runtime only) so the UI can show "added by rule" indicators
- Settings panel routing: add `keywordRules` tab to the existing tab switcher in SettingsPanel

**Slop-traps:**
- Don't add a "Suggesting tags..." spinner — apply is synchronous, fast
- Don't write to entry frontmatter for opt-out tracking (D7 — opt-outs file)
- Don't fire rules on raw-inbox entries if `wiki_mode` flag check applies (preserve existing feature flag behavior)

### Backfill Bertha — Re-scan vault

**Purpose:** Apply rules to ALL existing entries on demand.

**Locked:**
- Button in KeywordRulesPanel: "Apply rules to existing entries (X total)"
- On click: confirm dialog ("This will scan X entries and add tags from your rules. Continue?")
- Run applyRules on each entry, merge results, save changed entries
- Toast at end: "Updated X entries with N new tags from Y rules"
- Don't re-add opt-outs

**Slop-traps:**
- Don't auto-trigger on app launch
- Don't show a fake progress bar — for vaults < 1000 entries, sync is fine
- Don't add a "preview changes before applying" feature in Phase 1 (Phase 2 enhancement)

---

## Phase 1D — The Enforcer (review)

Three reviewers run in parallel. ALL must approve before merge.

**1. testing-reality-checker:**
- Default verdict: NEEDS WORK
- Demands visual proof + test output for every approved item
- Charter violation = automatic block
- Untested code path = automatic block
- "Looks good" approvals are forbidden

**2. superpowers:code-reviewer:**
- Adversarial review against this plan
- Checks: pure functions stay pure, no global state, no mutation, no console.log, error handling at boundaries (vault I/O), proper async/await
- Cross-references slop-prevention rules + charter
- Flags every deviation

**3. slop-judge-code:**
- Re-audits the 8 new files + 3 modified files
- Catches AI-tells the reviewers miss (utility-class sprawl, default radii, generic naming)

Aggregated findings get triaged. Anything 🔴 = mandatory fix. Anything 🟡 = fix if cheap. Anything 💭 = backlog.

---

## Acceptance criteria

- [ ] All 4 pure-function modules pass their TDD tests (write tests first, run them red, then green)
- [ ] `js-yaml` installed (or equivalent confirmed already present)
- [ ] KeywordRulesPanel renders in Settings, "Keyword Rules" tab visible
- [ ] User can add a rule via the UI, it persists to `_jotfolio/keyword-rules.yaml`
- [ ] Adding a new entry whose body contains a trigger word auto-tags it on save
- [ ] User removes auto-tag → opt-out persists in `_jotfolio/keyword-opt-outs.yaml` → next save doesn't re-add
- [ ] Re-scan button applies rules to all existing entries, reports count via toast
- [ ] Existing 369 tests still pass (no regressions)
- [ ] All 3 enforcer reviews approve
- [ ] No new external network calls
- [ ] No new heavy deps beyond `js-yaml`
- [ ] No emoji microcopy in any new UI
- [ ] No seeded default rules
- [ ] README + CLAUDE.md updated

---

## Risk + dependency notes

- **`js-yaml` may already be a dep** — verify before adding. JotFolio already parses YAML frontmatter via `lib/frontmatter.js` — if that uses `js-yaml`, just import it.
- **vaultAdapter API surface unknown to all agents** — first agent (Storage Stan) needs to read `lib/canvases.js` or similar to mirror the pattern. Don't invent a new adapter shape.
- **Phase 2 (MiniLM) builds on this** — Phase 1's apply pipeline must be designed so Phase 2 can plug in semantic suggestions alongside rule fires (not replace them).
- **Per-entry opt-out file is new vault content** — first time it's written, vault filesystem watcher might re-trigger reload. Test for infinite loop.

---

## Smallest valuable subset

If something blocks Phase 1C (UI), Phase 1A (the 4 pure-function modules) is still independently shippable as a library. UI can land in Phase 1.5.

If something blocks Phase 1D (review), the modules can ship behind a feature flag while reviews complete.

---

## Next step after Phase 1 ships

Phase 2 — MiniLM infrastructure + 3 flagships (universal semantic search, smart wikilink, similar-notes). Separate plan, separate branch.
