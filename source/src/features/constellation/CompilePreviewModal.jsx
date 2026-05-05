import { useId, useRef, useMemo } from 'react';
import { useEscapeKey, useAutoFocus } from '../../lib/hooks.js';
import { ICON, LABEL } from '../../lib/types.js';

// ── Compile Preview Modal ────────────────────────────────────────────────
// Phase 4 surface: shows what compile() produced before the caller persists
// it. Caller already ran compile() and resolved sourceEntries from the vault;
// this component only renders + relays accept/cancel intent.
const BLOCKING_WARNING_CODES = new Set(['canonical-collision-handauthored']);
const AMBER_WARNING_CODES = new Set(['single-source', 'no-canonical-key', 'mixed-types']);

export function CompilePreviewModal({ result, sourceEntries = [], onClose, onAccept }){
  const titleId = useId();
  const primaryRef = useRef(null);
  useEscapeKey(true, () => onClose());
  useAutoFocus(primaryRef);

  const confidencePct = Math.round((result?.confidence ?? 0) * 100);
  const emitted = result?.emitted || 'review';
  const warnings = result?.warnings || [];
  const blockingWarning = useMemo(
    () => warnings.find(w => BLOCKING_WARNING_CODES.has(w.code)),
    [warnings]
  );

  // Map provided sourceEntries by id, then walk result.sources in-order so
  // the rendered list matches compile's source ordering. Missing ids surface
  // as explicit "Source missing" rows so the user can see a vault gap.
  const sourcesView = useMemo(() => {
    const byId = new Map(sourceEntries.map(e => [e.id, e]));
    return (result?.sources || []).map(src => {
      const resolved = byId.get(src.id);
      return resolved
        ? { kind: 'resolved', id: src.id, entry: resolved }
        : { kind: 'missing', id: src.id };
    });
  }, [result, sourceEntries]);

  const onBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const handleAccept = () => {
    if (blockingWarning) return;
    onAccept(result.entry);
    onClose();
  };

  let primaryLabel;
  if (emitted === 'wiki') primaryLabel = 'Save as wiki entry';
  else primaryLabel = 'Save as review entry';

  // ── styles ──────────────────────────────────────────────────────────
  const backdrop = { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' };
  const modal = { background:'var(--cd)', border:'2px solid var(--br)', borderRadius:'var(--rd)', width:'min(720px,95vw)', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden', boxSizing:'border-box', color:'var(--tx)', fontFamily:'var(--fn)' };
  const header = { display:'flex', alignItems:'center', gap:10, padding:'18px 22px 12px', borderBottom:'1px solid var(--br)', flexShrink:0 };
  const body = { overflowY:'auto', padding:'16px 22px', minHeight:0, flex:1, display:'flex', flexDirection:'column', gap:18 };
  const footer = { padding:'12px 22px 18px', borderTop:'1px solid var(--br)', display:'flex', gap:8, justifyContent:'flex-end', flexShrink:0, background:'var(--bg)', alignItems:'center' };
  const sectionLabel = { fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6, display:'block' };
  const btn = { padding:'8px 14px', borderRadius:'var(--rd)', cursor:'pointer', fontFamily:'var(--fn)', fontSize:13, border:'1px solid var(--br)' };
  const cancelBtn = { ...btn, background:'transparent', color:'var(--t2)' };
  const primaryBtnBase = { ...btn, background:'var(--ac)', color:'var(--act)', border:'none', fontWeight:700 };

  const typeChipBg = emitted === 'wiki' ? 'var(--ac)' : 'var(--b2)';
  const typeChipFg = emitted === 'wiki' ? 'var(--act)' : 'var(--tx)';
  const typeChip = {
    padding:'2px 8px', borderRadius:'var(--rd)', background: typeChipBg, color: typeChipFg,
    fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5,
    border:'1px solid var(--br)'
  };
  const confidenceBadge = {
    padding:'2px 8px', borderRadius:'var(--rd)', background:'var(--b2)', color:'var(--t2)',
    fontSize:11, fontWeight:700, border:'1px solid var(--br)'
  };

  const pre = {
    margin:0, padding:'12px 14px', background:'var(--sb)', color:'var(--tx)',
    border:'1px solid var(--br)', borderRadius:'var(--rd)',
    fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize:12, lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word',
    maxHeight:280, overflowY:'auto'
  };

  const sourceRow = {
    display:'flex', alignItems:'center', gap:8, padding:'6px 8px',
    border:'1px solid var(--br)', borderRadius:'var(--rd)', background:'var(--bg)',
    fontSize:12
  };
  const typeChipSmall = {
    padding:'1px 6px', borderRadius:'var(--rd)', background:'var(--b2)',
    border:'1px solid var(--br)', color:'var(--t3)',
    fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.4
  };
  const idMono = {
    fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize:10, color:'var(--t3)'
  };

  const warnRowBase = {
    padding:'8px 10px', border:'1px solid var(--br)', borderRadius:'var(--rd)',
    background:'var(--bg)', display:'flex', flexDirection:'column', gap:4, fontSize:12
  };
  function severityChip(code){
    let bg, fg, label;
    if (BLOCKING_WARNING_CODES.has(code)) { bg = 'var(--err)'; fg = '#fff'; label = 'Blocking'; }
    else if (AMBER_WARNING_CODES.has(code)) { bg = '#f59e0b'; fg = '#1a1a1a'; label = 'Warning'; }
    else { bg = 'var(--b2)'; fg = 'var(--t2)'; label = 'Note'; }
    return {
      style: {
        alignSelf:'flex-start',
        padding:'1px 6px', borderRadius:'var(--rd)',
        background: bg, color: fg, border:'1px solid var(--br)',
        fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.4
      },
      label,
    };
  }

  const rationaleLine = { fontSize:11, color:'var(--t3)', margin:0, lineHeight:1.6 };

  const compiledHash = result?.compiledHash || '';
  const hashShort = compiledHash ? `${compiledHash.slice(0, 12)}...` : '(none)';
  const compilerName = result?.compiler?.name || 'unknown';
  const compilerVersion = result?.compiler?.version || '0.0.0';
  const notes = result?.entry?.notes ?? '';

  const blockedTooltip = blockingWarning
    ? `Cannot save: ${blockingWarning.message || 'a hand-authored entry already owns this canonical key.'}`
    : undefined;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onBackdrop} style={backdrop}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={header}>
          <h3 id={titleId} style={{ margin:0, fontSize:15, fontWeight:700, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            Compile preview: {result?.entry?.title || '(untitled)'}
          </h3>
          <span data-testid="type-chip" style={typeChip}>{emitted}</span>
          <span data-testid="confidence-badge" style={confidenceBadge}>{confidencePct}%</span>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ background:'transparent', border:'none', color:'var(--t2)', fontSize:22, cursor:'pointer', lineHeight:1, padding:'2px 8px' }}>
            ×
          </button>
        </div>

        <div style={body}>
          <section>
            <span style={sectionLabel}>What this memory will contain</span>
            <pre data-testid="compiled-body" style={pre}>{notes}</pre>
          </section>

          <section>
            <span style={sectionLabel}>Sources synthesized</span>
            {sourcesView.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--t3)', fontStyle:'italic' }}>No sources recorded.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {sourcesView.map(s => {
                  if (s.kind === 'missing') {
                    return (
                      <div key={`missing-${s.id}`} role="listitem" style={{ ...sourceRow, borderColor:'var(--err)', color:'var(--err)' }}>
                        <span style={{ flex:1 }}>Source missing: {s.id}</span>
                      </div>
                    );
                  }
                  const e = s.entry;
                  return (
                    <div key={s.id} role="listitem" style={sourceRow}>
                      <span style={{ flex:1, color:'var(--tx)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {e.title || e.id}
                      </span>
                      <span style={typeChipSmall}>{ICON[e.type] || ''} {LABEL[e.type] || e.type || 'entry'}</span>
                      <span style={idMono}>{s.id}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <span style={sectionLabel}>Warnings</span>
            {warnings.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--t3)' }}>No warnings — clean compile.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {warnings.map((w, i) => {
                  const sev = severityChip(w.code);
                  return (
                    <div key={`${w.code}-${i}`} role="listitem" style={warnRowBase}>
                      <span style={sev.style}>{sev.label}: {w.code}</span>
                      <span style={{ color:'var(--tx)' }}>{w.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <span style={sectionLabel}>Decision rationale</span>
            <p style={rationaleLine}>Emitted as: {emitted}</p>
            <p style={rationaleLine}>Confidence: {confidencePct}% (threshold for wiki: 70%)</p>
            <p style={rationaleLine}>Hash: {hashShort}</p>
            <p style={rationaleLine}>Compiler: {compilerName} v{compilerVersion}</p>
          </section>
        </div>

        <div style={footer}>
          <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
          <button
            type="button"
            ref={primaryRef}
            onClick={handleAccept}
            disabled={!!blockingWarning}
            aria-disabled={!!blockingWarning}
            title={blockedTooltip}
            style={{
              ...primaryBtnBase,
              opacity: blockingWarning ? 0.5 : 1,
              cursor: blockingWarning ? 'not-allowed' : 'pointer',
            }}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
