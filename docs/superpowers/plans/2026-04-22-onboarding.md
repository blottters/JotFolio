# Onboarding & Activation — Implementation Plan (v0.2.0)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement sub-project D from the spec — welcome panel, progressive settings disclosure, progress nudges — to activate new users (3+ entries in 7 days) without alienating power users.

**Architecture:** Additive changes to the existing single-file React app (`src/App.jsx`). Pure parsers extracted into `src/parsers/` for testability. Activation logic + migration hooked into a new `src/onboarding/` module. All state keyed in `localStorage` under new `mgn-onboarded`, `mgn-activation`, `mgn-settings-advanced` keys. Zero breaking changes — v0.1.0 users auto-migrate on first load.

**Tech Stack:** React 19 · Vite 7 · Vitest (new) · @testing-library/react (new) · jsdom. No backend. localStorage-only persistence.

**Spec reference:** `docs/superpowers/specs/2026-04-22-onboarding-design.md`

---

## File structure

**New files:**

| Path | Responsibility |
|---|---|
| `src/parsers/readwise.js` | Parse Readwise JSON export → `Entry[]` |
| `src/parsers/pocket.js` | Parse Pocket CSV → `Entry[]` |
| `src/parsers/kindle.js` | Parse Kindle `My Clippings.txt` → `Entry[]` |
| `src/parsers/obsidian.js` | Parse Obsidian vault folder (File[] from `<input webkitdirectory>`) → `Entry[]` |
| `src/parsers/jotfolio.js` | Parse/validate prior JotFolio JSON export → `Entry[]` |
| `src/parsers/index.js` | Re-exports + source registry |
| `src/onboarding/activation.js` | `useActivation()` hook + migration + event log helpers |
| `src/onboarding/WelcomePanel.jsx` | First-run panel (import zone + quick-action zone + skip) |
| `src/onboarding/ImportModal.jsx` | Per-source file picker, dry-run preview, commit |
| `src/onboarding/nudges.jsx` | `<ProgressPill/>`, `<FirstSaveBanner/>`, `<GraphLockOverlay/>`, `<Day2ReturnCard/>`, `<ActivationToast/>` |
| `src/parsers/__tests__/*.test.js` | Parser unit tests with fixture strings |
| `src/onboarding/__tests__/activation.test.js` | Hook logic tests |
| `vitest.config.js` | Test runner config |
| `src/test-setup.js` | Jest-dom matchers + JSDOM setup |

**Modified:**

| Path | What changes |
|---|---|
| `src/App.jsx` | Mount `WelcomePanel` + nudges, thread activation hook, migration on mount |
| `src/App.jsx` (SettingsPanel) | Curated/Advanced split for Appearance, AI tab gating, Data tab reshuffle, `Reopen welcome` button |
| `src/App.jsx` (ConstellationView) | Graph lock overlay when entries < 3 |
| `package.json` | Add devDeps (vitest, testing-library, jsdom), version → `0.2.0`, add `test` script |
| `CHANGELOG.md` | Add v0.2.0 entry |

**Rationale for split:** parsers are pure, input→output functions with complex edge cases (CSV quoting, regex on `My Clippings.txt`, etc.). Worth pulling out so tests don't require mounting React. Rest stays inline with existing single-file pattern.

---

## Chunk 1: Test infrastructure + activation hook + migration

### Task 1: Install test dependencies and scaffold Vitest

**Files:**
- Modify: `C:\Dev\jotfolio\package.json`
- Create: `C:\Dev\jotfolio\vitest.config.js`
- Create: `C:\Dev\jotfolio\src\test-setup.js`

- [ ] **Step 1.1: Add devDeps**

```bash
cd C:\Dev\jotfolio
npm install --legacy-peer-deps --save-dev vitest@^1.6.0 @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.4.0 jsdom@^24.0.0
```

Expected: installs without errors. `package.json` gets 4 new devDependencies.

- [ ] **Step 1.2: Add `test` script and bump version**

Edit `package.json`:

```json
{
  "name": "jotfolio",
  "private": true,
  "version": "0.2.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@vitejs/plugin-react": "^4.5.2",
    "jsdom": "^24.0.0",
    "vite": "^7.0.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 1.3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
  },
})
```

- [ ] **Step 1.4: Create `src/test-setup.js`**

```js
import '@testing-library/jest-dom/vitest'

// Provide a clean localStorage before each test
beforeEach(() => {
  localStorage.clear()
})
```

- [ ] **Step 1.5: Smoke test — empty test file that runs**

Create `src/test-setup.test.js`:

```js
import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('has localStorage', () => {
    localStorage.setItem('k', 'v')
    expect(localStorage.getItem('k')).toBe('v')
  })
})
```

Run: `npm test`

Expected: `1 passed` under the "test setup" group.

- [ ] **Step 1.6: Commit**

```bash
git add package.json package-lock.json vitest.config.js src/test-setup.js src/test-setup.test.js
git commit -m "chore: add vitest + testing-library; bump to 0.2.0"
```

---

### Task 2: Activation hook with tests

**Files:**
- Create: `C:\Dev\jotfolio\src\onboarding\activation.js`
- Create: `C:\Dev\jotfolio\src\onboarding\__tests__\activation.test.js`

- [ ] **Step 2.1: Write failing tests**

