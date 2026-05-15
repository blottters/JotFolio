import { ICON, LABEL } from '../../lib/types.js';
import { matchesQuery } from '../../lib/search/searchVault.js';
import { folderContainsPath } from '../../lib/vaultPaths.js';

export const HOME_SECTION = 'command';

export const WORKSTATION_SECTIONS = new Set(['command','search','projects','tasks','calendar','spaces','tags','settings','ai']);

export function filterShellEntries({entries,section,query,parsedQuery,filterStatus,filterTag,sort}){
  let result=entries;
  if(section==='starred')result=result.filter(entry=>entry.starred);
  else if(section.startsWith('folder:')){
    const folder=section.slice(7);
    result=result.filter(entry=>folderContainsPath(folder,entry._path||''));
  }else if(section.startsWith('space:')){
    const space=section.slice(6).toLowerCase();
    result=result.filter(entry=>String(entry.space||'').trim().toLowerCase()===space);
  }else if(section!=='all'&&!WORKSTATION_SECTIONS.has(section)){
    result=result.filter(entry=>entry.type===section);
  }
  if(query)result=result.filter(entry=>matchesQuery(entry,parsedQuery));
  if(filterStatus)result=result.filter(entry=>entry.status===filterStatus);
  if(filterTag)result=result.filter(entry=>(entry.tags||[]).includes(filterTag));
  return result
    .map(entry=>({entry,ts:Date.parse(entry.date)||0}))
    .sort((a,b)=>sort==='title'
      ? (a.entry.title||'').localeCompare(b.entry.title||'')
      : sort==='starred'
        ? (b.entry.starred?1:0)-(a.entry.starred?1:0)
        : b.ts-a.ts)
    .map(row=>row.entry);
}

export function getShellSectionTitle(section){
  if(section==='all')return 'All Entries';
  if(section==='starred')return '★ Starred';
  if(section.startsWith('folder:'))return `▸ ${section.slice(7)}`;
  if(section.startsWith('space:'))return `Space: ${section.slice(6)}`;
  const label=LABEL[section]||section;
  const icon=ICON[section];
  return icon?`${icon} ${label}`:label;
}
