// Tiny pub/sub bus used by Plugin API `events.on()` + core app event emitters.
// Events per ADR-0003: 'vault-change', 'note-open', 'note-save', 'note-create',
// 'note-delete', 'app-ready', 'app-quit'.
// Additional internal events may exist but are not part of the plugin API.

export class EventBus {
  constructor() { this._listeners = new Map(); }

  on(event, cb) {
    if (typeof cb !== 'function') return () => {};
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(cb);
    return () => this.off(event, cb);
  }

  off(event, cb) {
    this._listeners.get(event)?.delete(cb);
  }

  emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set) return;
    // Clone to avoid mutation during iteration
    [...set].forEach(cb => {
      try { cb(payload); }
      catch (err) { console.error(`EventBus: listener for "${event}" threw`, err); }
    });
  }

  listenerCount(event) {
    return this._listeners.get(event)?.size || 0;
  }

  clear(event) {
    if (event) this._listeners.delete(event);
    else this._listeners.clear();
  }
}

// Singleton app bus. Core app + plugin API both point here so a plugin
// listening for `note-save` sees events emitted by the core editor.
export const appBus = new EventBus();
