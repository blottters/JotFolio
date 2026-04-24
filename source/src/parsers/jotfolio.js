// JotFolio own export → Entry[]. All-or-nothing validation.
import { ALL_ENTRY_TYPES } from '../lib/types.js'

const VALID_TYPES = new Set(ALL_ENTRY_TYPES)

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
