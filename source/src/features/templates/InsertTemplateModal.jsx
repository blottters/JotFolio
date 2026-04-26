import { useState, useEffect, useMemo, useRef, useId } from 'react';

// InsertTemplateModal — fuzzy-search picker for inserting a template
// at the cursor in the active note. Mirrors CommandPalette's modal
// shell exactly (centered overlay, Esc/↑↓/↵ keybindings, click-outside
// closes, listbox semantics).
//
// Props:
//   open            — boolean
//   templates       — Template[] from loadTemplates()
//   onInsert(tpl)   — fired when user picks; parent resolves variables
//                     and splices into the active editor
//   onClose         — fired on Esc / click-outside
//   activeNoteTitle — optional banner string ("Insert into 'X'")

export function InsertTemplateModal({ open, templates, onInsert, onClose, activeNoteTitle }) {
  const list = Array.isArray(templates) ? templates : [];
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const inputId = useId();

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const filtered = useMemo(() => rankTemplates(list, query), [list, query]);

  useEffect(() => {
    if (activeIdx >= filtered.length) {
      setActiveIdx(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIdx]);

  if (!open) return null;

  const pick = (tpl) => {
    if (!tpl) return;
    onInsert?.(tpl);
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose?.(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(filtered.length - 1, i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      pick(filtered[activeIdx]);
      return;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={inputId}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.42)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 96,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{
        width: 'min(560px, 92vw)', maxHeight: 'min(60vh, 480px)',
        background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 8,
        boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {activeNoteTitle && (
          <div style={{
            padding: '8px 16px', borderBottom: '1px solid var(--br)',
            fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--fn)',
            background: 'var(--bg)',
          }}>
            Insert template at cursor in <span style={{ color: 'var(--tx)', fontWeight: 700 }}>
              {`'${activeNoteTitle}'`}
            </span>
          </div>
        )}
        <input
          id={inputId}
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={handleKey}
          placeholder="Type to filter templates…"
          aria-label="Insert template search"
          style={{
            padding: '14px 16px', fontSize: 15, fontFamily: 'var(--fn)',
            border: 'none', borderBottom: '1px solid var(--br)',
            background: 'transparent', color: 'var(--tx)', outline: 'none',
          }}
        />
        <div role="listbox" aria-label="Templates"
          style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
          {filtered.length === 0 && (
            <div style={{
              padding: '20px 16px', color: 'var(--t3)', fontSize: 13, textAlign: 'center',
            }}>
              {list.length === 0 ? 'No templates yet.' : 'No templates match.'}
            </div>
          )}
          {filtered.map((tpl, idx) => {
            const active = idx === activeIdx;
            return (
              <div
                key={tpl.id}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={e => { e.preventDefault(); pick(tpl); }}
                style={{
                  padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
                  background: active ? 'var(--ac)' : 'transparent',
                  color: active ? 'var(--act)' : 'var(--tx)',
                  cursor: 'pointer', fontSize: 13,
                }}
              >
                <span style={{ flex: 1, fontWeight: 600 }}>{tpl.name}</span>
                <span style={{
                  fontSize: 11, color: active ? 'var(--act)' : 'var(--t3)',
                  opacity: active ? 0.85 : 1, maxWidth: 280,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                }}>{tpl.path}</span>
              </div>
            );
          })}
        </div>
        <div style={{
          padding: '6px 12px', borderTop: '1px solid var(--br)', fontSize: 10,
          color: 'var(--t3)', display: 'flex', gap: 12, fontFamily: 'var(--fn)',
        }}>
          <span>↑↓ navigate</span>
          <span>↵ insert</span>
          <span>Esc close</span>
          <span style={{ marginLeft: 'auto' }}>{filtered.length} / {list.length}</span>
        </div>
      </div>
    </div>
  );
}

// Local fuzzy ranker — same shape as commandRegistry.rankCommands but
// scoped to template fields. Subsequence match is the fallback so abbrev.
// queries like "dly" still match "Daily Note".
function rankTemplates(templates, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) {
    return [...templates].sort((a, b) => a.name.localeCompare(b.name));
  }
  const scored = templates.map(tpl => {
    const name = String(tpl.name || '').toLowerCase();
    const path = String(tpl.path || '').toLowerCase();
    let score = 0;
    if (name === q) score += 1000;
    else if (name.startsWith(q)) score += 700;
    else if (name.includes(q)) score += 500;
    if (path.includes(q)) score += 100;
    if (score === 0 && subseq(name, q)) score += 50;
    return { tpl, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.tpl.name.localeCompare(b.tpl.name))
    .map(s => s.tpl);
}

function subseq(haystack, needle) {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}
