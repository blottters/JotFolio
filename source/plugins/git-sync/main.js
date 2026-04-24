// Git Sync — stub implementation.
//
// Real git operations require shell access (spawning `git` subprocess) which
// is only reachable from Electron's main process. Phase 4b ships the stub
// that logs intent; Phase 4b.5 will wire a `git:*` IPC channel and make this
// plugin actually push to origin.
//
// Commands:
//   git-sync.now          — log "sync intent" to .jotfolio/sync.log
//   git-sync.configure    — open a settings prompt (logs intent)

api.commands.register('now', async () => {
  const stamp = new Date().toISOString();
  const line = `${stamp}  sync-intent (stub — Electron needed to actually commit/push)\n`;
  try {
    let existing = '';
    try { existing = await api.vault.read('.jotfolio/sync.log'); } catch { /* new file */ }
    await api.vault.mkdir('.jotfolio');
    await api.vault.write('.jotfolio/sync.log', existing + line);
  } catch (err) {
    console.error('git-sync: failed to append sync.log', err);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jotfolio:toast', {
      detail: { msg: 'Git sync queued (stub — real sync requires desktop).', type: 'info' },
    }));
  }
}, {
  name: 'Sync Now',
  hotkey: 'Cmd+S',
  icon: '🔁',
});

api.commands.register('configure', async () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jotfolio:toast', {
      detail: { msg: 'Git Sync configuration UI lands in Phase 4b.5.', type: 'info' },
    }));
  }
}, {
  name: 'Configure Remote',
  icon: '⚙',
});
