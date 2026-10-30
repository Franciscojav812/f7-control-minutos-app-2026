/* ---- 01-core.js ---- */
'use strict';
/* ===== Minutos F7 · Club San José del Parque · v3 ===== */
const CREST='crest.jpg',KEY='f7minutos.club.v2',BK='f7minutos.bak';
const TEAMS={
 pre:{name:'Prebenjamín A',half:20,pfx:'pre',x:'minutos-app.xlsx',c:'minutos-csv.zip',j:'minutos-copia.json'},
 ale:{name:'Alevín B',half:25,pfx:'ale',x:'minutos-alevin-b-app.xlsx',c:'minutos-alevin-b-csv.zip',j:'minutos-copia-alevin-b.json'}};
const DEF={
 pre:{n:['Rodrigo Marín','Cayetano Aragonés','Gonzalo Barquín','Alfredo González','Antonio Herráiz','Arturo Marqués','Alfredo Martín','Pietro Mónaco','Adrián Otero','Gabriel Olarte','Matteo Soria','Hugo Louzao','Maverick Pinto','Platón Kudishin','Tomás Antoranz'],
  p:{'Hugo Louzao':'Portero','Matteo Soria':'MC','Platón Kudishin':'DFC','Antonio Herráiz':'DC','Tomás Antoranz':'DC','Adrián Otero':'MC','Maverick Pinto':'DC','Gabriel Olarte':'DFC','Arturo Marqués':'MC','Cayetano Aragonés':'DFC','Alfredo Martín':'DFC','Alfredo González':'DC'}},
 ale:{n:['Youna','Daniel','Lucas','Miguel','Hugo G','Jaime','Lucho','Vizu','Moli','Hugo A','Diego'],
  p:{'Youna':'Portero','Daniel':'LD','Lucas':'LI','Miguel':'DFC','Hugo G':'DFC','Jaime':'ED','Lucho':'EI','Vizu':'DC','Moli':'DC','Hugo A':'DC','Diego':'MC'}}};