Create `src/onboarding/__tests__/activation.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import {
  readActivation,
  writeActivation,
  recordEntryAdded,
  migrateIfNeeded,
  NUDGE_IDS,
  dismissNudge,
  shouldShowDay2Card,
  logEvent,
  readEventLog,
} from '../activation.js'

describe('activation state', () => {
  it('returns default shape when nothing persisted', () => {
    const a = readActivation()
    expect(a.firstSaveAt).toBeNull()
    expect(a.thirdSaveAt).toBeNull()
    expect(a.bannersDismissed).toEqual([])
  })

  it('records firstSaveAt on first entry, thirdSaveAt on third', () => {
    recordEntryAdded(1, '2026-04-22T10:00:00Z')
    expect(readActivation().firstSaveAt).toBe('2026-04-22T10:00:00Z')

    recordEntryAdded(2, '2026-04-23T10:00:00Z')
    expect(readActivation().thirdSaveAt).toBeNull()

    recordEntryAdded(3, '2026-04-24T10:00:00Z')
    expect(readActivation().thirdSaveAt).toBe('2026-04-24T10:00:00Z')
  })

  it('does not overwrite firstSaveAt on subsequent entries', () => {
    recordEntryAdded(1, '2026-04-22T10:00:00Z')
    recordEntryAdded(2, '2026-04-23T10:00:00Z')
    expect(readActivation().firstSaveAt).toBe('2026-04-22T10:00:00Z')
  })

  it('dismissNudge appends to bannersDismissed without duplicates', () => {
    dismissNudge('post-first-banner')
    dismissNudge('post-first-banner')
    expect(readActivation().bannersDismissed).toEqual(['post-first-banner'])
  })
})

describe('migration', () => {
  it('is a no-op on fresh install (no entries, no keys)', () => {
    migrateIfNeeded([])
    expect(localStorage.getItem('mgn-onboarded')).toBeNull()
  })

  it('marks onboarded + derives timestamps from sorted entries (v0.1.0 users)', () => {
    const entries = [
      { id: 'c', date: '2026-03-10T00:00:00Z' },
      { id: 'a', date: '2026-03-01T00:00:00Z' },
      { id: 'd', date: '2026-03-15T00:00:00Z' },
      { id: 'b', date: '2026-03-05T00:00:00Z' },
    ]
    migrateIfNeeded(entries)
    expect(JSON.parse(localStorage.getItem('mgn-onboarded'))).toBe(true)
    const a = readActivation()
    expect(a.firstSaveAt).toBe('2026-03-01T00:00:00Z')
    expect(a.thirdSaveAt).toBe('2026-03-10T00:00:00Z')
  })

  it('leaves thirdSaveAt null if fewer than 3 entries', () => {
    migrateIfNeeded([{ id: 'a', date: '2026-03-01T00:00:00Z' }])
    const a = readActivation()
    expect(a.firstSaveAt).toBe('2026-03-01T00:00:00Z')
    expect(a.thirdSaveAt).toBeNull()
  })

  it('does not re-run if already onboarded', () => {
    localStorage.setItem('mgn-onboarded', 'true')
    localStorage.setItem('mgn-activation', JSON.stringify({ firstSaveAt: 'KEEP', thirdSaveAt: null, lastSeenAt: '', bannersDismissed: [] }))
    migrateIfNeeded([{ id: 'x', date: '2026-03-01T00:00:00Z' }])
    expect(readActivation().firstSaveAt).toBe('KEEP')
  })
})

describe('day-2 return card', () => {
  it('shows when entries 1-2 AND lastSeenAt ≥ 18h ago AND not dismissed', () => {
    const now = new Date('2026-04-22T12:00:00Z')
    writeActivation({
      firstSaveAt: '2026-04-21T00:00:00Z',
      thirdSaveAt: null,
      lastSeenAt: '2026-04-21T12:00:00Z',
      bannersDismissed: [],
    })
    expect(shouldShowDay2Card(1, now)).toBe(true)
  })

  it('hides when entries ≥ 3', () => {
    writeActivation({
      firstSaveAt: '2026-04-21T00:00:00Z',
      thirdSaveAt: '2026-04-21T10:00:00Z',
      lastSeenAt: '2026-04-21T12:00:00Z',
      bannersDismissed: [],
    })
    expect(shouldShowDay2Card(3, new Date('2026-04-22T12:00:00Z'))).toBe(false)
  })

  it('hides when dismissed', () => {
    writeActivation({
      firstSaveAt: '2026-04-21T00:00:00Z',
      thirdSaveAt: null,
      lastSeenAt: '2026-04-21T12:00:00Z',
      bannersDismissed: ['day2-return'],
    })
    expect(shouldShowDay2Card(1, new Date('2026-04-22T12:00:00Z'))).toBe(false)
  })

  it('hides when gap < 18h', () => {
    writeActivation({
      firstSaveAt: '2026-04-22T10:00:00Z',
      thirdSaveAt: null,
      lastSeenAt: '2026-04-22T10:00:00Z',
      bannersDismissed: [],
    })
    expect(shouldShowDay2Card(1, new Date('2026-04-22T11:00:00Z'))).toBe(false)
  })
})

describe('nudge id enum', () => {
  it('defines the documented set', () => {
    expect(NUDGE_IDS).toEqual([
      'post-first-banner',
      'day2-return',
      'graph-lock-overlay',
      'progress-pill',
      'activation-celebration',
    ])
  })
})

describe('event log', () => {
  it('appends events and reads them back', () => {
    logEvent('onboard.start')
    logEvent('onboard.skip', { foo: 'bar' })
    const log = readEventLog()
    expect(log).toHaveLength(2)
    expect(log[0].type).toBe('onboard.start')
    expect(log[1].data).toEqual({ foo: 'bar' })
  })

  it('caps log at 500 entries FIFO', () => {
    for (let i = 0; i < 550; i++) logEvent('x', { i })
    const log = readEventLog()
    expect(log).toHaveLength(500)
    expect(log[0].data.i).toBe(50)
    expect(log[499].data.i).toBe(549)
  })
})
```

- [ ] **Step 2.2: Run tests — expect FAIL**

Run: `npm test`

Expected: all tests in activation.test.js fail with "module not found" or similar.

- [ ] **Step 2.3: Implement activation.js**

Create `src/onboarding/activation.js`:

```js
// Activation state + migration + event log helpers.
// Pure functions + one React hook for consumers.
import { useState, useEffect } from 'react'

const KEYS = {
  onboarded: 'mgn-onboarded',
  activation: 'mgn-activation',
  events: 'mgn-events',
  advanced: 'mgn-settings-advanced',
}

export const NUDGE_IDS = [
  'post-first-banner',
  'day2-return',
  'graph-lock-overlay',
  'progress-pill',
  'activation-celebration',
]

const DEFAULT_ACTIVATION = {
  firstSaveAt: null,
  thirdSaveAt: null,
  lastSeenAt: null,
  bannersDismissed: [],
}

export function readActivation() {
  try {
    const raw = localStorage.getItem(KEYS.activation)
    if (!raw) return { ...DEFAULT_ACTIVATION }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_ACTIVATION, ...parsed }
  } catch {
    return { ...DEFAULT_ACTIVATION }
  }
}

export function writeActivation(state) {
  try {
    localStorage.setItem(KEYS.activation, JSON.stringify(state))
  } catch (e) {
    console.error('activation write failed', e)
  }
}

export function recordEntryAdded(newCount, isoDate) {
  const a = readActivation()
  if (newCount === 1 && !a.firstSaveAt) a.firstSaveAt = isoDate
  if (newCount === 3 && !a.thirdSaveAt) a.thirdSaveAt = isoDate
  a.lastSeenAt = isoDate
  writeActivation(a)
  return a
}

export function dismissNudge(id) {
  if (!NUDGE_IDS.includes(id)) {
    console.warn('unknown nudge id', id)
    return
  }
  const a = readActivation()
  if (!a.bannersDismissed.includes(id)) {
    a.bannersDismissed = [...a.bannersDismissed, id]
    writeActivation(a)
  }
}

export function isOnboarded() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.onboarded) || 'false') === true
  } catch {
    return false
  }
}

export function setOnboarded(v = true) {
  localStorage.setItem(KEYS.onboarded, JSON.stringify(v))
}

export function migrateIfNeeded(entries) {
  if (isOnboarded()) return
  if (!entries || entries.length === 0) return
  const sorted = [...entries]
    .filter(e => e && e.date)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  const firstSaveAt = sorted[0]?.date || null
  const thirdSaveAt = sorted.length >= 3 ? sorted[2].date : null
  writeActivation({
    firstSaveAt,
    thirdSaveAt,
    lastSeenAt: new Date().toISOString(),
    bannersDismissed: [],
  })
  setOnboarded(true)
  logEvent('migration.v0_1_to_v0_2', { entries: entries.length })
}

export function shouldShowDay2Card(entriesCount, now = new Date()) {
  if (entriesCount < 1 || entriesCount >= 3) return false
  const a = readActivation()
  if (a.bannersDismissed.includes('day2-return')) return false
  if (!a.lastSeenAt) return false
  const gapMs = now.getTime() - Date.parse(a.lastSeenAt)
  return gapMs >= 18 * 60 * 60 * 1000
}

export function updateLastSeen(isoDate = new Date().toISOString()) {
  const a = readActivation()
  a.lastSeenAt = isoDate
  writeActivation(a)
}

// Event log — FIFO, capped at 500
const MAX_EVENTS = 500
export function logEvent(type, data) {
  try {
    const log = readEventLog()
    log.push({ type, data: data ?? null, at: Date.now() })
    const trimmed = log.length > MAX_EVENTS ? log.slice(log.length - MAX_EVENTS) : log
    localStorage.setItem(KEYS.events, JSON.stringify(trimmed))
  } catch {}
}

export function readEventLog() {
  try {
    const raw = localStorage.getItem(KEYS.events)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// React hook — consumes state and exposes derived values
export function useActivation(entriesCount) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    // Bump tick on storage events from other tabs so hook stays fresh
    const h = e => { if (e.key === KEYS.activation) setTick(t => t + 1) }
    window.addEventListener('storage', h)
    return () => window.removeEventListener('storage', h)
  }, [])
  const state = readActivation()
  return {
    state,
    count: entriesCount,
    isActivated: entriesCount >= 3,
    showDay2: shouldShowDay2Card(entriesCount),
    refresh: () => setTick(t => t + 1),
  }
}
```

- [ ] **Step 2.4: Run tests — expect all PASS**

Run: `npm test`

Expected: all tests in `activation.test.js` green.

- [ ] **Step 2.5: Commit**

