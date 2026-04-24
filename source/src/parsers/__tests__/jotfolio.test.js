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

  it('accepts note entries', async () => {
    const out = await parse(JSON.stringify([
      { id: 'n1', type: 'note', title: 'Scratch note', tags: [], notes: 'body' },
    ]))
    expect(out[0].type).toBe('note')
    expect(out[0].status).toBe('backlog')
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
