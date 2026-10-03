/* =====================================================================
   APP ATELIER
   ===================================================================== */
const LS_KEY = "atelier.cache.v2";
const ESPECIALIDADES = ["Oftalmologia","Cardiologia","Pediatria","Dermatologia","Ginecologia e Obstetrícia","Ortopedia","Endocrinologia","Clínica médica","Psiquiatria","Urologia","Otorrinolaringologia","Gastroenterologia"];
const SERVICOS_SUG = {
  "Oftalmologia":["Consulta oftalmológica","Cirurgia de catarata","Cirurgia refrativa","Glaucoma","Ceratocone","Exame de fundo de olho"],
  "Cardiologia":["Consulta cardiológica","Check-up cardiológico","Ecocardiograma","Teste ergométrico","Holter 24h","MAPA"],
  "Pediatria":["Consulta pediátrica","Puericultura","Vacinação","Acompanhamento do desenvolvimento","Alergias infantis"],
  "Dermatologia":["Consulta dermatológica","Mapeamento de pintas","Tratamento de acne","Queda de cabelo","Câncer de pele"],
  "Ginecologia e Obstetrícia":["Consulta ginecológica","Pré-natal","Preventivo","Planejamento familiar","Menopausa"],
  "Ortopedia":["Consulta ortopédica","Joelho","Coluna","Ombro","Medicina esportiva"],
  "Endocrinologia":["Diabetes","Tireoide","Obesidade","Reposição hormonal"],
  "Clínica médica":["Check-up","Hipertensão","Diabetes","Doenças crônicas"],
  "Psiquiatria":["Ansiedade","Depressão","TDAH","Insônia"],
  "Urologia":["Consulta urológica","Próstata","Cálculo renal","Saúde do homem"],
  "Otorrinolaringologia":["Rinite e sinusite","Audição","Ronco e apneia","Amígdalas"],
  "Gastroenterologia":["Endoscopia","Colonoscopia","Refluxo","Intestino irritável"]
};
const PUBLICOS = ["Crianças","Adolescentes","Adultos","Idosos","Gestantes","Mulheres","Homens","Atletas"];
const TONS = [
  {id:"acolhedor", t:"Acolhedor", d:"Próximo e carinhoso, transmite cuidado"},
  {id:"didatico", t:"Didático", d:"Explica com clareza, como numa consulta"},
  {id:"leve", t:"Leve e moderno", d:"Linguagem simples, do dia a dia"},
  {id:"institucional", t:"Sério e institucional", d:"Formal, transmite tradição e confiança"}
];
const CAMPANHAS = ["Janeiro Branco · saúde mental","Fevereiro Roxo e Laranja","Março Lilás","Abril Azul · autismo","Maio Amarelo · trânsito","Junho Vermelho · doação de sangue","Julho Amarelo · hepatites","Agosto Dourado · amamentação","Setembro Amarelo","Outubro Rosa","Novembro Azul","Dezembro Vermelho e Laranja"];
const PRESETS = [["#0057F0","#8FB4FF"],["#E8550E","#1A1A1A"],["#1131C8","#F2E66B"],["#E31B23","#1A1A1A"],["#8B1A1A","#E9C9A8"],["#1D6B58","#E9B44C"],["#7A2E4A","#EAB0BF"],["#22303C","#B6F23A"]];
const CFM_RULES = `BOAS PRÁTICAS DE PUBLICIDADE MÉDICA (baseadas na Resolução CFM 2.336/2023). Siga sempre:
- Conteúdo educativo e informativo; nada sensacionalista, alarmista ou que gere medo ou culpa.
- Não prometa resultado nem cura garantida; nada de "100%", "sem riscos", "sem dor".
- Não use superlativos sobre o médico ou a clínica ("o melhor", "o único", "o mais moderno").
- Não anuncie preços, descontos, promoções, sorteios ou consulta grátis.
- Não fale de fotos de antes e depois nem use depoimentos de pacientes.
- Não incentive autodiagnóstico ou automedicação; oriente procurar avaliação médica.
- Não cite técnicas ou tratamentos sem reconhecimento científico.`;
const PALAVRAS_RISCO = ["grátis","gratuita","gratuito","desconto","promoção","promocao","garantido","garantida","garantia de","100%","o melhor","a melhor","o único","a única","antes e depois","cura definitiva","sem riscos","sem dor","milagr"];

const STEPS = [
  {key:"nome", q:"Como se chama sua clínica ou consultório?", help:"Se você atende sozinho, pode usar seu próprio nome.", type:"text", ph:"Ex.: Clínica Visão Clara"},
  {key:"especialidade", q:"Qual é a sua especialidade?", type:"chips1"},
  {key:"cidade", q:"Em qual cidade você atende?", type:"text", ph:"Ex.: Recife – PE"},
  {key:"medico", q:"Quem assina os posts?", help:"Pelas regras do CFM, os posts mostram o nome do médico e o CRM. O RQE aparece quando você anuncia a especialidade.", type:"doctor"},
  {key:"servicos", q:"Quais atendimentos você mais quer divulgar?", help:"Toque nas sugestões ou escreva com suas palavras.", type:"services"},
  {key:"publico", q:"Quem são seus pacientes?", help:"Pode escolher mais de um.", type:"chipsN"},
  {key:"diferencial", q:"Por que seus pacientes escolhem você?", help:"Ex.: atendimento sem pressa, equipamentos novos, 20 anos de experiência. Se preferir, pule esta pergunta.", type:"textarea", optional:true, ph:"Escreva do seu jeito"},
  {key:"tom", q:"Como você gosta de falar com seus pacientes?", type:"tone"},
  {key:"instagram", q:"Qual é o @ do seu Instagram?", help:"Ele aparece no rodapé dos posts.", type:"text", optional:true, ph:"@clinicavisaoclara"},
  {key:"whatsapp", q:"Qual WhatsApp aparece para agendar?", help:"Opcional. Ele entra na última lâmina dos carrosséis e na legenda.", type:"tel", optional:true, ph:"(81) 99999-9999"}
];

const DEMO_COVER = {pre:"Se eu *fosse você*,", titulo:"*Não adiaria* o seu check-up", apoio:"Muitas doenças não dão sinais no começo. *Prevenir é cuidar.*", nota:"salve para não esquecer!", palavra:"prevenção"};
const DEMO_INNER = {titulo:"Por que *fazer* check-up?", texto:"Exames de rotina ajudam a encontrar alterações *antes dos sintomas*.", itens:[{rotulo:"Pressão", texto:"medir pelo menos 1 vez ao ano"},{rotulo:"Glicemia", texto:"ajuda a detectar diabetes cedo"},{rotulo:"Consulta", texto:"converse sobre seu histórico"}]};
const DEMO_PROFILE = {nome:"Clínica Exemplo", especialidade:"Clínica médica", cidade:"Recife – PE", medico:"Dra. Ana Souza", crm:"CRM-PE 12345", rqe:"RQE 6789", instagram:"@clinicaexemplo", whatsapp:"(81) 99999-0000"};

/* ---------- Estado ---------- */
function defaults(){
  return {v:2, onboarded:false,
    profile:{nome:"",especialidade:"",cidade:"",medico:"",crm:"",rqe:"",servicos:"",publico:[],diferencial:"",tom:"",instagram:"",whatsapp:""},
    brand:{logo:"",cor1:"#0057F0",cor2:"#8FB4FF"},
    favs: ["ref:auto"].concat(TEMPLATES.map(t=>t.id)), fotoIds:[], cutouts:{}, customRefs:[], autoAdded:true,
    estrategia:null, today:null, posts:[], counter:0, updatedAt:0};
}
/* Estilos com IA = referências de mercado (ref:rXX) e referências enviadas pelo cliente (cref:id) */
const REFS = window.ATELIER_REFS || [];
function refInfo(id){
  id = String(id||"");
  if(id==="ref:auto") return {id, refId:"auto", auto:true, nome:"Criação livre com IA", pessoa:true, dark:true};
  if(id.startsWith("ref:")){ const r = REFS.find(x=>x.id===id.slice(4)); return r ? {id, refId:r.id, nome:r.nome, pessoa:!!r.pessoa, dark:!!r.dark, thumb:"/refs/"+r.id+".jpg"} : null; }
  if(id.startsWith("cref:")){ const r = ((typeof S!=="undefined" && S && S.customRefs) || []).find(x=>x.id===id.slice(5)); return r ? {id, custom:r, nome:r.nome||"Minha referência", pessoa:!!r.temPessoa, dark:!!r.escuro, path:r.path} : null; }
  return null;
}
function validStyle(id){ return id==="ref:auto" || TEMPLATES.some(t=>t.id===id) || /^ref:/.test(id) && !!refInfo(id) || /^cref:/.test(id); }
function styleName(id){ const r = refInfo(id); return r ? r.nome : getTpl(id).nome; }
function styleUsesPhoto(id){ const r = refInfo(id); return r ? r.pessoa : !!getTpl(id).foto; }
function stylePool(){
  if(imagesOn()){ const r = S.favs.filter(f=>refInfo(f)); return r.length ? r : ["ref:auto"]; }
  const t = S.favs.filter(f=>!refInfo(f)); return t.length ? t : TEMPLATES.map(x=>x.id);
}
function imagesOn(){ return !!(window.Plat && Plat.config && Plat.config.imagesEnabled); }

function merge(base, saved){
  if(!saved || typeof saved!=="object") return base;
  const out = Object.assign({}, base, saved);
  out.profile = Object.assign({}, base.profile, saved.profile||{});
  out.brand = Object.assign({}, base.brand, saved.brand||{});
  if(!Array.isArray(out.profile.publico)) out.profile.publico = [];
  if(!Array.isArray(out.posts)) out.posts = [];
  if(!Array.isArray(out.favs) || !out.favs.length) out.favs = base.favs;
  if(!Array.isArray(out.customRefs)) out.customRefs = [];
  if(!saved.autoAdded){ out.autoAdded = true; if(!out.favs.includes("ref:auto")) out.favs.unshift("ref:auto"); }
  out.favs = out.favs.filter(validStyle); if(!out.favs.length) out.favs = base.favs;
  if(!Array.isArray(out.fotoIds)) out.fotoIds = [];
  if(!out.cutouts || typeof out.cutouts !== "object") out.cutouts = {};
  out.posts.forEach(p=>{ if(!p.tpl) p.tpl = "impacto"; if(!p.topo) p.topo = []; });
  return out;
}
function lsKey(){ return LS_KEY + ":" + (window.Plat && Plat.user ? Plat.user.id : "anon"); }
function loadLocal(){ try{ const r = localStorage.getItem(lsKey()); return r ? JSON.parse(r) : null; }catch(e){ return null; } }
let S = merge(defaults(), null);

let saveTimer = null, writeChain = Promise.resolve(), saveFailed = false;
function save(){
  S.updatedAt = Date.now();
  while(JSON.stringify(S).length > 400000 && S.posts.length > 1) S.posts.pop();
  try{ localStorage.setItem(lsKey(), JSON.stringify(S)); }catch(e){}
  if(!Plat.user) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    const snap = JSON.parse(JSON.stringify(S));
    writeChain = writeChain.then(()=>Plat.saveState(snap)).then(()=>{ if(saveFailed){ saveFailed = false; } }).catch(()=>{ if(!saveFailed){ saveFailed = true; toast("Sem conexão: suas alterações ficam salvas neste aparelho por enquanto."); } });
  }, 700);
}

