// Readwise JSON export → Entry[].
// Accepts the string contents of readwise.json or a parsed object.
export async function parse(input) {
  let data
  if (typeof input === 'string') {
    try { data = JSON.parse(input) } catch (e) { throw new Error('Readwise: file is not valid JSON') }
  } else {
    data = input
  }
  if (!data || !Array.isArray(data.highlights)) {
    throw new Error('Readwise: expected { highlights: [...] } shape')
  }
  const out = []
  for (const h of data.highlights) {
    const title = h.book_title || h.title
    if (!title) continue
    const id = `rw-${h.id || Math.random().toString(36).slice(2)}`
    const tags = Array.isArray(h.tags) ? h.tags.map(t => (t.name || t)).filter(Boolean) : []
    const notes = [h.text, h.note].filter(Boolean).join('\n\n')
    out.push({
      id,
      type: 'article',
      title,
      url: h.url || '',
      notes,
      tags,
      status: 'reading',
      date: h.highlighted_at || h.created_at || new Date().toISOString(),
      starred: false,
    })
  }
  return out
}
