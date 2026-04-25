import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { TYPES, LABEL } from '../../lib/types.js';
import { GraphLockOverlay } from '../../onboarding/nudges.jsx';
import { Select } from '../dropdowns/Select.jsx';
import { computeAffinityLayout, computeClusterLayout, computeMessyLayout } from './layout.js';

// ── Constellation (Graph view) ────────────────────────────────────────────
// Polar layout — nodes on circles, no physics sim (keeps bundle tiny, no hover
// jitter). Node size encodes link-count. Node color encodes type. Starred
// entries get a halo. Click node = open detail.
export const TYPE_HUE={video:'#ef4444',podcast:'#a855f7',article:'#3b82f6',journal:'#10b981',link:'#f59e0b',note:'#14b8a6'};
export function ConstellationView({entries,onOpen,onBack,onAdd,layoutMode:layoutModeProp,onLayoutModeChange,onCreateFromMissing}){
  const[filter,setFilter]=useState('all');
  const[tagFilter,setTagFilter]=useState('');
  const[titleQuery,setTitleQuery]=useState('');
  const[showUnresolved,setShowUnresolved]=useState(true);
  const[hover,setHover]=useState(null);
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

  // Sparse-link vaults break the Clusters layout: when most components are
  // singletons, computeClusterLayout drops every node at its cell center
  // and the result is a graph-paper grid. Auto-fall-back to messy
  // positioning when ≥80% of components are size 1, so the toggle still
  // says "Clusters" but the user sees an organic spread until they have
  // enough links for cluster shapes to actually emerge.
  const singletonRatio=useMemo(()=>{
    if(!components.length)return 0;
    const singletons=components.filter(g=>g.length===1).length;
    return singletons/components.length;
  },[components]);
  const effectiveLayoutMode=useMemo(()=>{
    if(layoutMode==='clusters'&&singletonRatio>=0.8)return 'messy';
    return layoutMode;
  },[layoutMode,singletonRatio]);

  // Three layouts: 'messy' | 'clusters' | 'affinity'. CSS transition on each
  // node's outer <g> smoothly animates position changes when mode toggles.
  const nodes=useMemo(()=>{
    if(effectiveLayoutMode==='affinity'){
      const compOf={};components.forEach((g,ci)=>g.forEach(n=>{compOf[n.id]=ci}));
      return pool.map(e=>{
        const p=affinityLayout[e.id]||{x:400,y:300};
        return{...e,x:p.x,y:p.y,comp:compOf[e.id]??0,depth:0};
      });
    }
    if(effectiveLayoutMode==='messy')return computeMessyLayout(pool,components);
    return computeClusterLayout(components);
  },[components,pool,effectiveLayoutMode,affinityLayout]);
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

  const renderNodes=useMemo(()=>[...nodes,...unresolvedPseudoNodes],[nodes,unresolvedPseudoNodes]);
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
    const ci=nodeToComp[nodeId];
    const origComp=componentOffsets[ci]||{dx:0,dy:0};
    const origNode=nodeOffsets[nodeId]||{dx:0,dy:0};
    compDragRef.current={
      nodeId,compIdx:ci,alt,
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
    if(d.alt){
      setNodeOffsets(prev=>({...prev,[d.nodeId]:{dx:d.origNodeDx+sx,dy:d.origNodeDy+sy}}));
    }else{
      setComponentOffsets(prev=>({...prev,[d.compIdx]:{dx:d.origCompDx+sx,dy:d.origCompDy+sy}}));
    }
  };
  const onNodePointerUp=(e,nodeId)=>{
    const d=compDragRef.current;if(!d||d.nodeId!==nodeId)return;
    e.currentTarget.releasePointerCapture?.(d.pointerId);
    const wasDrag=d.moved,wasAlt=d.alt;
    compDragRef.current=null;
    if(wasDrag)return;
    if(wasAlt){
      // Alt+click with no movement: snap this node back to its layout spot
      setNodeOffsets(prev=>{if(!(nodeId in prev))return prev;const n={...prev};delete n[nodeId];return n});
      return;
    }
    onNodeClick(nodeId);
  };

  // Clicking a node (no drag) digs deeper. Click same = back.
  const onNodeClick=(id)=>{
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
    const tick=(t)=>{lastRaf=t;compute(t);raf=requestAnimationFrame(tick)};
    raf=requestAnimationFrame(tick);
    // Watchdog: if RAF hasn't fired in 500ms, switch to setInterval
    iv=setInterval(()=>{
      const now=performance.now();
      if(now-lastRaf>500)compute(now);
    },33);
    return()=>{cancelAnimationFrame(raf);clearInterval(iv)};
  },[]);

  // Escape pops one layer. "C" toggles between messy web and cluster view.
  useEffect(()=>{
    const h=e=>{
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
      if(e.key==='Escape'&&focalStack.length)popFocal();
      else if(e.key==='c'||e.key==='C')setLayoutMode(m=>m==='messy'?'clusters':'messy');
      else if(e.key==='a'||e.key==='A')setLayoutMode(m=>m==='affinity'?'messy':'affinity');
    };
    document.addEventListener('keydown',h);
    return()=>document.removeEventListener('keydown',h);
  },[focalStack.length]);

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

  const edgeOpacity=(a,b)=>{
    if(hoverSet){return(hoverSet.has(a.id)&&hoverSet.has(b.id))?0.9:0.05}
    if(focalSet){return(focalSet.has(a.id)&&focalSet.has(b.id))?0.85:0.02}
    return 0.12;
  };
  const nodeOpacity=(n)=>{
    if(hoverSet&&!hoverSet.has(n.id))return 0.4;
    if(focalSet&&!focalSet.has(n.id))return 0.18;
    return 1;
  };
  const labelVisible=(n)=>{
    if(focalSet)return focalSet.has(n.id);
    if(hoverSet)return hoverSet.has(n.id);
    return n.starred||topIds.has(n.id);
  };

  const focalNode=focal?nodeById[focal]:null;

  // Lock graph until 3 entries — all hooks above run so Rules-of-Hooks holds
  if(entries.length<3){
    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>
        <div style={{padding:'10px 20px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',gap:10,flexShrink:0,background:'var(--b2)'}}>
          <button onClick={onBack} style={{padding:'6px 10px',fontSize:12,background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>← Back</button>
          <span style={{fontWeight:700,fontSize:17,letterSpacing:-0.3}}>✦ Constellation</span>
        </div>
        <GraphLockOverlay count={entries.length} onAdd={()=>{onBack();onAdd&&onAdd()}}/>
      </div>
    );
  }

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>
      <div style={{padding:'10px 20px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',gap:10,flexShrink:0,background:'var(--b2)'}}>
        <button onClick={onBack} style={{padding:'6px 10px',fontSize:12,background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>← Back</button>
        <span style={{fontWeight:700,fontSize:17,letterSpacing:-0.3}}>✦ Constellation</span>
        <span style={{fontSize:12,color:'var(--t3)'}}>{nodes.length} entries · {edges.length} links</span>
        {focalStack.length>0&&(
          <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:12,padding:'4px 10px',background:'var(--b2)',border:'1px solid var(--ac)',borderRadius:'var(--rd)',maxWidth:440,overflow:'hidden'}}>
            <button onClick={popFocal} aria-label="Back one layer" title="Back one layer (Esc)" style={{padding:'2px 6px',fontSize:13,background:'transparent',border:'none',color:'var(--ac)',cursor:'pointer',fontWeight:700}}>←</button>
            <span style={{fontSize:11,color:'var(--t3)',fontFamily:'monospace',letterSpacing:1}}>L{focalStack.length}</span>
            <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,overflow:'hidden'}}>
              {focalStack.flatMap((id,i)=>{
                const n=nodeById[id];if(!n)return[];
                const last=i===focalStack.length-1;
                const items=[];
                if(i>0)items.push(<span key={'sep'+i} style={{color:'var(--t3)'}}>›</span>);
                items.push(<button key={'bc'+i+id} onClick={()=>setFocalStack(st=>st.slice(0,i+1))}
                  style={{padding:0,background:'transparent',border:'none',color:last?'var(--tx)':'var(--t2)',fontWeight:last?700:400,cursor:'pointer',fontFamily:'var(--fn)',fontSize:12,maxWidth:last?180:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {n.title||'Untitled'}
                </button>);
                return items;
              })}
            </div>
            {focalNode&&<button onClick={()=>onOpen(focalNode.id)} style={{padding:'2px 8px',fontSize:11,background:'var(--ac)',color:'var(--act)',border:'none',borderRadius:'var(--rd)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:700,flexShrink:0}}>Open</button>}
          </div>
        )}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <input value={titleQuery} onChange={e=>setTitleQuery(e.target.value)}
            placeholder="Search titles…" aria-label="Search node titles"
            style={{padding:'4px 8px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'var(--bg)',color:'var(--tx)',fontFamily:'var(--fn)',width:140}}/>
          <Select ariaLabel="Filter by tag" value={tagFilter} onChange={v=>setTagFilter(v)}
            options={[{value:'',label:'All tags'},...allTags.map(t=>({value:t,label:`#${t}`}))]}/>
          <button onClick={()=>setShowUnresolved(s=>!s)}
            title={showUnresolved?'Hide unresolved [[wikilink]] targets':'Show unresolved [[wikilink]] targets'}
            style={{padding:'4px 10px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:showUnresolved?'var(--ac)':'transparent',color:showUnresolved?'var(--act)':'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:700}}>
            {showUnresolved?'? Unresolved: on':'? Unresolved: off'}
          </button>
          <span style={{fontSize:11,color:'var(--t3)',fontFamily:'monospace'}}>{displayedZoom}%</span>
          <div style={{display:'flex',gap:0,border:'1px solid var(--br)',borderRadius:'var(--rd)',overflow:'hidden'}}>
            {[['messy','◉ Messy','C'],['clusters','✦ Clusters','C'],['affinity','⚛ Affinity','A']].map(([k,label,hint])=>{
              const isActive=layoutMode===k;
              const fellBack=k==='clusters'&&isActive&&effectiveLayoutMode!=='clusters';
              return(
                <button key={k} onClick={()=>setLayoutMode(k)}
                  title={fellBack?`Layout: ${label} (${hint}) — vault has too few links for cluster shapes; showing messy positions until you link more entries.`:`Layout: ${label} (${hint})`}
                  style={{padding:'4px 10px',fontSize:11,background:isActive?'var(--ac)':'transparent',color:isActive?'var(--act)':'var(--t2)',border:'none',borderRight:'1px solid var(--br)',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:700,opacity:fellBack?0.7:1}}>
                  {label}{fellBack?'*':''}
                </button>
              );
            })}
          </div>
          <button onClick={resetAll} style={{padding:'4px 10px',fontSize:11,background:'transparent',border:'1px solid var(--br)',borderRadius:'var(--rd)',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>Reset</button>
          <div style={{width:140}}>
            <Select ariaLabel="Filter graph by type" value={filter} onChange={setFilter}
              options={[{value:'all',label:'All types'},...TYPES.map(t=>({value:t,label:LABEL[t]}))]}/>
          </div>
        </div>
      </div>
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>
        {nodes.length===0?(
          <div style={{textAlign:'center',padding:'120px 20px',color:'var(--t3)'}}>
            <div style={{fontSize:48,marginBottom:12}} aria-hidden="true">✦</div>
            <div style={{fontSize:15,fontWeight:700,color:'var(--t2)',marginBottom:4}}>No entries to map yet</div>
            <div style={{fontSize:12}}>Add entries and link them to see the constellation.</div>
          </div>
        ):(
          <svg ref={svgRef} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet"
            style={{width:'100%',height:'100%',display:'block',cursor:isDragging?'grabbing':'grab',userSelect:'none',touchAction:'none'}}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
            <g transform={transform} style={{transition:isDragging||panRef.current||compDragRef.current?'none':'transform 0.5s cubic-bezier(0.4,0,0.2,1)'}}>
              {edges.map(({a,b,unresolved},i)=>{
                // Initial endpoints = base positions only; the RAF loop adds
                // bob deltas via setAttribute on each frame. Reading offsets
                // here would re-render every edge every tick.
                const pa=positions[a.id]||{x:a.x,y:a.y};
                const pb=positions[b.id]||{x:b.x,y:b.y};
                const bothHover=hoverSet&&hoverSet.has(a.id)&&hoverSet.has(b.id);
                const bothFocal=focalSet&&focalSet.has(a.id)&&focalSet.has(b.id);
                const edgeKey=`${a.id}|${b.id}`;
                return(
                  <line key={i}
                    ref={el=>{if(el)edgeElsRef.current.set(edgeKey,{a:a.id,b:b.id,el});else edgeElsRef.current.delete(edgeKey);}}
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke={unresolved?'var(--t3)':(bothHover||bothFocal?'var(--ac)':'var(--tx)')}
                    strokeWidth={bothHover||bothFocal?1.6:0.8}
                    strokeDasharray={unresolved?'4 4':undefined}
                    opacity={unresolved?0.45:edgeOpacity(a,b)}
                    style={{transition:focal?'x1 0.55s cubic-bezier(0.4,0,0.2,1), y1 0.55s cubic-bezier(0.4,0,0.2,1), x2 0.55s cubic-bezier(0.4,0,0.2,1), y2 0.55s cubic-bezier(0.4,0,0.2,1)':'none'}}/>
                );
              })}
              {renderNodes.map(n=>{
                // Size: degree-based but reduced with depth. Opacity fades with depth.
                const degR=6+Math.min(14,(n.links?.length||0)*2.2);
                const r=Math.max(5,degR-(n.depth||0)*1.6);
                const depthOp=Math.max(0.5,1-(n.depth||0)*0.18);
                const fill=n._unresolved?'var(--bg)':(TYPE_HUE[n.type]||'var(--ac)');
                const active=hover===n.id||focal===n.id;
                const op=nodeOpacity(n)*depthOp;
                const p=positions[n.id]||{x:n.x,y:n.y};
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
                    transform={`translate(${p.x} ${p.y})`}
                    style={{transition:'transform 0.85s cubic-bezier(0.22,1,0.36,1)'}}>
                    <g ref={el=>{if(el)nodeBobRef.current.set(n.id,el);else nodeBobRef.current.delete(n.id);}}
                      transform="translate(0 0)"
                      onPointerDown={e=>{if(!n._unresolved)onNodePointerDown(e,n.id)}}
                      onPointerMove={n._unresolved?undefined:onNodePointerMove}
                      onPointerUp={e=>{if(n._unresolved){handleUnresolvedClick();return}onNodePointerUp(e,n.id)}}
                      onPointerCancel={e=>{compDragRef.current=null}}
                      onMouseEnter={()=>setHover(n.id)} onMouseLeave={()=>setHover(null)}
                      style={{cursor:n._unresolved?'pointer':(compDragRef.current?.nodeId===n.id?'grabbing':'pointer'),touchAction:'none'}} opacity={n._unresolved?0.7:op}>
                      {n.starred&&<circle cx={0} cy={0} r={r+5} fill="none" stroke="#e0a600" strokeWidth={1.4} opacity={0.6}/>}
                      <circle cx={0} cy={0} r={r} fill={fill}
                        stroke={n._unresolved?'var(--t3)':(active?'var(--tx)':'var(--bg)')}
                        strokeWidth={active?2.5:2}
                        strokeDasharray={n._unresolved?'3 3':undefined}/>
                      {(labelVisible(n)||n._unresolved)&&<text x={0} y={r+12} textAnchor="middle"
                        fill={n._unresolved?'var(--t3)':'var(--tx)'} fontSize="10"
                        fontFamily="var(--fn)" fontStyle={n._unresolved?'italic':'normal'} pointerEvents="none"
                        style={{paintOrder:'stroke',stroke:'var(--bg)',strokeWidth:3,strokeLinejoin:'round'}}>
                        {(n.title||'').slice(0,22)}{(n.title||'').length>22?'…':''}
                      </text>}
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
            {TYPES.map(t=>(
              <div key={t} style={{display:'flex',alignItems:'center',gap:7,color:'var(--t2)'}}>
                <span style={{width:10,height:10,borderRadius:'50%',background:TYPE_HUE[t]}}/>
                <span>{LABEL[t]}</span>
              </div>
            ))}
            <div style={{display:'flex',alignItems:'center',gap:7,color:'var(--t2)',marginTop:4}}>
              <span style={{width:14,height:14,borderRadius:'50%',border:'1.4px solid #e0a600'}}/>
              <span>Starred</span>
            </div>
            <div style={{marginTop:10,paddingTop:8,borderTop:'1px solid var(--br)',fontSize:10,color:'var(--t3)',display:'flex',flexDirection:'column',gap:3,lineHeight:1.4}}>
              <div>Click · focus cluster</div>
              <div>Drag · move cluster</div>
              <div><kbd style={{padding:'0 4px',border:'1px solid var(--br)',borderRadius:3,fontFamily:'monospace',fontSize:9}}>Alt</kbd>+drag · detach node</div>
              <div><kbd style={{padding:'0 4px',border:'1px solid var(--br)',borderRadius:3,fontFamily:'monospace',fontSize:9}}>Alt</kbd>+click · snap back</div>
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