/* ---------- Plataforma (login, IA, arquivos) ---------- */
let sample = null, downloads = null, aiChecked = true, booting = true, bootError = "";
async function initPlatform(){
  try{
    await Plat.init();
    sample = Plat.sample; downloads = Plat.downloads;
    Plat.onAuth = () => location.reload();
    if(Plat.user){
      if(await Plat.isMember()) await loadUserState();
      else view = "semacesso";
    } else view = "login";
  }catch(e){ bootError = "Não foi possível iniciar o Atelier. Confira se as chaves do Supabase estão configuradas na Vercel."; view = "erro"; }
  booting = false; render();
}
async function loadUserState(){
  const local = loadLocal();
  let remote = null; try{ remote = await Plat.loadState(); }catch(e){}
  const pick = (remote && (!local || (remote.updatedAt||0) >= (local.updatedAt||0))) ? remote : local;
  S = merge(defaults(), pick);
  if(local && (!remote || (local.updatedAt||0) > (remote.updatedAt||0))) save();
  view = S.onboarded ? "home" : "welcome";
}

/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
function toast(msg){
  const old = document.querySelector(".toast"); if(old) old.remove();
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role","status");
  document.body.appendChild(t); setTimeout(()=>t.remove(), 2800);
}
function todayStr(){ const d = new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function dataLonga(){ try{ return new Date().toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long"}); }catch(e){ return ""; } }
function saudacao(){ const h = new Date().getHours(); return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite"; }
function campanha(){ return CAMPANHAS[new Date().getMonth()]; }
function slug(s){ return String(s||"post").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40) || "post"; }
function errMsg(e){
  const c = e && e.code;
  if(c==="not_granted"||c==="sampling_disabled"||c==="capability_disabled"||c==="not_declared") return "A IA não foi liberada nesta tela. Permita o uso do Claude quando o aviso aparecer e tente de novo.";
  if(c==="rate_limited") return "Muitos pedidos seguidos. Espere um minuto e tente de novo.";
  if(c==="session_expired") return "Sua sessão expirou. Entre de novo na sua conta e tente outra vez.";
  if(c==="invalid_json"||c==="empty_completion") return "A resposta veio incompleta. Toque em tentar de novo.";
  if(c==="refused") return "A IA não aceitou este tema. Tente escrever a ideia de outro jeito.";
  if(c==="limit_reached") return (e.message || "Você chegou ao limite deste mês.") + " Fale com a Avenir para ampliar seu plano.";
  if(c==="config") return "O Atelier ainda não está configurado: " + (e.message || "confira as chaves de API.");
  return "Não foi possível falar com a IA agora. Verifique a internet e tente de novo.";
}
function loadImage(src){ return new Promise((res,rej)=>{ const i = new Image(); i.onload = ()=>res(i); i.onerror = rej; i.src = src; }); }

function extractColors(img){
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const x = c.getContext("2d"); x.drawImage(img,0,0,64,64);
  let d; try{ d = x.getImageData(0,0,64,64).data; }catch(e){ return null; }
  const buckets = {};
  for(let i=0;i<d.length;i+=4){
    if(d[i+3] < 140) continue;
    const r = d[i], g = d[i+1], b = d[i+2];
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b), l = (mx+mn)/510, s = mx===mn?0:(mx-mn)/(255-Math.abs(mx+mn-255));
    if(l > .93 || l < .06) continue;
    const k = (r>>4)+","+(g>>4)+","+(b>>4);
    const bk = buckets[k] || (buckets[k] = {r:0,g:0,b:0,n:0,s:0});
    bk.r+=r; bk.g+=g; bk.b+=b; bk.n++; bk.s+=s;
  }
  const list = Object.values(buckets).map(b=>({hex:rgbToHex(b.r/b.n,b.g/b.n,b.b/b.n), score:b.n*(0.35+b.s/b.n)})).sort((a,b)=>b.score-a.score);
  if(!list.length) return null;
  const first = list[0].hex;
  const second = list.find(o=>{ const A = hexToRgb(o.hex), B = hexToRgb(first); return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]) > 90; });
  return [first, second ? second.hex : mix(first,"#FFFFFF",.55)];
}

/* ---------- Render das artes ---------- */
let logoImg = null, logoSrc = "", brandRev = 0;
const imgCache = new Map();
async function getFotoImg(path){ return path ? Plat.image(path) : null; }
async function buildT(opts){
  await loadFonts();
  const brand = (opts && opts.brand) || S.brand, profile = (opts && opts.profile) || S.profile;
  let logo = null;
  if(brand.logo){
    if(!logoImg || logoSrc !== brand.logo){ try{ logoImg = await loadImage(brand.logo); logoSrc = brand.logo; }catch(e){ logoImg = null; } }
    logo = logoImg;
  }
  return {c1:brand.cor1, c2:brand.cor2, logo, p:profile};
}
async function renderPost(post, opts){
  opts = opts || {};
  const key = (opts.key || post.id) + "|" + (post.rev||0) + "|" + brandRev + "|" + post.tpl + "|" + (post.foto||"") + "|" + ((post.bgs||{})[post.tpl]||"") + "|" + (S.cutouts[post.foto]||"") + "|" + ((post.full||{})[post.tpl]||"") + "|" + ((post.pages||{})[post.tpl]||[]).join(",") + "|" + (opts.only!=null?opts.only:"all") + "|" + (opts.thumb?1:0);
  if(!opts.nocache && imgCache.has(key)) return imgCache.get(key);
  const T = await buildT(opts);
  const ri = refInfo(post.tpl), fm = (post.fullMeta||{})[post.tpl];
  post.refDark = ri ? (fm && typeof fm.escuro === "boolean" ? fm.escuro : ri.dark) : false;
  const A = ri ? {full: await getFotoImg((post.full||{})[post.tpl]), aiPages: imagesOn() && post.formato === "carrossel",
      pages: await Promise.all(((post.pages||{})[post.tpl]||[]).map(p=>p ? getFotoImg(p) : null))}
    : {ph: await getFotoImg(post.foto), bg: await getFotoImg((post.bgs||{})[post.tpl]), cut: post.foto ? await getFotoImg(S.cutouts[post.foto]) : null};
  const n = slidesFor(post).length, out = [];
  for(let i=0;i<n;i++){
    if(opts.only!=null && i!==opts.only) continue;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    drawSlide(c.getContext("2d"), post, i, T, A);
    if(opts.thumb){ const t = document.createElement("canvas"); t.width = 432; t.height = 540; t.getContext("2d").drawImage(c,0,0,432,540); out.push({url:t.toDataURL("image/jpeg",.84)}); }
    else out.push({url:c.toDataURL("image/jpeg",.92), canvas:c});
  }
  if(!opts.nocache) imgCache.set(key, out);
  return out;
}
function demoPost(tplId, formato){
  return {id:"demo-"+tplId, bgs:{}, rev:0, tpl:tplId, formato:formato||"post", topo:["Prevenção","Saúde","Cuidado"], cta:"Agende sua consulta",
    slides: formato==="carrossel" ? [DEMO_COVER, DEMO_INNER] : [DEMO_COVER], code:1, createdAt:Date.now(), foto:S.fotoIds[0]||""};
}

/* ---------- Prompts ---------- */
function toneLabel(){ const t = TONS.find(t=>t.id===S.profile.tom); return t ? t.t+" ("+t.d+")" : "acolhedor e claro"; }
function profileText(){
  const p = S.profile;
  let s = `Clínica: ${p.nome}
Especialidade: ${p.especialidade}
Cidade: ${p.cidade}
Médico que assina: ${p.medico} — ${p.crm}${p.rqe?" — "+p.rqe:""}
Atendimentos que quer divulgar: ${p.servicos}
Pacientes: ${(p.publico||[]).join(", ") || "não informado"}
Diferencial: ${p.diferencial || "não informado"}
Tom de voz: ${toneLabel()}
Instagram: ${p.instagram || "não informado"}
WhatsApp para agendar: ${p.whatsapp || "não informado"}`;
  if(S.estrategia && Array.isArray(S.estrategia.pilares)) s += `\nPilares de conteúdo: ${S.estrategia.pilares.map(x=>x.nome).join("; ")}`;
  return s;
}
function strategyPrompt(){
  return `Você é estrategista de Instagram para médicos e clínicas no Brasil.
Com base no perfil abaixo, defina a linha de conteúdo do perfil.

PERFIL
${profileText()}

${CFM_RULES}

Responda só com JSON neste formato:
{"resumo":"2 frases simples dizendo como o perfil vai se comunicar e com quem","pilares":[{"nome":"nome curto do pilar","descricao":"1 frase do que entra nesse pilar"}]}
Crie exatamente 4 pilares. Escreva em português do Brasil, linguagem simples.`;
}
function ideasPrompt(avoid){
  return `Você é estrategista de conteúdo de Instagram para médicos no Brasil.
Hoje é ${dataLonga()}. Campanha de saúde do mês: ${campanha()}.

PERFIL
${profileText()}

${CFM_RULES}

Sugira 3 ideias de post para HOJE. Varie os pilares e os formatos, ligue as ideias aos atendimentos da clínica e, quando fizer sentido, à campanha do mês ou a datas próximas.${avoid && avoid.length ? "\nNão repita estas ideias: " + avoid.join(" | ") : ""}
Responda só com JSON neste formato:
{"ideias":[{"titulo":"tema do post em até 10 palavras","porque":"1 frase simples dizendo por que vale postar isso hoje","formato":"post ou carrossel","pilar":"nome do pilar"}]}`;
}
function postPrompt(tema, formato){
  const p = S.profile;
  const assinatura = [p.medico, p.crm, p.rqe].filter(Boolean).join(" | ");
  return `Você é social media especializado em saúde no Brasil e escreve para o Instagram de uma clínica médica. Seu estilo é o de posts editoriais de alto impacto: frases curtas, ganchos fortes e contraste entre palavras finas e palavras em destaque.

PERFIL
${profileText()}

TEMA DO POST: ${tema}
FORMATO: ${formato === "carrossel" ? "carrossel" : "post único (1 imagem)"}

${CFM_RULES}

Como escrever a arte (o texto vai dentro de um layout pronto):
- Marque com *asteriscos* de 1 a 3 palavras de destaque em "pre", "titulo", "apoio" e "texto". Ex.: "Se eu *fosse você*," ou "*Não adiaria* o seu check-up".
- "pre": abertura curta em tom de conversa, 2 a 6 palavras (ex.: "Se eu *fosse você*,", "Você sabia que", "4 sinais de que").
- "titulo": a frase de impacto, 3 a 7 palavras. Ela continua a frase do "pre".
- "apoio": complemento com até 16 palavras.
- "nota": frase curtíssima como se fosse escrita à mão, 2 a 5 palavras (ex.: "salve para não esquecer!").
- "palavra": 1 palavra-chave do tema (vai em letra cursiva).
- ${formato === "carrossel" ? "Carrossel com 4 a 6 lâminas. A 1ª lâmina é a capa e usa pre, titulo, apoio, nota e palavra. As outras lâminas usam \"titulo\" (até 7 palavras), \"texto\" (até 28 palavras) e, quando ajudar, \"itens\": até 4 objetos {\"rotulo\":\"1 a 2 palavras\",\"texto\":\"até 8 palavras\"}. Não crie lâmina de contato: o sistema adiciona uma no final." : "Post único: 1 lâmina com pre, titulo, apoio, nota e palavra."}
- "topo": 3 rótulos curtos (1 a 2 palavras cada) para o cabeçalho da arte, ligados ao tema. Ex.: ["Prevenção","Saúde ocular","Cuidado"].
- "cta": chamada curta para agendar, sem pressão e sem promessa (máx. 4 palavras).
- Legenda com 500 a 1000 caracteres, parágrafos curtos, no máximo 3 emojis, sem asteriscos, termina com convite para agendar${p.whatsapp ? " pelo WhatsApp " + p.whatsapp : ""} e com a assinatura: ${assinatura}.
- 8 a 12 hashtags relevantes em português, incluindo a cidade se fizer sentido.
- Depois de escrever, revise o próprio texto contra as boas práticas acima. Em "compliance", "ok" é true se está tudo certo; em "alertas" liste em linguagem simples qualquer ponto que o médico deve conferir antes de publicar (lista vazia se não houver).

Responda só com JSON neste formato:
{"topo":["...","...","..."],"slides":[{"pre":"...","titulo":"...","apoio":"...","nota":"...","palavra":"..."}${formato==="carrossel"?',{"titulo":"...","texto":"...","itens":[{"rotulo":"...","texto":"..."}]}':""}],"cta":"...","legenda":"...","hashtags":["#..."],"compliance":{"ok":true,"alertas":[]}}`;
}
function localCheck(post){
  const all = [post.legenda, post.cta].concat((post.slides||[]).flatMap(s=>[s.pre,s.titulo,s.apoio,s.texto,s.nota].concat((s.itens||[]).map(i=>i.rotulo+" "+i.texto)))).join(" ").toLowerCase();
  return PALAVRAS_RISCO.filter(w=>all.includes(w)).map(w=>`Revise a expressão “${w}”: ela costuma ser vetada na publicidade médica.`);
}
function pickTpl(){
  if(draft.tpl) return draft.tpl;
  const favs = stylePool();
  const last = S.posts[0] && S.posts[0].tpl;
  const opts = favs.length > 1 ? favs.filter(f=>f!==last) : favs;
  return opts[Math.floor(Math.random()*opts.length)];
}
function pickFoto(){ return S.fotoIds.length ? S.fotoIds[Math.floor(Math.random()*S.fotoIds.length)] : ""; }
function normalizePost(r, tema, formato){
  const str = v => typeof v === "string" ? v.trim() : "";
  let slides = Array.isArray(r && r.slides) ? r.slides.map(s=>{
    s = s || {};
    const o = {pre:str(s.pre), titulo:str(s.titulo), apoio:str(s.apoio), nota:str(s.nota).replace(/\*/g,""), palavra:str(s.palavra).replace(/\*/g,""), texto:str(s.texto)};
    if(Array.isArray(s.itens)) o.itens = s.itens.map(i=>({rotulo:str(i && i.rotulo).replace(/\*/g,""), texto:str(i && i.texto).replace(/\*/g,"")})).filter(i=>i.rotulo||i.texto).slice(0,4);
    return o;
  }).filter(s=>s.titulo||s.texto) : [];
  if(!slides.length) throw {code:"invalid_json"};
  slides = formato === "carrossel" ? slides.slice(0,6) : slides.slice(0,1);
  const tags = Array.isArray(r.hashtags) ? r.hashtags.map(h=>{ h = str(h).replace(/\s+/g,""); return h ? (h[0]==="#"?h:"#"+h) : ""; }).filter(Boolean).slice(0,15) : [];
  const comp = r.compliance && typeof r.compliance === "object" ? r.compliance : {};
  S.counter = (S.counter||0) + 1;
  const post = {id:uid(), rev:0, createdAt:Date.now(), code:S.counter, tema, formato: formato==="carrossel" && slides.length>1 ? "carrossel" : "post",
    tpl: pickTpl(), foto: pickFoto(), topo: (Array.isArray(r.topo) ? r.topo.map(str).filter(Boolean).slice(0,3) : []),
    slides, cta:str(r.cta).replace(/\*/g,"").slice(0,40), legenda:str(r.legenda).replace(/\*\*/g,""), hashtags:tags, alertas:[]};
  const alertas = (Array.isArray(comp.alertas) ? comp.alertas.map(str).filter(Boolean) : []).concat(localCheck(post));
  post.alertas = Array.from(new Set(alertas)).slice(0,6);
  return post;
}

