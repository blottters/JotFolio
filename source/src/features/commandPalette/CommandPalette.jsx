import { useState, useEffect, useMemo, useRef, useId } from "react";
import { rankCommands } from '../../lib/command/commandRegistry.js';

// Command palette UI. Opens as a centered modal, focuses the search
// input, fuzzy-ranks against the registry, executes on Enter, closes
// on Escape. Strictly a render-only component — registry mutations live
// in the registry itself; commands fire via registry.execute(id, ctx)
// inside onExecute so the App owns the context object.

export function CommandPalette({ open, registry, onClose, onExecute, onError }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [version, setVersion] = useState(0); // re-render when registry changes
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const inputId = useId();

  // Re-render when registry contents change — picks up plugin commands
  // registered after the palette mounts.
  useEffect(() => {
    if (!registry?.subscribe) return undefined;
    return registry.subscribe(() => setVersion(v => v + 1));
  }, [registry]);

  // Reset state on each open. Not on every render — the user's
  // half-typed query should survive registry change events.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      // Defer to next tick so the input exists in the DOM.
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const all = useMemo(() => (registry?.list?.() || []), [registry, version]);
  const filtered = useMemo(() => rankCommands(all, query), [all, query]);

  // Clamp active index whenever the filtered list changes.
  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIdx]);

  if (!open) return null;

  const exec = async (cmd) => {
    if (!cmd) return;
    try {
      await onExecute?.(cmd.id);
    } catch (err) {
      onError?.(err, cmd);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose?.(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(filtered.length - 1, i + 1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)); return; }
    if (e.key === 'Enter')     { e.preventDefault(); exec(filtered[activeIdx]); return; }
  };

  // Group filtered commands by section so the rendered list mirrors the
  // visual hierarchy you'd expect from a real palette.
  const grouped = filtered.reduce((acc, cmd) => {
    const s = cmd.section || 'General';
    if (!acc[s]) acc[s] = [];
    acc[s].push(cmd);
    return acc;
  }, {});
  const sectionOrder = Object.keys(grouped);

  let runningIdx = -1;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={inputId}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.42)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 96,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div style={{
        width: 'min(560px, 92vw)', maxHeight: 'min(60vh, 480px)',
        background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 8,
        boxShadow: '0 24px 64px rgba(0,0,0,0.32)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <input id={inputId} ref={inputRef}
          value={query} onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={handleKey}
          placeholder="Type a command…"
          aria-label="Command palette search"
          style={{
            padding: '14px 16px', fontSize: 15, fontFamily: 'var(--fn)',
            border: 'none', borderBottom: '1px solid var(--br)', background: 'transparent',
            color: 'var(--tx)', outline: 'none',
          }}/>
        <div ref={listRef} role="listbox" aria-label="Commands"
          style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '20px 16px', color: 'var(--t3)', fontSize: 13, textAlign: 'center' }}>
              No commands match.
            </div>
          )}
          {sectionOrder.map(section => (
            <div key={section}>
              <div style={{
                padding: '6px 16px 4px', fontSize: 10, color: 'var(--t3)',
                textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700,
              }}>{section}</div>
              {grouped[section].map(cmd => {
                runningIdx++;
                const idx = runningIdx;
                const active = idx === activeIdx;
                return (
                  <div key={cmd.id} role="option" aria-selected={active}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={e => { e.preventDefault(); exec(cmd); }}
                    style={{
                      padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
                      background: active ? 'var(--ac)' : 'transparent',
                      color: active ? 'var(--act)' : 'var(--tx)',
                      cursor: 'pointer', fontSize: 13,
                    }}>
                    <span style={{ flex: 1, fontWeight: 600 }}>{cmd.name}</span>
                    {cmd.hint && <span style={{
                      fontSize: 11, color: active ? 'var(--act)' : 'var(--t3)',
                      opacity: active ? 0.85 : 1, maxWidth: 220, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{cmd.hint}</span>}
                    {cmd.shortcut && <span style={{
                      fontSize: 10, color: active ? 'var(--act)' : 'var(--t3)',
                      fontFamily: 'monospace', padding: '2px 6px',
                      border: '1px solid ' + (active ? 'var(--act)' : 'var(--br)'), borderRadius: 4,
                    }}>{cmd.shortcut}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{
          padding: '6px 12px', borderTop: '1px solid var(--br)', fontSize: 10,
          color: 'var(--t3)', display: 'flex', gap: 12, fontFamily: 'var(--fn)',
        }}>
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>Esc close</span>
          <span style={{ marginLeft: 'auto' }}>{filtered.length} / {all.length}</span>
        </div>
      </div>
    </div>
  );
}
