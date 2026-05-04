import { useMemo, useState } from 'react';
import { TYPES, KNOWLEDGE_TYPES, ICON, LABEL } from '../../lib/types.js';
import { Pressable } from '../primitives/Pressable.jsx';

// ── Sidebar ────────────────────────────────────────────────────────────────
export function Sidebar({open,width,onToggle,section,setSection,counts,allTags,tagCounts,filterTag,setFilterTag,theme,setTheme,darkMode,setDarkMode,isDark,onAdd,onExportJSON,onExportMD,victoryColors,setVictoryColors,onOpenSettings,folders=[],folderFiles=[],activeFolderFilePath='',onSelectFolder,onNewFolder,onOpenFolderFile,onDeleteFolderFile,onDeleteFolder,bases=[],onSelectBase,onNewBase,onDeleteBase,canvases=[],onSelectCanvas,onNewCanvas,onDeleteCanvas,pluginPanelsSlot,flags={}}){
  const knowledgeFlagMap={raw:'raw_inbox',wiki:'wiki_mode',review:'review_queue'};
  const visibleKnowledgeTypes=KNOWLEDGE_TYPES.filter(t=>flags[knowledgeFlagMap[t]]===true);
  return(
    <aside className="mgn-sb" style={{width,background:'var(--sb)',borderRight:'1px solid var(--br)',display:'flex',flexDirection:'column',flexShrink:0,transition:'width 0.2s',overflow:'hidden',zIndex:10}}>
      <Pressable onPress={onToggle} ariaLabel={open?'Collapse sidebar':'Expand sidebar'}
        style={{padding:'14px 12px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',gap:8,cursor:'pointer',flexShrink:0,userSelect:'none'}}>
        <span style={{fontSize:18,flexShrink:0}}>📚</span>
        {open&&<span style={{fontWeight:700,fontSize:15,color:'var(--ac)',whiteSpace:'nowrap',letterSpacing:-0.3}}>JotFolio</span>}
        <span style={{marginLeft:'auto',fontSize:11,opacity:.4,flexShrink:0}}>{open?'‹':'›'}</span>
      </Pressable>
      {open&&<div style={{padding:'8px 12px 0',fontSize:10,color:'var(--t3)',letterSpacing:1.2,textTransform:'uppercase'}}>Sidebar = navigation</div>}
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
        <NavItem icon="✦" label="Constellation" active={section==='graph'} open={open} onClick={()=>setSection('graph')}/>
        {open?<NavHeader>Media</NavHeader>:<div style={{height:1,background:'var(--br)',margin:'8px 6px'}}/>}
        {TYPES.map(t=><NavItem key={t} icon={ICON[t]} label={LABEL[t]} count={counts[t]} active={section===t} open={open} onClick={()=>setSection(t)}/>)}
        {visibleKnowledgeTypes.length>0&&<>
          {open?<NavHeader>Knowledge</NavHeader>:<div style={{height:1,background:'var(--br)',margin:'8px 6px'}}/>}
          {visibleKnowledgeTypes.map(t=><NavItem key={t} icon={ICON[t]} label={LABEL[t]} count={counts[t]} active={section===t} open={open} onClick={()=>setSection(t)}/>)}
        </>}
        {open&&<>
          <FolderTreeSection
            folders={folders}
            files={folderFiles}
            activeFilePath={activeFolderFilePath}
            section={section}
            onSelectFolder={onSelectFolder}
            onOpenFile={onOpenFolderFile}
            onDeleteFile={onDeleteFolderFile}
            onDeleteFolder={onDeleteFolder}
            onNewFolder={onNewFolder}/>
        </>}
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
          <NavHeader>Smart Views</NavHeader>
          {bases.length===0&&(
            <div style={{fontSize:11,color:'var(--t3)',padding:'2px 8px',lineHeight:1.45}}>Bases are saved filters, columns, and sorts for repeated workflows.</div>
          )}
          {bases.map(b=>{
            const active=section===`base:${b.id}`;
            return(
              <Pressable key={b.id} onPress={()=>onSelectBase&&onSelectBase(b.id)} ariaLabel={`Open base ${b.name}`} ariaPressed={active}
                style={{padding:'5px 8px',cursor:'pointer',borderRadius:'var(--rd)',fontSize:12,color:active?'var(--ac)':'var(--t2)',background:active?'var(--b2)':'transparent',display:'flex',alignItems:'center',gap:6,overflow:'hidden'}}>
                <span style={{flexShrink:0,opacity:.6}}>▦</span>
                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</span>
                {onDeleteBase&&(
                  <button
                    type="button"
                    aria-label={`Delete base ${b.name}`}
                    title="Delete base"
                    onMouseDown={e=>e.stopPropagation()}
                    onClick={e=>{e.stopPropagation();onDeleteBase(b.id)}}
                    style={{flexShrink:0,width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',border:'1px solid transparent',borderRadius:'var(--rd)',background:'transparent',color:'var(--t3)',cursor:'pointer',fontSize:13,lineHeight:1,fontFamily:'var(--fn)'}}>
                    ×
                  </button>
                )}
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
            <div style={{fontSize:11,color:'var(--t3)',padding:'2px 8px',lineHeight:1.45}}>Spatial workspaces for arranging cards.</div>
          )}
          {canvases.map(c=>{
            const active=section===`canvas:${c.id}`;
            return(
              <Pressable key={c.id} onPress={()=>onSelectCanvas&&onSelectCanvas(c.id)} ariaLabel={`Open canvas ${c.name}`} ariaPressed={active}
                style={{padding:'5px 8px',cursor:'pointer',borderRadius:'var(--rd)',fontSize:12,color:active?'var(--ac)':'var(--t2)',background:active?'var(--b2)':'transparent',display:'flex',alignItems:'center',gap:6,overflow:'hidden'}}>
                <span style={{flexShrink:0,opacity:.6}}>◫</span>
                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</span>
                {onDeleteCanvas&&(
                  <button
                    type="button"
                    aria-label={`Delete canvas ${c.name}`}
                    title="Delete canvas"
                    onMouseDown={e=>e.stopPropagation()}
                    onClick={e=>{e.stopPropagation();onDeleteCanvas(c.id)}}
                    style={{flexShrink:0,width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',border:'1px solid transparent',borderRadius:'var(--rd)',background:'transparent',color:'var(--t3)',cursor:'pointer',fontSize:13,lineHeight:1,fontFamily:'var(--fn)'}}>
                    ×
                  </button>
                )}
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
function FolderTreeSection({folders,files,activeFilePath,section,onSelectFolder,onOpenFile,onDeleteFile,onDeleteFolder,onNewFolder}){
  const tree=useMemo(()=>buildTree(folders,files),[folders,files]);
  const [collapsed,setCollapsed]=useState(()=>new Set());
  const toggle=(path)=>setCollapsed(prev=>{
    const next=new Set(prev);
    if(next.has(path))next.delete(path);else next.add(path);
    return next;
  });
  const renderNode=(node)=> {
    const active=section===`folder:${node.path}`||(section==='templates'&&node.path==='templates');
    const hasChildren=node.children.length>0;
    const closed=collapsed.has(node.path);
    return(
      <div key={node.path}>
        <div
          style={{padding:'0 7px',paddingLeft:7+(node.depth*13),borderRadius:'var(--rd)',fontSize:12,color:active?'var(--ac)':'var(--t2)',background:active?'var(--b2)':'transparent',display:'flex',alignItems:'center',gap:5,overflow:'hidden',marginBottom:1}}>
          <button type="button" aria-label={`${closed?'Expand':'Collapse'} ${node.path}`} title={hasChildren?(closed?'Expand':'Collapse'):''}
            onClick={()=>{if(hasChildren)toggle(node.path)}}
            disabled={!hasChildren}
            style={{width:16,height:16,border:'none',background:'transparent',color:'var(--t3)',display:'inline-flex',alignItems:'center',justifyContent:'center',padding:0,cursor:hasChildren?'pointer':'default',fontFamily:'var(--fn)',fontSize:10,opacity:hasChildren?1:.35,flexShrink:0}}>
            {hasChildren?(closed?'▸':'▾'):'•'}
          </button>
          <Pressable onPress={()=>onSelectFolder&&onSelectFolder(node.path)} ariaLabel={`Open folder ${node.path}`} ariaPressed={active} title={node.path}
            style={{minWidth:0,flex:1,padding:'5px 0',cursor:'pointer',display:'flex',alignItems:'center',gap:5,overflow:'hidden'}}>
            <span style={{flexShrink:0,opacity:.75}}>📁</span>
            <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:active?750:500}}>{node.name}</span>
            {node.total>0&&<span style={{fontSize:10,opacity:.55,flexShrink:0,marginLeft:4,border:'1px solid var(--br)',borderRadius:99,padding:'0 5px'}}>{node.total}</span>}
          </Pressable>
          {onDeleteFolder&&(
            <button
              type="button"
              aria-label={`Delete folder ${node.path}`}
              title="Delete folder"
              onMouseDown={e=>e.stopPropagation()}
              onClick={e=>{e.stopPropagation();onDeleteFolder(node.path)}}
              style={{flexShrink:0,width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',border:'1px solid transparent',borderRadius:'var(--rd)',background:'transparent',color:'var(--t3)',cursor:'pointer',fontSize:13,lineHeight:1,fontFamily:'var(--fn)'}}>
              ×
            </button>
          )}
        </div>
        {hasChildren&&!closed&&node.children.map(renderNode)}
        {!closed&&node.files?.map(file=>{
          const fileActive=file.path===activeFilePath;
          return(
            <div key={file.path}
              style={{marginLeft:31+(node.depth*13),padding:'0 7px',borderRadius:'var(--rd)',fontSize:12,color:fileActive?'var(--ac)':'var(--t2)',background:fileActive?'var(--b2)':'transparent',display:'flex',alignItems:'center',gap:6,overflow:'hidden',marginBottom:1}}>
              <Pressable onPress={()=>onOpenFile&&onOpenFile(file)} ariaLabel={`Open ${file.label}`} ariaPressed={fileActive} title={file.path}
                style={{minWidth:0,flex:1,padding:'4px 0',cursor:'pointer',display:'flex',alignItems:'center',gap:6,overflow:'hidden'}}>
                <span style={{flexShrink:0,opacity:.75}}>{file.icon}</span>
                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:fileActive?750:500}}>{file.label}</span>
              </Pressable>
              {onDeleteFile&&(
                <button
                  type="button"
                  aria-label={`Delete ${file.label}`}
                  title="Delete"
                  onMouseDown={e=>e.stopPropagation()}
                  onClick={e=>{e.stopPropagation();onDeleteFile(file)}}
                  style={{flexShrink:0,width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',border:'1px solid transparent',borderRadius:'var(--rd)',background:'transparent',color:'var(--t3)',cursor:'pointer',fontSize:13,lineHeight:1,fontFamily:'var(--fn)'}}>
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  return(
    <>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'10px 4px 4px'}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'var(--t3)',textTransform:'uppercase',flex:1}}>Folders</div>
        {onNewFolder&&(
          <button type="button" onClick={onNewFolder} aria-label="Create new folder" title="New folder"
            style={{width:22,height:22,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--b2)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:800,lineHeight:1}}>+</button>
        )}
      </div>
      {tree.length===0?(
        <div style={{fontSize:11,color:'var(--t3)',padding:'4px 8px 7px',lineHeight:1.45,border:'1px dashed var(--br)',borderRadius:'var(--rd)',margin:'2px 0 4px'}}>
          No folders yet. Create one, then move entries into it from the detail panel.
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:1}}>{tree.map(renderNode)}</div>
      )}
    </>
  );
}
function buildTree(folders=[],files=[]){
  const byPath=new Map();
  const ensureFolder=(path)=>{
    if(!path)return null;
    const parts=path.split('/').filter(Boolean);
    let node=null;
    for(let i=1;i<=parts.length;i+=1){
      const current=parts.slice(0,i).join('/');
      if(!byPath.has(current)){
        byPath.set(current,{path:current,name:parts[i-1],depth:i-1,count:0,children:[],files:[],total:0});
      }
      node=byPath.get(current);
    }
    return node;
  };
  for(const f of folders){
    if(!f?.path)continue;
    const node=ensureFolder(f.path);
    if(node){
      node.name=f.name||node.name;
      node.depth=f.depth??node.depth;
      node.count=f.count||0;
      node.total=f.count||0;
    }
  }
  for(const file of files||[]){
    if(!file?.path)continue;
    const parentPath=file.path.includes('/')?file.path.slice(0,file.path.lastIndexOf('/')):'';
    const parent=ensureFolder(parentPath);
    if(parent)parent.files.push(file);
  }
  const roots=[];
  for(const node of [...byPath.values()].sort((a,b)=>a.path.localeCompare(b.path))){
    const parentPath=node.path.includes('/')?node.path.slice(0,node.path.lastIndexOf('/')):'';
    const parent=parentPath?byPath.get(parentPath):null;
    if(parent)parent.children.push(node);else roots.push(node);
  }
  const sum=(node)=>{
    node.children.sort((a,b)=>a.name.localeCompare(b.name));
    node.files.sort((a,b)=>a.label.localeCompare(b.label));
    node.total=(node.count||0)+node.children.reduce((acc,child)=>acc+sum(child),0);
    return node.total;
  };
  roots.forEach(sum);
  return roots;
}
function NavItem({icon,label,count,active,open,onClick}){
  return(<Pressable onPress={onClick} ariaLabel={!open?label:undefined} title={!open?label:undefined} ariaPressed={active}
    style={{padding:'7px 8px',cursor:'pointer',borderRadius:'var(--rd)',display:'flex',alignItems:'center',gap:8,background:active?'var(--b2)':'transparent',color:active?'var(--ac)':'var(--t2)',fontWeight:active?700:400,fontSize:13,marginBottom:2,userSelect:'none'}}>
    <span style={{fontSize:14,flexShrink:0}}>{icon}</span>
    {open&&<><span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    {count>0&&<span style={{fontSize:10,background:'var(--bg)',border:'1px solid var(--br)',borderRadius:99,padding:'1px 6px',color:'var(--t3)',flexShrink:0}}>{count}</span>}</>}
  </Pressable>);
}
