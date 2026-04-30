import { useState, useEffect, useMemo, useDeferredValue, useCallback, useRef } from "react";
import { updateLastSeen, logEvent, isOnboarded, useActivation, recordEntryAdded } from './onboarding/activation.js';
import { WelcomePanel } from './onboarding/WelcomePanel.jsx';
import { ProgressPill, FirstSaveBanner, Day2ReturnCard, ActivationToast } from './onboarding/nudges.jsx';
import { TYPES, ICON, LABEL } from './lib/types.js';
import { DEFAULT_FEATURE_FLAGS, filterEntriesForUI, normalizeFeatureFlags } from './lib/featureFlags.js';
import { resolveColorScheme, resolveThemeVars } from './lib/theme/resolve.js';
import { buildThemeCss } from './lib/theme/themeCss.js';
import { storage, uid, isStorageCorruptionError } from './lib/storage.js';
import { MANUAL_LINKS_FIELD } from './lib/frontmatter.js';
import { exportVaultBundle, exportEntriesMD, importVaultBundle } from './lib/exports.js';
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
import { CommandPalette } from './features/commandPalette/CommandPalette.jsx';
import { createCommandRegistry } from './lib/command/commandRegistry.js';
import { registerBuiltinCommands } from './features/commandPalette/builtinCommands.js';
import { parseSearchQuery, matchesQuery } from './lib/search/searchVault.js';
import { BaseExplorer } from './features/bases/BaseExplorer.jsx';
import { normalizeBase, serializeBase, basePath, BASE_FILE_EXT, BASE_DIR } from './lib/base/baseTypes.js';
import { CanvasExplorer } from './features/canvas/CanvasExplorer.jsx';
import { normalizeCanvas, serializeCanvas, canvasPath, CANVAS_DIR, CANVAS_FILE_EXT } from './lib/canvas/canvasTypes.js';
import { vault as vaultAdapter } from './adapters/index.js';
import { createPluginHost } from './lib/plugin/pluginHost.js';
import { Ribbon } from './features/ribbon/Ribbon.jsx';
import { UpdateBanner } from './features/updater/UpdateBanner.jsx';
import { TemplatesPanel } from './features/templates/TemplatesPanel.jsx';
import { InsertTemplateModal } from './features/templates/InsertTemplateModal.jsx';
import { QuickSwitcher } from './features/quickSwitcher/QuickSwitcher.jsx';
import { loadTemplates, applyTemplateToNote, TEMPLATE_DIR, TEMPLATE_EXT } from './lib/templates/templateStore.js';
import { pickRandomEntry } from './lib/random/randomNote.js';
import { wordCountPlugin } from './lib/plugin/builtinPlugins/wordCount.js';
import { PluginPanelSlot, createPanelStore } from './features/plugins/PluginPanelSlot.jsx';
import { useKeywordRules } from './lib/keywordRules/useKeywordRules.js';

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

  // Bases — declared up here (above useActivation + the big effects below)
  // because the load effect runs once vault is ready, and the sidebar reads
  // `bases` directly during render. Placement matters: the prior TDZ regression
  // in commit e479292 was caused by a memo declared below its consumer.
  const[bases,setBases]=useState([]);
  const currentBaseId=section.startsWith('base:')?section.slice(5):null;
  const currentBase=useMemo(()=>bases.find(b=>b.id===currentBaseId)||null,[bases,currentBaseId]);

  // Canvases — same TDZ-prevention pattern as bases. Declared above the
  // big effects + before useActivation reads. The `currentCanvasId`
  // derivation is inline so we don't introduce a memo dependency cycle.
  const[canvases,setCanvases]=useState([]);
  const currentCanvasId=section.startsWith('canvas:')?section.slice(7):null;

  // Command palette: registry instance lives once per App mount; the
  // open flag drives the modal. Builtin commands are registered after
  // the appCtx callbacks below are constructed (see effect further down).
  const[paletteOpen,setPaletteOpen]=useState(false);
  const[quickSwitcherOpen,setQuickSwitcherOpen]=useState(false);
  const[insertTemplateOpen,setInsertTemplateOpen]=useState(false);
  const[templates,setTemplates]=useState([]);
  const commandRegistryRef=useRef(null);
  if(commandRegistryRef.current===null){commandRegistryRef.current=createCommandRegistry();}
  const commandRegistry=commandRegistryRef.current;

  // Plugin host + panel store. Same per-App-mount instance pattern as
  // the command registry. The host gets an appContext built from
  // capability-style methods so plugins can extend the UI without
  // reaching into App's mutable state.
  const panelStoreRef=useRef(null);
  if(panelStoreRef.current===null){panelStoreRef.current=createPanelStore();}
  const panelStore=panelStoreRef.current;
  const pluginHostRef=useRef(null);

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

  // Cmd/Ctrl+P toggles the command palette globally — the only kbd
  // handler the palette itself doesn't own (Esc + arrows are handled
  // inside the modal). Suppressed while typing in inputs unless the
  // palette is already open (so users can re-press to close).
  useEffect(()=>{
    const onKey=e=>{
      const isP=e.key==='p'||e.key==='P';
      const isO=e.key==='o'||e.key==='O';
      const mod=e.metaKey||e.ctrlKey;
      if(!mod||(!isP&&!isO))return;
      const inField=e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable;
      // Cmd/Ctrl+P → command palette. Cmd/Ctrl+O → quick switcher.
      // Suppressed while typing in inputs unless the matching modal is
      // already open (so users can re-press to close).
      if(isP){
        if(inField&&!paletteOpen)return;
        e.preventDefault();
        setPaletteOpen(o=>!o);
        return;
      }
      if(isO){
        if(inField&&!quickSwitcherOpen)return;
        e.preventDefault();
        setQuickSwitcherOpen(o=>!o);
      }
    };
    document.addEventListener('keydown',onKey);
    return()=>document.removeEventListener('keydown',onKey);
  },[paletteOpen,quickSwitcherOpen]);

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

  // Load all .base.json files from the vault. Runs once the vault is open
  // and again after refreshVault() (e.g. after a save). Files that fail to
  // parse are skipped silently — bases are user-editable JSON and a hand-
  // edit typo shouldn't block the rest from loading.
  useEffect(()=>{
    if(!vaultInfo||vaultLoading)return;
    let cancelled=false;
    (async()=>{
      try{
        const files=await vaultAdapter.list();
        const baseFiles=files.filter(f=>f.path&&f.path.startsWith(`${BASE_DIR}/`)&&f.name.endsWith(BASE_FILE_EXT));
        const loaded=[];
        for(const bf of baseFiles){
          try{
            const content=await vaultAdapter.read(bf.path);
            const parsed=JSON.parse(content);
            loaded.push(normalizeBase(parsed));
          }catch{ /* skip malformed base */ }
        }
        if(!cancelled)setBases(loaded);
      }catch{ /* vault list failure already surfaced via useVault */ }
    })();
    return()=>{cancelled=true};
  },[vaultInfo,vaultLoading,entries.length]);

  // Persist a single base (insert-or-update) to the vault. Called from the
  // sidebar "+ New base" CTA and from BaseView's onBaseChange. We keep the
  // in-memory list authoritative so the UI updates instantly; the disk
  // write is fire-and-forget but errors surface via toast.
  const persistBase=useCallback(async(nextBase)=>{
    const normalized=normalizeBase(nextBase);
    setBases(list=>{
      const idx=list.findIndex(b=>b.id===normalized.id);
      if(idx===-1)return[...list,normalized];
      const next=list.slice();
      next[idx]=normalized;
      return next;
    });
    try{
      await vaultAdapter.write(basePath(normalized.id),serializeBase(normalized));
    }catch(err){reportError(err,'Base save failed')}
  },[reportError]);
  const handleNewBase=useCallback(async()=>{
    const created={
      id:`base-${Date.now().toString(36)}`,
      name:'New Base',
      version:1,
      filters:[],
      sorts:[],
      columns:['title','type','status','tags'],
      activeViewId:'table',
      views:[
        {id:'table',type:'table',name:'Table'},
        {id:'cards',type:'cards',name:'Cards'},
        {id:'list',type:'list',name:'List'},
      ],
    };
    await persistBase(created);
    setSection(`base:${created.id}`);
  },[persistBase]);

  // Load all .canvas.json files from the vault. Same skip-on-malformed
  // convention as bases — a hand-edit typo in one canvas shouldn't keep
  // the rest from loading.
  useEffect(()=>{
    if(!vaultInfo||vaultLoading)return;
    let cancelled=false;
    (async()=>{
      try{
        const files=await vaultAdapter.list();
        const canvasFiles=files.filter(f=>f.path&&f.path.startsWith(`${CANVAS_DIR}/`)&&f.name.endsWith(CANVAS_FILE_EXT));
        const loaded=[];
        for(const cf of canvasFiles){
          try{
            const content=await vaultAdapter.read(cf.path);
            const parsed=JSON.parse(content);
            loaded.push(normalizeCanvas(parsed));
          }catch{ /* skip malformed canvas */ }
        }
        if(!cancelled)setCanvases(loaded);
      }catch{ /* vault list failure already surfaced via useVault */ }
    })();
    return()=>{cancelled=true};
  },[vaultInfo,vaultLoading,entries.length]);

  // Persist a single canvas (insert-or-update). Mirrors persistBase: the
  // in-memory list is authoritative for instant UI feedback, the disk
  // write is async with errors surfaced via toast.
  const persistCanvas=useCallback(async(nextCanvas)=>{
    const normalized=normalizeCanvas(nextCanvas);
    setCanvases(list=>{
      const idx=list.findIndex(c=>c.id===normalized.id);
      if(idx===-1)return[...list,normalized];
      const next=list.slice();
      next[idx]=normalized;
      return next;
    });
    try{
      await vaultAdapter.write(canvasPath(normalized.id),JSON.stringify(serializeCanvas(normalized),null,2));
    }catch(err){reportError(err,'Canvas save failed')}
  },[reportError]);
  const handleNewCanvas=useCallback(async()=>{
    const created={
      version:1,
      id:`canvas-${Date.now().toString(36)}`,
      name:'New Canvas',
      nodes:[],
      edges:[],
    };
    await persistCanvas(created);
    setSection(`canvas:${created.id}`);
  },[persistCanvas]);

  // Load templates from <vault>/templates/ on vault ready. Same
  // skip-on-malformed convention as bases + canvases.
  useEffect(()=>{
    if(!vaultInfo||vaultLoading)return;
    let cancelled=false;
    (async()=>{
      try{
        const list=await loadTemplates(vaultAdapter);
        if(!cancelled)setTemplates(list);
      }catch{ /* silent — templates are optional */ }
    })();
    return()=>{cancelled=true};
  },[vaultInfo,vaultLoading,entries.length]);

  // ── Keyword Library wiring ──────────────────────────────────────────────
  // All rules + opt-outs + provenance lives in useKeywordRules. App.jsx is the
  // consumer: gives it deps, gets back the wrapped saveEntry + handlers used
  // by SettingsPanel / KeywordRulesPanel + the entry-delete provenance cleanup.
  const{keywordRules,handleKeywordRulesChange,saveEntryWithRules,handleRescanVault,clearProvenance}=useKeywordRules({vaultAdapter,vaultInfo,vaultLoading,saveEntry,entries,toast,reportError});

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
      await saveEntryWithRules(next);
      const newCount=entries.length+1;
      recordEntryAdded(newCount,date);
      if(newCount===3)setCelebrating(true);
      toast(`${ICON[entry.type]} Entry saved`);
    }catch(err){reportError(err,'Entry save failed')}
  },[entries.length,saveEntryWithRules,toast,reportError]);

  // Phase 7 helpers: callbacks the command palette + plugins consume
  // through appCtx. Defined here so they close over the freshest state.
  const toggleTheme=useCallback(()=>{
    setDarkMode(m=>m==='dark'?'light':m==='light'?'system':'dark');
    toast(`Theme: ${darkMode==='dark'?'light':darkMode==='light'?'system':'dark'}`,'info');
  },[darkMode,toast]);

  const createDailyNote=useCallback(async()=>{
    const todayIso=new Date().toISOString().slice(0,10);
    const existing=entries.find(e=>e.type==='journal'&&(e.entry_date===todayIso||e.title===todayIso));
    if(existing){setSection('all');setDetailId(existing.id);toast('Opened today’s journal','info');return existing.id}
    const date=new Date().toISOString();
    const next={id:uid(),type:'journal',title:todayIso,notes:`# ${todayIso}\n\n`,tags:['daily'],status:'draft',entry_date:todayIso,date,starred:false,links:[]};
    try{
      await saveEntryWithRules(next);
      await refreshVault();
      setSection('all');
      setDetailId(next.id);
      toast('Daily note created');
      return next.id;
    }catch(err){reportError(err,'Daily note failed');return null}
  },[entries,saveEntryWithRules,refreshVault,toast,reportError]);

  const focusSearch=useCallback(()=>{
    setTimeout(()=>document.querySelector('input[placeholder^="Search"]')?.focus(),0);
  },[]);

  // Phase A — Ribbon action handlers + Cmd+O Quick Switcher + Random Note.
  // These are invoked from both the Ribbon component and the command palette
  // builtins so users get keyboard + click parity for every action.
  const openRandomNote=useCallback(()=>{
    const picked=pickRandomEntry(visibleEntries);
    if(!picked){toast('No entries to pick from','info');return}
    setDetailId(picked.id);
    toast(`🎲 Opened "${picked.title||'Untitled'}"`,'info');
  },[visibleEntries,toast]);

  const openQuickSwitcher=useCallback(()=>setQuickSwitcherOpen(true),[]);
  const openInsertTemplate=useCallback(()=>{
    if(!templates.length){toast('No templates yet — create one in templates/','info');return}
    setInsertTemplateOpen(true);
  },[templates.length,toast]);

  // Insert template body at cursor in the active note's notes textarea.
  // Resolves variables ({{date}}, {{title}}, etc.) before splicing.
  const handleInsertTemplate=useCallback(async(template)=>{
    setInsertTemplateOpen(false);
    if(!template||!detailId)return;
    const active=entries.find(e=>e.id===detailId);
    if(!active)return;
    const ctx={date:new Date(),title:active.title||''};
    const resolved=applyTemplateToNote(template,ctx);
    try{
      await saveEntryWithRules({...active,notes:(active.notes||'')+'\n\n'+resolved.body});
      toast(`Inserted template "${template.name}"`);
    }catch(err){reportError(err,'Template insert failed')}
  },[detailId,entries,saveEntryWithRules,toast,reportError]);

  // Templates manage actions (panel-level): create blank template + open
  // an existing template's path in detail editor.
  const handleCreateTemplate=useCallback(async({name})=>{
    const slug=String(name||'').trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'')||`template-${Date.now().toString(36)}`;
    const path=`${TEMPLATE_DIR}/${slug}${TEMPLATE_EXT}`;
    const body=`---\ntype: note\n---\n\n# ${name||slug}\n\n`;
    try{
      await vaultAdapter.write(path,body);
      const list=await loadTemplates(vaultAdapter);
      setTemplates(list);
      toast(`Template created: ${slug}`);
    }catch(err){reportError(err,'Template create failed')}
  },[toast,reportError]);

  // Register builtin commands once the dependent callbacks are stable.
  // The disposer cleans up if the App ever unmounts (test environments).
  useEffect(()=>{
    const dispose=registerBuiltinCommands(commandRegistry,{
      openAdd,
      setSection,
      refreshVault,
      toggleTheme,
      createDailyNote,
      focusSearch,
      openRandomNote,
      openQuickSwitcher,
      openInsertTemplate,
    });
    return dispose;
  },[commandRegistry,openAdd,refreshVault,toggleTheme,createDailyNote,focusSearch,openRandomNote,openQuickSwitcher,openInsertTemplate]);

  const executeCommand=useCallback(async(id)=>{
    try{await commandRegistry.execute(id);setPaletteOpen(false)}
    catch(err){reportError(err,'Command failed')}
  },[commandRegistry,reportError]);

  // Phase 8 plugin host: build a frozen appContext from capability-style
  // methods and activate the builtin Word Count plugin once at mount.
  // entriesRef + toastRef avoid stale closures so plugin code always
  // sees the freshest state without re-creating the host on every
  // render (which would re-activate the plugin and double-register
  // commands).
  const entriesRef=useRef(entries);useEffect(()=>{entriesRef.current=entries},[entries]);
  const toastRef=useRef(toast);useEffect(()=>{toastRef.current=toast},[toast]);
  const onOpenEntryRef=useRef(setDetailId);useEffect(()=>{onOpenEntryRef.current=setDetailId},[]);
  useEffect(()=>{
    if(pluginHostRef.current)return; // host already wired
    const appContext={
      registerCommand:cmd=>commandRegistry.register(cmd),
      registerPanel:panel=>panelStore.register(panel),
      toast:(msg,type)=>toastRef.current?.(msg,type),
      onOpenEntry:id=>onOpenEntryRef.current?.(id),
      getEntries:()=>entriesRef.current||[],
    };
    const host=createPluginHost({appContext});
    host.load(wordCountPlugin);
    try{host.activate(wordCountPlugin.id)}
    catch(err){reportError(err,'Plugin activate failed')}
    pluginHostRef.current=host;
    return()=>{host.deactivateAll();pluginHostRef.current=null};
  },[commandRegistry,panelStore,reportError]);

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
      await saveEntryWithRules(next);
      await refreshVault();
      toast(`Created "${cleanTitle}"`);
      setDetailId(next.id);
      return next.id;
    }catch(err){reportError(err,'Create from missing failed');return null}
  },[saveEntryWithRules,refreshVault,toast,reportError]);

  const updateEntry=useCallback(async(id,patch)=>{
    const current=entries.find(e=>e.id===id);
    if(!current)return;
    try{await saveEntryWithRules({...current,...patch})}
    catch(err){reportError(err,'Entry update failed')}
  },[entries,saveEntryWithRules,reportError]);

  const linkEntries=useCallback(async(a,b)=>{
    if(!a||!b||a===b)return;
    const left=entries.find(e=>e.id===a),right=entries.find(e=>e.id===b);
    if(!left||!right)return;
    try{
      await Promise.all([
        saveEntryWithRules({...left,links:[...new Set([...(left.links||[]),b])],[MANUAL_LINKS_FIELD]:true}),
        saveEntryWithRules({...right,links:[...new Set([...(right.links||[]),a])],[MANUAL_LINKS_FIELD]:true}),
      ]);
    }catch(err){reportError(err,'Link save failed')}
  },[entries,saveEntryWithRules,reportError]);
  const unlinkEntries=useCallback(async(a,b)=>{
    const left=entries.find(e=>e.id===a),right=entries.find(e=>e.id===b);
    if(!left||!right)return;
    try{
      await Promise.all([
        saveEntryWithRules({...left,links:(left.links||[]).filter(x=>x!==b),[MANUAL_LINKS_FIELD]:true}),
        saveEntryWithRules({...right,links:(right.links||[]).filter(x=>x!==a),[MANUAL_LINKS_FIELD]:true}),
      ]);
    }catch(err){reportError(err,'Unlink save failed')}
  },[entries,saveEntryWithRules,reportError]);

  const deleteEntry=useCallback(async(id)=>{
    const affected=entries.filter(e=>e.id!==id&&e.links?.includes(id));
    try{
      await Promise.all(affected.map(e=>saveEntryWithRules({...e,links:e.links.filter(x=>x!==id),[MANUAL_LINKS_FIELD]:true})));
      await deleteVaultEntry(id);
      if(detailId===id){
        setDetailId(null);
      }
      // Free runtime provenance for the deleted entry (lives in useKeywordRules).
      clearProvenance(id);
      toast('Entry deleted','info');
    }catch(err){reportError(err,'Entry delete failed')}
  },[entries,detailId,saveEntryWithRules,deleteVaultEntry,toast,reportError]);

  // FIX: existingUrls passed to AddModal so it can show inline dup warning
  const existingUrls=useMemo(()=>new Set(entries.map(e=>e.url).filter(Boolean)),[entries]);

  const parsedQuery=useMemo(()=>parseSearchQuery(deferredQuery),[deferredQuery]);
  const filtered=useMemo(()=>{
    let r=visibleEntries;
    if(section==='starred')r=r.filter(e=>e.starred);else if(section!=='all')r=r.filter(e=>e.type===section);
    if(deferredQuery)r=r.filter(e=>matchesQuery(e,parsedQuery));
    if(filterStatus)r=r.filter(e=>e.status===filterStatus);
    if(filterTag)r=r.filter(e=>(e.tags||[]).includes(filterTag));
    const dec=r.map(e=>({e,ts:Date.parse(e.date)||0}));
    dec.sort((a,b)=>sort==='title'?(a.e.title||'').localeCompare(b.e.title||''):sort==='starred'?(b.e.starred?1:0)-(a.e.starred?1:0):b.ts-a.ts);
    return dec.map(x=>x.e);
  },[visibleEntries,section,deferredQuery,parsedQuery,filterStatus,filterTag,sort]);

  const allTags=useMemo(()=>[...new Set(visibleEntries.flatMap(e=>e.tags||[]))]  ,[visibleEntries]);
  const tagCounts=useMemo(()=>{const m={};visibleEntries.forEach(e=>(e.tags||[]).forEach(t=>{m[t]=(m[t]||0)+1}));return m},[visibleEntries]);
  const counts=useMemo(()=>{const m={all:visibleEntries.length,starred:visibleEntries.filter(e=>e.starred).length};TYPES.forEach(t=>{m[t]=visibleEntries.filter(e=>e.type===t).length});m.links=Math.round(visibleEntries.reduce((n,e)=>n+(e.links?.length||0),0)/2);return m},[visibleEntries]);



  const exportJSON=()=>{
    // Phase 10 vault bundle: bundles entries + bases + canvases in one file.
    // entries from useVault, bases + canvases from App state declared above.
    exportVaultBundle({entries,bases:bases||[],canvases:canvases||[]});
    toast('Exported vault bundle');
  };
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
      for(const entry of fresh)await saveEntryWithRules(entry);
      await refreshVault();
      setSettingsOpen(false);
      setSection('graph');
      toast(`Loaded ${fresh.length} constellation demo files`);
    }catch(err){reportError(err,'Demo load failed')}
  },[entries,saveEntryWithRules,refreshVault,reportError,toast]);
  const importJSON=async(file)=>{
    try{
      const existingIds=new Set(entries.map(x=>x.id));
      const{entries:entryResult,bases:importedBases,canvases:importedCanvases}=
        await importVaultBundle(file,existingIds);
      const{fresh,duplicates}=entryResult;
      // Entries → existing per-entry save path.
      await Promise.all(fresh.map(e=>saveEntryWithRules(e)));
      // Bases → write each as <vault>/bases/<id>.base.json via the vault adapter.
      for(const b of importedBases){
        try{await vaultAdapter.write(basePath(b.id),serializeBase(b))}
        catch(err){reportError(err,'Base import failed: '+b.id)}
      }
      // Canvases → write each as <vault>/canvases/<id>.canvas.json. Canvas
      // module isn't imported here yet (parallel branch), so use the locked
      // path constants directly.
      for(const c of importedCanvases){
        try{await vaultAdapter.write('canvases/'+c.id+'.canvas.json',JSON.stringify(c,null,2))}
        catch(err){reportError(err,'Canvas import failed: '+c.id)}
      }
      // Refresh vault — the bases-loader useEffect re-runs on entries.length
      // change, picking up any newly-imported .base.json files automatically.
      await refreshVault();
      const parts=[`${fresh.length} entries`];
      if(importedBases.length)parts.push(`${importedBases.length} bases`);
      if(importedCanvases.length)parts.push(`${importedCanvases.length} canvases`);
      const dupeNote=duplicates?` (${duplicates} duplicates skipped)`:'';
      toast(`Imported ${parts.join(', ')}${dupeNote}`);
    }catch(err){toast('Import failed: '+(err.message||'invalid file'),'error')}
  };

  return(
    <div className="mgn-app" style={{display:'flex',height:'100vh',background:'var(--bg)',color:'var(--tx)',fontFamily:'var(--fn)',overflow:'hidden',position:'relative'}}>
      <Ribbon
        activeRoute={section==='graph'?'graph':section==='templates'?'templates':paletteOpen?'palette':quickSwitcherOpen?'quickswitch':insertTemplateOpen?'insertTemplate':null}
        onTemplates={()=>setSection('templates')}
        onQuickSwitcher={openQuickSwitcher}
        onNewCanvas={handleNewCanvas}
        onInsertTemplate={openInsertTemplate}
        onPalette={()=>setPaletteOpen(o=>!o)}
        onRandomNote={openRandomNote}
        onDailyNote={createDailyNote}
        onGraphView={()=>setSection('graph')}
        onSettings={()=>setSettingsOpen(s=>!s)}/>
      <Sidebar open={sidebarOpen} width={sidebarOpen?prefs.sidebarWidth:58} onToggle={()=>setSidebarOpen(o=>!o)}
        section={section} setSection={handleSection} counts={counts}
        allTags={allTags} tagCounts={tagCounts} filterTag={filterTag} setFilterTag={setFilterTag}
        theme={theme} setTheme={setTheme} darkMode={darkMode} setDarkMode={setDarkMode} isDark={isDark}
        onAdd={openAdd} onExportJSON={exportJSON} onExportMD={exportMD}
        victoryColors={customColors} setVictoryColors={setCustomColors}
        onOpenSettings={()=>setSettingsOpen(s=>!s)}
        bases={bases}
        onSelectBase={id=>setSection(`base:${id}`)}
        onNewBase={handleNewBase}
        canvases={canvases}
        onSelectCanvas={id=>setSection(`canvas:${id}`)}
        onNewCanvas={handleNewCanvas}
        pluginPanelsSlot={<PluginPanelSlot panelStore={panelStore} entries={visibleEntries}/>}/>

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {section==='templates'?(
          <div style={{flex:1,overflowY:'auto',padding:24}}>
            <TemplatesPanel
              templates={templates}
              onCreate={handleCreateTemplate}
              onApplyToActive={handleInsertTemplate}
              onEdit={t=>{setSection('all');toast(`Open ${t.path} in editor (path open n/a yet)`,'info')}}
              activeEntryId={detailId}/>
          </div>
        ):currentCanvasId?(
          <CanvasExplorer
            canvases={canvases}
            canvasId={currentCanvasId}
            entries={visibleEntries}
            onSelect={id=>setSection(`canvas:${id}`)}
            onCreate={persistCanvas}
            onCanvasChange={persistCanvas}
            onOpenEntry={id=>setDetailId(id)}
            onClose={()=>setSection('all')}/>
        ):currentBaseId?(
          <BaseExplorer
            entries={visibleEntries}
            base={currentBase}
            onBaseChange={persistBase}
            onCreateBase={persistBase}
            onOpenEntry={id=>setDetailId(id)}/>
        ):section==='graph'?(
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
          onImport={async items=>{await Promise.all(items.map(e=>saveEntryWithRules(e)));toast(`Imported ${items.length} entries`);bumpOnboarding()}}
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
        keywordRules={keywordRules}
        onKeywordRulesChange={handleKeywordRulesChange}
        onRescanVault={handleRescanVault}
        onClose={()=>setSettingsOpen(false)}/>}
      <CommandPalette
        open={paletteOpen}
        registry={commandRegistry}
        onExecute={executeCommand}
        onClose={()=>setPaletteOpen(false)}
        onError={(err,cmd)=>reportError(err,`Command "${cmd?.name||'?'}" failed`)}/>
      <QuickSwitcher
        open={quickSwitcherOpen}
        entries={visibleEntries}
        onOpenEntry={id=>{setQuickSwitcherOpen(false);setDetailId(id);}}
        onCreateNote={async title=>{setQuickSwitcherOpen(false);await createFromMissing(title);}}
        onClose={()=>setQuickSwitcherOpen(false)}/>
      <InsertTemplateModal
        open={insertTemplateOpen}
        templates={templates}
        activeNoteTitle={detail?.title||''}
        onInsert={handleInsertTemplate}
        onClose={()=>setInsertTemplateOpen(false)}/>
      <Toasts toasts={toasts}/>
      <UpdateBanner/>
      <ActivationToast visible={celebrating} onDone={()=>{setCelebrating(false);setSection('graph')}}/>
    </div>
  );
}