const POS=['Portero','DFC','LI','LD','MC','MI','MD','EI','ED','DC'];
const COMPS=['Liga','Copa','Amistoso','Torneo'],LOCS=['Local','Visitante','Neutral'];
const ORIG=['Jugada','Córner','Falta','Penalti','Contraataque','Rebote','Error rival'];
const CAUS=['Pérdida de balón','Balón parado','Error defensivo','Error del portero','Contraataque','Penalti','Acción individual'];
const MIN_OPTS=[0,5,8,10,12,15,18,20,25];
const FORMS={'3-2-1':{c:'Equilibrado',k:'eq'},'2-2-2':{c:'Ofensivo',k:'of'},'3-1-2':{c:'Equilibrado',k:'eq'},'2-3-1':{c:'Muy ofensivo',k:'mo'},'1-3-2':{c:'Ofensivo',k:'of'},'4-1-1':{c:'Defensivo',k:'de'},'2-1-3':{c:'Muy ofensivo',k:'mo'},'3-3-0':{c:'Defensivo',k:'de'}};
const DL={1:['DFC'],2:['DFC','DFC'],3:['LI','DFC','LD'],4:['LI','DFC','DFC','LD']},ML={0:[],1:['MC'],2:['MC','MC'],3:['MI','MC','MD']},FL={0:[],1:['DC'],2:['EI','ED'],3:['EI','DC','ED']};
const BADGE={eq:'bg-turf text-ink',of:'bg-amber text-ink',mo:'bg-red-500 text-ink',de:'bg-benchl text-ink'};
Object.keys(FORMS).forEach(k=>{
  const [d,m,f]=k.split('-').map(Number),F=FORMS[k],r=(s,n)=>Array.from({length:n},(_,i)=>s+i);
  F.lab=['Portero',...DL[d],...ML[m],...FL[f]];
  F.rows=[r(1+d+m,f),r(1+d,m),r(1,d),[0]].filter(x=>x.length);
});
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=ms=>{const t=Math.floor(Math.max(0,ms)/1000);return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')};
const r1=ms=>Math.round(ms/6000)/10;
const ymd=g=>new Date(g.date).toLocaleDateString('sv-SE');
const vib=n=>{try{navigator.vibrate&&navigator.vibrate(n)}catch(e){}};

/* ---- estado: un bloque por equipo ---- */
function newTeam(id){
  const D=DEF[id],players=D.n.map((n,i)=>({id:'p'+(i+1),name:n,pos:D.p[n]||'',conv:true}));
  return{players,starters:players.slice(0,7).map(p=>p.id),match:null,history:[],nid:players.length+1,form:'3-2-1',minMin:0,runMin:Math.floor(TEAMS[id].half/2)};
}
const nameId=(t,n)=>{const p=t.players.find(p=>p.name===n);return p?p.id:null};
function fixG(g,t){
  g.jornada=g.jornada||'';g.comp=g.comp||'';g.loc=g.loc||'';g.notes=g.notes||{};g.sg=g.sg||[];g.events=g.events||[];
  if(g.acts)return;
  g.acts=(g.shots||[]).map((s,i)=>({k:'tiro',t:s.t||i,part:s.part,min:s.min,add:s.add||0,lado:s.lado,res:s.res,autor:nameId(t,s.autor),asist:nameId(t,s.asist),por:nameId(t,s.por),on:null,form:null,legacy:1}));
  delete g.shots;
  g.events.forEach(v=>{if(!v.k)v.k='sub';if(v.k==='sub'){v.entra=nameId(t,v.entra);v.sale=nameId(t,v.sale)}});
  g.players.forEach(x=>{if(!x.id)x.id=nameId(t,x.name)||('x'+x.name)});
}
function fixMatch(m,t){
  m.form=m.form||'3-2-1';m.form0=m.form0||m.form;m.roster=m.roster||t.players.map(p=>p.id);
  m.pm=m.pm||{};m.ps=m.ps||{...m.since};m.events=m.events||[];m.ack=m.ack||{};m.undo=m.undo||[];
  m.events.forEach(v=>{if(!v.k)v.k='sub';v.add=v.add||0});
  if(!m.acts){m.acts=(m.shots||[]).map(s=>({k:'tiro',...s,on:null,form:null,legacy:1}));delete m.shots}
  if(m.part===2&&m.p1End==null)m.p1End=m.half*60000;
}
function fixTeam(t,id){
  t.players.forEach(p=>{delete p.dorsal;if(p.conv===undefined)p.conv=true;if(p.pos===undefined)p.pos=''});
  t.form=t.form||'3-2-1';t.history=t.history||[];delete t.tab;delete t.half;
  if(t.minMin==null)t.minMin=0;if(t.runMin==null)t.runMin=Math.floor(TEAMS[id].half/2);
  t.history.forEach(g=>fixG(g,t));
  if(t.match)fixMatch(t.match,t);
}
function load(){
  let a=null;try{a=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(!a||!a.teams)a={cur:'pre',tab:'setup',teams:{}};
  Object.keys(TEAMS).forEach(id=>{
    if(!a.teams[id]){let t=null;try{t=JSON.parse(localStorage.getItem(id==='pre'?'f7minutos.v1':'f7minutos.alevinb.v1'))}catch(e){}
      a.teams[id]=t&&t.players?t:newTeam(id)}
    fixTeam(a.teams[id],id);
  });
  a.set=Object.assign({auto:true,lastBak:0},a.set||{});a.ver=3;
  if(a.tab==='ana'&&!a.teams[a.cur])a.tab='setup';
  return a;
}
let ALL=load(),S=ALL.teams[ALL.cur],DLG=null,TOASTED=0;
const setTeam=id=>{ALL.cur=id;S=ALL.teams[id]};
function save(){try{localStorage.setItem(KEY,JSON.stringify(ALL))}catch(e){if(Date.now()-TOASTED>8000){TOASTED=Date.now();toast('⚠ No se pudo guardar: almacenamiento lleno. Exporta una copia JSON.')}}}
/* ---- copias de seguridad internas (rotan 3) ---- */
function bak(why){
  try{
    const raw=JSON.stringify(ALL);
    for(let i=3;i>1;i--){const v=localStorage.getItem(BK+(i-1));if(v)localStorage.setItem(BK+i,v)}
    localStorage.setItem(BK+1,JSON.stringify({at:Date.now(),why,raw}));ALL.set.lastBak=Date.now();
  }catch(e){}
}
function listBak(){
  return[1,2,3].map(i=>{try{const o=JSON.parse(localStorage.getItem(BK+i));if(!o)return null;const a=JSON.parse(o.raw);
    return{i,at:o.at,why:o.why,n:Object.values(a.teams).reduce((s,t)=>s+(t.history||[]).length,0)}}catch(e){return null}}).filter(Boolean);
}
function restoreBak(rawItem){
  const o=JSON.parse(rawItem);ALL=JSON.parse(o.raw);
  Object.keys(TEAMS).forEach(id=>{if(!ALL.teams[id])ALL.teams[id]=newTeam(id);fixTeam(ALL.teams[id],id)});
  ALL.set=Object.assign({auto:true,lastBak:0},ALL.set||{});setTeam(TEAMS[ALL.cur]?ALL.cur:'pre');ALL.tab='hist';
}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
const pl=id=>S.players.find(p=>p.id===id);
function short(id,t){
  t=t||S;const p=t.players.find(p=>p.id===id);if(!p)return'?';
  const [f,...r]=p.name.trim().split(/\s+/);
  const dup=t.players.filter(q=>q.name.trim().split(/\s+/)[0]===f).length>1;
  return dup&&r.length?f+' '+r[0][0]+'.':f;
}
function toast(t){const e=$('#toast');e.textContent=t;e.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.opacity=0,2400)}

/* ---- tiempo, partes y minutos añadidos ---- */
const el=()=>{const m=S.match;return m.base+(m.running?Date.now()-m.runStart:0)};
const pm=id=>{const m=S.match;return(m.acc[id]||0)+(m.onField.includes(id)?el()-m.since[id]:0)};
const pause=()=>{const m=S.match;if(m.running){m.base=el();m.running=false}};
const lim=m=>m.part===1?m.half*60000:m.p1End+m.half*60000;
function mark(m,e){
  const H=m.half*60000;
  if(m.part===1)return e<H?{part:1,min:Math.floor(e/60000)+1,add:0}:{part:1,min:m.half,add:Math.floor((e-H)/60000)+1};
  const x=e-m.p1End;
  return x<H?{part:2,min:m.half+Math.floor(x/60000)+1,add:0}:{part:2,min:2*m.half,add:Math.floor((x-H)/60000)+1};
}
const mtxt=v=>v.add?`${v.min}+${v.add}'`:`${v.min}'`;
/* ---- deshacer ---- */
const UK=['onField','acc','since','ps','pm','events','acts','form'];
function pushUndo(m,label){
  m.undo=m.undo||[];m.undo.push({label,s:JSON.stringify(Object.fromEntries(UK.map(k=>[k,m[k]])))});
  if(m.undo.length>25)m.undo.shift();
}
function undo(m){
  const u=m.undo.pop();if(!u)return;const s=JSON.parse(u.s);
  UK.forEach(k=>m[k]=s[k]);m.sel=null;m.last=null;S.form=m.form;toast('Deshecho: '+u.label);
}
/* ---- posiciones ---- */
const lab=(m,i)=>FORMS[m.form].lab[i];
function stint(m,id,e){
  const i=m.onField.indexOf(id);if(i<0)return;
  const l=lab(m,i),o=m.pm[id]=m.pm[id]||{};
  o[l]=(o[l]||0)+(e-(m.ps[id]||0));m.ps[id]=e;
}
function assign(ids,form){
  const L=FORMS[form].lab,pos=id=>(pl(id)&&pl(id).pos)||'';
  const g=x=>x==='Portero'?'P':/^(DFC|LI|LD)$/.test(x)?'D':/^(MC|MI|MD)$/.test(x)?'M':'F';
  const res=Array(L.length).fill(null),rest=ids.slice();
  [(i,id)=>pos(id)===L[i],(i,id)=>pos(id)&&g(pos(id))===g(L[i]),()=>true].forEach(f=>L.forEach((_,i)=>{
    if(res[i])return;const id=rest.find(x=>f(i,x));if(id){res[i]=id;rest.splice(rest.indexOf(id),1)}}));
  return res;
}
function swapPos(m,a,b){
  pushUndo(m,'intercambio de posición');
  const e=el(),i=m.onField.indexOf(a),j=m.onField.indexOf(b),la=lab(m,i),lb=lab(m,j);
  stint(m,a,e);stint(m,b,e);m.onField[i]=b;m.onField[j]=a;
  m.events.push({k:'pos',t:e,...mark(m,e),a,b,det:`${short(a)} ${la}→${lb} · ${short(b)} ${lb}→${la}`});
}
function changeForm(m,f){
  if(f===m.form)return;pushUndo(m,'cambio de sistema');
  const e=el();m.onField.forEach(id=>stint(m,id,e));
  m.events.push({k:'sis',t:e,...mark(m,e),det:`${m.form} → ${f}`,to:f});m.form=f;S.form=f;
}
function doSub(m,out,inn){
  pushUndo(m,`cambio ${short(inn)} por ${short(out)}`);
  const e=el(),i=m.onField.indexOf(out);
  m.acc[out]=(m.acc[out]||0)+(e-m.since[out]);stint(m,out,e);delete m.since[out];
  m.onField[i]=inn;m.since[inn]=e;m.ps[inn]=e;
  m.events.push({k:'sub',t:e,...mark(m,e),entra:inn,sale:out});m.sel=null;m.last=inn;vib(40);
}
/* eventos manuales: guardan quién estaba en el campo y el sistema (para el +/- y el análisis) */
function addAct(m,o,label){
  pushUndo(m,label);const e=el();
  m.acts.push({t:e,...mark(m,e),on:m.onField.slice(),form:m.form,...o});vib(40);
}

/* ---- 02-stats.js ---- */
/* ===== marcador, sugerencias y estadísticas derivadas ===== */
const isGol=a=>a.k==='tiro'&&a.res==='gol';
const sc=m=>({f:m.acts.filter(a=>isGol(a)&&a.lado==='favor').length,c:m.acts.filter(a=>isGol(a)&&a.lado==='contra').length});
const cnt=(acts,f)=>acts.filter(f).length;
function suggest(m){
  const {f,c}=sc(m),d=f-c,left=(m.part===1?(lim(m)-el())+m.half*60000:lim(m)-el())/60000;
  let g,txt;
  if(d<=-2){g=['2-3-1','2-1-3','2-2-2'];txt=`Perdéis ${f}-${c}: toca arriesgar, sistemas muy ofensivos.`}
  else if(d===-1){g=['2-2-2','1-3-2'];txt=`Perdéis ${f}-${c}: más presión arriba, sistemas ofensivos.`}
  else if(d===0&&left<=5){g=['2-2-2','1-3-2'];txt=`Empate ${f}-${c} y queda poco: busca el gol con un sistema ofensivo.`}
  else if(d===0){g=['3-2-1','3-1-2'];txt=`Empate ${f}-${c}: sistema equilibrado.`}
  else if(d===1&&left>8){g=['3-2-1','3-1-2'];txt=`Ganáis ${f}-${c}: mantened el equilibrio.`}
  else{g=['4-1-1','3-3-0'];txt=`Ganáis ${f}-${c}: proteged la ventaja con un sistema defensivo.`}
  return{txt,g:g.filter(x=>x!==m.form)};
}
/* estadísticas por jugador de UN partido (g.acts) */
function gstats(g){
  const o={},get=id=>o[id]||(o[id]={gol:0,asist:0,par:0,enc:0,fuera:0,am:0,ro:0,vp:0,vn:0,gfc:0,gcc:0,penL:0,penM:0});
  g.players.forEach(x=>get(x.id));
  const hasOn=!g.acts.some(a=>isGol(a)&&!a.on);
  g.acts.forEach(a=>{
    if(a.k==='tiro'){
      if(a.lado==='favor'){
        if(a.res==='gol'){if(a.autor)get(a.autor).gol++;if(a.asist)get(a.asist).asist++}
        if(a.res==='fuera'&&a.autor)get(a.autor).fuera++;
        if(a.pen&&a.autor){get(a.autor).penL++;if(a.res==='gol')get(a.autor).penM++}
      }else{
        if(a.res==='parada'&&a.por)get(a.por).par++;
        if(a.res==='gol'&&a.por)get(a.por).enc++;
      }
      if(a.res==='gol'&&a.on)a.on.forEach(id=>get(id)[a.lado==='favor'?'gfc':'gcc']++);
    }
    if(a.k==='tarjeta'&&a.lado==='favor'&&a.quien)get(a.quien)[a.color==='roja'?'ro':'am']++;
    if(a.k==='val'&&a.quien)get(a.quien)[a.signo>0?'vp':'vn']++;
  });
  o._on=hasOn;return o;
}
/* totales de equipo de UN partido */
function gteam(g){
  const A=g.acts,T=(k,l,r)=>cnt(A,a=>a.k===k&&a.lado===l&&(!r||a.res===r)),shots=(l,rs)=>cnt(A,a=>a.k==='tiro'&&a.lado===l&&rs.includes(a.res));
  return{tpf:shots('favor',['gol','parada']),tpc:shots('contra',['gol','parada']),tff:T('tiro','favor','fuera'),tfc:T('tiro','contra','fuera'),
    parp:T('tiro','contra','parada'),parr:T('tiro','favor','parada'),cf:T('corner','favor'),cc:T('corner','contra'),ff:T('falta','favor'),fc:T('falta','contra'),
    of:T('ocasion','favor'),oc:T('ocasion','contra'),
    amp:cnt(A,a=>a.k==='tarjeta'&&a.lado==='favor'&&a.color!=='roja'),amr:cnt(A,a=>a.k==='tarjeta'&&a.lado==='contra'&&a.color!=='roja'),
    rop:cnt(A,a=>a.k==='tarjeta'&&a.lado==='favor'&&a.color==='roja'),ror:cnt(A,a=>a.k==='tarjeta'&&a.lado==='contra'&&a.color==='roja'),
    penf:cnt(A,a=>a.k==='tiro'&&a.lado==='favor'&&a.pen),penc:cnt(A,a=>a.k==='tiro'&&a.lado==='contra'&&a.pen)};
}
/* análisis acumulado de la temporada del equipo actual */
function analysis(){
  const H=S.history,P={},half=TEAMS[ALL.cur].half,nb=Math.ceil(half*2/10);
  const get=id=>P[id]||(P[id]={id,name:'',ms:0,pj:0,conv:0,tit:0,gol:0,asist:0,par:0,enc:0,fuera:0,gfc:0,gcc:0,vp:0,vn:0,onGames:0,am:0,ro:0});
  const sis={},bins=Array.from({length:nb},()=>({gf:0,gc:0})),duos={},T={gf:0,gc:0,tpf:0,tpc:0,tff:0,parp:0,parr:0,enc:0};
  const dev=[];
  H.forEach(g=>{
    const st=gstats(g),gt=gteam(g);
    g.players.forEach(x=>{const p=get(x.id),s=st[x.id];p.name=x.name;p.conv++;p.ms+=x.ms;if(x.ms>0)p.pj++;if(x.titular)p.tit++;
      ['gol','asist','par','enc','fuera','vp','vn','am','ro'].forEach(k=>p[k]+=s[k]);
      if(st._on){p.gfc+=s.gfc;p.gcc+=s.gcc;p.onGames++}});
    (g.sg||[]).forEach(s=>{const o=sis[s.f]=sis[s.f]||{ms:0,gf:0,gc:0};o.ms+=s.ms});
    g.acts.forEach(a=>{
      if(!isGol(a))return;
      if(a.form){const o=sis[a.form]=sis[a.form]||{ms:0,gf:0,gc:0};o[a.lado==='favor'?'gf':'gc']++}
      const b=Math.min(nb-1,Math.floor((a.min-1)/10));bins[b][a.lado==='favor'?'gf':'gc']++;
      if(a.lado==='favor'&&a.autor&&a.asist){const k=a.asist+'>'+a.autor;duos[k]=(duos[k]||0)+1}
    });
    T.gf+=g.gf||0;T.gc+=g.gc||0;T.tpf+=gt.tpf;T.tpc+=gt.tpc;T.tff+=gt.tff;T.parp+=gt.parp;T.parr+=gt.parr;
    const fm=g.players.filter(x=>x.pos!=='Portero').map(x=>x.ms/60000),mean=fm.reduce((a,b)=>a+b,0)/Math.max(1,fm.length);
    dev.push({n:H.indexOf(g)+1,rival:g.rival,sd:Math.sqrt(fm.reduce((a,b)=>a+(b-mean)*(b-mean),0)/Math.max(1,fm.length)),mx:Math.max(0,...fm),mn:Math.min(...(fm.length?fm:[0]))});
  });
  const pl_=Object.values(P);
  return{P:pl_,sis,bins,duos:Object.entries(duos).sort((a,b)=>b[1]-a[1]),T,dev,nb};
}
/* ---- avisos en vivo ---- */
function stintMs(m,id){return el()-m.since[id]}
function advice(m){
  if(!m||!m.onField)return null;
  const field=m.onField.slice(1),bench=m.roster.filter(id=>!m.onField.includes(id));
  if(!bench.length||!field.length)return null;
  const run=(S.runMin||10)*60000,mn=(S.minMin||0)*60000;
  const longest=field.slice().sort((a,b)=>stintMs(m,b)-stintMs(m,a))[0];
  const least=bench.slice().sort((a,b)=>pm(a)-pm(b))[0];
  const total=m.half*2*60000,played=(m.part===1?el():m.half*60000+(el()-m.p1End)),left=total-played;
  if(stintMs(m,longest)>=run)
    return{out:longest,inn:least,txt:`${short(longest)} lleva ${Math.round(stintMs(m,longest)/60000)}' seguidos. Quien menos ha jugado: ${short(least)} (${Math.round(pm(least)/60000)}').`};
  if(mn&&pm(least)<mn&&left<=(mn-pm(least))*1.6)
    return{out:longest,inn:least,txt:`${short(least)} lleva ${Math.round(pm(least)/60000)}' y el mínimo es ${S.minMin}'. Quedan ${Math.max(0,Math.round(left/60000))}'.`};
  return null;
}

/* ---- 03-views.js ---- */
/* ===== vistas ===== */
const sheet=h=>`<div class="sheet"><div>${h}</div></div>`;
const optsForm=sel=>Object.entries(FORMS).map(([k,F])=>`<option value="${k}" ${sel===k?'selected':''}>${k} · ${F.c}</option>`).join('');
const inp='w-full h-12 rounded-xl bg-ink px-3 text-chalk text-lg outline-none border border-line';
const btn2='min-h-14 rounded-2xl bg-bench font-bold';
const sel=(id,arr,val,e)=>`<select ${e?`data-e="${e}"`:`id="${id}"`} class="${inp}"><option value=""></option>${arr.map(o=>`<option ${o===val?'selected':''}>${o}</option>`).join('')}</select>`;

function vSetup(){
  const m=S.match,cv=S.players.filter(p=>p.conv),n=S.starters.length;
  let h=`<h1 class="font-disp text-5xl font-bold italic tracking-tight">Plantilla</h1>
  <p class="text-mute mb-3">1) Marca quién está convocado. 2) Elige los 7 titulares. El resto de convocados empieza en el banquillo.</p>`;
  if(m)h+=`<button data-a="tab" data-id="match" class="w-full mb-3 min-h-14 rounded-2xl bg-amber text-ink font-bold text-lg">Hay un partido en curso · Volver</button>`;
  h+=`<div class="flex gap-2 mb-3 text-sm font-semibold"><span class="bg-panel rounded-full px-3 py-1">Convocados ${cv.length}/${S.players.length}</span><span class="bg-panel rounded-full px-3 py-1 ${n===7?'':'text-amber'}">Titulares ${n}/7</span></div><div class="space-y-2">`;
  S.players.forEach(p=>{
    const on=S.starters.includes(p.id),opts=POS.includes(p.pos)||!p.pos?POS:[...POS,p.pos];
    h+=`<div class="bg-panel border border-line rounded-2xl p-2 ${p.conv?'':'opacity-70'}"><div class="flex items-center gap-2">
      <button data-a="conv" data-id="${p.id}" ${m?'disabled':''} aria-pressed="${p.conv}" class="shrink-0 w-28 h-12 rounded-xl font-bold text-sm ${p.conv?'bg-turf text-ink':'bg-line text-mute'}">${p.conv?'Convocado':'No convocado'}</button>
      <input data-a="ren" data-id="${p.id}" value="${esc(p.name)}" class="min-w-0 flex-1 bg-transparent text-lg font-semibold px-1 h-12 outline-none focus:bg-ink rounded-lg" aria-label="Nombre">
      <button data-a="del" data-id="${p.id}" ${m?'disabled':''} class="shrink-0 w-12 h-12 rounded-xl text-mute text-2xl ${m?'opacity-30':''}" aria-label="Borrar jugador">×</button></div>
      <div class="flex items-center gap-2 mt-1 pl-1">${p.conv?`<button data-a="tog" data-id="${p.id}" ${m?'disabled':''} aria-pressed="${on}" class="w-24 h-10 rounded-xl font-bold text-sm ${on?'bg-amber text-ink':'bg-bench text-benchl'}">${on?'Titular':'Suplente'}</button>`:'<span class="text-mute text-sm">Fuera de la convocatoria</span>'}
      <label class="flex items-center gap-1 text-mute text-sm ml-auto">Posición habitual <select data-a="pos" data-id="${p.id}" class="h-10 rounded-lg bg-ink text-chalk px-2"><option value=""></option>${opts.map(o=>`<option ${p.pos===o?'selected':''}>${o}</option>`).join('')}</select></label></div></div>`});
  h+=`</div><div class="flex gap-2 mt-3"><input id="newp" placeholder="Nombre del nuevo jugador" class="min-w-0 flex-1 bg-panel border border-line rounded-2xl px-4 h-14 text-lg outline-none focus:border-turf">
    <button data-a="add" class="shrink-0 px-5 h-14 rounded-2xl bg-bench text-chalk font-bold">Añadir</button></div>
  <div class="flex items-center gap-2 mt-4 bg-panel border border-line rounded-2xl p-2"><span class="flex-1 pl-2 font-semibold">Sistema inicial</span>
    <select data-a="form" ${m?'disabled':''} class="h-12 rounded-xl bg-ink px-2 text-chalk font-semibold">${optsForm(S.form)}</select></div>
  <div class="bg-panel border border-line rounded-2xl p-3 mt-3 space-y-2"><h2 class="font-disp text-2xl font-bold italic">Avisos y copias</h2>
   <label class="flex items-center gap-2"><span class="flex-1 text-sm">Avisar si un jugador lleva seguidos más de</span><select data-a="runmin" class="h-11 rounded-lg bg-ink px-2">${[6,8,10,12,15,20].map(v=>`<option value="${v}" ${S.runMin===v?'selected':''}>${v} min</option>`).join('')}</select></label>
   <label class="flex items-center gap-2"><span class="flex-1 text-sm">Mínimo de minutos por jugador (opcional)</span><select data-a="minmin" class="h-11 rounded-lg bg-ink px-2">${MIN_OPTS.map(v=>`<option value="${v}" ${S.minMin===v?'selected':''}>${v?v+' min':'Sin mínimo'}</option>`).join('')}</select></label>
   <label class="flex items-center gap-2"><span class="flex-1 text-sm">Descargar copia JSON al finalizar cada partido</span><button data-a="auto" aria-pressed="${ALL.set.auto}" class="w-20 h-11 rounded-xl font-bold ${ALL.set.auto?'bg-turf text-ink':'bg-line text-mute'}">${ALL.set.auto?'Sí':'No'}</button></label></div>`;
  if(!m){const ok=n===7;h+=`<button data-a="start" ${ok?'':'disabled'} class="w-full mt-5 min-h-16 rounded-2xl font-disp text-3xl font-bold italic tracking-wide ${ok?'bg-turf text-ink':'bg-line text-mute'}">${ok?'Comenzar partido':`Titulares ${n}/7`}</button>`}
  return h;
}
const SG={favor:'a favor',contra:'en contra'};
function evTxt(v,t){
  t=t||S;const sh=id=>short(id,t);
  if(v.k==='part')return'Empieza la 2ª parte';
  const x=mtxt(v);
  if(v.k==='sub')return`${x} Entra ${sh(v.entra)} por ${sh(v.sale)}`;
  if(v.k==='pos')return`${x} Posición: ${v.det}`;
  if(v.k==='sis')return`${x} Sistema ${v.det}`;
  if(v.k==='corner')return`${x} Córner ${SG[v.lado]}`;
  if(v.k==='falta')return`${x} Falta ${v.lado==='favor'?'a favor':'cometida (en contra)'}`;
  if(v.k==='ocasion')return`${x} Ocasión clara ${SG[v.lado]}`;
  if(v.k==='tarjeta')return`${x} ${v.color==='roja'?'🟥 Roja':'🟨 Amarilla'} ${v.lado==='favor'?'a '+(v.quien?sh(v.quien):'uno de los nuestros'):'al rival'}`;
  if(v.k==='val')return`${x} Valoración ${v.signo>0?'＋':'－'} ${sh(v.quien)}`;
  const a=v.autor?sh(v.autor):'',as=v.asist?sh(v.asist):'',pen=v.pen?' (penalti)':'',o=v.orig?' · '+v.orig:'';
  if(v.lado==='favor')return v.res==='gol'?`${x} ⚽ GOL${a?' de '+a:''}${as?' (asist. '+as+')':''}${pen}${o}`:v.res==='fuera'?`${x} Tiro a favor fuera${a?' ('+a+')':''}${pen}`:`${x} Tiro a favor parado${a?' ('+a+')':''}${pen}`;
  return v.res==='gol'?`${x} Gol en contra${v.por?' (portero '+sh(v.por)+')':''}${pen}${o}`:v.res==='fuera'?`${x} Tiro rival fuera`:`${x} Parada de ${v.por?sh(v.por):'nuestro portero'}${pen}`;
}
function qrow(m,lbl,k){
  const n=l=>cnt(m.acts,a=>a.k===k&&a.lado===l&&(k!=='tiro'||a.res==='fuera'));
  return`<div class="flex items-center gap-2"><span class="w-[76px] shrink-0 text-sm font-semibold leading-tight">${lbl}</span>
   <button data-a="q" data-id="${k}:favor" class="flex-1 min-h-12 rounded-xl bg-turf text-ink font-bold">A favor <span class="num font-disp text-xl italic">${n('favor')}</span></button>
   <button data-a="q" data-id="${k}:contra" class="flex-1 min-h-12 rounded-xl bg-bench border border-benchl font-bold">En contra <span class="num font-disp text-xl italic">${n('contra')}</span></button></div>`;
}
function vMatch(){
  const m=S.match;
  if(!m)return`<h1 class="font-disp text-5xl font-bold italic">Partido</h1>
  <p class="text-mute mt-2 mb-4">No hay ningún partido en curso. Elige convocados y titulares, y pulsa Comenzar partido.</p>
  <button data-a="tab" data-id="setup" class="w-full min-h-14 rounded-2xl bg-turf text-ink font-bold text-lg">Ir a la plantilla</button>`;
  const {f,c}=sc(m),F=FORMS[m.form],sg=suggest(m),bench=m.roster.filter(id=>!m.onField.includes(id));
  const tf=cnt(m.acts,a=>a.k==='tiro'&&a.lado==='favor'&&a.res!=='fuera'),tc=cnt(m.acts,a=>a.k==='tiro'&&a.lado==='contra'&&a.res!=='fuera');
  const tok=i=>{const id=m.onField[i],s=m.sel===id;
    return`<button data-a="out" data-id="${id}" aria-label="${esc(short(id))}" class="tok ${s?'sel':''} ${m.last===id?'pop':''}"><span class="pl">${lab(m,i)}</span>
      <span class="jersey ${s?'amb':'red'}">${esc(short(id)[0])}</span><span class="tag">${esc(short(id))}</span>
      <span data-pm="${id}" class="num tm">${fmt(pm(id))}</span>${s?'<span class="out">SELECC.</span>':''}</button>`};
  const u=m.undo&&m.undo.length?m.undo[m.undo.length-1]:null;
  let h=`<div class="score">
    <div class="flex items-center justify-between font-semibold"><span class="flex items-center gap-2"><i class="w-2.5 h-2.5 rounded-full ${m.running?'bg-red-500 pulse':'bg-mute'}"></i>${m.running?'EN JUEGO':'PARADO'}</span>
      <span class="font-disp text-xl italic text-amber">${m.part===1?'1ª PARTE':'2ª PARTE'} · <span data-t="min"></span></span></div>
    <div data-t="clock" class="num font-disp font-bold italic text-center leading-none text-[88px] my-1">${fmt(el())}</div>
    <div data-t="add" class="text-center text-amber font-semibold h-5"></div>
    <div class="h-2.5 rounded-full bg-ink overflow-hidden"><div data-t="bar" class="h-full bg-turf" style="width:0%"></div></div>
    <div class="flex items-center justify-center gap-3 mt-3 font-disp italic font-bold"><span class="text-xl">NOSOTROS</span><span class="text-5xl num">${f} - ${c}</span><span class="text-xl text-mute">RIVAL</span></div>
    <div class="grid grid-cols-2 gap-2 mt-3">
      <button data-a="play" class="col-span-2 min-h-16 rounded-2xl font-disp text-3xl font-bold italic ${m.running?'bg-amber text-ink':'bg-turf text-ink'}">${m.running?'PAUSA':(el()>0?'SEGUIR':'¡INICIAR!')}</button>
      <button data-a="next" ${m.part===2?'disabled':''} class="min-h-14 rounded-2xl bg-bench font-bold ${m.part===2?'opacity-40':''}">Siguiente parte</button>
      <button data-a="reset" class="min-h-14 rounded-2xl bg-bench font-bold text-red-300">Reiniciar</button></div></div>
  <div data-t="alert" class="mt-3"></div><div data-t="adv" class="mt-3"></div>
  ${u?`<button data-a="undo" class="w-full mt-3 min-h-12 rounded-2xl border-2 border-amber text-amber font-bold truncate px-3">↶ Deshacer: ${esc(u.label)}</button>`:''}
  <div class="grid grid-cols-2 gap-2 mt-3"><button data-a="shot" data-id="favor" class="min-h-16 rounded-2xl bg-turf text-ink font-disp text-2xl font-bold italic">TIRO A FAVOR</button>
    <button data-a="shot" data-id="contra" class="min-h-16 rounded-2xl bg-bench border-2 border-benchl text-chalk font-disp text-2xl font-bold italic">TIRO EN CONTRA</button></div>
  <p class="text-center text-mute text-sm mt-1">A puerta: ${tf} a favor (${f} goles) · ${tc} en contra (${c} goles)</p>
  <div class="bg-panel border border-line rounded-2xl p-3 mt-3 space-y-2"><h2 class="font-disp text-2xl font-bold italic">Anotar rápido</h2>
    ${qrow(m,'Tiro fuera','tiro')}${qrow(m,'Córner','corner')}${qrow(m,'Falta','falta')}${qrow(m,'Ocasión clara','ocasion')}
    <div class="grid grid-cols-2 gap-2"><button data-a="card" class="min-h-12 rounded-xl bg-bench font-bold">🟨 Tarjeta</button><button data-a="valopen" class="min-h-12 rounded-xl bg-bench font-bold">＋／－ Valorar</button></div></div>
  <div class="bg-panel border border-line rounded-2xl p-3 mt-3"><div class="flex items-center gap-2"><span class="font-semibold">Sistema</span>
    <select data-a="form" class="flex-1 h-12 rounded-xl bg-ink px-2 text-chalk font-semibold">${optsForm(m.form)}</select>
    <span class="px-3 py-1 rounded-full text-sm font-bold ${BADGE[F.k]}">${F.c}</span></div>
    <p class="mt-2 text-sm text-mute">${sg.txt}</p><div class="flex flex-wrap gap-2 mt-2">${sg.g.map(k=>`<button data-a="sug" data-id="${k}" class="chip">${k} · ${FORMS[k].c}</button>`).join('')}</div></div>
  <div class="flex items-baseline justify-between mt-5 mb-2"><h2 class="font-disp text-3xl font-bold italic text-turf">EN CAMPO</h2>
    <span class="text-sm font-semibold text-right ${m.sel?'text-amber':'text-mute'}">${m.sel?'Toca a un suplente (cambio) o a otro jugador del campo (intercambiar posición)':'Toca a un jugador para cambiarlo o moverlo de posición'}</span></div>
  <div class="pitch">${F.rows.map(r=>`<div class="prow">${r.map(tok).join('')}</div>`).join('')}</div>
  <h2 class="font-disp text-3xl font-bold italic text-benchl mt-5 mb-2">BANQUILLO <span class="text-mute">${bench.length}</span></h2><div class="grid grid-cols-2 gap-2">`;
  const mn=(S.minMin||0)*60000;
  bench.forEach(id=>{const low=mn&&pm(id)<mn;h+=`<button data-a="in" data-id="${id}" class="bcard ${m.sel?'go':''}"><span class="jersey blu">${esc(short(id)[0])}</span>
    <span class="min-w-0"><span class="block font-bold text-lg truncate">${esc(short(id))}</span><span data-pm="${id}" class="num block ${low?'text-amber':'text-mute'} font-semibold leading-tight">${fmt(pm(id))}</span>
    <span class="block font-disp text-lg font-bold italic ${m.sel?'text-amber':'text-benchl'}">ENTRAR</span></span></button>`});
  if(!bench.length)h+=`<p class="text-mute col-span-2">No hay suplentes convocados.</p>`;
  const evs=[...m.events.map(v=>({v})),...m.acts.map((v,i)=>({v,i,s:1}))].sort((a,b)=>b.v.t-a.v.t);
  h+=`</div><h2 class="font-disp text-3xl font-bold italic mt-5 mb-2">EVENTOS</h2>`;
  h+=evs.length?`<ul class="space-y-1">`+evs.map(x=>`<li class="bg-panel rounded-xl pl-3 pr-1 py-2 flex items-center gap-2"><span class="flex-1 text-mute">${esc(evTxt(x.v))}</span>${x.s?`<button data-a="dels" data-id="${x.i}" class="w-10 h-10 text-mute text-xl" aria-label="Quitar evento">×</button>`:''}</li>`).join('')+`</ul>`:`<p class="text-mute">Todavía no hay eventos.</p>`;
  return h+`<button data-a="fin" class="w-full mt-6 min-h-16 rounded-2xl bg-red-500/90 text-ink font-disp text-3xl font-bold italic">FINALIZAR PARTIDO</button>`;
}
const chips=(k,ids,cur,a)=>`<div class="flex flex-wrap gap-2">`+ids.map(id=>`<button data-a="${a||'dpick'}" data-k="${k}" data-id="${id}" class="chip ${cur===id?'on':''}">${esc(short(id))}</button>`).join('')+`</div>`;
const txtChips=(k,arr,cur)=>`<div class="flex flex-wrap gap-2">`+arr.map(o=>`<button data-a="dtxt" data-k="${k}" data-id="${esc(o)}" class="chip ${cur===o?'on':''}">${o}</button>`).join('')+`</div>`;
function nextJornada(){const n=S.history.map(g=>parseInt(g.jornada,10)).filter(x=>x>0);return n.length?Math.max(...n)+1:1}
function vDlg(){
  const m=S.match,d=DLG;
  if(d.k==='fin'){const s=sc(m);return sheet(`<h2 class="font-disp text-3xl font-bold italic mb-3">Finalizar partido</h2>
    <label class="block text-mute text-sm mb-1">Rival</label><input id="fr" class="${inp} mb-2">
    <div class="grid grid-cols-2 gap-2"><label class="text-mute text-sm">Fecha<input id="ff" type="date" value="${new Date().toLocaleDateString('sv-SE')}" class="${inp}"></label>
    <label class="text-mute text-sm">Jornada<input id="fj" type="number" inputmode="numeric" min="1" value="${nextJornada()}" class="${inp}"></label>
    <label class="text-mute text-sm">Competición${sel('fcomp',COMPS,S.lastComp||'Liga')}</label>
    <label class="text-mute text-sm">Local / visitante${sel('floc',LOCS,'Local')}</label>
    <label class="text-mute text-sm">Goles a favor<input id="fg" type="number" inputmode="numeric" min="0" value="${s.f}" class="${inp} text-center text-xl"></label>
    <label class="text-mute text-sm">Goles en contra<input id="fc" type="number" inputmode="numeric" min="0" value="${s.c}" class="${inp} text-center text-xl"></label></div>
    <p class="text-mute text-sm mt-2">Los goles vienen de los anotados en el partido. Corrígelos si falta alguno. Después podrás añadir notas.</p>
    <div class="grid grid-cols-2 gap-2 mt-4"><button data-a="dcancel" class="${btn2}">Cancelar</button><button data-a="dfin" class="min-h-14 rounded-2xl bg-turf text-ink font-bold">Guardar partido</button></div>`)}
  if(d.k==='card'){return sheet(`<h2 class="font-disp text-3xl font-bold italic mb-3">Tarjeta</h2><div class="grid grid-cols-2 gap-2 mb-2">
    <button data-a="dtxt" data-k="lado" data-id="favor" class="min-h-14 rounded-2xl font-bold ${d.lado==='favor'?'bg-turf text-ink':'bg-bench'}">A uno nuestro</button>
    <button data-a="dtxt" data-k="lado" data-id="contra" class="min-h-14 rounded-2xl font-bold ${d.lado==='contra'?'bg-turf text-ink':'bg-bench'}">Al rival</button>
    <button data-a="dtxt" data-k="color" data-id="amarilla" class="min-h-14 rounded-2xl font-bold ${d.color==='amarilla'?'bg-amber text-ink':'bg-bench'}">🟨 Amarilla</button>
    <button data-a="dtxt" data-k="color" data-id="roja" class="min-h-14 rounded-2xl font-bold ${d.color==='roja'?'bg-red-500 text-ink':'bg-bench'}">🟥 Roja</button></div>
    ${d.lado==='favor'?`<p class="text-mute text-sm mb-1">Jugador</p>${chips('quien',m.onField,d.quien)}`:''}
    <div class="grid grid-cols-2 gap-2 mt-4"><button data-a="dcancel" class="${btn2}">Cancelar</button><button data-a="dsave" class="min-h-14 rounded-2xl bg-turf text-ink font-bold">Guardar</button></div>`)}
  if(d.k==='val'){return sheet(`<h2 class="font-disp text-3xl font-bold italic mb-1">Valoración rápida</h2><p class="text-mute text-sm mb-3">＋ = acierto destacable · － = fallo importante. Cada toque se guarda; puedes deshacerlo.</p>
    <div class="space-y-2">${m.onField.map(id=>{const vp=cnt(m.acts,a=>a.k==='val'&&a.quien===id&&a.signo>0),vn=cnt(m.acts,a=>a.k==='val'&&a.quien===id&&a.signo<0);
     return`<div class="flex items-center gap-2 bg-ink rounded-2xl p-2"><span class="flex-1 font-bold text-lg truncate pl-1">${esc(short(id))}</span>
      <button data-a="vneg" data-id="${id}" class="w-20 h-12 rounded-xl bg-red-500/80 text-ink font-bold text-lg">－ ${vn}</button><button data-a="vpos" data-id="${id}" class="w-20 h-12 rounded-xl bg-turf text-ink font-bold text-lg">＋ ${vp}</button></div>`}).join('')}</div>
    <button data-a="dcancel" class="w-full mt-4 ${btn2}">Cerrar</button>`)}
  if(d.k==='edit')return vEdit();
  const fav=d.lado==='favor';
  let h=`<h2 class="font-disp text-3xl font-bold italic mb-3">${fav?'Tiro a favor':'Tiro en contra'}</h2><div class="grid grid-cols-3 gap-2">
    <button data-a="dres" data-id="gol" class="min-h-16 rounded-2xl font-disp text-xl font-bold italic ${d.res==='gol'?'bg-amber text-ink':'bg-bench'}">${fav?'GOL':'GOL EN CONTRA'}</button>
    <button data-a="dres" data-id="parada" class="min-h-16 rounded-2xl font-disp text-2xl font-bold italic ${d.res==='parada'?'bg-amber text-ink':'bg-bench'}">PARADA</button>
    <button data-a="dres" data-id="fuera" class="min-h-16 rounded-2xl font-disp text-2xl font-bold italic ${d.res==='fuera'?'bg-amber text-ink':'bg-bench'}">FUERA</button></div>`;
  if(fav&&d.res==='gol')h+=`<p class="text-mute text-sm mt-3 mb-1">Goleador (opcional)</p>${chips('autor',m.onField,d.autor)}<p class="text-mute text-sm mt-3 mb-1">Asistente (opcional)</p>${chips('asist',m.onField.filter(x=>x!==d.autor),d.asist)}<p class="text-mute text-sm mt-3 mb-1">Origen del gol</p>${txtChips('orig',ORIG,d.orig)}`;
  if(fav&&d.res&&d.res!=='gol')h+=`<p class="text-mute text-sm mt-3 mb-1">Tirador (opcional)</p>${chips('autor',m.onField,d.autor)}`;
  if(fav&&d.res)h+=`<button data-a="dpen" aria-pressed="${!!d.pen}" class="mt-3 w-full min-h-12 rounded-xl font-bold ${d.pen?'bg-amber text-ink':'bg-bench'}">Penalti ${d.pen?'· SÍ':'· no'}</button>`;
  if(!fav&&d.res==='gol')h+=`<p class="text-mute text-sm mt-3 mb-1">Causa del gol en contra</p>${txtChips('orig',CAUS,d.orig)}`;
  if(!fav&&d.res&&d.res!=='fuera')h+=`<p class="text-mute text-sm mt-3">Portero: <b class="text-chalk">${esc(short(m.onField[0]))}</b> (el jugador en la posición de portero)</p>`;
  if(!fav&&d.res)h+=`<button data-a="dpen" aria-pressed="${!!d.pen}" class="mt-3 w-full min-h-12 rounded-xl font-bold ${d.pen?'bg-amber text-ink':'bg-bench'}">Penalti ${d.pen?'· SÍ':'· no'}</button>`;
  return sheet(h+`<div class="grid grid-cols-2 gap-2 mt-4"><button data-a="dcancel" class="${btn2}">Cancelar</button><button data-a="dsave" ${d.res?'':'disabled'} class="min-h-14 rounded-2xl font-bold ${d.res?'bg-turf text-ink':'bg-line text-mute'}">Guardar</button></div>`);
}
function vEdit(){
  const g=S.history.find(x=>String(x.id)===String(DLG.id));if(!g)return'';
  const st=gstats(g),T=S;
  const nrow=x=>{const n=g.notes[x.id]||{tags:[],txt:'',mol:false},t=n.tags||[];
    return`<div class="bg-ink rounded-2xl p-2"><div class="font-bold mb-1">${esc(x.name)}</div><div class="flex flex-wrap gap-2">
     <button data-a="ntag" data-id="${x.id}" data-k="destacó" class="chip ${t.includes('destacó')?'on':''}">Destacó</button>
     <button data-a="ntag" data-id="${x.id}" data-k="a mejorar" class="chip ${t.includes('a mejorar')?'on':''}">A mejorar</button>
     <button data-a="ntag" data-id="${x.id}" data-k="mol" class="chip ${n.mol?'on':''}">Molestia 🔒</button></div>
     <input data-e="nt" data-id="${x.id}" value="${esc(n.txt||'')}" placeholder="Nota (opcional)" class="${inp} mt-2 h-11 text-base"></div>`};
  return sheet(`<h2 class="font-disp text-3xl font-bold italic mb-3">${DLG.fresh?'Partido guardado · notas':'Editar partido'}</h2>
   <div class="grid grid-cols-2 gap-2"><label class="col-span-2 text-mute text-sm">Rival<input data-e="rival" value="${esc(g.rival||'')}" class="${inp}"></label>
   <label class="text-mute text-sm">Fecha<input data-e="fecha" type="date" value="${ymd(g)}" class="${inp}"></label>
   <label class="text-mute text-sm">Jornada<input data-e="jornada" value="${esc(g.jornada)}" inputmode="numeric" class="${inp}"></label>
   <label class="text-mute text-sm">Competición${sel('',COMPS,g.comp,'comp')}</label><label class="text-mute text-sm">Local / visitante${sel('',LOCS,g.loc,'loc')}</label>
   <label class="text-mute text-sm">Goles a favor<input data-e="gf" type="number" inputmode="numeric" min="0" value="${g.gf==null?'':g.gf}" class="${inp} text-center"></label>
   <label class="text-mute text-sm">Goles en contra<input data-e="gc" type="number" inputmode="numeric" min="0" value="${g.gc==null?'':g.gc}" class="${inp} text-center"></label></div>
   <h3 class="font-disp text-2xl font-bold italic mt-4 mb-1">Notas por jugador</h3>
   <p class="text-mute text-xs mb-2">🔒 «Molestia» solo se guarda en este móvil: no sale en ninguna exportación.</p><div class="space-y-2">${g.players.map(nrow).join('')}</div>
   <details class="mt-4 bg-ink rounded-2xl p-3"><summary class="font-bold">Corregir minutos de cada jugador</summary><div class="space-y-2 mt-2">${g.players.map(x=>`<label class="flex items-center gap-2"><span class="flex-1 truncate">${esc(x.name)}</span><input data-e="min" data-id="${x.id}" type="number" step="0.1" min="0" inputmode="decimal" value="${r1(x.ms)}" class="w-24 h-11 rounded-xl bg-panel px-2 text-center border border-line"></label>`).join('')}</div></details>
   <details class="mt-2 bg-ink rounded-2xl p-3"><summary class="font-bold">Eventos del partido (${g.acts.length})</summary><ul class="space-y-1 mt-2">${g.acts.map((a,i)=>({a,i})).sort((x,y)=>x.a.t-y.a.t).map(({a,i})=>`<li class="flex items-center gap-2 text-sm text-mute"><span class="flex-1">${esc(evTxt(a,{players:g.players}))}</span><button data-a="edel" data-id="${i}" class="w-10 h-10 text-xl" aria-label="Quitar">×</button></li>`).join('')||'<li class="text-mute">Sin eventos.</li>'}</ul></details>
   <button data-a="dcancel" class="w-full mt-4 min-h-14 rounded-2xl bg-turf text-ink font-bold">Listo</button>`);
}
function totals(){
  const a=analysis();return a.P;
}
function vHist(){
  const Hs=S.history,pj=Hs.filter(g=>g.gf!=null),w=pj.filter(g=>g.gf>g.gc).length,e=pj.filter(g=>g.gf===g.gc).length,l=pj.filter(g=>g.gf<g.gc).length;
  const bks=listBak();
  let h=`<h1 class="font-disp text-5xl font-bold italic">Historial</h1><p class="text-mute mb-3">${Hs.length} partido${Hs.length===1?'':'s'} guardado${Hs.length===1?'':'s'}.</p>`;
  h+=`<div class="grid grid-cols-2 gap-2 mb-4"><button data-a="xl" ${Hs.length?'':'disabled'} class="col-span-2 min-h-14 rounded-2xl font-bold text-lg ${Hs.length?'bg-turf text-ink':'bg-line text-mute'}">Exportar a Excel (.xlsx)</button>
    <button data-a="csv" ${Hs.length?'':'disabled'} class="${btn2}">Datos CSV (.zip)</button><button data-a="json" class="${btn2}">Copia JSON</button>
    <button data-a="imp" class="col-span-2 min-h-12 rounded-2xl border border-line text-mute font-semibold">Importar copia (.json)</button></div>`;
  if(bks.length)h+=`<details class="bg-panel border border-line rounded-2xl p-3 mb-4"><summary class="font-semibold">Copias automáticas en este móvil (${bks.length})</summary><div class="space-y-2 mt-2">`+bks.map(b=>`<div class="flex items-center gap-2"><span class="flex-1 text-sm text-mute">${new Date(b.at).toLocaleString('es-ES')} · ${esc(b.why)} · ${b.n} partidos</span><button data-a="rbak" data-id="${b.i}" class="min-h-11 px-3 rounded-xl bg-bench font-bold">Restaurar</button></div>`).join('')+`</div></details>`;
  if(!Hs.length)return h+`<p class="bg-panel rounded-2xl p-4 text-mute">Cuando finalices un partido aparecerá aquí.</p>`;
  h+=`<div class="bg-panel border border-line rounded-2xl p-3 mb-4 grid grid-cols-4 text-center"><div><div class="font-disp text-3xl font-bold italic">${w}</div><div class="text-mute text-xs">Ganados</div></div><div><div class="font-disp text-3xl font-bold italic">${e}</div><div class="text-mute text-xs">Empates</div></div><div><div class="font-disp text-3xl font-bold italic">${l}</div><div class="text-mute text-xs">Perdidos</div></div><div><div class="font-disp text-3xl font-bold italic">${pj.reduce((a,g)=>a+g.gf,0)}-${pj.reduce((a,g)=>a+g.gc,0)}</div><div class="text-mute text-xs">Goles</div></div></div>`;
  h+=`<h2 class="font-disp text-3xl font-bold italic mb-2">Partidos</h2><div class="space-y-2">`;
  Hs.slice().reverse().forEach(g=>{const r=g.gf==null?'':g.gf>g.gc?'bg-turf text-ink':g.gf===g.gc?'bg-amber text-ink':'bg-red-500 text-ink';
    h+=`<div class="bg-panel rounded-2xl pl-4 pr-2 py-2"><div class="flex items-center gap-2"><div class="flex-1 min-w-0"><div class="font-semibold truncate">${g.jornada?'J'+esc(g.jornada)+' · ':''}${esc(g.rival||'Partido')}</div><div class="text-mute text-sm">${new Date(g.date).toLocaleDateString('es-ES')} · ${[g.comp,g.loc].filter(Boolean).join(' · ')||fmt(g.total)}</div></div>
    ${g.gf==null?'':`<span class="px-3 py-1 rounded-full font-bold num ${r}">${g.gf} - ${g.gc}</span>`}</div>
    <div class="grid grid-cols-2 gap-2 mt-2"><button data-a="editg" data-id="${g.id}" class="min-h-11 rounded-xl bg-bench font-bold">Editar</button><button data-a="delm" data-id="${g.id}" class="min-h-11 rounded-xl bg-red-500/20 text-red-300 font-bold">Borrar</button></div></div>`});
  return h+`</div>`;
}
/* ---- análisis ---- */
const bar=(v,mx,c)=>`<div class="h-1.5 rounded-full bg-ink mt-1"><div class="h-full rounded-full ${c||'bg-turf'}" style="width:${mx?Math.max(0,Math.min(100,v/mx*100)):0}%"></div></div>`;
const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';
const sgn=v=>(v>0?'+':'')+v;
function vAna(){
  const Hs=S.history;
  let h=`<h1 class="font-disp text-5xl font-bold italic">Análisis</h1>`;
  if(!Hs.length)return h+`<p class="bg-panel rounded-2xl p-4 text-mute mt-3">Aún no hay partidos guardados. Cuando finalices alguno verás aquí el reparto de minutos, el +/−, los sistemas y mucho más.</p>`;
  const A=analysis(),T=A.T,P=A.P.slice(),field=P.filter(p=>p.ms>0);
  const mean=P.length?P.reduce((s,p)=>s+(p.conv?p.ms/p.conv:0),0)/P.length/60000:0;
  h+=`<p class="text-mute mb-3">${Hs.length} partido${Hs.length===1?'':'s'} · ${S.players.length} jugadores</p>
  <div class="grid grid-cols-2 gap-2 mb-4">
   <div class="bg-panel border border-line rounded-2xl p-3"><div class="text-mute text-xs">Goles a favor / en contra</div><div class="font-disp text-3xl font-bold italic">${T.gf} - ${T.gc}</div></div>
   <div class="bg-panel border border-line rounded-2xl p-3"><div class="text-mute text-xs">Efectividad (goles / tiros a puerta)</div><div class="font-disp text-3xl font-bold italic">${pct(T.gf,T.tpf)}</div><div class="text-mute text-xs">${T.gf} de ${T.tpf} tiros</div></div>
   <div class="bg-panel border border-line rounded-2xl p-3"><div class="text-mute text-xs">% de paradas del equipo</div><div class="font-disp text-3xl font-bold italic">${pct(T.parp,T.parp+T.gc)}</div><div class="text-mute text-xs">${T.parp} paradas, ${T.gc} goles</div></div>
   <div class="bg-panel border border-line rounded-2xl p-3"><div class="text-mute text-xs">Tiros fuera a favor</div><div class="font-disp text-3xl font-bold italic">${T.tff}</div></div></div>`;
  h+=`<h2 class="font-disp text-3xl font-bold italic mb-1">Reparto de minutos</h2><p class="text-mute text-sm mb-2">Media por partido al que fue convocado. La media del equipo es ${mean.toFixed(1)}'.</p><div class="space-y-2 mb-5">`;
  const mx=Math.max(1,...P.map(p=>p.conv?p.ms/p.conv/60000:0));
  P.sort((a,b)=>(b.conv?b.ms/b.conv:0)-(a.conv?a.ms/a.conv:0)).forEach(p=>{const av=p.conv?p.ms/p.conv/60000:0,d=av-mean;
    h+=`<div class="bg-panel border border-line rounded-2xl px-3 py-2"><div class="flex justify-between items-baseline"><span class="font-bold">${esc(p.name)}</span><span class="num font-disp text-xl font-bold">${av.toFixed(1)}' <span class="text-sm ${d<-3?'text-amber':'text-mute'}">${sgn(+d.toFixed(1))}</span></span></div>${bar(av,mx,d<-3?'bg-amber':'bg-turf')}
    <div class="text-mute text-xs mt-1">${Math.round(p.ms/60000)} min en total · ${p.pj}/${p.conv} partidos · ${p.tit} titular</div></div>`});
  h+=`</div><h2 class="font-disp text-3xl font-bold italic mb-2">Rendimiento por jugador</h2><div class="overflow-x-auto mb-5"><table class="w-full text-sm num"><thead class="text-mute"><tr><th class="text-left py-1">Jugador</th><th>G</th><th>A</th><th>+/−</th><th>Val</th><th>Fuera</th></tr></thead><tbody>`;
  P.slice().sort((a,b)=>(b.gol+b.asist)-(a.gol+a.asist)||b.ms-a.ms).forEach(p=>{
    h+=`<tr class="border-t border-line text-center"><td class="text-left py-1.5 font-semibold">${esc(p.name)}</td><td>${p.gol}</td><td>${p.asist}</td><td class="${p.gfc-p.gcc<0?'text-red-300':''}">${p.onGames?sgn(p.gfc-p.gcc):'—'}</td><td>${p.vp||p.vn?sgn(p.vp-p.vn):'—'}</td><td>${p.fuera}</td></tr>`});
  h+=`</tbody></table></div>`;
  const gk=P.filter(p=>p.par+p.enc>0);
  if(gk.length)h+=`<h2 class="font-disp text-3xl font-bold italic mb-2">Porteros</h2><div class="space-y-2 mb-5">`+gk.map(p=>`<div class="bg-panel border border-line rounded-2xl px-3 py-2 flex justify-between"><span class="font-bold">${esc(p.name)}</span><span class="num">${p.par} paradas · ${p.enc} encajados · <b>${pct(p.par,p.par+p.enc)}</b></span></div>`).join('')+`</div>`;
  const ss=Object.entries(A.sis);
  if(ss.length)h+=`<h2 class="font-disp text-3xl font-bold italic mb-1">Rendimiento por sistema</h2><p class="text-mute text-sm mb-2">Goles marcados y recibidos mientras se jugaba con cada sistema.</p><div class="space-y-2 mb-5">`+ss.sort((a,b)=>b[1].ms-a[1].ms).map(([k,o])=>{const m60=o.ms/60000;
    return`<div class="bg-panel border border-line rounded-2xl px-3 py-2 flex items-center justify-between"><span class="font-bold">${k}${FORMS[k]?` <span class="text-mute font-normal text-sm">${FORMS[k].c}</span>`:''}</span><span class="num text-sm">${m60.toFixed(0)} min · ${o.gf}-${o.gc} · <b class="${o.gf-o.gc<0?'text-red-300':''}">${m60?sgn(+((o.gf-o.gc)/m60*10).toFixed(1)):'—'}</b> cada 10'</span></div>`}).join('')+`</div>`;
  const bm=Math.max(1,...A.bins.map(b=>Math.max(b.gf,b.gc)));
  h+=`<h2 class="font-disp text-3xl font-bold italic mb-2">Goles por franja de 10 minutos</h2><div class="bg-panel border border-line rounded-2xl p-3 mb-5 space-y-2">`+A.bins.map((b,i)=>`<div><div class="flex justify-between text-sm"><span>${i*10}'–${Math.min((i+1)*10,TEAMS[ALL.cur].half*2)}'</span><span class="num"><b>${b.gf}</b> a favor · <b>${b.gc}</b> en contra</span></div>${bar(b.gf,bm)}${bar(b.gc,bm,'bg-red-400')}</div>`).join('')+`</div>`;
  if(A.duos.length)h+=`<h2 class="font-disp text-3xl font-bold italic mb-2">Dúos asistente → goleador</h2><div class="space-y-1 mb-5">`+A.duos.slice(0,8).map(([k,n])=>{const [a,b]=k.split('>');return`<div class="bg-panel rounded-xl px-3 py-2 flex justify-between"><span>${esc(short(a))} → ${esc(short(b))}</span><b class="num">${n}</b></div>`}).join('')+`</div>`;
  h+=`<h2 class="font-disp text-3xl font-bold italic mb-1">Equilibrio de minutos por partido</h2><p class="text-mute text-sm mb-2">Desviación típica de los minutos de los jugadores de campo: cuanto más baja, más repartido.</p><div class="space-y-1 mb-4">`+A.dev.map(d=>`<div class="bg-panel rounded-xl px-3 py-2 flex justify-between text-sm"><span class="truncate">P${d.n} ${esc(d.rival||'')}</span><span class="num">σ ${d.sd.toFixed(1)}' · de ${d.mn.toFixed(0)}' a ${d.mx.toFixed(0)}'</span></div>`).join('')+`</div>`;
  return h;
}
function render(){
  const T=TEAMS[ALL.cur],v={setup:vSetup,match:vMatch,hist:vHist,ana:vAna}[ALL.tab]();
  const keep=$('#newp')?$('#newp').value:'';
  $('#app').innerHTML=`<header class="flex items-center gap-3 mb-3"><img src="${CREST}" alt="Escudo Club San José del Parque" class="w-14 h-14 rounded-full shrink-0 ring-2 ring-turf"><div class="leading-tight"><div class="font-disp text-3xl font-bold italic">${T.name}</div><div class="text-mute text-sm font-semibold">Club San José del Parque · Fútbol 7 · ${T.half}×2 min</div></div><a href="ftms/" data-a="ftms" class="ml-auto shrink-0 h-11 px-3 rounded-xl bg-bench border border-line font-bold text-sm text-benchl flex items-center gap-1" aria-label="Abrir FTMS (suite táctica)">📋 FTMS</a></header>
  <div class="grid grid-cols-2 gap-2 mb-4">`+Object.keys(TEAMS).map(id=>{const t=TEAMS[id],run=ALL.teams[id].match&&ALL.teams[id].match.running;
    return`<button data-a="team" data-id="${id}" class="min-h-12 rounded-2xl font-bold ${ALL.cur===id?'bg-turf text-ink':'bg-bench text-benchl'}">${t.name}${run?' ●':''}</button>`}).join('')+`</div>`+v+(DLG&&(S.match||DLG.k==='edit')?vDlg():'');
  if($('#newp'))$('#newp').value=keep;
  $('#nav').innerHTML=[['setup','📋','Plantilla'],['match','⚽','Partido'],['hist','🏆','Historial'],['ana','📊','Análisis']].map(([id,i,l])=>
    `<button data-a="tab" data-id="${id}" class="min-h-16 font-bold text-sm ${ALL.tab===id?'text-turf':'text-mute'}"><span class="block text-xl leading-none">${i}</span>${l}${id==='match'&&S.match&&S.match.running?' ●':''}</button>`).join('');
  tick(true);
}
const alertHtml=m=>`<div class="rounded-2xl bg-amber text-ink p-3 font-bold">⏱ Se ha cumplido el tiempo de la ${m.part}ª parte (${m.half}').
  <div class="grid grid-cols-2 gap-2 mt-2"><button data-a="${m.part===1?'next':'fin'}" class="min-h-12 rounded-xl bg-ink text-chalk">${m.part===1?'Siguiente parte':'Finalizar partido'}</button><button data-a="ack" class="min-h-12 rounded-xl bg-amber text-ink border-2 border-ink">Dar añadido</button></div></div>`;
const advHtml=(ad)=>ad?`<div class="rounded-2xl border-2 border-benchl bg-bench p-3"><div class="font-bold">🔄 Sugerencia de cambio</div><div class="text-sm mt-1">${esc(ad.txt)}</div><button data-a="adv" class="mt-2 w-full min-h-12 rounded-xl bg-turf text-ink font-bold">Aplicar: entra ${esc(short(ad.inn))} por ${esc(short(ad.out))}</button></div>`:'';
function tick(force){
  const m=S.match;if(!m||ALL.tab!=='match')return;
  const e=el(),L=lim(m),st=m.part===1?0:m.p1End,over=e>L;
  const c=$('[data-t=clock]');if(c){c.textContent=fmt(e);c.style.color=over?'#f4b53f':''}
  const b=$('[data-t=bar]');if(b){b.style.width=Math.min(100,(e-st)/(m.half*60000)*100)+'%';b.style.background=over?'#f4b53f':''}
  const a=$('[data-t=add]');if(a)a.textContent=over?'+'+fmt(e-L)+' de tiempo añadido':'';
  const mn=$('[data-t=min]');if(mn)mn.textContent='Min '+mtxt(mark(m,e));
  document.querySelectorAll('[data-pm]').forEach(n=>n.textContent=fmt(pm(n.dataset.pm)));
  const al=$('[data-t=alert]'),hit=e>=L&&!m.ack[m.part];
  if(al){const html=hit?alertHtml(m):'';if(al.dataset.h!==html){al.innerHTML=html;al.dataset.h=html}}
  if(hit&&!m.alerted){m.alerted={}}
  if(hit&&!m.alerted[m.part]){m.alerted[m.part]=1;vib([300,120,300,120,300]);beep();save()}
  const ad=$('[data-t=adv]');if(ad&&!DLG){const html=hit?'':advHtml(advice(m));if(ad.dataset.h!==html){ad.innerHTML=html;ad.dataset.h=html}}
}
function beep(){try{const C=window.AudioContext||window.webkitAudioContext,x=new C(),o=x.createOscillator(),g=x.createGain();o.frequency.value=880;g.gain.value=.2;o.connect(g);g.connect(x.destination);o.start();setTimeout(()=>{o.stop();x.close()},600)}catch(e){}}
setInterval(tick,250);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});