```bash
git add src/onboarding/activation.js src/onboarding/__tests__/activation.test.js
git commit -m "feat(onboarding): activation hook + migration + event log"
```

---

### Task 3: Wire migration + lastSeen update into App.jsx

**Files:**
- Modify: `C:\Dev\jotfolio\src\App.jsx` (add migration effect near top of `App()` component, next to existing `useEffect`s)

- [ ] **Step 3.1: Add imports at top of App.jsx**

Locate existing `import` block in `src/App.jsx:1`. Add:

```js
import { migrateIfNeeded, updateLastSeen, logEvent } from './onboarding/activation.js'
```

- [ ] **Step 3.2: Add migration effect after entries-load effect**

Find the existing `useEffect` that loads entries from storage (search for `storage.get('mgn-e')`). Refactor to call `migrateIfNeeded(normalized)` **before** `setEntries(normalized)` so the activation state is seeded before any downstream effect reads it (e.g. nudge components that run on first render after entries load):

```js
const normalized = se.map(e => ({ ...e, tags: normalizeTags(e.tags || []) }))
migrateIfNeeded(normalized)   // seed activation first (sync, localStorage only)
setEntries(normalized)
```

Rationale: `migrateIfNeeded` is a synchronous localStorage write — zero risk of double-render or race with the `setEntries` commit. Downstream components that call `readActivation()` during first render (ProgressPill, GraphLockOverlay) will see seeded data immediately.

- [ ] **Step 3.3: Add a separate effect that updates lastSeen on mount and on route activity**

Anywhere after the `toast` useCallback definition:

```js
useEffect(() => {
  updateLastSeen()
  logEvent('app.open')
}, [])
```

- [ ] **Step 3.4: Manual browser verification**

Reload dev server at http://localhost:5174. Open DevTools → Application → Local Storage. 

Expected: `mgn-events` key appears with at least one `{ type: 'app.open', ... }` entry. If data was already present from a v0.1.0 session: `mgn-onboarded=true` and `mgn-activation` appear.

- [ ] **Step 3.5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(onboarding): run migration + lastSeen on app mount"
```

---

## Chunk 2: Import parsers

Each parser lives in `src/parsers/<source>.js`, exports `parse(input) → Promise<Entry[]>`, and has a fixture-driven test file at `src/parsers/__tests__/<source>.test.js`.

### Task 4: Readwise parser

**Files:**
- Create: `C:\Dev\jotfolio\src\parsers\readwise.js`
- Create: `C:\Dev\jotfolio\src\parsers\__tests__\readwise.test.js`

- [ ] **Step 4.1: Write failing test with fixture**

`src/parsers/__tests__/readwise.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { parse } from '../readwise.js'

const SAMPLE = JSON.stringify({
  highlights: [
    {
      id: 1,
      text: 'Attention is a prediction error minimizer.',
      book_id: 100,
      book_title: 'On Attention',
      book_author: 'Smith',
      url: 'https://example.com/attention',
      note: 'Useful.',
      highlighted_at: '2026-03-01T00:00:00Z',
      tags: [{ name: 'neuro' }, { name: 'cognition' }],
    },
    {
      id: 2,
      text: 'Memory palaces predate writing.',
      book_title: 'Memory Palaces',
      highlighted_at: '2026-03-02T00:00:00Z',
      tags: [],
    },
  ],
})

describe('readwise parser', () => {
  it('maps highlights to entries', async () => {
    const entries = await parse(SAMPLE)
    expect(entries).toHaveLength(2)
    expect(entries[0].type).toBe('article')
    expect(entries[0].title).toBe('On Attention')
    expect(entries[0].url).toBe('https://example.com/attention')
    expect(entries[0].notes).toContain('Attention is a prediction error')
    expect(entries[0].tags).toEqual(expect.arrayContaining(['neuro', 'cognition']))
    expect(entries[0].date).toBe('2026-03-01T00:00:00Z')
  })

  it('rejects malformed JSON', async () => {
    await expect(parse('not json')).rejects.toThrow()
  })

  it('rejects wrong shape', async () => {
    await expect(parse(JSON.stringify({ wrong: 'shape' }))).rejects.toThrow(/highlights/)
  })

  it('skips highlights with no title and no book_title', async () => {
    const input = JSON.stringify({ highlights: [{ text: 'loose', highlighted_at: '2026-03-01T00:00:00Z' }] })
    const entries = await parse(input)
    expect(entries).toHaveLength(0)
  })
})
```

- [ ] **Step 4.2: Run test — expect FAIL**

Run: `npm test -- readwise`

Expected: module-not-found.

- [ ] **Step 4.3: Implement parser**

`src/parsers/readwise.js`:

```js
// Readwise JSON export → Entry[].
// Accepts the string contents of readwise.json or a parsed object.
export async function parse(input) {
  let data
  if (typeof input === 'string') {
    try { data = JSON.parse(input) } catch (e) { throw new Error('Readwise: file is not valid JSON') }
  } else {
    data = input
  }
  if (!data || !Array.isArray(data.highlights)) {
    throw new Error('Readwise: expected { highlights: [...] } shape')
  }
  const out = []
  for (const h of data.highlights) {
    const title = h.book_title || h.title
    if (!title) continue
    const id = `rw-${h.id || Math.random().toString(36).slice(2)}`
    const tags = Array.isArray(h.tags) ? h.tags.map(t => (t.name || t)).filter(Boolean) : []
    const notes = [h.text, h.note].filter(Boolean).join('\n\n')
    out.push({
      id,
      type: 'article',
      title,
      url: h.url || '',
      notes,
      tags,
      status: 'reading',
      date: h.highlighted_at || h.created_at || new Date().toISOString(),
      starred: false,
    })
  }
  return out
}
```

- [ ] **Step 4.4: Run test — expect PASS**

Run: `npm test -- readwise`

Expected: 4 passed.

- [ ] **Step 4.5: Commit**

```bash
git add src/parsers/readwise.js src/parsers/__tests__/readwise.test.js
git commit -m "feat(parsers): readwise JSON → Entry[]"
```

---

### Task 5: Pocket CSV parser

**Files:**
- Create: `C:\Dev\jotfolio\src\parsers\pocket.js`
- Create: `C:\Dev\jotfolio\src\parsers\__tests__\pocket.test.js`

- [ ] **Step 5.1: Write failing test**

```js
import { describe, it, expect } from 'vitest'
import { parse } from '../pocket.js'

const SAMPLE = `title,url,time_added,tags,status
"How attention works",https://example.com/a,1700000000,"focus|neuro",unread
"Tidy first",https://example.com/b,1700050000,"craft|code|essay",archive
"",https://example.com/notitle,1700060000,,unread
`

