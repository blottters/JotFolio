export function Toasts({toasts}){
  if(!toasts.length)return null;
  return(
    <div role="status" aria-live="polite" aria-atomic="true" style={{position:'fixed',bottom:80,right:24,zIndex:500,display:'flex',flexDirection:'column',gap:6,pointerEvents:'none'}}>
      {toasts.map(t=>(
        <div key={t.id} style={{padding:'9px 16px',background:t.type==='error'?'#ef4444':t.type==='info'?'var(--b2)':'var(--ac)',color:t.type==='info'?'var(--tx)':'var(--act)',borderRadius:'var(--rd)',fontSize:13,fontWeight:600,boxShadow:'0 4px 20px rgba(0,0,0,0.25)',border:'1px solid var(--br)',whiteSpace:'nowrap'}}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
