// "Diretor de arte": analisa as referências + identidade do cliente e escreve um prompt por peça.
import type { Client, PlannedPiece } from "./types";

function buildSystem(withText: boolean, isHealth: boolean) {
  return `Você é o diretor de arte da Avenir, agência de marketing. Sua tarefa: transformar briefing + referências em prompts para gerar ${
    withText ? "ARTES FINAIS de Instagram (imagem + textos já diagramados)" : "IMAGENS BASE de Instagram (sem texto)"
  } num modelo de imagem.

FIDELIDADE AO BRIEFING (regra mais importante):
- Se o briefing listar peças (ex.: "1. Abertura", "2. ..."), crie EXATAMENTE essas peças, na mesma ordem e quantidade, ignorando as contagens de Feed/Stories informadas. Mantenha a cena descrita sem trocar elementos, sem inventar outra ideia.
- Textos pedidos (entre aspas, ou após "Texto:", "Texto da arte:", "Headline:", "CTA:") são copiados LITERALMENTE, palavra por palavra, com a mesma pontuação e acentuação em português. Nunca traduza, resuma, corrija ou acrescente texto.
- Se o briefing não listar peças, use as contagens informadas e varie as peças entre si.

REFERÊNCIAS:
- As referências mostram o padrão de design desejado: layout/grid, hierarquia tipográfica, formas gráficas, uso de cor, tratamento de foto, enquadramento. Reproduza ESSA linguagem visual na peça nova.
- Nunca copie logos, nomes de marca, textos, telas de produto ou pessoas identificáveis das referências: a peça é do cliente informado.
${
  withText
    ? `ARTE COM TEXTO:
- Escreva no prompt cada texto entre aspas duplas exatamente como deve aparecer, dizendo o papel (headline, apoio, selo/CTA) e a posição (ex.: "headline at top-left, bold sans-serif, white").
- Hierarquia clara: no máximo 1 headline + 1 linha de apoio + 1 selo/CTA curto.
- NÃO adicione setas, botões, ícones, selos, "swipe", números de página ou elementos gráficos que não estejam no briefing — mesmo que apareçam nas referências. Diga isso no prompt ("no arrows, no buttons, no icons"). Tipografia sem serifa, legível, coerente com a tipografia da marca; cores da paleta HEX.
- Peça um texto nítido e sem erros: "render the Portuguese text exactly as written, correct accents, no extra words, no misspellings".
- LOGO: não desenhe nenhum logo (o logo real é aplicado depois pelo sistema, na posição informada). Nessa posição deixe uma área de FUNDO LISO E ESCURO OU CLARO UNIFORME (cor sólida da paleta, sem foto, sem objeto, sem textura, sem texto), com ~30% da largura da arte, e diga isso no prompt (ex.: "keep the bottom-right corner (about 30% of the width) as an empty flat solid dark green area, no objects, no text — reserved for the logo"). Componha a foto e os textos para não invadirem essa área.
- Stories 9:16: textos e logo fora dos 14% de cima e 20% de baixo. Feed: margens seguras de ~6%.`
    : `IMAGEM BASE:
- SEM texto, letras, números, logos ou marca d'água. Reserve espaço negativo limpo para o texto que entra depois.
- Stories 9:16: deixar ~15% do topo e ~20% da base livres. Feed: espaço limpo num lado ou no terço superior.
- Se houver posição do logo, deixe também essa área com fundo liso.`
}
${
  isHealth
    ? `- Publicidade em saúde (CFM/CFO): sem antes e depois, sem promessa de resultado, sem sangue ou procedimento invasivo, sem imagem chocante; ambientes clínicos realistas e EPI coerente.`
    : ""
}
FOTOGRAFIA REALISTA (sempre que houver pessoas ou ambientes):
- O objetivo é parecer FOTO REAL de fotógrafo, não imagem de IA. Direção de fotografia documental/editorial: momento espontâneo e verdadeiro, não posado.
- Poucas pessoas em foco: no máximo 1 ou 2 protagonistas nítidos; se houver mais gente, fora de foco no fundo. Nunca cenas lotadas com vários rostos nítidos.
- Pessoas comuns brasileiras, com idades, tipos físicos e tons de pele variados e naturais; roupas do dia a dia da profissão. Nada de modelos perfeitos, músculos exagerados ou sorrisos de banco de imagem.
- Câmera e luz reais: "shot on a full-frame camera, 35mm or 50mm lens at f/2, natural window light or practical lights, slight natural grain, true-to-life colors, realistic white balance".
- Textura real: "visible skin pores and fine lines, natural skin tones, subtle imperfections, real hair strands, natural hand poses with correct fingers, real fabric wrinkles".
- Sempre inclua no fim do prompt: "Avoid AI look: no plastic or waxy skin, no airbrushed faces, no HDR, no over-sharpening, no glossy CGI, no oversaturated teal-orange grading, no symmetrical faces, no duplicated people, no extra fingers".
- FOTO REAL DO CLIENTE: se uma imagem for marcada como FOTO REAL e estiver nos reference_ids da peça, ela É a fotografia da arte. Diga no prompt: "Use image N as the photograph exactly as provided — do not redraw, retouch or replace the people or the scene; only crop/mask it into the layout". Use cada foto real em no máximo uma peça, a não ser que haja mais peças que fotos.
- Respeite a paleta e as regras do cliente.

NUMERAÇÃO DAS IMAGENS: o modelo recebe, para cada peça, SÓ as imagens dos reference_ids daquela peça, na ordem em que você as listar. Então no prompt "image 1" = primeiro id da lista daquela peça, "image 2" = segundo, etc. Se houver foto real, coloque-a PRIMEIRO na lista.

FORMATO DO PROMPT (em INGLÊS, exceto os textos da arte que ficam em português entre aspas), um parágrafo denso nesta ordem: papel de cada referência ("Use image 1 for layout and graphic shapes, image 2 for typography style..." — só se o modelo recebe imagens; se não recebe, descreva o estilo delas), cena/assunto, composição e câmera, luz, paleta HEX, ${withText ? "textos com posição e estilo, área do logo," : ""} mood (3 adjetivos), formato, restrições.

Responda SOMENTE com JSON válido, sem markdown:
{"pieces":[{"format":"feed"|"story","title":"título curto em português","summary_pt":"resumo da peça em 1 frase em português${withText ? ", citando os textos" : ""}","prompt":"prompt","reference_ids":["ids das imagens usadas nesta peça, foto real primeiro"]}]}`;
}

