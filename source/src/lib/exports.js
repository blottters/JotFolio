import { ALL_ENTRY_TYPES } from './types.js';
import { normalizeTags } from './storage.js';
import { entryToFile } from './frontmatter.js';

// Export entries as a pretty-printed JSON download.
export function exportEntriesJSON(entries){
  const u=URL.createObjectURL(new Blob([JSON.stringify(entries,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=u;a.download='marginalia.json';a.click();
  queueMicrotask(()=>URL.revokeObjectURL(u));
}

// Export entries as one frontmatter-compatible Markdown file per entry.
export function exportEntriesMD(entries){
  const used=new Set();
  entries.forEach((entry,index)=>{
    const { path, content }=entryToFile(entry,p=>used.has(p));
    used.add(path);
    const name=path.split('/').pop()||`entry-${index+1}.md`;
    const u=URL.createObjectURL(new Blob([content],{type:'text/markdown'}));
    const a=document.createElement('a');a.href=u;a.download=name;a.click();
    queueMicrotask(()=>URL.revokeObjectURL(u));
  });
}

// Parse + validate a JSON file picked by the user. Returns { fresh, duplicates }
// where `fresh` is a normalized, dedup'd list ready to prepend to existing entries.
export async function importEntriesJSON(file,existingIds){
  const data=JSON.parse(await file.text());
  if(!Array.isArray(data))throw new Error('File must contain an array of entries');
  const valid=data.filter(e=>e&&typeof e==='object'&&e.id&&ALL_ENTRY_TYPES.includes(e.type)&&typeof e.title==='string');
  if(!valid.length)throw new Error('No valid entries found');
  const have=existingIds instanceof Set?new Set(existingIds):new Set(existingIds||[]);
  // Also dedup within the import file itself — two entries in the same file
  // sharing an id were previously both kept, which corrupted downstream state.
  // First occurrence wins; subsequent duplicates counted in `duplicates`.
  const seenInFile=new Set();
  let withinFileDupes=0;
  const fresh=[];
  for(const e of valid){
    if(have.has(e.id)){continue;}
    if(seenInFile.has(e.id)){withinFileDupes++;continue;}
    seenInFile.add(e.id);
    fresh.push({...e,tags:normalizeTags(e.tags||[])});
  }
  return{fresh,duplicates:valid.length-fresh.length-withinFileDupes,withinFileDuplicates:withinFileDupes};
}
