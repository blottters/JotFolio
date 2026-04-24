import { useState } from "react";
import { ICON, statusTone, statusBg } from '../../lib/types.js';
import { formatDate } from '../../lib/storage.js';

export function Row({entry,prefs,onStar,onOpen}){
  const color=statusTone(entry.status);
  const displayDate=entry.entry_date||entry.date?.slice(0,10);
  const[hover,setHover]=useState(false);
  return(
    <article className="mgn-card" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{background:'var(--cd)',border:`1px solid ${hover?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rd)',padding:'10px 14px',display:'flex',alignItems:'center',gap:12,transition:'border-color 0.12s'}}>
      <button type="button" onClick={onOpen} aria-label={`Open ${entry.title||'untitled entry'}`}
        style={{all:'unset',cursor:'pointer',flex:1,minWidth:0,display:'flex',alignItems:'center',gap:12,color:'var(--tx)',fontFamily:'var(--fn)',textAlign:'left'}}>
        <span aria-hidden="true" style={{fontSize:16,flexShrink:0}}>{ICON[entry.type]}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.title||<i style={{color:'var(--t3)'}}>Untitled</i>}</div>
          {prefs?.showNotesPreview!==false&&entry.notes&&<div style={{fontSize:11,color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>{entry.notes}</div>}
          {prefs?.showTagsOnCards!==false&&entry.tags?.length>0&&<div style={{display:'flex',gap:4,marginTop:3}}>{entry.tags.slice(0,5).map(t=><span key={t} style={{fontSize:10,padding:'1px 6px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:99,color:'var(--t3)'}}>{t}</span>)}</div>}
        </div>
      </button>
      {entry.status&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:statusBg(color),color,fontWeight:600,flexShrink:0}}>{entry.status}</span>}
      {prefs?.showDateOnCards!==false&&<span style={{fontSize:11,color:'var(--t3)',flexShrink:0,whiteSpace:'nowrap'}}>{formatDate(displayDate)}</span>}
      <button type="button" onClick={onStar} aria-label={entry.starred?'Unstar entry':'Star entry'} aria-pressed={!!entry.starred}
        style={{background:'none',border:'none',cursor:'pointer',padding:4,fontSize:18,color:entry.starred?'#f59e0b':'var(--t3)',flexShrink:0}}>{entry.starred?'★':'☆'}</button>
    </article>
  );
}
