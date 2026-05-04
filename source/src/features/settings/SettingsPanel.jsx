import { useEffect, useState, useRef, useId } from "react";
import { ALL_ENTRY_TYPES } from '../../lib/types.js';
import { THEMES as THEMES_MAP } from '../../lib/theme/themes.js';
import { getThemeDefaults } from '../../lib/theme/defaults.js';
import { AI_PROVIDERS, getAIConfig, setAIConfig, aiComplete } from '../../lib/ai/providers.js';
import { startOpenRouterLogin } from '../../lib/ai/openrouter.js';
import { useEscapeKey } from '../../lib/hooks.js';
import { IconButton } from '../primitives/IconButton.jsx';
import { Select } from '../dropdowns/Select.jsx';
import { ThemeDropdown } from '../dropdowns/ThemeDropdown.jsx';
import { FontDropdown } from '../dropdowns/FontDropdown.jsx';
import { HexInput } from '../dropdowns/HexInput.jsx';
import { VaultPicker } from '../vault/VaultPicker.jsx';
import { PluginsPanel } from './PluginsPanel.jsx';
import { PrivacyPanel } from './PrivacyPanel.jsx';
import { KeywordRulesPanel } from './KeywordRulesPanel.jsx';
import { UpdatesPanel } from './UpdatesPanel.jsx';
import { version as APP_VERSION } from '../../../package.json';
import { vault as vaultAdapter } from '../../adapters/index.js';
import { TRASH_DIR, originalPathFromTrashPath, restoreFromTrash } from '../../lib/vaultTrash.js';

