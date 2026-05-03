import { TYPES, ICON, LABEL } from '../../lib/types.js';
import { Pressable } from '../primitives/Pressable.jsx';

// ── Sidebar ────────────────────────────────────────────────────────────────
export function Sidebar({open,width,onToggle,section,setSection,counts,allTags,tagCounts,filterTag,setFilterTag,theme,setTheme,darkMode,setDarkMode,isDark,onAdd,onExportJSON,onExportMD,victoryColors,setVictoryColors,onOpenSettings,bases=[],onSelectBase,onNewBase,canvases=[],onSelectCanvas,onNewCanvas,pluginPanelsSlot}){
  return(
    <aside className="mgn-sb" style={{width,background:'var(--sb)',borderRight:'1px solid var(--br)',display:'flex',flexDirection:'column',flexShrink:0,transition:'width 0.2s',overflow:'hidden',zIndex:10}}>
      <Pressable onPress={onToggle} ariaLabel={open?'Collapse sidebar':'Expand sidebar'}
        style={{padding:'14px 12px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',gap:8,cursor:'pointer',flexShrink:0,userSelect:'none'}}>
        <span style={{fontSize:18,flexShrink:0}}>📚</span>
        {open&&<span style={{fontWeight:700,fontSize:15,color:'var(--ac)',whiteSpace:'nowrap',letterSpacing:-0.3}}>JotFolio</span>}
        <span style={{marginLeft:'auto',fontSize:11,opacity:.4,flexShrink:0}}>{open?'‹':'›'}</span>
      </Pressable>
      <div style={{padding:'10px 8px 6px',flexShrink:0}}>
        <button className="mgn-btn-acc" onClick={()=>onAdd()} aria-label="New entry (N)" title="New entry — press N"
          style={{width:'100%',padding:open?'9px 14px':'9px',background:'var(--ac)',color:'var(--act)',border:'1px solid var(--br)',borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:open?'flex-start':'center',gap:6}}>
          <span style={{fontSize:16,lineHeight:1}}>+</span>{open&&<span>New Entry</span>}
        </button>
      </div>
      <nav style={{flex:1,overflowY:'auto',padding:'0 8px 8px'}}>
        {open?<NavHeader>Library</NavHeader>:<div style={{height:8}}/>}
        <NavItem icon="◈" label="All Entries" count={counts.all} active={section==='all'} open={open} onClick={()=>setSection('all')}/>
        <NavItem icon="★" label="Starred" count={counts.starred} active={section==='starred'} open={open} onClick={()=>setSection('starred')}/>
        <NavItem icon="✦" label="Constellation" count={counts.links} active={section==='graph'} open={open} onClick={()=>setSection('graph')}/>
        {open?<NavHeader>Media</NavHeader>:<div style={{height:1,background:'var(--br)',margin:'8px 6px'}}/>}
        {TYPES.map(t=><NavItem key={t} icon={ICON[t]} label={LABEL[t]} count={counts[t]} active={section===t} open={open} onClick={()=>setSection(t)}/>)}
        {open&&allTags.length>0&&<>
          <NavHeader>Tags</NavHeader>
          {allTags.slice(0,14).map(t=>(
            <Pressable key={t} onPress={()=>setFilterTag(filterTag===t?'':t)} ariaLabel={`Filter by tag ${t}`} ariaPressed={filterTag===t}
              style={{padding:'5px 8px',cursor:'pointer',borderRadius:'var(--rd)',fontSize:12,color:filterTag===t?'var(--ac)':'var(--t2)',background:filterTag===t?'var(--b2)':'transparent',display:'flex',justifyContent:'space-between',alignItems:'center',overflow:'hidden'}}>
              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>#{t}</span>
              <span style={{fontSize:10,opacity:.45,flexShrink:0,marginLeft:4}}>{tagCounts[t]||0}</span>
            </Pressable>
          ))}
        </>}
        {open&&<>
          <NavHeader>Bases</NavHeader>
          {bases.length===0&&(
            <div style={{fontSize:11,color:'var(--t3)',padding:'2px 8px',fontStyle:'italic'}}>No bases yet</div>
          )}
          {bases.map(b=>{
            const active=section===`base:${b.id}`;
            return(
              <Pressable key={b.id} onPress={()=>onSelectBase&&onSelectBase(b.id)} ariaLabel={`Open base ${b.name}`} ariaPressed={active}
                style={{padding:'5px 8px',cursor:'pointer',borderRadius:'var(--rd)',fontSize:12,color:active?'var(--ac)':'var(--t2)',background:active?'var(--b2)':'transparent',display:'flex',alignItems:'center',gap:6,overflow:'hidden'}}>
                <span style={{flexShrink:0,opacity:.6}}>▦</span>
                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</span>
              </Pressable>
            );
          })}
          {onNewBase&&(
            <Pressable onPress={onNewBase} ariaLabel="Create new base"
              style={{padding:'5px 8px',cursor:'pointer',borderRadius:'var(--rd)',fontSize:11,color:'var(--t3)',display:'flex',alignItems:'center',gap:6,marginTop:2}}>
              <span style={{flexShrink:0}}>+</span><span>New base</span>
            </Pressable>
          )}
          <NavHeader>Canvases</NavHeader>
          {canvases.length===0&&(
            <div style={{fontSize:11,color:'var(--t3)',padding:'2px 8px',fontStyle:'italic'}}>No canvases yet</div>
          )}
          {canvases.map(c=>{
            const active=section===`canvas:${c.id}`;
            return(
              <Pressable key={c.id} onPress={()=>onSelectCanvas&&onSelectCanvas(c.id)} ariaLabel={`Open canvas ${c.name}`} ariaPressed={active}
                style={{padding:'5px 8px',cursor:'pointer',borderRadius:'var(--rd)',fontSize:12,color:active?'var(--ac)':'var(--t2)',background:active?'var(--b2)':'transparent',display:'flex',alignItems:'center',gap:6,overflow:'hidden'}}>
                <span style={{flexShrink:0,opacity:.6}}>◫</span>
                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</span>
              </Pressable>
            );
          })}
          {onNewCanvas&&(
            <Pressable onPress={onNewCanvas} ariaLabel="Create new canvas"
              style={{padding:'5px 8px',cursor:'pointer',borderRadius:'var(--rd)',fontSize:11,color:'var(--t3)',display:'flex',alignItems:'center',gap:6,marginTop:2}}>
              <span style={{flexShrink:0}}>+</span><span>New canvas</span>
            </Pressable>
          )}
        </>}
      </nav>
      {open&&pluginPanelsSlot}
    </aside>
  );
}
function NavHeader({children}){return<div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'var(--t3)',padding:'10px 4px 4px',textTransform:'uppercase'}}>{children}</div>}
function NavItem({icon,label,count,active,open,onClick}){
  return(<Pressable onPress={onClick} ariaLabel={!open?label:undefined} title={!open?label:undefined} ariaPressed={active}
    style={{padding:'7px 8px',cursor:'pointer',borderRadius:'var(--rd)',display:'flex',alignItems:'center',gap:8,background:active?'var(--b2)':'transparent',color:active?'var(--ac)':'var(--t2)',fontWeight:active?700:400,fontSize:13,marginBottom:2,userSelect:'none'}}>
    <span style={{fontSize:14,flexShrink:0}}>{icon}</span>
    {open&&<><span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    {count>0&&<span style={{fontSize:10,background:'var(--bg)',border:'1px solid var(--br)',borderRadius:99,padding:'1px 6px',color:'var(--t3)',flexShrink:0}}>{count}</span>}</>}
  </Pressable>);
}
