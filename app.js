(function(){
'use strict';

// URL de tu Worker en Cloudflare (cuando lo tengas desplegado)
const WORKER_URL = 'https://bubbletree-api.tunombre.workers.dev';

const LINKSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
const NET = {
  whatsapp:{n:'WhatsApp',c:'#25D366',h:'https://wa.me/'},
  instagram:{n:'Instagram',c:'linear-gradient(45deg,#F9A03F,#E1306C,#7B3FE4)',h:'https://instagram.com/'},
  tiktok:{n:'TikTok',c:'#111',h:'https://tiktok.com/@'},
  spotify:{n:'Spotify',c:'#1DB954'},
  youtube:{n:'YouTube',c:'#E52D27',h:'https://youtube.com/@'},
  facebook:{n:'Facebook',c:'#1877F2',h:'https://facebook.com/'},
  x:{n:'X',c:'#111',h:'https://x.com/'},
  telegram:{n:'Telegram',c:'#26A5E4',h:'https://t.me/'},
  twitch:{n:'Twitch',c:'#9146FF',h:'https://twitch.tv/'},
  discord:{n:'Discord',c:'#5865F2'},
  github:{n:'GitHub',c:'#2B3137',h:'https://github.com/'},
  link:{n:'Sitio web',c:'#5B3DF5'}
};
const GLOW = {whatsapp:'#25D366',instagram:'#E1306C',tiktok:'#69C9D0',spotify:'#1DB954',youtube:'#FF3B30',facebook:'#1877F2',x:'#fff',telegram:'#26A5E4',twitch:'#9146FF',discord:'#5865F2',github:'#fff',link:'#7C5CFF'};
const TH = {
  oscuro:{n:'Oscuro',bg:'#15131F',fg:'#fff',b1:['#fff','#15131F'],b2:['transparent','#fff','rgba(255,255,255,.4)']},
  minimal:{n:'Minimal',bg:'#F5F4F0',fg:'#15131F',b1:['#15131F','#fff'],b2:['transparent','#15131F','#15131F']},
  atardecer:{n:'Atardecer',bg:'linear-gradient(170deg,#2A1760 0%,#8E2F8C 52%,#E8553A 100%)',fg:'#fff',b1:['#fff','#2A1760'],b2:['rgba(20,10,40,.4)','#fff','rgba(255,255,255,.55)']},
  neon:{n:'Neón',bg:'#0A0A14',fg:'#fff',b1:['#D4FF4F','#15131F'],b2:['transparent','#fff','#FF4FD8'],neon:1},
  oceano:{n:'Océano',bg:'linear-gradient(170deg,#06304D 0%,#0E7C86 65%,#9AE6C8 100%)',fg:'#fff',b1:['#fff','#06304D'],b2:['rgba(6,48,77,.35)','#fff','rgba(255,255,255,.55)']},
  pastel:{n:'Pastel',bg:'linear-gradient(170deg,#FFD9E8,#D9E4FF)',fg:'#15131F',b1:['#15131F','#fff'],b2:['rgba(255,255,255,.7)','#15131F','#15131F']}
};
const DEFAULT = {
  id: '', n:'Tu nombre', d:'Escribe aquí una descripción corta',
  a:{m:'ig',v:''}, t:'atardecer',
  g:[['instagram',''],['whatsapp',''],['tiktok',''],['spotify',''],['youtube','']],
  b:[['Catálogo PDF',''],['Tienda online','']]
};

const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = (s,r) => (r||document).querySelector(s);
const enc = o => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

function dec(s){
  try{
    s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='=';
    return sanitize(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)))));
  }catch{ return null; }
}

function sanitize(o){
  const r = JSON.parse(JSON.stringify(DEFAULT));
  if(!o||typeof o!=='object') return r;
  if(typeof o.id==='string') r.id=o.id.toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,30);
  if(typeof o.n==='string') r.n=o.n.slice(0,60);
  if(typeof o.d==='string') r.d=o.d.slice(0,160);
  if(o.a&&typeof o.a.v==='string'){
    if(o.a.m==='ig'||o.a.m==='url') r.a={m:o.a.m,v:o.a.v.slice(0,400)};
  }
  if(TH[o.t]) r.t=o.t;
  if(Array.isArray(o.g)) r.g=o.g.filter(x=>Array.isArray(x)&&NET[x[0]]).slice(0,12).map(x=>[x[0],String(x[1]||'').slice(0,400)]);
  if(Array.isArray(o.b)) r.b=o.b.filter(x=>Array.isArray(x)).slice(0,8).map(x=>[String(x[0]||'').slice(0,60),String(x[1]||'').slice(0,400)]);
  return r;
}

