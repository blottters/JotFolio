import { normalizeTags } from '../../lib/storage.js';

export function TagSuggestions({value,onChange,allTags}){
  const current=new Set(normalizeTags(value));
  const available=allTags.filter(t=>!current.has(t));
  if(!available.length)return null;
  const add=tag=>{const tags=normalizeTags(value);if(!tags.includes(tag))tags.push(tag);onChange(tags.join(', '))};
  return(
    <div style={{maxHeight:56,overflowY:'auto',display:'flex',flexWrap:'wrap',gap:4,marginTop:5,alignItems:'center',paddingBottom:2}}>
      <span style={{fontSize:10,color:'var(--t3)',flexShrink:0}}>add:</span>
      {available.slice(0,12).map(t=>(
        <button key={t} type="button" onClick={()=>add(t)}
          style={{padding:'2px 7px',fontSize:10,border:'1px solid var(--br)',borderRadius:99,background:'transparent',color:'var(--t3)',cursor:'pointer',fontFamily:'var(--fn)'}}>
          {t}
        </button>
      ))}
    </div>
  );
}
