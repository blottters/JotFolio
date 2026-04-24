import { useState, useEffect, useRef, useCallback } from "react";

// Debounce a callback by N ms. Stable across renders; trailing-edge fire.
export function useDebouncedCallback(fn,ms){
  const fnRef=useRef(fn);useEffect(()=>{fnRef.current=fn},[fn]);
  const tRef=useRef(null);
  useEffect(()=>()=>clearTimeout(tRef.current),[]);
  return useCallback((...a)=>{clearTimeout(tRef.current);tRef.current=setTimeout(()=>fnRef.current(...a),ms)},[ms]);
}

function getSystemDark(){
  if(typeof window==='undefined')return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches??false;
}

// ── Hooks ──────────────────────────────────────────────────────────────────
export function useSystemDark(){
  const[sd,setSd]=useState(getSystemDark);
  useEffect(()=>{
    const mql=window.matchMedia?.('(prefers-color-scheme: dark)');
    if(!mql)return;
    const h=e=>setSd(e.matches);
    setSd(mql.matches);
    if(mql.addEventListener){
      mql.addEventListener('change',h);
      return()=>mql.removeEventListener('change',h);
    }
    mql.addListener?.(h);
    return()=>mql.removeListener?.(h);
  },[]);
  return sd;
}
function isEditableTarget(target){
  if(!target)return false;
  const tag=target.tagName;
  return tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||target.isContentEditable||!!target.closest?.('[contenteditable="true"],[contenteditable=""]');
}
export function useEscapeKey(active,onDismiss,opts={}){
  const cbRef=useRef(onDismiss);
  useEffect(()=>{cbRef.current=onDismiss},[onDismiss]);
  useEffect(()=>{
    if(!active)return;
    const h=e=>{
      if(e.key!=='Escape')return;
      if(!opts.includeEditableTargets&&isEditableTarget(e.target))return;
      cbRef.current?.();
    };
    document.addEventListener('keydown',h);
    return()=>document.removeEventListener('keydown',h);
  },[active,opts.includeEditableTargets]);
}
export function useAutoFocus(ref){useEffect(()=>{ref.current?.focus?.()},[])}