function norm(k,u){
  u=(u||'').trim(); if(!u) return '';
  if(k==='whatsapp'&&/^[+\d\s()-]{7,}$/.test(u)) return 'https://wa.me/'+u.replace(/\D/g,'');
  if(/^(https?:\/\/|mailto:|tel:)/i.test(u)) return u;
  if(u[0]==='@'&&NET[k]?.h) return NET[k].h+u.slice(1);
  return 'https://'+u.replace(/^\/+/,'');
}

const iconHTML = k => k==='link'?LINKSVG:`<img src="https://cdn.simpleicons.org/${k}/white" alt="" data-l="${esc(NET[k].n[0])}" onerror="this.replaceWith(document.createTextNode(this.dataset.l))">`;
const shuffle = a => a.sort(()=>Math.random()-.5);

function layout(n,W){
  const H=Math.max(170,Math.min(330,100+n*34)), base=[88,80,74,68,62,56];
  const sizes=shuffle(Array.from({length:n},(_,i)=>base[i%base.length]));
  for(let att=0;att<8;att++){
    const k=(1-att*.07)*(W<300?.9:1), ss=sizes.map(s=>Math.round(s*k));
    const order=ss.map((s,i)=>i).sort((a,b)=>ss[b]-ss[a]), placed=[]; let ok=true;
    for(const i of order){
      const s=ss[i]; let p=null;
      for(let t=0;t<250&&!p;t++){
        const x=Math.random()*(W-s), y=Math.random()*(H-s), cx=x+s/2, cy=y+s/2;
        if(placed.every(q=>Math.hypot(cx-q.cx,cy-q.cy)>=(s+q.s)/2+6)) p={x,y,cx,cy,s,i};
      }
      if(!p){ok=false;break;} placed.push(p);
    }
    if(ok){ const out=[]; placed.forEach(p=>out[p.i]=p); return {H,items:out}; }
  }
  const cols=Math.max(1,Math.ceil(Math.sqrt(n*W/H))), cell=W/cols, s=Math.floor(cell*.82);
  return {H:Math.max(H,Math.ceil(n/cols)*cell),items:Array.from({length:n},(_,i)=>({x:(i%cols)*cell+(cell-s)/2,y:Math.floor(i/cols)*cell+(cell-s)/2,s}))};
}

const cardHTML = () => '<div class="card noanim" id="card"><div class="avatar"><img id="av" alt=""><span id="avl"></span></div><div class="cloud" id="cloud"></div><h1 id="cn"></h1><p id="cd"></p><div class="btns" id="cb"></div></div>';

let LAY=null, LAYSIG='';
function applyTheme(el,t){
  if(!el) return;
  const T=TH[t]||TH.atardecer, st=el.style;
  st.setProperty('--bg',T.bg); st.setProperty('--fg',T.fg);
  st.setProperty('--b1bg',T.b1[0]); st.setProperty('--b1fg',T.b1[1]);
  st.setProperty('--b2bg',T.b2[0]); st.setProperty('--b2fg',T.b2[1]); st.setProperty('--b2bd',T.b2[2]);
  $('#card')?.classList.toggle('neon',!!T.neon);
}

