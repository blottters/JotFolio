import { useState, useEffect, useRef, useMemo } from "react";
import { marked } from 'marked';
import { ICON } from '../../lib/types.js';
import { useDebouncedCallback } from '../../lib/hooks.js';
import { injectNoteCss, renderWikiLinks, escapeHtml, getCaretCoords, detectWikiTrigger } from '../../lib/markdown.js';

// ── Note Body: inline markdown editor ─────────────────────────────────────
// Click read-view to edit. Debounced autosave on keystroke. Blur or "done"
// exits edit mode. Renders `[[Title]]` as clickable links that call
// onOpenEntry for the matched entry (gray + dashed if no title match).
export function NoteBody({entry,entries,onUpdate,onOpenEntry}){
  const[editing,setEditing]=useState(false);
  const[draft,setDraft]=useState(entry.notes||'');
  const[savedAt,setSavedAt]=useState(null);
  // Suggest popover state: {x, y, lineHeight, query, start, index}
  const[suggest,setSuggest]=useState(null);
  const taRef=useRef(null);
  const containerRef=useRef(null);
  useEffect(()=>{injectNoteCss()},[]);
  useEffect(()=>{setDraft(entry.notes||'');setEditing(false);setSavedAt(null);setSuggest(null)},[entry.id]);

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
    const existing=new Set(entry.links||[]);
    const merged=[...(entry.links||[]),...found.filter(id=>!existing.has(id))];
    const patch={notes:text};
    if(merged.length!==(entry.links||[]).length)patch.links=merged;
    onUpdate(patch);
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
      setEditing(false);
    },120);
  };

  const html=useMemo(()=>{
    if(!entry.notes)return'';
    try{
      const pre=renderWikiLinks(entry.notes,titleIndex);
      return marked.parse(pre,{breaks:true,gfm:true});
    }catch(err){console.error('marked.parse failed',err);return escapeHtml(entry.notes)}
  },[entry.notes,titleIndex]);

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
    <div style={{marginBottom:16}}>
      <textarea ref={taRef} autoFocus value={draft}
        onChange={onChange} onBlur={onBlur}
        onKeyUp={onKeyUp} onKeyDown={onKeyDown} onClick={updateSuggest}
        placeholder="Write in markdown… # heading, - list, **bold**, [[WikiLink]]"
        style={{
          width:'100%',minHeight:140,padding:'10px 12px',
          background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',
          color:'var(--tx)',fontFamily:'var(--fn)',fontSize:13,lineHeight:1.7,
          resize:'vertical',outline:'none',boxSizing:'border-box',
        }}
      />
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
      <div style={{display:'flex',alignItems:'center',gap:10,marginTop:4,fontSize:10,color:'var(--t3)'}}>
        <span>markdown · [[wiki]] · saves as you type</span>
        {savedAt&&<span style={{color:'var(--t2)'}}>· saved</span>}
        <button type="button" onMouseDown={e=>{e.preventDefault();if(draft!==(entry.notes||''))commitNotes(draft);setEditing(false)}}
          style={{marginLeft:'auto',background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',fontSize:10,padding:'2px 8px',cursor:'pointer',fontFamily:'var(--fn)'}}>
          done
        </button>
      </div>
    </div>
  );
}
