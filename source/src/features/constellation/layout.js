// ── Constellation layout algorithms ───────────────────────────────────────
// Pure functions (no React). Extracted from ConstellationView so the view
// file stays focused on rendering + interaction.

const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967295};

// Affinity-weighted force-directed positions. Runs a short sim over `pool` and
// returns { [id]: {x,y} }.
// affinity = 0.45*tagJaccard + 0.20*linked + 0.15*typeMatch + 0.12*dateKernel + 0.08*statusMatch
export function computeAffinityLayout(pool){
  const ids=pool.map(e=>e.id);
  if(!ids.length)return{};
  const byId={};pool.forEach(e=>byId[e.id]=e);
  const tagSet=e=>new Set(e.tags||[]);
  const jaccard=(a,b)=>{const A=tagSet(a),B=tagSet(b);if(!A.size&&!B.size)return 0;let inter=0;A.forEach(t=>{if(B.has(t))inter++});const uni=A.size+B.size-inter;return uni?inter/uni:0};
  const dayMs=86400000;
  const dateKernel=(a,b)=>{const da=Date.parse(a.date)||0,db=Date.parse(b.date)||0;if(!da||!db)return 0;const diff=Math.abs(da-db)/dayMs;return Math.exp(-diff/30)};
  const affinity=(a,b)=>{
    const linked=(a.links||[]).includes(b.id)||(b.links||[]).includes(a.id)?1:0;
    const type=a.type===b.type?1:0;
    const status=a.status===b.status?1:0;
    return 0.45*jaccard(a,b)+0.20*linked+0.15*type+0.12*dateKernel(a,b)+0.08*status;
  };
  // Seed with polar positions so forces have something to relax
  const pos={};
  ids.forEach((id,i)=>{
    const a=(i/ids.length)*Math.PI*2;
    pos[id]={x:400+Math.cos(a)*180,y:300+Math.sin(a)*180};
  });
  // Precompute pairwise affinity + spring rest length
  const pairs=[];
  for(let i=0;i<ids.length;i++){
    for(let j=i+1;j<ids.length;j++){
      const af=affinity(byId[ids[i]],byId[ids[j]]);
      pairs.push({a:ids[i],b:ids[j],af,rest:Math.max(55,170-af*140)});
    }
  }
  const REP=2400,SPRING=0.14,DAMP=0.82,STEP=0.9,ITERS=160;
  const vel={};ids.forEach(id=>{vel[id]={vx:0,vy:0}});
  for(let it=0;it<ITERS;it++){
    const force={};ids.forEach(id=>{force[id]={fx:0,fy:0}});
    // Spring attraction on high-affinity pairs + universal repel
    for(const p of pairs){
      const A=pos[p.a],B=pos[p.b];
      const dx=B.x-A.x,dy=B.y-A.y;
      const d=Math.sqrt(dx*dx+dy*dy)||0.001;
      const ux=dx/d,uy=dy/d;
      // Repel
      const fr=REP/(d*d+30);
      force[p.a].fx-=ux*fr;force[p.a].fy-=uy*fr;
      force[p.b].fx+=ux*fr;force[p.b].fy+=uy*fr;
      // Spring: pairs with meaningful affinity attract toward rest length
      if(p.af>0.05){
        const stretch=d-p.rest;
        const fs=SPRING*stretch*p.af;
        force[p.a].fx+=ux*fs;force[p.a].fy+=uy*fs;
        force[p.b].fx-=ux*fs;force[p.b].fy-=uy*fs;
      }
    }
    // Gentle center gravity
    for(const id of ids){
      force[id].fx+=(400-pos[id].x)*0.0015;
      force[id].fy+=(300-pos[id].y)*0.0015;
    }
    // Integrate
    for(const id of ids){
      vel[id].vx=(vel[id].vx+force[id].fx*STEP)*DAMP;
      vel[id].vy=(vel[id].vy+force[id].fy*STEP)*DAMP;
      pos[id].x+=vel[id].vx;
      pos[id].y+=vel[id].vy;
    }
  }
  return pos;
}