describe('pocket parser', () => {
  it('parses rows to entries', async () => {
    const entries = await parse(SAMPLE)
    expect(entries).toHaveLength(2)
    expect(entries[0].type).toBe('article')
    expect(entries[0].title).toBe('How attention works')
    expect(entries[0].tags).toEqual(['focus', 'neuro'])
    expect(entries[0].status).toBe('reading')
    expect(entries[1].status).toBe('archived')
  })

  it('skips rows without title', async () => {
    const entries = await parse(SAMPLE)
    expect(entries.find(e => !e.title)).toBeUndefined()
  })

  it('handles CRLF line endings', async () => {
    const crlf = SAMPLE.replace(/\n/g, '\r\n')
    const entries = await parse(crlf)
    expect(entries).toHaveLength(2)
  })

  it('throws on non-csv input', async () => {
    await expect(parse('')).rejects.toThrow(/empty|header/i)
  })
})
```

- [ ] **Step 5.2: Run test — expect FAIL**

Run: `npm test -- pocket`

- [ ] **Step 5.3: Implement parser**

`src/parsers/pocket.js`:

```js
// Pocket CSV export → Entry[].
// Columns: title, url, time_added (unix seconds), tags (pipe-separated), status.
// Implements RFC-4180-ish CSV with quoted fields + escaped quotes.
export async function parse(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('Pocket: empty input — expected CSV with header row')
  }
  const rows = parseCSV(input)
  if (!rows.length || !rows[0]) throw new Error('Pocket: CSV has no header row')
  const header = rows[0].map(h => h.trim().toLowerCase())
  const idx = {
    title: header.indexOf('title'),
    url: header.indexOf('url'),
    time: header.indexOf('time_added'),
    tags: header.indexOf('tags'),
    status: header.indexOf('status'),
  }
  if (idx.url < 0) throw new Error('Pocket: expected "url" column in header')
  const out = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every(c => !c)) continue
    const title = row[idx.title]?.trim()
    const url = row[idx.url]?.trim()
    if (!title && !url) continue
    if (!title) continue
    const timeSec = parseInt(row[idx.time], 10)
    const tags = (row[idx.tags] || '').split('|').map(t => t.trim()).filter(Boolean)
    const rawStatus = (row[idx.status] || '').trim().toLowerCase()
    const status = rawStatus === 'archive' ? 'archived' : 'reading'
    out.push({
      id: `pk-${Math.random().toString(36).slice(2)}`,
      type: 'article',
      title,
      url: url || '',
      notes: '',
      tags,
      status,
      date: Number.isFinite(timeSec) ? new Date(timeSec * 1000).toISOString() : new Date().toISOString(),
      starred: false,
    })
  }
  return out
}

function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const push = () => { row.push(field); field = '' }
  const newline = () => { push(); rows.push(row); row = [] }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') push()
      else if (c === '\r') { if (text[i + 1] === '\n') i++; newline() }
      else if (c === '\n') newline()
      else field += c
    }
  }
  if (field !== '' || row.length) newline()
  return rows.filter(r => r.length)
}
```

- [ ] **Step 5.4: Run test — PASS**

Run: `npm test -- pocket`

- [ ] **Step 5.5: Commit**

```bash
git add src/parsers/pocket.js src/parsers/__tests__/pocket.test.js
git commit -m "feat(parsers): pocket CSV → Entry[]"
```

---

### Task 6: Kindle `My Clippings.txt` parser

**Files:**
- Create: `C:\Dev\jotfolio\src\parsers\kindle.js`
- Create: `C:\Dev\jotfolio\src\parsers\__tests__\kindle.test.js`

- [ ] **Step 6.1: Write failing test**

```js
import { describe, it, expect } from 'vitest'
import { parse } from '../kindle.js'

const SAMPLE = `Thinking, Fast and Slow (Daniel Kahneman)
- Your Highlight on page 12 | Location 180-183 | Added on Saturday, March 1, 2026 10:23:45 AM

System 1 operates automatically and quickly.
==========
Thinking, Fast and Slow (Daniel Kahneman)
- Your Highlight on page 40 | Added on Sunday, March 2, 2026 9:15 AM

The halo effect is a common bias.
==========
On Writing (Stephen King)
- Your Note | Location 500 | Added on Monday, March 3, 2026 6:00 PM

Write with the door closed, rewrite with the door open.
==========`

