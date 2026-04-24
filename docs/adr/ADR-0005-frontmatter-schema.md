# ADR-0005 — Frontmatter Schema per Entry Type

- **Date:** 2026-04-23
- **Status:** Proposed
- **Deciders:** Gavin (owner)

---

## Context

JotFolio's existing data model stores all entries as a JSON array in `localStorage` under the key `mgn-e`. The Electron pivot moves this to `.md` files on disk. Every entry type (note, video, podcast, article, journal, link) becomes a Markdown file with YAML frontmatter.

The frontmatter schema must:
- Preserve all data currently in the JSON model without loss.
- Be readable and writable by external tools (Git, Obsidian, any text editor) without corruption.
- Support Git-based sync without merge conflicts under normal usage.
- Enable the app to reconstruct the in-memory entry list from files alone (no separate index needed for correct operation, though a cache index is fine for performance).

This ADR defines the canonical schema. Any implementation that deviates from it (different field names, different date formats, omitting required fields) is a bug.

---

## Decision

### Base fields (all entry types)

These fields are required on every `.md` file regardless of type. A file missing any of these is malformed — the parser must log a warning and skip it rather than crash.

```yaml
---
id: 550e8400-e29b-41d4-a716-446655440000   # UUID v4, generated at creation, never changed
type: note                                  # one of: note | video | podcast | article | journal | link
title: "My Note Title"                     # string, quoted if it contains colons or special chars
tags:                                      # list of strings; empty list if none
  - reading
  - philosophy
status: active                             # free string; recommended values: active | archived | inbox
created: 2026-04-23T14:30:00.000Z         # ISO 8601, UTC, set at creation, never updated
modified: 2026-04-23T15:00:00.000Z        # ISO 8601, UTC, updated on every save
starred: false                             # boolean
---
```

### Per-type additional fields

Fields listed here are appended after the base fields in the frontmatter block. The order within frontmatter is: base fields first, then type-specific fields. This makes the file predictable and diffable.

**`note`** — no additional fields beyond base.

```yaml
---
id: ...
type: note
title: "On the nature of things"
tags: []
status: active
created: 2026-04-23T14:30:00.000Z
modified: 2026-04-23T14:30:00.000Z
starred: false
---

Body text here. [[Wiki-links]] work inline.
```

---

**`video`** — additional: `url`, `channel`, `duration`, `entry_date`

```yaml
---
id: ...
type: video
title: "Richard Feynman on curiosity"
tags:
  - physics
  - feynman
status: active
created: 2026-04-23T14:30:00.000Z
modified: 2026-04-23T14:30:00.000Z
starred: true
url: "https://www.youtube.com/watch?v=..."
channel: "Cornell University"
duration: "1:02:34"                        # HH:MM:SS string; omit if unknown
entry_date: "2026-04-20"                   # date string YYYY-MM-DD; when the user watched/logged it
---
```

---

**`podcast`** — additional: `url`, `guest`, `episode`, `highlight`, `entry_date`

```yaml
---
id: ...
type: podcast
title: "Naval on long-term thinking"
tags:
  - investing
  - mental-models
status: active
created: 2026-04-23T14:30:00.000Z
modified: 2026-04-23T14:30:00.000Z
starred: false
url: "https://podcasts.apple.com/..."
guest: "Naval Ravikant"                    # string; omit if no notable guest
episode: "112"                             # episode number or identifier; omit if unknown
highlight: "The key insight on patience"  # short highlight string; optional
entry_date: "2026-04-18"
---
```

---

**`article`** — additional: `url`, `entry_date`

```yaml
---
id: ...
type: article
title: "The Tyranny of the Rocket Equation"
tags:
  - space
  - engineering
status: active
created: 2026-04-23T14:30:00.000Z
modified: 2026-04-23T14:30:00.000Z
starred: false
url: "https://www.nasa.gov/mission_pages/station/expeditions/expedition30/tryanny.html"
entry_date: "2026-04-22"
---
```

---

**`journal`** — `entry_date` is **required** (not optional). It represents the calendar date of the journal entry, which may differ from `created` (e.g., backdated entries).

```yaml
---
id: ...
type: journal
title: "2026-04-23"                        # convention: use the date as title
tags: []
status: active
created: 2026-04-23T14:30:00.000Z
modified: 2026-04-23T14:30:00.000Z
starred: false
entry_date: "2026-04-23"                   # REQUIRED for journal type
---
```

---

**`link`** — additional: `url`

```yaml
---
id: ...
type: link
title: "Designing Data-Intensive Applications"
tags:
  - engineering
  - books
status: active
created: 2026-04-23T14:30:00.000Z
modified: 2026-04-23T14:30:00.000Z
starred: true
url: "https://dataintensive.net/"
---
```

---

### Wiki-link encoding

Wiki-links use the `[[Title]]` syntax inline in the body. They are resolved at read time by matching the `title` field of other entries in the vault.

The `links` array from the existing JSON model (resolved entry IDs) is **not written to frontmatter**. It is derived data — rebuilt by the app after every save by scanning the body for `[[...]]` patterns and resolving titles to IDs.

**Why not persist `links` in frontmatter:** If two synced devices both modify a note (adding different outgoing links), and Git merges the frontmatter, the `links` array will conflict. Derived data in frontmatter causes merge conflicts. Derived data that is recomputed from the body does not. The body merge conflict (if any) is resolved by the user; the link list is then recomputed correctly from whatever body survives.

