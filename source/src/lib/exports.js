import { ALL_ENTRY_TYPES } from './types.js';
import { normalizeTags } from './storage.js';
import { entryToFile } from './frontmatter.js';
import { buildBundle, parseBundle } from './exports/bundle.js';

// Trigger a download of a JSON blob with the given filename.
// Reused by both legacy entries-only and Phase 10 bundle exports.
function downloadJson(payload, filename){
  const u=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=u;a.download=filename;a.click();
  queueMicrotask(()=>URL.revokeObjectURL(u));
}

// Export entries as a pretty-printed JSON download. Legacy callers / tests
// may still rely on the bare-array shape, so this is preserved unchanged.
export function exportEntriesJSON(entries){
  downloadJson(entries,'marginalia.json');
}

// Phase 10: export the full vault — entries, bases, and canvases — as a
// single bundle envelope file. Importer (importVaultBundle) round-trips
// the same shape back into a vault.
export function exportVaultBundle({ entries, bases, canvases }={}){
  const bundle=buildBundle({entries,bases,canvases});
  const stamp=bundle.exportedAt.replace(/[:.]/g,'-');
  downloadJson(bundle,`jotfolio-vault-${stamp}.json`);
  return bundle;
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

// Validate + dedup a parsed entries array. Returns the same legacy shape
// the importer used to return: { fresh, duplicates, withinFileDuplicates }.
function processEntries(rawEntries,existingIds){
  const valid=rawEntries.filter(e=>e&&typeof e==='object'&&e.id&&ALL_ENTRY_TYPES.includes(e.type)&&typeof e.title==='string');
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
  return{fresh,duplicates:valid.length-fresh.length-withinFileDupes,withinFileDuplicates:withinFileDupes,validCount:valid.length};
}

// Phase 10: read a bundle file (legacy array OR envelope), validate, and
// return entries + bases + canvases in dispatch-ready form.
//
// Returns: { entries:{fresh,duplicates,withinFileDuplicates}, bases:[], canvases:[] }
//
// Throws when the JSON is malformed at the top level or when the entries
// portion is non-empty but yields zero valid entries (parity with legacy).
export async function importVaultBundle(file,existingIds){
  const data=JSON.parse(await file.text());
  const{entries:rawEntries,bases,canvases}=parseBundle(data);
  // Reject input that yielded nothing useful at all (preserves error UX).
  if(!Array.isArray(rawEntries)){
    throw new Error('Bundle entries must be an array');
  }
  const processed=processEntries(rawEntries,existingIds);
  const hasAnyArtifact=processed.validCount>0||bases.length>0||canvases.length>0;
  if(!hasAnyArtifact){
    throw new Error('No valid entries, bases, or canvases found');
  }
  return{
    entries:{
      fresh:processed.fresh,
      duplicates:processed.duplicates,
      withinFileDuplicates:processed.withinFileDuplicates,
    },
    bases,
    canvases,
  };
}

// Parse + validate a JSON file picked by the user. Returns { fresh, duplicates }
// where `fresh` is a normalized, dedup'd list ready to prepend to existing entries.
//
// Now a thin wrapper over importVaultBundle so existing callers (and
// JotFolio's bare-array exports from earlier versions) keep working.
export async function importEntriesJSON(file,existingIds){
  const data=JSON.parse(await file.text());
  // Legacy strictness: a non-array, non-bundle top-level is a hard error
  // (matches old behavior — tests assert this exact message).
  if(!Array.isArray(data)&&!(data&&typeof data==='object'&&data.kind==='jotfolio-bundle')){
    throw new Error('File must contain an array of entries');
  }
  const{entries:rawEntries}=parseBundle(data);
  const processed=processEntries(rawEntries,existingIds);
  if(!processed.validCount){throw new Error('No valid entries found')}
  return{fresh:processed.fresh,duplicates:processed.duplicates,withinFileDuplicates:processed.withinFileDuplicates};
}
