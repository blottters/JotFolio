import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSingleOpenDropdown } from './bus.js';

// Generic themed dropdown. Replaces native <select> for all status/sort pickers
// so theme colors apply and options stay readable on any theme.
export function Select({value,onChange,options,placeholder,ariaLabel,width}){
  const[open,setOpen]=useState(false);
  const[highlight,setHighlight]=useState(-1);
  const[menuRect,setMenuRect]=useState(null);
  const rootRef=useRef(null);
  const btnRef=useRef(null);
  const listRef=useRef(null);
  const closeDropdown=useCallback(()=>setOpen(false),[]);
  useSingleOpenDropdown(open,closeDropdown);
  const syncMenuRect=useCallback(()=>{
    const rect=btnRef.current?.getBoundingClientRect?.();
    if(!rect)return;
    setMenuRect({top:rect.bottom+4,left:rect.left,width:rect.width});
  },[]);
  const idx=options.findIndex(o=>(o.value??o)===value);
  useEffect(()=>{if(open)setHighlight(idx);else setHighlight(-1)},[open,idx]);
  useEffect(()=>{
    if(!open)return;
    syncMenuRect();
    const onDocMouseDown=e=>{
      const target=e.target;
      if(rootRef.current?.contains(target)||listRef.current?.contains(target))return;
      closeDropdown();
    };
    const onViewportChange=()=>syncMenuRect();
    document.addEventListener('mousedown',onDocMouseDown);
    window.addEventListener('resize',onViewportChange);
    window.addEventListener('scroll',onViewportChange,true);
    return()=>{
      document.removeEventListener('mousedown',onDocMouseDown);
      window.removeEventListener('resize',onViewportChange);
      window.removeEventListener('scroll',onViewportChange,true);
    };
  },[open,closeDropdown,syncMenuRect]);
  useEffect(()=>{if(!open||highlight<0||!listRef.current)return;listRef.current.children[highlight]?.scrollIntoView?.({block:'nearest'})},[highlight,open]);
  const pick=(v)=>{onChange(v);setOpen(false);requestAnimationFrame(()=>btnRef.current?.focus?.())};
  const onKey=(e)=>{
    if(e.key==='ArrowDown'){e.preventDefault();if(open)setHighlight(h=>Math.min(options.length-1,(h<0?idx:h)+1));else setOpen(true)}
    else if(e.key==='ArrowUp'){e.preventDefault();if(open)setHighlight(h=>Math.max(0,(h<0?idx:h)-1))}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(open&&highlight>=0)pick(options[highlight].value??options[highlight]);else setOpen(o=>!o)}
    else if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();setOpen(false)}
  };
  const current=options.find(o=>(o.value??o)===value);
  const label=current?(current.label??current):(placeholder||'Select…');
  return(
    <div ref={rootRef} style={{position:'relative',width:width||'100%'}}>
      <button ref={btnRef} type="button" onClick={()=>setOpen(o=>!o)} onKeyDown={onKey}
        aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--tx)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13,textAlign:'left'}}>
        <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
        <span style={{fontSize:10,color:'var(--t3)',flexShrink:0}}>▼</span>
      </button>
      {open&&menuRect&&createPortal(<div ref={listRef} role="listbox"
        style={{position:'fixed',top:menuRect.top,left:menuRect.left,width:menuRect.width,maxHeight:280,overflowY:'auto',background:'var(--bg)',border:'1px solid var(--br)',borderRadius:'var(--rd)',zIndex:1000,boxShadow:'0 8px 24px rgba(0,0,0,0.45)'}}>
        {options.map((o,i)=>{const v=o.value??o;const lbl=o.label??o;const isHi=i===highlight;return(
          <button key={String(v)+i} type="button" role="option" aria-selected={v===value} onClick={()=>pick(v)} onMouseEnter={()=>setHighlight(i)}
            style={{width:'100%',display:'flex',alignItems:'center',padding:'8px 10px',background:isHi?'var(--b2)':'transparent',border:'none',borderLeft:`3px solid ${v===value?'var(--ac)':'transparent'}`,color:'var(--tx)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13,textAlign:'left'}}>
            {lbl}
          </button>
        )})}
      </div>,document.body)}
    </div>
  );
}
