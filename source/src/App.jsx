import { useState, useEffect, useMemo, useDeferredValue, useCallback } from "react";
import { migrateIfNeeded, updateLastSeen, logEvent, isOnboarded, useActivation, recordEntryAdded } from './onboarding/activation.js';
import { WelcomePanel } from './onboarding/WelcomePanel.jsx';
import { ProgressPill, FirstSaveBanner, Day2ReturnCard, ActivationToast } from './onboarding/nudges.jsx';
import { TYPES, ICON, LABEL } from './lib/types.js';
import { THEMES } from './lib/theme/themes.js';
import { deriveVictoryTheme } from './lib/theme/victoryTheme.js';
import { buildThemeCss } from './lib/theme/themeCss.js';
import { storage, uid, normalizeTags } from './lib/storage.js';
import { exportEntriesJSON, exportEntriesMD, importEntriesJSON } from './lib/exports.js';
import { useSystemDark } from './lib/hooks.js';
import { useOpenRouterCallback, useAppShortcuts } from './lib/appHooks.js';
import { Toasts } from './features/primitives/Toasts.jsx';
import { Sidebar } from './features/sidebar/Sidebar.jsx';
import { Toolbar } from './features/toolbar/Toolbar.jsx';
import { EmptyState } from './features/emptystate/EmptyState.jsx';
import { Card } from './features/card/Card.jsx';
import { Row } from './features/card/Row.jsx';
import { AddModal } from './features/add/AddModal.jsx';
import { DetailPanel } from './features/detail/DetailPanel.jsx';
import { ConstellationView } from './features/constellation/ConstellationView.jsx';
import { SettingsPanel } from './features/settings/SettingsPanel.jsx';

