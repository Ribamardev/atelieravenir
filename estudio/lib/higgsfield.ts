// Cliente da API do Higgsfield (docs.higgsfield.ai)
// Fluxo: (1) sobe referências via URL pré-assinada, (2) envia a geração, (3) consulta o status até terminar.
import type { Model } from "./types";

const BASE = "https://api.higgsfield.ai";

function authHeader() {
  // Aceita a chave única copiada do console (já no formato "ID:SECRET") ou as duas partes separadas.
  const single = process.env.HIGGSFIELD_API_KEY?.trim().replace(/^Key\s+/i, "");
  if (single) return `Key ${single}`;
  const id = process.env.HIGGSFIELD_API_KEY_ID;
  const secret = process.env.HIGGSFIELD_API_KEY_SECRET;
  if (!id || !secret) throw new Error("Chave do Higgsfield não configurada (HIGGSFIELD_API_KEY).");
  return `Key ${id}:${secret}`;
}

async function hf(path: string, init: RequestInit = {}) {
  const res = await fetch(path.startsWith("http") ? path : `${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const msg = body?.detail || body?.error || body?.message || text || res.statusText;
    throw new Error(`Higgsfield ${res.status}: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
  }
  return body;
}

/** Sobe um arquivo (bytes) e devolve a public_url para usar na geração. */
export async function uploadToHiggsfield(bytes: ArrayBuffer, contentType: string): Promise<string> {
  const up = await hf("/files/generate-upload-url", {
    method: "POST",
    body: JSON.stringify({ content_type: contentType }),
  });
  // Importante: nunca enviar credenciais do Higgsfield para a URL pré-assinada.
  const put = await fetch(up.upload_url, {
    method: "PUT",
    headers: { ...(up.upload_headers || { "Content-Type": contentType }) },
    body: bytes,
  });
  if (!put.ok) throw new Error(`Falha ao enviar referência ao Higgsfield (${put.status}).`);
  return up.public_url as string;
}

/** Escolhe a proporção: usa a pedida se o modelo aceitar; Feed cai para 3:4 (recorte 4:5 no download). */
export function pickAspect(model: Model, format: "feed" | "story"): string {
  const list = model.aspect_ratios?.length ? model.aspect_ratios : ["9:16", "4:5", "3:4", "1:1"];
  if (format === "story") return list.includes("9:16") ? "9:16" : list.includes("2:3") ? "2:3" : list[0];
  for (const a of ["4:5", "3:4", "2:3", "1:1"]) if (list.includes(a)) return a;
  return list[0];
}

export async function submitGeneration(opts: {
  model: Model;
  prompt: string;
  aspect: string;
  imageUrls: string[];
  numImages: number;
  idempotencyKey: string;
}) {
  const { model, prompt, aspect, imageUrls, numImages, idempotencyKey } = opts;
  const body: Record<string, unknown> = { ...(model.extra || {}), prompt, aspect_ratio: aspect };
  if (model.num_images_field && numImages > 1) body[model.num_images_field] = numImages;
  if (model.image_field && imageUrls.length) {
    body[model.image_field] = model.image_field_is_list ? imageUrls : imageUrls[0];
  }
  const path = model.path.startsWith("/") ? model.path : `/${model.path}`;
  return hf(path, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  }) as Promise<{ status: string; request_id: string; status_url?: string }>;
}

export async function getStatus(requestId: string) {
  return hf(`/requests/${encodeURIComponent(requestId)}/status`) as Promise<{
    status: string;
    request_id: string;
    images?: { url: string }[];
    error?: string;
  }>;
}
