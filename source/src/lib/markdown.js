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

const ALLOWED_TAGS=new Set([
  'a','blockquote','br','code','del','em','h1','h2','h3','h4','h5','h6','hr',
  'img','li','ol','p','pre','span','strong','table','tbody','td','th','thead','tr','ul',
]);
const DROP_WITH_CONTENT=new Set(['script','style','iframe','form','object','embed','meta','link','base']);
const GLOBAL_ATTRS=new Set(['class','title']);
const ATTRS_BY_TAG={
  a:new Set(['href','title','class','data-jfid']),
  img:new Set(['src','alt','title']),
  ol:new Set(['start']),
  td:new Set(['align']),
  th:new Set(['align']),
  span:new Set(['title','class']),
};
const SAFE_URL_PROTOCOLS=new Set(['http:','https:','mailto:','tel:']);

export function sanitizeHtml(html){
  if(typeof document==='undefined')return escapeHtml(html);
  const template=document.createElement('template');
  template.innerHTML=String(html);
  sanitizeChildren(template.content);
  return template.innerHTML;
}

function sanitizeChildren(parent){
  [...parent.childNodes].forEach(node=>sanitizeNode(node));
}

function sanitizeNode(node){
  if(node.nodeType===Node.COMMENT_NODE){node.remove();return}
  if(node.nodeType!==Node.ELEMENT_NODE)return;

  const tag=node.tagName.toLowerCase();
  if(DROP_WITH_CONTENT.has(tag)){node.remove();return}
  if(!ALLOWED_TAGS.has(tag)){
    const fragment=document.createDocumentFragment();
    while(node.firstChild)fragment.appendChild(node.firstChild);
    sanitizeChildren(fragment);
    node.replaceWith(fragment);
    return;
  }

  sanitizeAttributes(node,tag);
  sanitizeChildren(node);
}

function sanitizeAttributes(node,tag){
  const allowedForTag=ATTRS_BY_TAG[tag]||new Set();
  [...node.attributes].forEach(attr=>{
    const name=attr.name.toLowerCase();
    if(name.startsWith('on')||name==='style'){node.removeAttribute(attr.name);return}
    if(!GLOBAL_ATTRS.has(name)&&!allowedForTag.has(name)){node.removeAttribute(attr.name);return}
    if((name==='href'||name==='src')&&!isSafeUrl(attr.value)){node.removeAttribute(attr.name)}
  });
}

function isSafeUrl(value){
  const raw=String(value||'').trim();
  // Reject protocol-relative URLs (`//host/path`) outright — they inherit
  // the page's scheme and let a rendered `<a href="//attacker.com">` or
  // `<img src="//attacker.com/track.png">` bypass the scheme allowlist.
  if(raw.startsWith('//'))return false;
  if(raw===''||raw.startsWith('#')||raw.startsWith('/')||raw.startsWith('./')||raw.startsWith('../'))return true;
  try{
    const parsed=new URL(raw,window.location?.href||'http://localhost/');
    return SAFE_URL_PROTOCOLS.has(parsed.protocol);
  }catch{
    return false;
  }
}

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
