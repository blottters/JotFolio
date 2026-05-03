import { useState, useMemo } from 'react';
import { CanvasView } from './CanvasView.jsx';
import { createEmptyCanvas } from '../../lib/canvas/canvasTypes.js';

// CanvasExplorer — hub component shown in the main pane. When a canvas
// is selected (canvasId prop matches one in the list), it delegates to
// CanvasView. Otherwise it renders a card grid of known canvases plus a
// "+ New canvas" affordance.
//
// Persistence is handled by the parent: every onCanvasChange + every
// onCreate gets written to disk one level up (App.jsx).

export function CanvasExplorer({
  canvases = [],
  canvasId,
  entries = [],
  onSelect,
  onCreate,
  onCanvasChange,
  onOpenEntry,
  onClose,
}) {
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const current = useMemo(() => canvases.find(c => c.id === canvasId) || null, [canvases, canvasId]);

  if (current) {
    return (
      <CanvasView
        canvas={current}
        entries={entries}
        onCanvasChange={onCanvasChange}
        onOpenEntry={onOpenEntry}
        onClose={onClose}
      />
    );
  }

  return (
    <div style={{ padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, color: 'var(--t2)' }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--tx)' }}>Canvases</div>
      <div style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', maxWidth: 420 }}>
        Canvases are spatial workspaces for arranging entry cards, text cards, and connections.
        Each canvas is saved as a portable <code>.canvas.json</code> file in your vault.
      </div>

      {creating ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            autoFocus
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            placeholder="Canvas name"
            onKeyDown={e => {
              if (e.key === 'Enter' && draftName.trim()) {
                const c = createEmptyCanvas({ name: draftName.trim() });
                onCreate?.(c);
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
              const c = createEmptyCanvas({ name: draftName.trim() });
              onCreate?.(c);
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
          + New Canvas
        </button>
      )}

      {canvases.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
          width: '100%',
          maxWidth: 800,
          marginTop: 10,
        }}>
          {canvases.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect?.(c.id)}
              style={{
                textAlign: 'left',
                padding: 14,
                background: 'var(--b2)',
                border: '1px solid var(--br)',
                borderRadius: 'var(--rd)',
                cursor: 'pointer',
                fontFamily: 'var(--fn)',
                color: 'var(--tx)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14 }}>▦ {c.name}</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                {c.nodes?.length || 0} card{(c.nodes?.length || 0) === 1 ? '' : 's'}
                {c.edges?.length ? ` · ${c.edges.length} edge${c.edges.length === 1 ? '' : 's'}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
