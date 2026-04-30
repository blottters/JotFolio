import { useState, useEffect, useRef, useCallback } from 'react';
import { loadRules, saveRules } from './rulesStorage.js';
import { loadOptOuts, saveOptOuts, addOptOut, getOptOutsForEntry } from './optOutTracker.js';
import { applyRules } from './applyRules.js';

// useKeywordRules — owns all Keyword Library wiring previously inlined in App.jsx.
// Returns the surface area App.jsx needs to render SettingsPanel + react to entry deletes.
//
// Charter / preserved invariants (DO NOT remove without re-verifying):
//   - keywordReadyRef boot-race guard (Pen-Tester Pete bug #3)
//   - entry?.type === 'raw' raw-inbox skip (Frank's fix; gated by feature flag wiki_mode upstream)
//   - "track only newly-introduced tags" provenance logic (Pen-Tester Pete bug #2)
//   - Idempotent save loop (re-firing applyRules on merged entry yields empty diff = no third save)
//   - handleRescanVault sequential await (avoids Promise.all stampede on big vaults)
//
// Args:
//   vaultAdapter — adapter from adapters/index.js (used for loadRules/saveRules/loadOptOuts/saveOptOuts I/O)
//   vaultInfo, vaultLoading — gating signal for the boot-load effect
//   saveEntry — useVault's underlying saveEntry (un-wrapped). The hook returns the wrapped version.
//   entries — current entry list (used by handleRescanVault).
//   toast, reportError — UI feedback callbacks.
//
// Returns:
//   { keywordRules, handleKeywordRulesChange, saveEntryWithRules, handleRescanVault, clearProvenance }
export function useKeywordRules({ vaultAdapter, vaultInfo, vaultLoading, saveEntry, entries, toast, reportError }) {
  const[keywordRules,setKeywordRules]=useState({rules:[]});
  const[keywordOptOuts,setKeywordOptOuts]=useState({});
  const keywordOptOutsRef=useRef(keywordOptOuts);
  useEffect(()=>{keywordOptOutsRef.current=keywordOptOuts},[keywordOptOuts]);
  const keywordRulesRef=useRef(keywordRules);
  useEffect(()=>{keywordRulesRef.current=keywordRules},[keywordRules]);
  const previouslyAppliedRef=useRef({}); // { [entryId]: { tags: string[], links: string[] } }
  // Gates saveEntryWithRules from running applyRules until rules + opt-outs are
  // loaded from disk. Without this, a save that fires during the async load
  // window sees empty refs and either skips rule-firing entirely OR pollutes
  // previouslyAppliedRef with no-rules-fired state (Pen-Tester Pete bug #3).
  const keywordReadyRef=useRef(false);
  useEffect(()=>{
    if(!vaultInfo||vaultLoading){keywordReadyRef.current=false;return;}
    let cancelled=false;
    (async()=>{
      const r=await loadRules(vaultAdapter);
      if(cancelled)return;
      if(!r.error&&Array.isArray(r.rules))setKeywordRules({rules:r.rules});
      const o=await loadOptOuts(vaultAdapter);
      if(cancelled)return;
      if(o&&!o.error)setKeywordOptOuts(o);
      if(!cancelled)keywordReadyRef.current=true;
    })();
    return()=>{cancelled=true;keywordReadyRef.current=false};
  },[vaultInfo,vaultLoading,vaultAdapter]);

  // Persist rules to vault + reload on error. Passed to KeywordRulesPanel.
  const handleKeywordRulesChange=useCallback(async(nextRules)=>{
    setKeywordRules(nextRules);
    const result=await saveRules(vaultAdapter,nextRules);
    if(result&&result.error){
      toast(`Couldn't save rules: ${result.error}`,'error');
      const fallback=await loadRules(vaultAdapter);
      if(fallback&&!fallback.error)setKeywordRules({rules:fallback.rules||[]});
    }
  },[toast,vaultAdapter]);

  // saveEntryWithRules: wraps useVault's saveEntry to (1) detect user-removal
  // of previously auto-applied tags/links → record opt-outs, (2) run applyRules
  // and merge fresh hits, (3) save again only when the merge added something.
  // Idempotent: re-firing applyRules on the merged entry returns the same set,
  // diff is empty, no third save. Tested manually + via the tag/link arrays
  // being deduped at the source.
  const saveEntryWithRules=useCallback(async(entry)=>{
    const entryId=entry?.id;

    // Bail out cleanly if rules haven't loaded yet — this prevents the boot-race
    // where saving an entry during the async load window would silently skip
    // rule-firing AND clear stale provenance refs (Pen-Tester Pete bug #3).
    // We still do the underlying saveEntry so the user's edit isn't lost.
    if(!keywordReadyRef.current){
      return await saveEntry(entry);
    }

    // raw-inbox entries are gated by feature flag wiki_mode (per plan §1C Wire Wally
    // slop-trap). Even when shown, they're not subject to rule auto-tagging — the user
    // hasn't curated raw imports yet. Skip rules but still persist the underlying save.
    // Type literal verified against lib/types.js KNOWLEDGE_TYPES + lib/featureFlags.js.
    if(entry?.type==='raw'){
      return await saveEntry(entry);
    }

    const ruleList=Array.isArray(keywordRulesRef.current?.rules)?keywordRulesRef.current.rules:[];

    // Step 1 — opt-out detection. Compare what the previous applyRules pass
    // claimed it applied with what this incoming entry actually carries.
    // Anything missing = user removed it.
    if(entryId){
      const prev=previouslyAppliedRef.current[entryId];
      if(prev){
        const currentTags=new Set(Array.isArray(entry.tags)?entry.tags:[]);
        const currentLinks=new Set(Array.isArray(entry.links)?entry.links:[]);
        let nextOptOuts=keywordOptOutsRef.current||{};
        let changed=false;
        for(const tag of prev.tags||[]){
          if(!currentTags.has(tag)){nextOptOuts=addOptOut(nextOptOuts,entryId,tag);changed=true}
        }
        for(const link of prev.links||[]){
          if(!currentLinks.has(link)){nextOptOuts=addOptOut(nextOptOuts,entryId,link);changed=true}
        }
        if(changed){
          keywordOptOutsRef.current=nextOptOuts;
          setKeywordOptOuts(nextOptOuts);
          const result=await saveOptOuts(vaultAdapter,nextOptOuts);
          if(result&&result.error)toast(`Couldn't save opt-outs: ${result.error}`,'error');
        }
      }
    }

    // Step 2 — initial save (always).
    const saved=await saveEntry(entry);

    // Step 3 — run rules. No rules = nothing to merge; clear provenance.
    if(ruleList.length===0){
      if(entryId)delete previouslyAppliedRef.current[entryId];
      return saved;
    }
    const optOutsForEntry=entryId?getOptOutsForEntry(keywordOptOutsRef.current,entryId):[];
    const result=applyRules(saved,ruleList,optOutsForEntry);
    const existingTags=new Set(Array.isArray(saved.tags)?saved.tags:[]);
    const existingLinks=new Set(Array.isArray(saved.links)?saved.links:[]);
    const newTags=result.tags.filter(t=>!existingTags.has(t));
    const newLinks=result.links.filter(l=>!existingLinks.has(l));

    // Track ONLY tags/links that the rules introduced THIS pass. If the user
    // already had a manually-typed tag that happens to overlap with a rule's
    // output, we do NOT record it as auto-applied — otherwise removing their
    // own manual tag later would create a false-positive opt-out (Pen-Tester
    // Pete bug #2). Provenance tracks rule-added items only.
    if(entryId){
      const previouslyApplied=previouslyAppliedRef.current[entryId]||{tags:[],links:[]};
      const prevTags=new Set(previouslyApplied.tags);
      const prevLinks=new Set(previouslyApplied.links);
      // Carry forward prior auto-applied items that are still present on the
      // entry (otherwise we'd lose provenance on a no-op save).
      const carriedTags=Array.from(prevTags).filter(t=>existingTags.has(t));
      const carriedLinks=Array.from(prevLinks).filter(l=>existingLinks.has(l));
      previouslyAppliedRef.current[entryId]={
        tags:[...carriedTags,...newTags],
        links:[...carriedLinks,...newLinks],
      };
    }

    if(newTags.length===0&&newLinks.length===0)return saved;

    // Merge + save again. The second save's _path round-trips through saveEntry.
    const merged={
      ...saved,
      tags:[...(saved.tags||[]),...newTags],
      links:[...(saved.links||[]),...newLinks],
    };
    return await saveEntry(merged);
  },[saveEntry,toast,vaultAdapter]);

  // Re-scan vault: walk every entry, run applyRules with current rules + opt-outs,
  // merge any new tags/links via saveEntryWithRules (preserves provenance tracking).
  // Sequential await keeps the UI responsive vs a Promise.all stampede on big vaults.
  const handleRescanVault=useCallback(async()=>{
    const ruleList=Array.isArray(keywordRulesRef.current?.rules)?keywordRulesRef.current.rules:[];
    if(ruleList.length===0){toast('No rules to apply — add one first','info');return}
    toast(`Re-scanning ${entries.length} entries…`,'info');
    let entriesUpdated=0;
    let tagsAdded=0;
    const rulesFired=new Set();
    for(const entry of entries){
      const optOuts=getOptOutsForEntry(keywordOptOutsRef.current,entry.id);
      const result=applyRules(entry,ruleList,optOuts);
      const existingTags=new Set(Array.isArray(entry.tags)?entry.tags:[]);
      const existingLinks=new Set(Array.isArray(entry.links)?entry.links:[]);
      const newTags=result.tags.filter(t=>!existingTags.has(t));
      const newLinks=result.links.filter(l=>!existingLinks.has(l));
      if(newTags.length===0&&newLinks.length===0)continue;
      result.firedRules.forEach(r=>rulesFired.add(r));
      tagsAdded+=newTags.length;
      entriesUpdated++;
      try{await saveEntryWithRules({...entry,tags:[...(entry.tags||[]),...newTags],links:[...(entry.links||[]),...newLinks]})}
      catch(err){reportError(err,`Re-scan failed on ${entry.title||entry.id}`);return}
    }
    if(entriesUpdated===0)toast('No new tags applied — rules already in sync.','info');
    else toast(`Updated ${entriesUpdated} entries with ${tagsAdded} new tags from ${rulesFired.size} rules`);
  },[entries,saveEntryWithRules,toast,reportError]);

  // Free runtime provenance for a deleted entry. Called by App.jsx on entry delete.
  const clearProvenance=useCallback((entryId)=>{
    if(entryId)delete previouslyAppliedRef.current[entryId];
  },[]);

  return {
    keywordRules,
    handleKeywordRulesChange,
    saveEntryWithRules,
    handleRescanVault,
    clearProvenance,
  };
}
