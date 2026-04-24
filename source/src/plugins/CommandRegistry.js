// Global command registry. Plugin commands + core app commands both live here.
// Consumed by command palette (Phase 4b / ADR wireframe 07) + menu system.

export class CommandRegistry {
  constructor() { this._commands = new Map(); }

  /**
   * @param {string} id      - Unique command id, usually `${pluginId}.${verb}`
   * @param {Function} handler
   * @param {{ name?: string, hotkey?: string, icon?: string, menu?: string, pluginId?: string }} [opts]
   */
  register(id, handler, opts = {}) {
    if (typeof id !== 'string' || !id) throw new Error('Command id required');
    if (typeof handler !== 'function') throw new Error('Command handler required');
    if (this._commands.has(id)) console.warn(`CommandRegistry: overwriting "${id}"`);
    this._commands.set(id, { id, handler, ...opts });
    return () => this.unregister(id);
  }

  unregister(id) {
    return this._commands.delete(id);
  }

  run(id, ...args) {
    const cmd = this._commands.get(id);
    if (!cmd) throw new Error(`No command registered: ${id}`);
    return cmd.handler(...args);
  }

  has(id) { return this._commands.has(id); }

  list() { return [...this._commands.values()]; }

  listByPlugin(pluginId) {
    return [...this._commands.values()].filter(c => c.pluginId === pluginId);
  }

  clearPlugin(pluginId) {
    [...this._commands.entries()].forEach(([id, cmd]) => {
      if (cmd.pluginId === pluginId) this._commands.delete(id);
    });
  }
}

export const commands = new CommandRegistry();
