import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  addNode,
  removeNode,
  moveNode,
  updateNode,
  addEdge,
  removeEdge,
  updateEdge,
} from '../../lib/canvas/canvasOps.js';
import { vault as vaultAdapter } from '../../adapters/index.js';

// CanvasView — spatial workspace renderer for a single canvas.
//
// Coordinate system: nodes carry world-space (x,y). The render pipeline
// applies a single (translate, scale) transform to a content layer so
// pan/zoom is one matrix multiply, not per-node math. Edge layer is an
// SVG that lives inside the same transformed div so edges share the
// same coordinate space as the nodes.
//
// Interactions:
//   - Drag node body: moves that node (commits one moveNode op on
//     pointer-up so we don't write to disk on every animation frame)
//   - Wheel: zooms anchored at the cursor
//   - Middle-click drag, or space+left-click drag: pans
//   - Click "Connect" toolbar toggle, then click two nodes: edge
//   - Double-click text card: inline edit
//   - Click file card: opens the linked entry via onOpenEntry
//   - × button on a node: remove (also removes touching edges)

const TOOLBAR_BTN = {
  padding: '6px 10px',
  background: 'transparent',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  color: 'var(--t2)',
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontSize: 12,
};
const TOOLBAR_BTN_ACTIVE = {
  ...TOOLBAR_BTN,
  background: 'var(--b2)',
  borderColor: 'var(--ac)',
  color: 'var(--ac)',
};

const NODE_COLORS = {
  text:  { bg: 'var(--bg)',  border: 'var(--br)',  accent: 'var(--ac)' },
  file:  { bg: 'var(--b2)',  border: 'var(--br)',  accent: '#8b5cf6'   },
  media: { bg: 'var(--bg)',  border: 'var(--br)',  accent: '#10b981'   },
};

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