/* ---------- Navegação ---------- */
let view = "carregando";
let wiz = {i:0, edit:false};
let brandFromOnboarding = false;
let ideasState = {loading:false, error:"", autoTried:false};
let draft = {texto:"", formato:"post", tpl:""};
let gen = {ctl:null, error:"", tema:"", formato:"post"};
let current = null, slideIdx = 0, editing = false, confirmReset = false, styleDetail = null;

function go(v){ view = v; editing = false; confirmReset = false; render(); window.scrollTo(0,0); }
function render(){
  const hideNav = ["welcome","wizard","preparando","login","erro","carregando","semacesso"].includes(view) || (view==="marca" && brandFromOnboarding) || !S.onboarded;
  $("#nav").hidden = hideNav;
  $("#wrap").classList.toggle("no-nav", hideNav);
  $("#clinicName").textContent = S.onboarded ? S.profile.nome : "";
  const tab = view==="post" ? (current && current.fromHistory ? "historico" : "home") : view==="marca" ? "clinica" : view==="estilo" ? "estilos" : view==="gerando" ? "home" : view;
  document.querySelectorAll(".nav button").forEach(b=>{ if(b.dataset.to===tab) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  $("#view").innerHTML = (VIEWS[view] || VIEWS.home)();
  after[view] && after[view]();
}
const VIEWS = {}, after = {};

/* Carregando / login / erro */
VIEWS.carregando = () => `<div class="loading-box"><div class="spinner" aria-hidden="true"></div><p class="muted">Abrindo o Atelier…</p></div>`;
VIEWS.semacesso = () => `<div class="stack login"><h1>Acesso não liberado</h1><p class="muted">O e-mail ${esc(Plat.user ? Plat.user.email : "")} ainda não está liberado no Atelier. Fale com a Avenir para ativar sua conta.</p><button class="btn btn-line" data-act="logout">Entrar com outro e-mail</button></div>`;
VIEWS.erro = () => `<div class="stack"><h1>Algo não está configurado</h1><div class="notice warn"><div>${esc(bootError)}</div></div></div>`;
let loginState = {email:"", sent:false, error:"", busy:false};
VIEWS.login = () => `
<div class="stack login">
  <p class="tagline">Para médicos e clínicas</p>
  <h1>Entrar no Atelier</h1>
  ${loginState.sent ? `
    <div class="notice ok"><div><b>Pronto! Enviamos um link para ${esc(loginState.email)}.</b><br>Abra seu e-mail e toque no link para entrar. Pode fechar esta tela.</div></div>
    <button class="link" data-act="login-again" style="align-self:flex-start">Usar outro e-mail</button>` : `
    <p class="muted">Digite o e-mail liberado pela Avenir. Você recebe um link para entrar, sem precisar de senha.</p>
    <label class="lbl" for="loginEmail">Seu e-mail</label>
    <input id="loginEmail" type="text" inputmode="email" autocomplete="email" autocapitalize="none" value="${esc(loginState.email)}" placeholder="voce@clinica.com.br">
    ${loginState.error ? `<p class="small" style="color:var(--danger)">${esc(loginState.error)}</p>` : ""}
    <button class="btn btn-primary btn-block" data-act="login-send" ${loginState.busy?"disabled":""}>${loginState.busy ? "Enviando…" : "Receber link de acesso"}</button>`}
</div>`;
async function sendLogin(){
  const el = $("#loginEmail"); const email = (el ? el.value : "").trim().toLowerCase();
  loginState.email = email;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ loginState.error = "Digite um e-mail válido."; render(); return; }
  loginState.busy = true; loginState.error = ""; render();
  try{ await Plat.sendLink(email); loginState.sent = true; }
  catch(e){ loginState.error = "Não foi possível enviar o link agora. Tente de novo em instantes."; }
  loginState.busy = false; render();
}

/* Boas-vindas */
VIEWS.welcome = () => `
<div class="stack">
  <p class="tagline">Para médicos e clínicas</p>
  <h1>Seus posts do Instagram, prontos todos os dias.</h1>
  <p class="muted">O Atelier conhece sua clínica, sugere o que postar e entrega a arte com sua logo e suas cores, mais a legenda pronta. Você só baixa e publica.</p>
  <div class="welcome-grid" id="demoGrid">${["impacto","poster","revista"].map(()=>`<div class="wg"><div class="skeleton" style="padding:14px"><div></div></div></div>`).join("")}</div>
  <p class="small muted" style="text-align:center">Exemplos de estilos do Atelier</p>
  <ol class="steps">
    <li><span class="n">1</span><div><b>Conte sobre sua clínica</b><br><span class="muted">10 perguntas rápidas, cerca de 5 minutos.</span></div></li>
    <li><span class="n">2</span><div><b>Coloque sua logo, suas cores e suas fotos</b><br><span class="muted">O Atelier pega as cores da logo para você.</span></div></li>
    <li><span class="n">3</span><div><b>Escolha seus estilos e receba posts prontos</b><br><span class="muted">Todo dia, conferidos com as regras do CFM.</span></div></li>
  </ol>
  <button class="btn btn-primary btn-block" data-act="start">Começar</button>
</div>`;
after.welcome = async () => {
  const ids = ["impacto","poster","revista"]; const cells = document.querySelectorAll("#demoGrid .wg");
  const brand = {logo:"", cor1:"#0057F0", cor2:"#8FB4FF"};
  for(let i=0;i<ids.length;i++){
    const p = demoPost(ids[i]); p.foto = "";
    const r = await renderPost(p, {brand, profile:DEMO_PROFILE, key:"welcome-"+ids[i], thumb:true, only:0});
    if(cells[i]) cells[i].innerHTML = `<img alt="Exemplo do estilo ${esc(getTpl(ids[i]).nome)}" src="${r[0].url}">`;
  }
};

/* Perguntas */
VIEWS.wizard = () => {
  const st = STEPS[wiz.i], p = S.profile, n = STEPS.length;
  let body = "";
  if(st.type==="text" || st.type==="tel"){
    body = `<input id="f_${st.key}" type="${st.type==="tel"?"tel":"text"}" ${st.type==="tel"?'inputmode="tel"':""} data-field="${st.key}" value="${esc(p[st.key])}" placeholder="${esc(st.ph||"")}" autocomplete="off" autocapitalize="${st.key==="instagram"?"none":"sentences"}">`;
  } else if(st.type==="textarea"){
    body = `<textarea id="f_${st.key}" data-field="${st.key}" placeholder="${esc(st.ph||"")}">${esc(p[st.key])}</textarea>`;
  } else if(st.type==="chips1"){
    const isOther = p.especialidade && !ESPECIALIDADES.includes(p.especialidade);
    body = `<div class="chips">${ESPECIALIDADES.map(e=>`<button type="button" class="chip" data-act="esp" data-v="${esc(e)}" aria-pressed="${p.especialidade===e}">${esc(e)}</button>`).join("")}
      <button type="button" class="chip" data-act="esp-outra" aria-pressed="${!!isOther || wiz.other===true}">Outra</button></div>
      ${(isOther || wiz.other) ? `<input id="f_esp_outra" type="text" data-field="especialidade" value="${esc(isOther?p.especialidade:"")}" placeholder="Escreva sua especialidade" style="margin-top:12px">` : ""}`;
  } else if(st.type==="doctor"){
    body = `<div class="stack-sm"><label class="lbl" for="f_medico">Nome como aparece no post</label><input id="f_medico" type="text" data-field="medico" value="${esc(p.medico)}" placeholder="Ex.: Dra. Ana Souza"></div>
      <div class="grid2"><div><label class="lbl" for="f_crm">CRM e estado</label><input id="f_crm" type="text" data-field="crm" value="${esc(p.crm)}" placeholder="CRM-PE 12345"></div>
      <div><label class="lbl" for="f_rqe">RQE (se tiver)</label><input id="f_rqe" type="text" data-field="rqe" value="${esc(p.rqe)}" placeholder="RQE 6789"></div></div>`;
  } else if(st.type==="services"){
    const sug = SERVICOS_SUG[p.especialidade] || []; const cur = splitList(p.servicos);
    body = `${sug.length ? `<div class="chips">${sug.map(s=>`<button type="button" class="chip" data-act="serv" data-v="${esc(s)}" aria-pressed="${cur.includes(s)}">${esc(s)}</button>`).join("")}</div>` : ""}
      <textarea id="f_servicos" data-field="servicos" placeholder="Ex.: consulta, exames de rotina, cirurgia de catarata">${esc(p.servicos)}</textarea>`;
  } else if(st.type==="chipsN"){
    body = `<div class="chips">${PUBLICOS.map(o=>`<button type="button" class="chip" data-act="pub" data-v="${esc(o)}" aria-pressed="${p.publico.includes(o)}">${esc(o)}</button>`).join("")}</div>`;
  } else if(st.type==="tone"){
    body = `<div class="tones">${TONS.map(t=>`<button type="button" class="tone" data-act="tom" data-v="${t.id}" aria-pressed="${p.tom===t.id}"><b>${t.t}</b><span>${t.d}</span></button>`).join("")}</div>`;
  }
  return `
<div class="stack">
  <div class="stack-sm">
    <span class="step-label">Pergunta ${wiz.i+1} de ${n}</span>
    <div class="progress" aria-hidden="true"><span style="width:${Math.round((wiz.i+1)/n*100)}%"></span></div>
  </div>
  <h2>${esc(st.q)}</h2>
  ${st.help ? `<p class="muted">${esc(st.help)}</p>` : ""}
  ${body}
  <p class="small" id="wizErr" style="color:var(--danger)" hidden></p>
  <div class="wiz-actions">
    <button class="btn btn-ghost" data-act="wiz-back">${wiz.i===0 && wiz.edit ? "Cancelar" : "Voltar"}</button>
    <button class="btn btn-primary" data-act="wiz-next">${wiz.i===n-1 ? (wiz.edit?"Salvar respostas":"Continuar") : (st.optional && !String(p[st.key]||"").trim() ? "Pular" : "Continuar")}</button>
  </div>
</div>`;
};
after.wizard = () => { const el = document.querySelector("#view input, #view textarea"); if(el && window.innerWidth > 700) el.focus(); };
function splitList(s){ return String(s||"").split(/\s*[,;\n]\s*/).map(x=>x.trim()).filter(Boolean); }
function validStep(){
  const st = STEPS[wiz.i], p = S.profile;
  if(st.optional) return "";
  if(st.type==="doctor") return (!p.medico.trim() || !p.crm.trim()) ? "Preencha o nome e o CRM para continuar." : "";
  if(st.type==="chipsN") return p.publico.length ? "" : "Escolha pelo menos uma opção.";
  if(st.type==="tone") return p.tom ? "" : "Escolha uma opção.";
  return String(p[st.key]||"").trim() ? "" : "Responda para continuar.";
}

/* Marca e fotos */
VIEWS.marca = () => {
  const b = S.brand;
  return `
<div class="stack">
  ${brandFromOnboarding ? `<div class="stack-sm"><span class="step-label">Última etapa</span><div class="progress"><span style="width:100%"></span></div></div>` : `<button class="link" data-act="nav" data-to="clinica" style="align-self:flex-start">← Voltar</button>`}
  <h2>Sua marca</h2>
  <p class="muted">Coloque sua logo. O Atelier escolhe as cores a partir dela, e você pode trocar se quiser.</p>
  <label class="logo-drop" for="logoInput">
    <span class="ph">${b.logo ? `<img src="${b.logo}" alt="Sua logo">` : `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted)"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>`}</span>
    <span><b>${b.logo ? "Trocar logo" : "Enviar minha logo"}</b><br><span class="small muted">PNG ou JPG. De preferência com fundo transparente.</span></span>
  </label>
  <input id="logoInput" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden>
  ${b.logo ? `<button class="link" data-act="logo-remove" style="align-self:flex-start">Remover logo</button>` : ""}

  <div class="stack-sm">
    <h3>Cores</h3>
    <div class="swatches">
      <label class="swatch"><input type="color" id="cor1" value="${esc(b.cor1)}">Principal</label>
      <label class="swatch"><input type="color" id="cor2" value="${esc(b.cor2)}">Destaque</label>
    </div>
    <p class="small muted" style="margin-top:6px">Ou escolha uma combinação pronta:</p>
    <div class="presets">${PRESETS.map((pr,i)=>`<button type="button" class="preset" data-act="preset" data-i="${i}" aria-label="Combinação ${i+1}" aria-pressed="${pr[0].toLowerCase()===b.cor1.toLowerCase()&&pr[1].toLowerCase()===b.cor2.toLowerCase()}"><span style="background:${pr[0]}"></span><span style="background:${pr[1]}"></span></button>`).join("")}</div>
  </div>

  <div class="stack-sm">
    <h3>Suas fotos</h3>
    <p class="small muted">Fotos suas, da equipe ou da clínica deixam os posts muito mais fortes. Prefira fotos verticais, com boa luz e fundo simples. Até 6 fotos.</p>
    <div class="photos">
      ${S.fotoIds.map(id=>`<div class="photo"><img data-path="${esc(S.cutouts[id]||id)}" alt="Sua foto"${S.cutouts[id]?' style="background:#e9edf2;object-fit:contain"':""}>${S.cutouts[id] ? `<span class="tag ok">Fundo removido ✓</span>` : (cutJobs[id] ? `<span class="tag">${cutJobs[id]==="err" ? "Não recortou" : "Removendo fundo…"}</span>` : "")}<button type="button" class="x" data-act="foto-del" data-id="${esc(id)}" aria-label="Remover foto">×</button></div>`).join("")}
      ${S.fotoIds.length < 6 ? `<label class="photo add" for="fotoInput"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span class="small">Adicionar</span></label>` : ""}
    </div>
    <input id="fotoInput" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>
  </div>

  <div class="stack-sm">
    <h3>Prévia</h3>
    <div class="preview-row" id="brandPreview"></div>
  </div>
  <button class="btn btn-primary btn-block" data-act="brand-save">${brandFromOnboarding ? "Pronto, ver meus estilos" : "Salvar marca"}</button>
</div>`;
};
let previewTimer = null;
async function refreshBrandPreview(){
  const el = $("#brandPreview"); if(!el) return;
  const ids = ["impacto","lateral","poster"];
  const imgs = [];
  for(const id of ids){ const r = await renderPost(demoPost(id), {key:"bp-"+id, nocache:true, thumb:true, only:0}); imgs.push(`<img alt="Prévia do estilo ${esc(getTpl(id).nome)}" src="${r[0].url}">`); }
  if($("#brandPreview")) $("#brandPreview").innerHTML = imgs.join("");
}
async function compressPhoto(file){
  const url = await new Promise((res,rej)=>{ const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
  const img = await loadImage(url);
  for(const [max,q] of [[1600,.86],[1200,.8],[1000,.72]]){
    const sc = Math.min(1, max/Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width*sc); c.height = Math.round(img.height*sc);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    const out = c.toDataURL("image/jpeg", q);
    if(out.length < 2800000) return out;
  }
  return null;
}
after.marca = () => {
  refreshBrandPreview();
  document.querySelectorAll("img[data-path]").forEach(async im => { const u = await Plat.url(im.dataset.path); if(u) im.src = u; });
  const fi = $("#logoInput");
  fi.addEventListener("change", async () => {
    const file = fi.files && fi.files[0]; if(!file) return;
    try{
      const url = await new Promise((res,rej)=>{ const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
      const img = await loadImage(url);
      const max = 520, sc = Math.min(1, max/Math.max(img.width||max, img.height||max));
      const c = document.createElement("canvas"); c.width = Math.max(1,Math.round((img.width||max)*sc)); c.height = Math.max(1,Math.round((img.height||max)*sc));
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      S.brand.logo = c.toDataURL("image/png");
      const cols = extractColors(img);
      if(cols){ S.brand.cor1 = cols[0]; S.brand.cor2 = cols[1]; toast("Pegamos as cores da sua logo"); }
      brandRev++; save(); render();
    }catch(e){ toast("Não foi possível ler essa imagem. Tente um arquivo PNG ou JPG."); }
  });
  const pi = $("#fotoInput");
  pi.addEventListener("change", async () => {
    const files = Array.from(pi.files || []).slice(0, 6 - S.fotoIds.length);
    let added = 0;
    for(const f of files){
      try{
        const data = await compressPhoto(f); if(!data) continue;
        const blob = await (await fetch(data)).blob();
        const path = await Plat.upload("fotos", blob, "jpg");
        S.fotoIds.push(path); added++; autoCutout(path);
      }catch(e){}
    }
    save(); brandRev++;
    toast(added ? (added>1 ? added+" fotos adicionadas" : "Foto adicionada") + (imagesOn() ? ". Estamos removendo o fundo." : "") : "Não foi possível ler essas fotos.");
    render();
  });
  ["cor1","cor2"].forEach(k=>{
    $("#"+k).addEventListener("input", e => {
      S.brand[k] = e.target.value; brandRev++;
      clearTimeout(previewTimer); previewTimer = setTimeout(()=>{ refreshBrandPreview(); save(); }, 220);
    });
  });
};

/* Recorte automático: quando o médico envia uma foto, a IA remove o fundo (1 vez por foto) */
const cutJobs = {};
async function autoCutout(path){
  if(!imagesOn() || S.cutouts[path] || cutJobs[path]==="busy") return;
  cutJobs[path] = "busy"; if(view==="marca") render();
  try{
    const r = await Plat.api("/api/image", {kind:"cutout", photoPath:path});
    if(S.fotoIds.includes(path)){ S.cutouts[path] = r.path; brandRev++; save(); } else Plat.remove([r.path]).catch(()=>{});
    delete cutJobs[path];
  }catch(e){ cutJobs[path] = "err"; }
  if(view==="marca") render();
}
function refUploadStatus(){ return refUp.busy ? `<div class="ai-status"><div class="spinner" aria-hidden="true"></div><span>Lendo sua referência e criando o prompt… leva uns 20 segundos.</span></div>` : (refUp.error ? `<div class="notice warn"><div>${esc(refUp.error)}</div></div>` : ""); }
let refUp = {busy:false, error:""};
async function uploadRef(file){
  refUp = {busy:true, error:""}; render();
  try{
    const data = await compressPhoto(file); if(!data) throw {code:"bad_image"};
    const blob = await (await fetch(data)).blob();
    const path = await Plat.upload("refs", blob, "jpg");
    const r = await Plat.api("/api/refprompt", {imagePath:path});
    const id = uid();
    S.customRefs.unshift({id, path, prompt:String(r.prompt||""), temPessoa:!!r.temPessoa, escuro:!!r.escuro, nome:"Minha referência " + (S.customRefs.length+1)});
    S.favs.push("cref:"+id); save();
    refUp = {busy:false, error:""}; toast("Referência adicionada e marcada para os próximos posts");
  }catch(e){ refUp = {busy:false, error: e && e.code==="bad_image" ? "Não foi possível ler essa imagem. Tente um JPG ou PNG." : errMsg(e)}; }
  render();
}

/* Estilos */
function refCard(r, on){ return `
    <div class="ref-card">
      <button class="im ${on?"on":""}" data-act="style-open" data-id="${esc(r.id)}" aria-label="Ver o estilo ${esc(r.nome)}">${r.thumb ? `<img alt="" loading="lazy" src="${r.thumb}">` : `<img alt="" data-path="${esc(r.path)}">`}${on?`<span class="chk">✓</span>`:""}</button>
      <button class="fav" data-act="fav" data-id="${esc(r.id)}" aria-pressed="${on}">${on?"✓ Usando":"Usar"}</button>
      <span class="nm">${esc(r.nome)}</span>
    </div>`; }
function autoCard(){ const on = S.favs.includes("ref:auto"); return `
    <div class="ref-card">
      <button class="im auto ${on?"on":""}" data-act="style-open" data-id="ref:auto" aria-label="Ver Criação livre com IA">${REFS.slice(0,4).map(r=>`<img alt="" loading="lazy" src="/refs/${r.id}.jpg">`).join("")}<span class="auto-badge">IA escolhe</span>${on?`<span class="chk">✓</span>`:""}</button>
      <button class="fav" data-act="fav" data-id="ref:auto" aria-pressed="${on}">${on?"✓ Usando":"Usar"}</button>
      <span class="nm">Criação livre com IA</span>
    </div>`; }
function refsSection(){
  if(!imagesOn()) return "";
  const list = REFS.map(r=>refInfo("ref:"+r.id)).filter(Boolean), mine = S.customRefs.map(r=>refInfo("cref:"+r.id)).filter(Boolean);
  return `
  <section class="stack-sm">
    ${refUploadStatus()}
    <div class="ref-grid">
${autoCard()}
            <div class="ref-card add"><label class="im" for="refInput"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Enviar minha referência</span></label><input id="refInput" type="file" accept="image/*" hidden></div>
      ${mine.map(r=>refCard(r, S.favs.includes(r.id))).join("")}
      ${list.map(r=>refCard(r, S.favs.includes(r.id))).join("")}
    </div>
  </section>`;
}
VIEWS.estilos = () => imagesOn() ? `
<div class="stack">
  <div class="stack-sm">
    <h1>Estilos</h1>
    <p class="muted">Escolha de quais referências a IA vai tirar as ideias para criar suas artes. Deixe só <b>Criação livre</b> marcada para a IA escolher sozinha a melhor referência para cada assunto, ou marque as que você mais gosta. Você também pode enviar uma referência sua.</p>
    ${!S.fotoIds.length ? `<div class="notice warn"><div>Com uma foto sua, você aparece nas artes. <button class="link" data-act="edit-brand" style="padding:0">Adicionar fotos</button></div></div>` : ""}
  </div>
  ${refsSection()}
</div>` : `
<div class="stack">
  <div class="stack-sm">
    <h1>Estilos</h1>
    <p class="muted">Marque os estilos que combinam com você. Os próximos posts saem só nos estilos marcados.</p>
  </div>
  <div class="styles">${TEMPLATES.map(t=>{ const on = S.favs.includes(t.id); return `
    <div class="style-card">
      <button class="im" data-act="style-open" data-id="${t.id}" id="st_${t.id}" aria-label="Ver o estilo ${esc(t.nome)}"></button>
      <div class="row" style="justify-content:space-between;gap:6px;flex-wrap:nowrap">
        <div style="min-width:0"><b>${esc(t.nome)}</b></div>
        <button class="fav" data-act="fav" data-id="${t.id}" aria-pressed="${on}">${on?"✓ Usando":"Usar"}</button>
      </div>
      <span class="small muted">${esc(t.desc)}</span>
    </div>`; }).join("")}</div>
</div>`;
after.estilos = async () => {
  const ri = $("#refInput"); if(ri) ri.addEventListener("change", ()=>{ const f = ri.files && ri.files[0]; if(f) uploadRef(f); });
  for(const im of document.querySelectorAll(".ref-card img[data-path]")){ Plat.url(im.dataset.path).then(u=>{ if(u) im.src = u; }); }
  for(const t of TEMPLATES){
    if(!document.getElementById("st_"+t.id)) break;
    const r = await renderPost(demoPost(t.id), {key:"st-"+t.id, thumb:true, only:0});
    const el = document.getElementById("st_"+t.id); if(el && r[0]) el.innerHTML = `<img alt="" src="${r[0].url}">`;
  }
};
VIEWS.estilo = () => {
  const ri = refInfo(styleDetail);
  if(ri){ const on = S.favs.includes(ri.id); return `
<div class="stack">
  <button class="link" data-act="nav" data-to="estilos" style="align-self:flex-start">← Estilos</button>
  <h1>${esc(ri.nome)}</h1>
  <p class="muted">${ri.auto ? "A IA lê o conteúdo de cada post, escolhe entre as 29 referências de mercado as que combinam com o assunto e escreve um prompt exclusivo: cenário, lente, ângulo, elementos e tipografia sob medida. Cada post sai diferente" : "Referência de estilo. A IA escreve um prompt novo a partir desta referência e do conteúdo do post"}, com o tema do post, o seu texto e as suas cores${ri.pessoa ? (S.fotoIds.length ? ", usando a sua foto no lugar da pessoa" : ". Adicione uma foto sua para aparecer no lugar da pessoa") : ""}. O CRM e o @ entram embaixo, sempre certos.</p>
  ${ri.auto ? `<div class="ref-grid">${REFS.slice(0,9).map(r=>`<div class="ref-card"><div class="im"><img alt="" loading="lazy" src="/refs/${r.id}.jpg"></div></div>`).join("")}</div>` : `<div class="ref-big"><img id="refBig" alt="Referência" ${ri.thumb ? `src="${ri.thumb}"` : ""}></div>`}
  <div class="grid2">
    <button class="btn ${on?"btn-ghost":"btn-primary"}" data-act="fav" data-id="${esc(ri.id)}">${on?"Parar de usar":"Usar este estilo"}</button>
    <button class="btn btn-primary" data-act="style-create" data-id="${esc(ri.id)}">Criar post neste estilo</button>
  </div>
  ${ri.custom ? `<button class="link" data-act="cref-del" data-id="${esc(ri.custom.id)}" style="align-self:center">Apagar esta referência</button>` : ""}
</div>`; }
  const t = getTpl(styleDetail), on = S.favs.includes(t.id);
  return `
<div class="stack">
  <button class="link" data-act="nav" data-to="estilos" style="align-self:flex-start">← Estilos</button>
  <h1>${esc(t.nome)}</h1>
  <p class="muted">${esc(t.desc)} Veja como ficam a capa, uma lâmina interna e a lâmina final de um carrossel.</p>
  <div class="detail-strip" id="detailStrip">${[0,1,2].map(()=>`<div class="ds"><div class="skeleton" style="padding:20px"><div></div></div></div>`).join("")}</div>
  <div class="grid2">
    <button class="btn ${on?"btn-ghost":"btn-primary"}" data-act="fav" data-id="${t.id}">${on?"Parar de usar":"Usar este estilo"}</button>
    <button class="btn btn-primary" data-act="style-create" data-id="${t.id}">Criar post neste estilo</button>
  </div>
</div>`;
};
after.estilo = async () => {
  const ri = refInfo(styleDetail);
  if(ri){ if(ri.path){ const u = await Plat.url(ri.path); const im = $("#refBig"); if(u && im) im.src = u; } return; }
  const r = await renderPost(demoPost(styleDetail, "carrossel"), {key:"det-"+styleDetail, thumb:true});
  const el = $("#detailStrip"); if(el) el.innerHTML = r.map((x,i)=>`<div class="ds"><img alt="Lâmina ${i+1}" src="${x.url}"></div>`).join("");
};

/* Preparando estratégia */
VIEWS.preparando = () => `
<div class="loading-box">
  <div class="spinner" aria-hidden="true"></div>
  <h2>Montando a linha de conteúdo da ${esc(S.profile.nome)}</h2>
  <p class="muted">Leva cerca de 20 segundos. Se aparecer um aviso pedindo para usar o Claude, toque em permitir.</p>
</div>`;
function cleanStrategy(r){ return {resumo:String(r.resumo||""), pilares:r.pilares.slice(0,5).map(p=>({nome:String(p.nome||""), descricao:String(p.descricao||"")}))}; }
async function runStrategy(){
  go("preparando");
  if(!sample) await waitForSample();
  if(sample){ try{ const r = await sample.json(strategyPrompt(), {modelTier:"quick", cache:false}); if(r && Array.isArray(r.pilares)) S.estrategia = cleanStrategy(r); }catch(e){ toast(errMsg(e)); } }
  S.onboarded = true; save(); go("estilos");
  setTimeout(()=>toast("Escolha os estilos que combinam com você"), 400);
}
function waitForSample(){ return new Promise(res=>{ let t = 0; const iv = setInterval(()=>{ t += 250; if(sample || aiChecked || t > 11000){ clearInterval(iv); res(); } }, 250); }); }

/* Hoje */
VIEWS.home = () => {
  const p = S.profile;
  const ideas = S.today && S.today.date === todayStr() ? S.today.ideas : null;
  const aiOff = aiChecked && !sample;
  let ideasHtml;
  if(aiOff) ideasHtml = `<div class="notice warn"><div>A IA não está disponível nesta tela. Abra o Atelier pelo Claude, com sua conta conectada, para receber ideias e criar posts.</div></div>`;
  else if(ideasState.loading) ideasHtml = `<div class="stack"><p class="muted small">Pensando nas ideias de hoje…</p>${[1,2,3].map(()=>`<div class="skeleton"><div style="width:85%"></div><div style="width:60%"></div></div>`).join("")}</div>`;
  else if(ideasState.error) ideasHtml = `<div class="stack-sm"><div class="notice warn"><div>${esc(ideasState.error)}</div></div><button class="btn btn-ghost" data-act="ideas">Tentar de novo</button></div>`;
  else if(ideas && ideas.length) ideasHtml = ideas.map((it,i)=>`
      <div class="idea">
        <div class="row"><span class="pill">${it.formato==="carrossel"?"Carrossel":"Post"}</span>${it.pilar?`<span class="pill neutral">${esc(it.pilar)}</span>`:""}</div>
        <h3>${esc(it.titulo)}</h3>
        ${it.porque?`<p class="muted">${esc(it.porque)}</p>`:""}
        <button class="btn btn-primary" data-act="idea-create" data-i="${i}">Criar este post</button>
      </div>`).join("") + `<button class="link" data-act="ideas-more">Quero outras ideias</button>`;
  else ideasHtml = `<div class="stack-sm"><p class="muted">Toque abaixo para receber 3 sugestões pensadas para a sua clínica.</p><button class="btn btn-primary" data-act="ideas">Ver ideias de hoje</button></div>`;
  const tplName = draft.tpl ? getTpl(draft.tpl).nome : "";
  return `
<div class="stack">
  <div class="stack-sm">
    <h1>${saudacao()}${p.medico ? ", " + esc(p.medico) : ""}</h1>
    <div class="date-line"><span class="muted" style="text-transform:capitalize">${esc(dataLonga())}</span><span class="pill">${esc(campanha())}</span></div>
  </div>
  <section class="card stack">
    <h2>Ideias para hoje</h2>
    <div>${ideasHtml}</div>
  </section>
  <section class="card stack" id="ownIdea">
    <h2>Tenho uma ideia</h2>
    <p class="muted">Escreva o assunto do jeito que vier à cabeça.</p>
    <textarea id="draftTxt" data-draft="texto" placeholder="Ex.: explicar quando a criança precisa ir ao oftalmologista" style="min-height:96px">${esc(draft.texto)}</textarea>
    <div class="seg" role="group" aria-label="Formato">
      <button type="button" data-act="fmt" data-v="post" aria-pressed="${draft.formato==="post"}">Post único</button>
      <button type="button" data-act="fmt" data-v="carrossel" aria-pressed="${draft.formato==="carrossel"}">Carrossel</button>
    </div>
    ${tplName ? `<div class="row"><span class="pill">Estilo: ${esc(tplName)}</span><button class="link" data-act="tpl-clear">Usar meus estilos</button></div>` : ""}
    <button class="btn btn-primary" data-act="draft-create" ${aiOff?"disabled":""}>Criar post</button>
  </section>
</div>`;
};
after.home = () => {
  const has = S.today && S.today.date === todayStr() && S.today.ideas && S.today.ideas.length;
  if(!has && sample && !ideasState.loading && !ideasState.autoTried && !ideasState.error){ ideasState.autoTried = true; runIdeas(false); }
};
async function runIdeas(more){
  if(!sample){ await waitForSample(); if(!sample){ render(); return; } }
  ideasState.loading = true; ideasState.error = ""; if(view==="home") render();
  const avoid = more && S.today ? (S.today.ideas||[]).map(i=>i.titulo) : [];
  try{
    const r = await sample.json(ideasPrompt(avoid), {modelTier:"quick", cache:false});
    const list = (Array.isArray(r) ? r : (r && Array.isArray(r.ideias) ? r.ideias : [])).map(x=>({titulo:String(x.titulo||"").trim(), porque:String(x.porque||"").trim(), formato: /carross/i.test(String(x.formato||"")) ? "carrossel" : "post", pilar:String(x.pilar||"").trim()})).filter(x=>x.titulo).slice(0,3);
    if(!list.length) throw {code:"invalid_json"};
    S.today = {date: todayStr(), ideas: list}; save();
  }catch(e){ ideasState.error = errMsg(e); }
  ideasState.loading = false; if(view==="home") render();
}

/* Gerar post */
VIEWS.gerando = () => gen.error ? `
<div class="stack">
  <button class="link" data-act="nav" data-to="home" style="align-self:flex-start">← Voltar</button>
  <div class="notice warn"><div>${esc(gen.error)}</div></div>
  <button class="btn btn-primary btn-block" data-act="gen-retry">Tentar de novo</button>
</div>` : `
<div class="loading-box">
  <div class="spinner" aria-hidden="true"></div>
  <h2>Criando seu post</h2>
  <p class="muted">“${esc(gen.tema)}”</p>
  <p class="muted small" id="genStatus">Escrevendo o texto e conferindo as regras do CFM. Leva de 20 a 60 segundos.</p>
  <button class="btn btn-line" data-act="gen-cancel">Cancelar</button>
</div>`;
async function createPost(tema, formato, keepTpl){
  if(!sample){ await waitForSample(); if(!sample){ toast("A IA não está disponível nesta tela."); return; } }
  gen = {ctl:new AbortController(), error:"", tema, formato, keepTpl};
  go("gerando");
  try{
    const r = await sample.json(postPrompt(tema, formato), {signal:gen.ctl.signal, cache:false,
      onText:()=>{ const s = $("#genStatus"); if(s) s.textContent = "Quase pronto, montando a arte…"; }});
    const post = normalizePost(r, tema, formato);
    if(keepTpl) post.tpl = keepTpl;
    S.posts.unshift(post); save();
    current = post; slideIdx = 0; current.fromHistory = false;
    go("post");
    if(missingAI(post)) makeAssets(post);
  }catch(e){
    if(e && e.code === "cancelled"){ go("home"); return; }
    gen.error = errMsg(e); if(view==="gerando") render();
  }
}

/* Imagens com IA (OpenAI) */
const aiJobs = {};
function needsFull(post){ return !!refInfo(post.tpl); }
function needsBg(post){ if(refInfo(post.tpl)) return false; const t = getTpl(post.tpl); return !!((t.aiBg && !(t.photoBg && post.foto)) || (t.bandBg && !post.foto)); }
function needsCut(post){ if(refInfo(post.tpl)) return false; const t = getTpl(post.tpl); return !!(t.needsCut && post.foto && !S.cutouts[post.foto]); }
function missingPages(post){
  if(!needsFull(post) || post.formato !== "carrossel") return [];
  const pg = (post.pages||{})[post.tpl] || [], n = slidesFor(post).length, out = [];
  for(let i=1;i<n;i++) if(!pg[i]) out.push(i);
  return out;
}
function missingAI(post){ return (needsFull(post) && (!(post.full||{})[post.tpl] || missingPages(post).length)) || (needsBg(post) && !(post.bgs||{})[post.tpl]) || needsCut(post); }
function refreshPost(post){ if(view==="post" && current===post && !editing) render(); }
async function makeAssets(post, forceBg){
  if(!Plat.config || !Plat.config.imagesEnabled) return;
  const job = aiJobs[post.id] = {busy:true, error:"", msg:""};
  try{
    const ri = refInfo(post.tpl);
    if(ri && (forceBg || !(post.full||{})[post.tpl])){
      const tpl = post.tpl, s0 = post.slides[0] || {};
      const foto = ri.pessoa && post.foto ? (S.cutouts[post.foto] || post.foto) : "";
      job.msg = "A IA está criando a arte neste estilo" + (foto ? ", com a sua foto" : "") + "… leva cerca de 1 minuto."; refreshPost(post);
      const body = {kind:"post", tema:post.tema, especialidade:S.profile.especialidade, topo:post.topo, pre:s0.pre, titulo:s0.titulo, apoio:s0.apoio, c1:S.brand.cor1, c2:S.brand.cor2, photoPath:foto};
      if(ri.refId) body.refId = ri.refId; else { body.refPrompt = ri.custom.prompt; body.temPessoa = ri.pessoa; body.refPath = ri.custom.path; }
      body.recent = S.posts.map(p=>{ const m = p.fullMeta && Object.values(p.fullMeta)[0]; return m && m.principal; }).filter(Boolean).slice(0,6);
      if(ri.auto) job.msg = "A IA está criando um prompt exclusivo a partir das referências e desenhando a arte… leva de 1 a 2 minutos.";
      const old = (post.full||{})[tpl];
      const r = await Plat.api("/api/image", body);
      post.full = Object.assign({}, post.full, {[tpl]: r.path});
      post.fullMeta = Object.assign({}, post.fullMeta, {[tpl]: {principal:r.principal||"", escuro:r.escuro, prompt:String(r.prompt||"").slice(0,6000)}}); post.rev = (post.rev||0)+1;
      const oldPages = ((post.pages||{})[tpl]||[]).filter(Boolean);
      post.pages = Object.assign({}, post.pages, {[tpl]: []}); save();
      if(old) Plat.remove([old].concat(oldPages)).catch(()=>{});
      refreshPost(post);
    }
    if(ri && (post.full||{})[post.tpl]) await makePages(post, job, missingPages(post));
    if(needsCut(post)){
      job.msg = "Recortando você da foto… (só na primeira vez)"; refreshPost(post);
      const r = await Plat.api("/api/image", {kind:"cutout", photoPath:post.foto});
      S.cutouts[post.foto] = r.path; post.rev = (post.rev||0)+1; save();
    }
    if(needsBg(post) && (forceBg || !(post.bgs||{})[post.tpl])){
      job.msg = "Criando a imagem do post com IA… leva cerca de 30 segundos."; refreshPost(post);
      const old = (post.bgs||{})[post.tpl];
      const r = await Plat.api("/api/image", {kind:"background", tpl:post.tpl, tema:post.tema, especialidade:S.profile.especialidade});
      post.bgs = Object.assign({}, post.bgs, {[post.tpl]: r.path}); post.rev = (post.rev||0)+1; save();
      if(old) Plat.remove([old]).catch(()=>{});
    }
  }catch(e){ job.error = errMsg(e); }
  job.busy = false; refreshPost(post);
}
/* Lâminas do carrossel no mesmo estilo da capa (a capa vai como referência para a IA) */
async function makePages(post, job, idxs){
  const tpl = post.tpl, list = slidesFor(post), n = list.length;
  if(!idxs.length) return;
  let done = 0;
  const msg = () => { job.msg = `Criando as lâminas do carrossel no mesmo estilo da capa… (${done} de ${idxs.length} prontas)`; refreshPost(post); };
  msg();
  const one = async (i) => {
    const sl = list[i];
    const body = {kind:"slide", coverPath:post.full[tpl], artPrompt:((post.fullMeta||{})[tpl]||{}).prompt || "", slideKind: sl.kind === "cta" ? "cta" : "interna",
      index:i, total:n, titulo:sl.titulo||"", texto:sl.texto||"", itens:sl.itens||[], cta:post.cta||"", nome:S.profile.nome, whatsapp:S.profile.whatsapp, cidade:S.profile.cidade, c1:S.brand.cor1, c2:S.brand.cor2};
    const r = await Plat.api("/api/image", body);
    if(post.tpl !== tpl || !post.full[tpl] || post.full[tpl] !== body.coverPath){ Plat.remove([r.path]).catch(()=>{}); return; }
    const arr = ((post.pages||{})[tpl] || []).slice(); const old = arr[i]; arr[i] = r.path;
    post.pages = Object.assign({}, post.pages, {[tpl]: arr}); post.rev = (post.rev||0)+1; save();
    if(old) Plat.remove([old]).catch(()=>{});
    done++; msg();
  };
  const queue = idxs.slice(); let firstErr = null;
  await Promise.all([0,1,2].map(async () => { while(queue.length){ const i = queue.shift(); try{ await one(i); }catch(e){ firstErr = firstErr || e; } } }));
  if(firstErr) throw firstErr;
}
async function redoPage(post, i){
  if(!imagesOn()) return;
  const job = aiJobs[post.id] = {busy:true, error:"", msg:""};
  try{ await makePages(post, job, [i]); }catch(e){ job.error = errMsg(e); }
  job.busy = false; refreshPost(post);
}
function aiBlock(post){
  if(!Plat.config || !Plat.config.imagesEnabled) return "";
  const job = aiJobs[post.id];
  if(job && job.busy) return `<div class="ai-status"><div class="spinner" aria-hidden="true"></div><span>${esc(job.msg || "Criando imagem…")}</span></div>`;
  if(job && job.error) return `<div class="stack-sm"><div class="notice warn"><div>${esc(job.error)}</div></div><button class="btn btn-ghost btn-block" data-act="ai-make">Tentar de novo</button></div>`;
  if(missingAI(post)) return `<button class="btn btn-ghost btn-block" data-act="ai-make">${needsFull(post) ? ((post.full||{})[post.tpl] ? "Criar as lâminas no estilo da capa" : "Criar a arte com IA") : "Criar imagem com IA para este estilo"}</button><p class="small muted" style="text-align:center;margin-top:-6px">Usa 1 imagem do seu limite do mês.</p>`;
  if(needsFull(post)) return `<div class="row" style="justify-content:center;gap:18px;flex-wrap:wrap">${post.formato==="carrossel" && slideIdx>0 ? `<button class="link" data-act="ai-page">Refazer esta lâmina</button>` : ""}<button class="link" data-act="ai-new">${post.formato==="carrossel" ? "Refazer o carrossel todo" : "Gerar outra imagem com IA"}</button></div>`;
  if(needsBg(post)) return `<button class="link" data-act="ai-new" style="align-self:center">Gerar outra imagem com IA</button>`;
  return "";
}

/* Post pronto */
VIEWS.post = () => {
  const post = current; if(!post) return VIEWS.home();
  if(editing) return editView(post);
  const total = slidesFor(post).length, usesPhoto = styleUsesPhoto(post.tpl);
  const caption = (post.legenda||"") + (post.hashtags && post.hashtags.length ? "\n\n" + post.hashtags.join(" ") : "");
  const comp = post.alertas && post.alertas.length
    ? `<div class="notice warn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:none"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v4M12 17.5v.5"/></svg><div><b>Confira antes de publicar</b><ul>${post.alertas.map(a=>`<li>${esc(a)}</li>`).join("")}</ul></div></div>`
    : `<div class="notice ok"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex:none"><path d="M20 6 9 17l-5-5"/></svg><div><b>Texto revisado com as regras do CFM.</b> A responsabilidade final da publicação é do médico.</div></div>`;
  return `
<div class="stack">
  <button class="link" data-act="post-back" style="align-self:flex-start">← ${post.fromHistory ? "Meus posts" : "Hoje"}</button>
  <div class="stack-sm"><h2>${esc(post.tema)}</h2><span class="small muted">Estilo ${esc(styleName(post.tpl))}${refInfo(post.tpl) ? " · arte criada com IA" : ""}</span></div>
  <div class="post-stage" id="stage"><div class="skeleton" style="padding:24px"><div></div><div style="width:70%"></div></div></div>
  ${total > 1 ? `<div class="stage-nav"><button class="round" data-act="slide" data-d="-1" aria-label="Lâmina anterior" ${slideIdx===0?"disabled":""}>‹</button>
    <div class="stack-sm" style="align-items:center"><div class="dots">${Array.from({length:total},(_,i)=>`<i class="${i===slideIdx?"on":""}"></i>`).join("")}</div><span class="small muted">Lâmina ${slideIdx+1} de ${total}</span></div>
    <button class="round" data-act="slide" data-d="1" aria-label="Próxima lâmina" ${slideIdx===total-1?"disabled":""}>›</button></div>` : ""}
  ${!downloads ? `<p class="small muted" style="text-align:center">Para salvar no celular, toque e segure a imagem.</p>` : ""}
  ${aiBlock(post)}
  ${(post.fullMeta||{})[post.tpl] && post.fullMeta[post.tpl].prompt ? `<details class="small muted"><summary>Ver o prompt que a IA criou para esta arte${post.fullMeta[post.tpl].principal ? " (base: " + esc(styleName("ref:"+post.fullMeta[post.tpl].principal)) + ")" : ""}</summary><div class="caption" style="margin-top:8px;white-space:pre-wrap">${esc(post.fullMeta[post.tpl].prompt)}</div></details>` : ""}
  ${comp}
  <div class="grid2">
    <button class="btn btn-primary" data-act="dl-one">${total>1 ? "Baixar esta lâmina" : "Baixar imagem"}</button>
    ${total>1 ? `<button class="btn btn-primary" data-act="dl-all">Baixar todas (${total})</button>` : `<button class="btn btn-primary" data-act="copy">Copiar legenda</button>`}
  </div>
  ${total>1 ? `<button class="btn btn-ghost btn-block" data-act="copy">Copiar legenda</button>` : ""}
  <div class="grid2">
    <button class="btn btn-ghost" data-act="tpl-next">Mudar estilo</button>
    <button class="btn btn-ghost" data-act="edit">Editar textos</button>
  </div>
  ${usesPhoto ? (S.fotoIds.length ? `<button class="btn btn-ghost btn-block" data-act="foto-next">${post.foto ? "Trocar foto" : "Usar uma foto"}</button>${post.foto?`<button class="link" data-act="foto-none" style="align-self:center">Tirar a foto deste post</button>`:""}` : `<button class="btn btn-line btn-block" data-act="edit-brand">Adicionar fotos para este estilo</button>`) : ""}
  <section class="stack-sm">
    <h3>Legenda</h3>
    <div class="caption" id="captionBox">${esc(caption)}</div>
  </section>
  <button class="btn btn-line btn-block" data-act="regen">Criar outra versão deste tema</button>
</div>`;
};
after.post = async () => {
  if(editing || !current) return;
  const imgs = await renderPost(current);
  const st = $("#stage"); if(!st || !imgs[slideIdx]) return;
  st.innerHTML = `<img alt="Arte do post, lâmina ${slideIdx+1}" src="${imgs[slideIdx].url}">`;
};
function editView(post){
  const fld = (id, label, val, area) => `<label class="lbl" for="${id}">${label}</label>${area ? `<textarea id="${id}" style="min-height:90px">${esc(val)}</textarea>` : `<input id="${id}" type="text" value="${esc(val)}">`}`;
  return `
<div class="stack">
  <h2>Editar textos</h2>
  <p class="muted">Mude o que quiser e toque em atualizar. Para destacar palavras na arte, coloque entre asteriscos, assim: *palavra*.</p>
  <div class="stack-sm">${fld("e_topo","Rótulos do topo (separe por vírgula)", (post.topo||[]).join(", "))}</div>
  ${post.slides.map((s,i)=>`
  <div class="card flat stack-sm">
    <b>${i===0 ? (post.formato==="carrossel" ? "Capa" : "Arte") : "Lâmina "+(i+1)}</b>
    ${i===0 ? fld("e_pre"+i,"Abertura", s.pre||"") + fld("e_t"+i,"Título", s.titulo||"") + fld("e_a"+i,"Apoio", s.apoio||s.texto||"", true) + fld("e_n"+i,"Nota escrita à mão", s.nota||"") + fld("e_p"+i,"Palavra em letra cursiva", s.palavra||"")
      : fld("e_t"+i,"Título", s.titulo||"") + fld("e_x"+i,"Texto", s.texto||"", true) + fld("e_i"+i,"Itens (um por linha, no formato Rótulo: texto)", (s.itens||[]).map(x=>x.rotulo+": "+x.texto).join("\n"), true)}
  </div>`).join("")}
  <div class="stack-sm">${fld("e_cta","Chamada para agendar", post.cta||"")}</div>
  <div class="stack-sm"><label class="lbl" for="e_leg">Legenda</label><textarea id="e_leg" style="min-height:220px">${esc(post.legenda)}</textarea></div>
  <div class="stack-sm">${fld("e_hash","Hashtags", (post.hashtags||[]).join(" "))}</div>
  <div class="wiz-actions"><button class="btn btn-ghost" data-act="edit-cancel">Cancelar</button><button class="btn btn-primary" data-act="edit-save">Atualizar post</button></div>
</div>`;
}

