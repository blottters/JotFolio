import { useState, useEffect, useRef, useMemo } from "react";
import { marked } from 'marked';
import { ICON } from '../../lib/types.js';
import { MANUAL_LINKS_FIELD } from '../../lib/frontmatter.js';
import { useDebouncedCallback } from '../../lib/hooks.js';
import { injectNoteCss, renderWikiLinks, escapeHtml, sanitizeHtml, getCaretCoords, detectWikiTrigger } from '../../lib/markdown.js';

const TOOLBAR_COMMANDS = [
  ['h1', 'Heading 1', 'H1'],
  ['h2', 'Heading 2', 'H2'],
  ['bold', 'Bold', 'B'],
  ['italic', 'Italic', 'I'],
  ['link', 'Link', '⌁'],
  ['code', 'Inline code', '<>'],
  ['bullet', 'Bulleted list', '•'],
  ['number', 'Numbered list', '1.'],
  ['check', 'Checklist', '☐'],
  ['quote', 'Quote', '“'],
  ['image', 'Image', '□'],
  ['table', 'Table', '▦'],
];

function countWords(text) {
  const cleaned = String(text || '').replace(/[#*`_>\[\]()|!-]/g, ' ').trim();
  return cleaned ? cleaned.split(/\s+/).length : 0;
}

function countSpaces(text) {
  return (String(text || '').match(/ /g) || []).length;
}

function countLines(text) {
  if (!text) return 1;
  return String(text).split(/\r\n|\r|\n/).length;
}

function formatBytes(text) {
  const bytes = new TextEncoder().encode(String(text || '')).length;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
}

function lineNumbers(text) {
  return Array.from({ length: countLines(text) }, (_, index) => index + 1);
}

function selectedOr(value, fallback) {
  return value || fallback;
}

function prefixLines(text, marker, fallback) {
  const source = text || fallback;
  return source.split(/\r\n|\r|\n/).map((line, index) => {
    if (marker === 'number') return `${index + 1}. ${line || 'List item'}`;
    return `${marker}${line || fallback}`;
  }).join('\n');
}

function commandText(command, selection) {
  switch (command) {
    case 'h1': return prefixLines(selection, '# ', 'Heading');
    case 'h2': return prefixLines(selection, '## ', 'Heading');
    case 'bold': return `**${selectedOr(selection, 'text')}**`;
    case 'italic': return `*${selectedOr(selection, 'text')}*`;
    case 'link': return `[${selectedOr(selection, 'link text')}]()`;
    case 'code': return `\`${selectedOr(selection, 'code')}\``;
    case 'bullet': return prefixLines(selection, '- ', 'List item');
    case 'number': return prefixLines(selection, 'number', 'List item');
    case 'check': return prefixLines(selection, '- [ ] ', 'Task');
    case 'quote': return prefixLines(selection, '> ', 'Quote');
    case 'image': return `![${selectedOr(selection, 'alt text')}]()`;
    case 'table': return '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |';
    default: return selection;
  }
}

// ── Note Body: inline markdown editor ─────────────────────────────────────
// Click read-view to edit. Debounced autosave on keystroke. Blur or "done"
// exits edit mode. Renders `[[Title]]` as clickable links that call
// onOpenEntry for the matched entry (gray + dashed if no title match).
export function NoteBody({entry,entries,onUpdate,onUpdateEntry,onOpenEntry}){
  const[editing,setEditing]=useState(false);
  const[mode,setMode]=useState('edit');
  const[draft,setDraft]=useState(entry.notes||'');
  const[savedAt,setSavedAt]=useState(null);
  // Suggest popover state: {x, y, lineHeight, query, start, index}
  const[suggest,setSuggest]=useState(null);
  const taRef=useRef(null);
  const containerRef=useRef(null);
  useEffect(()=>{injectNoteCss()},[]);
  useEffect(()=>{setDraft(entry.notes||'');setEditing(false);setMode('edit');setSavedAt(null);setSuggest(null)},[entry.id]);

  const titleIndex=useMemo(()=>{
    const m=new Map();
    entries.forEach(e=>{if(e.id!==entry.id&&e.title)m.set(e.title.toLowerCase(),e.id)});
    return m;
  },[entries,entry.id]);

  // When notes change, resolve `[[Title]]` to entry ids and sync into
  // entry.links (phase 2 bridge — keeps graph + backlinks aware of wiki
  // links). Prior non-wiki links are preserved unless user removes the
  // matching wiki link and saves again.
  const commitNotes=useDebouncedCallback(text=>{
    const found=[];const seen=new Set();
    text.replace(/\[\[([^\[\]\n]{1,120})\]\]/g,(_,raw)=>{
      const id=titleIndex.get(raw.trim().toLowerCase());
      if(id&&!seen.has(id)){seen.add(id);found.push(id)}
      return'';
    });
    const manual=entry[MANUAL_LINKS_FIELD]?(entry.links||[]):[];
    const merged=[...manual,...found.filter(id=>!manual.includes(id))];
    const patch={notes:text,links:merged};
    if(manual.length)patch[MANUAL_LINKS_FIELD]=true;
    if(onUpdateEntry)onUpdateEntry(entry.id,patch);
    else onUpdate?.(patch);
    setSavedAt(Date.now());
  },250);

  // Fuzzy candidates when wiki-trigger is active. Reuses link-picker pattern.
  const suggestCandidates=useMemo(()=>{
    if(!suggest)return[];
    const q=suggest.query.trim().toLowerCase();
    return entries
      .filter(e=>e.id!==entry.id&&e.title)
      .filter(e=>!q||e.title.toLowerCase().includes(q)||(e.tags||[]).some(t=>t.toLowerCase().includes(q)))
      .slice(0,8);
  },[suggest,entries,entry.id]);

  const updateSuggest=()=>{
    const ta=taRef.current;if(!ta){setSuggest(null);return}
    const caret=ta.selectionEnd;
    const trig=detectWikiTrigger(ta.value,caret);
    if(!trig){setSuggest(null);return}
    const coords=getCaretCoords(ta);
    if(!coords){setSuggest(null);return}
    setSuggest(prev=>({x:coords.x,y:coords.y,lineHeight:coords.lineHeight,query:trig.query,start:trig.start,index:prev?.start===trig.start?Math.min(prev.index||0,7):0}));
  };

  const pickSuggestion=title=>{
    const ta=taRef.current;if(!ta||!suggest)return;
    const v=ta.value;
    const before=v.slice(0,suggest.start-2);
    const after=v.slice(suggest.start+suggest.query.length);
    const next=before+'[['+title+']]'+after;
    setDraft(next);commitNotes(next);setSuggest(null);
    const newCaret=before.length+title.length+4;
    requestAnimationFrame(()=>{ta.focus();ta.setSelectionRange(newCaret,newCaret)});
  };

  const onChange=e=>{setDraft(e.target.value);commitNotes(e.target.value);updateSuggest()};
  const onKeyUp=()=>{updateSuggest()};
  const onKeyDown=e=>{
    if(!suggest)return;
    if(e.key==='Escape'){e.preventDefault();setSuggest(null);return}
    if(e.key==='ArrowDown'){e.preventDefault();setSuggest(s=>s?{...s,index:Math.min((s.index||0)+1,suggestCandidates.length-1)}:s);return}
    if(e.key==='ArrowUp'){e.preventDefault();setSuggest(s=>s?{...s,index:Math.max((s.index||0)-1,0)}:s);return}
    if(e.key==='Enter'&&suggestCandidates.length){
      e.preventDefault();
      const c=suggestCandidates[Math.min(suggest.index||0,suggestCandidates.length-1)];
      if(c)pickSuggestion(c.title);
      return;
    }
  };
  const onBlur=()=>{
    // Small delay so a click on the suggest popover can fire pickSuggestion first
    setTimeout(()=>{
      if(draft!==(entry.notes||'')){commitNotes(draft)}
      setSuggest(null);
    },120);
  };

  const renderMarkdown=source=>{
    if(!source)return'';
    try{
      const pre=renderWikiLinks(source,titleIndex);
      return sanitizeHtml(marked.parse(pre,{breaks:true,gfm:true}));
    }catch(err){console.error('marked.parse failed',err);return escapeHtml(source)}
  };
  const html=useMemo(()=>renderMarkdown(entry.notes),[entry.notes,titleIndex]);
  const draftHtml=useMemo(()=>renderMarkdown(draft),[draft,titleIndex]);

  const applyCommand=command=>{
    const ta=taRef.current;
    const start=ta?.selectionStart ?? draft.length;
    const end=ta?.selectionEnd ?? draft.length;
    const before=draft.slice(0,start);
    const selected=draft.slice(start,end);
    const after=draft.slice(end);
    const insert=commandText(command,selected);
    const next=before+insert+after;
    setDraft(next);
    commitNotes(next);
    requestAnimationFrame(()=>{
      ta?.focus();
      const nextStart=before.length;
      const nextEnd=before.length+insert.length;
      ta?.setSelectionRange(nextStart,nextEnd);
      updateSuggest();
    });
  };

  // Click handler on rendered body: intercept wiki-link anchor clicks
  const onBodyClick=e=>{
    const a=e.target.closest('a.mgn-wl');
    if(a){e.preventDefault();e.stopPropagation();const id=a.getAttribute('data-jfid');if(id)onOpenEntry?.(id);return}
    // Any other click edits the note
    setEditing(true);
  };

  if(!editing){
    if(!entry.notes){
      return(
        <div onClick={()=>setEditing(true)}
          role="button" tabIndex={0}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setEditing(true)}}}
          aria-label="Add notes"
          style={{fontSize:12,color:'var(--t3)',fontStyle:'italic',padding:'10px 0',cursor:'text',marginBottom:16}}>
          Click to add notes…
        </div>
      );
    }
    return(
      <div ref={containerRef} onClick={onBodyClick}
        className="mgn-md"
        role="button" tabIndex={0}
        onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setEditing(true)}}}
        aria-label="Notes — click to edit"
        style={{cursor:'text',marginBottom:16,padding:'2px 0'}}
        dangerouslySetInnerHTML={{__html:html}}
      />
    );
  }

  return(
    <div style={{marginBottom:16,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--b1)',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderBottom:'1px solid var(--br)',background:'var(--b2)',flexWrap:'wrap'}}>
        <div role="tablist" aria-label="Editor mode" style={{display:'inline-flex',border:'1px solid var(--br)',borderRadius:'var(--rd)',overflow:'hidden'}}>
          {['edit','preview'].map(nextMode=>(
            <button key={nextMode} type="button" role="tab" aria-selected={mode===nextMode} onMouseDown={e=>e.preventDefault()} onClick={()=>setMode(nextMode)}
              style={{border:'none',padding:'5px 10px',background:mode===nextMode?'var(--ac)':'transparent',color:mode===nextMode?'var(--act)':'var(--t2)',fontFamily:'var(--fn)',fontSize:11,fontWeight:700,cursor:'pointer'}}>
              {nextMode==='edit'?'Edit':'Preview'}
            </button>
          ))}
        </div>
        <div role="toolbar" aria-label="Markdown formatting" style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {TOOLBAR_COMMANDS.map(([id,label,short])=>(
            <button key={id} type="button" aria-label={label} title={label}
              onMouseDown={e=>e.preventDefault()}
              onClick={()=>applyCommand(id)}
              style={{minWidth:28,height:26,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',fontFamily:'var(--fn)',fontSize:11,fontWeight:800,cursor:'pointer'}}>
              {short}
            </button>
          ))}
        </div>
      </div>
      {mode==='preview'?(
        <div className="mgn-md" style={{minHeight:140,padding:'12px 14px',background:'var(--bg)'}} dangerouslySetInnerHTML={{__html:draftHtml||'<p></p>'}} />
      ):(
        <div style={{display:'grid',gridTemplateColumns:'44px minmax(0,1fr)',background:'var(--bg)'}}>
          <div aria-label="Line numbers" style={{padding:'10px 8px',borderRight:'1px solid var(--br)',background:'var(--b2)',color:'var(--t3)',fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',fontSize:12,lineHeight:1.7,textAlign:'right',userSelect:'none'}}>
            {lineNumbers(draft).map(line=><div key={line}>{line}</div>)}
          </div>
          <textarea ref={taRef} autoFocus value={draft}
            aria-label="Markdown editor"
            onChange={onChange} onBlur={onBlur}
            onKeyUp={onKeyUp} onKeyDown={onKeyDown} onClick={updateSuggest}
            placeholder="Write in markdown… # heading, - list, **bold**, [[WikiLink]]"
            spellCheck
            style={{
              width:'100%',minHeight:168,padding:'10px 12px',
              background:'transparent',border:'none',
              color:'var(--tx)',fontFamily:'var(--fn)',fontSize:13,lineHeight:1.7,
              resize:'vertical',outline:'none',boxSizing:'border-box',
            }}
          />
        </div>
      )}
      {suggest&&suggestCandidates.length>0&&(
        <div role="listbox" aria-label="Wiki-link suggestions"
          style={{
            position:'fixed',
            left:suggest.x,
            top:suggest.y+(suggest.lineHeight||18)+4,
            minWidth:220,maxWidth:320,maxHeight:240,overflowY:'auto',
            background:'var(--cd)',border:'1px solid var(--br)',borderRadius:'var(--rd)',
            boxShadow:'0 6px 24px rgba(0,0,0,0.18)',zIndex:200,padding:4,
            fontFamily:'var(--fn)',
          }}>
          {suggestCandidates.map((c,i)=>(
            <button key={c.id} type="button"
              role="option" aria-selected={i===(suggest.index||0)}
              onMouseDown={e=>{e.preventDefault();pickSuggestion(c.title)}}
              onMouseEnter={()=>setSuggest(s=>s?{...s,index:i}:s)}
              style={{
                display:'flex',alignItems:'center',gap:6,width:'100%',textAlign:'left',
                padding:'6px 8px',fontSize:12,background:i===(suggest.index||0)?'var(--b2)':'transparent',
                border:'none',borderRadius:'var(--rd)',color:'var(--tx)',cursor:'pointer',fontFamily:'var(--fn)',
              }}>
              <span style={{flexShrink:0}}>{ICON[c.type]}</span>
              <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.title}</span>
            </button>
          ))}
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 10px',borderTop:'1px solid var(--br)',fontSize:10,color:'var(--t3)',flexWrap:'wrap'}}>
        <span>Markdown</span>
        <span>{countWords(draft)} words</span>
        <span>{countLines(draft)} lines</span>
        <span>{formatBytes(draft)}</span>
        <span>Spaces: {countSpaces(draft)}</span>
        <span>Live</span>
        <span>[[wiki]]</span>
        {savedAt&&<span style={{color:'var(--t2)'}}>· saved</span>}
        <button type="button" onMouseDown={e=>{e.preventDefault();if(draft!==(entry.notes||''))commitNotes(draft);setEditing(false)}}
          style={{marginLeft:'auto',background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',fontSize:10,padding:'2px 8px',cursor:'pointer',fontFamily:'var(--fn)'}}>
          Done
        </button>
      </div>
    </div>
  );
}
