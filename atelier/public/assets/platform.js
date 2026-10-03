/* =====================================================================
   PLATAFORMA — login (Supabase), chamadas à API e arquivos.
   Expõe window.Plat para o app.
   ===================================================================== */
(function(){
  "use strict";
  const Plat = {sb:null, session:null, user:null, config:null, urls:new Map(), imgs:new Map()};

  Plat.init = async function(){
    const r = await fetch("/api/config"); Plat.config = await r.json();
    if(!Plat.config.supabaseUrl || !Plat.config.supabaseAnonKey) throw new Error("config");
    Plat.sb = window.supabase.createClient(Plat.config.supabaseUrl, Plat.config.supabaseAnonKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
    const { data } = await Plat.sb.auth.getSession();
    Plat.session = data.session; Plat.user = data.session ? data.session.user : null;
    Plat.sb.auth.onAuthStateChange((_ev, session)=>{
      const was = !!Plat.user; Plat.session = session; Plat.user = session ? session.user : null;
      if(!!Plat.user !== was && Plat.onAuth) Plat.onAuth(Plat.user);
    });
    return Plat.user;
  };

  Plat.sendLink = async function(email){
    const { error } = await Plat.sb.auth.signInWithOtp({ email, options:{ emailRedirectTo: location.origin, shouldCreateUser:true } });
    if(error) throw error;
  };
  Plat.signOut = () => Plat.sb.auth.signOut();
  Plat.isMember = async function(){
    const { data } = await Plat.sb.from("atelier_members").select("ativo").eq("email", (Plat.user.email||"").toLowerCase()).maybeSingle();
    return !!(data && data.ativo);
  };

  /* ---------- API ---------- */
  Plat.api = async function(path, body, signal){
    const token = Plat.session && Plat.session.access_token;
    const r = await fetch(path, { method: body ? "POST" : "GET", signal,
      headers: Object.assign({"content-type":"application/json"}, token ? {Authorization:"Bearer " + token} : {}),
      body: body ? JSON.stringify(body) : undefined });
    let j = {}; try{ j = await r.json(); }catch(e){}
    if(!r.ok){ const e = (j && j.error) || {}; throw {code: e.code || (r.status===401?"session_expired":r.status===429?"rate_limited":"upstream_error"), message: e.message || "Erro"}; }
    return j;
  };

  /* Mesmo formato do "sample" usado no protótipo, para o app não mudar */
  Plat.sample = {
    json: async (prompt, opts) => {
      opts = opts || {};
      try{ const j = await Plat.api("/api/text", {prompt, tier: opts.modelTier || "default"}, opts.signal); if(opts.onText) opts.onText({text:"", delta:""}); return j.data; }
      catch(e){ if(e && e.name === "AbortError") throw {code:"cancelled"}; throw e; }
    }
  };

  /* Download de verdade (fora do Claude o navegador permite) */
  Plat.downloads = {
    save: async ({filename, data}) => {
      const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
      const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 4000);
      return {status:"saved"};
    }
  };

  /* ---------- Estado do cliente (1 linha por usuário) ---------- */
  Plat.loadState = async function(){
    const { data, error } = await Plat.sb.from("atelier_user_state").select("data").eq("user_id", Plat.user.id).maybeSingle();
    if(error) throw error;
    return data ? data.data : null;
  };
  Plat.saveState = async function(state){
    const { error } = await Plat.sb.from("atelier_user_state").upsert({user_id: Plat.user.id, data: state, updated_at: new Date().toISOString()});
    if(error) throw error;
  };

  /* ---------- Arquivos ---------- */
  Plat.upload = async function(folder, blob, ext){
    const path = `${Plat.user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await Plat.sb.storage.from("atelier-assets").upload(path, blob, {contentType: blob.type || "image/jpeg"});
    if(error) throw error;
    return path;
  };
  Plat.url = async function(path){
    if(!path) return null;
    if(Plat.urls.has(path)) return Plat.urls.get(path);
    const { data, error } = await Plat.sb.storage.from("atelier-assets").download(path);
    if(error || !data) return null;
    const u = URL.createObjectURL(data); Plat.urls.set(path, u); return u;
  };
  Plat.image = async function(path){
    if(!path) return null;
    if(Plat.imgs.has(path)) return Plat.imgs.get(path);
    const u = await Plat.url(path); if(!u) return null;
    const img = await new Promise(res=>{ const i = new Image(); i.onload = ()=>res(i); i.onerror = ()=>res(null); i.src = u; });
    if(img) Plat.imgs.set(path, img);
    return img;
  };
  Plat.remove = async function(paths){ paths = (paths||[]).filter(Boolean); if(paths.length) await Plat.sb.storage.from("atelier-assets").remove(paths); };
  Plat.removeAll = async function(){
    for(const folder of ["fotos","ai","cut"]){
      const { data } = await Plat.sb.storage.from("atelier-assets").list(`${Plat.user.id}/${folder}`, {limit:1000});
      if(data && data.length) await Plat.remove(data.map(f=>`${Plat.user.id}/${folder}/${f.name}`));
    }
  };

  window.Plat = Plat;
})();
