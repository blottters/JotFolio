import { useState, useEffect } from "react";

export function HexInput({value,onCommit}){
  const[draft,setDraft]=useState((value||'').toUpperCase());
  useEffect(()=>{setDraft((value||'').toUpperCase())},[value]);
  const commit=()=>{
    let v=draft.trim().replace(/^#?/,'#');
    if(/^#[0-9a-fA-F]{3}$/.test(v)){const h=v.slice(1);v='#'+h[0]+h[0]+h[1]+h[1]+h[2]+h[2]}
    if(/^#[0-9a-fA-F]{6}$/.test(v)){onCommit(v.toUpperCase())}else{setDraft((value||'').toUpperCase())}
  };
  return(
    <input type="text" value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e=>{if(e.key==='Enter'){e.target.blur()}else if(e.key==='Escape'){setDraft((value||'').toUpperCase());e.target.blur()}}}
      spellCheck={false} maxLength={7}
      style={{fontSize:11,color:'var(--t3)',fontFamily:'monospace',background:'var(--b2)',padding:'3px 8px',borderRadius:'var(--rd)',width:76,textAlign:'center',border:'1px solid var(--br)',outline:'none'}}/>
  );
}
