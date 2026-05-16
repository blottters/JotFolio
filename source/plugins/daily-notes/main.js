// Daily Notes — JotFolio official plugin.
//
// Registers one command: `daily-notes.today`.
// Running it opens today's journal note, creating one if missing.
// Naming convention: `journals/YYYY-MM-DD.md`.

api.commands.register('today', openToday, {
  name: 'Open Today\'s Journal',
  hotkey: 'Cmd+T',
  icon: '📅',
});

async function openToday() {
  const iso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const path = `journals/${iso}.md`;
  try {
    await api.vault.read(path);
    // Already exists — emit a "note-open" so the editor focuses it
  } catch {
    // Missing — create it
    const content = buildTemplate(iso);
    await api.vault.mkdir('journals');
    await api.vault.write(path, content);
  }
  // Let the editor know to open this path. Uses api.events.emit because
  // plugin code runs inside a Worker with no `window` access; the bridge
  // re-dispatches on window for app-side listeners.
  api.events.emit('open-note', { path });
}

function createEntryId() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof cryptoApi?.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

function buildTemplate(iso) {
  const [y, m, d] = iso.split('-');
  const date = new Date(iso + 'T00:00:00');
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const id = createEntryId();
  const frontmatter = [
    '---',
    `id: ${id}`,
    'type: journal',
    `title: ${weekday}, ${month} ${parseInt(d, 10)}, ${y}`,
    `entry_date: ${iso}`,
    'tags: [daily]',
    'status: draft',
    'starred: false',
    `created: ${new Date().toISOString()}`,
    `modified: ${new Date().toISOString()}`,
    '---',
    '',
    `# ${weekday}, ${month} ${parseInt(d, 10)}`,
    '',
    '## What happened',
    '',
    '## What I\'m thinking about',
    '',
    '## What\'s next',
    '',
  ];
  return frontmatter.join('\n') + '\n';
}
