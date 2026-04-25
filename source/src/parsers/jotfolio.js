// JotFolio own export → Entry[]. All-or-nothing validation.
//
// As of Phase 10, JotFolio exports may be either:
//   - a bare entries array (legacy)
//   - a `{ kind: 'jotfolio-bundle', entries, bases, canvases }` envelope
// We normalize to the entries portion via parseBundle before validating.
import { ALL_ENTRY_TYPES } from '../lib/types.js'
import { parseBundle } from '../lib/exports/bundle.js'

const VALID_TYPES = new Set(ALL_ENTRY_TYPES)

export async function parse(input) {
  let data
  if (typeof input === 'string') {
    try { data = JSON.parse(input) } catch { throw new Error('JotFolio JSON: invalid JSON') }
  } else {
    data = input
  }
  // Reject anything that isn't a legacy array or a bundle envelope so the
  // error surface stays narrow and helpful.
  const isLegacyArray = Array.isArray(data)
  const isBundle = data && typeof data === 'object' && data.kind === 'jotfolio-bundle'
  if (!isLegacyArray && !isBundle) {
    throw new Error('JotFolio JSON: expected an array of entries')
  }
  const { entries } = parseBundle(data)
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    if (!e || typeof e !== 'object') throw new Error(`JotFolio JSON: entry[${i}] is not an object`)
    if (!e.id || !e.type || !e.title) throw new Error(`JotFolio JSON: entry[${i}] missing id/type/title`)
    if (!VALID_TYPES.has(e.type)) throw new Error(`JotFolio JSON: entry[${i}] has unknown type "${e.type}"`)
  }
  return entries.map(e => ({
    ...e,
    tags: Array.isArray(e.tags) ? e.tags : [],
    notes: e.notes || '',
    status: e.status || 'backlog',
    starred: !!e.starred,
    date: e.date || new Date().toISOString(),
  }))
}