// Layout nodes via connected-component clusters arranged in a grid. Each
// cluster runs its own mini force-directed sim so root anchors at cell center
// and children swirl around it. Returns a flat array of {...node, x, y, comp, depth}.
export function computeClusterLayout(components){
  const out=[];
  const compCount=components.length;
  const cols=Math.max(1,Math.ceil(Math.sqrt(compCount*1.3)));
  const rows=Math.max(1,Math.ceil(compCount/cols));
  const W=Math.max(800,cols*420),H=Math.max(600,rows*380);
  const cellW=W/cols,cellH=H/rows;
  components.forEach((grp,ci)=>{
    const col=ci%cols,row=Math.floor(ci/cols);
    const cx=cellW*(col+0.5)-(W-800)/2;
    const cy=cellH*(row+0.5)-(H-600)/2;
    if(grp.length===1){
      out.push({...grp[0],x:cx,y:cy,comp:ci,depth:0});
      return;
    }
    // Pick root: highest-degree node. BFS for depth (hierarchy encoding).
    const idToNode={};grp.forEach(n=>{idToNode[n.id]=n});
    const sortedByDeg=[...grp].sort((a,b)=>(b.links?.length||0)-(a.links?.length||0));
    const rootId=sortedByDeg[0].id;
    const depth={[rootId]:0};const queue=[rootId];
    while(queue.length){
      const id=queue.shift();
      (idToNode[id].links||[]).forEach(l=>{
        if(depth[l]!==undefined||!idToNode[l])return;
        depth[l]=depth[id]+1;queue.push(l);
      });
    }
    const maxD=Math.max(0,...Object.values(depth));
    grp.forEach(n=>{if(depth[n.id]===undefined)depth[n.id]=maxD+1});

    // Per-cluster force-directed layout (mini spring sim) — organic shape,
    // root anchored at cell center so hierarchy stays readable.
    const cellR=Math.min(cellW,cellH)*0.42;
    const p={};grp.forEach(n=>{
      const a=hash(n.id)*Math.PI*2;
      const r=30+hash(n.id+'r')*cellR*0.7;
      p[n.id]={x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r};
    });
    const linkSet=new Set();
    grp.forEach(a=>(a.links||[]).forEach(b=>{if(idToNode[b])linkSet.add([a.id,b].sort().join('|'))}));
    const linkRest=55,SPRING=0.25,REP=1600,DAMP=0.78,STEP=0.85,ITERS=70;
    const vel={};grp.forEach(n=>{vel[n.id]={vx:0,vy:0}});
    for(let it=0;it<ITERS;it++){
      const f={};grp.forEach(n=>{f[n.id]={fx:0,fy:0}});
      // Pairwise repel + spring on links
      for(let i=0;i<grp.length;i++){
        for(let j=i+1;j<grp.length;j++){
          const A=grp[i],B=grp[j];
          const pa=p[A.id],pb=p[B.id];
          const dx=pb.x-pa.x,dy=pb.y-pa.y;
          const d=Math.sqrt(dx*dx+dy*dy)||0.01;
          const ux=dx/d,uy=dy/d;
          const fr=REP/(d*d+20);
          f[A.id].fx-=ux*fr;f[A.id].fy-=uy*fr;
          f[B.id].fx+=ux*fr;f[B.id].fy+=uy*fr;
          if(linkSet.has([A.id,B.id].sort().join('|'))){
            const stretch=d-linkRest;
            const fs=SPRING*stretch;
            f[A.id].fx+=ux*fs;f[A.id].fy+=uy*fs;
            f[B.id].fx-=ux*fs;f[B.id].fy-=uy*fs;
          }
        }
      }
      // Pull toward cell center (soft) + strong anchor on root
      for(const n of grp){
        const isRoot=n.id===rootId;
        const k=isRoot?0.2:0.012;
        f[n.id].fx+=(cx-p[n.id].x)*k;
        f[n.id].fy+=(cy-p[n.id].y)*k;
      }
      for(const n of grp){
        vel[n.id].vx=(vel[n.id].vx+f[n.id].fx*STEP)*DAMP;
        vel[n.id].vy=(vel[n.id].vy+f[n.id].fy*STEP)*DAMP;
        p[n.id].x+=vel[n.id].vx;
        p[n.id].y+=vel[n.id].vy;
      }
    }
    grp.forEach(n=>{
      out.push({...n,x:p[n.id].x,y:p[n.id].y,comp:ci,depth:depth[n.id]||0});
    });
  });
  return out;
}

// Messy layout: scattered-but-deterministic via golden-angle stride.
// Hubs (higher link count) bias toward center. Per-node jitter derived from
// id hash so layout stays stable across renders.
export function computeMessyLayout(pool,components){
  const sorted=[...pool].sort((a,b)=>(b.links?.length||0)-(a.links?.length||0));
  const compOf={};components.forEach((g,ci)=>g.forEach(n=>{compOf[n.id]=ci}));
  const GOLDEN=Math.PI*(3-Math.sqrt(5));
  return sorted.map((e,i)=>{
    const t=sorted.length>1?i/(sorted.length-1):0;
    const baseR=90+t*240;
    const h1=hash(e.id),h2=hash(e.id+'y');
    const jitterR=(h1-0.5)*70;
    const jitterA=(h2-0.5)*0.7;
    const angle=i*GOLDEN+jitterA;
    const r=baseR+jitterR;
    return{...e,x:400+Math.cos(angle)*r,y:300+Math.sin(angle)*r,comp:compOf[e.id]??0,depth:0};
  });
}