The only cost: after a vault sync, JotFolio must re-index all affected files to rebuild the link graph. This is acceptable — the link graph index lives in memory and is rebuilt on app launch anyway.

---

### File naming

Default location: `<type>s/<slug>.md`

Examples:
- A note titled "On the nature of things" → `notes/on-the-nature-of-things.md`
- A journal entry for 2026-04-23 → `journals/2026-04-23.md`
- A video titled "Feynman on curiosity" → `videos/feynman-on-curiosity.md`

Slug rules:
1. Lowercase the title.
2. Replace all non-alphanumeric characters with hyphens.
3. Collapse consecutive hyphens into one.
4. Strip leading and trailing hyphens.
5. Truncate to 80 characters at a word boundary.

Collision resolution: if `notes/on-the-nature-of-things.md` exists, the new file becomes `notes/on-the-nature-of-things-2.md`. Increment the suffix until a free slot is found. Do not zero-pad (use `-2`, not `-02`).

**User-created folders override the default type-based bucketing.** If a user moves `notes/on-the-nature-of-things.md` to `philosophy/on-the-nature-of-things.md`, the app respects that location. The `list()` scan picks up the file wherever it is in the vault. JotFolio does not enforce or restore the default folder structure — it only uses it when creating new files.

---

### Filename → id mapping

The `id` field in frontmatter is the permanent identity of an entry. The filename is not.

This has two implications:

1. **Renaming is safe.** A user can rename `notes/old-title.md` to `notes/new-title.md` and the entry retains its ID. Any `[[Old Title]]` wiki-links in other notes will break (they resolve by title, not ID), but the entry itself is not lost.

2. **Wiki-links resolve by title, not filename.** When parsing `[[Some Title]]`, the app scans the in-memory index for an entry where `title == "Some Title"` (case-insensitive). If found, it links to that entry's ID. If the file is later renamed, the wiki-link resolves to the new title. If the title is changed in frontmatter, existing `[[Old Title]]` links break until updated.

This is the same model Obsidian uses and is the correct tradeoff for a Markdown-first app. The alternative — resolving links by filename — would make wiki-link display awkward (filenames are slugs, not natural titles).

---

### Migration from localStorage

The existing JSON shape maps to frontmatter as follows:

| JSON field | Frontmatter field | Notes |
|---|---|---|
| `id` | `id` | Direct mapping |
| `type` | `type` | Direct mapping |
| `title` | `title` | Direct mapping |
| `notes` | (body) | The body text of the Markdown file |
| `tags` | `tags` | Direct mapping; empty array if absent |
| `status` | `status` | Direct mapping |
| `date` | `created` | Treat as creation timestamp |
| `entry_date` | `entry_date` | Type-specific; omit if null |
| `starred` | `starred` | Default false if absent |
| `url` | `url` | Type-specific; omit if null |
| `channel` | `channel` | video only |
| `duration` | `duration` | video only |
| `guest` | `guest` | podcast only |
| `episode` | `episode` | podcast only |
| `highlight` | `highlight` | podcast only |
| `links` | (not stored) | Recomputed from body on load |

`modified` has no equivalent in the JSON model. Set it equal to `created` during migration.

---

## Consequences

**Gains:**
- Every entry is a self-contained, human-readable file. No proprietary format, no lock-in.
- External tools (Obsidian, VS Code, any text editor) can open, edit, and create entries without JotFolio.
- Git sync works cleanly. Frontmatter fields are stable per-file, so concurrent edits to different notes never conflict.
- The `links` derivation-not-storage rule eliminates a whole class of Git merge conflicts.

**Trade-offs:**
- The app must recompute the link graph on every vault load and after every save. For large vaults (thousands of notes), this index build could be slow. Mitigation: cache the index in `<vault>/.jotfolio/index.json` and invalidate on file mtime changes. The index cache is always reconstructible from files — it is safe to delete.
- Title-based wiki-link resolution breaks if two entries share the same title. Resolution: first match wins; log a warning when duplicates are detected. Encourage unique titles — the slug-based filename system already enforces uniqueness at the file level.
- The migration from localStorage to vault files is a one-time destructive operation (old data removed from localStorage, new files created). This must be handled carefully with user confirmation and a pre-migration export. Covered in Phase 4 tasks.

---

## Alternatives Considered

**A. Store `links` as resolved IDs in frontmatter**
Rejected. See wiki-link encoding section above. Merge conflicts on derived data are unnecessary pain.

**B. Use a separate `.json` sidecar file per entry for metadata**
Rejected. Splitting frontmatter into a sidecar file doubles the file count, breaks external tool compatibility, and adds a consistency problem (body and metadata out of sync). YAML frontmatter is the established standard for Markdown metadata.

**C. Store `modified` as a separate field vs using filesystem mtime**
We store `modified` in frontmatter, not relying on filesystem mtime. Reason: mtime is unreliable across sync tools — iCloud and Dropbox reset mtime on sync. The frontmatter `modified` field is the ground truth.

---

## Cross-references

- ADR-0002 defines VaultAdapter's `read()`/`write()` methods used to load and save these files.
- ADR-0001 defines the default folder layout (`notes/`, `videos/`, etc.) within the vault.
