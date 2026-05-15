import { useId, useMemo, useState } from 'react';
import { useEscapeKey } from '../../lib/hooks.js';

function computeTagIndex(entries) {
  const counts = new Map();
  const list = Array.isArray(entries) ? entries : [];
  for (const entry of list) {
    const tags = Array.isArray(entry?.tags) ? entry.tags : [];
    for (const raw of tags) {
      const name = String(raw || '').trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function applyRename(entries, oldName, newName, onUpdateEntry) {
  const next = String(newName || '').trim();
  if (!next || next === oldName) return 0;
  let touched = 0;
  for (const entry of entries) {
    const tags = Array.isArray(entry?.tags) ? entry.tags : [];
    if (!tags.includes(oldName)) continue;
    const mapped = tags.map(tag => (tag === oldName ? next : tag));
    const deduped = Array.from(new Set(mapped));
    onUpdateEntry?.(entry.id, { tags: deduped });
    touched += 1;
  }
  return touched;
}

function applyMerge(entries, fromName, intoName, onUpdateEntry) {
  if (!intoName || intoName === fromName) return 0;
  let touched = 0;
  for (const entry of entries) {
    const tags = Array.isArray(entry?.tags) ? entry.tags : [];
    if (!tags.includes(fromName)) continue;
    const replaced = tags.map(tag => (tag === fromName ? intoName : tag));
    const deduped = Array.from(new Set(replaced));
    onUpdateEntry?.(entry.id, { tags: deduped });
    touched += 1;
  }
  return touched;
}

function applyDelete(entries, target, onUpdateEntry) {
  let touched = 0;
  for (const entry of entries) {
    const tags = Array.isArray(entry?.tags) ? entry.tags : [];
    if (!tags.includes(target)) continue;
    onUpdateEntry?.(entry.id, { tags: tags.filter(tag => tag !== target) });
    touched += 1;
  }
  return touched;
}

function inputStyle() {
  return {
    minHeight: 32,
    boxSizing: 'border-box',
    border: '1px solid rgba(118, 137, 160, 0.22)',
    borderRadius: 6,
    background: 'rgba(12, 17, 23, 0.46)',
    color: 'var(--tx)',
    fontFamily: 'var(--fn)',
    fontSize: 12,
    outline: 'none',
    padding: '6px 10px',
  };
}

function actionButton(extra = {}) {
  return {
    border: '1px solid rgba(118, 137, 160, 0.26)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--tx)',
    fontFamily: 'var(--fn)',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    ...extra,
  };
}

export function TagManageDialog({ open, entries = [], onUpdateEntry, onClose }) {
  const titleId = useId();
  const list = useMemo(() => computeTagIndex(entries), [entries]);
  const [renameDraft, setRenameDraft] = useState({});
  const [mergeDraft, setMergeDraft] = useState({});
  const [pendingDelete, setPendingDelete] = useState('');

  useEscapeKey(open, () => onClose?.());

  if (!open) return null;

  const renameOf = name => (name in renameDraft ? renameDraft[name] : name);
  const mergeOf = name => mergeDraft[name] || '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={event => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 340,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        background: 'rgba(3, 7, 11, 0.72)',
      }}
    >
      <div
        style={{
          width: 'min(640px, calc(100vw - 28px))',
          maxHeight: 'calc(100vh - 36px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(118, 137, 160, 0.26)',
          borderRadius: 9,
          background: 'linear-gradient(180deg, #1d242c 0%, #171e25 48%, #151b21 100%)',
          color: 'var(--tx)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.035)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: 56,
            padding: '0 26px',
            borderBottom: '1px solid rgba(118, 137, 160, 0.16)',
          }}
        >
          <h2 id={titleId} style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
            Manage Tags
          </h2>
          <span style={{ marginLeft: 12, fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>
            {list.length} {list.length === 1 ? 'tag' : 'tags'}
          </span>
          <button
            type="button"
            aria-label="Close manage tags"
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              color: 'var(--t2)',
              cursor: 'pointer',
              fontSize: 22,
              lineHeight: 1,
              fontFamily: 'var(--fn)',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px 26px 20px', minHeight: 0 }}>
          {list.length === 0 ? (
            <div style={{ padding: '24px 0', fontSize: 13, color: 'var(--t3)', textAlign: 'center' }}>
              No tags yet. Add tags to entries to manage them here.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map(tag => {
                const otherTags = list.filter(t => t.name !== tag.name).map(t => t.name);
                const renameValue = renameOf(tag.name);
                const mergeValue = mergeOf(tag.name);
                const isPendingDelete = pendingDelete === tag.name;
                return (
                  <li
                    key={tag.name}
                    aria-label={`Tag ${tag.name}`}
                    style={{
                      border: '1px solid rgba(118, 137, 160, 0.16)',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>#{tag.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)' }}>
                        {tag.count} {tag.count === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <label style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>Rename</label>
                      <input
                        aria-label={`Rename ${tag.name}`}
                        type="text"
                        value={renameValue}
                        onChange={event => setRenameDraft(prev => ({ ...prev, [tag.name]: event.target.value }))}
                        style={inputStyle()}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          applyRename(entries, tag.name, renameValue, onUpdateEntry);
                          setRenameDraft(prev => {
                            const next = { ...prev };
                            delete next[tag.name];
                            return next;
                          });
                        }}
                        disabled={!renameValue.trim() || renameValue.trim() === tag.name}
                        style={actionButton({
                          opacity: !renameValue.trim() || renameValue.trim() === tag.name ? 0.5 : 1,
                          cursor: !renameValue.trim() || renameValue.trim() === tag.name ? 'not-allowed' : 'pointer',
                        })}
                      >
                        Apply rename
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <label style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>Merge into</label>
                      <select
                        aria-label={`Merge ${tag.name} into`}
                        value={mergeValue}
                        onChange={event => setMergeDraft(prev => ({ ...prev, [tag.name]: event.target.value }))}
                        style={inputStyle()}
                      >
                        <option value="">— select tag —</option>
                        {otherTags.map(name => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          applyMerge(entries, tag.name, mergeValue, onUpdateEntry);
                          setMergeDraft(prev => {
                            const next = { ...prev };
                            delete next[tag.name];
                            return next;
                          });
                        }}
                        disabled={!mergeValue}
                        style={actionButton({
                          opacity: mergeValue ? 1 : 0.5,
                          cursor: mergeValue ? 'pointer' : 'not-allowed',
                        })}
                      >
                        Apply merge
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      {isPendingDelete ? (
                        <>
                          <span style={{ fontSize: 12, color: 'var(--t2)' }}>
                            Sure? This removes the tag from {tag.count} {tag.count === 1 ? 'entry' : 'entries'}.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              applyDelete(entries, tag.name, onUpdateEntry);
                              setPendingDelete('');
                            }}
                            style={actionButton({
                              borderColor: 'rgba(239, 68, 68, 0.6)',
                              color: '#fecaca',
                              background: 'rgba(239, 68, 68, 0.12)',
                            })}
                          >
                            Confirm delete
                          </button>
                          <button type="button" onClick={() => setPendingDelete('')} style={actionButton()}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Delete ${tag.name}`}
                          onClick={() => setPendingDelete(tag.name)}
                          style={actionButton({ color: '#fda4a4', borderColor: 'rgba(239, 68, 68, 0.35)' })}
                        >
                          Delete tag
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 26px',
            borderTop: '1px solid rgba(118, 137, 160, 0.16)',
          }}
        >
          <button type="button" onClick={onClose} style={actionButton()}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
