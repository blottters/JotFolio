import { TRASH_DIR, originalPathFromTrashPath } from '../../lib/vaultTrash.js';

function originalPath(path) {
  try { return originalPathFromTrashPath(path); }
  catch { return path || 'Unknown file'; }
}

function trashBatch(path) {
  const prefix = `${TRASH_DIR}/`;
  if (!String(path || '').startsWith(prefix)) return '';
  const rest = path.slice(prefix.length);
  return rest.split('/')[0] || '';
}

function formatBytes(size) {
  const n = Number(size) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function TrashView({items = [], busy, error, onRefresh, onRestore, onPermanentDelete, onEmptyTrash}) {
  return (
    <>
      <div style={{padding:'10px 14px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',gap:10,background:'var(--b2)',flexShrink:0}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:800,color:'var(--tx)'}}>JotFolio Trash</div>
          <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.4}}>Deleted files are kept here until you restore them or permanently delete them.</div>
        </div>
        <button type="button" onClick={onRefresh} disabled={busy}
          style={{padding:'7px 11px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:busy?'default':'pointer',fontFamily:'var(--fn)',fontWeight:700}}>
          {busy ? 'Refreshing...' : 'Refresh'}
        </button>
        <button type="button" onClick={onEmptyTrash} disabled={busy || items.length === 0}
          style={{padding:'7px 11px',fontSize:12,border:'1px solid #b91c1c',borderRadius:'var(--rd)',background:'transparent',color:items.length ? '#b91c1c' : 'var(--t3)',cursor:busy || items.length === 0 ? 'default' : 'pointer',fontFamily:'var(--fn)',fontWeight:800}}>
          Empty Trash
        </button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:14}}>
        {error&&(
          <div role="alert" style={{marginBottom:12,padding:12,border:'1px solid #ef4444',borderRadius:'var(--rd)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontSize:12}}>
            {error}
          </div>
        )}
        {items.length===0?(
          <div style={{textAlign:'center',padding:'70px 20px',color:'var(--t3)'}}>
            <div style={{fontSize:38,marginBottom:10}} aria-hidden="true">⌫</div>
            <div style={{fontSize:15,fontWeight:800,color:'var(--tx)',marginBottom:4}}>Trash is empty</div>
            <div style={{fontSize:13,lineHeight:1.5}}>Deleted entries, bases, canvases, and template files will appear here before permanent deletion.</div>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {items.map(item=>{
              const target = originalPath(item.path);
              const batch = trashBatch(item.path);
              return (
                <article key={item.path} style={{background:'var(--cd)',border:'1px solid var(--br)',borderRadius:'var(--rd)',padding:12,display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:30,height:30,border:'1px solid var(--br)',borderRadius:'var(--rd)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',background:'var(--b2)',flexShrink:0}} aria-hidden="true">⌫</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:'var(--tx)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={target}>{target}</div>
                    <div style={{fontSize:11,color:'var(--t3)',marginTop:3,display:'flex',gap:8,flexWrap:'wrap'}}>
                      <span title={item.path}>Stored in Trash</span>
                      {batch&&<span title={batch}>Batch: {batch}</span>}
                      <span>{formatBytes(item.size)}</span>
                    </div>
                  </div>
                  <button type="button" onClick={()=>onRestore(item.path)} disabled={busy}
                    style={{padding:'6px 10px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--ac)',color:'var(--act)',cursor:busy?'default':'pointer',fontFamily:'var(--fn)',fontWeight:800,flexShrink:0}}>
                    Restore
                  </button>
                  <button type="button" onClick={()=>onPermanentDelete(item.path)} disabled={busy}
                    style={{padding:'6px 10px',fontSize:12,border:'1px solid #b91c1c',borderRadius:'var(--rd)',background:'transparent',color:'#b91c1c',cursor:busy?'default':'pointer',fontFamily:'var(--fn)',fontWeight:800,flexShrink:0}}>
                    Delete
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
