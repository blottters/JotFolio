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

  it('handles block-array tags format (finding #12)', () => {
    // Before fix: Obsidian's standard multi-line tag list either dropped
    // silently (no match) or produced ['-','project'] garbage.
    const md = `---
tags:
  - project
  - research
  - deep-work
---

# Block tag test

Body.
`
    const entry = parseMarkdown(md, 'block.md')
    expect(entry.tags).toEqual(expect.arrayContaining(['project', 'research', 'deep-work']))
    expect(entry.tags).not.toContain('-')
  })

  it('ignores quoted and #-prefixed forms in block tags', () => {
    const md = `---
tags:
  - "quoted tag"
  - '#prefixed'
---

body
`
    const entry = parseMarkdown(md, 'q.md')
    expect(entry.tags).toContain('quoted tag')
    expect(entry.tags).toContain('prefixed')
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
