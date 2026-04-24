// Scoped CSS for markdown-rendered note bodies. Injected once by NoteBody.
export const NOTE_MD_CSS=`
.mgn-md{font-size:13px;line-height:1.7;color:var(--tx)}
.mgn-md>*:first-child{margin-top:0}
.mgn-md>*:last-child{margin-bottom:0}
.mgn-md h1{font-size:20px;font-weight:700;margin:14px 0 6px;line-height:1.3}
.mgn-md h2{font-size:17px;font-weight:700;margin:12px 0 6px;line-height:1.3}
.mgn-md h3{font-size:15px;font-weight:700;margin:10px 0 4px}
.mgn-md p{margin:0 0 10px}
.mgn-md ul,.mgn-md ol{margin:0 0 10px 22px;padding:0}
.mgn-md li{margin:2px 0}
.mgn-md code{background:var(--b2);padding:1px 5px;border-radius:4px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px}
.mgn-md pre{background:var(--b2);padding:10px 12px;border-radius:var(--rd);overflow-x:auto;margin:0 0 10px;border:1px solid var(--br)}
.mgn-md pre code{background:transparent;padding:0;font-size:12px}
.mgn-md blockquote{margin:0 0 10px;padding:4px 12px;border-left:3px solid var(--ac);color:var(--t2);font-style:italic}
.mgn-md a{color:var(--ac);text-decoration:underline}
.mgn-md hr{border:none;border-top:1px solid var(--br);margin:14px 0}
.mgn-md .mgn-wl{color:var(--ac);text-decoration:none;border-bottom:1px solid var(--ac);cursor:pointer}
.mgn-md .mgn-wl-broken{color:var(--t3);border-bottom:1px dashed var(--t3);cursor:help}
`;

let __mgnNoteCssInjected=false;
export function injectNoteCss(){
  if(__mgnNoteCssInjected||typeof document==='undefined')return;
  __mgnNoteCssInjected=true;
  const s=document.createElement('style');s.id='mgn-note-md';s.textContent=NOTE_MD_CSS;
  document.head.appendChild(s);
}

// Replace [[Title]] with clickable anchors pointing at jf://<id>. Uses a
// title→entry map so rename isn't tracked — matches by current title.
export function renderWikiLinks(text,titleIndex){
  return text.replace(/\[\[([^\[\]\n]{1,120})\]\]/g,(_,raw)=>{
    const title=raw.trim();
    const id=titleIndex.get(title.toLowerCase());
    if(id)return`<a class="mgn-wl" data-jfid="${id}" href="#">${escapeHtml(title)}</a>`;
    return`<span class="mgn-wl-broken" title="No entry named '${escapeHtml(title)}'">[[${escapeHtml(title)}]]</span>`;
  });
}
export function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

// Caret pixel position inside a textarea using the hidden-mirror technique.
// Clones computed styles onto an offscreen div, injects value-up-to-caret
// followed by a marker span, then reads the span's offset. Returns top-left
// of the caret line in client coords + line height for popover placement.
export function getCaretCoords(ta){
  if(!ta)return null;
  const style=window.getComputedStyle(ta);
  const div=document.createElement('div');
  const props=['boxSizing','width','height','overflowX','overflowY',
    'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
    'paddingTop','paddingRight','paddingBottom','paddingLeft',
    'fontStyle','fontVariant','fontWeight','fontStretch','fontSize',
    'lineHeight','fontFamily','textAlign','textTransform','textIndent',
    'letterSpacing','wordSpacing','tabSize','whiteSpace','wordBreak'];
  props.forEach(p=>{div.style[p]=style[p]});
  div.style.position='absolute';
  div.style.visibility='hidden';
  div.style.whiteSpace='pre-wrap';
  div.style.wordWrap='break-word';
  div.style.top='0';div.style.left='-9999px';
  document.body.appendChild(div);
  div.textContent=ta.value.slice(0,ta.selectionEnd);
  const span=document.createElement('span');span.textContent='.';
  div.appendChild(span);
  const rect=ta.getBoundingClientRect();
  const lineHeight=parseFloat(style.lineHeight)||parseFloat(style.fontSize)*1.4;
  const x=rect.left+span.offsetLeft-ta.scrollLeft;
  const y=rect.top+span.offsetTop-ta.scrollTop;
  document.body.removeChild(div);
  return{x,y,lineHeight};
}

// If the caret sits inside an open `[[…` (no closing `]]` or newline after
// the open), return { start, query } where `start` is the text position
// right after `[[`. Otherwise null.
export function detectWikiTrigger(value,caret){
  const slice=value.slice(0,caret);
  const open=slice.lastIndexOf('[[');
  if(open===-1)return null;
  const between=slice.slice(open+2);
  if(/\]\]|\n/.test(between))return null;
  if(between.length>60)return null;
  return{start:open+2,query:between};
}