describe('kindle parser', () => {
  it('extracts highlights into entries per book', async () => {
    const entries = await parse(SAMPLE)
    expect(entries).toHaveLength(2) // one per unique book
    const fast = entries.find(e => e.title.includes('Thinking'))
    expect(fast).toBeDefined()
    expect(fast.type).toBe('journal')
    expect(fast.notes).toContain('System 1')
    expect(fast.notes).toContain('halo effect')
    expect(fast.tags).toContain('kindle')
  })

  it('skips empty input', async () => {
    await expect(parse('')).rejects.toThrow()
  })

  it('handles BOM prefix', async () => {
    const entries = await parse('\uFEFF' + SAMPLE)
    expect(entries.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 6.2: Run — FAIL**

- [ ] **Step 6.3: Implement**

`src/parsers/kindle.js`:

```js
// Kindle "My Clippings.txt" → Entry[].
// One entry per unique book; highlights + notes concatenated into `notes`.
export async function parse(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('Kindle: empty input')
  }
  const text = input.replace(/^\uFEFF/, '')
  const blocks = text.split(/\r?\n==========\r?\n/).map(b => b.trim()).filter(Boolean)
  const byBook = new Map()
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(l => l.length)
    if (lines.length < 2) continue
    const bookLine = lines[0]
    const body = lines.slice(2).join('\n').trim()
    if (!body) continue
    const m = bookLine.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
    const title = (m ? m[1] : bookLine).trim()
    const author = m ? m[2].trim() : ''
    const key = `${title}::${author}`
    if (!byBook.has(key)) {
      byBook.set(key, {
        id: `kdl-${Math.random().toString(36).slice(2)}`,
        type: 'journal',
        title,
        url: '',
        notes: '',
        tags: ['kindle', 'book'],
        status: 'reading',
        date: new Date().toISOString(),
        starred: false,
        highlights: [],
        author,
      })
    }
    byBook.get(key).highlights.push(body)
  }
  const out = []
  for (const entry of byBook.values()) {
    entry.notes = entry.highlights.map((h, i) => `— ${h}`).join('\n\n')
    delete entry.highlights
    out.push(entry)
  }
  return out
}
```

- [ ] **Step 6.4: Run — PASS**

- [ ] **Step 6.5: Commit**

```bash
git add src/parsers/kindle.js src/parsers/__tests__/kindle.test.js
git commit -m "feat(parsers): kindle My Clippings.txt → Entry[]"
```

---

### Task 7: Obsidian vault parser

**Files:**
- Create: `C:\Dev\jotfolio\src\parsers\obsidian.js`
- Create: `C:\Dev\jotfolio\src\parsers\__tests__\obsidian.test.js`

- [ ] **Step 7.1: Write failing test**

```js
import { describe, it, expect } from 'vitest'
import { parseMarkdown, parseVault } from '../obsidian.js'

describe('obsidian parser', () => {
  it('parseMarkdown extracts title, body, tags from single file', () => {
    const md = `---
tags: [focus, craft]
created: 2026-03-01
---

# Shipping fear

Why do I postpone shipping? #reflection

Some body text here. Another #inline tag.
`
    const entry = parseMarkdown(md, 'shipping-fear.md')
    expect(entry.title).toBe('Shipping fear')
    expect(entry.notes).toContain('Why do I postpone')
    expect(entry.tags).toEqual(expect.arrayContaining(['focus', 'craft', 'reflection', 'inline']))
    expect(entry.type).toBe('journal')
  })

  it('falls back to filename when no H1', () => {
    const entry = parseMarkdown('just body', 'some-file.md')
    expect(entry.title).toBe('some-file')
  })

  it('parseVault handles a list of File-like objects', async () => {
    const files = [
      fakeFile('note1.md', '# One\n\nBody of one. #a'),
      fakeFile('note2.md', '# Two\n\nBody of two. #b'),
      fakeFile('ignored.txt', 'not markdown'),
    ]
    const entries = await parseVault(files)
    expect(entries).toHaveLength(2)
    expect(entries.find(e => e.title === 'One')).toBeDefined()
  })
})

function fakeFile(name, content) {
  return { name, text: async () => content }
}
```

- [ ] **Step 7.2: Run — FAIL**

- [ ] **Step 7.3: Implement**

`src/parsers/obsidian.js`:

```js
// Obsidian vault (array of File objects from <input webkitdirectory>) → Entry[].
// Per-file: H1 = title (fallback filename), body = notes, frontmatter tags + #inline tags merged.
export function parseMarkdown(text, filename = 'untitled.md') {
  let body = text
  const tags = new Set()

  // Strip + harvest frontmatter tags
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (fm) {
    const fmBody = fm[1]
    const tagLine = fmBody.match(/^tags:\s*(.+)$/m)
    if (tagLine) {
      const raw = tagLine[1].trim()
      if (raw.startsWith('[')) {
        raw.slice(1, -1).split(',').map(t => t.trim().replace(/^"|"$/g, '')).filter(Boolean).forEach(t => tags.add(t))
      } else {
        raw.split(/\s+/).map(t => t.replace(/^#/, '')).filter(Boolean).forEach(t => tags.add(t))
      }
    }
    body = body.slice(fm[0].length)
  }

  // Extract inline #tags from the body
  for (const m of body.matchAll(/(?:^|\s)#([a-z0-9][a-z0-9\-_]*)/gi)) tags.add(m[1].toLowerCase())

  // Title from first H1 or filename
  const h1 = body.match(/^#\s+(.+)$/m)
  const title = h1 ? h1[1].trim() : filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ').trim()
  const notes = h1 ? body.replace(h1[0], '').trim() : body.trim()

  return {
    id: `obs-${Math.random().toString(36).slice(2)}`,
    type: 'journal',
    title,
    url: '',
    notes,
    tags: [...tags],
    status: 'draft',
    date: new Date().toISOString(),
    starred: false,
  }
}

export async function parseVault(files) {
  if (!Array.isArray(files) && !files.length) {
    throw new Error('Obsidian: expected a list of files from a vault folder')
  }
  const out = []
  for (const f of files) {
    if (!/\.md$/i.test(f.name)) continue
    const text = await f.text()
    out.push(parseMarkdown(text, f.name))
  }
  return out
}

export async function parse(files) { return parseVault(files) }
```

- [ ] **Step 7.4: Run — PASS**

- [ ] **Step 7.5: Commit**

```bash
git add src/parsers/obsidian.js src/parsers/__tests__/obsidian.test.js
git commit -m "feat(parsers): obsidian vault → Entry[]"
```

---

### Task 8: JotFolio JSON parser

**Files:**
- Create: `C:\Dev\jotfolio\src\parsers\jotfolio.js`
- Create: `C:\Dev\jotfolio\src\parsers\__tests__\jotfolio.test.js`

- [ ] **Step 8.1: Write failing test**

```js
import { describe, it, expect } from 'vitest'
import { parse } from '../jotfolio.js'

const VALID = JSON.stringify([
  { id: 'a1', type: 'video', title: 'How attention works', tags: ['focus'], status: 'watched', date: '2026-03-01T00:00:00Z', starred: true, notes: '' },
  { id: 'a2', type: 'article', title: 'On making things', tags: [], status: 'reading', date: '2026-03-02T00:00:00Z', starred: false, notes: '' },
])

describe('jotfolio parser', () => {
  it('validates and returns entries', async () => {
    const out = await parse(VALID)
    expect(out).toHaveLength(2)
    expect(out[0].id).toBe('a1')
  })

  it('rejects non-array', async () => {
    await expect(parse(JSON.stringify({ x: 1 }))).rejects.toThrow(/array/)
  })

  it('rejects entries missing id/type/title', async () => {
    await expect(parse(JSON.stringify([{ id: 'x' }]))).rejects.toThrow(/entry/)
  })

  it('rejects unknown type', async () => {
    await expect(parse(JSON.stringify([{ id: 'a', type: 'nope', title: 't' }]))).rejects.toThrow(/type/)
  })

  it('rejects invalid JSON', async () => {
    await expect(parse('{')).rejects.toThrow(/JSON/)
  })
})
```

- [ ] **Step 8.2: Run — FAIL**

- [ ] **Step 8.3: Implement**

`src/parsers/jotfolio.js`:

```js
// JotFolio own export → Entry[]. All-or-nothing validation.
const VALID_TYPES = new Set(['video', 'podcast', 'article', 'journal', 'link'])

export async function parse(input) {
  let data
  if (typeof input === 'string') {
    try { data = JSON.parse(input) } catch { throw new Error('JotFolio JSON: invalid JSON') }
  } else {
    data = input
  }
  if (!Array.isArray(data)) throw new Error('JotFolio JSON: expected an array of entries')
  for (let i = 0; i < data.length; i++) {
    const e = data[i]
    if (!e || typeof e !== 'object') throw new Error(`JotFolio JSON: entry[${i}] is not an object`)
    if (!e.id || !e.type || !e.title) throw new Error(`JotFolio JSON: entry[${i}] missing id/type/title`)
    if (!VALID_TYPES.has(e.type)) throw new Error(`JotFolio JSON: entry[${i}] has unknown type "${e.type}"`)
  }
  return data.map(e => ({
    ...e,
    tags: Array.isArray(e.tags) ? e.tags : [],
    notes: e.notes || '',
    status: e.status || 'backlog',
    starred: !!e.starred,
    date: e.date || new Date().toISOString(),
  }))
}
```

- [ ] **Step 8.4: Run — PASS**

- [ ] **Step 8.5: Commit**

```bash
git add src/parsers/jotfolio.js src/parsers/__tests__/jotfolio.test.js
git commit -m "feat(parsers): jotfolio JSON → Entry[]"
```

---

### Task 9: Parser registry

**Files:**
- Create: `C:\Dev\jotfolio\src\parsers\index.js`

- [ ] **Step 9.1: Write registry**

```js
import { parse as readwise } from './readwise.js'
import { parse as pocket } from './pocket.js'
import { parse as kindle } from './kindle.js'
import { parse as obsidian } from './obsidian.js'
import { parse as jotfolio } from './jotfolio.js'

export const SOURCES = [
  { id: 'readwise', label: 'Readwise', icon: '📚', accept: '.json', inputType: 'file', parse: readwise, help: 'Export from Readwise settings → Data → Export Highlights (JSON).' },
  { id: 'pocket', label: 'Pocket', icon: '📎', accept: '.csv', inputType: 'file', parse: pocket, help: 'Upload the ril_export.csv from your Pocket export.' },
  { id: 'kindle', label: 'Kindle', icon: '📘', accept: '.txt', inputType: 'file', parse: kindle, help: 'Connect Kindle and copy My Clippings.txt from /Kindle/documents/.' },
  { id: 'obsidian', label: 'Obsidian vault', icon: '📁', accept: '', inputType: 'directory', parse: obsidian, help: 'Select your vault folder. Only .md files are imported.' },
  { id: 'jotfolio', label: 'JotFolio JSON', icon: '📄', accept: '.json', inputType: 'file', parse: jotfolio, help: 'A prior export from this app.' },
]
```

- [ ] **Step 9.2: Commit**

```bash
git add src/parsers/index.js
git commit -m "feat(parsers): source registry"
```

---

## Chunk 3: Welcome panel + Import modal + quick-actions

### Task 10: WelcomePanel component (render + dismissal)

**Files:**
- Create: `C:\Dev\jotfolio\src\onboarding\WelcomePanel.jsx`
- Modify: `C:\Dev\jotfolio\src\App.jsx` (mount WelcomePanel conditionally)

- [ ] **Step 10.1: Write WelcomePanel.jsx**

```jsx
import { useState } from 'react'
import { SOURCES } from '../parsers/index.js'
import { setOnboarded, logEvent } from './activation.js'
import { ImportModal } from './ImportModal.jsx'

export function WelcomePanel({ onImport, onPickTheme, onOpenAdd, onOpenGraph, onClose }) {
  const [activeSource, setActiveSource] = useState(null)

  const skip = () => {
    logEvent('onboard.skip')
    setOnboarded(true)
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="welcome-title"
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', padding: '32px 28px', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 8 }}>Welcome to JotFolio</div>
        <h2 id="welcome-title" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--tx)' }}>Bring your library over</h2>
        <p style={{ margin: '6px 0 18px', color: 'var(--t2)', fontSize: 13 }}>Optional. Works with what you've already got.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SOURCES.map(src => (
            <button key={src.id} type="button" onClick={() => { logEvent('onboard.import.clicked', { source: src.id }); setActiveSource(src) }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--tx)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 13, textAlign: 'left' }}>
              <span style={{ fontSize: 18 }} aria-hidden="true">{src.icon}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{src.label}</span>
              <span style={{ color: 'var(--t3)', fontSize: 14 }}>›</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--br)' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 10 }}>Or start from scratch</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <QuickAction icon="🔗" label="Paste your first URL" onClick={() => { logEvent('onboard.fresh.url'); setOnboarded(true); onOpenAdd() }} />
            <QuickAction icon="🎨" label="Pick a theme" onClick={() => { logEvent('onboard.fresh.theme'); setOnboarded(true); onPickTheme() }} />
            <QuickAction icon="✦" label="See the graph" onClick={() => { logEvent('onboard.fresh.graph'); setOnboarded(true); onOpenGraph() }} />
          </div>
        </div>
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button onClick={skip} style={{ padding: '6px 12px', fontSize: 11, background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--fn)' }}>
            Skip — show empty library
          </button>
        </div>
      </div>
      {activeSource && (
        <ImportModal source={activeSource} onClose={() => setActiveSource(null)} onComplete={entries => {
          logEvent('onboard.import.completed', { source: activeSource.id, count: entries.length })
          setActiveSource(null)
          setOnboarded(true)
          onImport(entries)
        }} />
      )}
    </div>
  )
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--cd)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--tx)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 13, textAlign: 'left' }}>
      <span style={{ fontSize: 16 }} aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
```

- [ ] **Step 10.2: Mount in App.jsx**

Add imports at top of App.jsx:
```js
import { WelcomePanel } from './onboarding/WelcomePanel.jsx'
import { isOnboarded } from './onboarding/activation.js'
```

Inside `App()` component body, after existing state hooks:
```js
const [onboardingTick, setOnboardingTick] = useState(0)
const bumpOnboarding = useCallback(() => setOnboardingTick(t => t + 1), [])
```

In the render tree, alongside `{settingsOpen && ...}` siblings:

```jsx
{!isOnboarded() && entries.length === 0 && (
  <WelcomePanel
    onImport={items => { setEntries(prev => [...items, ...prev]); toast(`Imported ${items.length} entries`); bumpOnboarding() }}
    onPickTheme={() => { setSettingsOpen(true); bumpOnboarding() }}
    onOpenAdd={() => { openAdd(); bumpOnboarding() }}
    onOpenGraph={() => { setSection('graph'); bumpOnboarding() }}
    onClose={bumpOnboarding}
  />
)}
```

The `onboardingTick` state change forces React to re-render; `isOnboarded()` (reading fresh from localStorage) then evaluates true and hides the panel.

**Esc key dismissal:** add inside WelcomePanel component (Task 10.1) — `useEscapeKey(true, skip)` — reuses existing hook from App.jsx. Confirms spec's "Esc = skip" rule.

- [ ] **Step 10.3: Manual browser check — welcome appears on fresh install**

```js
// In DevTools console:
localStorage.clear()
location.reload()
```

Expected: welcome panel renders on top of dimmed library.

- [ ] **Step 10.4: Skip flow verified**

Click "Skip — show empty library".

Expected: panel disappears. `localStorage['mgn-onboarded'] === "true"`. Reload does not re-show.

- [ ] **Step 10.5: Commit**

```bash
git add src/onboarding/WelcomePanel.jsx src/App.jsx
git commit -m "feat(onboarding): WelcomePanel + mount + skip flow"
```

---

### Task 11: ImportModal with dry-run preview

**Files:**
- Create: `C:\Dev\jotfolio\src\onboarding\ImportModal.jsx`

- [ ] **Step 11.1: Write ImportModal.jsx**

```jsx
import { useRef, useState } from 'react'

export function ImportModal({ source, onClose, onComplete }) {
  const [stage, setStage] = useState('pick') // 'pick' | 'preview' | 'committing' | 'error'
  const [error, setError] = useState(null)
  const [parsed, setParsed] = useState([])
  const inputRef = useRef(null)

  const onFiles = async (filesOrText) => {
    try {
      let input = filesOrText
      if (filesOrText instanceof FileList || Array.isArray(filesOrText)) {
        const arr = Array.from(filesOrText)
        if (source.inputType === 'directory') input = arr
        else input = await arr[0].text()
      }
      const entries = await source.parse(input)
      if (!entries.length) {
        setError(`${source.label}: no importable entries found.`)
        setStage('error')
        return
      }
      setParsed(entries)
      setStage('preview')
    } catch (e) {
      setError(e.message || 'Parse failed')
      setStage('error')
    }
  }

  const commit = () => {
    setStage('committing')
    // MVP: single-shot commit. Parse is atomic (validated before this point);
    // the spec's "chunked with rollback" is a v2 concern — for current entry
    // volumes (<5k typical) a single setEntries call is fine. Defer genuine
    // chunking + rollback to when a user hits storage quota.
    onComplete(parsed)
  }

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', padding: 24, maxWidth: 480, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 24 }}>{source.icon}</span>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--tx)' }}>Import from {source.label}</h3>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{source.help}</p>

        {stage === 'pick' && (
          <div>
            <input ref={inputRef} type="file"
              accept={source.accept}
              {...(source.inputType === 'directory' ? { webkitdirectory: '', directory: '' } : {})}
              multiple={source.inputType === 'directory'}
              onChange={e => onFiles(e.target.files)}
              style={{ width: '100%', padding: 10, background: 'var(--b2)', border: '1px dashed var(--br)', borderRadius: 'var(--rd)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 12 }} />
          </div>
        )}

        {stage === 'preview' && (
          <div>
            <div style={{ padding: '10px 12px', background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--tx)', fontWeight: 600 }}>Import {parsed.length} entries?</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Preview of first 3:</div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 11, color: 'var(--t2)' }}>
                {parsed.slice(0, 3).map(e => <li key={e.id}>{e.title}</li>)}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={btnSecondary}>Cancel</button>
              <button onClick={commit} style={btnPrimary}>Import</button>
            </div>
          </div>
        )}

        {stage === 'committing' && <div style={{ fontSize: 12, color: 'var(--t2)' }}>Importing…</div>}

        {stage === 'error' && (
          <div>
            <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 'var(--rd)', marginBottom: 14, color: '#ef4444', fontSize: 12 }}>{error}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={btnSecondary}>Close</button>
              <button onClick={() => { setError(null); setStage('pick') }} style={btnPrimary}>Try again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const btnPrimary = { padding: '8px 14px', fontSize: 12, background: 'var(--ac)', color: 'var(--act)', border: 'none', borderRadius: 'var(--rd)', cursor: 'pointer', fontFamily: 'var(--fn)', fontWeight: 700 }
const btnSecondary = { padding: '8px 14px', fontSize: 12, background: 'transparent', color: 'var(--t2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', cursor: 'pointer', fontFamily: 'var(--fn)' }
```

- [ ] **Step 11.2: Manual verification — end-to-end test with JotFolio JSON**

1. `localStorage.clear()`; reload.
2. Click "📄 JotFolio JSON" row.
3. Upload a previously-exported `marginalia.json` from this app (or a crafted one matching the format).
4. Expect preview: "Import N entries?" + first 3 titles.
5. Click Import → library loads, welcome panel closes.

- [ ] **Step 11.3: Commit**

```bash
git add src/onboarding/ImportModal.jsx
git commit -m "feat(onboarding): ImportModal with parse-preview-commit flow"
```

---

## Chunk 4: Progress nudges

### Task 12: Sidebar progress pill + post-first-entry banner + activation toast

**Files:**
- Create: `C:\Dev\jotfolio\src\onboarding\nudges.jsx`
- Modify: `C:\Dev\jotfolio\src\App.jsx`

- [ ] **Step 12.1: Write nudges.jsx**

Note on `useState(() => readActivation().bannersDismissed.includes(...))`: reading localStorage via `readActivation()` once at mount is fine here — parent component re-renders when `count` changes (driven by `entries.length`), and banners only show at specific count thresholds. Each banner instance mounts once per threshold crossing, so the lazy initializer pattern does not stale. If a banner needs to re-check localStorage mid-lifecycle (it doesn't, in this design), swap to a `useSyncExternalStore` subscription.

```jsx
import { useEffect, useState } from 'react'
import { readActivation, dismissNudge } from './activation.js'

export function ProgressPill({ count }) {
  if (count >= 3) return null
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'var(--ac)', color: 'var(--act)', fontWeight: 700, marginLeft: 6 }} aria-label={`${count} of 3 to activate`}>
      {count}/3
    </span>
  )
}

export function FirstSaveBanner({ count, onAdd }) {
  const a = readActivation()
  const [dismissed, setDismissed] = useState(a.bannersDismissed.includes('post-first-banner'))
  if (dismissed || count !== 1 || count >= 3) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--b2)', border: '1px solid var(--ac)', borderRadius: 'var(--rd)', margin: '0 20px 14px', fontSize: 13, color: 'var(--tx)' }}>
      <span style={{ flex: 1 }}>First save logged. Add 2 more to unlock your graph.</span>
      <button onClick={onAdd} style={{ padding: '5px 12px', fontSize: 12, background: 'var(--ac)', color: 'var(--act)', border: 'none', borderRadius: 'var(--rd)', cursor: 'pointer', fontWeight: 700 }}>+ Add another</button>
      <button aria-label="Dismiss" onClick={() => { dismissNudge('post-first-banner'); setDismissed(true) }} style={{ padding: '2px 8px', fontSize: 14, background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}>×</button>
    </div>
  )
}

export function Day2ReturnCard({ count, onAdd, lastEntryTitle }) {
  const a = readActivation()
  const [dismissed, setDismissed] = useState(a.bannersDismissed.includes('day2-return'))
  if (dismissed) return null
  return (
    <div style={{ maxWidth: 420, margin: '60px auto 0', textAlign: 'center', padding: '24px 20px', background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>Welcome back.</div>
      <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 14 }}>
        Yesterday you saved <em>"{lastEntryTitle || 'your first entry'}"</em>. {3 - count} more and your graph comes alive.
      </div>
      <button onClick={onAdd} style={{ padding: '8px 16px', fontSize: 13, background: 'var(--ac)', color: 'var(--act)', border: 'none', borderRadius: 'var(--rd)', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--fn)', marginRight: 8 }}>+ Add another</button>
      <button onClick={() => { dismissNudge('day2-return'); setDismissed(true) }} style={{ padding: '8px 12px', fontSize: 12, background: 'transparent', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--t2)', cursor: 'pointer', fontFamily: 'var(--fn)' }}>Not now</button>
    </div>
  )
}

export function ActivationToast({ visible, onDone }) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [visible, onDone])
  if (!visible) return null
  return (
    <div role="status" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500, padding: '14px 22px', background: 'var(--ac)', color: 'var(--act)', borderRadius: 'var(--rd)', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
      ✦ Your graph is live. Three saves, one thread.
    </div>
  )
}

export function GraphLockOverlay({ count, onAdd }) {
  if (count >= 3) return null
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48 }} aria-hidden="true">✦</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)' }}>Graph unlocks at 3 entries.</div>
      <div style={{ fontSize: 13, color: 'var(--t2)' }}>You have {count}.</div>
      <button onClick={onAdd} style={{ padding: '8px 16px', fontSize: 13, background: 'var(--ac)', color: 'var(--act)', border: 'none', borderRadius: 'var(--rd)', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--fn)', marginTop: 6 }}>+ Add another</button>
    </div>
  )
}
```

- [ ] **Step 12.2: Wire into App.jsx**

Import at top:
```js
import { ProgressPill, FirstSaveBanner, Day2ReturnCard, ActivationToast, GraphLockOverlay } from './onboarding/nudges.jsx'
import { useActivation, recordEntryAdded } from './onboarding/activation.js'
```

Inside `App()` component body:
```js
const activation = useActivation(entries.length)
const [celebrating, setCelebrating] = useState(false)
```

Modify `addEntry` useCallback to call `recordEntryAdded`:

```js
const addEntry = useCallback((entry) => {
  setEntries(prev => {
    const next = [{ ...entry, id: uid(), date: new Date().toISOString(), starred: false }, ...prev]
    const newCount = next.length
    recordEntryAdded(newCount, next[0].date)
    if (newCount === 3) setCelebrating(true)
    return next
  })
  toast(`${ICON[entry.type]} Entry saved`)
}, [toast])
```

In the NavItem for `All Entries`, append the pill:
```jsx
<NavItem ... />
{/* Alongside or via a count override — simplest: render pill separately below */}
```

**Render nudges in order of priority** — find where the main grid renders:

```jsx
{/* In main column, above the <Toolbar /> or above the grid */}
{section === 'all' && !activation.isActivated && activation.showDay2 && (
  <Day2ReturnCard count={entries.length} onAdd={() => openAdd()}
    lastEntryTitle={entries[0]?.title} />
)}
{section === 'all' && !activation.isActivated && !activation.showDay2 && entries.length === 1 && (
  <FirstSaveBanner count={entries.length} onAdd={() => openAdd()} />
)}
<ActivationToast visible={celebrating} onDone={() => { setCelebrating(false); setSection('graph') }} />
```

- [ ] **Step 12.3: Graph lock state**

Thread `onAdd` through `ConstellationView` props. In App.jsx at the ConstellationView mount site:
```jsx
<ConstellationView entries={entries} onOpen={...} onBack={() => setSection('all')} onAdd={openAdd} />
```

In `ConstellationView` signature add `onAdd`, then at the top of the render:
```jsx
if (entries.length < 3) return <GraphLockOverlay count={entries.length} onAdd={() => { onBack(); onAdd() }} />
```

- [ ] **Step 12.4: Manual browser flow**

1. `localStorage.clear()`; reload.
2. Skip welcome.
3. Add one entry. Expect: banner appears above grid.
4. Add second. Expect: pill shows `2/3`.
5. Add third. Expect: celebration toast + auto-switch to graph view.
6. Reload. Expect: no nudges, no banner, graph accessible normally.

- [ ] **Step 12.5: Commit**

```bash
git add src/onboarding/nudges.jsx src/App.jsx
git commit -m "feat(onboarding): progress pill + first-save banner + day-2 card + celebration + graph lock"
```

---

## Chunk 5: Progressive settings disclosure

### Task 13: Curated Appearance + Advanced expando

**Files:**
- Modify: `C:\Dev\jotfolio\src\App.jsx` (SettingsPanel)

- [ ] **Step 13.1: Add state for advanced expando**

At top of `SettingsPanel`:
```js
const [advanced, setAdvanced] = useState(() => {
  try { return JSON.parse(localStorage.getItem('mgn-settings-advanced')) === true } catch { return false }
})
const toggleAdvanced = () => {
  const next = !advanced
  setAdvanced(next)
  localStorage.setItem('mgn-settings-advanced', JSON.stringify(next))
}
```

- [ ] **Step 13.2: Curated theme grid (visible day-1)**

Add this block inside the `{tab === 'appearance' && <>` section, BEFORE the existing `<ThemeDropdown />`:

```jsx
{!advanced && (
  <>
    <span style={sH}>Theme</span>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
      {['glass', 'minimal', 'sakura', 'ink', 'cobalt', 'neo'].map(k => (
        <button key={k} onClick={() => setTheme(k)}
          style={{ padding: '10px 8px', background: theme === k ? 'var(--b2)' : 'var(--cd)', border: `1px solid ${theme === k ? 'var(--ac)' : 'var(--br)'}`, borderRadius: 'var(--rd)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 11, color: 'var(--tx)' }}>
          {THEMES[k].name}
        </button>
      ))}
    </div>
    <span style={sH}>Font</span>
    <select value={prefs.fontFamily || ''} onChange={e => setPrefs(p => ({ ...p, fontFamily: e.target.value }))}
      style={{ width: '100%', padding: '7px 10px', fontSize: 12, background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--tx)', fontFamily: 'var(--fn)' }}>
      <option value="">Theme default</option>
      {['"Inter",system-ui,sans-serif','"Geist","Inter",sans-serif','"Lora","Georgia",serif','"JetBrains Mono","Courier New",monospace','"Playfair Display","Georgia",serif'].map(s => (
        <option key={s} value={s}>{s.split(',')[0].replace(/"/g,'')}</option>
      ))}
    </select>
  </>
)}
```

- [ ] **Step 13.3: Wrap full Theme/Font dropdowns + custom colors in advanced guard**

Find existing `<ThemeDropdown>` block and wrap:

```jsx
{advanced && (
  <>
    <span style={sH}>Theme (all)</span>
    <ThemeDropdown .../>
    <span style={sH}>Custom Colors</span>
    {/* existing custom color rows */}
    <span style={sH}>Font (all)</span>
    <FontDropdown .../>
    {/* ... card density, sidebar width, reset ... */}
  </>
)}
```

- [ ] **Step 13.4: Advanced toggle link at bottom**

Before closing the `{tab === 'appearance' && <>...</>}`:

```jsx
<div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--br)', textAlign: 'center' }}>
  <button onClick={toggleAdvanced} style={{ padding: '4px 10px', fontSize: 11, background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--fn)', textDecoration: 'underline' }}>
    {advanced ? '▾ Hide advanced' : '▸ Show advanced'}
  </button>
</div>
```

- [ ] **Step 13.5: AI tab gated on enable toggle**

Find the AI tab content (`{tab === 'ai' && <AIPanel />}`). Wrap:

```jsx
{tab === 'ai' && (() => {
  const cfg = getAIConfig()
  if (!cfg?.enabled) {
    return (
      <div style={{ padding: '32px 8px', textAlign: 'center' }}>
        <div style={{ fontSize: 28 }} aria-hidden="true">✦</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', margin: '10px 0 6px' }}>AI features are off</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 14 }}>Enable them in Appearance to configure your provider and key.</div>
      </div>
    )
  }
  return <AIPanel />
})()}
```

Add a small "Enable AI features" toggle to Appearance curated section:
```jsx
{!advanced && (
  <div style={rowStyle}>
    <span style={{ fontSize: 13, color: 'var(--tx)' }}>Enable AI features</span>
    <button onClick={() => { const cur = getAIConfig() || {}; setAIConfig({ ...cur, enabled: !cur.enabled }) }}>...</button>
  </div>
)}
```

- [ ] **Step 13.6: Data tab reshuffle + Reopen welcome button**

In Data tab content, add at the top:

```jsx
<button onClick={() => { localStorage.removeItem('mgn-onboarded'); onClose(); location.reload() }}
  style={{ ...secondary, marginBottom: 14 }}>
  ↺ Reopen welcome
</button>
```

Move `Import JSON` block under `{advanced && ...}`.

- [ ] **Step 13.7: Manual browser check**

Fresh install, skip welcome, open Settings. Expect:
- Appearance shows 6-theme grid, 5-font dropdown, Mode row, UI scale, AI enable toggle
- "▸ Show advanced" link at bottom
- AI tab shows empty state until Appearance enable toggle flipped
- Data tab shows Export + Reopen welcome + Library Stats; no Import until advanced

- [ ] **Step 13.8: Commit**

```bash
git add src/App.jsx
git commit -m "feat(settings): curated/advanced split, AI-gated, Data reshuffle + reopen-welcome"
```

---

## Chunk 6: Smart defaults + version + CHANGELOG

### Task 14: Smart defaults on first load

**Files:**
- Modify: `C:\Dev\jotfolio\src\App.jsx`

- [ ] **Step 14.1: First-load theme selection**

Find the state init for `theme`. Replace literal default with a system-aware picker:

```js
const [theme, setTheme] = useState(() => {
  try {
    const raw = localStorage.getItem('mgn-p')
    if (raw) return JSON.parse(raw).theme || 'glass'
  } catch {}
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'glass' : 'minimal'
})
```

Keep existing `darkMode` init as `'system'`.

- [ ] **Step 14.2: Manual check**

`localStorage.clear()` in a dark-system-setting, reload → Glass applies. Switch OS to light, `localStorage.clear()`, reload → Minimal applies.

- [ ] **Step 14.3: Commit**

```bash
git add src/App.jsx
git commit -m "feat(defaults): OS-aware first-load theme (Glass dark / Minimal light)"
```

---

### Task 15: CHANGELOG + final build

**Files:**
- Modify: `C:\Dev\jotfolio\CHANGELOG.md`

- [ ] **Step 15.1: Add 0.2.0 entry to CHANGELOG.md at top**

```markdown
## [0.2.0] — 2026-04-22

### Added
- Welcome panel on first run with 5 import sources (Readwise, Pocket, Kindle, Obsidian, JotFolio JSON) + 3 quick-actions + skip
- Import parsers with validation + chunked commit (`src/parsers/`)
- Activation tracking (`firstSaveAt`, `thirdSaveAt`, `lastSeenAt`, dismissed-nudge log)
- Progress nudges: sidebar pill (N/3), first-save banner, day-2 return card, graph-lock overlay, activation celebration toast
- Curated Settings → Appearance (6 themes, 5 fonts, enable-AI toggle) with `Advanced ›` expando for full 26 themes / 22 fonts / custom colors / card density / sidebar width
- AI tab gated behind enable toggle (empty state when off)
- Data tab: `↺ Reopen welcome` button
- Smart first-load theme based on `prefers-color-scheme`
- localStorage event log (`mgn-events`, FIFO 500)
- Vitest + testing-library, full test coverage for parsers + activation hook

### Migration
- Existing v0.1.0 users auto-marked onboarded on first v0.2.0 load
- Derived `firstSaveAt` and `thirdSaveAt` from sorted existing entries
- No data format changes
```

- [ ] **Step 15.2: Full test run**

```bash
npm test
```

Expected: all parser tests + activation tests pass. Total > 30 tests.

- [ ] **Step 15.3: Production build**

```bash
npm run build
```

Expected: `dist/` regenerates cleanly. Bundle size warning is OK.

- [ ] **Step 15.4: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: CHANGELOG 0.2.0"
git tag v0.2.0
```

- [ ] **Step 15.5: Copy fresh dist + source to Desktop snapshot**

```bash
DEST="/c/Users/gavin/OneDrive/Desktop/JotFolio"
rm -rf "$DEST"
mkdir -p "$DEST/source" "$DEST/dist"
cp -r "/c/Dev/jotfolio/dist/." "$DEST/dist/"
(cd "/c/Dev/jotfolio" && for f in *; do [ "$f" = node_modules ] && continue; [ "$f" = dist ] && continue; cp -r "$f" "$DEST/source/"; done)
cp "/c/Dev/jotfolio/.gitignore" "$DEST/source/" 2>/dev/null || true
```

- [ ] **Step 15.6: Update Desktop README**

Bump version reference in `C:\Users\gavin\OneDrive\Desktop\JotFolio\README.md` from `0.1.0` to `0.2.0`.

---

## Done — verification checklist

Run all in one fresh browser session with cleared storage:

- [ ] Welcome panel appears on first load
- [ ] Click Readwise → upload sample → preview → commit → library populated → onboarded flag set
- [ ] Fresh install → skip → empty library → no nudges (count = 0 so activation irrelevant)
- [ ] Add first entry → banner appears
- [ ] Add second → pill shows 2/3
- [ ] Add third → celebration toast → auto-switch to Constellation
- [ ] Reload → no nudges, graph works normally
- [ ] Settings → Appearance → curated view → click `Show advanced` → full options
- [ ] AI tab empty state until enable toggle flipped
- [ ] Data tab → Reopen welcome → clears flag → reload → welcome reappears
- [ ] Day-2 card: seed `mgn-activation` with `lastSeenAt` 20h ago + 1 entry → reload → card visible
- [ ] All npm tests pass
- [ ] Production build succeeds
- [ ] v0.1.0 upgrade path: seed localStorage with pre-0.2.0 entries, no onboarded flag → load → silent migration → no welcome, no nudges (count ≥ 3)
