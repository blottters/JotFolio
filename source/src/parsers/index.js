import { parse as readwise } from './readwise.js'
import { parse as pocket } from './pocket.js'
import { parse as kindle } from './kindle.js'
import { parse as obsidian } from './obsidian.js'
import { parse as jotfolio } from './jotfolio.js'

export const SOURCES = [
  { id: 'readwise', label: 'Readwise', icon: '📚', accept: '.json', inputType: 'file', parse: readwise, help: 'Export from Readwise settings → Data → Export Highlights (JSON).' },
  { id: 'pocket', label: 'Pocket', icon: '📎', accept: '.csv', inputType: 'file', parse: pocket, help: 'Upload the ril_export.csv from your Pocket export.' },
  { id: 'kindle', label: 'Kindle', icon: '📘', accept: '.txt', inputType: 'file', parse: kindle, help: 'Connect Kindle and copy My Clippings.txt from /Kindle/documents/.' },
  { id: 'obsidian', label: 'Obsidian vault', icon: '📁', accept: '', inputType: 'directory', parse: obsidian, help: 'Select your vault folder. Only .md files are imported.' },
  { id: 'jotfolio', label: 'JotFolio JSON', icon: '📄', accept: '.json', inputType: 'file', parse: jotfolio, help: 'A prior export from this app.' },
]