/* ---- 04-export.js ---- */
/* ===== exportación: filas, XLSX propio (sin librerías), CSV, JSON ===== */
const HD={
 j:['jugador_id','jugador','posicion_habitual','en_plantilla'],
 p:['partido_n','partido_id','fecha','jornada','competicion','local_visitante','rival','duracion_min','minutos_reloj','cambios','goles_favor','goles_contra','resultado','tiros_puerta_favor','tiros_puerta_contra','tiros_fuera_favor','tiros_fuera_contra','paradas_portero','paradas_rival','corners_favor','corners_contra','faltas_favor','faltas_contra','ocasiones_favor','ocasiones_contra','amarillas_propias','amarillas_rival','rojas_propias','rojas_rival','penaltis_favor','penaltis_contra','anadido_p1_min','anadido_p2_min','sistemas','convocados'],
 d:['partido_n','partido_id','fecha','rival','duracion_min','jugador_id','jugador','posicion','titular','minutos','pct_partido','entradas','salidas','goles','asistencias','paradas','goles_encajados','gf_campo','gc_campo','mas_menos','tiros_fuera','amarillas','rojas','val_pos','val_neg','pen_lanzados','pen_marcados'],
 c:['partido_n','partido_id','tipo','parte','minuto','anadido','entra_id','entra','sale_id','sale','detalle'],
 e:['partido_n','partido_id','parte','minuto','anadido','tipo','lado','resultado','jugador_id','jugador','asistente_id','asistente','portero_id','portero','detalle','penalti','marcador_favor','marcador_contra'],
 o:['partido_n','partido_id','jugador_id','jugador','posicion','minutos'],
 n:['partido_n','partido_id','jugador_id','jugador','etiquetas','nota']};
