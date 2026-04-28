import { TYPES, ICON, LABEL } from '../../lib/types.js';

// ── Empty State ─────────────────────────────────────────────────────────────
// FIX: type buttons now call onAdd(type) — they actually pre-select the type in the modal
export function EmptyState({section,onAdd,hasFilters,onClear,query}){
  const isType=TYPES.includes(section);
  if(hasFilters){
    return(
      <div style={{textAlign:'center',padding:'70px 20px',color:'var(--t3)'}}>
        <div style={{fontSize:44,marginBottom:12}} aria-hidden="true">🔍</div>
        <div style={{fontSize:15,fontWeight:700,marginBottom:4,color:'var(--tx)'}}>No matches</div>
        <div style={{fontSize:13,marginBottom:18}}>
          {query?<>Nothing in your library matches <span style={{color:'var(--ac)'}}>"{query}"</span>.</>:'Nothing matches the current filters.'}
        </div>
        <button onClick={onClear}
          style={{padding:'9px 18px',background:'var(--ac)',color:'var(--act)',border:'1px solid var(--br)',borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13,fontWeight:700}}>
          × Clear filters
        </button>
      </div>
    );
  }
  return(
    <div style={{textAlign:'center',padding:'70px 20px',color:'var(--t3)'}}>
      {isType&&<div style={{fontSize:44,marginBottom:12}} aria-hidden="true">{ICON[section]}</div>}
      <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{isType?`No ${LABEL[section].toLowerCase()} yet`:'Your vault is empty'}</div>
      <div style={{fontSize:13,marginBottom:16}}>
        Press <kbd style={{padding:'2px 6px',border:'1px solid var(--br)',borderRadius:'var(--rd)',fontSize:11,fontFamily:'monospace',background:'var(--b2)'}}>N</kbd> or click + to add an entry.
      </div>
      {!isType&&(
        <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {TYPES.map(t=>(
            <button key={t} onClick={()=>onAdd(t)}
              style={{padding:'6px 12px',border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:12}}>
              {ICON[t]} {LABEL[t]}
            </button>
          ))}
        </div>
      )}
      <button onClick={()=>onAdd(isType?section:undefined)}
        style={{padding:'9px 18px',background:'var(--ac)',color:'var(--act)',border:'1px solid var(--br)',borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13,fontWeight:700}}>
        + {isType?`Add ${LABEL[section].slice(0,-1)}`:'New Entry'}
      </button>
    </div>
  );
}
