// POST /api/image
// { kind: "background", tpl, tema, especialidade }  -> cria o fundo do post (sem texto)
// { kind: "cutout", photoPath }                      -> recorta a pessoa da foto (PNG transparente)
// Resposta: { path } — caminho do arquivo no Storage do Supabase (bucket "assets")
import { requireUser, readJson, send, fail, httpError, checkAndCount } from "./_lib/core.js";
import { generateBackground, cutoutPerson } from "./_lib/image.js";
import { backgroundPrompt, backgroundSize } from "./_lib/prompts.js";
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