// ── Settings Panel ────────────────────────────────────────────────────────
function TrashReview(){
  const[items,setItems]=useState(null);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const load=async()=>{
    setBusy(true);setError('');
    try{
      const files=await vaultAdapter.list();
      setItems(files.filter(f=>f.type!=='folder'&&f.path?.startsWith(`${TRASH_DIR}/`)));
    }catch(err){setError(err.message||'Trash scan failed')}
    finally{setBusy(false)}
  };
  const restore=async(path)=>{
    const target=originalPathFromTrashPath(path);
    const ok=window.confirm(`Restore this file to "${target}"? Restore will fail safely if a file already exists there.`);
    if(!ok)return;
    setBusy(true);setError('');
    try{
      await restoreFromTrash(vaultAdapter,path);
      await load();
    }catch(err){setError(err.message||'Restore failed')}
    finally{setBusy(false)}
  };
  const permanentlyDelete=async(path)=>{
    let target=path;
    try{target=originalPathFromTrashPath(path)}catch{ /* keep trash path fallback */ }
    const ok=window.confirm(`Permanently delete "${target}" from JotFolio Trash? This cannot be undone.`);
    if(!ok)return;
    setBusy(true);setError('');
    try{
      await vaultAdapter.remove(path);
      await load();
    }catch(err){setError(err.message||'Permanent delete failed')}
    finally{setBusy(false)}
  };
  const emptyTrash=async()=>{
    const count=items?.length||0;
    if(count===0)return;
    const ok=window.confirm(`Permanently delete all ${count} file${count===1?'':'s'} in JotFolio Trash? This cannot be undone.`);
    if(!ok)return;
    setBusy(true);setError('');
    try{
      for(const item of items)await vaultAdapter.remove(item.path);
      await load();
    }catch(err){setError(err.message||'Empty trash failed')}
    finally{setBusy(false)}
  };
  return(
    <div style={{padding:10,background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:3,textTransform:'uppercase',letterSpacing:1.5}}>JotFolio Trash</div>
          <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5}}>Deletes move files under <code>{TRASH_DIR}</code>. Restore is safe; permanent delete and empty require confirmation.</div>
        </div>
        <button onClick={load} disabled={busy} style={{padding:'5px 10px',fontSize:11,background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:busy?'default':'pointer',fontFamily:'var(--fn)'}}>{busy?'Checking…':'Review'}</button>
      </div>
      {error&&<div role="alert" style={{fontSize:11,color:'#ef4444',marginTop:8}}>{error}</div>}
      {Array.isArray(items)&&(
        <div style={{display:'flex',flexDirection:'column',gap:4,marginTop:8}}>
          {items.length===0?(
            <div style={{fontSize:11,color:'var(--t3)'}}>Trash is empty.</div>
          ):(
          <>
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button type="button" onClick={emptyTrash} disabled={busy}
                style={{padding:'3px 9px',fontSize:11,border:'1px solid #b91c1c',borderRadius:'var(--rd)',background:'transparent',color:'#b91c1c',cursor:busy?'default':'pointer',fontFamily:'var(--fn)',fontWeight:700}}>Empty trash</button>
            </div>
            {items.slice(0,12).map(item=>{
            let target='';
            try{target=originalPathFromTrashPath(item.path)}catch{target='Unknown original path'}
            return(
              <div key={item.path} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--t2)'}}>
                <span style={{flex:1,fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={item.path}>{target}</span>
                <button type="button" onClick={()=>restore(item.path)}
                  style={{padding:'2px 8px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>Restore</button>
                <button type="button" onClick={()=>permanentlyDelete(item.path)}
                  style={{padding:'2px 8px',fontSize:11,border:'1px solid #b91c1c',borderRadius:'var(--rd)',background:'transparent',color:'#b91c1c',cursor:'pointer',fontFamily:'var(--fn)'}}>Delete</button>
              </div>
            );
          })}
          {items.length>12&&<div style={{fontSize:11,color:'var(--t3)'}}>Showing first 12 files. Empty trash applies to all {items.length} files.</div>}
          </>
          )}
        </div>
      )}
    </div>
  );
}

function VaultPanel({entries,vaultInfo,pickVault,migrateFromLocalStorage,loading,error,issues,refresh}){
  const legacyCount=entries?.length||0;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:8}}>
      <div style={{fontSize:12,color:'var(--t3)',lineHeight:1.5}}>
        Your notes can live on your disk as <code>.md</code> files in a vault folder. This makes them readable by any markdown editor — Obsidian, VS Code, Ulysses, TextEdit — and portable if JotFolio ever disappears.
      </div>
      <VaultPicker mode="inline" vaultInfo={vaultInfo} onPick={pickVault} onMigrate={migrateFromLocalStorage} legacyCount={legacyCount}/>
      <TrashReview/>
      {loading&&<div style={{fontSize:12,color:'var(--t3)'}}>Loading vault…</div>}
      {error&&<div role="alert" style={{fontSize:12,color:'#ef4444'}}>Vault error: {error.message}</div>}
      {issues?.length>0&&(
        <div style={{padding:10,background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)'}}>
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:6,textTransform:'uppercase',letterSpacing:1.5}}>Files needing review ({issues.length})</div>
          <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5,marginBottom:8}}>JotFolio skipped these files instead of overwriting them. Fix the file manually or restore a snapshot, then rescan.</div>
          {issues.slice(0,5).map((i,idx)=>(
            <div key={idx} style={{fontSize:11,color:'var(--t2)',fontFamily:'monospace',padding:'2px 0'}}>{i.path}: {i.error.message}</div>
          ))}
          <button onClick={refresh} style={{marginTop:6,padding:'4px 10px',fontSize:11,background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>↻ Rescan</button>
        </div>
      )}
    </div>
  );
}

