// SlateVault Phase 8 — internal plugin extension seam.
//
// Plugins are plain objects with shape:
//   { id: string, name: string, activate(ctx)?, deactivate(state)? }
//
// The host owns the lifecycle: load(plugin) registers, activate(id)
// calls plugin.activate(ctx) and remembers the returned state,
// deactivate(id) calls plugin.deactivate(state) and forgets it.
//
// The host does NOT pass a reference to App's mutable state. The host's
// caller constructs an appContext with capability-style API methods
// (registerCommand, registerPanel, toast, onOpenEntry, getEntries) and
// passes it via createPluginHost({ appContext }). Plugins can only
// touch what those methods expose. Spec acceptance: "Plugin cannot
// directly mutate private state except through provided appContext APIs."

export function createPluginHost({ appContext } = {}) {
  const plugins = new Map();   // id → plugin definition
  const active = new Map();    // id → { state, disposers: [] }
  const listeners = new Set();

  function notify() {
    listeners.forEach(fn => { try { fn(); } catch { /* listener error must not poison host */ } });
  }

  function makeContext(pluginId) {
    if (!appContext) {
      throw new Error('createPluginHost requires { appContext }');
    }
    const disposers = [];
    const wrapped = {
      pluginId,
      registerCommand(command) {
        const namespaced = {
          ...command,
          id: command.id?.includes(':') ? command.id : `${pluginId}:${command.id}`,
          section: command.section || 'Plugins',
        };
        const dispose = appContext.registerCommand(namespaced);
        disposers.push(dispose);
        return dispose;
      },
      registerPanel(panel) {
        const namespaced = {
          ...panel,
          id: panel.id?.startsWith(`${pluginId}:`) ? panel.id : `${pluginId}:${panel.id || 'panel'}`,
          pluginId,
        };
        const dispose = appContext.registerPanel(namespaced);
        disposers.push(dispose);
        return dispose;
      },
      toast(msg, type) { return appContext.toast?.(msg, type); },
      openEntry(id) { return appContext.onOpenEntry?.(id); },
      getEntries() {
        const list = appContext.getEntries?.();
        return Array.isArray(list) ? [...list] : [];
      },
    };
    Object.freeze(wrapped);
    return { wrapped, disposers };
  }

  return {
    load(plugin) {
      if (!plugin || typeof plugin !== 'object') throw new Error('plugin must be an object');
      if (!plugin.id || typeof plugin.id !== 'string') throw new Error('plugin.id required');
      if (!plugin.name || typeof plugin.name !== 'string') throw new Error('plugin.name required');
      plugins.set(plugin.id, plugin);
      notify();
    },
    unload(id) {
      if (active.has(id)) this.deactivate(id);
      const removed = plugins.delete(id);
      if (removed) notify();
      return removed;
    },
    has(id) { return plugins.has(id); },
    isActive(id) { return active.has(id); },
    list() { return [...plugins.values()]; },
    listActive() { return [...active.keys()]; },
    activate(id) {
      const plugin = plugins.get(id);
      if (!plugin) {
        const err = new Error(`Unknown plugin: ${id}`);
        err.code = 'unknown-plugin';
        throw err;
      }
      if (active.has(id)) return active.get(id).state;
      const { wrapped, disposers } = makeContext(id);
      let state;
      try {
        state = plugin.activate ? plugin.activate(wrapped) : undefined;
      } catch (err) {
        // Roll back any partial registrations from the plugin.
        disposers.forEach(d => { try { d(); } catch { /* swallow cleanup error */ } });
        throw err;
      }
      active.set(id, { state, disposers });
      notify();
      return state;
    },
    deactivate(id) {
      const entry = active.get(id);
      if (!entry) return false;
      const plugin = plugins.get(id);
      try {
        if (plugin?.deactivate) plugin.deactivate(entry.state);
      } catch { /* plugin's deactivate must not block teardown */ }
      // Always run our captured disposers — that's how we guarantee
      // commands/panels disappear even if the plugin's deactivate throws.
      entry.disposers.forEach(d => { try { d(); } catch { /* swallow cleanup error */ } });
      active.delete(id);
      notify();
      return true;
    },
    deactivateAll() {
      [...active.keys()].forEach(id => this.deactivate(id));
    },
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
