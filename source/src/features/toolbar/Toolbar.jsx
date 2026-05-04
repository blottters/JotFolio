import { useId } from "react";
import { ALL_ENTRY_TYPES, STATUSES, LABEL, ALL_STATUS_VALUES, displayStatus } from '../../lib/types.js';
import { SrOnly } from '../primitives/SrOnly.jsx';
import { Select } from '../dropdowns/Select.jsx';

// ── Toolbar ────────────────────────────────────────────────────────────────
export function Toolbar({query,setQuery,section,filterStatus,setFilterStatus,sort,setSort,view,setView,hasFilters,onClear,onOpenSettings}){
  const is={padding:'8px 10px',background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--tx)',fontFamily:'var(--fn)',fontSize:13,outline:'none',boxSizing:'border-box',width:'100%'};
  const opts=ALL_ENTRY_TYPES.includes(section)?STATUSES[section]:ALL_STATUS_VALUES;
  const ph=section==='all'?'Search entries…':section==='starred'?'Search starred entries…':`Search ${LABEL[section]||section}…`;
  const sid=useId(),stid=useId(),soid=useId();
  return(
    <div style={{padding:'10px 14px',borderBottom:'1px solid var(--br)',display:'flex',gap:8,alignItems:'center',background:'var(--b2)',flexShrink:0,flexWrap:'wrap',overflowX:'auto'}}>
      <div style={{flex:'1 1 220px',minWidth:180,position:'relative'}}>
        <label htmlFor={sid}><SrOnly>Search entries</SrOnly></label>
        <span aria-hidden="true" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',fontSize:13,pointerEvents:'none'}}>🔍</span>
        <input id={sid} value={query} onChange={e=>setQuery(e.target.value)} placeholder={ph} style={{...is,paddingLeft:32}}/>
      </div>
      <div style={{width:128,flexShrink:0}}>
        <Select ariaLabel="Filter by status" value={filterStatus} onChange={setFilterStatus}
          options={[{value:'',label:'Status'},...opts.map(s=>({value:s,label:displayStatus(s)}))]}/>
      </div>
      <div style={{width:128,flexShrink:0}}>
        <Select ariaLabel="Sort entries" value={sort} onChange={setSort}
          options={[{value:'date',label:'Newest'},{value:'title',label:'A–Z'},{value:'starred',label:'Starred'}]}/>
      </div>
      {hasFilters&&(
        <button onClick={onClear} title="Clear all filters"
          style={{padding:'7px 12px',fontSize:12,fontWeight:700,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--ac)',color:'var(--act)',cursor:'pointer',fontFamily:'var(--fn)',flexShrink:0,whiteSpace:'nowrap'}}>
          ✕ Clear
        </button>
      )}
      <div role="group" aria-label="View mode" style={{display:'flex',border:'1px solid var(--br)',borderRadius:'var(--rd)',overflow:'hidden',flexShrink:0}}>
        {[['grid','⊞','Grid view'],['list','☰','List view']].map(([v,icon,label])=>(
          <button key={v} onClick={()=>setView(v)} aria-label={label} aria-pressed={view===v} title={label}
            style={{padding:'7px 10px',background:view===v?'var(--ac)':'transparent',color:view===v?'var(--act)':'var(--t2)',border:'none',cursor:'pointer',fontSize:14,lineHeight:1}}>{icon}</button>
        ))}
      </div>
    </div>
  );
}
