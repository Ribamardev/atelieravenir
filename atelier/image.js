// POST /api/image
// { kind: "background", tpl, tema, especialidade }  -> cria o fundo do post (sem texto)
// { kind: "cutout", photoPath }                      -> recorta a pessoa da foto (PNG transparente)
// { kind: "post", refId | refPrompt, temPessoa, photoPath?, tema, especialidade, topo, pre, titulo, apoio, c1, c2 }
//                                                    -> arte completa no estilo de uma referência (com o médico, se houver foto)
// Resposta: { path } — caminho do arquivo no Storage do Supabase (bucket "atelier-assets")
import { requireUser, readJson, send, fail, httpError, checkAndCount } from "./_lib/core.js";
import { generateBackground, cutoutPerson, generatePost } from "./_lib/image.js";
import { backgroundPrompt, backgroundSize, buildPostPrompt } from "./_lib/prompts.js";
import { getRef } from "./_lib/refs.js";
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
      const ref = body.refId ? getRef(String(body.refId)) : null;
      const refPrompt = ref ? ref.prompt : String(body.refPrompt || "").slice(0, 4000);
      if (!refPrompt || refPrompt.length < 40) throw httpError(400, "invalid_request", "Escolha um estilo de referência.");
      if (!String(body.titulo || "").trim()) throw httpError(400, "invalid_request", "O post precisa de um título.");
      let person = null;
      const photoPath = String(body.photoPath || "");
      if (photoPath) {
        if (!photoPath.startsWith(ctx.user.id + "/")) throw httpError(403, "invalid_request", "Foto inválida.");
        const { data: file } = await ctx.db.storage.from("atelier-assets").download(photoPath);
        if (file) person = { buffer: Buffer.from(await file.arrayBuffer()), type: file.type || (photoPath.endsWith(".png") ? "image/png" : "image/jpeg") };
      }
      const prompt = buildPostPrompt({
        refPrompt, temPessoa: ref ? ref.pessoa : !!body.temPessoa, comFoto: !!person,
        tema: body.tema, especialidade: body.especialidade, topo: body.topo,
        pre: body.pre, titulo: body.titulo, apoio: body.apoio, c1: body.c1, c2: body.c2,
      });
      await checkAndCount(ctx, "image");
      out = await generatePost(prompt, person);
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
    send(res, 200, { path });
  } catch (e) { fail(res, e); }
}
