import { useMemo } from 'react';
import { applyBase, getPropertyKeys } from '../../lib/base/queryBase.js';
import { FILTER_OPS, VIEW_TYPES, DEFAULT_COLUMNS } from '../../lib/base/baseTypes.js';
import { ICON, displayStatus } from '../../lib/types.js';

// BaseView — the all-in-one renderer for a saved Base.
//
// Owns three things:
//   1. The view-type switcher (table / cards / list)
//   2. Filter + sort + column editors
//   3. Delegating the actual data render to the right subcomponent
//
// All mutations bubble up through `onBaseChange(nextBase)` so the parent
// can persist them; this component is otherwise stateless beyond what's
// in `base`.

const BTN_STYLE = {
  padding: '4px 10px',
  background: 'transparent',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  color: 'var(--t2)',
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontSize: 12,
};

const BTN_ACTIVE = { ...BTN_STYLE, background: 'var(--b2)', color: 'var(--ac)', borderColor: 'var(--ac)' };

const INPUT_STYLE = {
  padding: '4px 6px',
  background: 'var(--bg)',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  color: 'var(--tx)',
  fontFamily: 'var(--fn)',
  fontSize: 12,
};

function formatCell(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? '✓' : '';
  if (typeof v === 'string' && v.length > 80) return v.slice(0, 80) + '…';
  return String(v);
}

function formatEntryCell(entry, key) {
  if (key === 'status') return displayStatus(entry?.status);
  return formatCell(entry?.[key]);
}

function ViewSwitcher({ base, onBaseChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {(base.views || []).map(v => (
        <button
          key={v.id}
          type="button"
          onClick={() => onBaseChange({ ...base, activeViewId: v.id })}
          style={base.activeViewId === v.id ? BTN_ACTIVE : BTN_STYLE}
          aria-pressed={base.activeViewId === v.id}
        >
          {v.name}
        </button>
      ))}
    </div>
  );
}

