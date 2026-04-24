import { useState, useRef, useCallback } from "react";
import { FONTS } from '../../lib/theme/themes.js';
import { useClickOutside, useSingleOpenDropdown } from './bus.js';

export function FontDropdown({value,onChange}){
  const[open,setOpen]=useState(false);
  const rootRef=useRef(null);
  const closeDropdown=useCallback(()=>setOpen(false),[]);
  useClickOutside(rootRef,closeDropdown,open);
  useSingleOpenDropdown(open,closeDropdown);
  const current=FONTS.find(f=>f.stack===value);
  return(
    <div ref={rootRef} style={{position:'relative'}}>
      <button type="button" onClick={()=>setOpen(o=>!o)} aria-haspopup="listbox" aria-expanded={open}
        style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--tx)',cursor:'pointer',fontSize:13,textAlign:'left',fontFamily:value||'var(--fn)'}}>
        <span style={{flex:1}}>{current?current.label:'Theme default'}</span>
        <span style={{fontSize:10,color:'var(--t3)'}}>▼</span>
      </button>
      {open&&<div role="listbox"
        style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,maxHeight:320,overflowY:'auto',background:'var(--bg)',border:'1px solid var(--br)',borderRadius:'var(--rd)',zIndex:10,boxShadow:'0 8px 24px rgba(0,0,0,0.45)'}}>
        <button type="button" role="option" aria-selected={!value} onClick={()=>{onChange('');setOpen(false)}}
          style={{width:'100%',display:'flex',alignItems:'center',padding:'9px 12px',background:!value?'var(--b2)':'transparent',border:'none',borderLeft:`3px solid ${!value?'var(--ac)':'transparent'}`,color:'var(--t2)',cursor:'pointer',fontSize:13,textAlign:'left',fontStyle:'italic'}}>
          Theme default
        </button>
        {FONTS.map(f=>(
          <button key={f.label} type="button" role="option" aria-selected={f.stack===value} onClick={()=>{onChange(f.stack);setOpen(false)}}
            style={{width:'100%',display:'flex',alignItems:'center',padding:'9px 12px',background:f.stack===value?'var(--b2)':'transparent',border:'none',borderLeft:`3px solid ${f.stack===value?'var(--ac)':'transparent'}`,color:'var(--tx)',cursor:'pointer',fontFamily:f.stack,fontSize:15,textAlign:'left'}}>
            {f.label}
          </button>
        ))}
      </div>}
    </div>
  );
}
