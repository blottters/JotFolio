import { useEffect } from "react";

// ── Dropdown primitives ───────────────────────────────────────────────────
// Single-open enforcement: when any dropdown opens it dispatches an event
// that closes every other open dropdown. Avoids two listboxes at once.
export const _dropdownBus=typeof EventTarget!=='undefined'?new EventTarget():null;
export function useSingleOpenDropdown(open,close){
  useEffect(()=>{
    if(!_dropdownBus||!open)return;
    const id={};
    const h=e=>{if(e.detail!==id)close()};
    _dropdownBus.addEventListener('open',h);
    _dropdownBus.dispatchEvent(new CustomEvent('open',{detail:id}));
    return()=>_dropdownBus.removeEventListener('open',h);
  },[open,close]);
}
export function useClickOutside(ref,onClose,active){
  useEffect(()=>{
    if(!active)return;
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose()};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[active,ref,onClose]);
}
