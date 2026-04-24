import { useEffect } from "react";
import { getAIConfig, setAIConfig } from './ai/providers.js';
import { OR_VERIFIER_KEY, exchangeOpenRouterCode } from './ai/openrouter.js';

// OpenRouter OAuth callback: if URL has ?code=, exchange for key then clean URL.
export function useOpenRouterCallback(toast){
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const code=params.get('code');
    if(!code||!sessionStorage.getItem(OR_VERIFIER_KEY))return;
    (async()=>{
      try{
        const key=await exchangeOpenRouterCode(code);
        const existing=getAIConfig()||{};
        setAIConfig({...existing,enabled:true,provider:'openrouter',model:existing.model||'anthropic/claude-sonnet-4',key});
        toast('OpenRouter connected');
      }catch(err){toast('OpenRouter login failed: '+(err.message||'error'),'error')}
      finally{
        params.delete('code');
        const clean=window.location.pathname+(params.toString()?`?${params}`:'');
        window.history.replaceState({},'',clean);
      }
    })();
  },[toast]);
}

// Keyboard shortcuts: N (new entry), Shift+N (quick-note capture), / (focus search).
// Suppressed while a modal/detail panel is open so in-field typing isn't hijacked.
export function useAppShortcuts({blocked,openAdd}){
  useEffect(()=>{
    const h=e=>{
      const inField=e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable;
      if(inField)return;
      if(blocked)return;
      // Shift+N → quick-capture a note. Browser reports key='N' when shifted.
      if(e.shiftKey&&(e.key==='N'||e.key==='n')){e.preventDefault();openAdd({type:'note',quickCapture:true});return}
      if(!e.shiftKey&&e.key==='n'){openAdd();return}
      if(e.key==='/'){e.preventDefault();document.querySelector('input[placeholder^="Search"]')?.focus()}
    };
    document.addEventListener('keydown',h);return()=>document.removeEventListener('keydown',h);
  },[blocked,openAdd]);
}
