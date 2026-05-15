import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ALL_ENTRY_TYPES, LABEL, applyTypeSat } from '../../lib/types.js';
import { ConstellationStateOverlay } from './ConstellationStateOverlay.jsx';
import { Select } from '../dropdowns/Select.jsx';
import { computeAffinityLayout, computeClusterLayout, computeMessyLayout } from './layout.js';
import {
  getEdgeVisualState,
  getNodeVisualState,
  nodeRoleLabel,
  summarizeGraph,
} from './constellationVisuals.js';

// ── Constellation (Graph view) ────────────────────────────────────────────
// Stable graph layout — nodes are placed by deterministic layout helpers, no
// physics sim (keeps bundle tiny, no hover jitter). Node size encodes
// link-count. Node color encodes type. Starred entries get a quiet ring.
//
// Visual variants (via `style` prop): 'star' (default compact map nodes),
// 'board' (index-card with title + meta), 'editorial' (sparse dots + tier-
// sized labels by link count). Type color theme is controlled via
// `saturation`, with `signal` as the clearer graph-first default.
// Background variant via `bg` prop.
const KNOWLEDGE_FLAG_MAP={raw:'raw_inbox',wiki:'wiki_mode',review:'review_queue'};
const LARGE_GRAPH_ANIMATION_LIMIT=120;

