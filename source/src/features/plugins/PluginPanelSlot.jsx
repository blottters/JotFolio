import { useState, useEffect } from "react";

// Renders all currently-registered plugin panels in the right sidebar.
// Subscribes to the panelStore so panels appear/disappear when plugins
// activate or deactivate without an App re-render.

export function PluginPanelSlot({ panelStore, entries }) {
  const [panels, setPanels] = useState(() => panelStore?.list?.() || []);

  useEffect(() => {
    if (!panelStore?.subscribe) return undefined;
    const refresh = () => setPanels(panelStore.list());
    refresh();
    return panelStore.subscribe(refresh);
  }, [panelStore]);

  if (!panels.length) return null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '6px 0', borderTop: '1px solid var(--br)',
    }}>
      {panels.map(panel => (
        <div key={panel.id} style={{
          background: 'var(--b2)', border: '1px solid var(--br)',
          borderRadius: 'var(--rd)', overflow: 'hidden',
        }}>
          {panel.render?.({ entries }) ?? null}
        </div>
      ))}
    </div>
  );
}

// Tiny in-memory panel registry. Same subscribe/unsubscribe shape as
// the command registry so the plugin host can point at it without
// needing custom wiring.
export function createPanelStore() {
  const panels = new Map();
  const listeners = new Set();
  function notify() {
    listeners.forEach(fn => { try { fn(); } catch { /* ignore */ } });
  }
  return {
    register(panel) {
      if (!panel || typeof panel !== 'object') throw new Error('panel must be an object');
      if (!panel.id) throw new Error('panel.id required');
      panels.set(panel.id, panel);
      notify();
      return () => {
        if (panels.get(panel.id) === panel) {
          panels.delete(panel.id);
          notify();
        }
      };
    },
    list() { return [...panels.values()]; },
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
