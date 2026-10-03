// Imagens: OpenAI (gpt-image). Duas operações:
//  - background: cria o fundo/cena do post, SEM texto (o texto é colocado pelo app, com as fontes certas)
//  - cutout: recorta a pessoa da foto do médico com fundo transparente (feito 1 vez por foto)
import { env, httpError } from "./core.js";

const OPENAI = "https://api.openai.com/v1";

function key() {
  const k = env("OPENAI_API_KEY");
  if (!k) throw httpError(500, "config", "OPENAI_API_KEY não configurada.");
  return k;
}
const model = () => env("OPENAI_IMAGE_MODEL", "gpt-image-2");
const quality = () => env("OPENAI_IMAGE_QUALITY", "medium");

export async function generateBackground(prompt, size = "1024x1536") {
  const r = await fetch(`${OPENAI}/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "content-type": "application/json" },
    body: JSON.stringify({ model: model(), prompt, size, quality: quality(), n: 1, output_format: "jpeg" }),
  });
  return { buffer: await unpack(r), contentType: "image/jpeg", ext: "jpg" };
}

export async function cutoutPerson(photoBuffer, photoType = "image/jpeg") {
  const form = new FormData();
  form.append("model", model());
  form.append("image[]", new Blob([photoBuffer], { type: photoType }), "foto." + (photoType.includes("png") ? "png" : "jpg"));
  form.append("prompt", CUTOUT_PROMPT);
  form.append("background", "transparent");
  form.append("output_format", "png");
  form.append("size", "1024x1536");
  form.append("quality", quality());
  form.append("input_fidelity", "high");
  const r = await fetch(`${OPENAI}/images/edits`, { method: "POST", headers: { Authorization: `Bearer ${key()}` }, body: form });
  return { buffer: await unpack(r), contentType: "image/png", ext: "png" };
}

/** Post completo: com foto do médico usa "edits" (a pessoa entra na arte); sem foto usa "generations". */
export async function generatePost(prompt, person) {
  if (person && person.buffer) {
    const form = new FormData();
    form.append("model", model());
    form.append("image[]", new Blob([person.buffer], { type: person.type || "image/png" }), "medico." + ((person.type || "").includes("png") ? "png" : "jpg"));
    form.append("prompt", prompt);
    form.append("size", "1024x1536");
    form.append("quality", quality());
    form.append("output_format", "jpeg");
    form.append("input_fidelity", "high");
    const r = await fetch(`${OPENAI}/images/edits`, { method: "POST", headers: { Authorization: `Bearer ${key()}` }, body: form });
    return { buffer: await unpack(r), contentType: "image/jpeg", ext: "jpg" };
  }
  return generateBackground(prompt, "1024x1536");
}

const CUTOUT_PROMPT = "Remova completamente o fundo desta foto e deixe somente a pessoa, com fundo 100% transparente. " +
  "Mantenha o rosto, a expressão, o cabelo, a pele, as roupas e as cores exatamente como estão, sem embelezar nem mudar traços. " +
  "Contorno limpo e natural no cabelo. Enquadramento do topo da cabeça até a cintura, pessoa centralizada, sem cortar a cabeça. " +
  "Não adicione nenhum texto, sombra, moldura ou objeto.";

async function unpack(r) {
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = j?.error?.message || "Erro ao gerar imagem na OpenAI.";
    if (r.status === 401 || r.status === 403) throw httpError(500, "config", "Chave da OpenAI inválida ou sem acesso ao modelo de imagem: " + msg);
    if (r.status === 429) throw httpError(429, "rate_limited", "A OpenAI está recebendo muitos pedidos. Tente em instantes.");
    if (r.status === 400 && /safety|policy|moderation/i.test(msg)) throw httpError(422, "refused", "A IA de imagem recusou este tema. Tente outro.");
    throw httpError(502, "upstream_error", msg);
  }
  const b64 = j?.data?.[0]?.b64_json;
  if (!b64) throw httpError(502, "upstream_error", "A OpenAI não devolveu a imagem.");
  return Buffer.from(b64, "base64");
}
