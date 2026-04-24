import { useState, useEffect, useRef, useCallback } from "react";
import { THEMES } from '../../lib/theme/themes.js';
import { useClickOutside, useSingleOpenDropdown } from './bus.js';

export function themePreview(key,isDark,customColors){
  const t=THEMES[key];
  const palette=isDark&&t.dark?{...t.light,...t.dark}:t.light;
  const cc=customColors?.[key];
  return{
    bg:cc?.bg||palette['--bg']||'#111',
    ac:cc?.ac||palette['--ac']||'#fff',
    tx:cc?.fg||palette['--tx']||palette['--ac']||'#fff',
    fn:palette['--fn']||'system-ui,sans-serif',
    rd:palette['--rd']||'4px',
  };
}

export function ThemeSwatch({k,isDark,customColors,size=24}){
  const p=themePreview(k,isDark,customColors);
  return(
    <span aria-hidden="true"
      style={{width:size,height:size,borderRadius:4,background:p.bg,border:`1.5px solid ${p.ac}`,flexShrink:0,display:'inline-flex',alignItems:'center',justifyContent:'center',fontFamily:p.fn,color:p.tx,fontSize:Math.round(size*0.46),fontWeight:700,lineHeight:1,overflow:'hidden',letterSpacing:-0.5}}>
      Aa
    </span>
  );
}

export function ThemeDropdown({value,onChange,customColors,isDark}){
  const[open,setOpen]=useState(false);
  const[highlight,setHighlight]=useState(-1);
  const rootRef=useRef(null);
  const btnRef=useRef(null);
  const listRef=useRef(null);
  const closeDropdown=useCallback(()=>setOpen(false),[]);
  useClickOutside(rootRef,closeDropdown,open);
  useSingleOpenDropdown(open,closeDropdown);
  const current=THEMES[value];
  const stripEmoji=n=>n.replace(/^\S+\s/,'');
  const keys=Object.keys(THEMES);
  const idx=keys.indexOf(value);

  useEffect(()=>{if(open)setHighlight(idx);else setHighlight(-1)},[open,idx]);
  useEffect(()=>{
    if(!open||highlight<0||!listRef.current)return;
    const el=listRef.current.children[highlight];
    el?.scrollIntoView?.({block:'nearest'});
  },[highlight,open]);

  const pick=(k)=>{onChange(k);setOpen(false);requestAnimationFrame(()=>btnRef.current?.focus?.())};

  const onKey=(e)=>{
    if(e.key==='ArrowDown'){
      e.preventDefault();
      if(open){setHighlight(h=>Math.min(keys.length-1,(h<0?idx:h)+1))}
      else{onChange(keys[(idx+1)%keys.length])}
    }else if(e.key==='ArrowUp'){
      e.preventDefault();
      if(open){setHighlight(h=>Math.max(0,(h<0?idx:h)-1))}
      else{onChange(keys[(idx-1+keys.length)%keys.length])}
    }else if(e.key==='Home'&&open){
      e.preventDefault();setHighlight(0);
    }else if(e.key==='End'&&open){
      e.preventDefault();setHighlight(keys.length-1);
    }else if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      if(open&&highlight>=0)pick(keys[highlight]);
      else setOpen(o=>!o);
    }else if(e.key==='Escape'&&open){
      e.preventDefault();setOpen(false);
    }
  };

  return(
    <div ref={rootRef} style={{position:'relative',marginBottom:10}}>
      <button ref={btnRef} type="button" onClick={()=>setOpen(o=>!o)} onKeyDown={onKey}
        aria-haspopup="listbox" aria-expanded={open}
        style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--tx)',cursor:'pointer',fontFamily:current?.light?.['--fn']||'var(--fn)',fontSize:13,textAlign:'left'}}>
        <ThemeSwatch k={value} isDark={isDark} customColors={customColors} size={24}/>
        <span style={{flex:1}}>{current?stripEmoji(current.name):'Theme'}</span>
        <span style={{fontSize:10,color:'var(--t3)'}}>▼</span>
      </button>
      {open&&<div ref={listRef} role="listbox"
        style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,maxHeight:320,overflowY:'auto',background:'var(--bg)',border:'1px solid var(--br)',borderRadius:'var(--rd)',zIndex:10,boxShadow:'0 8px 24px rgba(0,0,0,0.45)'}}>
        {keys.map((key,i)=>{const t=THEMES[key];const isHi=i===highlight;return(
          <button key={key} type="button" role="option" aria-selected={key===value} onClick={()=>pick(key)} onMouseEnter={()=>setHighlight(i)}
            style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:isHi?'var(--b2)':'transparent',border:'none',borderLeft:`3px solid ${key===value?'var(--ac)':'transparent'}`,color:'var(--tx)',cursor:'pointer',fontFamily:t.light['--fn'],fontSize:13,textAlign:'left'}}>
            <ThemeSwatch k={key} isDark={isDark} customColors={customColors} size={24}/>
            <span>{stripEmoji(t.name)}</span>
          </button>
        )})}
      </div>}
    </div>
  );
}