const gid=id=>id?TEAMS[ALL.cur].pfx+'-'+id:'';
const gnm=(g,id)=>{if(!id)return'';const x=g.players.find(p=>p.id===id);if(x)return x.name;const p=S.players.find(p=>p.id===id);return p?p.name:''};
function allPlayers(){
  const L=S.players.map(p=>({id:p.id,name:p.name,pos:p.pos,act:p.conv?1:0}));
  S.history.forEach(g=>g.players.forEach(x=>{if(!L.some(p=>p.id===x.id))L.push({id:x.id,name:x.name,pos:x.pos,act:0})}));
  return L;
}
const rowsJug=()=>allPlayers().map(p=>({jugador_id:gid(p.id),jugador:p.name,posicion_habitual:p.pos||'',en_plantilla:S.players.some(q=>q.id===p.id)?1:0}));
function rowsDatos(){
  const R=[];
  S.history.forEach((g,i)=>{const st=gstats(g),sb=g.events.filter(v=>v.k==='sub');
    g.players.forEach(x=>{const s=st[x.id],on=st._on;
      R.push({partido_n:i+1,partido_id:g.id,fecha:ymd(g),rival:g.rival||'',duracion_min:r1(g.total),jugador_id:gid(x.id),jugador:x.name,posicion:x.pos||'',titular:x.titular?1:0,minutos:r1(x.ms),
        pct_partido:g.total?Math.round(x.ms/g.total*1000)/1000:0,entradas:sb.filter(v=>v.entra===x.id).length,salidas:sb.filter(v=>v.sale===x.id).length,
        goles:s.gol,asistencias:s.asist,paradas:s.par,goles_encajados:s.enc,gf_campo:on?s.gfc:'',gc_campo:on?s.gcc:'',mas_menos:on?s.gfc-s.gcc:'',
        tiros_fuera:s.fuera,amarillas:s.am,rojas:s.ro,val_pos:s.vp,val_neg:s.vn,pen_lanzados:s.penL,pen_marcados:s.penM})})});
  return R;
}
function rowsPartidos(){
  return S.history.map((g,i)=>{const t=gteam(g),has=g.gf!=null;
    return{partido_n:i+1,partido_id:g.id,fecha:ymd(g),jornada:g.jornada||'',competicion:g.comp||'',local_visitante:g.loc||'',rival:g.rival||'',duracion_min:r1(g.total),minutos_reloj:r1(g.total),
      cambios:g.events.filter(v=>v.k==='sub').length,goles_favor:has?g.gf:'',goles_contra:has?g.gc:'',resultado:has?(g.gf>g.gc?'G':g.gf===g.gc?'E':'P'):'',
      tiros_puerta_favor:t.tpf,tiros_puerta_contra:t.tpc,tiros_fuera_favor:t.tff,tiros_fuera_contra:t.tfc,paradas_portero:t.parp,paradas_rival:t.parr,
      corners_favor:t.cf,corners_contra:t.cc,faltas_favor:t.ff,faltas_contra:t.fc,ocasiones_favor:t.of,ocasiones_contra:t.oc,
      amarillas_propias:t.amp,amarillas_rival:t.amr,rojas_propias:t.rop,rojas_rival:t.ror,penaltis_favor:t.penf,penaltis_contra:t.penc,
      anadido_p1_min:r1(g.add1||0),anadido_p2_min:r1(g.add2||0),sistemas:g.sis||'',convocados:g.players.length}});
}
const TIPO={sub:'sustitucion',pos:'posicion',sis:'sistema'};
const rowsCambios=()=>S.history.flatMap((g,i)=>g.events.filter(v=>v.k!=='part').map(v=>({partido_n:i+1,partido_id:g.id,tipo:TIPO[v.k]||v.k,parte:v.part,minuto:v.min,anadido:v.add||0,
  entra_id:v.k==='sub'?gid(v.entra):'',entra:v.k==='sub'?gnm(g,v.entra):'',sale_id:v.k==='sub'?gid(v.sale):'',sale:v.k==='sub'?gnm(g,v.sale):'',detalle:v.det||''})));
