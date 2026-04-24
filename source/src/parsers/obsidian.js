// Obsidian vault (array of File objects from <input webkitdirectory>) → Entry[].
// Per-file: H1 = title (fallback filename), body = notes, frontmatter tags + #inline tags merged.
export function parseMarkdown(text, filename = 'untitled.md') {
  let body = text
  const tags = new Set()

  // Strip + harvest frontmatter tags. Handles three forms:
  //   tags: [a, b]          (flow array)
  //   tags: #a #b           (space-separated, Obsidian-style)
  //   tags:                  (block array — each item on its own indented line)
  //     - a
  //     - b
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (fm) {
    const fmBody = fm[1]
    const lines = fmBody.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const m = line.match(/^tags:\s*(.*)$/)
      if (!m) continue
      const inline = m[1].trim()
      if (inline === '') {
        // Block-array form — collect subsequent indented `- item` lines.
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j]
          const im = next.match(/^\s+-\s+(.+)$/)
          if (!im) break
          const tag = im[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').replace(/^#/, '')
          if (tag) tags.add(tag)
        }
      } else if (inline.startsWith('[')) {
        inline.slice(1, -1).split(',').map(t => t.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')).filter(Boolean).forEach(t => tags.add(t))
      } else {
        inline.split(/\s+/).map(t => t.replace(/^#/, '')).filter(Boolean).forEach(t => tags.add(t))
      }
      break
    }
    body = body.slice(fm[0].length)
  }

  // Extract inline #tags from the body
  for (const m of body.matchAll(/(?:^|\s)#([a-z0-9][a-z0-9\-_]*)/gi)) tags.add(m[1].toLowerCase())

  // Title from first H1 or filename
  const h1 = body.match(/^#\s+(.+)$/m)
  const title = h1 ? h1[1].trim() : filename.replace(/\.md$/i, '').trim()
  const notes = h1 ? body.replace(h1[0], '').trim() : body.trim()

  return {
    id: `obs-${Math.random().toString(36).slice(2)}`,
    type: 'journal',
    title,
    url: '',
    notes,
    tags: [...tags],
    status: 'draft',
    date: new Date().toISOString(),
    starred: false,
  }
}

export async function parseVault(files) {
  if (!files || (!Array.isArray(files) && typeof files.length !== 'number')) {
    throw new Error('Obsidian: expected a list of files from a vault folder')
  }
  const out = []
  for (const f of files) {
    if (!/\.md$/i.test(f.name)) continue
    const text = await f.text()
    out.push(parseMarkdown(text, f.name))
  }
  return out
}

export async function parse(files) { return parseVault(files) }
