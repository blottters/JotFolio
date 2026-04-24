import { useState, useEffect, useRef, useCallback } from "react";

// Debounce a callback by N ms. Stable across renders; trailing-edge fire.
export function useDebouncedCallback(fn,ms){
  const fnRef=useRef(fn);useEffect(()=>{fnRef.current=fn},[fn]);
  const tRef=useRef(null);
  useEffect(()=>()=>clearTimeout(tRef.current),[]);
  return useCallback((...a)=>{clearTimeout(tRef.current);tRef.current=setTimeout(()=>fnRef.current(...a),ms)},[ms]);
}

// ── Hooks ──────────────────────────────────────────────────────────────────
export function useSystemDark(){
  const[sd,setSd]=useState(()=>window.matchMedia?.('(prefers-color-scheme: dark)').matches??false);
  useEffect(()=>{const mql=window.matchMedia?.('(prefers-color-scheme: dark)');if(!mql)return;const h=e=>setSd(e.matches);mql.addEventListener?.('change',h);return()=>mql.removeEventListener?.('change',h)},[]);
  return sd;
}
export function useEscapeKey(active,onDismiss){
  const cbRef=useRef(onDismiss);
  useEffect(()=>{cbRef.current=onDismiss},[onDismiss]);
  useEffect(()=>{
    if(!active)return;
    const h=e=>{if(e.key==='Escape')cbRef.current?.()};
    document.addEventListener('keydown',h);
    return()=>document.removeEventListener('keydown',h);
  },[active]);
}
export function useAutoFocus(ref){useEffect(()=>{ref.current?.focus?.()},[])}
