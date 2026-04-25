import { useState } from 'react';
import { BaseView } from './BaseView.jsx';
import { createEmptyBase } from '../../lib/base/baseTypes.js';

// BaseExplorer — when no base is selected, offers a "create base" CTA.
// Otherwise just delegates to BaseView. Save/Save-As is handled implicitly:
// the parent (App.jsx) persists every onBaseChange to the vault.

export function BaseExplorer({ entries, base, onBaseChange, onOpenEntry, onCreateBase }) {
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (base) {
    return <BaseView entries={entries} base={base} onBaseChange={onBaseChange} onOpenEntry={onOpenEntry} />;
  }

  return (
    <div style={{ padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'var(--t2)' }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--tx)' }}>No base selected</div>
      <div style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', maxWidth: 380 }}>
        Bases are saved queries over your vault — pick filters, sort, and a view, and reopen the result anytime.
      </div>
      {creating ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            autoFocus
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            placeholder="Base name"
            onKeyDown={e => {
              if (e.key === 'Enter' && draftName.trim()) {
                onCreateBase(createEmptyBase({ name: draftName.trim() }));
                setCreating(false);
                setDraftName('');
              } else if (e.key === 'Escape') {
                setCreating(false);
                setDraftName('');
              }
            }}
            style={{ padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--ac)', borderRadius: 'var(--rd)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 13 }}
          />
          <button
            type="button"
            disabled={!draftName.trim()}
            onClick={() => {
              onCreateBase(createEmptyBase({ name: draftName.trim() }));
              setCreating(false);
              setDraftName('');
            }}
            style={{ padding: '6px 12px', background: 'var(--ac)', color: 'var(--act)', border: 'none', borderRadius: 'var(--rd)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 13, fontWeight: 700 }}
          >
            Create
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          style={{ padding: '8px 14px', background: 'var(--ac)', color: 'var(--act)', border: 'none', borderRadius: 'var(--rd)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 13, fontWeight: 700 }}
        >
          + New Base
        </button>
      )}
    </div>
  );
}
