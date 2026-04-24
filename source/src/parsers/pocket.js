// Pocket CSV export → Entry[].
// Columns: title, url, time_added (unix seconds), tags (pipe-separated), status.
// Implements RFC-4180-ish CSV with quoted fields + escaped quotes.
export async function parse(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('Pocket: empty input — expected CSV with header row')
  }
  const rows = parseCSV(input)
  if (!rows.length || !rows[0]) throw new Error('Pocket: CSV has no header row')
  const header = rows[0].map(h => h.trim().toLowerCase())
  const idx = {
    title: header.indexOf('title'),
    url: header.indexOf('url'),
    time: header.indexOf('time_added'),
    tags: header.indexOf('tags'),
    status: header.indexOf('status'),
  }
  if (idx.url < 0) throw new Error('Pocket: expected "url" column in header')
  const out = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every(c => !c)) continue
    const title = row[idx.title]?.trim()
    const url = row[idx.url]?.trim()
    if (!title && !url) continue
    if (!title) continue
    const timeSec = parseInt(row[idx.time], 10)
    const tags = (row[idx.tags] || '').split('|').map(t => t.trim()).filter(Boolean)
    const rawStatus = (row[idx.status] || '').trim().toLowerCase()
    const status = rawStatus === 'archive' ? 'archived' : 'reading'
    out.push({
      id: `pk-${Math.random().toString(36).slice(2)}`,
      type: 'article',
      title,
      url: url || '',
      notes: '',
      tags,
      status,
      date: Number.isFinite(timeSec) ? new Date(timeSec * 1000).toISOString() : new Date().toISOString(),
      starred: false,
    })
  }
  return out
}

function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const push = () => { row.push(field); field = '' }
  const newline = () => { push(); rows.push(row); row = [] }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') push()
      else if (c === '\r') { if (text[i + 1] === '\n') i++; newline() }
      else if (c === '\n') newline()
      else field += c
    }
  }
  if (field !== '' || row.length) newline()
  return rows.filter(r => r.length)
}
