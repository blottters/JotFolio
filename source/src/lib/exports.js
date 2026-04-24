import { TYPES } from './types.js';
import { normalizeTags } from './storage.js';

// Export entries as a pretty-printed JSON download.
export function exportEntriesJSON(entries){
  const u=URL.createObjectURL(new Blob([JSON.stringify(entries,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=u;a.download='marginalia.json';a.click();
  queueMicrotask(()=>URL.revokeObjectURL(u));
}

// Export entries as a single Markdown file, entries separated by `---`.
export function exportEntriesMD(entries){
  const md=entries.map(e=>`# ${e.title||'Untitled'}\n**Type:** ${e.type} | **Date:** ${e.entry_date||e.date?.slice(0,10)}${e.url?'\n**URL:** '+e.url:''}\n**Tags:** ${(e.tags||[]).join(', ')||'none'}\n\n${e.notes||''}`).join('\n\n---\n\n');
  const u=URL.createObjectURL(new Blob([md],{type:'text/markdown'}));
  const a=document.createElement('a');a.href=u;a.download='marginalia.md';a.click();
  queueMicrotask(()=>URL.revokeObjectURL(u));
}

// Parse + validate a JSON file picked by the user. Returns { fresh, duplicates }
// where `fresh` is a normalized, dedup'd list ready to prepend to existing entries.
export async function importEntriesJSON(file,existingIds){
  const data=JSON.parse(await file.text());
  if(!Array.isArray(data))throw new Error('File must contain an array of entries');
  const valid=data.filter(e=>e&&typeof e==='object'&&e.id&&TYPES.includes(e.type)&&typeof e.title==='string');
  if(!valid.length)throw new Error('No valid entries found');
  const have=existingIds instanceof Set?existingIds:new Set(existingIds||[]);
  const fresh=valid.filter(e=>!have.has(e.id)).map(e=>({...e,tags:normalizeTags(e.tags||[])}));
  return{fresh,duplicates:valid.length-fresh.length};
}
