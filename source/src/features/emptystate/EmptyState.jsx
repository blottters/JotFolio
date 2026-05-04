import { ALL_ENTRY_TYPES, ICON, LABEL } from '../../lib/types.js';

// ── Empty State ─────────────────────────────────────────────────────────────
// FIX: type buttons now call onAdd(type) — they actually pre-select the type in the modal
const KNOWLEDGE_FLAG_MAP={raw:'raw_inbox',wiki:'wiki_mode',review:'review_queue'};
export function EmptyState({section,onAdd,hasFilters,onClear,query,flags={}}){
  const visibleEntryTypes=ALL_ENTRY_TYPES.filter(t=>!KNOWLEDGE_FLAG_MAP[t]||flags[KNOWLEDGE_FLAG_MAP[t]]===true);
  const knowledgeOn=flags.raw_inbox===true||flags.wiki_mode===true||flags.review_queue===true;
  const isType=ALL_ENTRY_TYPES.includes(section);
  if(hasFilters){
    return(
      <div style={{textAlign:'center',padding:'70px 20px',color:'var(--t3)'}}>
        <div style={{fontSize:44,marginBottom:12}} aria-hidden="true">🔍</div>
        <div style={{fontSize:15,fontWeight:700,marginBottom:4,color:'var(--tx)'}}>No matches</div>
        <div style={{fontSize:13,marginBottom:18}}>
          {query?<>No entries match <span style={{color:'var(--ac)'}}>"{query}"</span>.</>:'No entries match the current filters.'}
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
      <div style={{fontSize:13,marginBottom:16,lineHeight:1.5}}>
        Entries are the core objects in JotFolio. A note, media item, journal, or link{knowledgeOn?', inbox capture, wiki note, or review item':''} is one entry in your vault.
        Press <kbd style={{padding:'2px 6px',border:'1px solid var(--br)',borderRadius:'var(--rd)',fontSize:11,fontFamily:'monospace',background:'var(--b2)',marginLeft:4}}>N</kbd> or click + to add one.
      </div>
      {!isType&&(
        <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {visibleEntryTypes.map(t=>(
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
