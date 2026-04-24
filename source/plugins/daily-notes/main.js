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
  // Let the editor know to open this path
  // (Editor component listens for 'plugin:open-note' via its own wiring; v0)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jotfolio:open-note', { detail: { path } }));
  }
}

function buildTemplate(iso) {
  const [y, m, d] = iso.split('-');
  const date = new Date(iso + 'T00:00:00');
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const frontmatter = [
    '---',
    `id: daily-${iso}`,
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
