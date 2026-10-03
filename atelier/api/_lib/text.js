// Textos: OpenAI ou Anthropic (Claude), escolhido por variável de ambiente.
import { env, httpError, parseJsonLoose } from "./core.js";

export function textProvider() {
  const p = env("TEXT_PROVIDER").toLowerCase();
  if (p === "openai" || p === "anthropic") return p;
  return env("ANTHROPIC_API_KEY") ? "anthropic" : "openai";
}

const SYSTEM = "Você é o motor de conteúdo do Atelier, um app de social media para médicos e clínicas no Brasil. Responda sempre e somente com JSON válido, sem texto antes ou depois.";

export async function generateJson(prompt, tier = "default") {
  const provider = textProvider();
  const fast = tier === "quick";
  const text = provider === "anthropic" ? await anthropic(prompt, fast) : await openai(prompt, fast);
  return { data: parseJsonLoose(text), provider };
}

async function anthropic(prompt, fast) {
  const key = env("ANTHROPIC_API_KEY");
  if (!key) throw httpError(500, "config", "ANTHROPIC_API_KEY não configurada.");
  const model = fast ? env("ANTHROPIC_MODEL_FAST", "claude-haiku-4-5-20251001") : env("ANTHROPIC_MODEL", "claude-sonnet-5-5");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 4000, system: SYSTEM, messages: [{ role: "user", content: prompt }] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw upstream(r.status, j?.error?.message || "Erro na Anthropic.");
  return (j.content || []).filter(c => c.type === "text").map(c => c.text).join("");
}

async function openai(prompt, fast) {
  const key = env("OPENAI_API_KEY");
  if (!key) throw httpError(500, "config", "OPENAI_API_KEY não configurada.");
  const model = fast ? env("OPENAI_TEXT_MODEL_FAST", "gpt-6-luna") : env("OPENAI_TEXT_MODEL", "gpt-6.1-sol");
  const call = async (jsonMode) => fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  let r = await call(true);
  if (r.status === 400) r = await call(false); // modelo sem modo JSON: tenta de novo sem ele
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw upstream(r.status, j?.error?.message || "Erro na OpenAI.");
  return j.choices?.[0]?.message?.content || "";
}

function upstream(status, message) {
  if (status === 401 || status === 403) return httpError(500, "config", "Chave de API inválida ou sem permissão: " + message);
  if (status === 429) return httpError(429, "rate_limited", "A IA está recebendo muitos pedidos. Tente em instantes.");
  return httpError(502, "upstream_error", message);
}

/** Lê uma imagem (referência) e devolve JSON a partir do pedido. Usa OpenAI se houver chave, senão Anthropic. */
export async function describeImage(buffer, mime, instruction) {
  const b64 = Buffer.from(buffer).toString("base64");
  const type = /png|webp|gif/.test(mime || "") ? mime : "image/jpeg";
  if (env("OPENAI_API_KEY")) {
    const model = env("OPENAI_VISION_MODEL") || env("OPENAI_TEXT_MODEL", "gpt-6.1-sol");
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env("OPENAI_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: [
        { type: "text", text: instruction },
        { type: "image_url", image_url: { url: `data:${type};base64,${b64}` } }
      ] }] }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw upstream(r.status, j?.error?.message || "Erro na OpenAI.");
    return parseJsonLoose(j.choices?.[0]?.message?.content || "");
  }
  const key = env("ANTHROPIC_API_KEY");
  if (!key) throw httpError(500, "config", "Nenhuma chave de IA configurada.");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: env("ANTHROPIC_MODEL", "claude-sonnet-5-5"), max_tokens: 3000, system: SYSTEM, messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: type, data: b64 } },
      { type: "text", text: instruction }
    ] }] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw upstream(r.status, j?.error?.message || "Erro na Anthropic.");
  return parseJsonLoose((j.content || []).filter(c => c.type === "text").map(c => c.text).join(""));
}
