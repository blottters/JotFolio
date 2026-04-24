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
