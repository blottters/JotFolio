import { useState, useRef, useId } from "react";
import { TYPES, ICON, LABEL, STATUSES, NO_URL_TYPES, today } from '../../lib/types.js';
import { isSafeUrl, normalizeTags, pickEntryFields, withAlpha } from '../../lib/storage.js';
import { useEscapeKey, useAutoFocus } from '../../lib/hooks.js';
import { IconButton } from '../primitives/IconButton.jsx';
import { TagSuggestions } from '../primitives/TagSuggestions.jsx';
import { Select } from '../dropdowns/Select.jsx';

// ── Add Modal ─────────────────────────────────────────────────────────────
// FIX: initialType prop pre-selects the type; existingUrls enables inline dup warning
// FIX: ids.journalDate and ids.consumedDate are two distinct IDs — no collision
// FIX: window.confirm replaced with inline amber banner + "Save anyway" button
export function AddModal({initialType='video',quickCapture=false,existingUrls,allTags,onClose,onAdd}){
  const[type,setType]=useState(initialType);
  const[form,setForm]=useState({
    title:'',url:'',notes:'',tags:'',
    status:STATUSES[initialType]?.[0]??STATUSES.video[0],
    channel:'',duration:'',guest:'',episode:'',highlight:'',
    entry_date:initialType==='journal'?today():''
  });
  const[urlError,setUrlError]=useState('');
  const[dupWarning,setDupWarning]=useState(false);
  const[dirty,setDirty]=useState(false);
  const[confirmDiscard,setConfirmDiscard]=useState(false);
  const titleInputRef=useRef(null);
  useEscapeKey(true,()=>tryClose());
  useAutoFocus(titleInputRef);
  // No window.confirm — dirty forms show an inline discard banner instead
  const tryClose=()=>{if(dirty){setConfirmDiscard(true);return;}onClose()};
  const update=key=>e=>{
    setDirty(true);setConfirmDiscard(false);
    if(key==='url'){setUrlError('');setDupWarning(false);}
    setForm(prev=>({...prev,[key]:e.target.value}));
  };
  const onDrop=e=>{e.preventDefault();const u=e.dataTransfer.getData('text/uri-list')||e.dataTransfer.getData('text/plain');if(u){if(isSafeUrl(u)){setForm(p=>({...p,url:u}));setUrlError('');setDupWarning(false);}else setUrlError('Only http(s) URLs are accepted.')}const file=e.dataTransfer.files?.[0];if(file)setForm(p=>({...p,title:p.title||file.name.replace(/\.[^.]+$/,''),notes:p.notes?p.notes+'\n📎 '+file.name:'📎 '+file.name}))};

  // Shared save logic — bypasses dup check (used by "Save anyway")
  const doSave=()=>{const cleaned=pickEntryFields(form,type);onAdd({type,...cleaned,tags:normalizeTags(form.tags)})};

  const save=()=>{
    if(form.url&&!isSafeUrl(form.url)){setUrlError('URL must start with http:// or https://');return;}
    // FIX: inline warning instead of window.confirm
    if(form.url&&existingUrls?.has(form.url)){setDupWarning(true);return;}
    doSave();
  };

  const is={padding:'8px 10px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--tx)',fontFamily:'var(--fn)',fontSize:13,outline:'none',boxSizing:'border-box',width:'100%'};
  const ls={fontSize:12,fontWeight:700,color:'var(--t3)',marginBottom:3,display:'block'};
  // FIX: two separate IDs — journalDate (top, journal only) and consumedDate (bottom, non-journal)
  const ids={title:useId(),url:useId(),channel:useId(),duration:useId(),guest:useId(),episode:useId(),highlight:useId(),status:useId(),tags:useId(),notes:useId(),journalDate:useId(),consumedDate:useId()};
  // Quick-capture: Cmd/Ctrl+Enter saves; Esc closes (handled by useEscapeKey).
  const onFormKeyDown=e=>{
    if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();save()}
  };
  return(
    <div role="dialog" aria-modal="true" aria-labelledby="add-modal-title" onClick={e=>{if(e.target===e.currentTarget)tryClose()}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div onDrop={onDrop} onDragOver={e=>e.preventDefault()} onKeyDown={onFormKeyDown}
        style={{background:'var(--bg)',border:'2px solid var(--br)',borderRadius:'var(--rd)',width:'min(520px,95vw)',maxHeight:'90vh',overflowY:'auto',padding:24,boxSizing:'border-box'}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:18}}>
          <h3 id="add-modal-title" style={{margin:0,fontSize:16,fontWeight:700}}>{quickCapture?'Quick Note':'New Entry'}</h3>
          {quickCapture&&<span style={{marginLeft:10,fontSize:10,color:'var(--t3)',letterSpacing:.5}}>Ctrl/⌘+Enter to save</span>}
          {dirty&&<span aria-live="polite" style={{marginLeft:10,fontSize:10,fontWeight:700,color:'var(--t3)',letterSpacing:.5,textTransform:'uppercase'}}>• unsaved</span>}
          <IconButton onClick={tryClose} label="Close" style={{marginLeft:'auto',fontSize:22}}>×</IconButton>
        </div>
        {!quickCapture&&(<div role="radiogroup" aria-label="Entry type" style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,marginBottom:14}}>
          {TYPES.map(t=>(
            <button key={t} role="radio" aria-checked={type===t}
              onClick={()=>{setType(t);setForm(p=>({...p,status:STATUSES[t][0],entry_date:t==='journal'&&!p.entry_date?today():p.entry_date}))}}
              style={{padding:'7px 4px',border:`2px solid ${type===t?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rd)',background:type===t?'var(--ac)':'transparent',color:type===t?'var(--act)':'var(--t2)',cursor:'pointer',fontSize:12,fontFamily:'var(--fn)',fontWeight:type===t?700:400}}>
              {ICON[t]} {LABEL[t]}
            </button>
          ))}
        </div>)}
        {!quickCapture&&<div style={{padding:10,background:'var(--b2)',border:'2px dashed var(--br)',borderRadius:'var(--rd)',textAlign:'center',fontSize:12,color:'var(--t3)',marginBottom:14}}>📎 Drop a URL or file here</div>}
        <div style={{display:'flex',flexDirection:'column',gap:11}}>
          {type==='journal'&&(
            <div>
              <label htmlFor={ids.journalDate} style={{...ls,color:'var(--ac)'}}>Journal Date</label>
              <input id={ids.journalDate} type="date" style={is} value={form.entry_date} max={today()} onChange={update('entry_date')}/>
            </div>
          )}
          <div><label htmlFor={ids.title} style={ls}>Title</label><input ref={titleInputRef} id={ids.title} style={is} value={form.title} onChange={update('title')} placeholder="Entry title"/></div>
          {type!=='journal'&&!NO_URL_TYPES.has(type)&&(
            <div>
              <label htmlFor={ids.url} style={ls}>URL</label>
              <input id={ids.url} style={is} value={form.url}
                onChange={e=>{setForm(p=>({...p,url:e.target.value}));setUrlError('');setDupWarning(false);setDirty(true)}}
                placeholder="https://…" aria-invalid={!!(urlError||dupWarning)} aria-describedby={urlError?`${ids.url}-error`:dupWarning?`${ids.url}-dup`:undefined}/>
              {urlError&&<div id={`${ids.url}-error`} style={{fontSize:11,color:'#ef4444',marginTop:4}}>{urlError}</div>}
              {/* FIX: inline dup warning with dismiss + save-anyway — no window.confirm */}
              {dupWarning&&(
                <div id={`${ids.url}-dup`} role="alert"
                  style={{marginTop:8,padding:'10px 14px',background:withAlpha('#f59e0b',0.1),border:'1px solid #f59e0b',borderRadius:'var(--rd)',fontSize:12,color:'var(--tx)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <span style={{flex:1}}>⚠️ You already have an entry with this URL.</span>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    <button type="button" onClick={()=>setDupWarning(false)}
                      style={{padding:'3px 10px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>
                      Dismiss
                    </button>
                    <button type="button" onClick={doSave}
                      style={{padding:'3px 10px',fontSize:11,border:'1px solid #f59e0b',borderRadius:'var(--rd)',background:'#f59e0b',color:'#000',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:700}}>
                      Save anyway
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {type==='video'&&<><div><label htmlFor={ids.channel} style={ls}>Channel</label><input id={ids.channel} style={is} value={form.channel} onChange={update('channel')} placeholder="Channel or creator"/></div><div><label htmlFor={ids.duration} style={ls}>Duration</label><input id={ids.duration} style={is} value={form.duration} onChange={update('duration')} placeholder="e.g. 45 min"/></div></>}
          {type==='podcast'&&<><div><label htmlFor={ids.guest} style={ls}>Guest / Host</label><input id={ids.guest} style={is} value={form.guest} onChange={update('guest')} placeholder="Guest or host"/></div><div><label htmlFor={ids.episode} style={ls}>Episode #</label><input id={ids.episode} style={is} value={form.episode} onChange={update('episode')} placeholder="e.g. Ep. 42"/></div><div><label htmlFor={ids.highlight} style={ls}>Key Highlight</label><textarea id={ids.highlight} style={{...is,height:60,resize:'vertical'}} value={form.highlight} onChange={update('highlight')} placeholder="A moment worth remembering…"/></div></>}
          <div><span style={ls}>Status</span><Select ariaLabel="Status" value={form.status} onChange={v=>update('status')({target:{value:v}})} options={STATUSES[type].map(s=>({value:s,label:s}))}/></div>
          <div>
            <label htmlFor={ids.tags} style={ls}>Tags <span style={{fontWeight:400}}>(comma-separated)</span></label>
            <input id={ids.tags} style={is} value={form.tags} onChange={update('tags')} placeholder="ai, research, dev…"/>
            <TagSuggestions value={form.tags} onChange={v=>{setForm(p=>({...p,tags:v}));setDirty(true)}} allTags={allTags}/>
          </div>
          <div><label htmlFor={ids.notes} style={ls}>Notes</label><textarea id={ids.notes} style={{...is,height:90,resize:'vertical'}} value={form.notes} onChange={update('notes')} placeholder="Thoughts, summary, highlights…"/></div>
          {type!=='journal'&&(
            <div>
              <label htmlFor={ids.consumedDate} style={{...ls,fontWeight:400}}>Date consumed <span>(optional)</span></label>
              <input id={ids.consumedDate} type="date" style={is} value={form.entry_date} max={today()} onChange={update('entry_date')}/>
            </div>
          )}
        </div>
        {confirmDiscard&&(
          <div role="alert" style={{marginTop:12,padding:'10px 14px',background:withAlpha('#ef4444',0.08),border:'1px solid #ef4444',borderRadius:'var(--rd)',fontSize:12,color:'var(--tx)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{flex:1}}>Discard this entry? Your changes will be lost.</span>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button type="button" onClick={()=>setConfirmDiscard(false)}
                style={{padding:'3px 10px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>
                Keep editing
              </button>
              <button type="button" onClick={onClose}
                style={{padding:'3px 10px',fontSize:11,border:'1px solid #ef4444',borderRadius:'var(--rd)',background:'#ef4444',color:'#fff',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:700}}>
                Discard
              </button>
            </div>
          </div>
        )}
        <div style={{position:'sticky',bottom:0,background:'var(--bg)',padding:'12px 0 0',marginTop:12,borderTop:'1px solid var(--br)'}}>
          <div style={{display:'flex',gap:8}}>
            <button onClick={tryClose} style={{flex:1,padding:10,background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13}}>Cancel</button>
            <button onClick={save} style={{flex:2,padding:10,background:'var(--ac)',color:'var(--act)',border:'none',borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13,fontWeight:700}}>Save Entry</button>
          </div>
        </div>
      </div>
    </div>
  );
}
