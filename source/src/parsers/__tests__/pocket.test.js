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
