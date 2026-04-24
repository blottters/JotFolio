import { useState, useRef } from "react";
import { TYPES } from '../../lib/types.js';
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
import { useVault } from '../vault/useVault.js';
import { PluginsPanel } from './PluginsPanel.jsx';
import { PrivacyPanel } from './PrivacyPanel.jsx';
import { version as APP_VERSION } from '../../../package.json';

// ── Settings Panel ────────────────────────────────────────────────────────
function VaultPanel({entries}){
  const {vaultInfo, pickVault, migrateFromLocalStorage, loading, error, issues, refresh}=useVault();
  const legacyCount=entries?.length||0;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:8}}>
      <div style={{fontSize:12,color:'var(--t3)',lineHeight:1.5}}>
        Your notes can live on your disk as <code>.md</code> files in a vault folder. This makes them readable by any markdown editor — Obsidian, VS Code, Ulysses, TextEdit — and portable if JotFolio ever disappears.
      </div>
      <VaultPicker mode="inline" vaultInfo={vaultInfo} onPick={pickVault} onMigrate={migrateFromLocalStorage} legacyCount={legacyCount}/>
      {loading&&<div style={{fontSize:12,color:'var(--t3)'}}>Loading vault…</div>}
      {error&&<div role="alert" style={{fontSize:12,color:'#ef4444'}}>Vault error: {error.message}</div>}
      {issues?.length>0&&(
        <div style={{padding:10,background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)'}}>
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:6,textTransform:'uppercase',letterSpacing:1.5}}>Issues ({issues.length})</div>
          {issues.slice(0,5).map((i,idx)=>(
            <div key={idx} style={{fontSize:11,color:'var(--t2)',fontFamily:'monospace',padding:'2px 0'}}>{i.path}: {i.error.message}</div>
          ))}
          <button onClick={refresh} style={{marginTop:6,padding:'4px 10px',fontSize:11,background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>↻ Rescan</button>
        </div>
      )}
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
        BYOK — your API key, never sent anywhere except the provider you pick. Used by features like auto-tagging and related-entry suggestions when they run.
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--br)'}}>
        <span style={{fontSize:13,color:'var(--tx)'}}>Enable AI features</span>
        <button onClick={()=>update({enabled:!cfg.enabled})}
          style={{width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',background:cfg.enabled?'var(--ac)':'var(--br)',position:'relative',transition:'background 0.2s'}}>
          <span style={{position:'absolute',top:2,left:cfg.enabled?20:2,width:18,height:18,borderRadius:9,background:cfg.enabled?'var(--act)':'var(--t3)',transition:'left 0.2s'}}/>
        </button>
      </div>
      <span style={sH}>Provider</span>
      <Select ariaLabel="AI provider" value={cfg.provider} onChange={v=>update({provider:v,model:AI_PROVIDERS[v]?.models?.[0]||'',customUrl:v==='custom'?cfg.customUrl:''})}
        options={Object.entries(AI_PROVIDERS).map(([k,p])=>({value:k,label:p.label}))}/>
      {cfg.provider==='custom'&&<>
        <span style={sH}>Custom endpoint URL</span>
        <input type="text" value={cfg.customUrl||''} onChange={e=>update({customUrl:e.target.value})} placeholder="https://api.example.com/v1/chat/completions" style={inputS} spellCheck={false}/>
      </>}
      <span style={sH}>Model</span>
      {models.length>0?(
        <Select ariaLabel="AI model" value={cfg.model} onChange={v=>update({model:v})}
          options={models.map(m=>({value:m,label:m}))}/>
      ):(
        <input type="text" value={cfg.model||''} onChange={e=>update({model:e.target.value})} placeholder="Model name" style={inputS} spellCheck={false}/>
      )}
      <span style={sH}>API key</span>
      {cfg.provider==='openrouter'&&(
        <button onClick={async()=>{setLoggingIn(true);try{await startOpenRouterLogin()}catch(e){setLoggingIn(false);setTest({state:'fail',msg:e.message})}}}
          disabled={loggingIn}
          style={{width:'100%',padding:'10px 14px',marginBottom:8,fontSize:13,background:'var(--ac)',color:'var(--act)',border:'none',borderRadius:'var(--rd)',cursor:loggingIn?'default':'pointer',fontFamily:'var(--fn)',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:loggingIn?0.6:1}}>
          {loggingIn?'Redirecting to OpenRouter…':'↗ Log in with OpenRouter'}
        </button>
      )}
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <input type={show?'text':'password'} value={cfg.key||''} onChange={e=>update({key:e.target.value})}
          placeholder={cfg.provider==='ollama'?'(optional for local)':cfg.provider==='openrouter'?'sk-or-… (or use Log in above)':'sk-...'} spellCheck={false} autoComplete="off"
          style={{...inputS,flex:1,fontFamily:'monospace'}}/>
        <button onClick={()=>setShow(s=>!s)} title={show?'Hide':'Show'}
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

export function SettingsPanel({theme,setTheme,darkMode,setDarkMode,isDark,victoryColors,setVictoryColors,onExportJSON,onExportMD,onImportJSON,entries,prefs,setPrefs,onClose}){
  const[tab,setTab]=useState('appearance');
  const[advanced,setAdvanced]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('mgn-settings-advanced'))===true}catch{return false}
  });
  const toggleAdvanced=()=>{const next=!advanced;setAdvanced(next);localStorage.setItem('mgn-settings-advanced',JSON.stringify(next))};
  const[aiEnabled,setAiEnabled]=useState(()=>!!getAIConfig()?.enabled);
  const toggleAI=()=>{
    const cur=getAIConfig()||{};
    const next={...cur,enabled:!cur.enabled};
    setAIConfig(next);
    setAiEnabled(!!next.enabled);
  };
  const fileRef=useRef(null);
  useEscapeKey(true,onClose);
  const sH={fontSize:10,fontWeight:700,letterSpacing:2,color:'var(--t3)',textTransform:'uppercase',marginBottom:8,marginTop:16,display:'block'};
  const rowStyle={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--br)'};
  const segBtn=(active)=>({flex:1,padding:'8px 4px',fontSize:11,border:`2px solid ${active?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rd)',background:active?'var(--ac)':'transparent',color:active?'var(--act)':'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'});
  const togBtn=(on)=>({width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',background:on?'var(--ac)':'var(--br)',position:'relative',transition:'background 0.2s'});
  const togDot=(on)=>({position:'absolute',top:2,left:on?20:2,width:18,height:18,borderRadius:9,background:on?'var(--act)':'var(--t3)',transition:'left 0.2s'});
  const tabs=[['appearance','Appearance'],['library','Library'],['vault','Vault'],['plugins','Plugins'],['ai','AI'],['privacy','Privacy'],['data','Data'],['shortcuts','Shortcuts']];
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
      <div style={{display:'flex',borderBottom:'1px solid var(--br)',flexShrink:0}}>
        {tabs.map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)}
            style={{flex:1,padding:'10px 4px',fontSize:11,fontWeight:tab===key?700:400,color:tab===key?'var(--ac)':'var(--t3)',background:'transparent',border:'none',borderBottom:tab===key?'2px solid var(--ac)':'2px solid transparent',cursor:'pointer',fontFamily:'var(--fn)'}}>
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
            <div style={rowStyle}>
              <span style={{fontSize:13,color:'var(--tx)'}}>Enable AI features</span>
              <button onClick={toggleAI} aria-label="Toggle AI" aria-pressed={aiEnabled} style={togBtn(aiEnabled)}><span style={togDot(aiEnabled)}/></button>
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
        {tab==='ai'&&(aiEnabled?<AIPanel/>:(
          <div style={{padding:'32px 8px',textAlign:'center'}}>
            <div style={{fontSize:28}} aria-hidden="true">✦</div>
            <div style={{fontSize:14,fontWeight:700,color:'var(--tx)',margin:'10px 0 6px'}}>AI features are off</div>
            <div style={{fontSize:12,color:'var(--t2)',marginBottom:14,lineHeight:1.5}}>Flip "Enable AI features" in Appearance to configure your provider and key.</div>
            <button onClick={()=>setTab('appearance')} style={{padding:'6px 12px',fontSize:12,background:'var(--ac)',color:'var(--act)',border:'none',borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:700}}>Go to Appearance</button>
          </div>
        ))}
        {tab==='data'&&<>
          <span style={sH}>Onboarding</span>
          <button onClick={()=>{localStorage.removeItem('mgn-onboarded');onClose();setTimeout(()=>location.reload(),50)}}
            style={{width:'100%',padding:'10px 12px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:600,marginBottom:16}}>↺ Reopen welcome</button>
          <span style={sH}>Export</span>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            <button onClick={onExportJSON} style={{flex:1,padding:'10px 12px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:600}}>↓ Export JSON</button>
            <button onClick={onExportMD} style={{flex:1,padding:'10px 12px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:600}}>↓ Export Markdown</button>
          </div>
          {advanced&&<>
            <span style={sH}>Import</span>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{display:'none'}}
              onChange={e=>{const f=e.target.files?.[0];if(f){onImportJSON(f);e.target.value=''}}}/>
            <button onClick={()=>fileRef.current?.click()}
              style={{width:'100%',padding:'10px 12px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:600,marginBottom:16}}>↑ Import JSON</button>
            <div style={{fontSize:11,color:'var(--t3)',marginTop:-10,marginBottom:16}}>Duplicate IDs are skipped; tags normalized.</div>
          </>}
          <span style={sH}>Library Stats</span>
          <div style={{fontSize:13,color:'var(--t2)',lineHeight:1.8}}>
            {entries.length} total entries across {TYPES.filter(t=>entries.some(e=>e.type===t)).length} content types. {entries.filter(e=>e.starred).length} starred. {[...new Set(entries.flatMap(e=>e.tags||[]))].length} unique tags.
          </div>
        </>}
        {tab==='vault'&&<VaultPanel entries={entries}/>}
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