/* Histórico */
VIEWS.historico = () => {
  if(!S.posts.length) return `
<div class="stack">
  <h1>Meus posts</h1>
  <div class="card stack-sm"><p>Os posts que você criar ficam guardados aqui, prontos para baixar de novo.</p><button class="btn btn-primary" data-act="nav" data-to="home">Criar meu primeiro post</button></div>
</div>`;
  return `
<div class="stack">
  <h1>Meus posts</h1>
  <div class="thumbs">${S.posts.map((p,i)=>`<button class="thumb" data-act="open" data-i="${i}"><div class="im" id="th_${esc(p.id)}"></div><b>${esc(p.tema)}</b><span class="small muted">${p.formato==="carrossel"?"Carrossel":"Post"} · ${new Date(p.createdAt).toLocaleDateString("pt-BR")}</span></button>`).join("")}</div>
</div>`;
};
after.historico = async () => {
  for(const p of S.posts){
    const r = await renderPost(p, {only:0, thumb:true});
    const el = document.getElementById("th_"+p.id); if(el && r[0]) el.innerHTML = `<img alt="" src="${r[0].url}">`;
  }
};

/* Minha clínica */
VIEWS.clinica = () => {
  const p = S.profile, b = S.brand, e = S.estrategia;
  const facts = [["Clínica",p.nome],["Especialidade",p.especialidade],["Cidade",p.cidade],["Assinatura",[p.medico,p.crm,p.rqe].filter(Boolean).join(" · ")],["Atendimentos",p.servicos],["Pacientes",(p.publico||[]).join(", ")],["Diferencial",p.diferencial||"—"],["Tom de voz",(TONS.find(t=>t.id===p.tom)||{}).t||"—"],["Instagram",p.instagram||"—"],["WhatsApp",p.whatsapp||"—"]];
  return `
<div class="stack">
  <h1>Minha clínica</h1>
  <section class="card stack">
    <div class="row" style="justify-content:space-between"><h2>Respostas</h2><button class="link" data-act="edit-answers">Editar</button></div>
    <dl class="facts" style="margin:0">${facts.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
  </section>
  <section class="card stack">
    <div class="row" style="justify-content:space-between"><h2>Marca e fotos</h2><button class="link" data-act="edit-brand">Editar</button></div>
    <div class="row">
      ${b.logo ? `<img src="${b.logo}" alt="Logo" style="max-height:56px;max-width:140px;background:#fff;border-radius:10px;padding:6px">` : `<span class="muted">Sem logo</span>`}
      <span style="width:40px;height:40px;border-radius:12px;background:${esc(b.cor1)};border:1px solid var(--line)" title="Cor principal"></span>
      <span style="width:40px;height:40px;border-radius:12px;background:${esc(b.cor2)};border:1px solid var(--line)" title="Cor de destaque"></span>
      <span class="muted">${S.fotoIds.length} ${S.fotoIds.length===1?"foto":"fotos"}</span>
    </div>
  </section>
  ${e ? `<section class="card stack">
    <h2>Linha de conteúdo</h2>
    ${e.resumo ? `<p>${esc(e.resumo)}</p>` : ""}
    <div class="pilares">${(e.pilares||[]).map(x=>`<div class="pilar"><b>${esc(x.nome)}</b><br><span class="muted">${esc(x.descricao)}</span></div>`).join("")}</div>
    <button class="link" data-act="restrat" style="align-self:flex-start">Refazer linha de conteúdo</button>
  </section>` : `<section class="card stack-sm"><h2>Linha de conteúdo</h2><p class="muted">Ainda não criada.</p><button class="btn btn-ghost" data-act="restrat">Criar agora</button></section>`}
  <section class="card stack-sm">
    <h2>Seu uso neste mês</h2>
    <p class="usage" id="usageBox">Carregando…</p>
    <p class="small muted">Conectado como ${esc(Plat.user ? Plat.user.email : "")}</p>
    <button class="btn btn-line" data-act="logout">Sair</button>
  </section>
  <section class="stack-sm">
    ${confirmReset ? `<div class="card stack-sm"><p><b>Apagar tudo?</b> Suas respostas, sua marca, suas fotos e seus posts saem deste aparelho e da sua conta.</p><div class="grid2"><button class="btn btn-ghost" data-act="reset-no">Manter</button><button class="btn btn-danger" data-act="reset-yes">Apagar tudo</button></div></div>`
    : `<button class="btn btn-line btn-block" data-act="reset">Apagar tudo e começar de novo</button>`}
  </section>
</div>`;
};

