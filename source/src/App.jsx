import { useState, useEffect, useMemo, useDeferredValue, useCallback } from "react";
import { updateLastSeen, logEvent, isOnboarded, useActivation, recordEntryAdded } from './onboarding/activation.js';
import { WelcomePanel } from './onboarding/WelcomePanel.jsx';
import { ProgressPill, FirstSaveBanner, Day2ReturnCard, ActivationToast } from './onboarding/nudges.jsx';
import { TYPES, ICON, LABEL } from './lib/types.js';
import { DEFAULT_FEATURE_FLAGS, filterEntriesForUI, normalizeFeatureFlags } from './lib/featureFlags.js';
import { resolveColorScheme, resolveThemeVars } from './lib/theme/resolve.js';
import { buildThemeCss } from './lib/theme/themeCss.js';
import { storage, uid, isStorageCorruptionError } from './lib/storage.js';
import { MANUAL_LINKS_FIELD } from './lib/frontmatter.js';
import { exportEntriesJSON, exportEntriesMD, importEntriesJSON } from './lib/exports.js';
import { getConstellationDemoEntries } from './lib/demoEntries.js';
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
import { useVault } from './features/vault/useVault.js';

// ── App ────────────────────────────────────────────────────────────────────
export default function App(){
  const[theme,setTheme]=useState('minimal');
  const[prefsLoaded,setPrefsLoaded]=useState(false);
  const[storageError,setStorageError]=useState(null);
  const[migratingLegacy,setMigratingLegacy]=useState(false);
  const[migrationDone,setMigrationDone]=useState(false);
  const{
    entries,
    vaultInfo,
    loading:vaultLoading,
    error:vaultError,
    pickVault,
    saveEntry,
    deleteEntry:deleteVaultEntry,
    migrateFromLocalStorage,
    refresh:refreshVault,
  }=useVault();
  const loaded=prefsLoaded&&!vaultLoading&&!migratingLegacy;
  const isBrowserVault=typeof window!=='undefined'&&!window.electron?.vault;
  const[darkMode,setDarkMode]=useState('system');
  const[customColors,setCustomColors]=useState({});
  const DEFAULT_PREFS={fontSize:13,fontFamily:'',cardDensity:'comfortable',sidebarWidth:240,defaultView:'grid',defaultSort:'date',showNotesPreview:true,showDateOnCards:true,showTagsOnCards:true,defaultLayoutMode:'messy',featureFlags:DEFAULT_FEATURE_FLAGS};
  const[prefs,setPrefs]=useState(DEFAULT_PREFS);
  const[toasts,setToasts]=useState([]);
  const toast=useCallback((msg,type='success')=>{
    const id=uid();setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  },[]);
  const reportError=useCallback((err, fallback='Operation failed')=>{
    if(isStorageCorruptionError(err)){
      setStorageError(err);
      toast(`Storage recovery needed for ${err.key}`,'error');
      return;
    }
    toast(`${fallback}: ${err?.message||'error'}`,'error');
  },[toast]);
  const systemDark=useSystemDark();
  const isDark=resolveColorScheme(darkMode,systemDark)==='dark';
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
  const[settingsOpen,setSettingsOpen]=useState(false);

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
    const {safeTheme,scheme,vars}=resolveThemeVars({theme,darkMode,systemDark,customColors,fontFamily:prefs.fontFamily});
    if(safeTheme!==theme)setTheme(safeTheme);
    document.documentElement.dataset.colorScheme=scheme;
    Object.entries(vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  },[theme,darkMode,systemDark,customColors,prefs.fontFamily]);

  // Theme-specific CSS injection
  useEffect(()=>{
    let s=document.getElementById('mgn-theme-style');
    if(!s){s=document.createElement('style');s.id='mgn-theme-style';document.head.appendChild(s);}
    s.textContent=buildThemeCss(theme,isDark);
  },[theme,isDark]);

  // Load preferences. Entries are loaded through the VaultAdapter via useVault.
  useEffect(()=>{
    let mounted=true;
    storage.get('mgn-p').then(sp=>{
      if(!mounted)return;
      if(sp?.theme)setTheme(sp.theme);if(sp?.darkMode)setDarkMode(sp.darkMode);
      if(sp?.customColors)setCustomColors(sp.customColors);
      // Legacy migration: old victoryColors → new customColors
      if(sp?.victoryColors&&!sp?.customColors)setCustomColors({victory:sp.victoryColors});
      if(typeof sp?.sidebarOpen==='boolean')setSidebarOpen(sp.sidebarOpen);
      if(sp?.prefs){const p={...DEFAULT_PREFS,...sp.prefs,featureFlags:normalizeFeatureFlags(sp.prefs?.featureFlags)};setPrefs(p);setView(p.defaultView);setSort(p.defaultSort);}
      setPrefsLoaded(true);
    }).catch(err=>{
      if(!mounted)return;
      if(isStorageCorruptionError(err))setStorageError(err);
      else toast('Settings load failed: '+(err?.message||'error'),'error');
      setPrefsLoaded(true);
    });
    return()=>{mounted=false};
  },[toast]);
  useEffect(()=>{
    if(!isBrowserVault||vaultInfo||vaultLoading)return;
    pickVault().catch(err=>reportError(err,'Vault open failed'));
  },[isBrowserVault,vaultInfo,vaultLoading,pickVault,reportError]);
  useEffect(()=>{
    if(!prefsLoaded||!vaultInfo||vaultLoading||migrationDone)return;
    let cancelled=false;
    setMigratingLegacy(true);
    (async()=>{
      try{
        const done=await storage.get('mgn-vault-migrated');
        if(!done){
          const result=await migrateFromLocalStorage();
          if(result.total>0){
            toast(`Imported ${result.migrated} legacy entries into vault${result.skipped?` (${result.skipped} skipped)`:''}`,'info');
            await refreshVault();
          }
          await storage.set('mgn-vault-migrated',true);
        }
      }catch(err){reportError(err,'Legacy migration failed')}
      finally{if(!cancelled){setMigrationDone(true);setMigratingLegacy(false)}}
    })();
    return()=>{cancelled=true};
  },[prefsLoaded,vaultInfo,vaultLoading,migrationDone,migrateFromLocalStorage,refreshVault,reportError,toast]);
  useEffect(()=>{
    if(!prefsLoaded)return;
    storage.set('mgn-p',{theme,darkMode,sidebarOpen,customColors,prefs}).catch(err=>reportError(err,'Settings save failed'));
  },[prefsLoaded,theme,darkMode,sidebarOpen,customColors,prefs,reportError]);

  // Apply font size preference to document root
  // UI scale: `zoom` on body scales the whole app (fonts, spacing, icons).
  // True font-only scaling would require a px→em refactor across ~100 inline styles.
  useEffect(()=>{document.body.style.zoom=String(prefs.fontSize/13)},[prefs.fontSize]);

  // Celebration state for 3-entry activation
  const [celebrating,setCelebrating]=useState(false);
  // visibleEntries is the feature-flag-filtered slice that drives all
  // UI surfaces (library, counts, tags, Constellation, onboarding). Must
  // be declared before useActivation reads it — earlier placement triggered
  // a TDZ ReferenceError that crashed App on mount.
  const visibleEntries=useMemo(()=>filterEntriesForUI(entries,prefs.featureFlags),[entries,prefs.featureFlags]);
  const activation=useActivation(visibleEntries.length);

  const addEntry=useCallback(async(entry)=>{
    const date=new Date().toISOString();
    const next={...entry,id:uid(),date,starred:false,links:[]};
    try{
      await saveEntry(next);
      const newCount=entries.length+1;
      recordEntryAdded(newCount,date);
      if(newCount===3)setCelebrating(true);
      toast(`${ICON[entry.type]} Entry saved`);
    }catch(err){reportError(err,'Entry save failed')}
  },[entries.length,saveEntry,toast,reportError]);

  // Phase 3: create a real note from an unresolved [[wikilink]] target.
  // Title-matched so the existing wikilink resolver picks it up on the
  // next index rebuild, which auto-resolves both the source entry's
  // outgoing link and any other entries pointing at the same name.
  const createFromMissing=useCallback(async(targetTitle)=>{
    const cleanTitle=String(targetTitle||'').trim();
    if(!cleanTitle){toast('Empty link target','error');return null}
    const date=new Date().toISOString();
    const next={type:'note',title:cleanTitle,notes:'',tags:[],status:'draft',id:uid(),date,starred:false,links:[]};
    try{
      await saveEntry(next);
      await refreshVault();
      toast(`Created "${cleanTitle}"`);
      setDetailId(next.id);
      return next.id;
    }catch(err){reportError(err,'Create from missing failed');return null}
  },[saveEntry,refreshVault,toast,reportError]);

  const updateEntry=useCallback(async(id,patch)=>{
    const current=entries.find(e=>e.id===id);
    if(!current)return;
    try{await saveEntry({...current,...patch})}
    catch(err){reportError(err,'Entry update failed')}
  },[entries,saveEntry,reportError]);

  const linkEntries=useCallback(async(a,b)=>{
    if(!a||!b||a===b)return;
    const left=entries.find(e=>e.id===a),right=entries.find(e=>e.id===b);
    if(!left||!right)return;
    try{
      await Promise.all([
        saveEntry({...left,links:[...new Set([...(left.links||[]),b])],[MANUAL_LINKS_FIELD]:true}),
        saveEntry({...right,links:[...new Set([...(right.links||[]),a])],[MANUAL_LINKS_FIELD]:true}),
      ]);
    }catch(err){reportError(err,'Link save failed')}
  },[entries,saveEntry,reportError]);
  const unlinkEntries=useCallback(async(a,b)=>{
    const left=entries.find(e=>e.id===a),right=entries.find(e=>e.id===b);
    if(!left||!right)return;
    try{
      await Promise.all([
        saveEntry({...left,links:(left.links||[]).filter(x=>x!==b),[MANUAL_LINKS_FIELD]:true}),
        saveEntry({...right,links:(right.links||[]).filter(x=>x!==a),[MANUAL_LINKS_FIELD]:true}),
      ]);
    }catch(err){reportError(err,'Unlink save failed')}
  },[entries,saveEntry,reportError]);

  const deleteEntry=useCallback(async(id)=>{
    const affected=entries.filter(e=>e.id!==id&&e.links?.includes(id));
    try{
      await Promise.all(affected.map(e=>saveEntry({...e,links:e.links.filter(x=>x!==id),[MANUAL_LINKS_FIELD]:true})));
      await deleteVaultEntry(id);
      if(detailId===id)setDetailId(null);
      toast('Entry deleted','info');
    }catch(err){reportError(err,'Entry delete failed')}
  },[entries,detailId,saveEntry,deleteVaultEntry,toast,reportError]);

  // FIX: existingUrls passed to AddModal so it can show inline dup warning
  const existingUrls=useMemo(()=>new Set(entries.map(e=>e.url).filter(Boolean)),[entries]);

  const filtered=useMemo(()=>{
    let r=visibleEntries;
    if(section==='starred')r=r.filter(e=>e.starred);else if(section!=='all')r=r.filter(e=>e.type===section);
    if(deferredQuery){const lq=deferredQuery.toLowerCase();r=r.filter(e=>(e.title||'').toLowerCase().includes(lq)||(e.notes||'').toLowerCase().includes(lq)||(e.tags||[]).some(t=>t.toLowerCase().includes(lq)));}
    if(filterStatus)r=r.filter(e=>e.status===filterStatus);
    if(filterTag)r=r.filter(e=>(e.tags||[]).includes(filterTag));
    const dec=r.map(e=>({e,ts:Date.parse(e.date)||0}));
    dec.sort((a,b)=>sort==='title'?(a.e.title||'').localeCompare(b.e.title||''):sort==='starred'?(b.e.starred?1:0)-(a.e.starred?1:0):b.ts-a.ts);
    return dec.map(x=>x.e);
  },[visibleEntries,section,deferredQuery,filterStatus,filterTag,sort]);

  const allTags=useMemo(()=>[...new Set(visibleEntries.flatMap(e=>e.tags||[]))]  ,[visibleEntries]);
  const tagCounts=useMemo(()=>{const m={};visibleEntries.forEach(e=>(e.tags||[]).forEach(t=>{m[t]=(m[t]||0)+1}));return m},[visibleEntries]);
  const counts=useMemo(()=>{const m={all:visibleEntries.length,starred:visibleEntries.filter(e=>e.starred).length};TYPES.forEach(t=>{m[t]=visibleEntries.filter(e=>e.type===t).length});m.links=Math.round(visibleEntries.reduce((n,e)=>n+(e.links?.length||0),0)/2);return m},[visibleEntries]);



  const exportJSON=()=>{exportEntriesJSON(entries);toast('Exported JSON')};
  const exportMD=()=>{exportEntriesMD(entries);toast('Exported Markdown')};
  const loadConstellationDemo=useCallback(async()=>{
    const existingDemo=new Set(
      entries.filter(e=>(e.tags||[]).includes('demo-constellation')).map(e=>e.id)
    );
    const demoEntries=getConstellationDemoEntries();
    const fresh=demoEntries.filter(e=>!existingDemo.has(e.id));
    if(fresh.length===0){
      setSettingsOpen(false);
      setSection('graph');
      toast('Constellation demo already loaded','info');
      return;
    }
    try{
      for(const entry of fresh)await saveEntry(entry);
      await refreshVault();
      setSettingsOpen(false);
      setSection('graph');
      toast(`Loaded ${fresh.length} constellation demo files`);
    }catch(err){reportError(err,'Demo load failed')}
  },[entries,saveEntry,refreshVault,reportError,toast]);
  const importJSON=async(file)=>{
    try{
      const existingIds=new Set(entries.map(x=>x.id));
      const{fresh,duplicates}=await importEntriesJSON(file,existingIds);
      await Promise.all(fresh.map(e=>saveEntry(e)));
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
          <ConstellationView entries={visibleEntries} onOpen={id=>setDetailId(id)} onBack={()=>setSection('all')} onAdd={openAdd}
            layoutMode={prefs.defaultLayoutMode||'messy'}
            onLayoutModeChange={mode=>setPrefs(p=>({...p,defaultLayoutMode:mode}))}
            onCreateFromMissing={createFromMissing}/>
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
              {section==='all'&&<ProgressPill count={visibleEntries.length}/>}
            </div>
          </div>
          {section==='all'&&visibleEntries.length<3&&activation.showDay2&&(
            <Day2ReturnCard count={visibleEntries.length} onAdd={openAdd} lastEntryTitle={visibleEntries[0]?.title}/>
          )}
          {section==='all'&&visibleEntries.length===1&&!activation.showDay2&&(
            <FirstSaveBanner count={visibleEntries.length} onAdd={openAdd}/>
          )}
          <div style={{flex:1,overflowY:'auto',padding:14}}>
            {storageError?(<div role="alert" style={{margin:14,padding:14,border:'1px solid #ef4444',borderRadius:'var(--rd)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontSize:13}}>Storage recovery needed for {storageError.key}. A backup was written to {storageError.quarantineKey||'a quarantine key'}; writes are blocked until recovery.</div>)
            :vaultError?(<div role="alert" style={{margin:14,padding:14,border:'1px solid #ef4444',borderRadius:'var(--rd)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontSize:13}}>Vault error: {vaultError.message}</div>)
            :!loaded?(<div style={{textAlign:'center',padding:'80px 20px',color:'var(--t3)'}}>Loading…</div>)
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

      {detail&&<DetailPanel entry={detail} entries={visibleEntries} navEntries={filtered} allTags={allTags} onClose={()=>setDetailId(null)} onUpdate={p=>updateEntry(detail.id,p)} onDelete={()=>deleteEntry(detail.id)} onToast={toast} onLink={b=>linkEntries(detail.id,b)} onUnlink={b=>unlinkEntries(detail.id,b)} onOpenEntry={id=>setDetailId(id)} onCreateFromMissing={createFromMissing} onNavigate={dir=>{const i=filtered.findIndex(e=>e.id===detail.id);const nx=filtered[i+dir];if(nx)setDetailId(nx.id)}}/>}
      {showAddModal&&<AddModal initialType={addInitialType} quickCapture={addQuickCapture} existingUrls={existingUrls} allTags={allTags} onClose={()=>setShowAddModal(false)} onAdd={e=>{addEntry(e);setShowAddModal(false)}}/>}
      {loaded&&!isOnboarded()&&visibleEntries.length===0&&(
        <WelcomePanel
          onImport={async items=>{await Promise.all(items.map(e=>saveEntry(e)));toast(`Imported ${items.length} entries`);bumpOnboarding()}}
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
        onExportJSON={exportJSON} onExportMD={exportMD} onImportJSON={importJSON} entries={visibleEntries}
        onLoadConstellationDemo={loadConstellationDemo}
        prefs={prefs} setPrefs={setPrefs}
        onClose={()=>setSettingsOpen(false)}/>}
      <Toasts toasts={toasts}/>
      <ActivationToast visible={celebrating} onDone={()=>{setCelebrating(false);setSection('graph')}}/>
    </div>
  );
}
