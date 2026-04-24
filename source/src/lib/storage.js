import { COMMON_FIELDS, TYPE_FIELDS } from './types.js';

// ── Utils ──────────────────────────────────────────────────────────────────
// Storage: uses window.storage when available (claude.ai artifact host),
// falls back to localStorage for the Vite/static build. Corrupt JSON is
// recoverable: the raw value is copied to a quarantine key and callers get a
// typed error instead of silently treating it as empty.
const corruptKeys = new Set();

export const CORRUPT_STORAGE_CODE = 'corrupt-storage';

export class StorageCorruptionError extends Error {
  constructor(key, raw, cause, quarantineKey) {
    super(`corrupt-storage: ${key}`);
    this.name = 'StorageCorruptionError';
    this.code = CORRUPT_STORAGE_CODE;
    this.key = key;
    this.raw = raw;
    this.cause = cause;
    this.quarantineKey = quarantineKey;
    this.recoverable = true;
  }
}

export function isStorageCorruptionError(err) {
  return err instanceof StorageCorruptionError
    || (err != null && typeof err === 'object' && err.code === CORRUPT_STORAGE_CODE);
}

export function storageQuarantineKey(key, stamp = Date.now()) {
  return `${key}.corrupt.${stamp}`;
}

async function quarantineValue(key, raw, cause) {
  corruptKeys.add(key);
  const quarantineKey = storageQuarantineKey(key);
  try {
    if (typeof window !== 'undefined' && window.storage?.set) {
      await window.storage.set(quarantineKey, raw);
    } else {
      localStorage.setItem(quarantineKey, raw);
    }
  } catch (err) {
    console.error('storage: failed to quarantine corrupt value for', key, err);
  }
  throw new StorageCorruptionError(key, raw, cause, quarantineKey);
}

async function parseStoredValue(key, raw) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('storage: corrupt value for', key, err);
    return quarantineValue(key, raw, err);
  }
}

export const storage = {
  async get(k){
    try{
      if(typeof window!=='undefined'&&window.storage?.get){
        const r=await window.storage.get(k);
        if(!r)return null;
        return parseStoredValue(k,r.value);
      }
      const v=localStorage.getItem(k);
      if(v==null)return null;
      return parseStoredValue(k,v);
    }catch(e){
      if(isStorageCorruptionError(e))throw e;
      console.error('storage.get',k,e);return null
    }
  },
  async set(k,v){
    try{
      if(corruptKeys.has(k))throw new StorageCorruptionError(k, null);
      const s=JSON.stringify(v);
      if(typeof window!=='undefined'&&window.storage?.set){await window.storage.set(k,s);return}
      localStorage.setItem(k,s);
    }catch(e){
      if(isStorageCorruptionError(e))throw e;
      console.error('storage.set',k,e)
    }
  }
};

export const uid = ()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
export const formatDate = d=>new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
export function withAlpha(hex,alpha){
  if(!hex)return`rgba(107,114,128,${alpha})`;
  const h=hex.replace('#','');const full=h.length===3?h.split('').map(c=>c+c).join(''):h;
  return`rgba(${parseInt(full.slice(0,2),16)},${parseInt(full.slice(2,4),16)},${parseInt(full.slice(4,6),16)},${alpha})`;
}
export function isSafeUrl(url){if(!url)return false;try{const u=new URL(url);return u.protocol==='http:'||u.protocol==='https:'}catch{return false}}
export function normalizeTags(input){
  const arr=Array.isArray(input)?input:String(input||'').split(',');
  return[...new Set(arr.map(t=>t.trim().toLowerCase()).filter(Boolean))];
}
export function pickEntryFields(entry,type){
  const keep=new Set([...COMMON_FIELDS,...(TYPE_FIELDS[type]||[])]);
  const out={};for(const k of Object.keys(entry)){if(keep.has(k))out[k]=entry[k];}return out;
}
export function startVoiceRecognition(onResult,onError){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){onError?.('Voice input not supported in this browser.');return null}
  const r=new SR();let resolved=false;
  r.onresult=e=>{resolved=true;onResult(Array.from(e.results).map(x=>x[0].transcript).join(' '))};
  r.onerror=e=>{resolved=true;onError?.(typeof e.error==='string'?e.error:'Voice recognition error.')};
  r.onend=()=>{if(!resolved)onError?.('No speech detected.')};
  try{r.start()}catch(err){onError?.(err?.message||'Could not start voice input.');return null}
  return r;
}