function avatarURL(a){
  const v=(a?.v||'').trim(); if(!v) return '';
  if(a.m==='ig'){
    const m=v.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
    const u=m?m[1]:v.replace(/^@/,'').split(/[\/?#\s]/)[0];
    return u?`https://unavatar.io/instagram/${encodeURIComponent(u)}?fallback=false`:'';
  }
  return /^https?:\/\//i.test(v)?v:'https://'+v;
}

function updateAvatar(S,cb,force){
  const img=$('#av'); if(!img) return;
  const avl=$('#avl'); if(avl) avl.textContent=(S.n||'?').trim().charAt(0).toUpperCase()||'?';
  const url=avatarURL(S.a);
  if(!url){ img.style.display='none'; img.removeAttribute('src'); cb?.('none'); return; }
  if(img.dataset.src===url) return;
  if(S.a?.m==='ig'&&force!==true){ cb?.('pending'); return; }
  img.dataset.src=url;
  img.onload=()=>{ img.style.display='block'; cb?.('ok'); };
  img.onerror=()=>{ img.style.display='none'; cb?.('err'); };
  cb?.('load');
  img.referrerPolicy='no-referrer';
  img.src=url;
}

function renderCloud(S,visitor,W,fresh){
  const cloud=$('#cloud'); if(!cloud) return;
  let list=(S.g||[]).map((g,i)=>({k:g[0],u:norm(g[0],g[1]),i}));
  if(visitor) list=list.filter(x=>x.u);
  if(!list.length){ cloud.style.display='none'; cloud.innerHTML=''; return; }
  cloud.style.display='block';
  const sig=list.map(x=>x.k).join(',')+'|'+W;
  if(fresh||!LAY||sig!==LAYSIG){
    LAY=layout(list.length,W); LAYSIG=sig;
    LAY.meta=list.map(()=>({d:Math.round(Math.random()*350),t:(3+Math.random()*1.8).toFixed(2),f:(-Math.random()*3).toFixed(2)}));
  }
  cloud.style.width=W+'px'; cloud.style.height=LAY.H+'px';
  cloud.innerHTML=list.map((x,j)=>{
    const p=LAY.items[j]||{x:0,y:0,s:60}, m=LAY.meta[j]||{d:0,t:3,f:0}, net=NET[x.k]||NET.link;
    const tag=x.u?'a':'span', href=x.u?` href="${esc(x.u)}" target="_blank" rel="noopener"`:'';
    return `<${tag}${href} class="gb${x.u?'':' ghost'}" aria-label="${esc(net.n)}" style="left:${Math.round(p.x)}px;top:${Math.round(p.y)}px;width:${p.s}px;height:${p.s}px;--d:${80+j*90+m.d%120}ms"><span class="bi" style="background:${net.c};--t:${m.t}s;--f:${m.f}s;--glow:${GLOW[x.k]||'#fff'}">${iconHTML(x.k)}</span></${tag}>`;
  }).join('');
}

function renderBtns(S,visitor){
  const el=$('#cb'); if(!el) return;
  const list=(S.b||[]).map(b=>({t:b[0],u:norm('',b[1])})).filter(b=>b.t.trim()&&(!visitor||b.u));
  el.innerHTML=list.map((b,i)=>{
    const cls=`btn${i===0?' primary':''}${b.u?'':' ghost'}`;
    return b.u?`<a class="${cls}" href="${esc(b.u)}" target="_blank" rel="noopener">${esc(b.t)}</a>`:`<span class="${cls}">${esc(b.t)}</span>`;
  }).join('');
}

function updateCard(S,o={}){
  const cn=$('#cn'), cd=$('#cd');
  if(cn) cn.textContent=S.n;
  if(cd){ cd.textContent=S.d; cd.style.display=S.d.trim()?'':'none'; }
  applyTheme(o.themeEl,S.t);
  updateAvatar(S,o.onAvatar,o.visitor||o.force);
  renderCloud(S,o.visitor,o.W,o.fresh);
  renderBtns(S,o.visitor);
}

function startVisitor(S){
  document.body.classList.add('visitor');
  document.title=S.n||'BubbleTree';
  const app=$('#app'); if(!app) return;
  app.innerHTML=cardHTML();
  const c=$('#card');
  if(c){
    c.classList.remove('noanim');
    c.insertAdjacentHTML('beforeend',`<a class="credit" href="${esc(location.pathname)}">Crea la tuya con BubbleTree</a>`);
  }
  const root=document.documentElement;
  applyTheme(root,S.t);
  updateCard(S,{visitor:true,W:Math.min(340,Math.max(240,innerWidth-48)),themeEl:root});
}

function startEditor(S){
  let photoMode=S.a?.m==='url'?'url':'ig', cardId=null;
  try{ cardId=localStorage.getItem('globos-cur'); }catch{}
  try{
    const raw=localStorage.getItem('globos-draft');
    if(raw&&!S.__fromLink){ const d=dec(raw); if(d) S=d; }
  }catch{}
  delete S.__fromLink;

  const catHTML=Object.keys(NET).map(k=>`<button type="button" data-add="${k}" aria-label="Añadir ${esc(NET[k].n)}" title="${esc(NET[k].n)}" style="background:${NET[k].c}">${iconHTML(k)}</button>`).join('');

  const app=$('#app'); if(!app) return;
  app.innerHTML=
  `<div class="top">
    <div class="logo"><div class="dots"><i style="left:0;top:4px;width:20px;height:20px;background:#D4FF4F"></i><i style="left:12px;top:0;width:24px;height:24px;background:#7C5CFF"></i><i style="left:28px;top:8px;width:16px;height:16px;background:#FF7A59"></i></div>BubbleTree</div>
    <div class="linkbox"><div><span id="lk"></span><small id="sz"></small></div></div>
    <select class="tb sel" id="mine" aria-label="Mis tarjetas"></select>
    <button class="tb" id="savecard" type="button" style="background:#5B3DF5;border-color:#5B3DF5;color:#fff;font-weight:700">💾 Guardar en Git</button>
    <button class="copy" id="copy" type="button">Copiar enlace</button>
    <button class="tb" id="newc" type="button">Nueva</button>
    <button class="tb" id="delc" type="button">Borrar</button>
    <button class="tb" id="vis" type="button">Vista previa</button>
  </div>
  <div class="split">
   <div class="panel">
    <div class="sec"><div class="sh"><b>1</b>Identificador del enlace</div>
      <div><label for="uid">Nombre único para tu URL (ejemplo: miperfil)</label>
      <input class="in" id="uid" maxlength="30" placeholder="miperfil" value="${esc(S.id||'')}"></div>
    </div>
    <div class="sec"><div class="sh"><b>2</b>Perfil</div>
      <div><label for="n">Nombre o título</label><input class="in" id="n" maxlength="60"></div>
      <div><label for="d">Descripción corta <span class="cnt" id="cnt"></span></label><textarea class="in" id="d" maxlength="160"></textarea></div>
      <div><label>Foto de perfil</label>
        <div class="row" style="flex-wrap:wrap">
          <div class="seg" id="seg"><button type="button" data-m="ig">Instagram</button><button type="button" data-m="url">URL</button></div>
          <input class="in" id="av-in" aria-label="Usuario o URL" style="flex:1;min-width:140px;width:auto">
          <button class="tb" id="av-go" type="button" style="color:var(--ink);border-color:var(--ink)">Buscar</button>
        </div>
        <div class="status" id="avs"></div>
      </div>
    </div>
    <div class="sec"><div class="sh"><b>3</b>Tema</div><div class="themes" id="themes"></div></div>
    <div class="sec"><div class="sh"><b>4</b>Burbujas de redes<em>Toca un logo para añadirlo</em></div><div class="cat" id="cat">${catHTML}</div><div style="display:flex;flex-direction:column;gap:8px" id="gl"></div></div>
    <div class="sec"><div class="sh"><b>5</b>Botones de acción</div><div style="display:flex;flex-direction:column;gap:8px" id="bl"></div><button class="add" id="addb" type="button">+ Añadir botón</button></div>
    <div class="note"><span>Toca "Guardar en Git" para almacenar de por vida tu tarjeta. Tu enlace final quedará corto y limpio.</span></div>
   </div>
   <div class="stage">
     <div class="bar">
       <span class="live"><i></i>Vista previa en vivo</span>
       <button class="play" id="play" type="button">▶ Probar efecto de burbujas</button>
     </div>
     <div class="warn" id="warn" hidden></div>
     <div class="phone" id="phone">${cardHTML()}</div>
     <div style="font-size:13px;color:#4A465C;text-align:center">Cada cambio se refleja aquí en tiempo real.</div>
   </div>
  </div>`;

  const phone=$('#phone'), W=276, CK='globos-cards';
  const getCards = () => { try{ return JSON.parse(localStorage.getItem(CK))||[]; }catch{ return []; } };
  const putCards = a => { try{ localStorage.setItem(CK,JSON.stringify(a.slice(0,50))); }catch{} };
  const setCur = () => { try{ cardId?localStorage.setItem('globos-cur',cardId):localStorage.removeItem('globos-cur'); }catch{} };

  function getBaseUrl(){
    return (location.protocol==='file:'||location.origin==='null') 
      ? location.href.split(/[?#]/)[0] 
      : location.origin + location.pathname;
  }

  function getActiveLink(){
    const targetId = S.id || cardId;
    if(targetId) return `${getBaseUrl()}?id=${encodeURIComponent(targetId)}`;
    return `${getBaseUrl()}?d=${enc(S)}`;
  }

  function refreshLink(){
    const l = getActiveLink();
    const lk=$('#lk'), sz=$('#sz');
    if(lk) lk.innerHTML=`<span style="color:#D4FF4F">${esc(l.replace(/^https?:\/\//,''))}</span>`;
    if(sz) sz.textContent=S.id?'directo':'corto';
  }

  function refreshMine(){
    const a=getCards(), sel=$('#mine'); if(!sel) return;
    sel.innerHTML=`<option value="">Mis tarjetas (${a.length})</option>`+a.map(c=>`<option value="${esc(c.id)}"${c.id===cardId?' selected':''}>${esc(c.n)}</option>`).join('');
    if(!cardId) sel.value='';
  }

  function upsertCard(){
    const a=getCards(); if(!cardId) cardId=S.id || ('c'+Date.now().toString(36));
    let c=a.find(x=>x.id===cardId); if(!c){ c={id:cardId}; a.unshift(c); }
    c.n=S.n||'Sin nombre'; c.e=enc(S);
    putCards(a); setCur(); refreshMine();
  }

  const missingCount = () => ({ g:(S.g||[]).filter(x=>!norm(x[0],x[1])).length, b:(S.b||[]).filter(x=>x[0].trim()&&!norm('',x[1])).length });

  function refreshWarn(){
    const m=missingCount(), el=$('#warn'); if(!el) return;
    const p=[];
    if(m.g) p.push(`${m.g} burbuja${m.g===1?'':'s'}`);
    if(m.b) p.push(`${m.b} botón${m.b===1?'':'es'}`);
    el.hidden=!p.length;
    if(p.length) el.textContent=`Sin enlace: ${p.join(' y ')} (apagados en la vista previa).`;
  }

  const copyText = (t,msg) => navigator.clipboard?.writeText(t).then(()=>toast(msg),()=>prompt('Copia tu enlace:',t)) || prompt('Copia tu enlace:',t);

  function loadState(d,id){
    S=d; cardId=id||S.id||null; photoMode=S.a?.m==='url'?'url':'ig'; setCur();
    $('#uid').value=S.id\vert{}\vert{}''; $('#n').value=S.n; $('#d').value=S.d; $('#av-in').value=S.a?.v||'';
    renderSeg(); renderThemes(); renderGlobos(); renderBtnsList(); 
    const av=$('#av'); if(av) av.dataset.src='';
    refreshMine(); save();
    if(S.a?.v) updateAvatar(S,setStatus,true);
  }

  function setStatus(s){
    const el=$('#avs'); if(!el) return;
    el.className='status';
    const msgs={
      none:photoMode==='ig'?'Escribe tu usuario de Instagram y pulsa Buscar.':'Pega la URL directa de una imagen.',
      pending:'Pulsa Buscar (o Enter) para cargar la foto.',
      load:'Buscando foto…',
      ok:'Foto encontrada.'
    };
    el.textContent=msgs[s]||(photoMode==='ig'?'No se pudo cargar la foto de Instagram.':'No se pudo cargar esa imagen.');
    if(s==='ok') el.classList.add('ok');
  }

  function save(o={}){
    if(phone?.firstElementChild) phone.firstElementChild.classList.add('noanim');
    updateCard(S,{W,themeEl:phone,fresh:o.fresh,onAvatar:setStatus});
    if(o.fresh && phone?.firstElementChild) phone.firstElementChild.classList.remove('noanim');
    refreshLink(); refreshWarn();
    const cnt=$('#cnt'); if(cnt) cnt.textContent=`${S.d.length} / 160`;
    try{ localStorage.setItem('globos-draft',enc(S)); }catch{}
  }

  function renderSeg(){
    document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.m===photoMode));
    const ain=$('#av-in'), ago=$('#av-go');
    if(ain) ain.placeholder=photoMode==='ig'?'tu.usuario':'https://…/foto.jpg';
    if(ago) ago.style.display=photoMode==='ig'?'':'none';
  }

  function renderThemes(){
    const th=$('#themes'); if(!th) return;
    th.innerHTML=Object.keys(TH).map(k=>{
      const T=TH[k], sw=T.neon?'background:#0A0A14;border:2px solid #D4FF4F;box-shadow:0 0 12px #D4FF4F88':'background:'+T.bg;
      return `<button type="button" data-t="${k}" class="${S.t===k?'on':''}"><i style="${sw}"></i>${T.n}</button>`;
    }).join('');
  }

  function renderGlobos(){
    const gl=$('#gl'); if(!gl) return;
    gl.innerHTML=(S.g||[]).map((g,i)=>`<div class="item"><span class="ic" style="background:${NET[g[0]].c}">${iconHTML(g[0])}</span><input class="in" data-gi="${i}" aria-label="Enlace de ${esc(NET[g[0]].n)}" placeholder="${g[0]==='whatsapp'?'Número con código de país, ej. 56912345678':['spotify','link','discord'].includes(g[0])?'Pega el enlace':'@usuario o enlace'}" value="${esc(g[1])}"><button class="x" type="button" data-gx="${i}" aria-label="Quitar ${esc(NET[g[0]].n)}">✕</button></div>`).join('')||'<div class="status">Aún no hay burbujas. Toca un logo arriba.</div>';
  }

  function renderBtnsList(){
    const bl=$('#bl'); if(!bl) return;
    bl.innerHTML=(S.b||[]).map((b,i)=>`<div class="item"><input class="in" style="width:190px;flex:none;font-weight:700" data-bt="${i}" aria-label="Texto del botón ${i+1}" maxlength="60" value="${esc(b[0])}"><input class="in" data-bu="${i}" aria-label="Enlace del botón ${i+1}" placeholder="https://…" value="${esc(b[1])}"><button class="x" type="button" data-bx="${i}" aria-label="Quitar botón ${i+1}">✕</button></div>`).join('');
  }

  $('#uid').oninput = e => {
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,30);
    e.target.value = clean;
    S.id = clean;
    cardId = clean || null;
    save();
  };

  $('#n').value=S.n; $('#d').value=S.d; $('#av-in').value=S.a?.v||'';
  renderSeg(); renderThemes(); renderGlobos(); renderBtnsList(); refreshMine(); save();
  if(S.a?.v) updateAvatar(S,setStatus,true);

  $('#n').oninput = e => { S.n=e.target.value; save(); };
  $('#d').oninput = e => { S.d=e.target.value; save(); };

  const lookup = () => updateAvatar(S,setStatus,true);
  let avT;
  $('#av-in').oninput = e => {
    S.a={m:photoMode,v:e.target.value}; save(); clearTimeout(avT);
    if(photoMode==='ig'&&e.target.value.trim().length>=2) avT=setTimeout(lookup,1500);
    else lookup();
  };
  $('#av-in').onkeydown = e => { if(e.key==='Enter'){ clearTimeout(avT); lookup(); } };
  $('#av-in').onblur = () => { clearTimeout(avT); if(photoMode==='ig') lookup(); };
  $('#av-go').onclick = () => { clearTimeout(avT); lookup(); };

  $('#seg').onclick = e => {
    const b=e.target.closest('button'); if(!b) return;
    photoMode=b.dataset.m; S.a={m:photoMode,v:$('#av-in').value};
    renderSeg(); const av=$('#av'); if(av) av.dataset.src=''; save(); if(photoMode!=='ig') lookup();
  };

  $('#themes').onclick = e => {
    const b=e.target.closest('button'); if(!b) return;
    S.t=b.dataset.t; renderThemes(); save();
  };

  $('#cat').onclick = e => {
    const b=e.target.closest('button'); if(!b) return;
    if(S.g.length>=12){ toast('Máximo 12 burbujas'); return; }
    S.g.push([b.dataset.add,'']); renderGlobos(); save();
    const ins=document.querySelectorAll('#gl input'); ins[ins.length-1]?.focus();
  };

  $('#gl').oninput = e => { const i=e.target.dataset.gi; if(i!=null){ S.g[i][1]=e.target.value; save(); } };
  $('#gl').onclick = e => { const b=e.target.closest('[data-gx]'); if(b){ S.g.splice(+b.dataset.gx,1); renderGlobos(); save(); } };

  $('#bl').oninput = e => {
    const t=e.target.dataset;
    if(t.bt!=null) S.b[t.bt][0]=e.target.value;
    else if(t.bu!=null) S.b[t.bu][1]=e.target.value;
    else return;
    save();
  };
  $('#bl').onclick = e => { const b=e.target.closest('[data-bx]'); if(b){ S.b.splice(+b.dataset.bx,1); renderBtnsList(); save(); } };

  $('#addb').onclick = () => {
    if(S.b.length>=8){ toast('Máximo 8 botones'); return; }
    S.b.push(['Nuevo botón','']); renderBtnsList(); save();
    const ins=document.querySelectorAll('#bl input[data-bt]');
    ins[ins.length-1]?.focus(); ins[ins.length-1]?.select();
  };

  $('#play').onclick = () => save({fresh:true});
  $('#vis').onclick = () => {
    const m=missingCount(); if(m.g||m.b) toast('Ojo: los elementos sin enlace no se mostrarán a los visitantes');
    window.open(getActiveLink(),'_blank');
  };

  $('#savecard').onclick = async () => {
    const btn=$('#savecard');
    if(!S.id){
      toast('Escribe un nombre para tu enlace en el paso 1');
      $('#uid').focus();
      return;
    }

    upsertCard();

    if(!WORKER_URL || WORKER_URL.includes('tunombre.workers.dev')){
      refreshLink();
      toast('Guardado localmente. Recuerda configurar tu Cloudflare Worker para guardar en GitHub.');
      return;
    }

    btn.disabled=true; btn.textContent='Guardando en Git…';

    try {
      const res = await fetch(`${WORKER_URL}?id=${encodeURIComponent(S.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(S)
      });
      const data = await res.json();
      btn.disabled=false; btn.textContent='💾 Guardar en Git';

      if(res.ok && data.ok){
        refreshLink();
        toast('¡Tarjeta guardada en GitHub!');
      } else {
        toast('Error al guardar: ' + (data.error || 'Revisa tu Worker'));
      }
    } catch(err) {
      btn.disabled=false; btn.textContent='💾 Guardar en Git';
      toast('No se pudo conectar con Cloudflare Worker');
    }
  };

  $('#copy').onclick = () => {
    copyText(getActiveLink(), '¡Enlace copiado al portapapeles!');
  };

  $('#mine').onchange = e => {
    const c=getCards().find(x=>x.id===e.target.value);
    if(!c){ refreshMine(); return; }
    const d=dec(c.e); if(!d){ toast('No se pudo cargar esa tarjeta'); return; }
    loadState(d,c.id); toast('Tarjeta cargada');
  };

  $('#delc').onclick = async () => {
    const id=$('#mine').value||cardId, a=getCards(), c=a.find(x=>x.id===id);
    if(!c){ toast('Elige primero una tarjeta en "Mis tarjetas"'); return; }
    if(!confirm(`¿Borrar la tarjeta "${c.n}"?\nSe eliminará de tu lista.`)) return;
    
    if(WORKER_URL && !WORKER_URL.includes('tunombre.workers.dev')){
      $('#delc').disabled = true;
      $('#delc').textContent = 'Borrando…';
      try {
        await fetch(`${WORKER_URL}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch(e){}
      $('#delc').disabled = false;
      $('#delc').textContent = 'Borrar';
    }

    putCards(a.filter(x=>x.id!==id));
    if(id===cardId) loadState(JSON.parse(JSON.stringify(DEFAULT)),null);
    else refreshMine();
    toast('Tarjeta borrada');
  };

  $('#newc').onclick = () => {
    const e=enc(S), saved=getCards().some(c=>c.e===e);
    if(e!==enc(DEFAULT)&&!saved&&!confirm('¿Empezar una tarjeta nueva?')) return;
    loadState(JSON.parse(JSON.stringify(DEFAULT)),null); toast('Tarjeta nueva');
  };
}

let tt;
function toast(m){
  const t=$('#toast'); if(!t) return;
  t.textContent=m; t.classList.add('show');
  clearTimeout(tt); tt=setTimeout(()=>t.classList.remove('show'),3800);
}

/* ================= ARRANQUE SEGURO ================= */
async function startApp(){
  try {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const d = params.get('d') || location.hash.slice(1);
    const editing = params.has('edit');

    if(id){
      try {
        const res = await fetch(`cards/${encodeURIComponent(id)}.json`);
        if(res.ok){
          const cardData = await res.json();
          if(!editing) return startVisitor(cardData);
          cardData.__fromLink = 1;
          return startEditor(cardData);
        }
      } catch(e){}
    }

    const fromLink = d ? dec(d) : null;
    if(fromLink && !editing) return startVisitor(fromLink);
    if(fromLink && editing){ fromLink.__fromLink=1; return startEditor(fromLink); }

    startEditor(JSON.parse(JSON.stringify(DEFAULT)));
  } catch(err) {
    startEditor(JSON.parse(JSON.stringify(DEFAULT)));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
})();