// ── App ────────────────────────────────────────────────────────────────────
export default function App(){
  const[entries,setEntries]=useState([]);
  const[loaded,setLoaded]=useState(false);
  const[theme,setTheme]=useState(()=>{
    try{
      const raw=localStorage.getItem('mgn-p');
      if(raw){const parsed=JSON.parse(raw);if(parsed?.theme)return parsed.theme}
    }catch{}
    const prefersDark=typeof window!=='undefined'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark?'glass':'minimal';
  });
  const[darkMode,setDarkMode]=useState('system');
  const[customColors,setCustomColors]=useState({});
  const systemDark=useSystemDark();
  const isDark=darkMode==='dark'||(darkMode==='system'&&systemDark);
  const[section,setSection]=useState('all');
  const[view,setView]=useState('grid');
  const[query,setQuery]=useState('');
  const deferredQuery=useDeferredValue(query);
  const[filterStatus,setFilterStatus]=useState('');
  const[filterTag,setFilterTag]=useState('');
  const[sort,setSort]=useState('date');
  // FIX: addInitialType tracks the type to pre-select when modal opens
  const[showAddModal,setShowAddModal]=useState(false);
  const[addInitialType,setAddInitialType]=useState('video');
  const[sidebarOpen,setSidebarOpen]=useState(true);
  const[detailId,setDetailId]=useState(null);
  const detail=useMemo(()=>entries.find(e=>e.id===detailId)||null,[entries,detailId]);
  const[toasts,setToasts]=useState([]);
  const[settingsOpen,setSettingsOpen]=useState(false);
  const DEFAULT_PREFS={fontSize:13,fontFamily:'',cardDensity:'comfortable',sidebarWidth:240,defaultView:'grid',defaultSort:'date',showNotesPreview:true,showDateOnCards:true,showTagsOnCards:true};
  const[prefs,setPrefs]=useState(DEFAULT_PREFS);

  const toast=useCallback((msg,type='success')=>{
    const id=uid();setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  },[]);

  // Onboarding: log app.open + stamp lastSeen once per mount
  useEffect(()=>{
    updateLastSeen();
    logEvent('app.open');
  },[]);

  // Tick counter forces re-read of isOnboarded() after localStorage writes
  const [onboardingTick,setOnboardingTick]=useState(0);
  const bumpOnboarding=useCallback(()=>setOnboardingTick(t=>t+1),[]);
  // void read to keep lint happy — isOnboarded() reads fresh each render
  void onboardingTick;

  // FIX: openAdd wires type through to the modal; all call sites use this.
  // Also closes other dialogs so we never stack (Detail + Modal, Settings + Modal).
  // `quickCapture` skips type picker + focuses title + hides URL (for notes).
  const[addQuickCapture,setAddQuickCapture]=useState(false);
  const openAdd=useCallback((arg)=>{
    const opts=typeof arg==='string'?{type:arg}:(arg||{});
    setDetailId(null);
    setSettingsOpen(false);
    setAddInitialType(opts.type??(TYPES.includes(section)?section:'video'));
    setAddQuickCapture(!!opts.quickCapture);
    setShowAddModal(true);
  },[section]);

  const handleSection=(next)=>{setSection(next);setFilterStatus('')};
  const hasFilters=!!(query||filterStatus||filterTag);
  const clearFilters=()=>{setQuery('');setFilterStatus('');setFilterTag('')};

  useOpenRouterCallback(toast);
  useAppShortcuts({blocked:showAddModal||!!detailId,openAdd});

  // CSS vars
  useEffect(()=>{
    const safeTheme=THEMES[theme]?theme:'glass';
    if(safeTheme!==theme)setTheme(safeTheme);
    const t=THEMES[safeTheme];
    let vars={...t.light,...(isDark?t.dark:{})};
    const cc=customColors[safeTheme];
    if(cc){
      const derived=deriveVictoryTheme(cc.bg,cc.fg,cc.ac,cc.b2);
      // Preserve theme-specific font and border-radius
      derived['--fn']=vars['--fn']||derived['--fn'];
      derived['--rd']=vars['--rd']||derived['--rd'];
      vars=derived;
    }
    if(prefs.fontFamily)vars['--fn']=prefs.fontFamily;
    Object.entries(vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  },[theme,isDark,customColors,prefs.fontFamily]);

  // Theme-specific CSS injection
  useEffect(()=>{
    let s=document.getElementById('mgn-theme-style');
    if(!s){s=document.createElement('style');s.id='mgn-theme-style';document.head.appendChild(s);}
    s.textContent=buildThemeCss(theme,isDark);
  },[theme,isDark]);

  // Load
  useEffect(()=>{
    let mounted=true;
    Promise.all([storage.get('mgn-e'),storage.get('mgn-p')]).then(([se,sp])=>{
      if(!mounted)return;
      if(se){
        const normalized=se.map(e=>({...e,tags:normalizeTags(e.tags||[]),links:Array.isArray(e.links)?e.links:[]}));
        migrateIfNeeded(normalized); // seed activation before setState (sync localStorage)
        setEntries(normalized);
      }
      if(sp?.theme)setTheme(sp.theme);if(sp?.darkMode)setDarkMode(sp.darkMode);
      if(sp?.customColors)setCustomColors(sp.customColors);
      // Legacy migration: old victoryColors → new customColors
      if(sp?.victoryColors&&!sp?.customColors)setCustomColors({victory:sp.victoryColors});
      if(typeof sp?.sidebarOpen==='boolean')setSidebarOpen(sp.sidebarOpen);
      if(sp?.prefs){const p={...DEFAULT_PREFS,...sp.prefs};setPrefs(p);setView(p.defaultView);setSort(p.defaultSort);}
      setLoaded(true);
    });
    return()=>{mounted=false};
  },[]);
  useEffect(()=>{
    if(!loaded)return;
    storage.set('mgn-e',entries);
    storage.set('mgn-p',{theme,darkMode,sidebarOpen,customColors,prefs});
  },[loaded,entries,theme,darkMode,sidebarOpen,customColors,prefs]);

  // Apply font size preference to document root
  // UI scale: `zoom` on body scales the whole app (fonts, spacing, icons).
  // True font-only scaling would require a px→em refactor across ~100 inline styles.
  useEffect(()=>{document.body.style.zoom=String(prefs.fontSize/13)},[prefs.fontSize]);

  // Celebration state for 3-entry activation
  const [celebrating,setCelebrating]=useState(false);
  const activation=useActivation(entries.length);

  // FIX: addEntry no longer does the dup check (moved to AddModal) so deps are just [toast]
  const addEntry=useCallback((entry)=>{
    setEntries(prev=>{
      const date=new Date().toISOString();
      const next=[{...entry,id:uid(),date,starred:false,links:[]},...prev];
      const newCount=next.length;
      recordEntryAdded(newCount,date);
      if(newCount===3)setCelebrating(true);
      return next;
    });
    toast(`${ICON[entry.type]} Entry saved`);
  },[toast]);

  const updateEntry=useCallback((id,patch)=>setEntries(prev=>prev.map(e=>e.id===id?{...e,...patch}:e)),[]);

  const linkEntries=useCallback((a,b)=>{
    if(!a||!b||a===b)return;
    setEntries(prev=>prev.map(e=>{
      if(e.id===a)return{...e,links:[...new Set([...(e.links||[]),b])]};
      if(e.id===b)return{...e,links:[...new Set([...(e.links||[]),a])]};
      return e;
    }));
  },[]);
  const unlinkEntries=useCallback((a,b)=>{
    setEntries(prev=>prev.map(e=>{
      if(e.id===a)return{...e,links:(e.links||[]).filter(x=>x!==b)};
      if(e.id===b)return{...e,links:(e.links||[]).filter(x=>x!==a)};
      return e;
    }));
  },[]);

  const deleteEntry=useCallback((id)=>{
    setEntries(prev=>prev.filter(e=>e.id!==id).map(e=>e.links?.includes(id)?{...e,links:e.links.filter(x=>x!==id)}:e));
    if(detailId===id)setDetailId(null);
    toast('Entry deleted','info');
  },[detailId,toast]);

  // FIX: existingUrls passed to AddModal so it can show inline dup warning
  const existingUrls=useMemo(()=>new Set(entries.map(e=>e.url).filter(Boolean)),[entries]);

  const filtered=useMemo(()=>{
    let r=entries;
    if(section==='starred')r=r.filter(e=>e.starred);else if(section!=='all')r=r.filter(e=>e.type===section);
    if(deferredQuery){const lq=deferredQuery.toLowerCase();r=r.filter(e=>(e.title||'').toLowerCase().includes(lq)||(e.notes||'').toLowerCase().includes(lq)||(e.tags||[]).some(t=>t.toLowerCase().includes(lq)));}
    if(filterStatus)r=r.filter(e=>e.status===filterStatus);
    if(filterTag)r=r.filter(e=>(e.tags||[]).includes(filterTag));
    const dec=r.map(e=>({e,ts:Date.parse(e.date)||0}));
    dec.sort((a,b)=>sort==='title'?(a.e.title||'').localeCompare(b.e.title||''):sort==='starred'?(b.e.starred?1:0)-(a.e.starred?1:0):b.ts-a.ts);
    return dec.map(x=>x.e);
  },[entries,section,deferredQuery,filterStatus,filterTag,sort]);

  const allTags=useMemo(()=>[...new Set(entries.flatMap(e=>e.tags||[]))]  ,[entries]);
  const tagCounts=useMemo(()=>{const m={};entries.forEach(e=>(e.tags||[]).forEach(t=>{m[t]=(m[t]||0)+1}));return m},[entries]);
  const counts=useMemo(()=>{const m={all:entries.length,starred:entries.filter(e=>e.starred).length};TYPES.forEach(t=>{m[t]=entries.filter(e=>e.type===t).length});m.links=Math.round(entries.reduce((n,e)=>n+(e.links?.length||0),0)/2);return m},[entries]);



  const exportJSON=()=>{exportEntriesJSON(entries);toast('Exported JSON')};
  const exportMD=()=>{exportEntriesMD(entries);toast('Exported Markdown')};
  const importJSON=async(file)=>{
    try{
      const existingIds=new Set(entries.map(x=>x.id));
      const{fresh,duplicates}=await importEntriesJSON(file,existingIds);
      setEntries(prev=>[...fresh,...prev]);
      toast(`Imported ${fresh.length} entries${duplicates?` (${duplicates} duplicates skipped)`:''}`);
    }catch(err){toast('Import failed: '+(err.message||'invalid file'),'error')}
  };

  return(
    <div className="mgn-app" style={{display:'flex',height:'100vh',background:'var(--bg)',color:'var(--tx)',fontFamily:'var(--fn)',overflow:'hidden',position:'relative'}}>
      <Sidebar open={sidebarOpen} width={sidebarOpen?prefs.sidebarWidth:58} onToggle={()=>setSidebarOpen(o=>!o)}
        section={section} setSection={handleSection} counts={counts}
        allTags={allTags} tagCounts={tagCounts} filterTag={filterTag} setFilterTag={setFilterTag}
        theme={theme} setTheme={setTheme} darkMode={darkMode} setDarkMode={setDarkMode} isDark={isDark}
        onAdd={openAdd} onExportJSON={exportJSON} onExportMD={exportMD}
        victoryColors={customColors} setVictoryColors={setCustomColors}
        onOpenSettings={()=>setSettingsOpen(s=>!s)}/>

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {section==='graph'?(
          <ConstellationView entries={entries} onOpen={id=>setDetailId(id)} onBack={()=>setSection('all')} onAdd={openAdd}/>
        ):(<>
          <Toolbar query={query} setQuery={setQuery} section={section}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            sort={sort} setSort={setSort} view={view} setView={setView}
            hasFilters={hasFilters} onClear={clearFilters}
            onOpenSettings={()=>setSettingsOpen(s=>!s)}/>
          <div style={{padding:'10px 14px 0',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'baseline',gap:8}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:700}}>{section==='all'?'All Entries':section==='starred'?'★ Starred':ICON[section]+' '+LABEL[section]}</h2>
              <span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} item{filtered.length!==1?'s':''}</span>
              {section==='all'&&<ProgressPill count={entries.length}/>}
            </div>
          </div>
          {section==='all'&&entries.length<3&&activation.showDay2&&(
            <Day2ReturnCard count={entries.length} onAdd={openAdd} lastEntryTitle={entries[0]?.title}/>
          )}
          {section==='all'&&entries.length===1&&!activation.showDay2&&(
            <FirstSaveBanner count={entries.length} onAdd={openAdd}/>
          )}
          <div style={{flex:1,overflowY:'auto',padding:14}}>
            {!loaded?(<div style={{textAlign:'center',padding:'80px 20px',color:'var(--t3)'}}>Loading…</div>)
            :filtered.length===0?(<EmptyState section={section} onAdd={openAdd} hasFilters={hasFilters} onClear={clearFilters} query={query}/>)
            :view==='grid'?(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:12}}>
                {filtered.map(e=><Card key={e.id} entry={e} prefs={prefs} onStar={()=>updateEntry(e.id,{starred:!e.starred})} onOpen={()=>setDetailId(e.id)}/>)}
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {filtered.map(e=><Row key={e.id} entry={e} prefs={prefs} onStar={()=>updateEntry(e.id,{starred:!e.starred})} onOpen={()=>setDetailId(e.id)}/>)}
              </div>
            )}
          </div>
        </>)}
      </div>

      {detail&&<DetailPanel entry={detail} entries={entries} allTags={allTags} onClose={()=>setDetailId(null)} onUpdate={p=>updateEntry(detail.id,p)} onDelete={()=>deleteEntry(detail.id)} onToast={toast} onLink={b=>linkEntries(detail.id,b)} onUnlink={b=>unlinkEntries(detail.id,b)} onOpenEntry={id=>setDetailId(id)} onNavigate={dir=>{const i=entries.findIndex(e=>e.id===detail.id);const nx=entries[i+dir];if(nx)setDetailId(nx.id)}}/>}
      {showAddModal&&<AddModal initialType={addInitialType} quickCapture={addQuickCapture} existingUrls={existingUrls} allTags={allTags} onClose={()=>setShowAddModal(false)} onAdd={e=>{addEntry(e);setShowAddModal(false)}}/>}
      {loaded&&!isOnboarded()&&entries.length===0&&(
        <WelcomePanel
          onImport={items=>{setEntries(prev=>[...items,...prev]);toast(`Imported ${items.length} entries`);bumpOnboarding()}}
          onPickTheme={()=>{setSettingsOpen(true);bumpOnboarding()}}
          onOpenAdd={()=>{openAdd();bumpOnboarding()}}
          onOpenGraph={()=>{setSection('graph');bumpOnboarding()}}
          onClose={bumpOnboarding}
        />
      )}
      {/* onboardingTick reference keeps isOnboarded() fresh across localStorage writes */}
      {onboardingTick >= 0 ? null : null}
      {settingsOpen&&<SettingsPanel
        theme={theme} setTheme={setTheme} darkMode={darkMode} setDarkMode={setDarkMode} isDark={isDark}
        victoryColors={customColors} setVictoryColors={setCustomColors}
        onExportJSON={exportJSON} onExportMD={exportMD} onImportJSON={importJSON} entries={entries}
        prefs={prefs} setPrefs={setPrefs}
        onClose={()=>setSettingsOpen(false)}/>}
      <Toasts toasts={toasts}/>
      <ActivationToast visible={celebrating} onDone={()=>{setCelebrating(false);setSection('graph')}}/>
    </div>
  );
}
