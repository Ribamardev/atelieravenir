/* =====================================================================
   MOTOR DE ARTES — design system extraído das referências de mercado
   Formato 4:5 (1080x1350). Neutros + 1 cor forte, textura de papel/grão,
   tipografia mista (grotesca pesada, fina, condensada, serifada, cursiva,
   manuscrita), destaques em caixa, cabeçalho com 3 rótulos e rodapé com
   assinatura CRM/RQE.
   ===================================================================== */
const W = 1080, H = 1350, M = 80;

/* ---------- Fontes ---------- */
const F = {
  mont3:{fam:"Montserrat", w:300}, mont4:{fam:"Montserrat", w:400}, mont5:{fam:"Montserrat", w:500}, mont6:{fam:"Montserrat", w:600},
  mont7:{fam:"Montserrat", w:700}, mont8:{fam:"Montserrat", w:800}, mont9:{fam:"Montserrat", w:900},
  anton:{fam:"Anton", w:400}, osw3:{fam:"Oswald", w:300}, osw5:{fam:"Oswald", w:500},
  tight3:{fam:"Inter Tight", w:300}, tight4:{fam:"Inter Tight", w:400}, tight8:{fam:"Inter Tight", w:800},
  dms:{fam:"DM Serif Display", w:400}, dmsI:{fam:"DM Serif Display", w:400, it:true},
  play4:{fam:"Playfair Display", w:400}, playI9:{fam:"Playfair Display", w:900, it:true},
  popI3:{fam:"Poppins", w:300, it:true}, popI7:{fam:"Poppins", w:700, it:true}, popI9:{fam:"Poppins", w:900, it:true},
  vibes:{fam:"Great Vibes", w:400}, caveat:{fam:"Caveat", w:700}
};
function fstr(f, size){ return `${f.it?"italic ":""}${f.w} ${Math.round(size)}px "${f.fam}", system-ui, sans-serif`; }
function setF(ctx, f, size, ls){ ctx.font = fstr(f, size); if("letterSpacing" in ctx) ctx.letterSpacing = ((ls||0)*size).toFixed(2) + "px"; }
let fontsReady = null;
function loadFonts(){
  if(!fontsReady){
    fontsReady = Promise.all(Object.values(F).map(f=>document.fonts.load(fstr(f, 40), "ÁaZ")).concat([document.fonts.load(fstr(F.mont5,20))])).catch(()=>{});
  }
  return fontsReady;
}

