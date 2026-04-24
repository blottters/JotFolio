// ── Victory Theme Color Derivation ─────────────────────────────────────────
export function hexToRgb(hex){const h=hex.replace('#','');const f=h.length===3?h.split('').map(c=>c+c).join(''):h;return[parseInt(f.slice(0,2),16),parseInt(f.slice(2,4),16),parseInt(f.slice(4,6),16)];}
export function mixHex(hex1,hex2,t){const[r1,g1,b1]=hexToRgb(hex1);const[r2,g2,b2]=hexToRgb(hex2);const r=Math.round(r1+(r2-r1)*t);const g=Math.round(g1+(g2-g1)*t);const b=Math.round(b1+(b2-b1)*t);return'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');}
export function luminance(hex){const[r,g,b]=hexToRgb(hex);return(0.299*r+0.587*g+0.114*b)/255;}
export function deriveVictoryTheme(bg,fg,ac,b2){
  const isLight=luminance(bg)>0.5;
  const [r,g,b]=hexToRgb(fg);
  const surface=b2||mixHex(bg,fg,0.06);
  return{
    '--bg':bg,
    '--b2':surface,
    '--sb':surface,
    '--cd':mixHex(bg,isLight?'#ffffff':'#000000',isLight?0.4:0.15),
    '--ac':ac,
    '--act':luminance(ac)>0.5?'#000000':'#ffffff',
    '--tx':fg,
    '--t2':mixHex(fg,bg,0.2),
    '--t3':`rgba(${r},${g},${b},0.38)`,
    '--br':`rgba(${r},${g},${b},0.12)`,
    '--rd':'0px',
    '--fn':'"Georgia","Times New Roman",serif'
  };
}