after.clinica = async () => {
  try{ const u = await Plat.api("/api/usage"); const el = $("#usageBox"); if(el) el.textContent = `${u.image} de ${u.imageLimit} imagens com IA · ${u.text} de ${u.textLimit} textos`; }
  catch(e){ const el = $("#usageBox"); if(el) el.textContent = "Não foi possível carregar seu consumo agora."; }
};
document.addEventListener("keydown", e => { if(e.key==="Enter" && view==="login" && e.target.id==="loginEmail"){ e.preventDefault(); sendLogin(); } });

/* ---------- Downloads ---------- */
function canvasBlob(c, type){ return new Promise(res=>c.toBlob(b=>res(b), type||"image/png")); }
async function doDownload(all){
  const imgs = await renderPost(current);
  if(!downloads){ toast("Toque e segure a imagem para salvar no seu aparelho."); return; }
  const idxs = all ? imgs.map((_,i)=>i) : [slideIdx];
  let n = 0;
  for(const i of idxs){
    try{
      const blob = await canvasBlob(imgs[i].canvas, "image/png");
      await downloads.save({filename:`${slug(S.profile.nome)}-${slug(current.tema)}${imgs.length>1?"-"+(i+1):""}.png`, data:blob}); n++;
    }catch(e){
      if(e && e.code === "declined") break;
      if(e && e.code === "rate_limited"){ toast("Espere um instante e tente de novo."); break; }
      downloads = null; render(); toast("Para salvar, toque e segure a imagem."); return;
    }
  }
  if(n) toast(n>1 ? n+" imagens salvas" : "Imagem salva");
}