export type DirectorInput = {
  client: Client;
  refs: { id: string; url: string; notes: string | null }[];
  photos?: { id: string; url: string; name: string | null }[];
  brief: string;
  logoUrl?: string | null;
  manualUrl?: string | null;
  feedCount: number;
  storyCount: number;
  modelSeesImages: boolean;
  withText: boolean;
  logoArea?: string;
};

const isHealthClient = (c: Client) =>
  /sa[uú]de|hospital|cl[ií]nic|m[eé]dic|odonto|dent|laborat|psic|fisio|nutri|est[eé]tic/i.test(`${c.segment || ""} ${c.brand_notes || ""}`);

function userText(i: DirectorInput) {
  const refList = i.refs
    .map((r, n) => `Imagem ${n + 1} → id ${r.id}${r.notes ? ` (aproveitar: ${r.notes})` : ""}`)
    .join("\n");
  return `Cliente: ${i.client.name}${i.client.segment ? ` (${i.client.segment})` : ""}
Paleta da marca: ${i.client.palette?.length ? i.client.palette.join(", ") : "não definida"}
Tipografia da marca: ${i.client.fonts || "-"}
Sobre a marca: ${i.client.brand_notes || "-"}
Nunca usar: ${i.client.rules || "-"}

Briefing: ${i.brief}

Peças (se o briefing não listar as suas): ${i.feedCount} de Feed (4:5) e ${i.storyCount} de Stories (9:16).
Modo: ${i.withText ? "ARTE FINAL COM TEXTO" : "IMAGEM BASE SEM TEXTO"}.
Posição do logo (reservar área lisa): ${!i.logoArea || i.logoArea === "none" ? "sem logo" : i.logoArea}.
Modelo de imagem ${i.modelSeesImages ? "RECEBE as referências como imagem; diga no prompt o papel de cada uma (image 1, image 2...)." : "NÃO recebe as referências (só texto); descreva o estilo delas no prompt."}

Referências de estilo anexadas, na ordem:
${refList || "(nenhuma)"}${i.photos?.length ? `
Depois delas vêm as FOTOS REAIS do cliente (usar como a fotografia da arte, sem redesenhar):
${i.photos.map((p, n) => `Foto real ${n + 1} → id ${p.id}${p.name ? ` (${p.name})` : ""}`).join("\n")}` : ""}${i.logoUrl ? `
Depois das referências vem o LOGO da marca: use só para entender cores e personalidade visual. Nunca desenhe o logo na imagem: ele é aplicado depois pelo sistema. Não inclua o logo em reference_ids.` : ""}${i.manualUrl ? `
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
  (i.photos || []).forEach((p) => content.push({ type: "image", source: { type: "url", url: p.url } }));
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
      system: buildSystem(i.withText, isHealthClient(i.client)),
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
  const content: any[] = [...i.refs, ...(i.photos || [])].map((r) => ({ type: "image_url", image_url: { url: r.url } }));
  if (i.logoUrl && !/\.svg(\?|$)/i.test(i.logoUrl)) content.push({ type: "image_url", image_url: { url: i.logoUrl } });
  content.push({ type: "text", text: userText({ ...i, manualUrl: null }) });
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystem(i.withText, isHealthClient(i.client)) },
        { role: "user", content },
      ],
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${body?.error?.message || JSON.stringify(body)}`);
  return parse(body.choices?.[0]?.message?.content || "");
}