/* ---------- Cores ---------- */
function hexToRgb(h){ h = String(h||"#000").replace("#",""); if(h.length===3) h = h.split("").map(c=>c+c).join(""); const n = parseInt(h,16)||0; return [(n>>16)&255,(n>>8)&255,n&255]; }
function rgbToHex(r,g,b){ return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join(""); }
function mix(a,b,t){ const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t); }
function rgba(h,a){ const c = hexToRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function lum(h){ const c = hexToRgb(h).map(v=>{ v/=255; return v<=.03928? v/12.92 : Math.pow((v+.055)/1.055,2.4); }); return .2126*c[0]+.7152*c[1]+.0722*c[2]; }
function contrast(a,b){ const x = lum(a), y = lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
function sat(h){ const [r,g,b] = hexToRgb(h); const mx = Math.max(r,g,b), mn = Math.min(r,g,b); return mx===0?0:(mx-mn)/mx; }
const INK = "#161616";
function onColor(bg){ return contrast(bg,"#FFFFFF") >= contrast(bg,INK) ? "#FFFFFF" : INK; }
function pickAcc(T, bg, min){
  min = min || 3;
  const c = [T.c1, T.c2, mix(T.c1,"#FFFFFF",.35), mix(T.c2,"#FFFFFF",.3), mix(T.c1,"#000000",.35)];
  for(const x of c) if(contrast(x,bg) >= min) return x;
  return onColor(bg);
}
function brightest(T){
  const c = [T.c2, T.c1].filter(x=>lum(x) > .3 && sat(x) > .25);
  return c[0] || "#F2E66B";
}

/* ---------- Aleatório estável (por post) ---------- */
function rng(seed){ let s = 0; for(const ch of String(seed)) s = (s*31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s*1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- Texturas ---------- */
let _noise = null, _lines = null, _scan = null;
function noiseTile(){
  if(_noise) return _noise;
  const c = document.createElement("canvas"); c.width = c.height = 220;
  const x = c.getContext("2d"), d = x.createImageData(220,220);
  for(let i=0;i<d.data.length;i+=4){ const v = 128 + (Math.random()-.5)*150; d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255; }
  x.putImageData(d,0,0); _noise = c; return c;
}
function grain(ctx, a){
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = ctx.createPattern(noiseTile(), "repeat"); ctx.fillRect(0,0,W,H); ctx.restore();
}
function scanlines(ctx, color, a){
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color;
  for(let y=0;y<H;y+=5) ctx.fillRect(0,y,W,1.6);
  ctx.restore();
}
function vignette(ctx, a, light){
  ctx.save();
  const g = ctx.createRadialGradient(W/2, H*.42, 120, W/2, H/2, H*.85);
  g.addColorStop(0, light ? "rgba(255,255,255,.35)" : "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H); ctx.restore();
}
function paper(ctx, base, g){ ctx.fillStyle = base; ctx.fillRect(0,0,W,H); vignette(ctx, .1, true); grain(ctx, g==null?.55:g); }

/* ---------- Imagens ---------- */
function drawCover(ctx, img, x, y, w, h, fx, fy, filter){
  const r = Math.max(w/img.width, h/img.height), iw = img.width*r, ih = img.height*r;
  const ox = x + (w-iw)*(fx==null?.5:fx), oy = y + (h-ih)*(fy==null?.3:fy);
  ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
  if(filter) ctx.filter = filter;
  ctx.drawImage(img, ox, oy, iw, ih); ctx.restore();
}
const _mono = new Map();
function monoLogo(img, color){
  const k = (img.src||"").length + "|" + img.width + "|" + color;
  if(_mono.has(k)) return _mono.get(k);
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d"); x.drawImage(img,0,0); x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0,0,c.width,c.height);
  _mono.set(k, c); return c;
}
/* logo: mode "orig" | cor (mono). Retorna largura desenhada */
function drawLogo(ctx, T, cx, y, h, mode, align){
  if(!T.logo){
    setF(ctx, F.mont8, h*.48, .02); ctx.fillStyle = mode==="orig" ? INK : mode;
    ctx.textAlign = align || "center"; ctx.textBaseline = "middle"; ctx.fillText(T.p.nome || "", cx, y + h/2);
    return ctx.measureText(T.p.nome||"").width;
  }
  const img = mode==="orig" ? T.logo : monoLogo(T.logo, mode);
  const ratio = T.logo.width / T.logo.height;
  let w = h*ratio; if(w > 300){ w = 300; h = w/ratio; }
  const x = align==="left" ? cx : align==="right" ? cx - w : cx - w/2;
  ctx.drawImage(img, x, y + (T._lh ? 0 : 0), w, h);
  return w;
}

/* ---------- Texto rico: *destaque* ---------- */
function parseRich(s){
  s = String(s||"").replace(/\s+/g," ").trim();
  const words = []; let em = false, gap = false;
  const parts = s.split("*");
  parts.forEach((p,i)=>{
    if(i>0) em = !em;
    const re = /(\s+)|([^\s]+)/g; let m;
    while((m = re.exec(p))){
      if(m[1]) { gap = true; continue; }
      words.push({t:m[2], em, gap: words.length ? gap : false}); gap = false;
    }
  });
  return words;
}
function plain(s){ return String(s||"").replace(/\*/g,""); }
/* sty(em) -> {f, color, ls, upper} */
function layoutRich(ctx, words, sty, size, maxW){
  const lines = [[]]; let lw = 0, widest = 0;
  for(const w of words){
    const st = sty(w.em); setF(ctx, st.f, size, st.ls);
    const txt = st.upper ? w.t.toLocaleUpperCase("pt-BR") : w.t;
    const ww = ctx.measureText(txt).width;
    setF(ctx, sty(false).f, size, sty(false).ls);
    const sp = ctx.measureText(" ").width * (st.spF || 1);
    let line = lines[lines.length-1];
    const add = (line.length && w.gap ? sp : 0) + ww;
    if(line.length && lw + add > maxW){
      // mantém pontuação/palavra colada junto da anterior
      const carry = [];
      if(!w.gap){ while(line.length > 1 && line[line.length-1] && carry.length < 3){ const r = line.pop(); carry.unshift(r); lw -= r.g + r.w; if(r.g) break; } }
      lines.push([]); line = lines[lines.length-1]; lw = 0;
      carry.forEach((r,k)=>{ if(k===0) r.g = 0; line.push(r); lw += r.g + r.w; });
    }
    const g = line.length && w.gap ? sp : 0;
    line.push({t:txt, em:w.em, w:ww, g}); lw += g + ww; widest = Math.max(widest, ww);
  }
  return {lines: lines.filter(l=>l.length), widest};
}
function fitRich(ctx, str, sty, maxW, maxH, maxS, minS, lh){
  const words = parseRich(str);
  if(!words.length) return {size:minS, lines:[], h:0, lh};
  let size = maxS, L;
  for(; size >= minS; size -= 2){
    L = layoutRich(ctx, words, sty, size, maxW);
    if(L.lines.length*size*lh <= maxH && L.widest <= maxW) break;
  }
  size = Math.max(size, minS);
  L = layoutRich(ctx, words, sty, size, maxW);
  let lines = L.lines; const maxL = Math.max(1, Math.floor(maxH/(size*lh)+.001));
  if(lines.length > maxL){ lines = lines.slice(0, maxL); const last = lines[maxL-1]; last[last.length-1].t = last[last.length-1].t.replace(/[,.;:!?]*$/,"") + "…"; }
  return {size, lines, h: lines.length*size*lh, lh};
}
function lineWidth(line){ return line.reduce((a,r)=>a+r.g+r.w,0); }
/* opts: align, box(em)->color|null, boxAll(color), pad, underline(em)->bool, shadow */
function drawRich(ctx, R, x, y, sty, opts){
  opts = opts || {}; const align = opts.align || "left";
  R.lines.forEach((line, li)=>{
    const lw = lineWidth(line);
    let cx = align==="center" ? x - lw/2 : align==="right" ? x - lw : x;
    const top = y + li*R.size*R.lh;
    const base = top + R.size*R.lh/2 + R.size*.34;
    // caixas
    let px = cx;
    const segs = [];
    line.forEach((r,ri)=>{ px += r.g; const s = segs[segs.length-1]; if(s && s.em===r.em && !opts.boxAll){ s.x2 = px + r.w; } else segs.push({em:r.em, x1:px, x2:px+r.w}); px += r.w; });
    const pad = opts.pad==null ? R.size*.12 : opts.pad;
    segs.forEach(s=>{
      const col = opts.boxAll ? opts.boxAll : (opts.box ? opts.box(s.em) : null);
      if(!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(s.x1 - pad, base - R.size*.82, (s.x2 - s.x1) + pad*2, R.size*1.0);
    });
    // texto
    px = cx;
    line.forEach(r=>{
      px += r.g; const st = sty(r.em); setF(ctx, st.f, R.size, st.ls);
      ctx.fillStyle = st.color; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      if(st.stroke){ ctx.lineJoin = "round"; ctx.strokeStyle = st.stroke; ctx.lineWidth = st.strokeW || 8; ctx.strokeText(r.t, px, base); }
      ctx.fillText(r.t, px, base);
      if(opts.underline && opts.underline(r.em)){ ctx.fillRect(px, base + R.size*.12, r.w + (0), Math.max(2, R.size*.05)); }
      px += r.w;
    });
  });
}
/* atalho: estilos base/destaque */
function S2(base, em){ return e => e ? em : base; }

/* ---------- Elementos ---------- */
function labelsRow(ctx, T, labels, color, f, y, opt){
  opt = opt || {};
  f = f || F.mont5; const size = opt.size || 24;
  setF(ctx, f, size, opt.ls==null ? .04 : opt.ls); ctx.fillStyle = color; ctx.textBaseline = "middle";
  const L = (labels||[]).map(l => (opt.lower ? String(l||"") : String(l||"").toLocaleUpperCase("pt-BR")));
  if(L[0]){ ctx.textAlign = "left"; ctx.fillText(L[0], M, y); }
  if(opt.centerLogo && T.logo){ drawLogo(ctx, T, W/2, y-22, 44, opt.centerLogo); }
  else if(L[1]){ ctx.textAlign = "center"; setF(ctx, f, size, opt.ls==null ? .04 : opt.ls); ctx.fillStyle = color; ctx.fillText(L[1], W/2, y); }
  if(L[2]){ ctx.textAlign = "right"; setF(ctx, f, size, opt.ls==null ? .04 : opt.ls); ctx.fillStyle = color; ctx.fillText(L[2], W-M, y); }
}
function signature(T){ return [T.p.medico, T.p.crm, T.p.rqe].filter(Boolean).join("  ·  "); }
function handle(T){ const h = String(T.p.instagram||"").trim(); return h ? (h[0]==="@"?h:"@"+h) : (T.p.cidade || ""); }
function footer(ctx, T, color, opt){
  opt = opt || {}; const y = opt.y || 1282;
  let size = opt.size || 21; const f = opt.f || F.mont6;
  const left = signature(T).toLocaleUpperCase("pt-BR"), right = (opt.right!=null ? opt.right : handle(T)).toLocaleUpperCase("pt-BR");
  setF(ctx, f, size, .05);
  const room = W - 2*M - (opt.logo ? 200 : 40);
  while(size > 14 && ctx.measureText(left).width + ctx.measureText(right).width > room){ size -= 1; setF(ctx, f, size, .05); }
  ctx.fillStyle = color; ctx.textBaseline = "middle";
  ctx.textAlign = "left"; ctx.fillText(left, M, y);
  ctx.textAlign = "right"; ctx.fillText(right, W-M, y);
  if(opt.logo) drawLogo(ctx, T, W/2, y-24, 48, opt.logo);
}
function swipe(ctx, color, y){
  setF(ctx, F.mont7, 19, .18); ctx.fillStyle = color; ctx.textBaseline = "middle"; ctx.textAlign = "center";
  const t = "ARRASTE PARA O LADO"; const w = ctx.measureText(t).width;
  ctx.fillText(t, W/2 - 24, y);
  const cx = W/2 + w/2 + 6, r = 20;
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, y, r, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-8, y); ctx.lineTo(cx+8, y); ctx.moveTo(cx+2, y-6); ctx.lineTo(cx+8, y); ctx.lineTo(cx+2, y+6); ctx.stroke();
}
function tornNote(ctx, text, cx, cy, ang, rnd, f){
  f = f || F.popI7; const size = 26;
  setF(ctx, f, size, 0);
  const lines = String(text||"").split(/\n/); const tw = Math.max(...lines.map(l=>ctx.measureText(l).width));
  const w = tw + 70, h = lines.length*size*1.15 + 44;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.shadowColor = "rgba(0,0,0,.28)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  ctx.beginPath(); const steps = 16;
  ctx.moveTo(-w/2, -h/2 + rnd()*6);
  for(let i=1;i<=steps;i++) ctx.lineTo(-w/2 + w*i/steps, -h/2 + (rnd()-.5)*10);
  for(let i=1;i<=5;i++) ctx.lineTo(w/2 + (rnd()-.5)*12, -h/2 + h*i/5);
  for(let i=steps-1;i>=0;i--) ctx.lineTo(-w/2 + w*i/steps, h/2 + (rnd()-.5)*10);
  for(let i=4;i>=1;i--) ctx.lineTo(-w/2 + (rnd()-.5)*12, -h/2 + h*i/5);
  ctx.closePath(); ctx.fillStyle = "#F4F4F2"; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.globalAlpha = .5; ctx.fillStyle = ctx.createPattern(noiseTile(),"repeat"); ctx.globalCompositeOperation = "multiply"; ctx.fill(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#4a4a4a"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; setF(ctx, f, size, 0);
  lines.forEach((l,i)=>ctx.fillText(l, 0, (i - (lines.length-1)/2)*size*1.15));
  ctx.restore();
  return {w, h};
}
function handArrow(ctx, x1, y1, x2, y2, color, bend){
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 4.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const mx = (x1+x2)/2 + (bend||60), my = (y1+y2)/2 - (bend||60)*.4;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(mx,my,x2,y2); ctx.stroke();
  const a = Math.atan2(y2-my, x2-mx), L = 22;
  ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2 - L*Math.cos(a-.5), y2 - L*Math.sin(a-.5));
  ctx.moveTo(x2,y2); ctx.lineTo(x2 - L*Math.cos(a+.5), y2 - L*Math.sin(a+.5)); ctx.stroke(); ctx.restore();
}
function scribble(ctx, cx, cy, rx, ry, color, rnd){
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = .9;
  for(let k=0;k<3;k++){
    ctx.beginPath();
    for(let t=0;t<=Math.PI*2.1;t+=.12){ const j = 1 + (rnd()-.5)*.06; const x = cx + Math.cos(t)*rx*j, y = cy + Math.sin(t)*ry*j; t===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }
    ctx.stroke();
  }
  ctx.restore();
}
function swoosh(ctx, x, y, w, color){
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.bezierCurveTo(x + w*.3, y - 4, x + w*.7, y - 2, x + w, y + 10); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + w*.12, y + 34); ctx.bezierCurveTo(x + w*.4, y + 18, x + w*.7, y + 20, x + w*.86, y + 28); ctx.stroke();
  ctx.restore();
}
function squares(ctx, list){ list.forEach(([x,y,s,c])=>{ ctx.fillStyle = c; ctx.fillRect(x,y,s,s); }); }
function ghostText(ctx, x, y, w, text, color, align){
  setF(ctx, F.mont4, 17, .06); ctx.fillStyle = color; ctx.textBaseline = "top"; ctx.textAlign = align || "left";
  const words = text.toLocaleUpperCase("pt-BR").split(" "); let line = "", yy = y;
  for(const wd of words){ const t = line ? line+" "+wd : wd; if(ctx.measureText(t).width > w && line){ ctx.fillText(line, align==="right"?x+w:x, yy); yy += 20; line = wd; } else line = t; }
  if(line) ctx.fillText(line, align==="right"?x+w:x, yy);
}
function techBlock(ctx, T, post, x, y, color, align){
  setF(ctx, F.mont6, 19, 0); ctx.fillStyle = color; ctx.textBaseline = "top"; ctx.textAlign = align || "left";
  const d = new Date(post.createdAt || Date.now());
  const L = ["Conteúdo educativo", "elaborado por", T.p.medico || "", "", T.p.crm || "", T.p.rqe || "", "", "Cód: " + String(post.code || 1).padStart(3,"0"), "Prod: " + d.toLocaleDateString("pt-BR")];
  L.forEach((l,i)=>{ if(l) ctx.fillText(l, x, y + i*23); });
}
function rr(ctx, x, y, w, h, r){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x,y,w,h,r); else { ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); } }

/* ---------- Conteúdo com fallback ---------- */
function coverFields(s){
  return {pre: s.pre || "", titulo: s.titulo || "", apoio: s.apoio || s.texto || "", nota: s.nota || "", palavra: s.palavra || ""};
}

/* =====================================================================
   ESTILOS
   ===================================================================== */
const TEMPLATES = [];
function tpl(def){ TEMPLATES.push(def); return def; }

/* 1 — IMPACTO: retrato escuro, texto pesado em caixa alta com destaque colorido */
tpl({id:"impacto", nome:"Impacto", desc:"Retrato escuro, frase fina + título pesado em caixa alta.", foto:true, dark:true, aiBg:true, photoBg:true,
  bg(ctx,T,ph){
    if(ph){
      drawCover(ctx, ph, 0, 0, W, H, .5, .2, "saturate(.92) contrast(1.06)");
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,"rgba(0,0,0,.45)"); g.addColorStop(.16,"rgba(0,0,0,0)"); g.addColorStop(.45,"rgba(6,6,8,.08)"); g.addColorStop(.7,"rgba(6,6,8,.86)"); g.addColorStop(1,"rgba(6,6,8,.97)");
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    } else {
      const g = ctx.createRadialGradient(W/2, 360, 40, W/2, 520, 1000); g.addColorStop(0,"#34373e"); g.addColorStop(.55,"#15161a"); g.addColorStop(1,"#060607");
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }
    grain(ctx,.45);
  },
  fg:"#FFFFFF", accBg:"#101010",
  cover(ctx,T,s,post,ph){
    const c = coverFields(s), acc = pickAcc(T,"#101010");
    labelsRow(ctx, T, post.topo, "rgba(255,255,255,.88)", F.mont4, 92, {centerLogo:"#FFFFFF"});
    const tS = S2({f:F.mont9, color:"#FFFFFF", ls:-.035, upper:true}, {f:F.mont9, color:acc, ls:-.035, upper:true});
    const R = fitRich(ctx, c.titulo, tS, 930, 420, 132, 62, .96);
    const pS = S2({f:F.mont3, color:"#FFFFFF", ls:-.02}, {f:F.mont7, color:"#FFFFFF", ls:-.02});
    const P = fitRich(ctx, c.pre, pS, 900, 150, 66, 38, 1.12);
    const aS = S2({f:F.mont4, color:"rgba(255,255,255,.82)", ls:0}, {f:F.mont7, color:"#FFFFFF", ls:0});
    const A = ph ? {h:0,lines:[]} : fitRich(ctx, c.apoio, aS, 760, 150, 38, 28, 1.3);
    const total = P.h + (P.h?14:0) + R.h + (A.h?44:0) + A.h;
    let y = ph ? 1172 - total : Math.max(200, (H - total)/2 + 20);
    drawRich(ctx, P, W/2, y, pS, {align:"center"}); y += P.h + (P.h?14:0);
    drawRich(ctx, R, W/2, y, tS, {align:"center"}); y += R.h + 44;
    if(A.h) drawRich(ctx, A, W/2, y, aS, {align:"center"});
    footer(ctx, T, "rgba(255,255,255,.82)");
  }
});

/* 2 — REVISTA: papel claro, serifada editorial, palavra em caixa, nota manuscrita */
tpl({id:"revista", nome:"Revista", desc:"Papel claro, serifada editorial e nota escrita à mão.", foto:false, dark:false,
  bg(ctx){ paper(ctx, "#EFEEEA", .6); }, fg:INK, accBg:"#EFEEEA",
  cover(ctx,T,s,post){
    const c = coverFields(s), acc = pickAcc(T,"#EFEEEA",3.2), soft = mix(acc,"#EFEEEA",.38);
    labelsRow(ctx, T, post.topo, acc, F.mont5, 78, {size:20, ls:.12});
    const pS = S2({f:F.dms, color:soft, ls:-.01}, {f:F.dmsI, color:acc, ls:-.01});
    const P = fitRich(ctx, c.pre, pS, 900, 210, 150, 70, 1.0);
    const tS = S2({f:F.dms, color:acc, ls:-.015}, {f:F.playI9, color:onColor(acc), ls:-.01});
    const R = fitRich(ctx, c.titulo, tS, 900, 430, 150, 66, 1.08);
    const aS = S2({f:F.tight3, color:INK, ls:-.02}, {f:F.tight8, color:INK, ls:-.02});
    const A = fitRich(ctx, c.apoio, aS, 760, 160, 44, 30, 1.1);
    const noteH = c.nota ? 120 : 0;
    const total = P.h + R.h + 20 + (A.h?46:0) + A.h + noteH;
    let y = Math.max(150, 150 + (1080 - total)/2);
    drawRich(ctx, P, W/2, y, pS, {align:"center"}); y += P.h + 10;
    drawRich(ctx, R, W/2, y, tS, {align:"center", box:e=>e?acc:null, pad:R.size*.14}); y += R.h + 46;
    if(A.h){ drawRich(ctx, A, W/2, y, aS, {align:"center"}); y += A.h + 40; }
    if(c.nota){
      ctx.save(); ctx.translate(W/2 + 120, y + 40); ctx.rotate(-.11);
      const nS = S2({f:F.caveat, color:"#1d1d1d", ls:0}, {f:F.caveat, color:acc, ls:0});
      const N = fitRich(ctx, c.nota, nS, 520, 120, 58, 36, 1.0);
      drawRich(ctx, N, 0, -N.h/2, nS, {align:"center"}); ctx.restore();
    }
    footer(ctx, T, rgba(acc,.9), {logo:"orig"});
  }
});

/* 3 — PÔSTER: fundo de cor sólida, condensada gigante, palavra cursiva por cima, bloco técnico */
tpl({id:"poster", nome:"Pôster", desc:"Cor forte de fundo, letra condensada gigante e palavra cursiva.", foto:false, dark:true,
  bg(ctx,T){ ctx.fillStyle = T.c1; ctx.fillRect(0,0,W,H); scanlines(ctx, lum(T.c1)>.4?"#000":"#FFF", .05); grain(ctx,.5); vignette(ctx,.18); },
  fg:null,
  cover(ctx,T,s,post){
    const c = coverFields(s), fg = onColor(T.c1), emC = contrast(T.c2,T.c1) >= 2.2 ? T.c2 : fg;
    labelsRow(ctx, T, post.topo, fg, F.play4, 80, {size:22, ls:.06, centerLogo:fg});
    const pS = S2({f:F.osw3, color:fg, ls:.0, upper:true}, {f:F.osw5, color:emC, ls:0, upper:true});
    const P = fitRich(ctx, c.pre, pS, 900, 170, 84, 44, 1.02);
    const tS = S2({f:F.anton, color:fg, ls:-.005, upper:true}, {f:F.anton, color:emC, ls:-.005, upper:true});
    const R = fitRich(ctx, c.titulo, tS, 950, 520, 280, 110, .9);
    let y = 160;
    drawRich(ctx, P, W/2, y, pS, {align:"center"}); y += P.h + 6;
    drawRich(ctx, R, W/2, y, tS, {align:"center"}); y += R.h;
    if(c.palavra){
      const vS = S2({f:F.vibes, color:fg, stroke:T.c1, strokeW:16}, {f:F.vibes, color:fg, stroke:T.c1, strokeW:16});
      const V = fitRich(ctx, plain(c.palavra), vS, 860, 230, 210, 110, 1.0);
      ctx.save(); ctx.translate(W/2 + 30, y - V.size*.08); ctx.rotate(-.08);
      drawRich(ctx, V, 0, -V.h/2, vS, {align:"center"}); ctx.restore();
      y += V.size*.5;
    }
    y = Math.max(y + 40, 860);
    techBlock(ctx, T, post, M, Math.min(y, 1000), fg);
    const aS = S2({f:F.osw3, color:fg, ls:0}, {f:F.osw5, color:emC, ls:0});
    const A = fitRich(ctx, c.apoio, aS, 470, 1190 - Math.min(y,1000), 58, 34, 1.15);
    drawRich(ctx, A, W-M, Math.min(y,1000), aS, {align:"right"});
    footer(ctx, T, fg, {f:F.play4, size:20});
  }
});

/* 4 — CLAREZA: minimalista, grotesca apertada à esquerda, muito respiro */
tpl({id:"clareza", nome:"Clareza", desc:"Minimalista: título grande alinhado à esquerda e muito respiro.", foto:false, dark:false,
  bg(ctx){ paper(ctx, "#F1F1EF", .75); }, fg:INK,
  cover(ctx,T,s,post){
    const c = coverFields(s), acc = pickAcc(T,"#F1F1EF",3.2);
    const nome = T.p.nome || ""; const parts = nome.split(" ");
    const nm = parts.length > 1 ? parts.slice(0,-1).join(" ") + " *" + parts[parts.length-1] + "*" : "*" + nome + "*";
    const hS = S2({f:F.tight4, color:INK, ls:-.01}, {f:F.tight8, color:INK, ls:-.01});
    drawRich(ctx, fitRich(ctx, nm, hS, 520, 40, 25, 18, 1.2), M+10, 72, hS);
    setF(ctx, F.tight4, 25, -.01); ctx.fillStyle = INK; ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(handle(T), W-M-10, 96);
    const pre = c.pre ? c.pre + " " : "";
    const tS = S2({f:F.tight8, color:"#111111", ls:-.05}, {f:F.tight8, color:acc, ls:-.05});
    const R = fitRich(ctx, (c.titulo), tS, 900, 520, 156, 70, .98);
    let y = 300;
    if(c.pre){ const pS = S2({f:F.tight3, color:"#111", ls:-.03}, {f:F.tight8, color:"#111", ls:-.03}); const P = fitRich(ctx, c.pre, pS, 880, 140, 60, 36, 1.05); drawRich(ctx, P, M+10, y - P.h - 24, pS); }
    drawRich(ctx, R, M+10, y, tS); y += R.h + 80;
    const aS = S2({f:F.tight3, color:"#111111", ls:-.04}, {f:F.tight8, color:"#111111", ls:-.04});
    const A = fitRich(ctx, c.apoio, aS, 660, 1100 - y, 54, 32, 1.02);
    drawRich(ctx, A, M+10, y, aS);
    if(T.logo) drawLogo(ctx, T, W-M-10, 1130, 64, "orig", "right");
    else { ctx.fillStyle = acc; ctx.fillRect(W-M-46, 1150, 36, 36); }
    footer(ctx, T, "#333", {right:""});
  }
});

/* 5 — MARCA-TEXTO: fundo escuro/foto P&B, palavras em caixas amarelas, título misto fino/pesado */
tpl({id:"marca", nome:"Marca-texto", desc:"Foto em preto e branco, palavras grifadas e título fino + pesado.", foto:true, dark:true, aiBg:true, photoBg:true,
  bg(ctx,T,ph){
    if(ph){ drawCover(ctx, ph, 0, 0, W, H, .5, .25, "grayscale(1) contrast(1.25) brightness(.52)"); }
    else { ctx.fillStyle = "#151515"; ctx.fillRect(0,0,W,H); const g = ctx.createRadialGradient(W*.7, H*.35, 50, W*.6, H*.5, 900); g.addColorStop(0,"#2c2c2c"); g.addColorStop(1,"#0e0e0e"); ctx.fillStyle = g; ctx.fillRect(0,0,W,H); }
    grain(ctx,.55);
  },
  fg:"#FFFFFF",
  cover(ctx,T,s,post,ph){
    const c = coverFields(s), hl = brightest(T);
    if(T.logo) drawLogo(ctx, T, W/2, 64, 50, "#FFFFFF"); else { setF(ctx, F.mont5, 26, .02); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(handle(T).toLocaleUpperCase("pt-BR"), W/2, 92); }
    let y = 200;
    if(c.pre){
      const pS = S2({f:F.dms, color:"#141414", ls:0, spF:1.9}, {f:F.dmsI, color:"#141414", ls:0, spF:1.9});
      const P = fitRich(ctx, plain(c.pre), pS, 880, 200, 64, 40, 1.45);
      drawRich(ctx, P, W/2, y, pS, {align:"center", boxAll:hl, pad:12}); y += P.h + 60;
    }
    const tS = S2({f:F.mont3, color:"#FFFFFF", ls:-.03, upper:true}, {f:F.mont9, color:hl, ls:-.04, upper:true});
    const R = fitRich(ctx, c.titulo, tS, 900, 560, 160, 70, .92);
    const aS = S2({f:F.mont4, color:"rgba(255,255,255,.86)", ls:0}, {f:F.mont7, color:hl, ls:0});
    const A = fitRich(ctx, c.apoio, aS, 640, 170, 38, 28, 1.25);
    const ty = Math.max(y, 1150 - R.h - (A.h? A.h + 40 : 0) - (post.formato==="carrossel"?60:0));
    drawRich(ctx, R, M+10, ty, tS);
    if(A.h) drawRich(ctx, A, M+10, ty + R.h + 40, aS);
    footer(ctx, T, "rgba(255,255,255,.82)");
  }
});

/* 6 — ITÁLICO: cinza granulado, itálico pesado, papel rasgado e seta à mão */
tpl({id:"italico", nome:"Itálico", desc:"Cinza granulado, itálico pesado, papel rasgado e seta à mão.", foto:false, dark:false,
  bg(ctx){
    const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,"#F2F2F2"); g.addColorStop(1,"#D9D9D9"); ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    const r = ctx.createRadialGradient(W/2,0,10,W/2,0,700); r.addColorStop(0,"rgba(255,255,255,.7)"); r.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle = r; ctx.fillRect(0,0,W,H);
    grain(ctx,.7);
  }, fg:"#383838",
  cover(ctx,T,s,post){
    const c = coverFields(s), acc = pickAcc(T,"#E6E6E6",3), rnd = rng(post.id);
    drawLogo(ctx, T, W/2, 70, 52, "orig");
    const tS = S2({f:F.popI9, color:"#383838", ls:-.03}, {f:F.popI9, color:acc, ls:-.03});
    const R = fitRich(ctx, c.titulo, tS, 900, 440, 156, 70, .92);
    let y = 230;
    if(c.pre){ const pS = S2({f:F.popI3, color:"#4a4a4a", ls:-.01}, {f:F.popI7, color:"#4a4a4a", ls:-.01}); const P = fitRich(ctx, c.pre, pS, 860, 120, 54, 34, 1.1); drawRich(ctx, P, W/2, y, pS, {align:"center"}); y += P.h + 16; }
    drawRich(ctx, R, W/2, y, tS, {align:"center"}); y += R.h + 50;
    const aS = S2({f:F.popI3, color:"#4d4d4d", ls:0}, {f:F.popI7, color:"#3d3d3d", ls:0});
    const A = fitRich(ctx, c.apoio, aS, 760, 200, 40, 28, 1.28);
    drawRich(ctx, A, W/2, y, aS, {align:"center"}); y += A.h;
    const note = c.nota || "salve para não esquecer!";
    const ny = Math.min(Math.max(y + 140, 960), 1110);
    const words = note.split(" "); const half = Math.ceil(words.length/2);
    tornNote(ctx, words.length > 3 ? words.slice(0,half).join(" ") + "\n" + words.slice(half).join(" ") : note, 760, ny, -.14, rnd);
    handArrow(ctx, 380, ny - 70, 590, ny - 10, acc, -50);
    setF(ctx, F.mont7, 21, .02); ctx.fillStyle = "#2f2f2f"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const h = handle(T); const hw = ctx.measureText(h).width;
    ctx.fillText(h, W/2, 1236); ctx.fillRect(W/2 - hw/2 - 86, 1235, 66, 2); ctx.fillRect(W/2 + hw/2 + 20, 1235, 66, 2);
    setF(ctx, F.mont5, 17, .06); ctx.fillStyle = "#555"; ctx.fillText(signature(T).toLocaleUpperCase("pt-BR"), W/2, 1282);
  },
  footerOverride:true
});