/* ---------- Eventos ---------- */
document.addEventListener("input", e => {
  const t = e.target;
  if(t.dataset.field){ const k = t.dataset.field; S.profile[k] = t.value; if(k==="servicos" && view==="wizard") syncServChips(); const err = $("#wizErr"); if(err) err.hidden = true; save(); }
  if(t.dataset.draft){ draft.texto = t.value; }
});
function syncServChips(){ const cur = splitList(S.profile.servicos); document.querySelectorAll('[data-act="serv"]').forEach(b=>b.setAttribute("aria-pressed", cur.includes(b.dataset.v))); }
document.addEventListener("keydown", e => { if(e.key==="Enter" && view==="wizard" && e.target.tagName==="INPUT"){ e.preventDefault(); act("wiz-next", {}); } });
document.addEventListener("click", e => { const el = e.target.closest("[data-act]"); if(!el) return; act(el.dataset.act, el.dataset, el); });

function act(a, d, el){
  switch(a){
    case "nav": if(d.to==="home") current = null; go(d.to); break;
    case "start": wiz = {i:0, edit:false}; go("wizard"); break;
    case "esp": S.profile.especialidade = d.v; wiz.other = false; save(); render(); break;
    case "esp-outra": wiz.other = true; if(ESPECIALIDADES.includes(S.profile.especialidade)) S.profile.especialidade = ""; render(); setTimeout(()=>{ const i = $("#f_esp_outra"); i && i.focus(); }, 30); break;
    case "serv": { const cur = splitList(S.profile.servicos); const k = cur.indexOf(d.v); if(k>=0) cur.splice(k,1); else cur.push(d.v); S.profile.servicos = cur.join(", "); save(); const ta = $("#f_servicos"); if(ta) ta.value = S.profile.servicos; syncServChips(); break; }
    case "pub": { const L = S.profile.publico; const k = L.indexOf(d.v); if(k>=0) L.splice(k,1); else L.push(d.v); save(); el.setAttribute("aria-pressed", k<0); break; }
    case "tom": S.profile.tom = d.v; save(); document.querySelectorAll('[data-act="tom"]').forEach(b=>b.setAttribute("aria-pressed", b.dataset.v===d.v)); break;
    case "wiz-back": if(wiz.i===0) go(wiz.edit ? "clinica" : "welcome"); else { wiz.i--; wiz.other = false; render(); window.scrollTo(0,0); } break;
    case "wiz-next": {
      const msg = validStep(); if(msg){ const er = $("#wizErr"); er.textContent = msg; er.hidden = false; return; }
      if(STEPS[wiz.i].key==="instagram"){ const v = S.profile.instagram.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,"").replace(/\/$/,""); S.profile.instagram = v ? (v[0]==="@"?v:"@"+v) : ""; save(); brandRev++; }
      if(wiz.i < STEPS.length-1){ wiz.i++; wiz.other = false; render(); window.scrollTo(0,0); }
      else if(wiz.edit){ save(); brandRev++; toast("Respostas salvas"); go("clinica"); }
      else { brandFromOnboarding = true; go("marca"); }
      break;
    }
    case "preset": { const pr = PRESETS[+d.i]; S.brand.cor1 = pr[0]; S.brand.cor2 = pr[1]; brandRev++; save(); render(); break; }
    case "logo-remove": S.brand.logo = ""; logoImg = null; brandRev++; save(); render(); break;
    case "foto-del": {
      const id = d.id; S.fotoIds = S.fotoIds.filter(x=>x!==id);
      Plat.remove([id, S.cutouts[id]]).catch(()=>{}); delete S.cutouts[id];
      S.posts.forEach(p=>{ if(p.foto===id){ p.foto = ""; p.rev = (p.rev||0)+1; } });
      brandRev++; save(); render(); break;
    }
    case "brand-save":
      save();
      if(brandFromOnboarding){ brandFromOnboarding = false; runStrategy(); }
      else { toast("Marca salva"); go("clinica"); }
      break;
    case "fav": {
      const id = d.id, k = S.favs.indexOf(id);
      if(k>=0){ const same = S.favs.filter(f=>!!refInfo(f) === !!refInfo(id)); if(same.length===1){ toast("Deixe pelo menos um estilo marcado."); return; } S.favs.splice(k,1); } else S.favs.push(id);
      save(); render(); break;
    }
    case "style-open": styleDetail = d.id; go("estilo"); break;
    case "cref-del": {
      const r = S.customRefs.find(x=>x.id===d.id); if(!r) break;
      S.customRefs = S.customRefs.filter(x=>x!==r); S.favs = S.favs.filter(f=>f!=="cref:"+r.id); if(!S.favs.length) S.favs = TEMPLATES.map(t=>t.id);
      Plat.remove([r.path]).catch(()=>{}); save(); toast("Referência apagada"); go("estilos"); break;
    }
    case "style-create": draft.tpl = d.id; go("home"); setTimeout(()=>{ const box = $("#ownIdea"); if(box) box.scrollIntoView({behavior:"smooth", block:"start"}); const ta = $("#draftTxt"); ta && ta.focus({preventScroll:true}); }, 60); break;
    case "tpl-clear": draft.tpl = ""; render(); break;
    case "ideas": ideasState.error = ""; runIdeas(false); break;
    case "ideas-more": runIdeas(true); break;
    case "idea-create": { const it = S.today.ideas[+d.i]; createPost(it.titulo, it.formato); break; }
    case "fmt": draft.formato = d.v; document.querySelectorAll('[data-act="fmt"]').forEach(b=>b.setAttribute("aria-pressed", b.dataset.v===d.v)); break;
    case "draft-create": {
      const t = draft.texto.trim();
      if(t.length < 4){ toast("Escreva o assunto do post primeiro."); const ta = $("#draftTxt"); ta && ta.focus(); return; }
      createPost(t, draft.formato); draft.texto = ""; break;
    }
    case "gen-cancel": gen.ctl && gen.ctl.abort(); break;
    case "gen-retry": createPost(gen.tema, gen.formato, gen.keepTpl); break;
    case "post-back": go(current && current.fromHistory ? "historico" : "home"); break;
    case "slide": { const total = slidesFor(current).length; slideIdx = Math.max(0, Math.min(total-1, slideIdx + (+d.d))); render(); break; }
    case "tpl-next": {
      let pool = stylePool(); if(pool.length < 2) pool = imagesOn() ? ["ref:auto"].concat(REFS.map(r=>"ref:"+r.id)) : TEMPLATES.map(t=>t.id);
      const k = pool.indexOf(current.tpl); current.tpl = pool[(k+1) % pool.length];
      if(styleUsesPhoto(current.tpl) && !current.foto) current.foto = pickFoto();
      current.rev = (current.rev||0)+1; save(); render(); toast("Estilo " + styleName(current.tpl));
      if(refInfo(current.tpl) && missingAI(current)) makeAssets(current);
      break;
    }
    case "foto-next": { const ids = S.fotoIds; const k = ids.indexOf(current.foto); current.foto = ids[(k+1) % ids.length]; current.rev = (current.rev||0)+1; save(); render(); if(refInfo(current.tpl)) makeAssets(current, true); break; }
    case "foto-none": current.foto = ""; current.rev = (current.rev||0)+1; save(); render(); break;
    case "edit": editing = true; render(); window.scrollTo(0,0); break;
    case "edit-cancel": editing = false; render(); break;
    case "edit-save": {
      const p = current, v = id => { const x = document.getElementById(id); return x ? x.value.trim() : ""; };
      p.topo = v("e_topo").split(",").map(x=>x.trim()).filter(Boolean).slice(0,3);
      p.slides.forEach((s,i)=>{
        if(i===0){ s.pre = v("e_pre"+i); s.titulo = v("e_t"+i); s.apoio = v("e_a"+i); s.nota = v("e_n"+i); s.palavra = v("e_p"+i); }
        else { s.titulo = v("e_t"+i); s.texto = v("e_x"+i); s.itens = v("e_i"+i).split("\n").map(l=>{ const m = l.split(":"); return {rotulo:(m[0]||"").trim(), texto:m.slice(1).join(":").trim()}; }).filter(x=>x.rotulo||x.texto).slice(0,4); }
      });
      p.cta = v("e_cta").slice(0,40); p.legenda = document.getElementById("e_leg").value;
      p.hashtags = v("e_hash").split(/\s+/).filter(Boolean).map(h=>h[0]==="#"?h:"#"+h);
      p.alertas = Array.from(new Set((p.alertas||[]).filter(x=>!x.startsWith("Revise a expressão")).concat(localCheck(p))));
      p.rev = (p.rev||0)+1; editing = false; save(); toast(refInfo(p.tpl) ? "Textos salvos. Toque em “Refazer” embaixo da arte para ela usar o texto novo." : "Post atualizado"); render(); window.scrollTo(0,0); break;
    }
    case "copy": {
      const txt = (current.legenda||"") + (current.hashtags && current.hashtags.length ? "\n\n" + current.hashtags.join(" ") : "");
      const done = () => toast("Legenda copiada. Agora é só colar no Instagram.");
      const fallback = () => { const box = $("#captionBox"); if(box){ const r = document.createRange(); r.selectNodeContents(box); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } toast("Texto selecionado. Toque em Copiar no seu aparelho."); };
      try{ navigator.clipboard.writeText(txt).then(done, fallback); }catch(err){ fallback(); }
      break;
    }
    case "dl-one": doDownload(false); break;
    case "dl-all": doDownload(true); break;
    case "regen": createPost(current.tema, current.formato, current.tpl); break;
    case "open": current = S.posts[+d.i]; current.fromHistory = true; slideIdx = 0; go("post"); break;
    case "ai-make": makeAssets(current); break;
    case "ai-new": makeAssets(current, true); break;
    case "ai-page": redoPage(current, slideIdx); break;
    case "login-send": sendLogin(); break;
    case "login-again": loginState = {email:loginState.email, sent:false, error:"", busy:false}; render(); break;
    case "logout": Plat.signOut(); break;
    case "edit-answers": wiz = {i:0, edit:true}; go("wizard"); break;
    case "edit-brand": brandFromOnboarding = false; go("marca"); break;
    case "restrat": runStrategyFromClinic(); break;
    case "reset": confirmReset = true; render(); break;
    case "reset-no": confirmReset = false; render(); break;
    case "reset-yes": {
      Plat.removeAll().catch(()=>{});
      S = defaults(); S.updatedAt = Date.now(); logoImg = null; brandRev++; imgCache.clear(); current = null;
      try{ localStorage.removeItem(lsKey()); }catch(err){}
      save();
      ideasState = {loading:false, error:"", autoTried:false};
      go("welcome"); break;
    }
  }
}
async function runStrategyFromClinic(){
  if(!sample){ toast("A IA não está disponível nesta tela."); return; }
  toast("Refazendo a linha de conteúdo…");
  try{
    const r = await sample.json(strategyPrompt(), {modelTier:"quick", cache:false});
    if(r && Array.isArray(r.pilares)){ S.estrategia = cleanStrategy(r); save(); if(view==="clinica") render(); toast("Linha de conteúdo atualizada"); }
  }catch(e){ toast(errMsg(e)); }
}

/* ---------- Início ---------- */
render();
initPlatform();
