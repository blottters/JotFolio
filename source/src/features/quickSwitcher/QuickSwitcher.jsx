import { useState, useEffect, useMemo, useRef, useId } from 'react';
import { rankNotes, findExactMatch } from '../../lib/quickSwitcher/quickSwitcherSearch.js';

// Quick switcher modal — Obsidian's Cmd/Ctrl+O.
//
// Mirrors CommandPalette.jsx visually and interactionally: same outer
// modal shell, same foot bar, same sectioning. Differences:
//   - Searches the vault (entries) instead of the command registry
//   - Empty query shows the "Recent" section (most-recently modified)
//   - Non-empty query with no exact match offers a "Create" row at the
//     bottom; activated with Enter on that row OR Shift+Enter from the
//     input
//
// Pure render component. No side effects on mount beyond focusing the
// input and resetting state on each open.

const RESULT_LIMIT = 8;

function CreateRow({ query, active, idx, onHover, onActivate }) {
  return (
    <div>
      <div
        style={{
          padding: '6px 16px 4px', fontSize: 10, color: 'var(--t3)',
          textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700,
        }}
      >
        Create
      </div>
      <div
        role="option"
        aria-selected={active}
        onMouseEnter={() => onHover(idx)}
        onMouseDown={ev => { ev.preventDefault(); onActivate(); }}
        style={{
          padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
          background: active ? 'var(--ac)' : 'transparent',
          color: active ? 'var(--act)' : 'var(--tx)',
          cursor: 'pointer', fontSize: 13,
        }}
      >
        <span style={{ flex: 1, fontWeight: 600 }}>{`+ Create "${query}"`}</span>
        <span
          style={{
            fontSize: 10, color: active ? 'var(--act)' : 'var(--t3)',
            fontFamily: 'monospace', padding: '2px 6px',
            border: '1px solid ' + (active ? 'var(--act)' : 'var(--br)'), borderRadius: 4,
          }}
        >
          Shift+↵
        </span>
      </div>
    </div>
  );
}

export function QuickSwitcher({ open, entries, onOpenEntry, onCreateNote, onClose }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const inputId = useId();

  // Reset query + selection on each open. Auto-focus the input.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const safeEntries = useMemo(
    () => (Array.isArray(entries) ? entries : []),
    [entries]
  );

  const ranked = useMemo(
    () => rankNotes(safeEntries, query).slice(0, RESULT_LIMIT),
    [safeEntries, query]
  );

  const trimmed = query.trim();
  const exact = useMemo(
    () => (trimmed ? findExactMatch(safeEntries, trimmed) : null),
    [safeEntries, trimmed]
  );

  const showCreateRow = trimmed.length > 0 && !exact;
  const sectionLabel = trimmed.length === 0 ? 'Recent' : 'Matches';

  // Flat list of selectable rows in render order. Each entry is either
  // { kind: 'note', entry } or { kind: 'create' }.
  const rows = useMemo(() => {
    const out = ranked.map(e => ({ kind: 'note', entry: e }));
    if (showCreateRow) out.push({ kind: 'create' });
    return out;
  }, [ranked, showCreateRow]);

  // Clamp active index when the row list shrinks.
  useEffect(() => {
    if (activeIdx >= rows.length) setActiveIdx(Math.max(0, rows.length - 1));
  }, [rows.length, activeIdx]);

  if (!open) return null;

  const activate = (row) => {
    if (!row) return;
    if (row.kind === 'note') {
      onOpenEntry?.(row.entry?.id);
      onClose?.();
      return;
    }
    if (row.kind === 'create') {
      onCreateNote?.(trimmed);
      onClose?.();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(rows.length - 1, i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      // Shift+Enter from anywhere with non-empty query and no exact
      // match should always create a new note, regardless of which row
      // is selected.
      if (e.shiftKey && trimmed.length > 0 && !exact) {
        onCreateNote?.(trimmed);
        onClose?.();
        return;
      }
      activate(rows[activeIdx]);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={inputId}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.42)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 96,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        style={{
          width: 'min(560px, 92vw)', maxHeight: 'min(60vh, 480px)',
          background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 8,
          boxShadow: '0 24px 64px rgba(0,0,0,0.32)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <input
          id={inputId}
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={handleKey}
          placeholder="Find or create note…"
          aria-label="Quick switcher search"
          style={{
            padding: '14px 16px', fontSize: 15, fontFamily: 'var(--fn)',
            border: 'none', borderBottom: '1px solid var(--br)', background: 'transparent',
            color: 'var(--tx)', outline: 'none',
          }}
        />
        <div
          role="listbox"
          aria-label="Quick switcher results"
          style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}
        >
          {ranked.length === 0 && !showCreateRow && (
            <div style={{ padding: '20px 16px', color: 'var(--t3)', fontSize: 13, textAlign: 'center' }}>
              {trimmed ? 'No notes match.' : 'No notes yet.'}
            </div>
          )}

          {ranked.length > 0 && (
            <div>
              <div
                style={{
                  padding: '6px 16px 4px', fontSize: 10, color: 'var(--t3)',
                  textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700,
                }}
              >
                {sectionLabel}
              </div>
              {ranked.map((entryItem, i) => {
                const idx = i;
                const active = idx === activeIdx;
                const aliasList = Array.isArray(entryItem.aliases)
                  ? entryItem.aliases.filter(a => typeof a === 'string' && a.length > 0)
                  : [];
                return (
                  <div
                    key={entryItem.id || idx}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={ev => { ev.preventDefault(); activate({ kind: 'note', entry: entryItem }); }}
                    style={{
                      padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
                      background: active ? 'var(--ac)' : 'transparent',
                      color: active ? 'var(--act)' : 'var(--tx)',
                      cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entryItem.title || '(untitled)'}
                    </span>
                    {aliasList.length > 0 && (
                      <span
                        style={{
                          fontSize: 11, color: active ? 'var(--act)' : 'var(--t3)',
                          opacity: active ? 0.85 : 1, maxWidth: 220, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {aliasList.join(', ')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showCreateRow && (
            <CreateRow
              query={trimmed}
              active={activeIdx === ranked.length}
              idx={ranked.length}
              onHover={setActiveIdx}
              onActivate={() => activate({ kind: 'create' })}
            />
          )}
        </div>
        <div
          style={{
            padding: '6px 12px', borderTop: '1px solid var(--br)', fontSize: 10,
            color: 'var(--t3)', display: 'flex', gap: 12, fontFamily: 'var(--fn)',
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>Shift+↵ create</span>
          <span>Esc close</span>
          <span style={{ marginLeft: 'auto' }}>{rows.length} result{rows.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}