export function CanvasView({ canvas, entries = [], onCanvasChange, onOpenEntry, onClose }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState(null); // { id, offsetX, offsetY }
  const [panning, setPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [mediaPath, setMediaPath] = useState('');

  // Mirror canvas locally so node drags don't churn the parent on every
  // pointermove. Commit happens on pointerup.
  const [localCanvas, setLocalCanvas] = useState(canvas);
  useEffect(() => { setLocalCanvas(canvas); }, [canvas]);

  const commit = useCallback((next) => {
    setLocalCanvas(next);
    if (onCanvasChange) onCanvasChange(next);
  }, [onCanvasChange]);

  // Track which entries exist for fast lookup in file cards
  const entryById = useMemo(() => {
    const m = new Map();
    for (const e of entries) m.set(e.id, e);
    return m;
  }, [entries]);

  // Wheel zoom anchored at cursor — same UX as ConstellationView.
  const onWheel = useCallback((e) => {
    if (!containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor));
    // Anchor: keep the world-point under the cursor stationary.
    const worldX = (mx - pan.x) / scale;
    const worldY = (my - pan.y) / scale;
    const nextPanX = mx - worldX * nextScale;
    const nextPanY = my - worldY * nextScale;
    setScale(nextScale);
    setPan({ x: nextPanX, y: nextPanY });
  }, [scale, pan]);

  // Wheel listener gets attached non-passively so preventDefault works.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Spacebar engages pan mode (cursor changes, drag pans).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !editingNodeId) {
        const t = e.target;
        const inField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
        if (inField) return;
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.key === 'Escape') {
        setConnectMode(false);
        setConnectFrom(null);
        setShowFilePicker(false);
        setShowMediaPicker(false);
        setEditingNodeId(null);
      }
    };
    const onKeyUp = (e) => { if (e.code === 'Space') setSpaceHeld(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [editingNodeId]);

  const screenToWorld = useCallback((sx, sy) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (sx - rect.left - pan.x) / scale,
      y: (sy - rect.top - pan.y) / scale,
    };
  }, [pan, scale]);

  // Pointer handlers on the surface. We disambiguate based on what got
  // hit and what modifiers are active.
  const onPointerDownSurface = (e) => {
    if (e.button === 1 || (e.button === 0 && spaceHeld)) {
      setPanning(true);
      const startX = e.clientX - pan.x;
      const startY = e.clientY - pan.y;
      const onMove = (m) => setPan({ x: m.clientX - startX, y: m.clientY - startY });
      const onUp = () => {
        setPanning(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }
  };

  const onNodePointerDown = (e, node) => {
    if (spaceHeld || e.button !== 0) return;
    if (connectMode) return; // connect-mode handled by click
    if (editingNodeId === node.id) return;
    e.stopPropagation();
    const startWorld = screenToWorld(e.clientX, e.clientY);
    const offsetX = startWorld.x - node.x;
    const offsetY = startWorld.y - node.y;
    setDraggingNode({ id: node.id });
    let lastX = node.x;
    let lastY = node.y;
    const onMove = (m) => {
      const w = screenToWorld(m.clientX, m.clientY);
      lastX = Math.round(w.x - offsetX);
      lastY = Math.round(w.y - offsetY);
      setLocalCanvas(prev => moveNode(prev, node.id, lastX, lastY));
    };
    const onUp = () => {
      setDraggingNode(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // Commit one final state to the parent (persists to disk).
      commit(moveNode(localCanvas, node.id, lastX, lastY));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleNodeClick = (node) => {
    if (connectMode) {
      if (!connectFrom) {
        setConnectFrom(node.id);
        return;
      }
      if (connectFrom !== node.id) {
        commit(addEdge(localCanvas, connectFrom, node.id));
      }
      setConnectFrom(null);
      setConnectMode(false);
      return;
    }
    if (node.type === 'file' && onOpenEntry && node.file) {
      onOpenEntry(node.file);
    }
  };

  const handleAddText = () => {
    const center = screenToWorld(
      (containerRef.current?.clientWidth || 600) / 2,
      (containerRef.current?.clientHeight || 400) / 2,
    );
    commit(addNode(localCanvas, {
      type: 'text',
      x: Math.round(center.x - 110),
      y: Math.round(center.y - 70),
      width: 220,
      height: 140,
      text: 'New text card',
    }));
  };

  const handleAddFile = (entryId) => {
    const center = screenToWorld(
      (containerRef.current?.clientWidth || 600) / 2,
      (containerRef.current?.clientHeight || 400) / 2,
    );
    commit(addNode(localCanvas, {
      type: 'file',
      x: Math.round(center.x - 110),
      y: Math.round(center.y - 70),
      width: 220,
      height: 140,
      file: entryId,
    }));
    setShowFilePicker(false);
    setPickerQuery('');
  };

  const handleAddMedia = () => {
    const path = mediaPath.trim();
    if (!path) return;
    const center = screenToWorld(
      (containerRef.current?.clientWidth || 600) / 2,
      (containerRef.current?.clientHeight || 400) / 2,
    );
    commit(addNode(localCanvas, {
      type: 'media',
      x: Math.round(center.x - 120),
      y: Math.round(center.y - 90),
      width: 240,
      height: 180,
      file: path,
    }));
    setShowMediaPicker(false);
    setMediaPath('');
  };

  const handleRemoveNode = (id) => {
    commit(removeNode(localCanvas, id));
  };

  const filteredEntries = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return entries.slice(0, 50);
    return entries
      .filter(e => (e.title || '').toLowerCase().includes(q) || (e.id || '').toLowerCase().includes(q))
      .slice(0, 50);
  }, [entries, pickerQuery]);

  const cursor = panning || spaceHeld ? 'grabbing' : 'default';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--br)',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        flexShrink: 0,
        background: 'var(--sb)',
      }}>
        {onClose && (
          <button type="button" onClick={onClose} style={TOOLBAR_BTN} aria-label="Close canvas">‹ Back</button>
        )}
        <strong style={{ fontSize: 13, color: 'var(--tx)', marginLeft: 4 }}>{canvas?.name || 'Canvas'}</strong>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={handleAddText} style={TOOLBAR_BTN}>+ Text card</button>
        <button type="button" onClick={() => { setShowFilePicker(s => !s); setShowMediaPicker(false); }} style={showFilePicker ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}>+ Note card</button>
        <button type="button" onClick={() => { setShowMediaPicker(s => !s); setShowFilePicker(false); }} style={showMediaPicker ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}>+ Media card</button>
        <button
          type="button"
          onClick={() => { setConnectMode(m => !m); setConnectFrom(null); }}
          style={connectMode ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
          aria-pressed={connectMode}
        >
          {connectMode ? (connectFrom ? 'Pick target…' : 'Pick source…') : 'Connect'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 8 }}>
          {Math.round(scale * 100)}% — space+drag pans
        </span>
      </div>

      {/* Pickers */}
      {showFilePicker && (
        <div style={{ padding: 8, borderBottom: '1px solid var(--br)', background: 'var(--sb)' }}>
          <input
            autoFocus
            value={pickerQuery}
            onChange={e => setPickerQuery(e.target.value)}
            placeholder="Search entries by title…"
            style={{ width: '100%', padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 13 }}
          />
          <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredEntries.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--t3)', padding: '6px 8px' }}>No matching entries</div>
            )}
            {filteredEntries.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => handleAddFile(e.id)}
                style={{ textAlign: 'left', padding: '6px 8px', background: 'transparent', border: '1px solid transparent', borderRadius: 'var(--rd)', color: 'var(--tx)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 12 }}
                onMouseEnter={ev => { ev.currentTarget.style.background = 'var(--b2)'; }}
                onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent'; }}
              >
                {e.title || '(untitled)'} <span style={{ color: 'var(--t3)', fontSize: 10 }}>· {e.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {showMediaPicker && (
        <div style={{ padding: 8, borderBottom: '1px solid var(--br)', background: 'var(--sb)', display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={mediaPath}
            onChange={e => setMediaPath(e.target.value)}
            placeholder="Vault-relative path, e.g. attachments/diagram.png"
            onKeyDown={e => { if (e.key === 'Enter') handleAddMedia(); }}
            style={{ flex: 1, padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 13 }}
          />
          <button type="button" onClick={handleAddMedia} disabled={!mediaPath.trim()} style={{ ...TOOLBAR_BTN, background: 'var(--ac)', color: 'var(--act)', borderColor: 'var(--ac)' }}>Add</button>
        </div>
      )}

      {/* Canvas surface */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDownSurface}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor,
          background: 'var(--bg)',
          // subtle grid backdrop so the user can perceive panning
          backgroundImage: 'radial-gradient(circle, var(--br) 1px, transparent 1px)',
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Edges layer (SVG, fills a virtual world) */}
          <svg
            width="200000"
            height="200000"
            style={{ position: 'absolute', left: -100000, top: -100000, pointerEvents: 'none', overflow: 'visible' }}
          >
            {(localCanvas?.edges || []).map(edge => {
              const from = localCanvas.nodes.find(n => n.id === edge.fromNode);
              const to = localCanvas.nodes.find(n => n.id === edge.toNode);
              if (!from || !to) return null;
              const fx = from.x + from.width / 2 + 100000;
              const fy = from.y + from.height / 2 + 100000;
              const tx = to.x + to.width / 2 + 100000;
              const ty = to.y + to.height / 2 + 100000;
              const mx = (fx + tx) / 2;
              const my = (fy + ty) / 2;
              return (
                <g key={edge.id}>
                  <line
                    x1={fx} y1={fy} x2={tx} y2={ty}
                    stroke="var(--t3)" strokeWidth={2}
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={() => {
                      const lbl = window.prompt('Edge label (blank to clear):', edge.label || '');
                      if (lbl === null) return;
                      if (lbl === '') commit(updateEdge(localCanvas, edge.id, { label: '' }));
                      else commit(updateEdge(localCanvas, edge.id, { label: lbl }));
                    }}
                  />
                  {edge.label && (
                    <text
                      x={mx} y={my - 4}
                      textAnchor="middle"
                      fontSize={12}
                      fill="var(--t2)"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes layer */}
          {(localCanvas?.nodes || []).map(node => (
            <CanvasNode
              key={node.id}
              node={node}
              entry={node.type === 'file' ? entryById.get(node.file) : null}
              colors={NODE_COLORS[node.type] || NODE_COLORS.text}
              dragging={draggingNode?.id === node.id}
              connectMode={connectMode}
              connectFrom={connectFrom}
              editing={editingNodeId === node.id}
              onPointerDown={(e) => onNodePointerDown(e, node)}
              onClick={() => handleNodeClick(node)}
              onDoubleClick={() => { if (node.type === 'text') setEditingNodeId(node.id); }}
              onRemove={() => handleRemoveNode(node.id)}
              onCommitText={(text) => {
                commit(updateNode(localCanvas, node.id, { text }));
                setEditingNodeId(null);
              }}
              onCancelEdit={() => setEditingNodeId(null)}
            />
          ))}
        </div>

        {/* Empty-state hint */}
        {(!localCanvas?.nodes || localCanvas.nodes.length === 0) && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--t3)',
            fontSize: 13,
            pointerEvents: 'none',
          }}>
            Empty canvas — use the toolbar to add cards.
          </div>
        )}
      </div>
    </div>
  );
}

function CanvasNode({ node, entry, colors, dragging, connectMode, connectFrom, editing, onPointerDown, onClick, onDoubleClick, onRemove, onCommitText, onCancelEdit }) {
  const [hover, setHover] = useState(false);
  const [draftText, setDraftText] = useState(node.text || '');
  useEffect(() => { if (editing) setDraftText(node.text || ''); }, [editing, node.text]);

  const isConnectSource = connectFrom === node.id;
  const borderColor = isConnectSource ? 'var(--ac)' : (hover ? colors.accent : colors.border);
  const shadow = hover || dragging
    ? '0 6px 16px rgba(0,0,0,0.18)'
    : '0 1px 3px rgba(0,0,0,0.08)';

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => { e.preventDefault(); onRemove(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        background: colors.bg,
        border: `2px solid ${borderColor}`,
        borderRadius: 'var(--rd)',
        boxShadow: shadow,
        cursor: connectMode ? 'crosshair' : (dragging ? 'grabbing' : 'grab'),
        userSelect: editing ? 'text' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: dragging ? 'none' : 'box-shadow 120ms, border-color 120ms',
      }}
    >
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: colors.accent,
        padding: '4px 8px',
        borderBottom: '1px solid var(--br)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
      }}>
        <span>{node.type}</span>
        <div style={{ flex: 1 }} />
        {hover && !editing && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label="Remove card"
            style={{
              padding: '0 6px',
              fontSize: 14,
              lineHeight: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--t3)',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        )}
      </div>
      <div style={{ flex: 1, padding: 8, overflow: 'hidden', fontSize: 13, color: 'var(--tx)' }}>
        <NodeBody
          node={node}
          entry={entry}
          editing={editing}
          draftText={draftText}
          setDraftText={setDraftText}
          onCommitText={onCommitText}
          onCancelEdit={onCancelEdit}
        />
      </div>
    </div>
  );
}

function NodeBody({ node, entry, editing, draftText, setDraftText, onCommitText, onCancelEdit }) {
  if (node.type === 'text') {
    if (editing) {
      return (
        <textarea
          autoFocus
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
          onBlur={() => onCommitText(draftText)}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); onCancelEdit(); }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onCommitText(draftText); }
          }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--tx)',
            fontFamily: 'var(--fn)',
            fontSize: 13,
            resize: 'none',
            outline: 'none',
          }}
        />
      );
    }
    return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{node.text || <em style={{ color: 'var(--t3)' }}>Empty text card</em>}</div>;
  }
  if (node.type === 'file') {
    if (entry) {
      return (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{entry.title || '(untitled)'}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{entry.type}{entry.tags?.length ? ` · ${entry.tags.slice(0, 3).map(t => '#' + t).join(' ')}` : ''}</div>
          {entry.notes && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--t2)', maxHeight: 60, overflow: 'hidden' }}>
              {String(entry.notes).slice(0, 160)}{entry.notes.length > 160 ? '…' : ''}
            </div>
          )}
        </div>
      );
    }
    return (
      <div style={{ color: 'var(--t3)', fontStyle: 'italic' }}>
        Missing entry: <code style={{ fontSize: 11 }}>{node.file || '?'}</code>
      </div>
    );
  }
  if (node.type === 'media') {
    return <MediaCardBody path={node.file} />;
  }
  return <div style={{ color: 'var(--t3)' }}>Unknown card type: {node.type}{node._warning ? ` (${node._warning})` : ''}</div>;
}

function MediaCardBody({ path }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    if (!path) { setFailed(true); return undefined; }
    if (!vaultAdapter || typeof vaultAdapter.readBinary !== 'function') {
      setFailed(true);
      return undefined;
    }
    (async () => {
      try {
        const bytes = await vaultAdapter.readBinary(path);
        if (cancelled) return;
        const blob = new Blob([bytes]);
        const url = URL.createObjectURL(blob);
        setSrc(url);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (src) URL.revokeObjectURL(src);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  if (failed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--t3)' }}>
        <div style={{ fontStyle: 'italic' }}>Media unavailable</div>
        <code style={{ fontSize: 11, wordBreak: 'break-all' }}>{path || '(no path)'}</code>
      </div>
    );
  }
  if (!src) return <div style={{ color: 'var(--t3)', fontSize: 12 }}>Loading…</div>;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={src} alt={path} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  );
}
