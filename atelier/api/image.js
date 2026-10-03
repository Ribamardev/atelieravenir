// POST /api/image
// { kind: "background", tpl, tema, especialidade }  -> cria o fundo do post (sem texto)
// { kind: "cutout", photoPath }                      -> recorta a pessoa da foto (PNG transparente)
// { kind: "post", refId ("auto" = IA escolhe) | refPrompt, recent, temPessoa, photoPath?, tema, especialidade, topo, pre, titulo, apoio, c1, c2 }
//                                                    -> arte completa no estilo de uma referência (com o médico, se houver foto)
// Resposta: { path } — caminho do arquivo no Storage do Supabase (bucket "atelier-assets")
import { requireUser, readJson, send, fail, httpError, checkAndCount } from "./_lib/core.js";
import { generateBackground, cutoutPerson, generatePost } from "./_lib/image.js";
import { backgroundPrompt, backgroundSize, buildPostPrompt, directorPrompt, buildSlidePrompt } from "./_lib/prompts.js";
import { getRef, REFS, refImage } from "./_lib/refs.js";
import { generateJson } from "./_lib/text.js";
import { randomUUID } from "node:crypto";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") throw httpError(405, "invalid_request", "Use POST.");
    const ctx = await requireUser(req);
    const body = await readJson(req);
    const kind = String(body.kind || "");
    let out, folder;

    if (kind === "background") {
      const prompt = backgroundPrompt({ tpl: String(body.tpl || ""), tema: String(body.tema || "").slice(0, 200), especialidade: String(body.especialidade || "").slice(0, 60) });
      if (!prompt) throw httpError(400, "invalid_request", "Este estilo não usa imagem gerada.");
      if (!String(body.tema || "").trim()) throw httpError(400, "invalid_request", "Informe o tema do post.");
      await checkAndCount(ctx, "image");
      out = await generateBackground(prompt, backgroundSize(body.tpl));
      folder = "ai";
    } else if (kind === "post") {
      // 1) foto do médico (se houver)
      let person = null;
      const photoPath = String(body.photoPath || "");
      if (photoPath) {
        if (!photoPath.startsWith(ctx.user.id + "/")) throw httpError(403, "invalid_request", "Foto inválida.");
        const { data: file } = await ctx.db.storage.from("atelier-assets").download(photoPath);
        if (file) person = { buffer: Buffer.from(await file.arrayBuffer()), type: file.type || (photoPath.endsWith(".png") ? "image/png" : "image/jpeg") };
      }
      if (!String(body.titulo || "").trim()) throw httpError(400, "invalid_request", "O post precisa de um título.");
      const refId = String(body.refId || "");
      const ref = refId && refId !== "auto" ? getRef(refId) : null;
      const custom = !ref && refId !== "auto" ? String(body.refPrompt || "").slice(0, 4000) : "";
      const content = { tema: body.tema, especialidade: body.especialidade, topo: body.topo, pre: body.pre, titulo: body.titulo, apoio: body.apoio, c1: body.c1, c2: body.c2 };
      await checkAndCount(ctx, "image");
      // 2) diretor de arte: a IA escreve um prompt novo para este post, tirando ideias das referências
      let art = null;
      try {
        const recent = (Array.isArray(body.recent) ? body.recent : []).map(String).filter(id => getRef(id)).slice(0, 6);
        const { data } = await generateJson(directorPrompt({ catalog: REFS, base: ref ? ref.prompt : custom, recent, comFoto: !!person, ...content }));
        if (data && String(data.prompt || "").length > 120) art = data;
      } catch (e) { art = null; }
      let refPrompt, temPessoa, principal;
      if (art) { refPrompt = String(art.prompt); temPessoa = !!art.pessoa; principal = ref ? ref.id : String(art.principal || ""); }
      else {
        const fb = ref || (custom ? null : REFS[Math.floor(Math.random() * REFS.length)]);
        refPrompt = fb ? fb.prompt : custom; temPessoa = fb ? fb.pessoa : !!body.temPessoa; principal = fb ? fb.id : "propria";
      }
      if (!refPrompt || refPrompt.length < 40) throw httpError(400, "invalid_request", "Escolha um estilo de referência.");
      // 3) imagem da referência vai junto, para a IA seguir o template de verdade (fontes, layout, elementos)
      let refImg = null;
      if (getRef(principal)) refImg = await refImage(principal, req.headers["x-forwarded-host"] || req.headers.host);
      else if (custom && body.refPath && String(body.refPath).startsWith(ctx.user.id + "/")) {
        const { data: rf } = await ctx.db.storage.from("atelier-assets").download(String(body.refPath));
        if (rf) refImg = { buffer: Buffer.from(await rf.arrayBuffer()), type: rf.type || "image/jpeg" };
      }
      const prompt = buildPostPrompt({ refPrompt, temPessoa, comFoto: !!person, refVisual: !!refImg, ...content });
      out = await generatePost(prompt, [refImg, person]);
      out.meta = { principal: getRef(principal) ? principal : (ref ? ref.id : ""), escuro: art ? !!art.escuro : (getRef(principal) ? getRef(principal).dark : true), prompt: refPrompt };
      folder = "post";
    } else if (kind === "slide") {
      const coverPath = String(body.coverPath || "");
      if (!coverPath.startsWith(ctx.user.id + "/")) throw httpError(403, "invalid_request", "Capa inválida.");
      const { data: file, error } = await ctx.db.storage.from("atelier-assets").download(coverPath);
      if (error || !file) throw httpError(404, "invalid_request", "Não encontramos a capa deste carrossel.");
      const prompt = buildSlidePrompt({
        artPrompt: String(body.artPrompt || "").slice(0, 4000), kind: body.slideKind === "cta" ? "cta" : "interna",
        i: Math.max(1, Math.min(9, +body.index || 1)), n: Math.max(2, Math.min(10, +body.total || 2)),
        titulo: body.titulo, texto: body.texto, itens: body.itens, cta: body.cta,
        nome: body.nome, whatsapp: body.whatsapp, cidade: body.cidade, c1: body.c1, c2: body.c2,
      });
      await checkAndCount(ctx, "image");
      out = await generatePost(prompt, [{ buffer: Buffer.from(await file.arrayBuffer()), type: file.type || "image/jpeg" }]);
      folder = "post";
    } else if (kind === "cutout") {
      const photoPath = String(body.photoPath || "");
      if (!photoPath.startsWith(ctx.user.id + "/")) throw httpError(403, "invalid_request", "Foto inválida.");
      const { data: file, error } = await ctx.db.storage.from("atelier-assets").download(photoPath);
      if (error || !file) throw httpError(404, "invalid_request", "Não encontramos essa foto.");
      await checkAndCount(ctx, "image");
      out = await cutoutPerson(Buffer.from(await file.arrayBuffer()), file.type || "image/jpeg");
      folder = "cut";
    } else {
      throw httpError(400, "invalid_request", "Tipo de imagem desconhecido.");
    }

    const path = `${ctx.user.id}/${folder}/${randomUUID()}.${out.ext}`;
    const { error: upErr } = await ctx.db.storage.from("atelier-assets").upload(path, out.buffer, { contentType: out.contentType, upsert: false });
    if (upErr) throw httpError(500, "storage", "Não foi possível salvar a imagem: " + upErr.message);
    send(res, 200, out.meta ? { path, ...out.meta } : { path });
  } catch (e) { fail(res, e); }
}
