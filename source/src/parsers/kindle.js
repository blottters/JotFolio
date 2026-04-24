// Kindle "My Clippings.txt" → Entry[].
// One entry per unique book; highlights + notes concatenated into `notes`.
export async function parse(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('Kindle: empty input')
  }
  const text = input.replace(/^\uFEFF/, '')
  const blocks = text.split(/\r?\n==========\r?\n?/).map(b => b.trim()).filter(Boolean)
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
    entry.notes = entry.highlights.map(h => `— ${h}`).join('\n\n')
    delete entry.highlights
    out.push(entry)
  }
  return out
}
