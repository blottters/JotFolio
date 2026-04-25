// Command registry — pure module backing the SlateVault Phase 7 command
// palette. Commands are objects with stable shape:
//
//   {
//     id: string,            // unique stable id, e.g. "core:create-note"
//     name: string,          // human label shown in the palette
//     hint?: string,         // optional one-line description
//     section?: string,      // grouping label, e.g. "Notes", "View"
//     keywords?: string[],   // extra search tokens for fuzzy match
//     shortcut?: string,     // display-only keybinding hint, e.g. "Cmd+P"
//     run: (ctx) => Promise<void> | void
//   }
//
// The registry is a class so callers can hold an instance per app shell
// rather than mutating a module singleton — that matches the Phase 8
// plugin-system spec, where each plugin gets a sandboxed command list it
// can roll back via `unregister` on deactivate.

export function createCommandRegistry() {
  const commands = new Map();
  const listeners = new Set();

  function notify() {
    listeners.forEach(fn => {
      try { fn(); } catch { /* listener errors must not poison registry */ }
    });
  }

  return {
    register(command) {
      if (!command || typeof command !== 'object') throw new Error('command must be an object');
      if (!command.id || typeof command.id !== 'string') throw new Error('command.id required');
      if (!command.name || typeof command.name !== 'string') throw new Error('command.name required');
      if (typeof command.run !== 'function') throw new Error('command.run must be a function');
      const normalized = {
        id: command.id,
        name: command.name,
        hint: command.hint,
        section: command.section || 'General',
        keywords: Array.isArray(command.keywords) ? [...command.keywords] : [],
        shortcut: command.shortcut,
        run: command.run,
      };
      commands.set(command.id, normalized);
      notify();
      // Caller-friendly disposer so plugins can unregister with a single
      // function reference held from activate().
      return () => {
        if (commands.get(command.id) === normalized) {
          commands.delete(command.id);
          notify();
        }
      };
    },
    unregister(id) {
      const removed = commands.delete(id);
      if (removed) notify();
      return removed;
    },
    has(id) { return commands.has(id); },
    get(id) { return commands.get(id); },
    list() { return [...commands.values()]; },
    clear() {
      if (!commands.size) return;
      commands.clear();
      notify();
    },
    async execute(id, ctx) {
      const cmd = commands.get(id);
      if (!cmd) {
        // Phase 7 acceptance test: "unknown commands fail safely". Throw
        // a typed error so the UI can toast without falling over.
        const err = new Error(`Unknown command: ${id}`);
        err.code = 'unknown-command';
        throw err;
      }
      return cmd.run(ctx);
    },
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// Pure fuzzy-rank function exported separately so the palette UI can
// reuse the same scoring logic as any test that wants to verify ordering.
export function rankCommands(commands, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) {
    return [...commands].sort((a, b) =>
      (a.section || '').localeCompare(b.section || '') ||
      a.name.localeCompare(b.name)
    );
  }
  const scored = commands.map(cmd => {
    const name = cmd.name.toLowerCase();
    const hint = (cmd.hint || '').toLowerCase();
    const kw = (cmd.keywords || []).map(k => String(k).toLowerCase());
    let score = 0;
    if (name === q) score += 1000;
    else if (name.startsWith(q)) score += 700;
    else if (name.includes(q)) score += 500;
    if (kw.some(k => k === q)) score += 600;
    else if (kw.some(k => k.startsWith(q))) score += 400;
    else if (kw.some(k => k.includes(q))) score += 200;
    if (hint.includes(q)) score += 100;
    // Subsequence match: each query char appears in order in the name
    if (score === 0 && subseqMatch(name, q)) score += 50;
    return { cmd, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.cmd.name.localeCompare(b.cmd.name))
    .map(s => s.cmd);
}

function subseqMatch(haystack, needle) {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return false;
}
