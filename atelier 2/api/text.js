// POST /api/text  { prompt, tier: "quick" | "default" }  ->  { data }
// Gera os textos (ideias, linha de conteúdo, post) e devolve o JSON já interpretado.
import { requireUser, readJson, send, fail, httpError, checkAndCount } from "./_lib/core.js";
import { generateJson } from "./_lib/text.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") throw httpError(405, "invalid_request", "Use POST.");
    const ctx = await requireUser(req);
    const { prompt, tier } = await readJson(req);
    if (typeof prompt !== "string" || prompt.length < 20) throw httpError(400, "invalid_request", "Pedido vazio.");
    if (prompt.length > 20000) throw httpError(400, "prompt_too_large", "Pedido grande demais.");
    await checkAndCount(ctx, "text");
    const { data } = await generateJson(prompt, tier === "quick" ? "quick" : "default");
    send(res, 200, { data });
  } catch (e) { fail(res, e); }
}