/* 7 — LATERAL: foto à direita esmaecendo, título enorme colorido à esquerda */
tpl({id:"lateral", nome:"Lateral", desc:"Foto à direita esmaecendo no papel, título enorme na cor da marca.", foto:true, dark:false,
  bg(ctx,T,ph){
    paper(ctx, "#ECECEB", .55);
    if(ph){
      drawCover(ctx, ph, 360, 0, W-360, H, .5, .25, "contrast(1.04)");
      const g = ctx.createLinearGradient(360,0,760,0); g.addColorStop(0,"rgba(236,236,235,1)"); g.addColorStop(1,"rgba(236,236,235,0)"); ctx.fillStyle = g; ctx.fillRect(360,0,400,H);
      const b = ctx.createLinearGradient(0,H-260,0,H); b.addColorStop(0,"rgba(236,236,235,0)"); b.addColorStop(1,"rgba(236,236,235,.95)"); ctx.fillStyle = b; ctx.fillRect(0,H-260,W,260);
      grain(ctx,.35);
    } else {
      ctx.save(); ctx.filter = "blur(10px)"; setF(ctx, F.mont9, 620, -.06); ctx.fillStyle = "#D3D3D2"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      const ini = (T.p.nome||"A").replace(/^(cl[ií]nica|consult[óo]rio|instituto|centro)\s+/i,"").trim().slice(0,2).toUpperCase(); ctx.fillText(ini, 560, 1060); ctx.restore();
    }
  }, fg:INK,
  cover(ctx,T,s,post,ph){
    const c = coverFields(s), acc = pickAcc(T,"#ECECEB",3.2);
    labelsRow(ctx, T, post.topo, "#1b1b1b", F.mont4, 80, {size:24});
    ghostText(ctx, M, 150, 300, plain(c.apoio || c.titulo).slice(0,90), "rgba(0,0,0,.16)");
    if(!ph) ghostText(ctx, W-M-300, 150, 300, plain(c.apoio || c.titulo).slice(0,90), "rgba(0,0,0,.16)", "right");
    squares(ctx, [[640,300,18,acc],[M-36,600,18,"#111"],[W-130,760,14,"#111"],[690,1010,16,acc]]);
    const pS = S2({f:F.mont3, color:"#1a1a1a", ls:-.02}, {f:F.mont8, color:"#1a1a1a", ls:-.02});
    const P = fitRich(ctx, c.pre, pS, 600, 170, 62, 38, 1.04);
    const tS = S2({f:F.mont9, color:acc, ls:-.04, upper:true}, {f:F.mont9, color:"#1a1a1a", ls:-.04, upper:true});
    const R = fitRich(ctx, c.titulo, tS, ph ? 640 : 900, 470, 176, 74, .88);
    const aS = S2({f:F.mont3, color:"#1a1a1a", ls:-.02}, {f:F.mont8, color:"#1a1a1a", ls:-.02});
    const A = fitRich(ctx, c.apoio, aS, 560, 180, 52, 32, 1.08);
    const total = P.h + 16 + R.h + 26 + A.h;
    let y = Math.max(330, 640 - total/2);
    drawRich(ctx, P, M, y, pS); y += P.h + 16;
    drawRich(ctx, R, M - 4, y, tS); y += R.h + 26;
    drawRich(ctx, A, M, y, aS, {underline:e=>e});
    footer(ctx, T, "#1b1b1b");
  }
});

