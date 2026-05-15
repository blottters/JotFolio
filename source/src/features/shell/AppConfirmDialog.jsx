export function AppConfirmDialog({request,onCancel,onConfirm}){
  if(!request)return null;
  const tone=request.tone||'danger';
  const accent=tone==='info'?'#3b82f6':tone==='warning'?'#f59e0b':'#dc2626';
  const confirmColor=tone==='warning'?'#111827':'#fff';
  return(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-confirm-title"
      style={{position:'absolute',inset:0,zIndex:80,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(5,10,16,.58)'}}
      onMouseDown={event=>{if(event.target===event.currentTarget)onCancel()}}>
      <form
        onSubmit={event=>{event.preventDefault();onConfirm()}}
        style={{width:'min(430px,calc(100vw - 32px))',background:'var(--b1)',border:'1px solid var(--br)',borderRadius:'10px',boxShadow:'0 24px 80px rgba(0,0,0,.36)',padding:18,display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <div id="app-confirm-title" style={{fontSize:16,fontWeight:800,color:'var(--tx)',marginBottom:6}}>
            {request.title||'Confirm action'}
          </div>
          {request.message&&(
            <div style={{fontSize:13,color:'var(--t2)',lineHeight:1.5,whiteSpace:'pre-wrap'}}>
              {request.message}
            </div>
          )}
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button
            type="button"
            onClick={onCancel}
            style={{fontFamily:'var(--fn)',fontSize:13,padding:'8px 12px',border:'1px solid var(--br)',borderRadius:'8px',background:'var(--b2)',color:'var(--t2)',cursor:'pointer'}}>
            {request.cancelLabel||'Cancel'}
          </button>
          <button
            autoFocus
            type="submit"
            style={{fontFamily:'var(--fn)',fontSize:13,padding:'8px 12px',border:`1px solid ${accent}`,borderRadius:'8px',background:accent,color:confirmColor,fontWeight:800,cursor:'pointer'}}>
            {request.confirmLabel||'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
