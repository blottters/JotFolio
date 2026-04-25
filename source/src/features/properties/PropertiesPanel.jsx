import { useState, useId, useMemo } from 'react';

// PropertiesPanel — inline editor for an entry's frontmatter.
//
// Renders one row per key. Click a value to edit it inline; blur or Enter
// commits, Esc cancels. Arrays are edited as comma-separated strings; numbers
// are auto-coerced from numeric input strings. The "+ Add property" row at
// the bottom lets users introduce arbitrary new keys (Bases-style schemaless
// frontmatter).
//
// Props:
//   entry    — the active entry (frontmatter is flattened onto it)
//   onUpdate — async (patch) => void; called with `{ [key]: nextValue }` or
//              `{ [key]: undefined }` to delete a key.
//   allKeys  — optional string[]; suggested keys for the "Add" autocomplete.
//
// We deliberately AVOID showing system fields (id, _path, etc.) — they're
// not user-meaningful frontmatter.

const HIDDEN_KEYS = new Set([
  '_path', 'id', 'date', 'unresolvedTargets',
  // these are first-class entry shape, edited via the rest of DetailPanel
  'title', 'notes',
]);

function isHiddenKey(k) {
  if (HIDDEN_KEYS.has(k)) return true;
  if (k.startsWith('_')) return true;
  return false;
}

function visibleKeys(entry) {
  if (!entry || typeof entry !== 'object') return [];
  return Object.keys(entry)
    .filter(k => !isHiddenKey(k))
    .sort((a, b) => a.localeCompare(b));
}

function formatValue(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function parseValue(prev, raw) {
  // Re-coerce based on the previous value's shape so editing an array stays
  // an array and editing a number stays a number.
  if (Array.isArray(prev)) {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (typeof prev === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  if (typeof prev === 'boolean') {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return Boolean(raw);
  }
  return raw;
}

function PropertyRow({ kKey, value, onCommit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => formatValue(value));
  const inputId = useId();

  const startEdit = () => { setDraft(formatValue(value)); setEditing(true); };
  const commit = () => {
    const next = parseValue(value, draft);
    setEditing(false);
    if (formatValue(next) !== formatValue(value)) onCommit(next);
  };
  const cancel = () => { setDraft(formatValue(value)); setEditing(false); };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--br)' }}>
      <label htmlFor={inputId} style={{ flex: '0 0 96px', fontSize: 11, fontWeight: 700, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {kKey}
      </label>
      {editing ? (
        <input
          id={inputId}
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          style={{ flex: 1, padding: '3px 6px', background: 'var(--bg)', border: '1px solid var(--ac)', borderRadius: 'var(--rd)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 12 }}
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          style={{ flex: 1, textAlign: 'left', padding: '3px 6px', background: 'transparent', border: '1px solid transparent', borderRadius: 'var(--rd)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 12, cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          aria-label={`Edit ${kKey}`}
        >
          {formatValue(value) || <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>(empty)</span>}
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete property ${kKey}`}
        title="Delete property"
        style={{ padding: '2px 6px', background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 14, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}

function AddPropertyRow({ onAdd, allKeys, existingKeys }) {
  const [adding, setAdding] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [valDraft, setValDraft] = useState('');
  const datalistId = useId();
  const suggestions = useMemo(() => {
    const taken = new Set(existingKeys);
    return (allKeys || []).filter(k => !taken.has(k) && !isHiddenKey(k));
  }, [allKeys, existingKeys]);

  const submit = () => {
    const k = keyDraft.trim();
    if (!k) { setAdding(false); return; }
    if (isHiddenKey(k)) { setAdding(false); return; }
    onAdd(k, valDraft);
    setKeyDraft(''); setValDraft(''); setAdding(false);
  };

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        style={{ marginTop: 6, padding: '4px 8px', background: 'transparent', border: '1px dashed var(--br)', borderRadius: 'var(--rd)', color: 'var(--t2)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 11 }}
      >
        + Add property
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        autoFocus
        list={datalistId}
        value={keyDraft}
        onChange={e => setKeyDraft(e.target.value)}
        placeholder="key"
        onKeyDown={e => { if (e.key === 'Escape') setAdding(false); }}
        style={{ flex: '0 0 110px', padding: '3px 6px', background: 'var(--bg)', border: '1px solid var(--ac)', borderRadius: 'var(--rd)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 11 }}
      />
      <input
        value={valDraft}
        onChange={e => setValDraft(e.target.value)}
        placeholder="value"
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
          else if (e.key === 'Escape') { e.preventDefault(); setAdding(false); }
        }}
        style={{ flex: 1, padding: '3px 6px', background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 11 }}
      />
      <button type="button" onClick={submit} style={{ padding: '3px 8px', background: 'var(--ac)', border: 'none', borderRadius: 'var(--rd)', color: 'var(--act)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 11, fontWeight: 700 }}>Add</button>
      <button type="button" onClick={() => setAdding(false)} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--t2)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 11 }}>Cancel</button>
      <datalist id={datalistId}>
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    </div>
  );
}

export function PropertiesPanel({ entry, onUpdate, allKeys }) {
  const keys = visibleKeys(entry);
  if (!entry) return null;

  const commit = (k, v) => onUpdate({ [k]: v });
  const remove = (k) => onUpdate({ [k]: undefined });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {keys.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic', padding: '4px 0' }}>
          No properties yet.
        </div>
      )}
      {keys.map(k => (
        <PropertyRow
          key={k}
          kKey={k}
          value={entry[k]}
          onCommit={v => commit(k, v)}
          onDelete={() => remove(k)}
        />
      ))}
      <AddPropertyRow
        onAdd={(k, v) => commit(k, v)}
        allKeys={allKeys}
        existingKeys={keys}
      />
    </div>
  );
}

// Exported for tests.
export const __test__ = { visibleKeys, formatValue, parseValue, isHiddenKey };
