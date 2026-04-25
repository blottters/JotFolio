// SlateVault Phase 7 builtin commands. Registered at App mount and
// torn down on unmount via the disposers returned from registry.register.
//
// Each builtin uses appCtx — a stable object the App passes into
// commandRegistry.execute so commands can mutate top-level state
// without importing App internals. appCtx shape:
//
//   {
//     openAdd(opts?),       // open the new-entry modal
//     setSection(name),     // 'all' | 'starred' | 'graph' | type
//     refreshVault(),       // re-read files + rebuild index
//     toggleTheme(),        // cycle dark mode
//     createDailyNote(),    // App-defined daily-note creator
//     focusSearch(),        // focus the toolbar search input
//   }

export function registerBuiltinCommands(registry, appCtx) {
  const disposers = [];

  disposers.push(registry.register({
    id: 'core:create-note',
    name: 'Create note',
    hint: 'Open the new-entry modal pre-set to a note',
    section: 'Notes',
    keywords: ['new', 'add', 'compose'],
    shortcut: 'N',
    run: () => appCtx.openAdd?.({ type: 'note' }),
  }));

  disposers.push(registry.register({
    id: 'core:create-daily-note',
    name: 'Create daily note',
    hint: "Open today's journal entry, creating it if missing",
    section: 'Notes',
    keywords: ['journal', 'today', 'daily'],
    run: () => appCtx.createDailyNote?.(),
  }));

  disposers.push(registry.register({
    id: 'core:open-graph',
    name: 'Open graph',
    hint: 'Switch to the Constellation view',
    section: 'View',
    keywords: ['constellation', 'graph', 'web'],
    run: () => appCtx.setSection?.('graph'),
  }));

  disposers.push(registry.register({
    id: 'core:open-all-entries',
    name: 'Open all entries',
    hint: 'Switch to the library view',
    section: 'View',
    keywords: ['library', 'list', 'home'],
    run: () => appCtx.setSection?.('all'),
  }));

  disposers.push(registry.register({
    id: 'core:open-starred',
    name: 'Open starred',
    hint: 'Filter library to starred entries',
    section: 'View',
    keywords: ['favorites', 'pinned'],
    run: () => appCtx.setSection?.('starred'),
  }));

  disposers.push(registry.register({
    id: 'core:toggle-theme',
    name: 'Toggle theme',
    hint: 'Cycle between light, dark, and system',
    section: 'View',
    keywords: ['dark', 'light', 'mode'],
    run: () => appCtx.toggleTheme?.(),
  }));

  disposers.push(registry.register({
    id: 'core:rebuild-metadata-cache',
    name: 'Rebuild metadata cache',
    hint: 'Re-read vault files and rebuild the index',
    section: 'Index',
    keywords: ['reindex', 'reload', 'refresh', 'cache'],
    run: () => appCtx.refreshVault?.(),
  }));

  disposers.push(registry.register({
    id: 'core:search-notes',
    name: 'Search notes',
    hint: 'Focus the library search input',
    section: 'Search',
    keywords: ['find', 'filter'],
    shortcut: '/',
    run: () => {
      appCtx.setSection?.('all');
      appCtx.focusSearch?.();
    },
  }));

  // Caller-friendly: returns a single function that disposes all builtins.
  return () => disposers.forEach(d => { try { d(); } catch { /* ignore */ } });
}