/* 8 — ESTÚDIO: luz de estúdio, título claro, caixa de texto translúcida, chip de vidro */
tpl({id:"estudio", nome:"Estúdio", desc:"Cena de estúdio com objeto do tema, título claro e caixa translúcida.", foto:false, dark:true, aiBg:true,
  bg(ctx){
    const g = ctx.createRadialGradient(W/2, 470, 30, W/2, 560, 980); g.addColorStop(0,"#5d5e61"); g.addColorStop(.5,"#2a2b2e"); g.addColorStop(1,"#0f0f11");
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.filter = "blur(30px)"; ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.ellipse(W/2, 1080, 420, 70, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
    grain(ctx,.5);
  }, fg:"#F4F4F4",
  cover(ctx,T,s,post){
    const c = coverFields(s), acc = pickAcc(T,"#2a2b2e",3);
    labelsRow(ctx, T, post.topo, "rgba(255,255,255,.7)", F.mont4, 82, {size:22, centerLogo:"rgba(255,255,255,.85)"});
    const tS = S2({f:F.mont8, color:"#F3F3F3", ls:-.03}, {f:F.mont8, color:acc, ls:-.03});
    const R = fitRich(ctx, (c.pre ? c.pre + " " : "") + c.titulo, tS, 900, 470, 150, 70, 1.0);
    let y = 200;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    drawRich(ctx, R, W/2, y, tS, {align:"center"}); ctx.restore(); y += R.h + 110;
    const aS = S2({f:F.mont4, color:"#1c1c1c", ls:-.01}, {f:F.mont7, color:"#1c1c1c", ls:-.01});
    const A = fitRich(ctx, c.apoio, aS, 700, 220, 42, 28, 1.25);
    if(A.h){
      const bw = Math.max(...A.lines.map(lineWidth)) + 80, bh = A.h + 50;
      y = Math.min(y, 1050 - bh);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14; ctx.fillStyle = "rgba(244,244,244,.9)"; rr(ctx, W/2-bw/2, y, bw, bh, 6); ctx.fill(); ctx.restore();
      drawRich(ctx, A, W/2, y + 25, aS, {align:"center"}); y += bh + 50;
    }
    // chip de vidro
    const chip = (T.p.medico || T.p.nome || "") ; setF(ctx, F.mont6, 21, 0); const cw = ctx.measureText(chip).width + 110;
    const cy = Math.min(y, 1130);
    ctx.fillStyle = "rgba(255,255,255,.12)"; rr(ctx, W/2 - cw/2, cy, cw, 64, 32); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(W/2 - cw/2 + 34, cy + 32, 17, 0, Math.PI*2); ctx.fill();
    setF(ctx, F.mont8, 16, 0); ctx.fillStyle = onColor(acc); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText((chip.replace(/^(dra?\.?\s+)/i,"")[0]||"").toUpperCase(), W/2 - cw/2 + 34, cy + 33);
    setF(ctx, F.mont6, 21, 0); ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.textAlign = "left"; ctx.fillText(chip, W/2 - cw/2 + 64, cy + 33);
    footer(ctx, T, "rgba(255,255,255,.72)");
  }
});

/* 9 — FAIXA: fino + palavra em caixa, faixa de foto P&B, título pesado */
tpl({id:"faixa", nome:"Faixa", desc:"Frase fina com palavra em caixa, faixa de foto P&B e título pesado.", foto:true, dark:false, bandBg:true,
  bg(ctx){ paper(ctx, "#E8E8E7", .6); }, fg:INK,
  cover(ctx,T,s,post,ph,A){
    const c = coverFields(s), acc = pickAcc(T,"#E8E8E7",3), rnd = rng(post.id);
    labelsRow(ctx, T, post.topo, "#1b1b1b", F.mont4, 80, {size:24});
    const pS = S2({f:F.tight3, color:"#1a1a1a", ls:-.035}, {f:F.mont9, color:onColor(acc), ls:-.04});
    const P = fitRich(ctx, c.pre || c.titulo, pS, 900, 240, 96, 52, 1.0);
    let y = 160;
    drawRich(ctx, P, W/2, y, pS, {align:"center", box:e=>e?acc:null, pad:P.size*.16}); y += P.h + 26;
    const band = ph || (A && A.bg);
    if(band){ drawCover(ctx, band, 110, y, 860, 300, .5, .4, "grayscale(1) contrast(1.15)"); grainRect(ctx, 110, y, 860, 300); y += 330; }
    else { swoosh(ctx, W/2 - 300, y + 10, 600, acc); y += 90; }
    const tS = S2({f:F.mont9, color:"#161616", ls:-.04, upper:true}, {f:F.mont9, color:acc, ls:-.04, upper:true});
    const R = fitRich(ctx, c.pre ? c.titulo : c.apoio, tS, 860, 1150 - y - 120, 150, 60, .92);
    drawRich(ctx, R, 110, y, tS); y += R.h + 34;
    if(c.pre){ const aS = S2({f:F.tight4, color:"#1a1a1a", ls:-.02}, {f:F.tight8, color:"#1a1a1a", ls:-.02}); const A = fitRich(ctx, c.apoio, aS, 800, Math.max(40, 1180 - y), 42, 26, 1.1); drawRich(ctx, A, 110, y, aS); }
    footer(ctx, T, "#1b1b1b");
  }
});

/* 10 — RECORTE: título gigante atrás da pessoa recortada (precisa de foto) */
tpl({id:"recorte", nome:"Recorte", desc:"Título gigante com você recortado na frente das letras.", foto:true, dark:true, needsCut:true,
  bg(ctx,T){ ctx.fillStyle = T.c1; ctx.fillRect(0,0,W,H); const g = ctx.createRadialGradient(W/2, H*.62, 60, W/2, H*.6, 900); g.addColorStop(0,"rgba(255,255,255,.22)"); g.addColorStop(1,"rgba(0,0,0,.28)"); ctx.fillStyle = g; ctx.fillRect(0,0,W,H); scanlines(ctx, lum(T.c1)>.4?"#000":"#FFF", .04); grain(ctx,.5); },
  fg:null,
  cover(ctx,T,s,post,ph,A){
    const c = coverFields(s), fg = onColor(T.c1), emC = contrast(T.c2,T.c1) >= 2.2 ? T.c2 : fg;
    labelsRow(ctx, T, post.topo, fg, F.mont5, 80, {size:22, centerLogo:fg});
    const pS = S2({f:F.osw3, color:fg, ls:0, upper:true}, {f:F.osw5, color:emC, ls:0, upper:true});
    const P = fitRich(ctx, c.pre, pS, 900, 110, 70, 40, 1.0);
    const tS = S2({f:F.anton, color:fg, ls:-.005, upper:true}, {f:F.anton, color:emC, ls:-.005, upper:true});
    const R = fitRich(ctx, c.titulo, tS, 960, 470, 300, 120, .88);
    let y = 150;
    drawRich(ctx, P, W/2, y, pS, {align:"center"}); y += P.h + 4;
    drawRich(ctx, R, W/2, y, tS, {align:"center"});
    const titleBottom = y + R.h;
    const cut = A && A.cut;
    if(cut){
      const top = Math.max(300, y + R.h*.42);
      const h = H - top, w = h * cut.width / cut.height;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
      ctx.drawImage(cut, W/2 - w/2, top, w, h); ctx.restore();
      const fade = ctx.createLinearGradient(0, H-300, 0, H); fade.addColorStop(0,"rgba(0,0,0,0)"); fade.addColorStop(1, rgba(T.c1,.95));
      ctx.fillStyle = fade; ctx.fillRect(0, H-300, W, 300);
    } else if(ph){
      const top = titleBottom + 30, bh = 1160 - top;
      if(bh > 200){ drawCover(ctx, ph, 150, top, 780, bh, .5, .25); }
    }
    if(c.apoio){
      const aS = S2({f:F.mont5, color:fg, ls:0}, {f:F.mont8, color:emC, ls:0});
      const Ap = fitRich(ctx, c.apoio, aS, 300, 220, 30, 22, 1.25);
      drawRich(ctx, Ap, W-M, 1150 - Ap.h - (post.formato==="carrossel"?50:0), aS, {align:"right"});
    }
    if(c.palavra && !cut){}
    footer(ctx, T, fg);
  }
});

function grainRect(ctx, x, y, w, h){ ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip(); grain(ctx,.5); ctx.restore(); }

/* ---------- Lâmina interna e lâmina final (mesma linguagem do estilo) ---------- */
function themeOf(t, T){
  const solid = t.id==="poster" || t.id==="recorte";
  const dark = solid ? lum(T.c1) < .4 : t.dark;
  const bgCol = solid ? T.c1 : t.dark ? "#1a1a1a" : "#ECECEB";
  const fg = solid ? onColor(T.c1) : dark ? "#F4F4F4" : "#161616";
  const acc = solid ? (contrast(T.c2,T.c1) >= 2.2 ? T.c2 : fg) : t.id==="marca" ? brightest(T) : pickAcc(T, bgCol, 3);
  const fonts = {
    impacto:{d:F.mont9, dU:true, b:F.mont3, bb:F.mont7, ls:-.035},
    revista:{d:F.dms, dU:false, b:F.tight3, bb:F.tight8, ls:-.01},
    poster:{d:F.anton, dU:true, b:F.osw3, bb:F.osw5, ls:0},
    clareza:{d:F.tight8, dU:false, b:F.tight3, bb:F.tight8, ls:-.05},
    marca:{d:F.mont9, dU:true, b:F.mont4, bb:F.mont7, ls:-.04},
    italico:{d:F.popI9, dU:false, b:F.popI3, bb:F.popI7, ls:-.03},
    lateral:{d:F.mont9, dU:true, b:F.mont3, bb:F.mont8, ls:-.04},
    estudio:{d:F.mont8, dU:false, b:F.mont4, bb:F.mont7, ls:-.03},
    faixa:{d:F.mont9, dU:true, b:F.tight3, bb:F.tight8, ls:-.04},
    recorte:{d:F.anton, dU:true, b:F.osw3, bb:F.osw5, ls:0}
  }[t.id];
  return {dark, bgCol, fg, acc, fonts};
}
function innerSlide(ctx, t, T, s, post, i, n){
  const th = themeOf(t, T), fo = th.fonts;
  t.bg(ctx, T, null);
  labelsRow(ctx, T, [post.topo && post.topo[0], post.topo && post.topo[1], (i+1)+"/"+n], th.dark ? "rgba(255,255,255,.75)" : "rgba(0,0,0,.7)", (t.id==="poster"||t.id==="recorte")?F.play4:F.mont5, 82, {size:22, centerLogo: th.dark ? "rgba(255,255,255,.85)" : null});
  const numF = (t.id==="poster"||t.id==="recorte") ? F.anton : t.id==="revista" ? F.dmsI : t.id==="italico" ? F.popI9 : F.mont9;
  setF(ctx, numF, 190, -.03); ctx.fillStyle = th.acc; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText(String(i+1).padStart(2,"0"), M-6, 330);
  const tS = S2({f:fo.d, color:th.fg, ls:fo.ls, upper:fo.dU}, {f:fo.d, color:th.acc, ls:fo.ls, upper:fo.dU});
  const R = fitRich(ctx, s.titulo, tS, 920, 330, (t.id==="poster"||t.id==="recorte")?150:100, 54, (t.id==="poster"||t.id==="recorte")?.92:1.02);
  let y = 390; drawRich(ctx, R, M, y, tS); y += R.h + 44;
  const bS = S2({f:fo.b, color:th.dark ? "rgba(255,255,255,.88)" : "#2a2a2a", ls:-.01}, {f:fo.bb, color:th.fg, ls:-.01});
  const items = Array.isArray(s.itens) ? s.itens.filter(x=>x && (x.rotulo || x.texto)).slice(0,4) : [];
  const room = 1180 - y - items.length*110;
  if(s.texto){ const B = fitRich(ctx, s.texto, bS, 900, Math.max(80, room), 46, 28, 1.32); drawRich(ctx, B, M, y, bS); y += B.h + 40; }
  items.forEach(it=>{
    const line = `*${plain(it.rotulo)}:* ${plain(it.texto)}`;
    const iS = S2({f:fo.b, color:th.dark ? "rgba(255,255,255,.88)" : "#2a2a2a", ls:-.01}, {f:fo.bb, color:th.acc, ls:-.01});
    const I = fitRich(ctx, line, iS, 860, 100, 38, 26, 1.25);
    ctx.fillStyle = th.acc; ctx.fillRect(M, y + I.size*.45, 14, 14);
    drawRich(ctx, I, M + 40, y, iS); y += I.h + 22;
  });
  footer(ctx, T, th.dark ? "rgba(255,255,255,.75)" : "#333");
}
function ctaSlide(ctx, t, T, post, i, n){
  const th = themeOf(t, T), fo = th.fonts;
  t.bg(ctx, T, null);
  labelsRow(ctx, T, [post.topo && post.topo[0], "", (i+1)+"/"+n], th.dark ? "rgba(255,255,255,.75)" : "rgba(0,0,0,.7)", (t.id==="poster"||t.id==="recorte")?F.play4:F.mont5, 82, {size:22});
  drawLogo(ctx, T, W/2, 220, 110, th.dark ? "#FFFFFF" : "orig");
  const pS = S2({f:fo.b, color:th.fg, ls:-.01}, {f:fo.bb, color:th.fg, ls:-.01});
  const P = fitRich(ctx, "Ficou com *alguma dúvida?*", pS, 860, 90, 56, 36, 1.1);
  drawRich(ctx, P, W/2, 450, pS, {align:"center"});
  const cta = post.cta ? post.cta.replace(/\*/g,"") : "Agende sua consulta";
  const ws = cta.split(" "); const last = ws.pop();
  const tS = S2({f:fo.d, color:th.fg, ls:fo.ls, upper:fo.dU}, {f:fo.d, color:th.acc, ls:fo.ls, upper:fo.dU});
  const R = fitRich(ctx, (ws.length ? ws.join(" ") + " " : "") + "*" + last + "*", tS, 900, 320, (t.id==="poster"||t.id==="recorte")?190:130, 60, (t.id==="poster"||t.id==="recorte")?.9:1.0);
  drawRich(ctx, R, W/2, 560, tS, {align:"center"});
  let y = 560 + R.h + 60;
  const wa = T.p.whatsapp ? "WhatsApp  " + T.p.whatsapp : "Fale com a nossa equipe";
  setF(ctx, F.mont7, 38, .01); const ww = Math.min(W-2*M, ctx.measureText(wa).width + 90);
  ctx.fillStyle = th.acc; rr(ctx, W/2-ww/2, y, ww, 92, 46); ctx.fill();
  ctx.fillStyle = onColor(th.acc); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(wa, W/2, y+48);
  y += 140;
  setF(ctx, F.mont5, 30, .02); ctx.fillStyle = th.dark ? "rgba(255,255,255,.8)" : "#444";
  ctx.fillText([T.p.nome, T.p.cidade].filter(Boolean).join("  ·  "), W/2, y);
  footer(ctx, T, th.dark ? "rgba(255,255,255,.75)" : "#333", {right: handle(T)});
}

/* ---------- Render de uma lâmina ---------- */
function slidesFor(post){
  const s = post.slides || [];
  if(post.formato === "carrossel") return s.map((x,i)=>Object.assign({kind: i===0?"capa":"interna"}, x)).concat([{kind:"cta"}]);
  return [Object.assign({kind:"capa"}, s[0] || {})];
}
function getTpl(id){ return TEMPLATES.find(t=>t.id===id) || TEMPLATES[0]; }
/* A = {ph: foto do médico, bg: fundo gerado por IA, cut: recorte da pessoa (PNG transparente)} */
function drawAIBg(ctx, t, img){
  drawCover(ctx, img, 0, 0, W, H, .5, .5, t.dark ? "contrast(1.05)" : "contrast(1.02)");
  const g = ctx.createLinearGradient(0,0,0,H);
  if(t.dark){ g.addColorStop(0,"rgba(0,0,0,.45)"); g.addColorStop(.35,"rgba(0,0,0,.15)"); g.addColorStop(.7,"rgba(0,0,0,.55)"); g.addColorStop(1,"rgba(0,0,0,.85)"); }
  else { g.addColorStop(0,"rgba(255,255,255,.55)"); g.addColorStop(.5,"rgba(255,255,255,.2)"); g.addColorStop(1,"rgba(255,255,255,.65)"); }
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  grain(ctx,.4);
}
function drawSlide(ctx, post, i, T, A){
  if(A && A.width) A = {ph:A};
  A = A || {};
  const t = getTpl(post.tpl), list = slidesFor(post), sl = list[i], n = list.length;
  ctx.save(); ctx.clearRect(0,0,W,H);
  if(sl.kind === "capa"){
    const usePh = t.foto ? A.ph || null : null;
    if(t.aiBg && A.bg && !(usePh && t.photoBg)) drawAIBg(ctx, t, A.bg);
    else t.bg(ctx, T, usePh, A);
    t.cover(ctx, T, sl, post, usePh, A);
    if(n > 1){ const col = t.dark ? "rgba(255,255,255,.9)" : "#222"; swipe(ctx, t.id==="poster" || t.id==="recorte" ? onColor(T.c1) : col, 1214); }
  } else if(sl.kind === "interna") innerSlide(ctx, t, T, sl, post, i, n);
  else ctaSlide(ctx, t, T, post, i, n);
  ctx.restore();
}
