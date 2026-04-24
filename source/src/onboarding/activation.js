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
  const [, setTick] = useState(0)
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
