import { useState } from "react";
import { ICON, statusTone, statusBg } from '../../lib/types.js';
import { formatDate } from '../../lib/storage.js';

// ── Card / Row ─────────────────────────────────────────────────────────────
// FIX: removed className="mgn-card-body" — it was an orphan never referenced in any CSS rule
export function Card({entry,prefs,onStar,onOpen}){
  const color=statusTone(entry.status);
  const displayDate=entry.entry_date||entry.date?.slice(0,10);
  const dp={compact:{p:'10px 12px',pt:'10px 12px 0',pb:'0 12px 10px',clamp:1,gap:4},comfortable:{p:'14px',pt:'14px 14px 0',pb:'0 14px 14px',clamp:2,gap:8},spacious:{p:'18px',pt:'18px 18px 0',pb:'0 18px 18px',clamp:3,gap:10}};
  const d=dp[prefs?.cardDensity]||dp.comfortable;
  const[hover,setHover]=useState(false);
  return(
    <article className="mgn-card" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{background:'var(--cd)',border:`1px solid ${hover?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rd)',display:'flex',flexDirection:'column',transform:hover?'translateY(-1px)':'none',transition:'transform 0.12s, border-color 0.12s'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:d.pt}}>
        <span aria-hidden="true" style={{fontSize:12}}>{ICON[entry.type]}</span>
        <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--t3)'}}>{entry.type}</span>
        {entry.status&&<span style={{marginLeft:'auto',fontSize:10,padding:'2px 7px',borderRadius:99,background:statusBg(color),color,fontWeight:700}}>{entry.status}</span>}
        <button type="button" onClick={onStar} aria-label={entry.starred?'Unstar entry':'Star entry'} aria-pressed={!!entry.starred} title={entry.starred?'Unstar':'Star'}
          style={{background:'none',border:'none',cursor:'pointer',padding:4,fontSize:18,color:entry.starred?'#f59e0b':'var(--t3)',marginLeft:entry.status?0:'auto',flexShrink:0}}>
          {entry.starred?'★':'☆'}
        </button>
      </div>
      <button type="button" onClick={onOpen} aria-label={`Open ${entry.title||'untitled entry'}`}
        style={{all:'unset',cursor:'pointer',padding:`8px ${d.p.split(' ').pop()}`,display:'flex',flexDirection:'column',gap:d.gap,flex:1,color:'var(--tx)',fontFamily:'var(--fn)',textAlign:'left',boxSizing:'border-box'}}>
        <div style={{fontWeight:700,fontSize:14,lineHeight:1.3,display:'-webkit-box',WebkitLineClamp:d.clamp,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {entry.title||<span style={{color:'var(--t3)',fontStyle:'italic',fontWeight:400}}>Untitled</span>}
        </div>
        {prefs?.showNotesPreview!==false&&entry.notes&&<div style={{fontSize:12,color:'var(--t3)',display:'-webkit-box',WebkitLineClamp:d.clamp,WebkitBoxOrient:'vertical',overflow:'hidden',lineHeight:1.4}}>{entry.notes}</div>}
        {prefs?.showTagsOnCards!==false&&entry.tags?.length>0&&<div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {entry.tags.slice(0,3).map(t=><span key={t} style={{fontSize:10,padding:'2px 6px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:99,color:'var(--t2)'}}>{t}</span>)}
          {entry.tags.length>3&&<span style={{fontSize:10,color:'var(--t3)'}}>+{entry.tags.length-3}</span>}
        </div>}
      </button>
      {prefs?.showDateOnCards!==false&&<div style={{padding:d.pb}}>
        <span style={{fontSize:11,color:'var(--t3)'}}>{formatDate(displayDate)}</span>
      </div>}
    </article>
  );
}
