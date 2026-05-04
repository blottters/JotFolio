import { useState, useRef, useId, useEffect, useMemo } from "react";
import { marked } from 'marked';
import { TYPES, ICON, LABEL, STATUSES, NO_URL_TYPES, today, displayStatus } from '../../lib/types.js';
import { isSafeUrl, normalizeTags, pickEntryFields, withAlpha } from '../../lib/storage.js';
import { countWords } from '../../lib/plugin/builtinPlugins/wordCountStats.js';
import { useEscapeKey, useAutoFocus } from '../../lib/hooks.js';
import { injectNoteCss, sanitizeHtml } from '../../lib/markdown.js';
import { IconButton } from '../primitives/IconButton.jsx';
import { TagSuggestions } from '../primitives/TagSuggestions.jsx';
import { Select } from '../dropdowns/Select.jsx';

// ── Add Modal ─────────────────────────────────────────────────────────────
// FIX: initialType prop pre-selects the type; existingUrls enables inline dup warning
// FIX: ids.journalDate and ids.consumedDate are two distinct IDs — no collision
// FIX: window.confirm replaced with inline amber banner + "Save anyway" button
export function AddModal({initialType='video',quickCapture=false,existingUrls,allTags,onImportFile,onClose,onAdd}){
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
  const[previewOpen,setPreviewOpen]=useState(false);
  const titleInputRef=useRef(null);
  const notesRef=useRef(null);
  useEscapeKey(true,()=>tryClose());
  useAutoFocus(titleInputRef);
  useEffect(()=>{if(type==='journal')injectNoteCss()},[type]);
  // No window.confirm — dirty forms show an inline discard banner instead
  const tryClose=()=>{if(dirty){setConfirmDiscard(true);return;}onClose()};
  const update=key=>e=>{
    setDirty(true);setConfirmDiscard(false);
    if(key==='url'){setUrlError('');setDupWarning(false);}
    setForm(prev=>({...prev,[key]:e.target.value}));
  };
  const onDrop=async e=>{
    e.preventDefault();
    const u=e.dataTransfer.getData('text/uri-list')||e.dataTransfer.getData('text/plain');
    if(u){
      if(isSafeUrl(u)){setForm(p=>({...p,url:u}));setUrlError('');setDupWarning(false);}
      else setUrlError('Only http(s) URLs are accepted.');
    }
    const file=e.dataTransfer.files?.[0];
    if(file){
      setDirty(true);
      const importedPath=onImportFile?await onImportFile(file):null;
      const attachmentLine=importedPath?`📎 [${file.name}](${importedPath})`:`📎 ${file.name}`;
      setForm(p=>({...p,title:p.title||file.name.replace(/\.[^.]+$/,''),notes:p.notes?`${p.notes}\n${attachmentLine}`:attachmentLine}));
    }
  };

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
  const isQuickNote=type==='note';
  const isJournalEditor=type==='journal';
  const noteWordCount=countWords(form.notes);
  const noteCharCount=String(form.notes||'').length;
  const journalPreviewHtml=useMemo(()=>{
    if(!isJournalEditor||!form.notes)return'';
    try{return sanitizeHtml(marked.parse(form.notes,{breaks:true,gfm:true}))}
    catch(err){console.error('marked.parse failed in AddModal preview',err);return sanitizeHtml(form.notes)}
  },[form.notes,isJournalEditor]);
  const changeType=t=>{
    setType(t);setPreviewOpen(false);
    setForm(p=>({...p,status:STATUSES[t][0],entry_date:t==='journal'&&!p.entry_date?today():p.entry_date}));
  };
  const insertMarkdown=(before,after='',placeholder='text')=>{
    setDirty(true);setConfirmDiscard(false);
    const ta=notesRef.current;
    const current=form.notes||'';
    const start=ta?.selectionStart??current.length;
    const end=ta?.selectionEnd??current.length;
    const selected=current.slice(start,end)||placeholder;
    const next=current.slice(0,start)+before+selected+after+current.slice(end);
    setForm(p=>({...p,notes:next}));
    requestAnimationFrame(()=>{
      if(!ta)return;
      const caret=start+before.length+selected.length+after.length;
      ta.focus();ta.setSelectionRange(caret,caret);
    });
  };
  const insertLineMarkdown=(prefix,placeholder='List item')=>{
    setDirty(true);setConfirmDiscard(false);
    const ta=notesRef.current;
    const current=form.notes||'';
    const start=ta?.selectionStart??current.length;
    const lineStart=current.lastIndexOf('\n',Math.max(0,start-1))+1;
    const needsNewline=lineStart!==start&&current[start-1]!=='\n';
    const insertion=(needsNewline?'\n':'')+prefix+placeholder;
    const next=current.slice(0,start)+insertion+current.slice(start);
    setForm(p=>({...p,notes:next}));
    requestAnimationFrame(()=>{
      if(!ta)return;
      const caret=start+insertion.length;
      ta.focus();ta.setSelectionRange(caret,caret);
    });
  };
  const journalTools=[
    ['Heading 1','H1',()=>insertLineMarkdown('# ','Heading')],
    ['Heading 2','H2',()=>insertLineMarkdown('## ','Heading')],
    ['Heading 3','H3',()=>insertLineMarkdown('### ','Heading')],
    ['Bold','B',()=>insertMarkdown('**','**','bold text')],
    ['Italic','i',()=>insertMarkdown('*','*','italic text')],
    ['Strikethrough','S',()=>insertMarkdown('~~','~~','struck text')],
    ['Underline','U',()=>insertMarkdown('<u>','</u>','underlined text')],
    ['Bulleted list','• List',()=>insertLineMarkdown('- ')],
    ['Numbered list','1.',()=>insertLineMarkdown('1. ')],
    ['Task list','☐ Task',()=>insertLineMarkdown('- [ ] ','Task')],
    ['Link','🔗 Link',()=>insertMarkdown('[','](https://example.com)','link text')],
    ['Image','🖼 Image',()=>insertMarkdown('![','](attachments/image.png)','alt text')],
    ['Table','▦ Table',()=>insertMarkdown('| Column A | Column B |\n| --- | --- |\n| Value | Value |\n','','')],
    ['Quote','❝ Quote',()=>insertLineMarkdown('> ','Quote')],
    ['Inline code','{ } Code',()=>insertMarkdown('`','`','code')],
    ['Code block','Code block',()=>insertMarkdown('```\n','\n```','code block')],
    ['Wiki link','[[Wiki]]',()=>insertMarkdown('[[',']]','Linked note')],
    ['Divider','Divider',()=>insertMarkdown('\n---\n','','')],
    ['Callout','Callout',()=>insertMarkdown('> [!note]\n> ','','Callout text')],
  ];
  const modalTitle=quickCapture?'Quick Note':isQuickNote?'New Quick Note':isJournalEditor?'New Journal Entry':'New Entry';
  const dropCopy=isQuickNote
    ? 'Notes are for quick capture. Keep it fast: title, tags, jot, save.'
    : isJournalEditor
      ? 'Journal entries are date-first and writing-heavy. Use the full editor for the daily body.'
      : 'Drop an http(s) URL or file here. Files are copied into attachments/ and linked in notes.';
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
        style={{background:'var(--bg)',border:'2px solid var(--br)',borderRadius:'var(--rd)',width:isJournalEditor?'min(820px,95vw)':'min(560px,95vw)',maxHeight:'90vh',overflowY:'auto',padding:24,boxSizing:'border-box'}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:18}}>
          <h3 id="add-modal-title" style={{margin:0,fontSize:16,fontWeight:700}}>{modalTitle}</h3>
          {quickCapture&&<span style={{marginLeft:10,fontSize:10,color:'var(--t3)',letterSpacing:.5}}>Ctrl/⌘+Enter to save</span>}
          {dirty&&<span aria-live="polite" style={{marginLeft:10,fontSize:10,fontWeight:700,color:'var(--t3)',letterSpacing:.5,textTransform:'uppercase'}}>• unsaved</span>}
          <IconButton onClick={tryClose} label="Close" style={{marginLeft:'auto',fontSize:22}}>×</IconButton>
        </div>
        {!quickCapture&&(<div role="radiogroup" aria-label="Entry type" style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,marginBottom:14}}>
          {TYPES.map(t=>(
            <button key={t} role="radio" aria-checked={type===t}
              onClick={()=>changeType(t)}
              style={{padding:'7px 4px',border:`2px solid ${type===t?'var(--ac)':'var(--br)'}`,borderRadius:'var(--rd)',background:type===t?'var(--ac)':'transparent',color:type===t?'var(--act)':'var(--t2)',cursor:'pointer',fontSize:12,fontFamily:'var(--fn)',fontWeight:type===t?700:400}}>
              {ICON[t]} {LABEL[t]}
            </button>
          ))}
        </div>)}
        {!quickCapture&&<div style={{padding:10,background:'var(--b2)',border:'2px dashed var(--br)',borderRadius:'var(--rd)',textAlign:'center',fontSize:12,color:'var(--t3)',marginBottom:14}}>{dropCopy}</div>}
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
          <div><span style={ls}>Status</span><Select ariaLabel="Status" value={form.status} onChange={v=>update('status')({target:{value:v}})} options={STATUSES[type].map(s=>({value:s,label:displayStatus(s)}))}/></div>
          <div>
            <label htmlFor={ids.tags} style={ls}>Tags <span style={{fontWeight:400,color:'var(--t3)'}}>(comma-separated)</span></label>
            <input id={ids.tags} style={is} value={form.tags} onChange={update('tags')} placeholder="ai, research, dev…"/>
            <TagSuggestions value={form.tags} onChange={v=>{setForm(p=>({...p,tags:v}));setDirty(true)}} allTags={allTags}/>
          </div>
          {isQuickNote?(
            <div>
              <div style={{padding:'10px 12px',border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--b2)',fontSize:12,color:'var(--t2)',lineHeight:1.45,marginBottom:8}}>
                <strong style={{color:'var(--tx)'}}>Quick note mode:</strong> fast scratch capture, idea parking, small reminders, and loose observations. Use Journals for dated long-form writing.
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:5}}>
                <label htmlFor={ids.notes} style={{...ls,marginBottom:0}}>Jot it down</label>
                <span style={{marginLeft:'auto',fontSize:11,color:'var(--t3)'}}>{noteWordCount} words · {noteCharCount} chars</span>
              </div>
              <textarea id={ids.notes} style={{...is,height:130,minHeight:110,resize:'vertical',lineHeight:1.55}} value={form.notes} onChange={update('notes')} placeholder="Quick thought, reminder, idea, or snippet..."/>
            </div>
          ):isJournalEditor?(
            <div>
              <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:5}}>
                <label htmlFor={ids.notes} style={{...ls,marginBottom:0}}>Journal body</label>
                <span style={{marginLeft:'auto',fontSize:11,color:'var(--t3)'}}>{noteWordCount} words · {noteCharCount} chars</span>
                <button type="button" onClick={()=>setPreviewOpen(o=>!o)}
                  style={{padding:'4px 8px',border:'1px solid var(--br)',borderRadius:8,background:'var(--b2)',color:'var(--tx)',fontFamily:'var(--fn)',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                  {previewOpen?'Hide preview':'Show preview'}
                </button>
              </div>
              <div style={{border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--b2)',overflow:'hidden'}}>
                <div aria-label="Markdown formatting toolbar" role="toolbar"
                  style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap',padding:'8px 9px',borderBottom:'1px solid var(--br)',background:'var(--bg)'}}>
                  {journalTools.map(([label,text,action])=>(
                    <button key={label} type="button" aria-label={label} title={label} onClick={action}
                      style={{minWidth:26,padding:'4px 7px',border:'1px solid var(--br)',borderRadius:8,background:'transparent',color:'var(--t2)',fontFamily:'var(--fn)',fontSize:11,cursor:'pointer'}}>
                      {text}
                    </button>
                  ))}
                </div>
                <textarea ref={notesRef} id={ids.notes}
                  style={{...is,height:240,minHeight:180,resize:'vertical',border:'none',borderRadius:0,background:'transparent',lineHeight:1.65,fontFamily:'var(--fn)'}}
                  value={form.notes} onChange={update('notes')}
                  placeholder="Write the dated journal entry. Markdown works here: headings, lists, links, quotes, code, and [[wiki links]]."/>
                {previewOpen&&(
                  <div className="mgn-md" aria-label="Journal markdown preview"
                    style={{borderTop:'1px solid var(--br)',padding:'12px 14px',background:'var(--bg)',minHeight:90}}
                    dangerouslySetInnerHTML={{__html:journalPreviewHtml||'<p style="color:var(--t3);font-style:italic">Nothing to preview yet.</p>'}}
                  />
                )}
              </div>
            </div>
          ):(
            <div><label htmlFor={ids.notes} style={ls}>Notes</label><textarea id={ids.notes} style={{...is,height:90,resize:'vertical'}} value={form.notes} onChange={update('notes')} placeholder="Thoughts, summary, highlights…"/></div>
          )}
          {type!=='journal'&&(
            <div>
              <label htmlFor={ids.consumedDate} style={{...ls,fontWeight:400}}>Date consumed <span style={{color:'var(--t3)'}}>(optional)</span></label>
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
        <div style={{position:'sticky',bottom:0,background:'var(--bg)',padding:'10px 0 0',marginTop:14,borderTop:'1px solid var(--br)',boxShadow:'0 -10px 18px var(--bg)'}}>
          {type==='journal'&&(
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,fontSize:11,color:'var(--t3)',lineHeight:1.4}}>
              <span>Markdown journal saved as plain text in your vault.</span>
              <span style={{marginLeft:'auto',whiteSpace:'nowrap'}}>Ctrl/⌘+Enter saves</span>
            </div>
          )}
          <div style={{display:'flex',gap:8}}>
            <button onClick={tryClose} style={{flex:1,padding:10,background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13}}>Cancel</button>
            <button onClick={save} style={{flex:2,padding:10,background:'var(--ac)',color:'var(--act)',border:'none',borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontSize:13,fontWeight:700}}>Save Entry</button>
          </div>
        </div>
      </div>
    </div>
  );
}