function FilterEditor({ base, onBaseChange, propertyKeys }) {
  const filters = base.filters || [];
  const update = (i, patch) => {
    const next = filters.slice();
    next[i] = { ...next[i], ...patch };
    onBaseChange({ ...base, filters: next });
  };
  const add = () => {
    const key = propertyKeys[0] || 'status';
    onBaseChange({ ...base, filters: [...filters, { key, op: 'equals', value: '' }] });
  };
  const remove = (i) => {
    onBaseChange({ ...base, filters: filters.filter((_, j) => j !== i) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Filters</div>
      {filters.map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <select aria-label="Filter key" value={f.key} onChange={e => update(i, { key: e.target.value })} style={INPUT_STYLE}>
            {[f.key, ...propertyKeys.filter(k => k !== f.key)].map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select aria-label="Filter operator" value={f.op} onChange={e => update(i, { op: e.target.value })} style={INPUT_STYLE}>
            {FILTER_OPS.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
          {f.op !== 'exists' && (
            <input
              aria-label="Filter value"
              value={f.value ?? ''}
              onChange={e => update(i, { value: e.target.value })}
              placeholder={f.op === 'in' ? 'a, b, c' : 'value'}
              style={{ ...INPUT_STYLE, flex: 1, minWidth: 80 }}
            />
          )}
          <button type="button" onClick={() => remove(i)} aria-label="Remove filter" style={{ ...BTN_STYLE, padding: '2px 8px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={add} style={{ ...BTN_STYLE, alignSelf: 'flex-start', borderStyle: 'dashed' }}>+ Filter</button>
    </div>
  );
}

function SortEditor({ base, onBaseChange, propertyKeys }) {
  const sorts = base.sorts || [];
  const update = (i, patch) => {
    const next = sorts.slice();
    next[i] = { ...next[i], ...patch };
    onBaseChange({ ...base, sorts: next });
  };
  const add = () => {
    const key = propertyKeys[0] || 'title';
    onBaseChange({ ...base, sorts: [...sorts, { key, dir: 'asc' }] });
  };
  const remove = (i) => {
    onBaseChange({ ...base, sorts: sorts.filter((_, j) => j !== i) });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Sorts</div>
      {sorts.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <select aria-label="Sort key" value={s.key} onChange={e => update(i, { key: e.target.value })} style={INPUT_STYLE}>
            {[s.key, ...propertyKeys.filter(k => k !== s.key)].map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => update(i, { dir: s.dir === 'asc' ? 'desc' : 'asc' })}
            aria-label={`Toggle direction (currently ${s.dir})`}
            style={BTN_STYLE}
          >
            {s.dir === 'asc' ? '↑ asc' : '↓ desc'}
          </button>
          <button type="button" onClick={() => remove(i)} aria-label="Remove sort" style={{ ...BTN_STYLE, padding: '2px 8px' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={add} style={{ ...BTN_STYLE, alignSelf: 'flex-start', borderStyle: 'dashed' }}>+ Sort</button>
    </div>
  );
}

function BaseTable({ entries, base, onBaseChange, onOpenEntry, onDeleteEntry }) {
  const cols = (base.columns && base.columns.length > 0) ? base.columns : DEFAULT_COLUMNS;
  const sorts = base.sorts || [];
  const sortByCol = (key) => {
    // Toggle: if this key is the primary sort, flip dir; otherwise make it primary asc.
    const existing = sorts[0];
    let nextSorts;
    if (existing && existing.key === key) {
      nextSorts = [{ key, dir: existing.dir === 'asc' ? 'desc' : 'asc' }, ...sorts.slice(1)];
    } else {
      nextSorts = [{ key, dir: 'asc' }];
    }
    onBaseChange({ ...base, sorts: nextSorts });
  };
  const primary = sorts[0];

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--br)', borderRadius: 'var(--rd)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--b2)' }}>
            {cols.map(c => (
              <th
                key={c}
                onClick={() => sortByCol(c)}
                style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--br)', color: 'var(--t2)', cursor: 'pointer', fontWeight: 700, userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                {c}{primary && primary.key === c ? (primary.dir === 'asc' ? ' ↑' : ' ↓') : ''}
              </th>
            ))}
            {onDeleteEntry&&(
              <th style={{ width: 34, padding: '7px 10px', borderBottom: '1px solid var(--br)' }}>
                <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid var(--br)' }}>
              {cols.map((c, i) => (
                <td key={c} style={{ padding: '6px 10px', color: 'var(--tx)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {i === 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpenEntry?.(e.id)}
                      style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--ac)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 12, textAlign: 'left' }}
                    >
                      {ICON[e.type] ? <span aria-hidden="true" style={{ marginRight: 4 }}>{ICON[e.type]}</span> : null}
                      {formatEntryCell(e, c) || '(untitled)'}
                    </button>
                  ) : formatEntryCell(e, c)}
                </td>
              ))}
              {onDeleteEntry&&(
                <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                  <button
                    type="button"
                    aria-label={`Delete ${e.title||'untitled entry'}`}
                    title="Delete entry"
                    onClick={() => onDeleteEntry(e.id)}
                    style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent', borderRadius: 'var(--rd)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: 'var(--fn)' }}
                  >
                    ×
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BaseCards({ entries, base, onOpenEntry, onDeleteEntry }) {
  const cols = (base.columns && base.columns.length > 0) ? base.columns : DEFAULT_COLUMNS;
  const meta = cols.filter(c => c !== 'title').slice(0, 3);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
      {entries.map(e => (
        <article
          key={e.id}
          className="mgn-card"
          style={{ padding: 10, background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', fontFamily: 'var(--fn)', color: 'var(--tx)', display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          <button
            type="button"
            onClick={() => onOpenEntry?.(e.id)}
            aria-label={`Open ${e.title||'untitled entry'}`}
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--tx)', fontFamily: 'var(--fn)', textAlign: 'left', flex: 1 }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              {ICON[e.type] && <span aria-hidden="true">{ICON[e.type]}</span>}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title || '(untitled)'}</span>
            </div>
            {meta.map(k => (
              <div key={k} style={{ fontSize: 11, color: 'var(--t3)' }}>
                <span style={{ fontWeight: 700, marginRight: 4 }}>{k}:</span>
                {formatEntryCell(e, k)}
              </div>
            ))}
          </button>
          {onDeleteEntry&&(
            <button
              type="button"
              aria-label={`Delete ${e.title||'untitled entry'}`}
              title="Delete entry"
              onMouseDown={event=>event.stopPropagation()}
              onClick={event=>{event.stopPropagation();onDeleteEntry(e.id);}}
              style={{ alignSelf: 'flex-end', marginTop: 'auto', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent', borderRadius: 'var(--rd)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: 'var(--fn)' }}
            >
              ×
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

function BaseList({ entries, onOpenEntry, onDeleteEntry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {entries.map(e => (
        <div
          key={e.id}
          className="mgn-card"
          style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--br)', borderRadius: 'var(--rd)', fontFamily: 'var(--fn)', fontSize: 12, color: 'var(--tx)', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <button
            type="button"
            onClick={() => onOpenEntry?.(e.id)}
            style={{ all: 'unset', cursor: 'pointer', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--tx)', fontFamily: 'var(--fn)', textAlign: 'left' }}
          >
            {ICON[e.type] && <span aria-hidden="true" style={{ flexShrink: 0 }}>{ICON[e.type]}</span>}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title || '(untitled)'}</span>
            {e.status && <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>{displayStatus(e.status)}</span>}
          </button>
          {onDeleteEntry&&(
            <button
              type="button"
              aria-label={`Delete ${e.title||'untitled entry'}`}
              title="Delete entry"
              onMouseDown={event=>event.stopPropagation()}
              onClick={event=>{event.stopPropagation();onDeleteEntry(e.id);}}
              style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent', borderRadius: 'var(--rd)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: 'var(--fn)', flexShrink: 0 }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function BaseView({ entries, base, onBaseChange, onOpenEntry, onDeleteEntry }) {
  const propertyKeys = useMemo(() => getPropertyKeys(entries), [entries]);
  const filtered = useMemo(() => applyBase(entries, base), [entries, base]);
  const activeView = (base.views || []).find(v => v.id === base.activeViewId) || (base.views || [])[0] || { type: 'table' };

  const renderBody = () => {
    switch (activeView.type) {
      case 'cards':
        return <BaseCards entries={filtered} base={base} onOpenEntry={onOpenEntry} onDeleteEntry={onDeleteEntry} />;
      case 'list':
        return <BaseList entries={filtered} onOpenEntry={onOpenEntry} onDeleteEntry={onDeleteEntry} />;
      case 'table':
      default:
        return <BaseTable entries={filtered} base={base} onBaseChange={onBaseChange} onOpenEntry={onOpenEntry} onDeleteEntry={onDeleteEntry} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{base.name}</h2>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{filtered.length} of {entries.length} entries</span>
        <div style={{ marginLeft: 'auto' }}>
          <ViewSwitcher base={base} onBaseChange={onBaseChange} />
        </div>
      </div>

      <details style={{ background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', padding: '6px 10px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--t2)', userSelect: 'none' }}>
          Configure ({(base.filters || []).length} filter{(base.filters || []).length === 1 ? '' : 's'}, {(base.sorts || []).length} sort{(base.sorts || []).length === 1 ? '' : 's'})
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10 }}>
          <FilterEditor base={base} onBaseChange={onBaseChange} propertyKeys={propertyKeys} />
          <SortEditor base={base} onBaseChange={onBaseChange} propertyKeys={propertyKeys} />
          <ColumnEditor base={base} onBaseChange={onBaseChange} propertyKeys={propertyKeys} />
        </div>
      </details>

      <div style={{ flex: 1, minHeight: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
            No entries match this base.
          </div>
        ) : renderBody()}
      </div>
    </div>
  );
}

function ColumnEditor({ base, onBaseChange, propertyKeys }) {
  const cols = (base.columns && base.columns.length > 0) ? base.columns : [];
  const toggle = (k) => {
    const next = cols.includes(k) ? cols.filter(c => c !== k) : [...cols, k];
    onBaseChange({ ...base, columns: next });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Columns</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {[...new Set([...cols, ...propertyKeys])].map(k => (
          <button
            key={k}
            type="button"
            onClick={() => toggle(k)}
            style={cols.includes(k) ? BTN_ACTIVE : BTN_STYLE}
            aria-pressed={cols.includes(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// Re-export view types for any consumer that wants to gate on them.
export { VIEW_TYPES };
