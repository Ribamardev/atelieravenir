// POST /api/refprompt { imagePath } -> { prompt, temPessoa, escuro }
// Lê uma imagem de referência enviada pelo cliente e cria o prompt de recriação
// (o mesmo pedido que funciona no ChatGPT: cenário, lente, posição/ângulo, detalhes e características da postagem).
import { requireUser, readJson, send, fail, httpError, checkAndCount } from "./_lib/core.js";
import { describeImage } from "./_lib/text.js";
import { REF_ANALYSIS_PROMPT } from "./_lib/prompts.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") throw httpError(405, "invalid_request", "Use POST.");
    const ctx = await requireUser(req);
    const { imagePath } = await readJson(req);
    const path = String(imagePath || "");
    if (!path.startsWith(ctx.user.id + "/")) throw httpError(403, "invalid_request", "Imagem inválida.");
    const { data: file, error } = await ctx.db.storage.from("atelier-assets").download(path);
    if (error || !file) throw httpError(404, "invalid_request", "Não encontramos essa imagem.");
    await checkAndCount(ctx, "text");
    const r = await describeImage(Buffer.from(await file.arrayBuffer()), file.type, REF_ANALYSIS_PROMPT);
    const prompt = String(r && r.prompt || "").trim();
    if (prompt.length < 60) throw httpError(502, "invalid_json", "A IA não conseguiu descrever essa referência. Tente outra imagem.");
    send(res, 200, { prompt: prompt.slice(0, 4000), temPessoa: !!r.temPessoa, escuro: !!r.escuro });
  } catch (e) { fail(res, e); }
}
