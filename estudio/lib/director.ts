// "Diretor de arte": analisa as referências + identidade do cliente e escreve um prompt por peça.
import type { Client, PlannedPiece } from "./types";

const SYSTEM = `Você é o diretor de arte da Avenir, agência de marketing focada em saúde (hospitais, clínicas, médicos, odontologia).
Sua tarefa: transformar referências visuais + briefing em prompts para gerar IMAGENS BASE de Instagram no Higgsfield.

Regras de criação:
- A referência é inspiração de direção de arte (luz, composição, paleta, câmera, clima), nunca cópia. A imagem nova deve ser claramente outra foto.
- Nunca reproduzir pessoa identificável, logo, marca ou texto das referências.
- Imagem base: SEM texto, letras, números, logos ou marca d'água. O texto entra depois, fora da IA.
- Stories (9:16): deixar ~15% do topo e ~20% da base sem elementos importantes; assunto no terço central.
- Feed (4:5): reservar espaço negativo limpo (um lado ou terço superior) para o título.
- Publicidade em saúde (CFM/CFO): sem antes e depois, sem promessa de resultado, sem sangue ou procedimento invasivo explícito, sem imagem chocante. Ambientes clínicos realistas e limpos, jaleco/pijama cirúrgico e EPI coerentes, equipamentos plausíveis. Pacientes genéricos com diversidade natural.
- Fotorrealista, mãos e anatomia naturais.
- Respeitar a paleta HEX e as regras do cliente.

Formato do prompt (em INGLÊS, um parágrafo denso), nesta ordem: referências (o papel de cada imagem, se houver), assunto, cenário, câmera (plano, lente, ângulo, profundidade de campo), luz, paleta, mood (3 adjetivos), formato e área livre, restrições ("Photorealistic. No text, no letters, no logos, no watermark. Natural hands and anatomy.").
Quando o modelo NÃO recebe as imagens de referência (modo só texto), descreva em detalhe o estilo visual extraído delas dentro do próprio prompt.

Varie as peças entre si (ângulo, cenário, assunto) para não ficarem repetidas.

Responda SOMENTE com JSON válido, sem markdown, no formato:
{"pieces":[{"format":"feed"|"story","title":"título curto em português","summary_pt":"resumo da cena em 1 frase em português","prompt":"prompt em inglês","reference_ids":["ids das referências usadas nesta peça"]}]}`;

export type DirectorInput = {
  client: Client;
  refs: { id: string; url: string; notes: string | null }[];
  brief: string;
  logoUrl?: string | null;
  manualUrl?: string | null;
  feedCount: number;
  storyCount: number;
  modelSeesImages: boolean;
};

function userText(i: DirectorInput) {
  const refList = i.refs
    .map((r, n) => `Imagem ${n + 1} → id ${r.id}${r.notes ? ` (aproveitar: ${r.notes})` : ""}`)
    .join("\n");
  return `Cliente: ${i.client.name}${i.client.segment ? ` (${i.client.segment})` : ""}
Paleta da marca: ${i.client.palette?.length ? i.client.palette.join(", ") : "não definida"}
Tipografia: ${i.client.fonts || "-"} (só contexto de estilo; as imagens continuam sem texto)
Sobre a marca: ${i.client.brand_notes || "-"}
Nunca usar: ${i.client.rules || "-"}

Briefing: ${i.brief}

Peças: ${i.feedCount} de Feed (4:5) e ${i.storyCount} de Stories (9:16).
Modelo de imagem ${i.modelSeesImages ? "RECEBE as referências como imagem; diga no prompt o papel de cada uma (image 1, image 2...)." : "NÃO recebe as referências (só texto); descreva o estilo delas no prompt."}

Referências anexadas, na ordem:
${refList || "(nenhuma)"}${i.logoUrl ? `
Depois das referências vem o LOGO da marca: use só para entender cores e personalidade visual. Nunca desenhe, cite ou reproduza o logo na imagem (ele é aplicado depois). Não inclua o logo em reference_ids.` : ""}${i.manualUrl ? `
O MANUAL DE MARCA do cliente está anexado (PDF). Siga as diretrizes de fotografia, cor e estilo dele quando houver.` : ""}`;
}

function parse(text: string): PlannedPiece[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("O diretor de arte não devolveu JSON.");
  const data = JSON.parse(text.slice(start, end + 1));
  const pieces = (data.pieces || []) as PlannedPiece[];
  return pieces
    .filter((p) => p && p.prompt && (p.format === "feed" || p.format === "story"))
    .map((p) => ({ ...p, reference_ids: Array.isArray(p.reference_ids) ? p.reference_ids : [] }));
}

export async function planPieces(i: DirectorInput): Promise<PlannedPiece[]> {
  if (process.env.ANTHROPIC_API_KEY) return viaAnthropic(i);
  if (process.env.OPENAI_API_KEY) return viaOpenAI(i);
  throw new Error("Configure ANTHROPIC_API_KEY ou OPENAI_API_KEY para o diretor de arte.");
}

async function viaAnthropic(i: DirectorInput) {
  const content: any[] = [];
  if (i.manualUrl) content.push({ type: "document", source: { type: "url", url: i.manualUrl }, title: "Manual de marca" });
  i.refs.forEach((r) => content.push({ type: "image", source: { type: "url", url: r.url } }));
  if (i.logoUrl) content.push({ type: "image", source: { type: "url", url: i.logoUrl } });
  content.push({ type: "text", text: userText(i) });
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 6000,
      system: SYSTEM,
      messages: [{ role: "user", content }],
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${body?.error?.message || JSON.stringify(body)}`);
  const text = (body.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
  return parse(text);
}

async function viaOpenAI(i: DirectorInput) {
  if (!process.env.OPENAI_MODEL) throw new Error("Defina OPENAI_MODEL (ex.: o modelo que você usa no Atelier).");
  // OpenAI: manual em PDF não vai por URL; segue logo + referências
  const content: any[] = i.refs.map((r) => ({ type: "image_url", image_url: { url: r.url } }));
  if (i.logoUrl && !/\.svg(\?|$)/i.test(i.logoUrl)) content.push({ type: "image_url", image_url: { url: i.logoUrl } });
  content.push({ type: "text", text: userText({ ...i, manualUrl: null }) });
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content },
      ],
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${body?.error?.message || JSON.stringify(body)}`);
  return parse(body.choices?.[0]?.message?.content || "");
}
