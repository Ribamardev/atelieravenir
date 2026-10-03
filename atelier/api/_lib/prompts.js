// Prompts de imagem por estilo. Ficam no servidor para ninguém usar a chave para outra coisa.
// Regra de ouro: a IA cria SÓ o visual. Todo texto da arte é desenhado pelo app.

const BASE = (p) =>
  `Imagem para post de Instagram de uma clínica médica de ${p.especialidade || "saúde"} no Brasil, sobre o tema: "${p.tema}". ` +
  `IMPORTANTE: a imagem não pode ter nenhum texto, letra, número, logotipo, marca d'água, placa ou interface. ` +
  `Sem pessoas reconhecíveis, sem pacientes, sem sangue, sem procedimentos invasivos, sem antes e depois. ` +
  `Estética de agência de design premium, fotografia realista, acabamento editorial, leve granulação de filme. `;

const STYLES = {
  impacto: (p) =>
    `Fotografia de estúdio escura e dramática: fundo grafite quase preto, luz de recorte suave vinda de cima. ` +
    `Um único objeto simbólico ligado ao tema (por exemplo um instrumento médico, um modelo anatômico estilizado ou um objeto do dia a dia que represente o assunto) ` +
    `posicionado no terço superior, bem iluminado. A metade de baixo deve ficar escura e vazia, para receber texto.`,
  estudio: (p) =>
    `Cenário de estúdio minimalista em tons de cinza, com um spot de luz central e sombra suave no chão. ` +
    `Um único objeto 3D realista e simbólico do tema, apoiado no chão no terço inferior, ocupando cerca de 40% da largura. ` +
    `Metade superior limpa e vazia para um título. Composição centralizada, sensação de campanha publicitária.`,
  marca: (p) =>
    `Fotografia em preto e branco, alto contraste, bem granulada, estilo fotojornalismo editorial. ` +
    `Uma cena ou objeto relacionado ao tema, com bastante área escura e vazia no lado esquerdo e embaixo para texto.`,
  faixa: (p) =>
    `Fotografia panorâmica em preto e branco, alto contraste, granulada, estilo editorial de revista. ` +
    `Cena ou objetos ligados ao tema, enquadramento horizontal, assunto bem distribuído na largura.`,
};

export function backgroundPrompt(p) {
  const style = STYLES[p.tpl];
  if (!style) return null;
  return BASE(p) + style(p);
}
export function backgroundSize(tpl) { return tpl === "faixa" ? "1536x1024" : "1024x1536"; }
export const STYLES_WITH_AI_BG = Object.keys(STYLES);

/* ---------- Post completo no estilo de uma referência ---------- */
const clean = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n || 200);
const strip = (s) => String(s || "").replace(/\*/g, "");
const highlights = (s) => (String(s || "").match(/\*([^*]+)\*/g) || []).map(x => x.replace(/\*/g, ""));

export function buildPostPrompt({ refPrompt, temPessoa, comFoto, tema, especialidade, topo, pre, titulo, apoio, c1, c2 }) {
  const destaques = [...highlights(pre), ...highlights(titulo), ...highlights(apoio)];
  const labels = (Array.isArray(topo) ? topo : []).map(t => `"${clean(strip(t), 30)}"`).join(", ");
  const pessoa = comFoto
    ? "A pessoa da imagem enviada é o médico desta clínica. Use ESSA pessoa na arte: mantenha rosto, traços, tom de pele, cabelo e idade exatamente iguais (não embeleze nem troque a pessoa). Pode ajustar pose, enquadramento e roupa para seguir a referência, usando roupa profissional (jaleco branco ou social)."
    : (temPessoa
      ? "Não mostre pessoas reconhecíveis. Onde a referência tem uma pessoa, use um objeto simbólico ligado ao tema, mãos ou uma silhueta, mantendo a mesma composição."
      : "Não mostre pessoas reconhecíveis.");
  return [
    "Crie a arte de um post de Instagram no formato vertical 4:5, recriando com fidelidade o ESTILO VISUAL descrito abaixo (tipografia, cores, composição, iluminação, texturas e elementos gráficos), mas com o conteúdo novo desta clínica.",
    "",
    "ESTILO DE REFERÊNCIA:",
    clean(refPrompt, 3500),
    "",
    "CONTEÚDO DESTA ARTE (use exatamente estes textos):",
    `- Assunto: ${clean(tema, 160)} — clínica de ${clean(especialidade, 60) || "saúde"}.`,
    labels ? `- Rótulos pequenos do topo: ${labels}` : "",
    pre ? `- Frase de abertura: "${clean(strip(pre), 80)}"` : "",
    `- Título principal: "${clean(strip(titulo), 90)}"`,
    destaques.length ? `- Palavras de destaque (na cor de destaque, em caixa ou mais pesadas): ${destaques.map(d => `"${clean(d, 40)}"`).join(", ")}` : "",
    apoio ? `- Frase de apoio: "${clean(strip(apoio), 160)}"` : "",
    `- Cor de destaque da marca: ${clean(c1, 9)}. Cor secundária: ${clean(c2, 9)}. Use a cor de destaque onde a referência usa a cor forte.`,
    "",
    "REGRAS:",
    "- Escreva os textos exatamente como estão acima, em português do Brasil, com todos os acentos corretos. Não acrescente nenhuma outra palavra, número, logotipo, @, assinatura ou marca d'água.",
    "- Deixe a faixa de baixo da arte (cerca de 9% da altura) limpa, só com o fundo: o app coloca ali a assinatura do médico. Mantenha os textos e o rosto longe das bordas, com margem segura.",
    `- ${pessoa}`,
    "- Troque qualquer marca, produto, logotipo ou pessoa da referência por elementos ligados ao assunto de saúde. Nada de sangue, procedimentos invasivos, antes e depois ou promessas de resultado.",
    "- Acabamento de agência de design premium, nítido, profissional."
  ].filter(Boolean).join("\n");
}

export const REF_ANALYSIS_PROMPT = "Use essa imagem como referência e crie um prompt personalizado para que eu possa recriar essa imagem em ferramentas de IA. Descreva os detalhes do cenário, tipo de lente da câmera, posição e ângulo da imagem, detalhes da imagem e características da postagem.\n\n" +
  "Regras: o objetivo é recriar o ESTILO com conteúdo novo. Descreva tipografia (estilo das fontes, pesos, tamanhos relativos, caixa alta/baixa, cores, efeitos como caixas atrás de palavras, sublinhados, contornos), paleta, texturas, iluminação, lente, ângulo, composição e elementos gráficos. " +
  "Não identifique pessoas reais nem descreva traços de rosto específicos: chame a pessoa de 'a pessoa'. Troque marcas e logotipos por descrições genéricas e não copie os textos da referência; descreva apenas onde cada bloco de texto fica e como ele é. " +
  "Responda só com JSON: {\"prompt\":\"o prompt completo em português, organizado em CENÁRIO, CÂMERA, POSIÇÃO E ÂNGULO, DETALHES e POSTAGEM\",\"temPessoa\":true ou false,\"escuro\":true se o fundo predominante for escuro}";