export function ConstellationView({entries,onOpen,onBack,onAdd,layoutMode:layoutModeProp,onLayoutModeChange,onCreateFromMissing,focusEntryId,flags={},style='star',saturation='signal',bg='atlas'}){
  const visibleEntryTypes=ALL_ENTRY_TYPES.filter(t=>!KNOWLEDGE_FLAG_MAP[t]||flags[KNOWLEDGE_FLAG_MAP[t]]===true);
  const prefersReducedMotion=usePrefersReducedMotion();
  const[filter,setFilter]=useState('all');
  const[tagFilter,setTagFilter]=useState('');
  const[titleQuery,setTitleQuery]=useState('');
  const[showUnresolved,setShowUnresolved]=useState(true);
  const[memoryOnly,setMemoryOnly]=useState(false);
  const hasFilters=filter!=='all'||!!tagFilter||!!titleQuery.trim()||!showUnresolved||memoryOnly;
  const resetFilters=useCallback(()=>{
    setFilter('all');setTagFilter('');setTitleQuery('');setShowUnresolved(true);setMemoryOnly(false);
  },[]);
  const[infoOpen,setInfoOpen]=useState(null); // null | 'ghosts' | 'messy' | 'clusters' | 'affinity'
  const[hover,setHover]=useState(null);
  const[keyboardFocus,setKeyboardFocus]=useState(null);
  // Stack of focal ids. Top = current view. Empty = full web.
  // Click node deeper → push. Back / Esc / click same → pop.
  const[focalStack,setFocalStack]=useState([]);
  const focal=focalStack[focalStack.length-1]||null;
  // View = {s: scale, tx, ty}. Wheel zoom is cursor-anchored.
  const[view,setView]=useState({s:1,tx:0,ty:0});
  // Bob offsets live in a ref, not state. RAF loop writes directly to DOM
  // refs at 60Hz — going through setState would re-render the entire graph
  // (every node + every edge) every frame. See nodeBobRef / edgeElsRef below.
  const bobRef=useRef({}); // {[id]: {dx, dy}} — read-shared between RAF + drag math
  const[componentOffsets,setComponentOffsets]=useState({}); // per-cluster drag offset
  const[nodeOffsets,setNodeOffsets]=useState({}); // per-node detached offset (Alt+drag)
  // Layout mode is controlled by App via prefs.defaultLayoutMode so the
  // user's choice persists across sessions. Local fallback to 'messy' if
  // the parent forgets to wire the prop.
  const layoutMode=layoutModeProp||'messy';
  const setLayoutMode=useCallback(updater=>{
    if(!onLayoutModeChange)return;
    onLayoutModeChange(typeof updater==='function'?updater(layoutMode):updater);
  },[layoutMode,onLayoutModeChange]);
  const[legendOpen,setLegendOpen]=useState(true);
  const svgRef=useRef(null);
  const phasesRef=useRef({});
  const nodeBobRef=useRef(new Map()); // id → inner <g> element (bob target)
  const edgeElsRef=useRef(new Map()); // `${aId}|${bId}` → {a, b, el}
  const positionsRef=useRef({}); // mirror of positions for RAF edge math
  const appliedFocusRef=useRef(null);

  // All tags present in the visible entries — drives the tag-filter dropdown.
  const allTags=useMemo(()=>{
    const set=new Set();
    entries.forEach(e=>(e.tags||[]).forEach(t=>set.add(t)));
    return [...set].sort();
  },[entries]);

  // Connected components via BFS over links. Each becomes its own "solar system".
  // Pool applies type / tag / title filters before any layout work happens.
  const pool=useMemo(()=>{
    const q=titleQuery.trim().toLowerCase();
    return entries.filter(e=>{
      if(filter!=='all'&&e.type!==filter)return false;
      if(tagFilter&&!(e.tags||[]).includes(tagFilter))return false;
      if(q&&!String(e.title||'').toLowerCase().includes(q))return false;
      return true;
    });
  },[entries,filter,tagFilter,titleQuery]);
  const poolById=useMemo(()=>{const m={};pool.forEach(e=>m[e.id]=e);return m},[pool]);
  useEffect(()=>{
    const id=String(focusEntryId||'');
    if(!id){
      appliedFocusRef.current=null;
      return;
    }
    if(appliedFocusRef.current===id)return;
    if(!poolById[id])return;
    appliedFocusRef.current=id;
    setFocalStack([id]);
    setKeyboardFocus(id);
  },[focusEntryId,poolById]);
  const components=useMemo(()=>{
    // Build undirected adjacency first. A wiki-link on A targeting B is
    // visually bidirectional (they belong to the same cluster) even though
    // the stored `links` array only records the direction that authored the
    // link. Directed BFS would artificially split those clusters.
    const adj=Object.create(null);
    for(const n of pool){if(!adj[n.id])adj[n.id]=new Set();(n.links||[]).forEach(t=>{
      if(!poolById[t])return;
      adj[n.id].add(t);
      if(!adj[t])adj[t]=new Set();
      adj[t].add(n.id);
    });}
    const visited=new Set();const comps=[];
    for(const seed of pool){
      if(visited.has(seed.id))continue;
      const group=[];const stack=[seed.id];
      while(stack.length){
        const id=stack.pop();
        if(visited.has(id))continue;
        visited.add(id);
        const n=poolById[id];if(!n)continue;
        group.push(n);
        (adj[id]||[]).forEach(l=>{if(poolById[l]&&!visited.has(l))stack.push(l)});
      }
      comps.push(group);
    }
    // Sort components by size desc so biggest gets best real estate
    return comps.sort((a,b)=>b.length-a.length);
  },[pool,poolById]);

  // Affinity-weighted force-directed positions. Runs a short sim whenever the
  // pool changes and caches the result.
  const affinityLayout=useMemo(()=>computeAffinityLayout(pool),[pool]);

  // Three layouts: 'messy' | 'clusters' | 'affinity'. CSS transition on each
  // node's outer <g> smoothly animates position changes when mode toggles.
  // No auto-fallback — user-selected mode always renders. Sparse-link vaults
  // produce a sparse grid in Clusters; that's the honest visualization.
  const nodes=useMemo(()=>{
    if(layoutMode==='affinity'){
      const compOf={};components.forEach((g,ci)=>g.forEach(n=>{compOf[n.id]=ci}));
      return pool.map(e=>{
        const p=affinityLayout[e.id]||{x:400,y:300};
        return{...e,x:p.x,y:p.y,comp:compOf[e.id]??0,depth:0};
      });
    }
    if(layoutMode==='messy')return computeMessyLayout(pool,components);
    return computeClusterLayout(components);
  },[components,pool,layoutMode,affinityLayout]);
  // Unresolved pseudo-nodes for [[wikilinks]] that don't match any real
  // entry. Rendered with dashed stroke + muted fill in the SVG below.
  // Click handler routes to onCreateFromMissing so the user can
  // materialize the target with one tap. Positions are placed on a ring
  // outside the main spiral so they read as "not in the graph yet".
  const unresolvedPseudoNodes=useMemo(()=>{
    if(!showUnresolved)return [];
    const realTitles=new Set(pool.map(e=>String(e.title||'').toLowerCase()));
    const targets=new Map(); // key → {target, sources:Set<id>}
    pool.forEach(e=>{
      (e.unresolvedTargets||[]).forEach(u=>{
        const key=String(u.target||'').toLowerCase();
        if(!key||realTitles.has(key))return;
        const existing=targets.get(key)||{target:u.target,sources:new Set()};
        existing.sources.add(e.id);
        targets.set(key,existing);
      });
    });
    if(!targets.size)return [];
    // Place on outer ring around (400, 300). Hash the key so positions are
    // stable across renders even if the order changes.
    const arr=[...targets.values()];
    const R=380;
    const goldenAngle=Math.PI*(3-Math.sqrt(5));
    return arr.map((info,i)=>{
      const angle=i*goldenAngle;
      const r=R+(i%3)*22;
      return {
        id:`unresolved:${info.target.toLowerCase()}`,
        title:info.target,
        type:'note',
        tags:[],
        links:[...info.sources],
        x:400+Math.cos(angle)*r,
        y:300+Math.sin(angle)*r,
        comp:-1,
        depth:0,
        _unresolved:true,
        _sourceIds:[...info.sources],
      };
    });
  },[pool,showUnresolved]);

  const renderNodes=useMemo(()=>{
    const combined=[...nodes,...unresolvedPseudoNodes];
    if(!memoryOnly)return combined;
    return combined.filter(n=>n.type==='wiki'||n.type==='review');
  },[nodes,unresolvedPseudoNodes,memoryOnly]);
  const motionAllowed=!prefersReducedMotion&&renderNodes.length<=LARGE_GRAPH_ANIMATION_LIMIT;
  const nodeById=useMemo(()=>{const m={};renderNodes.forEach(n=>m[n.id]=n);return m},[renderNodes]);
  const nodeToComp=useMemo(()=>{const m={};renderNodes.forEach(n=>{m[n.id]=n.comp});return m},[renderNodes]);

  // Edges include real-entry-to-real-entry links and real-to-pseudo edges
  // for unresolved targets. Pseudo edges are dashed at render time.
  const edges=useMemo(()=>{
    const seen=new Set();const out=[];
    nodes.forEach(a=>(a.links||[]).forEach(bid=>{const k=[a.id,bid].sort().join('|');if(seen.has(k))return;const b=nodeById[bid];if(!b)return;seen.add(k);out.push({a,b,unresolved:false})}));
    unresolvedPseudoNodes.forEach(p=>{
      (p._sourceIds||[]).forEach(sid=>{
        const a=nodeById[sid];
        if(!a)return;
        const k=`${sid}|${p.id}`;
        if(seen.has(k))return;
        seen.add(k);
        out.push({a,b:p,unresolved:true});
      });
    });
    return out;
  },[nodes,unresolvedPseudoNodes,nodeById]);

  // Top-5 most-connected nodes always labeled; others only when relevant
  const topIds=useMemo(()=>new Set(nodes.slice(0,5).map(n=>n.id)),[nodes]);

  // Focal mode: focal node + its 1-hop neighbors stay bright, rest dim
  const focalSet=useMemo(()=>{
    if(!focal)return null;
    const f=nodeById[focal];if(!f)return null;
    return new Set([focal,...(f.links||[])]);
  },[focal,nodeById]);

  // Hover neighbors highlight
  const hoverSet=useMemo(()=>{
    if(!hover)return null;
    const h=nodeById[hover];if(!h)return null;
    return new Set([hover,...(h.links||[])]);
  },[hover,nodeById]);

  // Cursor-anchored wheel zoom — works at any layer, including focal modes.
  // Point under cursor stays under cursor: P = (c - t) / s, then t' = c - P * s'.
  useEffect(()=>{
    const el=svgRef.current;if(!el)return;
    const onWheel=(e)=>{
      e.preventDefault();
      const pt=el.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
      const ctm=el.getScreenCTM();if(!ctm)return;
      const svgPt=pt.matrixTransform(ctm.inverse());
      const factor=e.deltaY<0?1.12:0.89;
      setView(v=>{
        const newS=Math.min(4,Math.max(0.25,v.s*factor));
        const pc={x:(svgPt.x-v.tx)/v.s,y:(svgPt.y-v.ty)/v.s};
        return{s:newS,tx:svgPt.x-pc.x*newS,ty:svgPt.y-pc.y*newS};
      });
    };
    el.addEventListener('wheel',onWheel,{passive:false});
    return()=>el.removeEventListener('wheel',onWheel);
  },[]);

  // Pan/drag state:
  //  - panRef: dragging the whole canvas (started on empty svg)
  //  - compDragRef: dragging a cluster (started on a node)
  const panRef=useRef(null);
  const compDragRef=useRef(null);
  const[isDragging,setIsDragging]=useState(false);
  const CLICK_THRESHOLD=4; // px to distinguish click vs drag

  const onPointerDown=(e)=>{
    if(e.target.tagName!=='svg'||e.button!==0)return;
    e.preventDefault();
    const ctm=svgRef.current.getScreenCTM();if(!ctm)return;
    panRef.current={startClientX:e.clientX,startClientY:e.clientY,startTx:view.tx,startTy:view.ty,scaleX:ctm.a,scaleY:ctm.d};
    svgRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };
  const onPointerMove=(e)=>{
    if(panRef.current){
      const d=panRef.current;
      setView(v=>({...v,tx:d.startTx+(e.clientX-d.startClientX)/d.scaleX,ty:d.startTy+(e.clientY-d.startClientY)/d.scaleY}));
    }
  };
  const onPointerUp=(e)=>{
    if(panRef.current){
      panRef.current=null;
      svgRef.current?.releasePointerCapture?.(e.pointerId);
      setIsDragging(false);
    }
  };

  // Per-node pointer.
  //  Plain drag (no modifier)    → move the whole cluster (connected component)
  //  Alt + drag                   → detach this single node and move it freely
  //  Alt + click (no movement)    → snap this node back to its layout spot
  //  Plain click (no movement)    → focus-stack dig
  const onNodePointerDown=(e,nodeId)=>{
    if(e.button!==0)return;
    e.stopPropagation();
    const ctm=svgRef.current.getScreenCTM();if(!ctm)return;
    const alt=e.altKey;
    const shift=e.shiftKey;
    const ci=nodeToComp[nodeId];
    const origComp=componentOffsets[ci]||{dx:0,dy:0};
    const origNode=nodeOffsets[nodeId]||{dx:0,dy:0};
    compDragRef.current={
      nodeId,compIdx:ci,alt,shift,
      startClientX:e.clientX,startClientY:e.clientY,
      origCompDx:origComp.dx,origCompDy:origComp.dy,
      origNodeDx:origNode.dx,origNodeDy:origNode.dy,
      scaleX:ctm.a,scaleY:ctm.d,
      moved:false,
      pointerId:e.pointerId,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onNodePointerMove=(e)=>{
    const d=compDragRef.current;if(!d)return;
    const sx=(e.clientX-d.startClientX)/d.scaleX/Math.max(0.001,view.s);
    const sy=(e.clientY-d.startClientY)/d.scaleY/Math.max(0.001,view.s);
    if(!d.moved&&Math.abs(sx)+Math.abs(sy)>CLICK_THRESHOLD)d.moved=true;
    if(!d.moved)return;
    // Swapped (per user pref): plain drag detaches and moves the single
    // node freely; alt+drag moves the whole cluster together.
    if(d.alt){
      setComponentOffsets(prev=>({...prev,[d.compIdx]:{dx:d.origCompDx+sx,dy:d.origCompDy+sy}}));
    }else{
      setNodeOffsets(prev=>({...prev,[d.nodeId]:{dx:d.origNodeDx+sx,dy:d.origNodeDy+sy}}));
    }
  };
  const onNodePointerUp=(e,nodeId)=>{
    const d=compDragRef.current;if(!d||d.nodeId!==nodeId)return;
    e.currentTarget.releasePointerCapture?.(d.pointerId);
    const wasDrag=d.moved,wasAlt=d.alt,wasShift=d.shift;
    compDragRef.current=null;
    // Final node bindings:
    //   Plain click (no drag) → focal-drill into local graph (dive in)
    //   Alt+click   (no drag) → open note in DetailPanel
    //   Shift+click (no drag) → focal-drill (alias for plain click)
    //   Plain drag            → detached single-node drag (handled in
    //                            pointermove)
    //   Alt+drag              → cluster / component drag (handled in
    //                            pointermove)
    if(wasDrag)return;
    if(wasAlt){
      onOpen(nodeId);
      return;
    }
    onFocalDrill(nodeId);
  };

  // Drill into a node's local graph. Click the same focal node again
  // pops one layer.
  const onFocalDrill=(id)=>{
    if(focal===id){setFocalStack(st=>st.slice(0,-1));return}
    setFocalStack(st=>[...st,id]);
  };
  const popFocal=()=>setFocalStack(st=>st.slice(0,-1));
  const resetAll=()=>{setFocalStack([]);setView({s:1,tx:0,ty:0});setComponentOffsets({});setNodeOffsets({})};

  // Init per-node bob phases whenever node set changes
  useEffect(()=>{
    const phases={};
    renderNodes.forEach(n=>{
      phases[n.id]={
        phase:Math.random()*Math.PI*2,
        speed:0.00035+Math.random()*0.0005,
        ampX:1.8+Math.random()*2.2,
        ampY:1.4+Math.random()*1.8,
        ratio:0.7+Math.random()*0.8,
      };
    });
    phasesRef.current=phases;
  },[renderNodes]);

  // Anti-gravity bob: RAF loop mutates SVG attributes directly via refs at
  // 60Hz. Going through setState here would re-render every node + every
  // edge every frame — the whole point of this rewrite was to stop doing
  // that. setOffsets is gone; bobRef.current is the single source of truth
  // for bob deltas, mirrored into the DOM each frame.
  useEffect(()=>{
    if(!motionAllowed){
      bobRef.current={};
      nodeBobRef.current.forEach(node=>node.setAttribute('transform','translate(0 0)'));
      return;
    }
    let raf=0,iv=0,lastRaf=performance.now();
    const start=performance.now();
    const compute=(t)=>{
      const el=t-start;
      const bob=bobRef.current;
      // 1. Compute new bob offsets and mutate node <g> transforms.
      for(const id in phasesRef.current){
        const p=phasesRef.current[id];
        const a=p.phase+el*p.speed;
        const dx=Math.cos(a)*p.ampX;
        const dy=Math.sin(a*p.ratio)*p.ampY;
        bob[id]={dx,dy};
        const node=nodeBobRef.current.get(id);
        if(node)node.setAttribute('transform',`translate(${dx} ${dy})`);
      }
      // 2. Update each edge's endpoints with positions+bob in the same frame.
      const pos=positionsRef.current;
      edgeElsRef.current.forEach(({a,b,el:line})=>{
        if(!line)return;
        const pa=pos[a]||{x:0,y:0};
        const pb=pos[b]||{x:0,y:0};
        const oa=bob[a]||{dx:0,dy:0};
        const ob=bob[b]||{dx:0,dy:0};
        line.setAttribute('x1',pa.x+oa.dx);
        line.setAttribute('y1',pa.y+oa.dy);
        line.setAttribute('x2',pb.x+ob.dx);
        line.setAttribute('y2',pb.y+ob.dy);
      });
    };
    const tick=(t)=>{
      lastRaf=t;
      if(!document.hidden)compute(t);
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    // Watchdog: if RAF hasn't fired in 500ms, switch to setInterval
    iv=setInterval(()=>{
      const now=performance.now();
      if(!document.hidden&&now-lastRaf>500)compute(now);
    },33);
    return()=>{cancelAnimationFrame(raf);clearInterval(iv)};
  },[motionAllowed]);

  // Escape pops one layer. "C" toggles between messy web and cluster view.
  useEffect(()=>{
    const h=e=>{
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
      if(e.key==='Escape'&&focalStack.length)setFocalStack(st=>st.slice(0,-1));
      else if(e.key==='c'||e.key==='C')setLayoutMode(m=>m==='messy'?'clusters':'messy');
      else if(e.key==='a'||e.key==='A')setLayoutMode(m=>m==='affinity'?'messy':'affinity');
    };
    document.addEventListener('keydown',h);
    return()=>document.removeEventListener('keydown',h);
  },[focalStack.length,setLayoutMode]);

  // Effective per-node position. Base = cluster-grid layout. In focal mode,
  // focal snaps to canvas center and its neighbors orbit. Component-drag
  // offsets apply on top of base layout (so dragging a cluster moves all its
  // nodes together).
  const positions=useMemo(()=>{
    const out={};
    if(focalSet&&focal){
      const nbrs=[...focalSet].filter(id=>id!==focal);
      out[focal]={x:400,y:300};
      const R=150;
      nbrs.forEach((id,i)=>{
        const a=(i/Math.max(1,nbrs.length))*Math.PI*2-Math.PI/2;
        out[id]={x:400+Math.cos(a)*R,y:300+Math.sin(a)*R};
      });
      renderNodes.forEach(n=>{
        if(out[n.id])return;
        const co=componentOffsets[n.comp]||{dx:0,dy:0};
        const no=nodeOffsets[n.id]||{dx:0,dy:0};
        out[n.id]={x:n.x+co.dx+no.dx,y:n.y+co.dy+no.dy};
      });
    }else{
      renderNodes.forEach(n=>{
        const co=componentOffsets[n.comp]||{dx:0,dy:0};
        const no=nodeOffsets[n.id]||{dx:0,dy:0};
        out[n.id]={x:n.x+co.dx+no.dx,y:n.y+co.dy+no.dy};
      });
    }
    return out;
  },[focal,focalSet,renderNodes,componentOffsets,nodeOffsets]);

  // Mirror positions into a ref so the RAF loop can read them without
  // depending on render. positions changes on layout / focal / drag —
  // not at 60Hz — so this re-syncs only when those low-frequency inputs
  // shift, while the RAF loop still mutates each frame.
  useEffect(()=>{positionsRef.current=positions},[positions]);

  // Whenever the focal stack changes, snap the view to the target cluster
  // (zoom in, centered). Afterward the user can still wheel-zoom or drag-pan.
  useEffect(()=>{
    if(focalStack.length===0){
      setView({s:1,tx:0,ty:0});
      return;
    }
    const depth=focalStack.length;
    const s=Math.min(2.8,1.55+depth*0.35);
    setView({s,tx:400-400*s,ty:300-300*s});
  },[focalStack.length]);

  const transform=`translate(${view.tx} ${view.ty}) scale(${view.s})`;
  const displayedZoom=Math.round(view.s*100);
  const layerTransition=prefersReducedMotion||isDragging||panRef.current||compDragRef.current
    ?'none'
    :'transform 0.5s var(--jf-ease-in-out)';
  const nodeTransition=prefersReducedMotion
    ?'none'
    :'transform 0.72s var(--jf-ease-in-out)';
  const edgeTransition=prefersReducedMotion||!focal
    ?'none'
    :'x1 0.5s var(--jf-ease-in-out), y1 0.5s var(--jf-ease-in-out), x2 0.5s var(--jf-ease-in-out), y2 0.5s var(--jf-ease-in-out)';

  const edgeOpacity=(a,b)=>{
    if(hoverSet){return(hoverSet.has(a.id)&&hoverSet.has(b.id))?0.9:0.05}
    if(focalSet){return(focalSet.has(a.id)&&focalSet.has(b.id))?0.85:0.02}
    return 0.12;
  };
  const nodeOpacity=(n)=>{
    // Non-focused nodes still need to read as nodes — raised the floors
    // so the canvas never looks "washed out" in focal/hover mode.
    // Was 0.4 / 0.18 — now 0.7 / 0.55. Stars stay solid; focus is
    // signaled via stroke + label, not opacity.
    if(hoverSet&&!hoverSet.has(n.id))return 0.7;
    if(focalSet&&!focalSet.has(n.id))return 0.55;
    return 1;
  };
  const labelVisible=(n)=>{
    if(focalSet)return focalSet.has(n.id);
    if(hoverSet)return hoverSet.has(n.id);
    return n.starred||topIds.has(n.id);
  };

  const focalNode=focal?nodeById[focal]:null;
  const graphSummary=useMemo(()=>summarizeGraph({nodes:renderNodes,edges}),[renderNodes,edges]);

  const describeGraphNode=useCallback((n)=>{
    const degree=(n.links||[]).length;
    if(n._unresolved)return `Ghost note ${n.title}, referenced by ${(n._sourceIds||[]).length} note${(n._sourceIds||[]).length===1?'':'s'}`;
    return `${n.title||'Untitled'}, ${LABEL[n.type]||n.type}, ${degree} link${degree===1?'':'s'}`;
  },[]);

  const activateGraphNode=useCallback((n)=>{
    if(n._unresolved){
      if(onCreateFromMissing)onCreateFromMissing(n.title);
      return;
    }
    onFocalDrill(n.id);
  },[onCreateFromMissing,onFocalDrill]);

  const openGraphNode=useCallback((n)=>{
    if(n._unresolved){
      if(onCreateFromMissing)onCreateFromMissing(n.title);
      return;
    }
    onOpen(n.id);
  },[onCreateFromMissing,onOpen]);

  const onGraphNodeKeyDown=useCallback((e,n)=>{
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      activateGraphNode(n);
      return;
    }
    if(e.key==='o'||e.key==='O'){
      e.preventDefault();
      openGraphNode(n);
    }
  },[activateGraphNode,openGraphNode]);

  // Lock graph until 3 entries — all hooks above run so Rules-of-Hooks holds
  if(entries.length<3){
    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)',position:'relative'}}>
        <div style={{padding:'10px 20px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',gap:10,flexShrink:0,background:'var(--b2)'}}>
          <button onClick={onBack} style={{padding:'6px 10px',fontSize:12,background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>← Back</button>
          <span style={{fontWeight:700,fontSize:17,letterSpacing:0}}>Constellation</span>
        </div>
        <div style={{flex:1,position:'relative'}}>
          <ConstellationStateOverlay state="locked" count={entries.length} onAdd={()=>{onBack();onAdd&&onAdd()}}/>
        </div>
      </div>
    );
  }

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>
      <div style={{padding:'14px 20px 12px',borderBottom:'1px solid var(--br)',display:'flex',flexDirection:'column',gap:12,flexShrink:0,background:'linear-gradient(180deg, rgba(15,23,32,.98), rgba(8,13,19,.96))'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
          <button onClick={onBack} style={{padding:'7px 11px',fontSize:12,background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>← Back</button>
          <div style={{minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span style={{fontWeight:850,fontSize:18,letterSpacing:0,color:'var(--tx)'}}>Constellation</span>
              <span style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:1.1}}>Vault relationship map</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6,flexWrap:'wrap'}}>
              <MetricChip label="Entries" value={graphSummary.nodes}/>
              <MetricChip label="Links" value={graphSummary.edges}/>
              <MetricChip label="Memory" value={graphSummary.memory}/>
              <MetricChip label="Missing" value={graphSummary.missing}/>
              <MetricChip label="Hubs" value={graphSummary.hubs}/>
              <span style={{fontSize:11,color:'var(--t3)',fontFamily:'monospace'}}>{displayedZoom}% zoom</span>
            </div>
          </div>
          {focalStack.length>0&&(
            <div style={{display:'flex',alignItems:'center',gap:7,marginLeft:'auto',padding:'6px 10px',background:'rgba(59,130,246,.08)',border:'1px solid color-mix(in srgb, var(--ac) 55%, var(--br))',borderRadius:'var(--rd)',maxWidth:520,overflow:'hidden'}}>
              <button onClick={popFocal} aria-label="Back one layer" title="Back one layer (Esc)" style={{padding:'2px 7px',fontSize:13,background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--ac)',cursor:'pointer',fontWeight:800}}>←</button>
              <span style={{fontSize:11,color:'var(--t3)',fontFamily:'monospace',letterSpacing:1}}>L{focalStack.length}</span>
              <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,overflow:'hidden',minWidth:0}}>
                {focalStack.flatMap((id,i)=>{
                  const n=nodeById[id];if(!n)return[];
                  const last=i===focalStack.length-1;
                  const items=[];
                  if(i>0)items.push(<span key={'sep'+i} style={{color:'var(--t3)'}}>›</span>);
                  items.push(<button key={'bc'+i+id} aria-current={last?'page':undefined} onClick={()=>setFocalStack(st=>st.slice(0,i+1))}
                    style={{padding:0,background:'transparent',border:'none',color:last?'var(--tx)':'var(--t2)',fontWeight:last?800:500,cursor:'pointer',fontFamily:'var(--fn)',fontSize:12,maxWidth:last?210:96,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {n.title||'Untitled'}
                  </button>);
                  return items;
                })}
              </div>
              {focalNode&&<button onClick={()=>onOpen(focalNode.id)} style={{padding:'3px 9px',fontSize:11,background:'var(--ac)',color:'var(--act)',border:'none',borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:800,flexShrink:0}}>Open</button>}
            </div>
          )}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',rowGap:8,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
            <div style={{display:'flex',gap:0,border:'1px solid var(--br)',borderRadius:'var(--rd)',overflow:'hidden',background:'rgba(255,255,255,.025)'}}>
              {[['messy','Spread','C'],['clusters','Groups','C'],['affinity','Similarity','A']].map(([k,label,hint])=>{
                const isActive=layoutMode===k;
                return(
                  <button key={k} onClick={()=>setLayoutMode(k)}
                    title={`Layout: ${label} (${hint})`}
                    style={{padding:'6px 11px',fontSize:11,background:isActive?'var(--ac)':'transparent',color:isActive?'var(--act)':'var(--t2)',border:'none',borderRight:'1px solid var(--br)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:800}}>
                    {label}
                  </button>
                );
              })}
            </div>
            <InfoButton open={infoOpen==='layout'} onToggle={()=>setInfoOpen(o=>o==='layout'?null:'layout')}
              title="Layout modes"/>
          </div>
          <button onClick={()=>setShowUnresolved(s=>!s)}
            title={showUnresolved?'Hide missing linked notes':'Show missing linked notes'}
            style={controlButton(showUnresolved)}>
            Missing links
          </button>
          <InfoButton open={infoOpen==='ghosts'} onToggle={()=>setInfoOpen(o=>o==='ghosts'?null:'ghosts')}
            title="Missing linked notes"/>
          <button onClick={resetAll} style={controlButton(false)}>Reset map</button>
          <input value={titleQuery} onChange={e=>setTitleQuery(e.target.value)}
            placeholder="Search titles…" aria-label="Search node titles"
            style={{padding:'7px 10px',fontSize:12,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'rgba(255,255,255,.035)',color:'var(--tx)',fontFamily:'var(--fn)',width:150,minWidth:100}}/>
          <div style={{width:150,flexShrink:0}}>
            <Select ariaLabel="Filter by tag" value={tagFilter} onChange={v=>setTagFilter(v)}
              options={[{value:'',label:'All tags'},...allTags.map(t=>({value:t,label:`#${t}`}))]}/>
          </div>
          <div style={{width:150,flexShrink:0}}>
            <Select ariaLabel="Filter graph by type" value={filter} onChange={setFilter}
              options={[{value:'all',label:'All types'},...visibleEntryTypes.map(t=>({value:t,label:LABEL[t]}))]}/>
          </div>
          <button type="button"
            onClick={()=>setMemoryOnly(prev=>!prev)}
            aria-pressed={memoryOnly}
            aria-label="Show only memory entries"
            title={memoryOnly?'Show all entries':'Show only memory entries'}
            style={controlButton(memoryOnly)}>
            Memory only
          </button>
        </div>
        {infoOpen==='layout'&&(
          <InfoPanel title="Layout modes">
            <div style={{marginBottom:4}}><strong>Spread</strong>: entries are scattered evenly so the vault is easy to scan.</div>
            <div style={{marginBottom:4}}><strong>Groups</strong>: linked entries collect into visible clusters.</div>
            <div><strong>Similarity</strong>: shared tags, type, and dates pull entries together.</div>
          </InfoPanel>
        )}
        {infoOpen==='ghosts'&&(
          <InfoPanel title="Missing linked notes">
            Dashed nodes are names you mentioned with [[wiki-link]] syntax but have not created yet. Click one to create the note.
          </InfoPanel>
        )}
      </div>
      {renderNodes.length>0&&(
        <details style={{borderBottom:'1px solid var(--br)',background:'var(--b2)',padding:'6px 20px'}}>
          <summary style={{cursor:'pointer',fontSize:12,fontWeight:700,color:'var(--t2)'}}>
            Keyboard list for Constellation ({renderNodes.length} entries, {edges.length} links)
          </summary>
          <ol aria-label="Constellation graph nodes" style={{margin:'8px 0 0',paddingLeft:20,display:'grid',gap:6,maxHeight:180,overflowY:'auto'}}>
            {renderNodes.map(n=>(
              <li key={n.id} style={{fontSize:12,color:'var(--t2)'}}>
                <span>{describeGraphNode(n)}</span>
                {focalSet?.has(n.id)&&<span style={{marginLeft:6,color:'var(--ac)',fontWeight:700}}>in focus</span>}
                <span style={{display:'inline-flex',gap:4,marginLeft:8,flexWrap:'wrap'}}>
                  <button type="button" onClick={()=>activateGraphNode(n)}
                    style={{padding:'3px 8px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>
                    {n._unresolved?'Create':'Focus'}
                  </button>
                  {!n._unresolved&&(
                    <button type="button" onClick={()=>openGraphNode(n)}
                      style={{padding:'3px 8px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>
                      Open
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>
        <ConstellationBackground kind={bg}/>
        {renderNodes.length===0?(
          <ConstellationStateOverlay
            state={hasFilters?'no-matches':'empty'}
            count={entries.length}
            onAdd={onAdd}
            onReset={resetFilters}/>
        ):(
          <svg ref={svgRef} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet"
            aria-label="Constellation relationship graph"
            style={{width:'100%',height:'100%',display:'block',cursor:isDragging?'grabbing':'grab',userSelect:'none',touchAction:'none'}}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
            <title>Constellation relationship graph</title>
            <desc>Entries, backlinks, missing linked notes, and memory nodes arranged by the selected layout.</desc>
            <g data-constellation-pan-layer transform={transform} style={{transition:layerTransition}}>
              {edges.map(({a,b,unresolved},i)=>{
                // Initial endpoints = base positions only; the RAF loop adds
                // bob deltas via setAttribute on each frame. Reading offsets
                // here would re-render every edge every tick.
                const pa=positions[a.id]||{x:a.x,y:a.y};
                const pb=positions[b.id]||{x:b.x,y:b.y};
                const bothHover=hoverSet&&hoverSet.has(a.id)&&hoverSet.has(b.id);
                const bothFocal=focalSet&&focalSet.has(a.id)&&focalSet.has(b.id);
                const edgeVisual=getEdgeVisualState({a,b,unresolved},{
                  active:!!bothHover,
                  focal:!!bothFocal,
                  dimmed:!!(hoverSet||focalSet)&&!(bothHover||bothFocal),
                });
                const edgeKey=`${a.id}|${b.id}`;
                return(
                  <line key={i}
                    ref={el=>{if(el)edgeElsRef.current.set(edgeKey,{a:a.id,b:b.id,el});else edgeElsRef.current.delete(edgeKey);}}
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke={edgeVisual.stroke}
                    strokeWidth={edgeVisual.strokeWidth}
                    strokeDasharray={edgeVisual.strokeDasharray}
                    opacity={unresolved?edgeVisual.opacity:Math.min(edgeVisual.opacity,edgeOpacity(a,b)+0.1)}
                    style={{transition:edgeTransition}}/>
                );
              })}
              {renderNodes.map(n=>{
                // Size: degree-based but reduced with depth. Opacity fades with depth.
                const depthOp=Math.max(0.5,1-(n.depth||0)*0.18);
                // Memory entries (wiki/review) get distinct stroke + review = hollow.
                const isMemory=n.type==='wiki'||n.type==='review';
                const isStaleMemory=isMemory&&n.freshness==='stale';
                const keyboardActive=keyboardFocus===n.id;
                const active=hover===n.id||focal===n.id||keyboardActive;
                const dimmed=!!(hoverSet&&!hoverSet.has(n.id))||!!(focalSet&&!focalSet.has(n.id));
                const visual=getNodeVisualState(n,{theme:saturation,active,focused:keyboardActive,focal:focal===n.id,dimmed});
                const r=Math.max(5,visual.radius-(n.depth||0)*1.3);
                const typeColor=visual.stroke;
                const fill=visual.isHollow?'transparent':visual.fill;
                const memoryStaleOp=isStaleMemory?0.6:1;
                const op=nodeOpacity(n)*depthOp*memoryStaleOp*visual.opacity;
                const p=positions[n.id]||{x:n.x,y:n.y};
                const memoryConfidencePct=isMemory&&typeof n.confidence==='number'
                  ?Math.round(n.confidence*100)
                  :null;
                const handleUnresolvedClick=()=>{
                  if(!n._unresolved)return;
                  if(onCreateFromMissing)onCreateFromMissing(n.title);
                };
                return(
                  // Outer: layout position with CSS transition (smooth glide on focal change)
                  // Inner: per-frame bob offset — transform mutated directly by RAF
                  // loop via nodeBobRef. Initial transform is "translate(0 0)"; the
                  // first frame overrides almost immediately.
                  <g key={n.id}
                    data-constellation-node-id={n.id}
                    transform={`translate(${p.x} ${p.y})`}
                    style={{transition:nodeTransition}}>
                    <g ref={el=>{if(el)nodeBobRef.current.set(n.id,el);else nodeBobRef.current.delete(n.id);}}
                      transform="translate(0 0)"
                      onPointerDown={e=>{if(!n._unresolved)onNodePointerDown(e,n.id)}}
                      onPointerMove={n._unresolved?undefined:onNodePointerMove}
                      onPointerUp={e=>{if(n._unresolved){handleUnresolvedClick();return}onNodePointerUp(e,n.id)}}
                      onPointerCancel={e=>{compDragRef.current=null}}
                      onKeyDown={e=>onGraphNodeKeyDown(e,n)}
                      onFocus={()=>setKeyboardFocus(n.id)}
                      onBlur={()=>setKeyboardFocus(current=>current===n.id?null:current)}
                      onMouseEnter={()=>setHover(n.id)} onMouseLeave={()=>setHover(null)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${describeGraphNode(n)}. ${nodeRoleLabel(n)} node. Press Enter to ${n._unresolved?'create this ghost note':'focus this node'}. Press O to open.`}
                      style={{cursor:n._unresolved?'pointer':(compDragRef.current?.nodeId===n.id?'grabbing':'pointer'),touchAction:'none',outline:'none'}} opacity={op}>
                      {(active||visual.isHub||n.starred)&&style!=='board'&&(
                        <circle cx={0} cy={0} r={r+10} fill={visual.halo} opacity={active?0.95:0.55}/>
                      )}
                      {keyboardActive&&style!=='board'&&(
                        <circle data-node-focus-ring cx={0} cy={0} r={r+8} fill="none" stroke="var(--ac)" strokeWidth={2} opacity={0.95}/>
                      )}
                      {n.starred&&style!=='board'&&<circle cx={0} cy={0} r={r+5} fill="none" stroke="#FFE08A" strokeWidth={1.4} opacity={0.75}/>}
                      {style==='board'?(()=>{
                        // Board variant: compact index card, type-color strip on the
                        // left, title + muted meta line. Memory entries keep their
                        // accent stroke + confidence badge so the card doesn't lose its tells.
                        const cardW=Math.max(120,r*8);
                        const cardH=Math.max(40,r*3);
                        const linkCount=n.links?.length||0;
                        const isHub=linkCount>=4;
                        const titleStr=(n.title||'').length>22?(n.title||'').slice(0,21)+'…':(n.title||'');
                        return(
                          <g>
                            <rect x={-cardW/2} y={-cardH/2} width={cardW} height={cardH}
                              fill={visual.isHollow?'rgba(255,255,255,.025)':'var(--cd)'}
                              stroke={typeColor}
                              strokeWidth={visual.strokeWidth}
                              strokeDasharray={visual.strokeDasharray}/>
                            {keyboardActive&&(
                              <rect data-node-focus-ring x={-cardW/2-3} y={-cardH/2-3} width={cardW+6} height={cardH+6}
                                fill="none" stroke="var(--ac)" strokeWidth={2}/>
                            )}
                            {!n._unresolved&&(
                              <rect x={-cardW/2} y={-cardH/2} width={4} height={cardH} fill={visual.fill}/>
                            )}
                            {n.starred&&(
                              <rect x={-cardW/2-2} y={-cardH/2-2} width={cardW+4} height={cardH+4}
                                fill="none" stroke="#FFE08A" strokeWidth={0.9} opacity={0.8}/>
                            )}
                            <text x={-cardW/2+10} y={-cardH/2+18}
                              fill={n._unresolved?'var(--t3)':visual.labelFill}
                              fontSize="12"
                              fontWeight={isHub?600:500}
                              fontFamily="var(--fn)"
                              fontStyle={n._unresolved?'italic':'normal'}
                              pointerEvents="none">{titleStr}</text>
                            <text x={-cardW/2+10} y={-cardH/2+34}
                              fill="var(--t2)"
                              fontSize="10" letterSpacing="0.06em"
                              fontFamily="var(--fn)" pointerEvents="none">
                              {n.type}{linkCount>0?` · ${linkCount}`:''}
                              {memoryConfidencePct!==null?` · ${memoryConfidencePct}%`:''}
                            </text>
                          </g>
                        );
                      })():style==='editorial'?(()=>{
                        // Editorial variant: sparse dot + tier-sized Fraunces label by link
                        // count. Hubs (>=4 links) render large display text to the right; mid
                        // tiers render below in muted serif; leaves disappear into dots
                        // unless hovered/focal/starred.
                        const linkCount=n.links?.length||0;
                        const tier=linkCount>=4?0:linkCount>=2?1:2;
                        const fontSize=[20,13,11][tier];
                        const fontWeight=[400,500,400][tier];
                        const dotR=n.starred?5:linkCount>=4?4.5:2.8;
                        const editorialShow=labelVisible(n)||tier===0||active||n._unresolved;
                        return(
                          <g>
                            {(active||visual.isHub||n.starred)&&(
                              <circle cx={0} cy={0} r={dotR+7} fill={visual.halo} opacity={active?0.85:0.45}/>
                            )}
                            {n._unresolved?(
                              <circle cx={0} cy={0} r={dotR} fill="none" stroke={typeColor} strokeWidth={1} strokeDasharray="1.5 2"/>
                            ):(
                              <circle cx={0} cy={0} r={dotR} fill={visual.isHollow?'transparent':visual.fill}
                                stroke={visual.stroke}
                                strokeWidth={Math.max(1,visual.strokeWidth-0.6)}
                                strokeDasharray={visual.strokeDasharray}/>
                            )}
                            {active&&!n._unresolved&&(
                              <circle cx={0} cy={0} r={dotR+5} fill="none" stroke="var(--ac)" strokeWidth={0.8}/>
                            )}
                            {editorialShow&&n.title&&(
                              <text
                                x={tier===0?dotR+10:0}
                                y={tier===0?6:dotR+fontSize+2}
                                textAnchor={tier===0?'start':'middle'}
                                fill={n._unresolved?'var(--t3)':(tier===0?visual.labelFill:'var(--t2)')}
                                fontSize={fontSize}
                                fontWeight={fontWeight}
                                fontFamily="var(--fn)"
                                fontStyle={n._unresolved?'italic':'normal'}
                                letterSpacing={0}
                                pointerEvents="none"
                                style={{paintOrder:'stroke',stroke:'var(--bg)',strokeWidth:3,strokeLinejoin:'round'}}>
                                {n.title}
                              </text>
                            )}
                            {memoryConfidencePct!==null&&(
                              <text x={0} y={dotR+fontSize+14} textAnchor="middle"
                                fill="var(--t3)" fontSize="9" fontFamily="var(--fn)" pointerEvents="none"
                                style={{paintOrder:'stroke',stroke:'var(--bg)',strokeWidth:3,strokeLinejoin:'round'}}>
                                {memoryConfidencePct}%
                              </text>
                            )}
                          </g>
                        );
                      })():(<>
                        {/* Map-node variant — current default. Compact dot + label. */}
                        <circle cx={0} cy={0} r={r} fill={fill}
                          stroke={typeColor}
                          strokeWidth={visual.strokeWidth}
                          strokeDasharray={visual.strokeDasharray}/>
                        {(labelVisible(n)||n._unresolved)&&<text x={0} y={r+12} textAnchor="middle"
                          fill={n._unresolved?'var(--t3)':visual.labelFill} fontSize="10"
                          fontFamily="var(--fn)" fontStyle={n._unresolved?'italic':'normal'} pointerEvents="none"
                          style={{paintOrder:'stroke',stroke:'var(--bg)',strokeWidth:3,strokeLinejoin:'round'}}>
                          {(n.title||'').slice(0,22)}{(n.title||'').length>22?'…':''}
                        </text>}
                        {memoryConfidencePct!==null&&<text x={0} y={r+(labelVisible(n)?24:12)} textAnchor="middle"
                          fill="var(--t3)" fontSize="9" fontFamily="var(--fn)" pointerEvents="none"
                          style={{paintOrder:'stroke',stroke:'var(--bg)',strokeWidth:3,strokeLinejoin:'round'}}>
                          {memoryConfidencePct}%
                        </text>}
                      </>)}
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
        {legendOpen?(
          <div style={{position:'absolute',top:14,left:14,background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',padding:'10px 12px',fontSize:11,display:'flex',flexDirection:'column',gap:4,maxWidth:180}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:9,color:'var(--t3)',letterSpacing:1.5,textTransform:'uppercase'}}>Type</span>
              <button onClick={()=>setLegendOpen(false)} aria-label="Hide legend" title="Hide legend"
                style={{padding:'0 6px',fontSize:14,lineHeight:1,background:'transparent',border:'none',color:'var(--t3)',cursor:'pointer'}}>×</button>
            </div>
            {visibleEntryTypes.map(t=>(
              <div key={t} style={{display:'flex',alignItems:'center',gap:7,color:'var(--t2)'}}>
                <span style={{width:10,height:10,borderRadius:'50%',background:applyTypeSat(t,saturation)}}/>
                <span>{LABEL[t]}</span>
              </div>
            ))}
            <div style={{display:'flex',alignItems:'center',gap:7,color:'var(--t2)',marginTop:4}}>
              <span style={{width:14,height:14,borderRadius:'50%',border:'1.4px solid #FFE08A'}}/>
              <span>Starred</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:7,color:'var(--t2)'}}>
              <span style={{width:14,height:14,borderRadius:'50%',border:'1.4px dashed #9AA7B8',background:'rgba(154,167,184,.10)'}}/>
              <span>Missing link</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:7,color:'var(--t2)'}}>
              <span style={{width:14,height:14,borderRadius:'50%',border:'1.4px solid #FF8BBE',background:'transparent'}}/>
              <span>Review memory</span>
            </div>
            <div style={{marginTop:10,paddingTop:8,borderTop:'1px solid var(--br)',fontSize:10,color:'var(--t3)',display:'flex',flexDirection:'column',gap:3,lineHeight:1.4}}>
              <div>Click · focus local graph</div>
              <div>Drag · move one node</div>
              <div><kbd style={{padding:'0 4px',border:'1px solid var(--br)',borderRadius:3,fontFamily:'monospace',fontSize:9}}>Alt</kbd>+drag · move linked group</div>
              <div><kbd style={{padding:'0 4px',border:'1px solid var(--br)',borderRadius:3,fontFamily:'monospace',fontSize:9}}>Alt</kbd>+click · open note</div>
              <div><kbd style={{padding:'0 4px',border:'1px solid var(--br)',borderRadius:3,fontFamily:'monospace',fontSize:9}}>C</kbd> · clusters <kbd style={{padding:'0 4px',border:'1px solid var(--br)',borderRadius:3,fontFamily:'monospace',fontSize:9,marginLeft:4}}>A</kbd> · affinity</div>
              <div>Wheel · zoom · Esc · up one</div>
            </div>
          </div>
        ):(
          <button onClick={()=>setLegendOpen(true)} aria-label="Show legend" title="Show legend"
            style={{position:'absolute',top:14,left:14,width:28,height:28,background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontSize:13,fontFamily:'var(--fn)',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>ⓘ</button>
        )}
      </div>
    </div>
  );
}

function MetricChip({label,value}){
  return(
    <span style={{
      display:'inline-flex',alignItems:'center',gap:5,
      minHeight:22,padding:'0 8px',
      border:'1px solid var(--br)',borderRadius:'var(--rd)',
      background:'rgba(255,255,255,.035)',
      color:'var(--t2)',fontSize:11,fontFamily:'var(--fn)'
    }}>
      <strong style={{color:'var(--tx)',fontWeight:850}}>{value}</strong>
      <span>{label}</span>
    </span>
  );
}

function controlButton(active=false){
  return{
    padding:'7px 11px',
    fontSize:12,
    border:'1px solid var(--br)',
    borderRadius:'var(--rd)',
    background:active?'var(--ac)':'rgba(255,255,255,.025)',
    color:active?'var(--act)':'var(--t2)',
    cursor:'pointer',
    fontFamily:'var(--fn)',
    fontWeight:800,
    flexShrink:0,
  };
}

// Small info button paired with an inline help panel rendered by the parent.
// The panel lives below the toolbar so it never covers nearby controls.
function InfoButton({open,onToggle,title}){
  return(
    <div style={{display:'inline-flex',alignItems:'center'}}>
      <button onClick={onToggle} aria-label={`What is ${title}?`} aria-expanded={open}
        title={open?'Close info':'About this'}
        style={{
          width:18,height:18,border:'1px solid var(--br)',borderRadius:'50%',
          background:open?'var(--ac)':'transparent',color:open?'var(--act)':'var(--t3)',
          cursor:'pointer',padding:0,fontSize:11,fontFamily:'var(--fn)',
          display:'inline-flex',alignItems:'center',justifyContent:'center',
          lineHeight:1,fontStyle:'italic',fontWeight:700,
        }}>i</button>
    </div>
  );
}

function InfoPanel({title,children}){
  return(
    <div role="note" style={{
      alignSelf:'flex-start',
      maxWidth:680,
      padding:'10px 12px',
      background:'rgba(9,14,20,.78)',
      border:'1px solid var(--br)',
      borderRadius:'var(--rd)',
      boxShadow:'inset 0 1px 0 rgba(255,255,255,.035)',
      fontSize:12,
      lineHeight:1.5,
      color:'var(--t2)',
    }}>
      <div style={{fontWeight:800,marginBottom:4,fontSize:12,color:'var(--tx)'}}>{title}</div>
      {children}
    </div>
  );
}

// ── Background variants ─────────────────────────────────────────────────────
// 'solid'    — bare app background.
// 'atlas'    — faint map rings and cross-lines, tuned for the signal palette.
// 'vignette' — radial fade darkens the edges, focuses center.
// 'grid'     — hairline grid, "thinking tablet" feel.
// 'constellation' — sparse decorative star dots, "night sky" atmosphere.
// All variants sit BELOW the SVG canvas with pointer-events disabled so they
// never block pan/zoom interaction.
function ConstellationBackground({kind='solid'}){
  if(kind==='solid')return null;
  if(kind==='atlas'){
    return(
      <svg aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none'}}
        viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="jf-atlas-wash" cx="50%" cy="48%" r="72%">
            <stop offset="0%" stopColor="var(--ac)" stopOpacity="0.08"/>
            <stop offset="58%" stopColor="var(--bg)" stopOpacity="0.02"/>
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0"/>
          </radialGradient>
          <pattern id="jf-atlas-grid" width="96" height="96" patternUnits="userSpaceOnUse">
            <path d="M 96 0 L 0 0 0 96" fill="none" stroke="var(--br)" strokeWidth="0.7" opacity="0.42"/>
          </pattern>
        </defs>
        <rect width="1600" height="1000" fill="url(#jf-atlas-wash)"/>
        <rect width="1600" height="1000" fill="url(#jf-atlas-grid)" opacity="0.42"/>
        {[260,440,650].map((r,i)=>(
          <circle key={r} cx="800" cy="500" r={r} fill="none"
            stroke="var(--ac)" strokeWidth={i===0?0.9:0.55}
            opacity={i===0?0.2:0.11} strokeDasharray={i===1?'10 16':'2 18'}/>
        ))}
        <path d="M 260 500 H 1340 M 800 140 V 860 M 418 242 L 1182 758 M 1182 242 L 418 758"
          fill="none" stroke="var(--br)" strokeWidth="0.7" opacity="0.28"/>
      </svg>
    );
  }
  if(kind==='vignette'){
    return(
      <div aria-hidden="true" style={{
        position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)'
      }}/>
    );
  }
  if(kind==='grid'){
    return(
      <svg aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none',opacity:0.5}}
        width="100%" height="100%">
        <defs>
          <pattern id="jf-graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--br)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#jf-graph-grid)"/>
      </svg>
    );
  }
  if(kind==='constellation'){
    const seeds=[];
    for(let i=0;i<80;i++){
      const x=(i*53)%1600;
      const y=(i*97+17)%1000;
      const r=i%5===0?0.9:0.4;
      seeds.push({x,y,r,o:0.12+(((i*7)%30)/100)*0.4});
    }
    return(
      <svg aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none'}}
        viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        {seeds.map((s,i)=>(
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--ac)" opacity={s.o}/>
        ))}
      </svg>
    );
  }
  return null;
}

function usePrefersReducedMotion(){
  const getPreference=()=>(
    typeof window!=='undefined'&&
    typeof window.matchMedia==='function'&&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const[reduced,setReduced]=useState(getPreference);

  useEffect(()=>{
    if(typeof window==='undefined'||typeof window.matchMedia!=='function')return undefined;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);
    update();
    if(typeof media.addEventListener==='function'){
      media.addEventListener('change',update);
      return()=>media.removeEventListener('change',update);
    }
    media.addListener?.(update);
    return()=>media.removeListener?.(update);
  },[]);

  return reduced;
}
