import { describe, it, expect } from 'vitest'
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
  it('shows when entries 1-2 AND lastSeenAt >= 18h ago AND not dismissed', () => {
    const now = new Date('2026-04-22T12:00:00Z')
    writeActivation({
      firstSaveAt: '2026-04-21T00:00:00Z',
      thirdSaveAt: null,
      lastSeenAt: '2026-04-21T12:00:00Z',
      bannersDismissed: [],
    })
    expect(shouldShowDay2Card(1, now)).toBe(true)
  })

  it('hides when entries >= 3', () => {
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
