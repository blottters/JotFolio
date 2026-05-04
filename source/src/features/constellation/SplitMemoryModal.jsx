import { useState, useId, useRef, useEffect, useMemo } from 'react';
import { useEscapeKey, useAutoFocus } from '../../lib/hooks.js';
import { ICON, LABEL } from '../../lib/types.js';

// ── Split Memory Modal ────────────────────────────────────────────────────
// Phase 5: text-wizard split UI. Visual drag allocation deferred to alpha.20+.
// Step 1: pick number of children. Step 2: name + assign sources via checkbox.
// Caller resolves originalSources from manifest/provenance and persists onSubmit.
export function SplitMemoryModal({ original, originalSources = [], onClose, onSubmit }){
  const [step, setStep] = useState(1);
  const [count, setCount] = useState(2);
  const [splits, setSplits] = useState([]);
  const [showErrors, setShowErrors] = useState(false);
  const titleId = useId();
  const countInputId = useId();
  const firstFieldRef = useRef(null);

  useEscapeKey(true, () => onClose());
  useAutoFocus(firstFieldRef);

  // Build the per-split state when entering step 2 (or when count changes)
  useEffect(() => {
    if (step !== 2) return;
    setSplits(prev => {
      const next = [];
      for (let i = 0; i < count; i++){
        const existing = prev[i];
        next.push({
          title: existing?.title ?? `${original?.title || 'Memory'} - part ${i+1}`,
          sourceIds: existing?.sourceIds ?? [],
        });
      }
      return next;
    });
  }, [step, count, original]);

  const advance = () => {
    const n = Math.max(2, Math.min(10, parseInt(count, 10) || 2));
    setCount(n);
    setStep(2);
    setShowErrors(false);
  };

  const back = () => { setStep(1); setShowErrors(false); };

  const setSplitTitle = (idx, value) => {
    setSplits(prev => prev.map((s, i) => i === idx ? { ...s, title: value } : s));
  };

  const toggleSource = (idx, sourceId) => {
    setSplits(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const has = s.sourceIds.includes(sourceId);
      return { ...s, sourceIds: has ? s.sourceIds.filter(x => x !== sourceId) : [...s.sourceIds, sourceId] };
    }));
  };

  const errors = useMemo(() => {
    const errs = splits.map(s => ({
      title: !s.title || !s.title.trim(),
      sources: s.sourceIds.length === 0,
    }));
    const anyAssigned = splits.some(s => s.sourceIds.length > 0);
    return { perSplit: errs, anyAssigned };
  }, [splits]);

  const isValid = splits.length > 0
    && errors.perSplit.every(e => !e.title && !e.sources)
    && errors.anyAssigned;

  const submit = () => {
    if (!isValid) { setShowErrors(true); return; }
    const out = splits.map(s => ({ title: s.title.trim(), sourceIds: [...s.sourceIds] }));
    onSubmit(out);
    onClose();
  };

  const onBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  // ── styles ──────────────────────────────────────────────────────────
  const backdrop = { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' };
  const modal = { background:'var(--cd)', border:'2px solid var(--br)', borderRadius:'var(--rd)', width:'min(720px,95vw)', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden', boxSizing:'border-box', color:'var(--tx)', fontFamily:'var(--fn)' };
  const header = { display:'flex', alignItems:'center', padding:'18px 22px 12px', borderBottom:'1px solid var(--br)', flexShrink:0 };
  const body = { overflowY:'auto', padding:'16px 22px', minHeight:0, flex:1 };
  const footer = { padding:'12px 22px 18px', borderTop:'1px solid var(--br)', display:'flex', gap:8, justifyContent:'flex-end', flexShrink:0, background:'var(--bg)' };
  const labelStyle = { fontSize:12, fontWeight:700, color:'var(--t3)', marginBottom:4, display:'block' };
  const input = { padding:'8px 10px', background:'var(--b2)', border:'1px solid var(--br)', borderRadius:'var(--rd)', color:'var(--tx)', fontFamily:'var(--fn)', fontSize:13, outline:'none', boxSizing:'border-box', width:'100%' };
  const btn = { padding:'8px 14px', borderRadius:'var(--rd)', cursor:'pointer', fontFamily:'var(--fn)', fontSize:13, border:'1px solid var(--br)' };
  const cancelBtn = { ...btn, background:'var(--b2)', color:'var(--t2)' };
  const primaryBtn = { ...btn, background:'var(--ac)', color:'var(--act)', border:'none', fontWeight:700 };
  const ghostBtn = { ...btn, background:'transparent', color:'var(--t2)' };
  const countBtnBase = (active) => ({
    padding:'14px 18px', minWidth:64, fontSize:18, fontWeight:700,
    border: active ? '2px solid var(--ac)' : '2px solid var(--br)',
    background: active ? 'var(--ac)' : 'transparent',
    color: active ? 'var(--act)' : 'var(--tx)',
    borderRadius:'var(--rd)', cursor:'pointer', fontFamily:'var(--fn)'
  });
  const sourceRow = { display:'flex', alignItems:'center', gap:6, padding:'4px 6px', borderRadius:6, fontSize:12, cursor:'pointer' };
  const chip = { padding:'1px 6px', borderRadius:8, background:'var(--b2)', border:'1px solid var(--br)', color:'var(--t3)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.4 };
  const errText = { fontSize:11, color:'#ef4444', marginTop:4 };
  const colWrap = { border:'1px solid var(--br)', borderRadius:'var(--rd)', padding:'10px 12px', background:'var(--bg)', display:'flex', flexDirection:'column', gap:8, minWidth:0 };

  // ── render ──────────────────────────────────────────────────────────
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onBackdrop} style={backdrop}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={header}>
          <h3 id={titleId} style={{ margin:0, fontSize:15, fontWeight:700 }}>
            Split "{original?.title || 'memory'}" into smaller memories
          </h3>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ marginLeft:'auto', background:'transparent', border:'none', color:'var(--t2)', fontSize:22, cursor:'pointer', lineHeight:1, padding:'2px 8px' }}>
            ×
          </button>
        </div>

        {step === 1 && (
          <div style={body}>
            <p style={{ margin:'0 0 10px', fontSize:13, color:'var(--t2)' }}>
              How many smaller memories?
            </p>
            <p style={{ margin:'0 0 16px', fontSize:11, color:'var(--t3)', lineHeight:1.5 }}>
              You'll name each child memory and assign which original sources go into it. A source can be used in more than one child if needed.
            </p>
            <div role="radiogroup" aria-label="Number of splits" style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
              {[2,3,4].map(n => (
                <button key={n} type="button" role="radio" aria-checked={count === n}
                  ref={n === 2 ? firstFieldRef : undefined}
                  onClick={() => setCount(n)} style={countBtnBase(count === n)}>
                  {n}
                </button>
              ))}
            </div>
            <div style={{ marginBottom:6 }}>
              <label htmlFor={countInputId} style={labelStyle}>Or pick a custom count (2–10)</label>
              <input id={countInputId} type="number" min={2} max={10} value={count}
                onChange={e => setCount(Math.max(2, Math.min(10, parseInt(e.target.value, 10) || 2)))}
                style={{ ...input, width:120 }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={body}>
            <p style={{ margin:'0 0 6px', fontSize:12, color:'var(--t2)' }}>
              Name each child memory and tick the sources that belong in it.
            </p>
            <p style={{ margin:'0 0 14px', fontSize:11, color:'var(--t3)' }}>
              Each source typically goes in one split, but assigning to multiple is allowed.
            </p>
            {originalSources.length === 0 && (
              <div role="alert" style={{ marginBottom:12, padding:'8px 10px', border:'1px solid #f59e0b', borderRadius:'var(--rd)', background:'rgba(245,158,11,0.1)', fontSize:12 }}>
                This memory has no recorded sources. Splits need at least one source each.
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(splits.length, 2)}, minmax(0, 1fr))`, gap:12 }}>
              {splits.map((split, idx) => {
                const err = errors.perSplit[idx] || { title:false, sources:false };
                const titleInputId = `split-title-${idx}`;
                return (
                  <div key={idx} style={colWrap}>
                    <div style={{ fontSize:11, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>
                      Part {idx+1}
                    </div>
                    <div>
                      <label htmlFor={titleInputId} style={labelStyle}>Title</label>
                      <input id={titleInputId}
                        ref={idx === 0 ? firstFieldRef : undefined}
                        style={{ ...input, borderColor: showErrors && err.title ? '#ef4444' : 'var(--br)' }}
                        value={split.title}
                        onChange={e => setSplitTitle(idx, e.target.value)}
                        placeholder="Child memory title" />
                      {showErrors && err.title && (
                        <div style={errText}>Title is required.</div>
                      )}
                    </div>
                    <div>
                      <div style={{ ...labelStyle, marginBottom:6 }}>Sources for this split</div>
                      {originalSources.length === 0 ? (
                        <div style={{ fontSize:11, color:'var(--t3)', fontStyle:'italic' }}>No sources available.</div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:2, maxHeight:220, overflowY:'auto' }}>
                          {originalSources.map(src => {
                            const checked = split.sourceIds.includes(src.id);
                            return (
                              <label key={src.id} style={sourceRow}>
                                <input type="checkbox" checked={checked}
                                  onChange={() => toggleSource(idx, src.id)}
                                  aria-label={`Assign ${src.title || src.id} to part ${idx+1}`} />
                                <span style={{ flex:1, color:'var(--tx)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {src.title || src.id}
                                </span>
                                <span style={chip}>{ICON[src.type] || ''} {LABEL[src.type] || src.type || 'entry'}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {showErrors && err.sources && (
                        <div style={errText}>Assign at least one source.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {showErrors && !errors.anyAssigned && (
              <div role="alert" style={{ marginTop:10, fontSize:12, color:'#ef4444' }}>
                At least one source must be assigned to a split.
              </div>
            )}
          </div>
        )}

        <div style={footer}>
          <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
          {step === 2 && (
            <button type="button" onClick={back} style={ghostBtn}>Back</button>
          )}
          {step === 1 ? (
            <button type="button" onClick={advance} style={primaryBtn}>Continue</button>
          ) : (
            <button type="button" onClick={submit}
              aria-disabled={!isValid}
              style={{ ...primaryBtn, opacity: isValid ? 1 : 0.6 }}>
              Apply split
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