function SystemStatusPanel({vaultInfo,loading,error,issues}){
  const[telemetry,setTelemetry]=useState(null);
  const hasDesktopBridge=typeof window!=='undefined'&&!!window.electron;
  const hasVaultBridge=typeof window!=='undefined'&&!!window.electron?.vault;
  const hasUpdater=typeof window!=='undefined'&&!!window.electron?.updater;
  const platform=typeof window!=='undefined'&&window.electron?.platform?window.electron.platform:'browser';
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const pref=await window.electron?.telemetry?.getOptIn?.();
        if(!cancelled)setTelemetry(pref||null);
      }catch{if(!cancelled)setTelemetry(null)}
    })();
    return()=>{cancelled=true};
  },[]);
  const rows=[
    ['App version',`JotFolio v${APP_VERSION}`,'This is the version baked into this build. An already-installed desktop app changes only after its installer runs or auto-update installs a release.'],
    ['Runtime',hasDesktopBridge?`Electron desktop bridge (${platform})`:'Browser preview','Browser preview uses the web fallback. Electron desktop can read/write a real disk vault and check packaged releases.'],
    ['Data location',hasVaultBridge?(vaultInfo?.path?`Disk vault: ${vaultInfo.path}`:'Disk vault not picked yet'):'Browser fallback: localStorage virtual vault','Desktop vaults are folders of markdown files. Browser preview is useful for testing, but it is not the same as a packaged desktop install.'],
    ['Vault health',loading?'Loading vault':error?`Vault error: ${error.message}`:issues?.length?`${issues.length} file${issues.length===1?'':'s'} need review`:'No vault issues reported','Broken files are skipped instead of overwritten. Use Settings > Vault to rescan after repair.'],
    ['Updates',hasUpdater?'Settings > Updates can check packaged desktop releases':'Updates unavailable in browser preview','Dev/browser previews cannot prove an installed desktop app has updated. Use the packaged installer or a published release feed.'],
    ['Telemetry',telemetry?.decided?(telemetry.enabled?'Crash reports on':'Crash reports off'):'Crash reports off by default','Settings > Privacy owns this choice. Crash telemetry is opt-in only.'],
  ];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:8}}>
      <div style={{fontSize:12,color:'var(--t3)',lineHeight:1.5}}>
        One place to answer: what am I running, what version is it, where is my data, and where do I check health?
      </div>
      {rows.map(([label,value,help])=>(
        <div key={label} style={{padding:12,background:'var(--cd)',border:'1px solid var(--br)',borderRadius:'var(--rd)'}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'var(--t3)',marginBottom:4}}>{label}</div>
          <div style={{fontSize:13,fontWeight:700,color:error&&label==='Vault health'?'#ef4444':'var(--tx)',wordBreak:'break-word'}}>{value}</div>
          <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5,marginTop:4}}>{help}</div>
        </div>
      ))}
    </div>
  );
}

