import { useState } from 'react';
import { Pressable } from '../primitives/Pressable.jsx';
import { TagManageDialog } from '../tags/TagManageDialog.jsx';

// ── Sidebar ────────────────────────────────────────────────────────────────
export function Sidebar({open,width,onToggle,section,setSection,counts,allTags,tagCounts,filterTag,setFilterTag,theme,setTheme,darkMode,setDarkMode,isDark,onAdd,onExportJSON,onExportMD,victoryColors,setVictoryColors,onOpenSettings,folders=[],folderFiles=[],activeFolderFilePath='',onSelectFolder,onNewFolder,onOpenFolderFile,onDeleteFolderFile,onDeleteFolder,bases=[],onSelectBase,onNewBase,onDeleteBase,canvases=[],onSelectCanvas,onNewCanvas,onDeleteCanvas,pluginPanelsSlot,flags={},spaces=[],entries=[],onUpdateEntry}){
  const [tagManageOpen,setTagManageOpen]=useState(false);
  const spaceItems=(Array.isArray(spaces)?spaces:[])
    .map(space=>{
      if(typeof space==='string')return{id:space.toLowerCase(),name:space,count:0};
      const name=space?.name||space?.id;
      if(!name)return null;
      return{id:String(space.id||name).toLowerCase(),name:String(name),count:space.count||0,color:space.color};
    })
    .filter(Boolean);
  const tagItems=(Array.isArray(allTags)?allTags:[])
    .map(tag=>{
      const name=typeof tag==='string'?tag:(tag?.name||tag?.id);
      if(!name)return null;
      return{name:String(name),count:tagCounts?.[name]||tag?.count||0};
    })
    .filter(Boolean);
  return(
    <aside className="mgn-sb" style={{width,background:'rgba(7,11,16,.98)',borderRight:'1px solid var(--br)',display:'flex',flexDirection:'column',flexShrink:0,transition:'width 0.2s',overflow:'hidden',zIndex:10}}>
      <nav style={{flex:1,overflowY:'auto',padding:'16px 14px 8px'}}>
        <NavItem icon="⌂" label="Command Center" active={section==='command'} open={open} onClick={()=>setSection('command')}/>
        <NavItem icon="▱" label="Inbox" count={counts.raw} active={section==='raw'} open={open} onClick={()=>setSection('raw')}/>
        <NavItem icon="⌕" label="Search" hint="⌘K" active={section==='search'} open={open} onClick={()=>setSection('search')}/>
        <NavItem icon="▭" label="Projects" active={section==='projects'} open={open} onClick={()=>setSection('projects')}/>
        <NavItem icon="▤" label="Notes" active={section==='note'} open={open} onClick={()=>setSection('note')}/>
        <NavItem icon="□" label="Calendar" active={section==='calendar'} open={open} onClick={()=>setSection('calendar')}/>
        <NavItem icon="⌘" label="Knowledge Graph" active={section==='graph'} open={open} onClick={()=>setSection('graph')}/>
        <NavItem icon="☑" label="Tasks" active={section==='tasks'} open={open} onClick={()=>setSection('tasks')}/>
        <NavItem icon="✧" label="AI Assistant" active={section==='ai'} open={open} onClick={()=>setSection('ai')}/>

        {open?<SectionDivider/>:<div style={{height:1,background:'var(--br)',margin:'12px 6px 8px'}}/>}
        {open?<NavHeader>Spaces</NavHeader>:null}
        {spaceItems.map((space,index)=>(
          <NavItem
            key={space.id}
            icon="▣"
            iconColor={space.color||['#3b82f6','#22c55e','#f97316','#8b5cf6'][index%4]}
            label={space.name}
            count={space.count}
            active={section===`space:${space.id}`}
            open={open}
            onClick={()=>setSection(`space:${space.id}`)}/>
        ))}
        {open&&spaceItems.length===0?<EmptyNavHint>No spaces yet</EmptyNavHint>:null}

        {open&&<>
          <SectionDivider/>
          <NavHeader>Tags</NavHeader>
          {tagItems.map(t=>(
            <Pressable key={t.name} onPress={()=>{setFilterTag?.(filterTag===t.name?'':t.name);setSection('all')}} ariaLabel={`Filter by tag ${t.name}`} ariaPressed={filterTag===t.name}
              style={{minHeight:28,padding:'0 10px',cursor:'pointer',borderRadius:7,fontSize:13,fontWeight:500,color:filterTag===t.name?'var(--tx)':'var(--t2)',background:filterTag===t.name?'rgba(255,255,255,.095)':'transparent',display:'flex',alignItems:'center',gap:10,overflow:'hidden',marginBottom:2}}>
              <span style={{width:18,textAlign:'center',color:'var(--t2)'}}>#</span>
              <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</span>
              {t.count>0&&<span style={{fontSize:11,fontWeight:600,background:'rgba(255,255,255,.10)',border:'1px solid rgba(255,255,255,.08)',borderRadius:99,padding:'1px 7px',color:'var(--t2)',flexShrink:0}}>{t.count}</span>}
            </Pressable>
          ))}
          {tagItems.length===0?<EmptyNavHint>No tags yet</EmptyNavHint>:null}
          <NavItem icon="+" label="Manage Tags" active={tagManageOpen} open={open} onClick={()=>setTagManageOpen(true)}/>
        </>}
      </nav>
      <TagManageDialog open={tagManageOpen} entries={entries} onUpdateEntry={onUpdateEntry} onClose={()=>setTagManageOpen(false)}/>
      <div style={{borderTop:'1px solid var(--br)',padding:'14px',flexShrink:0}}>
        <NavItem icon="⚙" label="Settings" active={section==='settings'} open={open} onClick={()=>onOpenSettings?onOpenSettings():setSection('settings')}/>
        <NavItem icon="⌫" label="Trash" count={counts.trash} active={section==='trash'} open={open} onClick={()=>setSection('trash')}/>
      </div>
    </aside>
  );
}
function SectionDivider(){return <div style={{height:1,background:'var(--br)',opacity:.72,margin:'14px 6px 8px'}}/>}
function NavHeader({children}){return<div style={{fontSize:11,fontWeight:650,letterSpacing:.4,color:'var(--t3)',padding:'8px 8px 6px',textTransform:'uppercase'}}>{children}</div>}
function EmptyNavHint({children}){return<div style={{padding:'6px 10px 8px 38px',color:'var(--t3)',fontSize:12}}>{children}</div>}
function NavItem({icon,label,count,hint,active,open,onClick,iconColor}){
  return(<Pressable onPress={onClick} ariaLabel={!open?label:undefined} title={!open?label:undefined} ariaPressed={active}
    style={{minHeight:30,padding:'0 10px',cursor:'pointer',borderRadius:7,display:'flex',alignItems:'center',gap:10,background:active?'rgba(255,255,255,.095)':'transparent',color:active?'var(--tx)':'var(--t2)',fontWeight:active?650:500,fontSize:13,marginBottom:2,userSelect:'none',boxSizing:'border-box'}}>
    <span style={{fontSize:14,flexShrink:0,width:18,textAlign:'center',color:iconColor||(active?'var(--tx)':'var(--t2)')}}>{icon}</span>
    {open&&<><span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    {count>0&&<span style={{fontSize:11,fontWeight:600,background:'rgba(255,255,255,.10)',border:'1px solid rgba(255,255,255,.08)',borderRadius:99,padding:'1px 7px',color:'var(--t2)',flexShrink:0}}>{count}</span>}</>}
    {open&&hint&&<span style={{fontSize:11,fontWeight:500,color:'var(--t3)',flexShrink:0}}>{hint}</span>}
  </Pressable>);
}