function rowsEventos(){
  const R=[];
  S.history.forEach((g,i)=>{let mf=0,mc=0;
    g.acts.slice().sort((a,b)=>a.t-b.t).forEach(a=>{
      if(isGol(a)){a.lado==='favor'?mf++:mc++}
      const tp={tiro:'tiro',corner:'corner',falta:'falta',ocasion:'ocasion',tarjeta:'tarjeta',val:'valoracion'}[a.k]||a.k;
      const who=a.k==='tiro'?(a.lado==='favor'?a.autor:null):a.quien;
      R.push({partido_n:i+1,partido_id:g.id,parte:a.part,minuto:a.min,anadido:a.add||0,tipo:tp,lado:a.k==='val'?'':a.lado,
        resultado:a.k==='tiro'?a.res:a.k==='tarjeta'?a.color:a.k==='val'?(a.signo>0?'+1':'-1'):'',
        jugador_id:gid(who),jugador:gnm(g,who),asistente_id:gid(a.asist),asistente:gnm(g,a.asist),portero_id:gid(a.por),portero:gnm(g,a.por),
        detalle:a.orig||'',penalti:a.k==='tiro'?(a.pen?1:0):'',marcador_favor:mf,marcador_contra:mc})})});
  return R;
}
const rowsPos=()=>S.history.flatMap((g,i)=>g.players.flatMap(x=>Object.entries(x.posMs||(x.pos?{[x.pos]:x.ms}:{})).map(([k,v])=>({partido_n:i+1,partido_id:g.id,jugador_id:gid(x.id),jugador:x.name,posicion:k,minutos:r1(v)}))));
const rowsNotas=()=>S.history.flatMap((g,i)=>Object.entries(g.notes||{}).filter(([id,n])=>(n.tags&&n.tags.length)||(n.txt&&n.txt.trim())).map(([id,n])=>({partido_n:i+1,partido_id:g.id,jugador_id:gid(id),jugador:gnm(g,id),etiquetas:(n.tags||[]).join('; '),nota:(n.txt||'').trim()})));
const SHEETS=()=>[['Datos','d',rowsDatos()],['Partidos','p',rowsPartidos()],['Cambios','c',rowsCambios()],['Eventos','e',rowsEventos()],['Posiciones','o',rowsPos()],['Jugadores','j',rowsJug()],['Notas','n',rowsNotas()]];