function AIPanel(){
  const[cfg,setCfg]=useState(()=>getAIConfig()||{enabled:false,provider:'openrouter',model:'anthropic/claude-sonnet-4',key:'',customUrl:''});
  const[loggingIn,setLoggingIn]=useState(false);
  const[show,setShow]=useState(false);
  const[test,setTest]=useState(null); // {state:'idle'|'testing'|'ok'|'fail', msg}
  const save=(next)=>{setCfg(next);setAIConfig(next)};
  const update=(patch)=>save({...cfg,...patch});
  const sH={fontSize:10,fontWeight:700,letterSpacing:2,color:'var(--t3)',textTransform:'uppercase',marginBottom:8,marginTop:16,display:'block'};
  const inputS={width:'100%',padding:'8px 10px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--b2)',color:'var(--tx)',fontFamily:'var(--fn)',outline:'none',boxSizing:'border-box'};
  const ids={customUrl:useId(),model:useId(),apiKey:useId()};
  const provider=AI_PROVIDERS[cfg.provider]||AI_PROVIDERS.anthropic;
  const models=provider.models;
  const runTest=async()=>{
    setTest({state:'testing'});
    try{
      const r=await aiComplete({system:'Reply with only: OK',user:'test',maxTokens:8});
      if(r.toLowerCase().includes('ok'))setTest({state:'ok',msg:'Connected'});
      else setTest({state:'ok',msg:`Reply: ${r.slice(0,40)}`});
    }catch(e){setTest({state:'fail',msg:e.message.slice(0,100)})}
  };
  return(
    <>
      <div style={{fontSize:12,color:'var(--t3)',lineHeight:1.5,marginBottom:8,marginTop:8}}>
        Experimental helper layer. JotFolio's core organization should work without AI through your vault, Keyword Library, and saved views. BYOK keeps any model calls between this app and the provider you choose.
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--br)'}}>
        <span id="ai-enabled-label" style={{fontSize:13,color:'var(--tx)'}}>Enable experimental AI helpers</span>
        <button onClick={()=>update({enabled:!cfg.enabled})}
          aria-labelledby="ai-enabled-label" aria-pressed={cfg.enabled}
          style={{width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',background:cfg.enabled?'var(--ac)':'var(--br)',position:'relative',transition:'background 0.2s'}}>
          <span style={{position:'absolute',top:2,left:cfg.enabled?20:2,width:18,height:18,borderRadius:9,background:cfg.enabled?'var(--act)':'var(--t3)',transition:'left 0.2s'}}/>
        </button>
      </div>
      <span style={sH}>Provider</span>
      <Select ariaLabel="AI provider" value={cfg.provider} onChange={v=>update({provider:v,model:AI_PROVIDERS[v]?.models?.[0]||'',customUrl:v==='custom'?cfg.customUrl:''})}
        options={Object.entries(AI_PROVIDERS).map(([k,p])=>({value:k,label:p.label}))}/>
      {cfg.provider==='custom'&&<>
        <label htmlFor={ids.customUrl} style={sH}>Custom endpoint URL</label>
        <input id={ids.customUrl} type="text" value={cfg.customUrl||''} onChange={e=>update({customUrl:e.target.value})} placeholder="https://openrouter.ai/api/v1/chat/completions" style={inputS} spellCheck={false}/>
      </>}
      <span style={sH}>Model</span>
      {models.length>0?(
        <Select ariaLabel="AI model" value={cfg.model} onChange={v=>update({model:v})}
          options={models.map(m=>({value:m,label:m}))}/>
      ):(
        <input id={ids.model} aria-label="AI model" type="text" value={cfg.model||''} onChange={e=>update({model:e.target.value})} placeholder="Model name" style={inputS} spellCheck={false}/>
      )}
      <label htmlFor={ids.apiKey} style={sH}>API key</label>
      {cfg.provider==='openrouter'&&(
        <button onClick={async()=>{setLoggingIn(true);try{await startOpenRouterLogin()}catch(e){setLoggingIn(false);setTest({state:'fail',msg:e.message})}}}
          disabled={loggingIn}
          style={{width:'100%',padding:'10px 14px',marginBottom:8,fontSize:13,background:'var(--ac)',color:'var(--act)',border:'none',borderRadius:'var(--rd)',cursor:loggingIn?'default':'pointer',fontFamily:'var(--fn)',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:loggingIn?0.6:1}}>
          {loggingIn?'Redirecting to OpenRouter…':'↗ Log in with OpenRouter'}
        </button>
      )}
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <input id={ids.apiKey} type={show?'text':'password'} value={cfg.key||''} onChange={e=>update({key:e.target.value})}
          placeholder={cfg.provider==='ollama'?'(optional for local)':cfg.provider==='openrouter'?'sk-or-… (or use Log in above)':'sk-...'} spellCheck={false} autoComplete="off"
          style={{...inputS,flex:1,fontFamily:'monospace'}}/>
        <button onClick={()=>setShow(s=>!s)} title={show?'Hide':'Show'} aria-label={show?'Hide API key':'Show API key'}
          style={{padding:'7px 10px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>
          {show?'🙈':'👁'}
        </button>
      </div>
      <div style={{display:'flex',gap:6,marginTop:10,alignItems:'center'}}>
        <button onClick={runTest} disabled={!cfg.enabled||!cfg.key||test?.state==='testing'}
          style={{padding:'7px 14px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--ac)',color:'var(--act)',cursor:cfg.enabled&&cfg.key?'pointer':'default',fontFamily:'var(--fn)',fontWeight:700,opacity:cfg.enabled&&cfg.key?1:0.4}}>
          {test?.state==='testing'?'Testing…':'Test connection'}
        </button>
        {test?.state==='ok'&&<span style={{fontSize:11,color:'#10b981',fontWeight:700}}>✓ {test.msg}</span>}
        {test?.state==='fail'&&<span style={{fontSize:11,color:'#ef4444',fontWeight:700}}>✗ {test.msg}</span>}
      </div>
      <div style={{fontSize:10,color:'var(--t3)',marginTop:12,lineHeight:1.5}}>
        Key stored in your browser's localStorage. Never sent to JotFolio servers. Deleted by clearing site data.
      </div>
    </>
  );
}

export function SettingsPanel({theme,setTheme,darkMode,setDarkMode,isDark,victoryColors,setVictoryColors,onExportJSON,onExportMD,onImportJSON,onLoadConstellationDemo,entries,entryCount,prefs,setPrefs,keywordRules,onKeywordRulesChange,onRescanVault,vaultInfo,pickVault,migrateFromLocalStorage,vaultLoading,vaultError,vaultIssues,refreshVault,onClose}){
  const[tab,setTab]=useState('appearance');
  const[advanced,setAdvanced]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('mgn-settings-advanced'))===true}catch{return false}
  });
  const toggleAdvanced=()=>{const next=!advanced;setAdvanced(next);localStorage.setItem('mgn-settings-advanced',JSON.stringify(next))};
  const fileRef=useRef(null);
  const importId=useId();
  useEscapeKey(true,onClose);
  const sH={fontSize:10,fontWeight:700,letterSpacing:2,color:'var(--t3)',textTransform:'uppercase',marginBottom:8,marginTop:16,display:'block'};
  const rowStyle={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--br)'};
  const segBtn=(active)=>({flex:1,padding:'8px 4px',fontSize:11,border:`2px solid ${active?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rd)',background:active?'var(--ac)':'transparent',color:active?'var(--act)':'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'});
  const togBtn=(on)=>({width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',background:on?'var(--ac)':'var(--br)',position:'relative',transition:'background 0.2s'});
  const togDot=(on)=>({position:'absolute',top:2,left:on?20:2,width:18,height:18,borderRadius:9,background:on?'var(--act)':'var(--t3)',transition:'left 0.2s'});
  const tabs=[['appearance','Appearance'],['library','Library'],['keyword-rules','Keyword Library'],['vault','Vault'],['system','System'],['updates','Updates'],['privacy','Privacy'],['ai','AI'],['plugins','Plugins'],['data','Data'],['shortcuts','Shortcuts']];
  // customColors is victoryColors prop (renamed at call site)
  const cc=victoryColors[theme]||null;
  const defaults=getThemeDefaults(theme,isDark);
  const currentColors=cc||defaults;
  const setColor=(key,val)=>setVictoryColors(prev=>{
    const next={...(prev[theme]||defaults),[key]:val};
    const eq=s=>(s||'').toLowerCase();
    if(eq(next.ac)===eq(defaults.ac)&&eq(next.bg)===eq(defaults.bg)&&eq(next.fg)===eq(defaults.fg)&&eq(next.b2)===eq(defaults.b2)){
      const out={...prev};delete out[theme];return out;
    }
    return{...prev,[theme]:next};
  });
  const resetColors=()=>setVictoryColors(prev=>{const next={...prev};delete next[theme];return next;});
  return(
    <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="mgn-panel"
      style={{position:'fixed',right:0,top:0,bottom:0,width:'min(420px,100vw)',background:'var(--bg)',borderLeft:'1px solid var(--br)',display:'flex',flexDirection:'column',zIndex:120}}>
      <div style={{padding:'14px 16px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
        <span style={{fontSize:16}}>⚙️</span>
        <span id="settings-title" style={{fontWeight:700,fontSize:14,flex:1}}>Settings</span>
        <IconButton onClick={onClose} label="Close settings" style={{fontSize:22}}>×</IconButton>
      </div>
      <div style={{display:'flex',borderBottom:'1px solid var(--br)',flexShrink:0,flexWrap:'wrap'}}>
        {tabs.map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)}
            style={{flex:'1 0 72px',padding:'9px 6px',fontSize:11,fontWeight:tab===key?700:400,color:tab===key?'var(--ac)':'var(--t3)',background:'transparent',border:'none',borderBottom:tab===key?'2px solid var(--ac)':'2px solid transparent',cursor:'pointer',fontFamily:'var(--fn)'}}>
            {label}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'4px 16px 16px'}}>
        {tab==='appearance'&&<>
          {!advanced&&<>
            <span style={sH}>Theme</span>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:6,marginBottom:12}}>
              {['glass','minimal','sakura','ink','cobalt','neo'].filter(k=>THEMES_MAP[k]).map(k=>(
                <button key={k} onClick={()=>setTheme(k)}
                  style={{padding:'10px 8px',background:theme===k?'var(--b2)':'var(--cd)',border:`1px solid ${theme===k?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:11,color:'var(--tx)'}}>
                  {THEMES_MAP[k].name}
                </button>
              ))}
            </div>
            <span style={sH}>Mode</span>
            <div style={{display:'flex',gap:4,marginBottom:12}}>
              {[['light','☀️','Light'],['system','⚙️','System'],['dark','🌙','Dark']].map(([mode,icon,label])=>(
                <button key={mode} onClick={()=>setDarkMode(mode)} aria-label={label+' mode'} aria-pressed={darkMode===mode}
                  style={{flex:1,padding:'10px 4px',fontSize:12,border:`2px solid ${darkMode===mode?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rd)',background:darkMode===mode?'var(--ac)':'transparent',color:darkMode===mode?'var(--act)':'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <span style={{fontSize:18}}>{icon}</span><span style={{fontSize:10}}>{label}</span>
                </button>
              ))}
            </div>
            <span style={sH}>UI Scale</span>
            <div style={rowStyle}>
              <span style={{fontSize:13,color:'var(--tx)'}}>Zoom level</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="range" min={11} max={16} value={prefs.fontSize} onChange={e=>setPrefs(p=>({...p,fontSize:Number(e.target.value)}))} style={{width:80,accentColor:'var(--ac)'}} aria-label="UI scale"/>
                <span style={{fontSize:11,color:'var(--t2)',fontFamily:'monospace',minWidth:40,textAlign:'right'}}>{Math.round(prefs.fontSize/13*100)}%</span>
              </div>
            </div>
          </>}
          {advanced&&<>
          <span style={sH}>Theme</span>
          <ThemeDropdown value={theme} onChange={setTheme} customColors={victoryColors} isDark={isDark}/>
          <span style={sH}>Custom Colors</span>
          {[['ac','Accent'],['b2','Surface'],['bg','Background'],['fg','Foreground']].map(([key,label])=>(
            <div key={key} style={rowStyle}>
              <span style={{fontSize:13,color:'var(--tx)'}}>{label}</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="color" value={currentColors[key]||'#000000'} onChange={e=>setColor(key,e.target.value)}
                  style={{width:24,height:24,border:'1px solid var(--br)',borderRadius:'var(--rd)',padding:0,cursor:'pointer',background:'none'}}/>
                <HexInput value={currentColors[key]||''} onCommit={val=>setColor(key,val)}/>
              </div>
            </div>
          ))}
          <div style={{display:'flex',gap:6,marginTop:8}}>
            <button onClick={resetColors}
              style={{flex:1,padding:'6px 12px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t3)',cursor:'pointer',fontFamily:'var(--fn)'}}>Reset to default</button>
            {cc&&<span style={{fontSize:10,color:'var(--ac)',alignSelf:'center',fontWeight:700}}>customized</span>}
          </div>
          <span style={sH}>Mode</span>
          <div style={{display:'flex',gap:4}}>
            {[['light','☀️','Light'],['system','⚙️','System'],['dark','🌙','Dark']].map(([mode,icon,label])=>(
              <button key={mode} onClick={()=>setDarkMode(mode)} aria-label={label+' mode'} aria-pressed={darkMode===mode}
                style={{flex:1,padding:'10px 4px',fontSize:12,border:`2px solid ${darkMode===mode?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rd)',background:darkMode===mode?'var(--ac)':'transparent',color:darkMode===mode?'var(--act)':'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <span style={{fontSize:18}}>{icon}</span><span style={{fontSize:10}}>{label}</span>
              </button>
            ))}
          </div>
          <span style={sH}>Font</span>
          <FontDropdown value={prefs.fontFamily} onChange={val=>setPrefs(p=>({...p,fontFamily:val}))}/>
          <span style={sH}>UI Scale</span>
          <div style={rowStyle}>
            <span style={{fontSize:13,color:'var(--tx)'}}>Zoom level</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="range" min={11} max={16} value={prefs.fontSize} onChange={e=>setPrefs(p=>({...p,fontSize:Number(e.target.value)}))} style={{width:80,accentColor:'var(--ac)'}} aria-label="UI scale"/>
              <span style={{fontSize:11,color:'var(--t2)',fontFamily:'monospace',minWidth:40,textAlign:'right'}}>{Math.round(prefs.fontSize/13*100)}%</span>
            </div>
          </div>
          <span style={sH}>Card Density</span>
          <div style={{display:'flex',gap:4}}>
            {[['compact','Compact'],['comfortable','Comfortable'],['spacious','Spacious']].map(([val,label])=>(
              <button key={val} onClick={()=>setPrefs(p=>({...p,cardDensity:val}))} style={segBtn(prefs.cardDensity===val)}>{label}</button>
            ))}
          </div>
          <span style={sH}>Sidebar</span>
          <div style={{display:'flex',gap:4}}>
            {[[180,'Narrow'],[240,'Standard'],[300,'Wide']].map(([val,label])=>(
              <button key={val} onClick={()=>setPrefs(p=>({...p,sidebarWidth:val}))} style={segBtn(prefs.sidebarWidth===val)}>{label}</button>
            ))}
          </div>
          </>}
          <div style={{marginTop:18,paddingTop:12,borderTop:'1px solid var(--br)',textAlign:'center'}}>
            <button onClick={toggleAdvanced} style={{padding:'4px 10px',fontSize:11,background:'transparent',border:'none',color:'var(--t3)',cursor:'pointer',fontFamily:'var(--fn)',textDecoration:'underline'}}>
              {advanced?'▾ Hide advanced':'▸ Show advanced'}
            </button>
          </div>
        </>}
        {tab==='library'&&<>
          <span style={sH}>Default View</span>
          <div style={{display:'flex',gap:4}}>
            {[['grid','⊞','Grid'],['list','☰','List']].map(([val,icon,label])=>(
              <button key={val} onClick={()=>setPrefs(p=>({...p,defaultView:val}))}
                style={{...segBtn(prefs.defaultView===val),display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'10px 4px'}}>
                <span style={{fontSize:18}}>{icon}</span><span style={{fontSize:10}}>{label}</span>
              </button>
            ))}
          </div>
          <span style={sH}>Default Sort</span>
          <div style={{display:'flex',gap:4}}>
            {[['date','Newest'],['title','A–Z'],['starred','Starred']].map(([val,label])=>(
              <button key={val} onClick={()=>setPrefs(p=>({...p,defaultSort:val}))} style={segBtn(prefs.defaultSort===val)}>{label}</button>
            ))}
          </div>
          <span style={sH}>Card Display</span>
          {[['showNotesPreview','Show notes preview'],['showDateOnCards','Show date'],['showTagsOnCards','Show tags']].map(([key,label])=>(
            <div key={key} style={rowStyle}>
              <span style={{fontSize:13,color:'var(--tx)'}}>{label}</span>
              <button onClick={()=>setPrefs(p=>({...p,[key]:!p[key]}))} style={togBtn(prefs[key])}><span style={togDot(prefs[key])}/></button>
            </div>
          ))}
        </>}
        {tab==='keyword-rules'&&(
          <KeywordRulesPanel rules={keywordRules} onRulesChange={onKeywordRulesChange} onRescanVault={onRescanVault} entryCount={entryCount ?? entries?.length ?? 0}/>
        )}
        {tab==='ai'&&<AIPanel/>}
        {tab==='data'&&<>
          <span style={sH}>Export</span>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            <button onClick={onExportJSON} style={{flex:1,padding:'10px 12px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:600}}>↓ Export JSON</button>
            <button onClick={onExportMD} style={{flex:1,padding:'10px 12px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:600}}>↓ Export Markdown</button>
          </div>
          <span style={sH}>Import</span>
          <input ref={fileRef} id={importId} aria-label="Import JSON file" type="file" accept=".json,application/json" style={{display:'none'}}
            onChange={e=>{const f=e.target.files?.[0];if(f){onImportJSON(f);e.target.value=''}}}/>
          <button onClick={()=>fileRef.current?.click()}
            style={{width:'100%',padding:'10px 12px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:600,marginBottom:16}}>↑ Import JSON</button>
          <div style={{fontSize:11,color:'var(--t3)',marginTop:-10,marginBottom:16}}>Duplicate IDs are skipped; tags normalized.</div>
          <span style={sH}>Library Stats</span>
          <div style={{fontSize:13,color:'var(--t2)',lineHeight:1.8}}>
            {entries.length} total entries across {ALL_ENTRY_TYPES.filter(t=>entries.some(e=>e.type===t)).length} content types. {entries.filter(e=>e.starred).length} starred. {[...new Set(entries.flatMap(e=>e.tags||[]))].length} unique tags.
          </div>
          <span style={sH}>Onboarding</span>
          <button onClick={()=>{localStorage.removeItem('mgn-onboarded');onClose();setTimeout(()=>location.reload(),50)}}
            style={{width:'100%',padding:'10px 12px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:600,marginBottom:16}}>↺ Reopen welcome</button>
          <span style={sH}>Sample data</span>
          <button onClick={onLoadConstellationDemo}
            style={{width:'100%',padding:'10px 12px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:600,marginBottom:8}}>
            Load sample constellation data
          </button>
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:16,lineHeight:1.5}}>
            Optional test content for trying Constellation. It adds sample entries tagged <code>demo-constellation</code> to the current vault.
          </div>
        </>}
        {tab==='vault'&&<VaultPanel entries={entries} vaultInfo={vaultInfo} pickVault={pickVault} migrateFromLocalStorage={migrateFromLocalStorage} loading={vaultLoading} error={vaultError} issues={vaultIssues} refresh={refreshVault}/>}
        {tab==='system'&&<SystemStatusPanel vaultInfo={vaultInfo} loading={vaultLoading} error={vaultError} issues={vaultIssues}/>}
        {tab==='updates'&&<UpdatesPanel/>}
        {tab==='plugins'&&<PluginsPanel/>}
        {tab==='privacy'&&<PrivacyPanel/>}
        {tab==='shortcuts'&&<>
          <span style={sH}>Keyboard Shortcuts</span>
          <div style={{display:'flex',flexDirection:'column',gap:1}}>
            {[
              ['N','New entry'],
              ['/','Focus search'],
              ['Esc','Close panel / modal'],
              ['↑ ↓','Navigate theme / font list'],
              ['Home','Jump to first theme'],
              ['End','Jump to last theme'],
              ['Enter','Select highlighted option'],
            ].map(([key,desc])=>(
              <div key={desc} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--br)'}}>
                <span style={{fontSize:12,color:'var(--t2)'}}>{desc}</span>
                <kbd style={{padding:'3px 10px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--b2)',color:'var(--t3)',fontFamily:'monospace',minWidth:24,textAlign:'center'}}>{key}</kbd>
              </div>
            ))}
          </div>
        </>}
      </div>
      <div style={{padding:'12px 16px',borderTop:'1px solid var(--br)',flexShrink:0,textAlign:'center'}}>
        <span style={{fontSize:11,color:'var(--t3)'}}>JotFolio v{APP_VERSION}</span>
      </div>
    </div>
  );
}
