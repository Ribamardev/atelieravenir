// Utilidades compartilhadas pelas funções da API (rodam só no servidor).
import { createClient } from "@supabase/supabase-js";

export const env = (k, d = "") => (process.env[k] ?? d).toString().trim();

/** Cliente do Supabase agindo COMO o usuário logado (respeita as regras RLS). */
export function userClient(token) {
  const url = env("SUPABASE_URL"), key = env("SUPABASE_ANON_KEY");
  if (!url || !key) throw httpError(500, "config", "SUPABASE_URL ou SUPABASE_ANON_KEY não configurados.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function httpError(status, code, message) {
  const e = new Error(message); e.status = status; e.code = code; return e;
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function fail(res, err) {
  const status = err.status || 500;
  if (status >= 500) console.error("[atelier]", err.code || "", err.message);
  send(res, status, { error: { code: err.code || "upstream_error", message: err.message || "Erro inesperado." } });
}

/** Lê o token "Authorization: Bearer ..." e devolve { user, db } (db = Supabase como o usuário). */
export async function requireUser(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) throw httpError(401, "session_expired", "Faça login novamente.");
  const db = userClient(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) throw httpError(401, "session_expired", "Sua sessão expirou. Faça login novamente.");
  const { data: member } = await db.from("atelier_members").select("ativo").eq("email", (data.user.email || "").toLowerCase()).maybeSingle();
  if (!member || !member.ativo) throw httpError(403, "not_member", "Seu acesso ao Atelier não está liberado. Fale com a Avenir.");
  return { user: data.user, db };
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = []; for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
}

/* ---------- Limites mensais ---------- */
const monthKey = () => new Date().toISOString().slice(0, 7); // ex.: 2026-10

export async function getUsage(ctx) {
  const { data } = await ctx.db.from("atelier_usage").select("text_calls,image_calls").eq("user_id", ctx.user.id).eq("month", monthKey()).maybeSingle();
  return {
    month: monthKey(),
    text: data?.text_calls || 0, image: data?.image_calls || 0,
    textLimit: Number(env("MONTHLY_TEXT_LIMIT", "400")) || 400,
    imageLimit: Number(env("MONTHLY_IMAGE_LIMIT", "60")) || 60,
  };
}

/** Confere o limite do mês e soma 1 uso (função segura no banco: só soma, nunca diminui). */
export async function checkAndCount(ctx, kind) {
  const u = await getUsage(ctx);
  if (kind === "text" && u.text >= u.textLimit) throw httpError(429, "limit_reached", "Você chegou ao limite de textos deste mês.");
  if (kind === "image" && u.image >= u.imageLimit) throw httpError(429, "limit_reached", "Você chegou ao limite de imagens deste mês.");
  const { error } = await ctx.db.rpc("atelier_count_usage", { p_kind: kind, p_month: u.month });
  if (error) throw httpError(500, "config", "Banco sem a função atelier_count_usage. Rode o arquivo supabase/schema.sql. (" + error.message + ")");
  return u;
}

/* ---------- JSON tolerante (a IA às vezes escreve algo antes/depois) ---------- */
export function parseJsonLoose(text) {
  const t = String(text || "").trim();
  try { return JSON.parse(t); } catch {}
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const a = t.search(/[\[{]/), b = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch {} }
  throw httpError(502, "invalid_json", "A resposta da IA veio incompleta.");
}
