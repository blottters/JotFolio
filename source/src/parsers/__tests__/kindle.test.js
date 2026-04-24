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
    expect(entries).toHaveLength(2)
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
