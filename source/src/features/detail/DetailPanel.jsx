import { useState, useEffect, useRef, useMemo, useId } from "react";
import { ICON, STATUSES, NO_URL_TYPES, today, statusTone, statusBg } from '../../lib/types.js';
import { isSafeUrl, normalizeTags, pickEntryFields, formatDate, withAlpha, startVoiceRecognition } from '../../lib/storage.js';
import { useEscapeKey, useAutoFocus } from '../../lib/hooks.js';
import { IconButton } from '../primitives/IconButton.jsx';
import { SrOnly } from '../primitives/SrOnly.jsx';
import { TagSuggestions } from '../primitives/TagSuggestions.jsx';
import { Select } from '../dropdowns/Select.jsx';
import { NoteBody } from '../editor/NoteBody.jsx';
import { PropertiesPanel } from '../properties/PropertiesPanel.jsx';
import { getPropertyKeys } from '../../lib/base/queryBase.js';

// PropertiesSection — small wrapper that derives the visible-key count
// for the <details> summary and forwards everything to PropertiesPanel.
// Pulled out as a named component so we don't need an IIFE in the JSX
// (per project style: no IIFEs in component bodies).
function PropertiesSection({entry,entries,onUpdate}){
  const propKeys=Object.keys(entry||{}).filter(k=>!['_path','id','date','title','notes','unresolvedTargets'].includes(k)&&!k.startsWith('_'));
  const allFmKeys=getPropertyKeys(entries);
  return(
    <details style={{marginBottom:16,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--b2)',padding:'6px 10px'}}>
      <summary style={{cursor:'pointer',fontSize:10,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:1.5,userSelect:'none'}}>Properties ({propKeys.length})</summary>
      <div style={{paddingTop:8}}>
        <PropertiesPanel entry={entry} onUpdate={onUpdate} allKeys={allFmKeys}/>
      </div>
    </details>
  );
}

function formFromEntry(entry){
  return {...entry,tags:(entry.tags||[]).join(', ')};
}
function comparableForm(form,entry){
  const cleaned=pickEntryFields(form,entry.type);
  return {...cleaned,tags:normalizeTags(form.tags)};
}

// ── Detail Panel ──────────────────────────────────────────────────────────
export function DetailPanel({entry,entries,navEntries=entries,allTags,onClose,onUpdate,onDelete,onToast,onNavigate,onLink,onUnlink,onOpenEntry,onCreateFromMissing}){
  const[editing,setEditing]=useState(false);
  const[form,setForm]=useState(()=>formFromEntry(entry));
  const[recording,setRecording]=useState(false);
  const[voiceError,setVoiceError]=useState('');
  const[urlError,setUrlError]=useState('');
  const[confirmingDelete,setConfirmingDelete]=useState(false);
  const[confirmDelete,setConfirmDelete]=useState(false);
  const[confirmDiscard,setConfirmDiscard]=useState(null);
  const recognitionRef=useRef(null);
  const editButtonRef=useRef(null);
  useAutoFocus(editButtonRef);
  useEffect(()=>{setForm(formFromEntry(entry));setEditing(false);setConfirmingDelete(false);setConfirmDelete(false);setConfirmDiscard(null);setUrlError('');setVoiceError('')},[entry.id]);
  useEffect(()=>()=>recognitionRef.current?.stop?.(),[]);
  const update=key=>ev=>{if(key==='url')setUrlError('');setForm(prev=>({...prev,[key]:ev.target.value}))};
  const isDirty=useMemo(()=>JSON.stringify(comparableForm(form,entry))!==JSON.stringify(comparableForm(formFromEntry(entry),entry)),[form,entry]);
  const resetEdit=()=>{setForm(formFromEntry(entry));setUrlError('');setVoiceError('');setConfirmingDelete(false);setConfirmDiscard(null);setEditing(false)};
  const applyDiscardAction=(action)=>{
    if(action==='close')onClose();
    else if(action==='prev'&&onNavigate)onNavigate(-1);
    else if(action==='next'&&onNavigate)onNavigate(1);
  };
  const requestDiscard=(action)=>{
    if(editing&&isDirty){setConfirmDiscard(action);return;}
    resetEdit();
    applyDiscardAction(action);
  };
  const confirmDiscardAction=()=>{const action=confirmDiscard;resetEdit();applyDiscardAction(action)};
  const cancelEdit=()=>requestDiscard('cancel');
  const save=()=>{if(form.url&&!isSafeUrl(form.url)){setUrlError('URL must start with http:// or https://');return;}const cleaned=pickEntryFields(form,entry.type);onUpdate({...cleaned,tags:normalizeTags(form.tags)});setUrlError('');setEditing(false)};
  const handleVoice=()=>{if(recording){recognitionRef.current?.stop?.();setRecording(false);return;}setVoiceError('');const rec=startVoiceRecognition(t=>{setForm(p=>({...p,notes:(p.notes||'')+'\n\n🎤 '+t}));setRecording(false)},err=>{setVoiceError(String(err));setRecording(false)});if(rec){recognitionRef.current=rec;setRecording(true)}};
  const copyUrl=()=>navigator.clipboard.writeText(entry.url).then(()=>onToast('URL copied','info')).catch(()=>onToast('Copy failed','error'));
  useEscapeKey(true,()=>requestDiscard('close'));

  // FIX: deps use entry.id + stringified tags for value-based memoization, not entry object reference
  const related=useMemo(()=>{
    if(!entry.tags?.length)return[];
    const linkSet=new Set(entry.links||[]);
    return entries
      .filter(x=>x.id!==entry.id&&!linkSet.has(x.id)&&x.tags?.some(t=>entry.tags.includes(t)))
      .sort((a,b)=>b.tags.filter(t=>entry.tags.includes(t)).length-a.tags.filter(t=>entry.tags.includes(t)).length)
      .slice(0,4);
  },[entries,entry.id,(entry.tags||[]).join(','),(entry.links||[]).join(',')]);

  const linkedEntries=useMemo(()=>(entry.links||[]).map(id=>entries.find(e=>e.id===id)).filter(Boolean),[entries,entry.id,(entry.links||[]).join(',')]);

  // Backlinks: entries whose links array includes this entry's id but
  // that aren't already in this entry's links list (i.e. one-way wiki
  // refs we haven't reciprocated). Manual bidirectional links already
  // live in linkedEntries, so we filter them out to avoid duplicates.
  const backlinkEntries=useMemo(()=>{
    const ownLinks=new Set(entry.links||[]);
    return entries
      .filter(other=>other.id!==entry.id&&(other.links||[]).includes(entry.id)&&!ownLinks.has(other.id))
      .slice(0,20);
  },[entries,entry.id,(entry.links||[]).join(',')]);

  // Unresolved wiki-link targets carried from buildVaultIndex via useVault.
  // These are body refs like [[Missing Note]] that don't match any entry.
  // The "Create" affordance lets the user materialize a real note for the
  // missing target with a single click — Phase 3 of the SlateVault spec.
  const unresolvedTargets=Array.isArray(entry.unresolvedTargets)?entry.unresolvedTargets:[];
  const[pickerOpen,setPickerOpen]=useState(false);
  const[pickerQuery,setPickerQuery]=useState('');
  useEffect(()=>{setPickerOpen(false);setPickerQuery('')},[entry.id]);
  const pickerCandidates=useMemo(()=>{
    if(!pickerOpen)return[];
    const taken=new Set([entry.id,...(entry.links||[])]);
    const q=pickerQuery.trim().toLowerCase();
    return entries.filter(e=>!taken.has(e.id)&&(!q||(e.title||'').toLowerCase().includes(q)||(e.tags||[]).some(t=>t.toLowerCase().includes(q)))).slice(0,12);
  },[pickerOpen,pickerQuery,entries,entry.id,(entry.links||[]).join(',')]);

  const color=statusTone(entry.status);
  const is={padding:'7px 10px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--tx)',fontFamily:'var(--fn)',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'};
  const ls={fontSize:11,fontWeight:700,color:'var(--t3)',display:'block',marginBottom:3};
  const ids={title:useId(),url:useId(),status:useId(),tags:useId(),notes:useId(),editDate:useId()};
  const displayDate=entry.entry_date||entry.date?.slice(0,10);
  const navIndex=navEntries.findIndex(e=>e.id===entry.id);
  const hasPrev=navIndex>0;
  const hasNext=navIndex>=0&&navIndex<navEntries.length-1;
  return(
    <div role="dialog" aria-modal="true" aria-labelledby="detail-title" className="mgn-panel"
      style={{position:'fixed',right:0,top:0,bottom:0,width:'min(380px,100vw)',background:'var(--bg)',borderLeft:'1px solid var(--br)',display:'flex',flexDirection:'column',zIndex:100,overflowY:'auto'}}>
      <div style={{padding:'14px 16px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',gap:8,flexShrink:0,position:'sticky',top:0,background:'var(--bg)',zIndex:1}}>
        {confirmDelete?(
          <>
            <span style={{flex:1,fontSize:13,color:'#b91c1c',fontWeight:700}}>Delete entry?</span>
            <button onClick={()=>{onDelete();setConfirmDelete(false)}} style={{padding:'4px 10px',fontSize:12,border:'1px solid #b91c1c',borderRadius:'var(--rd)',background:'#b91c1c',color:'#fff',cursor:'pointer',fontFamily:'var(--fn)',flexShrink:0,fontWeight:700}}>Yes</button>
            <button onClick={()=>setConfirmDelete(false)} style={{padding:'4px 10px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',flexShrink:0}}>Cancel</button>
          </>
        ):(
          <>
            <span aria-hidden="true" style={{fontSize:16}}>{ICON[entry.type]}</span>
            <span id="detail-title" style={{fontWeight:700,fontSize:14,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.title||'Untitled'}</span>
            <button onClick={()=>requestDiscard('prev')} disabled={!hasPrev} aria-label="Previous entry"
              style={{padding:'4px 8px',fontSize:14,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:hasPrev?'var(--t2)':'var(--t3)',cursor:hasPrev?'pointer':'not-allowed',opacity:hasPrev?1:.4,fontFamily:'var(--fn)',flexShrink:0,lineHeight:1}}>‹</button>
            <button onClick={()=>requestDiscard('next')} disabled={!hasNext} aria-label="Next entry"
              style={{padding:'4px 8px',fontSize:14,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:hasNext?'var(--t2)':'var(--t3)',cursor:hasNext?'pointer':'not-allowed',opacity:hasNext?1:.4,fontFamily:'var(--fn)',flexShrink:0,lineHeight:1}}>›</button>
            <button onClick={()=>setConfirmDelete(true)} aria-label="Delete entry"
              style={{padding:'4px 10px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'#b91c1c',cursor:'pointer',fontFamily:'var(--fn)',flexShrink:0}}>Delete</button>
            <button ref={editButtonRef} onClick={()=>editing?cancelEdit():setEditing(true)} aria-label={editing?'Cancel editing':'Edit entry'} aria-pressed={editing}
              style={{padding:'4px 10px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',flexShrink:0}}>
              {editing?'Cancel':'Edit'}
            </button>
            <IconButton onClick={()=>requestDiscard('close')} label="Close panel" style={{fontSize:22}}>×</IconButton>
          </>
        )}
      </div>
      <div style={{padding:16,flex:1}}>
        {entry.status&&!editing&&<span style={{display:'inline-block',fontSize:12,padding:'3px 10px',borderRadius:99,background:statusBg(color),color,fontWeight:700,marginBottom:12}}><SrOnly>Status:</SrOnly>{entry.status}</span>}
        {editing?(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {confirmDiscard&&(
              <div role="alert" style={{padding:10,background:'rgba(245,158,11,0.10)',border:'1px solid rgba(245,158,11,0.45)',borderRadius:'var(--rd)',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <span style={{flex:1,fontSize:12,color:'var(--tx)',fontWeight:700}}>Discard unsaved edits?</span>
                <button type="button" onClick={confirmDiscardAction} style={{padding:'5px 10px',fontSize:12,border:'1px solid #f59e0b',borderRadius:'var(--rd)',background:'#f59e0b',color:'#111827',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:700}}>Discard</button>
                <button type="button" onClick={()=>setConfirmDiscard(null)} style={{padding:'5px 10px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>Keep editing</button>
              </div>
            )}
            <div><label htmlFor={ids.title} style={ls}>Title</label><input id={ids.title} style={is} value={form.title||''} onChange={update('title')}/></div>
            {!NO_URL_TYPES.has(entry.type)&&(
              <div>
                <label htmlFor={ids.url} style={ls}>URL</label>
                <input id={ids.url} style={is} value={form.url||''} onChange={update('url')} aria-invalid={!!urlError} aria-describedby={urlError?`${ids.url}-error`:undefined}/>
                {urlError&&<div id={`${ids.url}-error`} role="alert" style={{fontSize:11,color:'#ef4444',marginTop:4}}>{urlError}</div>}
              </div>
            )}
            <div><span style={ls}>Status</span><Select ariaLabel="Status" value={form.status||''} onChange={v=>update('status')({target:{value:v}})} options={(STATUSES[entry.type]||[]).map(s=>({value:s,label:s}))}/></div>
            <div><label htmlFor={ids.editDate} style={ls}>{entry.type==='journal'?'Journal Date':'Date consumed'}</label><input id={ids.editDate} type="date" style={is} value={form.entry_date||''} max={today()} onChange={update('entry_date')}/></div>
            <div>
              <label htmlFor={ids.tags} style={ls}>Tags</label>
              <input id={ids.tags} style={is} value={form.tags} onChange={update('tags')}/>
              <TagSuggestions value={form.tags} onChange={v=>setForm(p=>({...p,tags:v}))} allTags={allTags}/>
            </div>
            <div>
              <div style={{display:'flex',alignItems:'center',marginBottom:3}}>
                <label htmlFor={ids.notes} style={ls}>Notes</label>
                <button type="button" onClick={handleVoice} aria-label={recording?'Stop voice input':'Start voice input'} aria-pressed={recording}
                  style={{marginLeft:'auto',padding:'3px 9px',fontSize:11,background:recording?'#ef4444':'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:recording?'#fff':'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>
                  {recording?'🔴 Listening…':'🎤 Voice'}
                </button>
              </div>
              {voiceError&&<div role="alert" style={{fontSize:11,color:'#ef4444',marginBottom:4}}>{voiceError}</div>}
              <textarea id={ids.notes} style={{...is,height:160,resize:'vertical'}} value={form.notes||''} onChange={update('notes')}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={save} style={{flex:1,padding:9,background:'var(--ac)',color:'var(--act)',border:'none',borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13,fontWeight:700}}>Save</button>
              {confirmingDelete?(
                <button onClick={onDelete} aria-label="Confirm delete entry" style={{padding:'9px 14px',background:'#b91c1c',border:'1px solid #b91c1c',borderRadius:'var(--rd)',color:'#fff',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13,fontWeight:700}}>Confirm delete</button>
              ):(
                <button onClick={()=>setConfirmingDelete(true)} aria-label="Delete entry" style={{padding:'9px 14px',background:withAlpha('#b91c1c',0.07),border:'1px solid #b91c1c',borderRadius:'var(--rd)',color:'#b91c1c',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13}}>🗑</button>
              )}
            </div>
          </div>
        ):(
          <>
            {entry.url&&isSafeUrl(entry.url)&&(
              <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:12}}>
                <a href={entry.url} target="_blank" rel="noreferrer noopener" style={{flex:1,fontSize:12,color:'var(--ac)',wordBreak:'break-all',textDecoration:'none',lineHeight:1.5}}>{entry.url} <span aria-hidden="true">↗</span></a>
                <button type="button" onClick={copyUrl} style={{flexShrink:0,padding:'3px 9px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--b2)',color:'var(--t3)',cursor:'pointer',fontFamily:'var(--fn)'}}>Copy</button>
              </div>
            )}
            {entry.channel&&<div style={{fontSize:13,color:'var(--t2)',marginBottom:8}}>📺 {entry.channel}{entry.duration?' · '+entry.duration:''}</div>}
            {entry.guest&&<div style={{fontSize:13,color:'var(--t2)',marginBottom:8}}>🎙️ {entry.guest}{entry.episode?' · '+entry.episode:''}</div>}
            {entry.highlight&&<blockquote style={{margin:'0 0 14px',padding:'10px 14px',borderLeft:'3px solid var(--ac)',background:'var(--b2)',borderRadius:'0 var(--rd) var(--rd) 0',fontSize:13,color:'var(--t2)',fontStyle:'italic',lineHeight:1.6}}>"{entry.highlight}"</blockquote>}
            {entry.tags?.length>0&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:14}}>{entry.tags.map(t=><span key={t} style={{fontSize:11,padding:'3px 8px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:99,color:'var(--t2)'}}>{t}</span>)}</div>}
            <NoteBody entry={entry} entries={entries} onUpdate={onUpdate} onOpenEntry={onOpenEntry}/>
            {entry.entry_date&&entry.entry_date!==entry.date?.slice(0,10)&&(
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:16}}>Entry date: {formatDate(entry.entry_date)}</div>
            )}
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:1.5,flex:1}}>Links{linkedEntries.length?` (${linkedEntries.length})`:''}</div>
                <button onClick={()=>setPickerOpen(o=>!o)} style={{padding:'3px 9px',fontSize:10,border:'1px dashed var(--br)',borderRadius:99,background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>+ Link to…</button>
              </div>
              {linkedEntries.length>0&&<div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:pickerOpen?8:0}}>
                {linkedEntries.map(r=>(
                  <div key={r.id} style={{padding:'7px 10px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',fontSize:12,display:'flex',alignItems:'center',gap:8}}>
                    <span style={{flexShrink:0}}>{ICON[r.type]}</span>
                    <button onClick={()=>onOpenEntry(r.id)} style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--tx)',background:'transparent',border:'none',padding:0,cursor:'pointer',fontFamily:'var(--fn)',fontSize:12,textAlign:'left'}}>{r.title||'Untitled'}</button>
                    <button onClick={()=>onUnlink(r.id)} aria-label="Unlink" style={{padding:'1px 7px',fontSize:11,color:'var(--t3)',background:'transparent',border:'none',cursor:'pointer',fontFamily:'var(--fn)'}}>✕</button>
                  </div>
                ))}
              </div>}
              {pickerOpen&&(
                <div style={{border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--cd)',padding:8}}>
                  <input autoFocus value={pickerQuery} onChange={e=>setPickerQuery(e.target.value)} placeholder="Search entries to link…"
                    style={{...is,marginBottom:6}}/>
                  <div style={{maxHeight:180,overflowY:'auto',display:'flex',flexDirection:'column',gap:2}}>
                    {pickerCandidates.length===0?(
                      <div style={{padding:'8px 4px',fontSize:11,color:'var(--t3)',textAlign:'center'}}>No matches</div>
                    ):pickerCandidates.map(c=>(
                      <button key={c.id} onClick={()=>{onLink(c.id);setPickerQuery('')}}
                        style={{padding:'6px 8px',fontSize:12,background:'transparent',border:'none',borderRadius:'var(--rd)',color:'var(--tx)',cursor:'pointer',fontFamily:'var(--fn)',textAlign:'left',display:'flex',alignItems:'center',gap:6}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--b2)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <span style={{flexShrink:0}}>{ICON[c.type]}</span>
                        <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.title||'Untitled'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {backlinkEntries.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:1.5,marginBottom:8}}>Backlinks ({backlinkEntries.length})</div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {backlinkEntries.map(r=>(
                    <button key={r.id} onClick={()=>onOpenEntry(r.id)}
                      style={{padding:'7px 10px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',fontSize:12,display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontFamily:'var(--fn)',textAlign:'left',color:'var(--tx)'}}>
                      <span style={{flexShrink:0}}>{ICON[r.type]}</span>
                      <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title||'Untitled'}</span>
                      <span style={{fontSize:10,color:'var(--t3)',flexShrink:0}}>↩</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {unresolvedTargets.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:1.5,marginBottom:8}}>Unresolved Links ({unresolvedTargets.length})</div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {unresolvedTargets.map(u=>(
                    <div key={u.target} style={{padding:'7px 10px',background:'transparent',border:'1px dashed var(--t3)',borderRadius:'var(--rd)',fontSize:12,display:'flex',alignItems:'center',gap:8,color:'var(--t2)'}}>
                      <span aria-hidden="true" style={{flexShrink:0,color:'var(--t3)'}}>?</span>
                      <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.target}</span>
                      {onCreateFromMissing&&(
                        <button onClick={()=>onCreateFromMissing(u.target)} aria-label={`Create note: ${u.target}`}
                          style={{padding:'2px 8px',fontSize:11,border:'1px solid var(--ac)',borderRadius:99,background:'transparent',color:'var(--ac)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:700,flexShrink:0}}>+ Create</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <PropertiesSection entry={entry} entries={entries} onUpdate={onUpdate}/>
            {related.length>0&&(
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:1.5,marginBottom:8}}>Related by tags</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {related.map(r=>(
                    <button key={r.id} onClick={()=>onOpenEntry(r.id)} style={{padding:'8px 12px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',fontSize:12,display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontFamily:'var(--fn)',textAlign:'left',color:'var(--tx)'}}>
                      <span style={{flexShrink:0}}>{ICON[r.type]}</span>
                      <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title||'Untitled'}</span>
                      <span style={{fontSize:10,color:'var(--t3)',flexShrink:0}}>{r.tags.filter(t=>entry.tags.includes(t)).length} shared</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