function dl(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
const csvQ=v=>{v=String(v==null?'':v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const csvOf=(h,R)=>'﻿'+[h.join(','),...R.map(r=>h.map(c=>csvQ(r[c])).join(','))].join('\r\n');

/* ---- ZIP (sin compresión) ---- */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRCT[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function zip(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  files.forEach(f=>{
    const n=enc.encode(f.name),d=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(d);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(10,0,true);lh.setUint16(12,0x21,true);
    lh.setUint32(14,crc,true);lh.setUint32(18,d.length,true);lh.setUint32(22,d.length,true);lh.setUint16(26,n.length,true);
    parts.push(new Uint8Array(lh.buffer),n,d);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(14,0x21,true);
    ch.setUint32(16,crc,true);ch.setUint32(20,d.length,true);ch.setUint32(24,d.length,true);ch.setUint16(28,n.length,true);ch.setUint32(42,off,true);
    cen.push(new Uint8Array(ch.buffer),n);off+=30+n.length+d.length;
  });
  const csz=cen.reduce((a,x)=>a+x.length,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,csz,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,new Uint8Array(e.buffer)]);
}
/* ---- XLSX mínimo (OOXML) ---- */
function colL(i){let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-1-m)/26}return s}
const XE=s=>String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
/* estilos: 1 cabecera · 2 porcentaje · 3 cabecera "J"0 · 4 negrita · 5 decimal 0.0 */
const STY=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="0.0%"/><numFmt numFmtId="165" formatCode="&quot;J&quot;0"/><numFmt numFmtId="166" formatCode="0.0"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1A2260"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`;
function sheetXml(sh){
  let maxC=0;
  const rows=sh.rows.map((r,ri)=>{
    maxC=Math.max(maxC,r.length);
    const cells=r.map((c,ci)=>{
      if(c==null||c==='')return'';
      const ref=colL(ci)+(ri+1);let v=c,f=null,s=0;
      if(typeof c==='object'){v=c.v;f=c.f;s=c.s||0}
      if(ri===0&&sh.head&&!s)s=1;
      const sa=s?` s="${s}"`:'';
      if(f!=null)return`<c r="${ref}"${sa}${typeof v==='string'?' t="str"':''}><f>${XE(f)}</f>${v==null?'':`<v>${XE(v)}</v>`}</c>`;
      if(typeof v==='number')return isFinite(v)?`<c r="${ref}"${sa}><v>${v}</v></c>`:'';
      return`<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${XE(v)}</t></is></c>`;
    }).join('');
    return`<row r="${ri+1}"${ri===0&&sh.head?' ht="30" customHeight="1"':''}>${cells}</row>`}).join('');
  const fr=sh.freeze||[0,0],pane=(fr[0]||fr[1])?`<pane${fr[1]?` xSplit="${fr[1]}"`:''}${fr[0]?` ySplit="${fr[0]}"`:''} topLeftCell="${colL(fr[1])}${fr[0]+1}" activePane="${fr[0]&&fr[1]?'bottomRight':fr[0]?'bottomLeft':'topRight'}" state="frozen"/>`:'';
  const cols=sh.cols?`<cols>${sh.cols.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`:'';
  const af=sh.filter&&sh.rows.length>1?`<autoFilter ref="A1:${colL(maxC-1)}${sh.rows.length}"/>`:'';
  return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"${sh.first?' tabSelected="1"':''}>${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${rows}</sheetData>${af}</worksheet>`;
}
function xlsxBlob(sheets){
  const n=sheets.length,idx=Array.from({length:n},(_,i)=>i+1);sheets[0].first=true;
  const files=[
   {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${idx.map(i=>`<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`},
   {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
   {name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${XE(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`},
   {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${idx.map(i=>`<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i}.xml"/>`).join('')}<Relationship Id="rId${n+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
   {name:'xl/styles.xml',data:STY},
   ...sheets.map((s,i)=>({name:`xl/worksheets/sheet${i+1}.xml`,data:sheetXml(s)}))];
  return zip(files);
}
function buildXlsx(){
  const H=S.history,n=H.length,SH=SHEETS(),D=SH[0][2],P=allPlayers();
  const R=(h,nm)=>`Datos!$${colL(HD.d.indexOf(nm))}:$${colL(HD.d.indexOf(nm))}`;
  const idc=R(0,'jugador_id'),sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);
  const dataSheet=([nm,k,rows])=>({name:nm,head:true,filter:true,freeze:[1,0],cols:HD[k].map(c=>Math.max(10,Math.min(26,c.length+3))),rows:[HD[k],...rows.map(r=>HD[k].map(c=>r[c]))]});
  const M0=11,sumRows=[['jugador_id','Jugador','Posición habitual','TOTAL MINUTOS','PROMEDIO / PTDO','% TIEMPO JUGADO','PARTIDOS','TITULAR','GOLES','ASIST.','PARADAS',...H.map((_,i)=>({v:i+1,s:3}))]];
  const rend=[['jugador_id','Jugador','PARTIDOS','GOLES','ASIST.','G+A / PARTIDO','+/− TOTAL','GF CON ÉL EN CAMPO','GC CON ÉL EN CAMPO','TIROS FUERA','AMARILLAS','ROJAS','VAL +','VAL −','VAL NETA','PEN. LANZADOS','PEN. MARCADOS','PARADAS','GOLES ENCAJADOS','% PARADAS']];
  const bodyV=[];
  P.forEach((p,i)=>{
    const r=i+2,id=gid(p.id),rs=D.filter(x=>x.jugador_id===id),tot=sum(rs,x=>x.minutos),pj=rs.filter(x=>x.minutos>0).length,dur=sum(rs,x=>x.duracion_min),k=`${idc},$A${r}`,S_=nm=>`SUMIFS(${R(0,nm)},${k})`;
    const A=nm=>sum(rs,x=>x[nm]);
    sumRows.push([id,{f:`IFERROR(INDEX(Jugadores!$B:$B,MATCH($A${r},Jugadores!$A:$A,0)),"")`,v:p.name},{f:`IFERROR(INDEX(Jugadores!$C:$C,MATCH($A${r},Jugadores!$A:$A,0))&"","")`,v:p.pos||''},
      {f:S_('minutos'),v:tot,s:5},{f:`IFERROR(D${r}/G${r},0)`,v:pj?tot/pj:0,s:5},{f:`IFERROR(D${r}/SUMIFS(${R(0,'duracion_min')},${k}),0)`,v:dur?tot/dur:0,s:2},
      {f:`COUNTIFS(${k},${R(0,'minutos')},">0")`,v:pj},{f:S_('titular'),v:A('titular')},{f:S_('goles'),v:A('goles')},{f:S_('asistencias'),v:A('asistencias')},{f:S_('paradas'),v:A('paradas')},
      ...H.map((g,j)=>{const x=rs.find(y=>y.partido_n===j+1);return{f:`SUMIFS(${R(0,'minutos')},${k},${R(0,'partido_n')},${colL(M0+j)}$1)`,v:x?x.minutos:0,s:5}})]);
    const par=A('paradas'),enc=A('goles_encajados'),mm=A('mas_menos');
    rend.push([id,{f:`B${r}`.replace(/^/,"'Minutos Temporada'!"),v:p.name},{f:`'Minutos Temporada'!G${r}`,v:pj},{f:S_('goles'),v:A('goles')},{f:S_('asistencias'),v:A('asistencias')},{f:`IFERROR((D${r}+E${r})/C${r},0)`,v:pj?(A('goles')+A('asistencias'))/pj:0,s:5},
      {f:S_('mas_menos'),v:mm},{f:S_('gf_campo'),v:A('gf_campo')},{f:S_('gc_campo'),v:A('gc_campo')},{f:S_('tiros_fuera'),v:A('tiros_fuera')},{f:S_('amarillas'),v:A('amarillas')},{f:S_('rojas'),v:A('rojas')},
      {f:S_('val_pos'),v:A('val_pos')},{f:S_('val_neg'),v:A('val_neg')},{f:`M${r}-N${r}`,v:A('val_pos')-A('val_neg')},{f:S_('pen_lanzados'),v:A('pen_lanzados')},{f:S_('pen_marcados'),v:A('pen_marcados')},
      {f:S_('paradas'),v:par},{f:S_('goles_encajados'),v:enc},{f:`IFERROR(R${r}/(R${r}+S${r}),"")`,v:par+enc?par/(par+enc):'',s:2}]);
  });
  const last=P.length+1,tr=['TOTAL EQUIPO','',''];
  for(let c=3;c<M0+n;c++){const L=colL(c),av=c===4||c===5;tr.push({f:`${av?'AVERAGE':'SUM'}(${L}2:${L}${last})`,v:null,s:c===5?2:c===3||c===4?5:undefined})}
  sumRows.push(tr);
  const sheets=[{name:'Minutos Temporada',head:true,freeze:[1,3],cols:[14,20,12,13,14,14,10,9,8,8,10,...H.map(()=>7)],rows:sumRows},
    {name:'Rendimiento',head:true,freeze:[1,2],cols:[14,20,...Array(18).fill(13)],rows:rend},...SH.map(dataSheet)];
  return xlsxBlob(sheets);
}
function exportXlsx(){if(!S.history.length){toast('Aún no hay partidos');return}dl(TEAMS[ALL.cur].x,buildXlsx())}
function exportCsv(){
  if(!S.history.length){toast('Aún no hay partidos');return}
  dl(TEAMS[ALL.cur].c,zip(SHEETS().map(([nm,k,rows])=>({name:nm.toLowerCase()+'.csv',data:csvOf(HD[k],rows)}))));
}
const jsonStr=()=>JSON.stringify({app:'minutos-f7',version:3,exportado:new Date().toISOString(),all:ALL},(k,v)=>k==='mol'||k==='undo'?undefined:v,1);
function exportJson(){dl('minutos-copia-completa.json',jsonStr(),'application/json')}

/* ---- 05-actions.js ---- */
/* ===== acciones ===== */
document.getElementById('imp').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{
    const d=JSON.parse(r.result);
    if((d.version===2||d.version===3)&&d.all&&d.all.teams){
      if(!confirm('Se reemplazarán las plantillas y los historiales de LOS DOS equipos por la copia. ¿Continuar?'))return;
      bak('antes de importar');
      ALL=d.all;Object.keys(TEAMS).forEach(id=>{if(!ALL.teams[id])ALL.teams[id]=newTeam(id);fixTeam(ALL.teams[id],id)});
      ALL.set=Object.assign({auto:true,lastBak:0},ALL.set||{});setTeam(TEAMS[ALL.cur]?ALL.cur:'pre');
    }else if(Array.isArray(d.players)&&Array.isArray(d.history)){
      if(S.match){toast('Termina el partido en curso antes de importar');return}
      if(!confirm('Se reemplazarán la plantilla y el historial de '+TEAMS[ALL.cur].name+' por la copia ('+d.history.length+' partidos). ¿Continuar?'))return;
      bak('antes de importar');
      S.players=d.players;S.history=d.history;fixTeam(S,ALL.cur);S.starters=S.players.filter(p=>p.conv).slice(0,7).map(p=>p.id);
      S.nid=Math.max(0,...S.players.map(p=>+String(p.id).slice(1)||0))+1;
    }else throw 0;
    ALL.tab='hist';DLG=null;save();render();toast('Copia importada');
  }catch(x){toast('Archivo no válido')}};
  r.readAsText(f);e.target.value='';
});
function finalize(o){
  const m=S.match,e=el();pause();
  m.onField.forEach(id=>stint(m,id,e));
  const sb=m.events.filter(v=>v.k==='sub');
  const players=m.roster.map(id=>{
    const p=pl(id),pp=m.pm[id]||{},top=Object.entries(pp).sort((a,b)=>b[1]-a[1])[0];
    return{id,name:p.name,pos:top?top[0]:(p.pos||''),posMs:Object.fromEntries(Object.entries(pp).filter(([k,v])=>v>=500).map(([k,v])=>[k,Math.round(v)])),
      ms:Math.round(pm(id)),titular:m.starters.includes(id)};
  });
  const H=m.half*60000,a1=Math.max(0,(m.p1End!=null?m.p1End:e)-H),a2=m.p1End!=null?Math.max(0,e-m.p1End-H):0;
  const bd=[{f:m.form0,t:0},...m.events.filter(v=>v.k==='sis').map(v=>({f:v.to,t:v.t}))];
  const sg=bd.map((b,i)=>({f:b.f,ms:Math.round((i+1<bd.length?bd[i+1].t:e)-b.t)}));
  const g={id:Date.now(),date:o.fecha?new Date(o.fecha+'T12:00:00').toISOString():new Date().toISOString(),rival:o.rival,jornada:o.jor,comp:o.comp,loc:o.loc,total:e,half:m.half,gf:o.gf,gc:o.gc,
    add1:a1,add2:a2,sis:bd.map(b=>b.f).join(' | '),sg,players,
    events:m.events.filter(v=>v.k!=='part').map(v=>({k:v.k,t:v.t,part:v.part,min:v.min,add:v.add||0,entra:v.entra,sale:v.sale,det:v.det||''})),
    acts:m.acts.slice().sort((a,b)=>a.t-b.t),notes:{}};
  S.history.push(g);S.lastComp=o.comp;S.match=null;ALL.tab='hist';
  bak('al finalizar partido');
  return g;
}
function applyEdit(el_){
  const g=S.history.find(x=>String(x.id)===String(DLG.id));if(!g)return;
  const e=el_.dataset.e,v=el_.value,num=x=>x===''?null:Math.max(0,parseInt(x,10)||0);
  if(e==='rival')g.rival=v.trim();
  else if(e==='fecha'&&v)g.date=new Date(v+'T12:00:00').toISOString();
  else if(e==='jornada')g.jornada=v.trim();
  else if(e==='comp')g.comp=v;else if(e==='loc')g.loc=v;
  else if(e==='gf')g.gf=num(v);else if(e==='gc')g.gc=num(v);
  else if(e==='min'){const x=g.players.find(p=>p.id===el_.dataset.id),ms=Math.max(0,Math.round((parseFloat(v)||0)*60000));
    if(x){const k=x.ms?ms/x.ms:0;if(x.posMs&&x.ms)Object.keys(x.posMs).forEach(p=>x.posMs[p]=Math.round(x.posMs[p]*k));x.ms=ms}}
  else if(e==='nt'){const n=g.notes[el_.dataset.id]=g.notes[el_.dataset.id]||{tags:[],txt:'',mol:false};n.txt=v}
  save();
}
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-a]');if(!b||b.disabled||/^(INPUT|SELECT)$/.test(b.tagName))return;
  const a=b.dataset.a,id=b.dataset.id,m=S.match;
  if(a==='ftms'){ev.preventDefault();if(Object.values(ALL.teams).some(t=>t.match&&t.match.running)&&!confirm('Hay un partido en marcha. El reloj sigue contando aunque salgas. ¿Abrir el FTMS?'))return;save();location.href='ftms/';return}
  if(m)m.last=null;
  if(a==='tab'){ALL.tab=id;DLG=null}
  else if(a==='team'){setTeam(id);DLG=null}
  else if(a==='conv'){const p=pl(id);p.conv=!p.conv;if(!p.conv)S.starters=S.starters.filter(x=>x!==id)}
  else if(a==='tog'){if(S.starters.includes(id))S.starters=S.starters.filter(x=>x!==id);else if(S.starters.length<7)S.starters.push(id);else toast('Ya hay 7 titulares. Quita uno antes.')}
  else if(a==='del'){if(confirm('¿Borrar a '+pl(id).name+' de la plantilla?')){S.players=S.players.filter(p=>p.id!==id);S.starters=S.starters.filter(x=>x!==id)}}
  else if(a==='add'){const i=$('#newp'),n=i.value.trim();if(!n){toast('Escribe un nombre');return}S.players.push({id:'p'+(S.nid++),name:n,pos:'',conv:true});i.value=''}
  else if(a==='auto'){ALL.set.auto=!ALL.set.auto}
  else if(a==='start'){
    const on=assign(S.starters,S.form);
    S.match={half:TEAMS[ALL.cur].half,roster:S.players.filter(p=>p.conv).map(p=>p.id),starters:S.starters.slice(),form0:S.form,form:S.form,onField:on,acc:{},since:Object.fromEntries(on.map(x=>[x,0])),
      ps:Object.fromEntries(on.map(x=>[x,0])),pm:{},base:0,runStart:0,running:false,part:1,p1End:null,sel:null,last:null,events:[],acts:[],undo:[],ack:{},alerted:{}};
    ALL.tab='match';bak('al empezar partido');
  }
  else if(a==='play'){if(m.running)pause();else{m.runStart=Date.now();m.running=true;try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}}}
  else if(a==='next'){pause();const e=el();m.p1End=e;m.part=2;m.events.push({k:'part',t:e,part:2,min:m.half,add:0});m.undo=[]}
  else if(a==='ack'){m.ack[m.part]=true}
  else if(a==='reset'){if(confirm('¿Reiniciar el partido? Se perderán los datos de este partido.')){S.match=null;DLG=null;ALL.tab='setup'}}
  else if(a==='undo'){undo(m)}
  else if(a==='out'){if(m.sel===id)m.sel=null;else if(m.sel){swapPos(m,m.sel,id);m.sel=null;vib(25)}else m.sel=id}
  else if(a==='in'){if(!m.sel){toast('Toca primero a quien sale del campo');return}doSub(m,m.sel,id)}
  else if(a==='adv'){const ad=advice(m);if(ad)doSub(m,ad.out,ad.inn)}
  else if(a==='q'){const [k,l]=id.split(':');addAct(m,k==='tiro'?{k:'tiro',lado:l,res:'fuera'}:{k,lado:l},({tiro:'tiro fuera',corner:'córner',falta:'falta',ocasion:'ocasión clara'})[k]+' '+SG[l])}
  else if(a==='shot')DLG={k:'shot',lado:id,res:null,autor:null,asist:null,orig:null,pen:false};
  else if(a==='card')DLG={k:'card',lado:'favor',color:'amarilla',quien:null};
  else if(a==='valopen')DLG={k:'val'};
  else if(a==='vpos'||a==='vneg'){addAct(m,{k:'val',quien:id,signo:a==='vpos'?1:-1},'valoración '+(a==='vpos'?'＋':'－')+' '+short(id))}
  else if(a==='dres'){DLG.res=id;if(id!=='gol'){DLG.asist=null;DLG.orig=null}}
  else if(a==='dpick'){const k=b.dataset.k;DLG[k]=DLG[k]===id?null:id;if(k==='autor'&&DLG.asist===id)DLG.asist=null}
  else if(a==='dtxt'){const k=b.dataset.k;DLG[k]=(k==='orig'&&DLG[k]===id)?null:id}
  else if(a==='dpen'){DLG.pen=!DLG.pen}
  else if(a==='dsave'){
    const d=DLG;
    if(d.k==='card')addAct(m,{k:'tarjeta',lado:d.lado,color:d.color,quien:d.lado==='favor'?d.quien:null},'tarjeta');
    else{
      const o={k:'tiro',lado:d.lado,res:d.res,autor:d.lado==='favor'?d.autor:null,asist:d.lado==='favor'&&d.res==='gol'?d.asist:null,orig:d.res==='gol'?d.orig:null,pen:!!d.pen,por:d.lado==='contra'&&d.res!=='fuera'?m.onField[0]:null};
      addAct(m,o,d.res==='gol'?'gol '+SG[d.lado]:'tiro '+SG[d.lado]);
    }
    DLG=null;
  }
  else if(a==='dcancel')DLG=null
  else if(a==='dels'){pushUndo(m,'quitar evento');m.acts.splice(+id,1)}
  else if(a==='sug')changeForm(m,id);
  else if(a==='fin'){DLG={k:'fin'}}
  else if(a==='dfin'){
    const g_=x=>Math.max(0,parseInt($(x).value,10)||0);
    const g=finalize({rival:($('#fr').value||'').trim(),fecha:$('#ff').value,jor:($('#fj').value||'').trim(),comp:$('#fcomp').value,loc:$('#floc').value,gf:g_('#fg'),gc:g_('#fc')});
    DLG={k:'edit',id:g.id,fresh:true};save();
    if(ALL.set.auto){try{exportJson()}catch(e){}}
  }
  else if(a==='delm'){const g=S.history.find(x=>String(x.id)===id);if(g&&confirm('¿Borrar el partido '+(g.rival||'sin rival')+' del '+new Date(g.date).toLocaleDateString('es-ES')+'? Se guardará antes una copia interna.')){bak('antes de borrar partido');S.history=S.history.filter(x=>String(x.id)!==id)}}
  else if(a==='editg'){DLG={k:'edit',id}}
  else if(a==='ntag'){const g=S.history.find(x=>String(x.id)===String(DLG.id)),n=g.notes[id]=g.notes[id]||{tags:[],txt:'',mol:false},k=b.dataset.k;
    if(k==='mol')n.mol=!n.mol;else n.tags=n.tags.includes(k)?n.tags.filter(x=>x!==k):[...n.tags,k]}
  else if(a==='edel'){const g=S.history.find(x=>String(x.id)===String(DLG.id)),x=g.acts[+id];
    if(x&&confirm('¿Quitar este evento?')){if(isGol(x)){if(x.lado==='favor'&&g.gf>0)g.gf--;else if(x.lado==='contra'&&g.gc>0)g.gc--}g.acts.splice(+id,1)}}
  else if(a==='rbak'){if(confirm('Se reemplazarán los datos actuales por esta copia. Antes se guardará otra copia de lo actual. ¿Continuar?')){const it=localStorage.getItem(BK+id);bak('antes de restaurar');restoreBak(it)}}
  else if(a==='xl'){exportXlsx();return}
  else if(a==='csv'){exportCsv();return}
  else if(a==='json'){exportJson();return}
  else if(a==='imp'){$('#imp').click();return}
  save();render();
});
document.addEventListener('change',ev=>{
  const i=ev.target;
  if(i.dataset.e&&DLG&&DLG.k==='edit'){applyEdit(i);return}
  const a=i.dataset.a;if(!a)return;
  if(a==='form'){if(S.match&&ALL.tab==='match')changeForm(S.match,i.value);else S.form=i.value;save();render();return}
  if(a==='runmin'){S.runMin=+i.value;save();return}
  if(a==='minmin'){S.minMin=+i.value;save();return}
  const p=pl(i.dataset.id);if(!p)return;
  if(a==='ren'){const n=i.value.trim();if(!n){i.value=p.name;return}p.name=n;save()}
  else if(a==='pos'){p.pos=i.value;save()}
});
document.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target.id==='newp')document.querySelector('[data-a=add]').click()});
/* ---- PWA: service worker ---- */
if('serviceWorker' in navigator&&location.protocol!=='file:'){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
if(S.match&&ALL.tab==='setup')ALL.tab='match';
if(S.match&&S.match.running&&S.match.acts===undefined)fixMatch(S.match,S);
render();
