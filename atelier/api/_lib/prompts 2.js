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

/* ---------- Formato e área segura (a imagem sai em 1024x1536 e o app recorta para 1080x1350) ---------- */
const FORMATO = [
  "",
  "FORMATO E ÁREA SEGURA (obrigatório):",
  "- Adapte a composição automaticamente ao formato do post, mantendo todos os elementos visuais proporcionais, bem distribuídos e dentro da área segura.",
  "- O post final do Instagram é 1080x1350 px (4:5). Esta imagem é gerada em 2:3 vertical e depois recortada para 4:5 pelo centro: os 9% de cima e os 9% de baixo da imagem gerada serão CORTADOS. Nessas faixas coloque só a continuação do fundo.",
  "- Todo texto, rosto, logo, ícone e elemento importante fica entre 9% e 80% da altura da imagem gerada, com pelo menos 7% de margem nas laterais. Entre 80% e 91% da altura fica só fundo: ali o app coloca a assinatura do médico com CRM.",
  "- Reorganize textos, imagens, ícones e demais elementos para preencher o espaço de forma equilibrada, sem simplesmente esticar ou cortar a composição original da referência.",
  "- Garanta que nenhum texto ou elemento importante fique cortado, muito próximo das bordas ou fora da área visível. Se faltar espaço, diminua o texto; nunca o empurre para as bordas.",
  "- Preserve a hierarquia visual, alinhamentos, proporções, legibilidade e identidade visual da marca.",
  "- A composição deve parecer criada originalmente para o formato 4:5, e não apenas redimensionada.",
];

/* ---------- Post completo no estilo de uma referência ---------- */
const clean = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n || 200);
const strip = (s) => String(s || "").replace(/\*/g, "");
const highlights = (s) => (String(s || "").match(/\*([^*]+)\*/g) || []).map(x => x.replace(/\*/g, ""));

export function buildPostPrompt({ refPrompt, temPessoa, comFoto, refVisual, tema, especialidade, topo, pre, titulo, apoio, c1, c2 }) {
  const destaques = [...highlights(pre), ...highlights(titulo), ...highlights(apoio)];
  const labels = (Array.isArray(topo) ? topo : []).map(t => `"${clean(strip(t), 30)}"`).join(", ");
  const pessoa = comFoto
    ? "A pessoa da foto do médico (imagem enviada) é o médico desta clínica. Use ESSA pessoa na arte: mantenha rosto, traços, tom de pele, cabelo e idade exatamente iguais (não embeleze nem troque a pessoa). Pode ajustar pose, enquadramento e roupa para seguir a referência, usando roupa profissional (jaleco branco ou social)."
    : (temPessoa
      ? "Não mostre pessoas reconhecíveis. Onde a referência tem uma pessoa, use um objeto simbólico ligado ao tema, mãos ou uma silhueta, mantendo a mesma composição."
      : "Não mostre pessoas reconhecíveis.");
  return [
    refVisual
      ? `A IMAGEM 1 enviada é a REFERÊNCIA DE DESIGN${comFoto ? " e a IMAGEM 2 é a foto do médico desta clínica" : ""}. Crie a arte de um post de Instagram vertical 4:5 que seja uma RECRIAÇÃO FIEL da IMAGEM 1 com o conteúdo desta clínica: mesma composição e grid, mesmas posições e tamanhos de cada bloco de texto, mesmas famílias, pesos, caixa (alta/baixa), espaçamentos e alinhamentos de fonte, mesmos elementos gráficos (linhas, caixas, faixas, setas, bilhetes, rótulos), mesmo fundo, textura, luz, enquadramento e pose. Quem olhar as duas peças lado a lado tem que reconhecer o mesmo template. Mude apenas: os textos (pelos daqui), a pessoa${comFoto ? " (pela da IMAGEM 2)" : ""}, objetos ligados ao assunto e a cor de destaque (pela da marca). Não copie nenhum texto, @, logotipo ou marca da IMAGEM 1, e NUNCA reproduza o rosto ou a identidade da pessoa da IMAGEM 1${comFoto ? "" : " (troque por objeto, mãos ou silhueta ligados ao assunto)"}.`
      : "Crie a arte de um post de Instagram no formato vertical 4:5 seguindo com fidelidade a DIREÇÃO DE ARTE abaixo (cenário, câmera, ângulo, composição, iluminação, texturas, elementos gráficos e tipografia), com o conteúdo desta clínica.",
    "",
    "DIREÇÃO DE ARTE:",
    clean(refPrompt, 6000),
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
    "TIPOGRAFIA (o mais importante — padrão de diretor de arte de agência premium):",
    "- Letras de fonte digital profissional, desenhadas como vetor: bordas perfeitamente nítidas, traço uniforme, nenhuma letra torta, derretida, borrada, deformada ou com espessura irregular. A granulação, o ruído e o desfoque da foto NÃO passam por cima das letras.",
    refVisual ? "- PRIORIDADE: as fontes, pesos, tamanhos e o tratamento de cada texto são os da IMAGEM 1. As regras abaixo valem só para o acabamento." : "",
    "- Título: sans-serif grotesca/geométrica display de alto padrão (no espírito de Neue Haas Grotesk Display Black, Gilroy Heavy ou Inter Display Black), caixa alta, kerning óptico apertado (tracking cerca de -3%), entrelinha bem fechada (cerca de 0,88), linhas com larguras parecidas formando um bloco compacto e equilibrado, ocupando cerca de 80% da largura da arte. Se o estilo de referência pedir outra família (serifada, itálica ou condensada), siga a referência com esse mesmo nível de acabamento. Nada de Arial, Impact, fonte padrão, fonte esticada ou condensada artificialmente.",
    "- Frase de abertura: a MESMA família do título (ou a indicada na referência), peso fino (Light), em caixa baixa, com a palavra de destaque em peso Bold; tamanho cerca de 1/3 da altura das letras do título, alinhada pelo mesmo eixo do título e bem próxima dele.",
    "- Palavras de destaque: mesma fonte e mesmo peso do resto da linha, só trocando a cor para a cor de destaque, cor chapada, sem brilho, sem sombra, sem contorno, sem degradê.",
    "- Rótulos do topo: caixa alta pequena, peso Medium, espaçamento entre letras aberto (cerca de +12%), todos na mesma linha de base e com o mesmo tamanho.",
    "- Hierarquia clara: título dominante, abertura secundária, rótulos discretos. Alinhamento e margens laterais iguais, espaçamentos consistentes, nada encostando nas bordas. Os acentos (É, Ã, Ç, Ó) desenhados corretamente e inteiros.",
    "- O texto deve parecer diagramado no Figma/InDesign por um designer, nítido como impressão de alta resolução, não como texto gerado por IA.",
    "",
    "REGRAS:",
    "- Escreva os textos exatamente como estão acima, em português do Brasil, com todos os acentos corretos. Não acrescente nenhuma outra palavra, número, logotipo, @, assinatura ou marca d'água.",
    ...FORMATO,
    `- ${pessoa}`,
    "- Troque qualquer marca, produto, logotipo ou pessoa da referência por elementos ligados ao assunto de saúde. Nada de sangue, procedimentos invasivos, antes e depois ou promessas de resultado.",
    "- Acabamento de agência de design premium, nítido, profissional."
  ].filter(Boolean).join("\n");
}

export const REF_ANALYSIS_PROMPT = "Use essa imagem como referência e crie um prompt personalizado para que eu possa recriar essa imagem em ferramentas de IA. Descreva os detalhes do cenário, tipo de lente da câmera, posição e ângulo da imagem, detalhes da imagem e características da postagem.\n\n" +
  "Regras: o objetivo é recriar o ESTILO com conteúdo novo. Descreva tipografia (estilo das fontes, pesos, tamanhos relativos, caixa alta/baixa, cores, efeitos como caixas atrás de palavras, sublinhados, contornos), paleta, texturas, iluminação, lente, ângulo, composição e elementos gráficos. " +
  "Não identifique pessoas reais nem descreva traços de rosto específicos: chame a pessoa de 'a pessoa'. Troque marcas e logotipos por descrições genéricas e não copie os textos da referência; descreva apenas onde cada bloco de texto fica e como ele é. " +
  "Responda só com JSON: {\"prompt\":\"o prompt completo em português, organizado em CENÁRIO, CÂMERA, POSIÇÃO E ÂNGULO, DETALHES e POSTAGEM\",\"temPessoa\":true ou false,\"escuro\":true se o fundo predominante for escuro}";

/* ---------- Diretor de arte: a IA escreve um prompt novo para cada post, tirando ideias das referências ---------- */
export function directorPrompt({ catalog, base, recent, comFoto, tema, especialidade, topo, pre, titulo, apoio, c1, c2 }) {
  const cat = catalog.map(r => `[${r.id}] ${r.nome}${r.pessoa ? " (tem pessoa)" : ""}${r.dark ? " (escuro)" : " (claro)"}\n${r.prompt}`).join("\n\n");
  const guia = base
    ? `REFERÊNCIA PRINCIPAL (escolhida pelo médico) — siga a direção de arte dela e, se quiser, empreste UM elemento de outra referência do catálogo:\n${clean(base, 3500)}`
    : `Escolha no catálogo 1 referência PRINCIPAL que combine com o assunto e com o tom deste post, e até 2 referências SECUNDÁRIAS para emprestar elementos (uma textura, um elemento gráfico, um tratamento de foto ou de tipografia).${recent && recent.length ? ` Evite usar como principal as que saíram nos últimos posts: ${recent.join(", ")}.` : ""}${comFoto ? " O médico enviou uma foto dele: prefira referências com pessoa, onde ele será o protagonista." : " Não há foto do médico: prefira referências sem pessoa ou troque a pessoa por objetos, mãos ou cena ligada ao assunto."}`;
  return [
    "Você é diretor de arte de uma agência premium de marketing médico no Brasil. Escreva um prompt NOVO e exclusivo para uma ferramenta de geração de imagem (gpt-image) criar a arte de um post de Instagram 4:5.",
    "A imagem da referência PRINCIPAL vai junto para a ferramenta de imagem, que vai recriar o mesmo template. Por isso o seu prompt deve MANTER a composição, o grid, a tipografia (famílias, pesos, tamanhos, caixa), os elementos gráficos, o fundo, a luz e a pose da referência principal exatamente como estão descritos no catálogo, e adaptar só o conteúdo: textos, objetos e cenário ligados ao assunto e à especialidade. Descreva a tipografia de cada bloco com precisão, copiando a descrição da referência principal. Das secundárias, empreste no máximo um detalhe que não mude o layout.",
    "",
    "CONTEÚDO DO POST:",
    `- Especialidade: ${clean(especialidade, 60) || "saúde"}`,
    `- Assunto: ${clean(tema, 200)}`,
    (Array.isArray(topo) && topo.length) ? `- Rótulos do topo: ${topo.map(t => `"${clean(strip(t), 30)}"`).join(", ")}` : "",
    pre ? `- Frase de abertura: "${clean(pre, 90)}" (palavras entre * são destaque)` : "",
    `- Título: "${clean(titulo, 100)}" (palavras entre * são destaque)`,
    apoio ? `- Frase de apoio: "${clean(apoio, 160)}"` : "",
    `- Cores da marca: destaque ${clean(c1, 9)}, secundária ${clean(c2, 9)}`,
    `- Foto do médico: ${comFoto ? "sim (a pessoa da imagem enviada será usada)" : "não"}`,
    "",
    guia,
    "",
    "COMO ESCREVER O PROMPT (em português, bem detalhado, nesta ordem):",
    "CENÁRIO: ambiente, fundo, objetos e elementos ligados ao assunto. CÂMERA: tipo de lente, abertura, luz, granulação. POSIÇÃO E ÂNGULO: enquadramento, onde fica a pessoa ou o objeto principal, altura da câmera, pose. DETALHES: texturas, elementos gráficos, paleta usando as cores da marca. POSTAGEM: onde fica cada bloco de texto (rótulos, abertura, título, apoio), alinhamento, tamanhos relativos, família e peso das fontes, caixa alta/baixa, como as palavras de destaque são tratadas (cor, caixa atrás, sublinhado, itálico).",
    "Regras: não invente outros textos além dos do conteúdo; respeite a área segura: a imagem é gerada em 2:3 e recortada para 4:5 (1080x1350), então todo o conteúdo fica entre 9% e 80% da altura e com 7% de margem nas laterais; acima e abaixo disso só fundo (embaixo entra a assinatura com CRM); nada de marcas, logotipos ou pessoas reais; nada de sangue, procedimentos invasivos, antes e depois, promessa de resultado ou sensacionalismo (regras do CFM). Se houver foto do médico, ele é a única pessoa da arte, com roupa profissional.",
    "",
    "CATÁLOGO DE REFERÊNCIAS DE MERCADO:",
    cat,
    "",
    'Responda só com JSON: {"prompt":"o prompt completo","principal":"id da referência principal (ou \"propria\")","secundarias":["ids"],"pessoa":true se a arte mostra uma pessoa,"escuro":true se o fundo predominante for escuro}'
  ].filter(x => x !== "").join("\n");
}

/* ---------- Lâminas do carrossel: mesmo design system da capa (a capa vai junto como imagem de referência) ---------- */
export function buildSlidePrompt({ artPrompt, kind, i, n, titulo, texto, itens, cta, nome, whatsapp, cidade, c1, c2 }) {
  const lista = (Array.isArray(itens) ? itens : []).slice(0, 4).map(x => `"${clean(strip(x && x.rotulo), 40)}: ${clean(strip(x && x.texto), 110)}"`);
  const hl = [...highlights(titulo), ...highlights(texto)];
  const conteudo = kind === "cta" ? [
    `- Esta é a ÚLTIMA lâmina (${i + 1} de ${n}): chamada para ação.`,
    `- Frase pequena: "Ficou com alguma dúvida?"`,
    `- Chamada principal (grande): "${clean(strip(cta) || "Agende sua consulta", 50)}"`,
    `- Botão ou faixa de destaque com: "${whatsapp ? "WhatsApp " + clean(whatsapp, 30) : "Fale com a nossa equipe"}"`,
    `- Linha discreta: "${[clean(nome, 50), clean(cidade, 40)].filter(Boolean).join(" · ")}"`,
  ] : [
    `- Esta é a lâmina ${i + 1} de ${n} de um carrossel educativo.`,
    `- Número da lâmina como elemento gráfico grande, no mesmo estilo da capa: "${String(i).padStart(2, "0")}"`,
    `- Título: "${clean(strip(titulo), 110)}"`,
    texto ? `- Texto: "${clean(strip(texto), 320)}"` : "",
    lista.length ? `- Itens (lista com marcadores no estilo da capa): ${lista.join("; ")}` : "",
    hl.length ? `- Palavras de destaque (na cor de destaque): ${hl.map(h => `"${clean(h, 40)}"`).join(", ")}` : "",
  ];
  return [
    `A imagem enviada é a CAPA de um carrossel de Instagram. Crie a lâmina ${i + 1} de ${n} do MESMO carrossel, no formato vertical 4:5.`,
    "Ela tem que parecer feita pelo mesmo designer, no mesmo dia: mesmo fundo e textura, mesma paleta, mesmas famílias e pesos de fonte, mesmo tratamento das palavras de destaque (caixas, sublinhados, cores), mesmos elementos gráficos (bilhetes, setas, linhas, rótulos), mesmas margens e grid. Quem passar o carrossel tem que sentir uma peça única.",
    "Lâmina interna é mais limpa que a capa: texto bem legível, hierarquia clara, bastante respiro. Não repita os textos da capa. A pessoa da capa NÃO precisa aparecer; se aparecer, que seja pequena ou recortada na borda, sem competir com o texto.",
    "",
    "DIREÇÃO DE ARTE DA CAPA (para manter o mesmo estilo):",
    clean(artPrompt, 2500) || "(siga a capa enviada)",
    "",
    "CONTEÚDO DESTA LÂMINA (use exatamente estes textos):",
    ...conteudo,
    `- Cor de destaque da marca: ${clean(c1, 9)}. Cor secundária: ${clean(c2, 9)}.`,
    "",
    "TIPOGRAFIA: letras de fonte digital profissional, nítidas como vetor, kerning e entrelinha cuidadosos, sem letras tortas ou borradas, acentos corretos. Texto corrido em tamanho confortável de leitura no celular (nunca minúsculo). A granulação do fundo não passa por cima das letras.",
    "",
    "REGRAS:",
    "- Escreva os textos exatamente como estão acima, em português do Brasil. Não acrescente nenhuma outra palavra, número de página, logotipo, @, assinatura ou marca d'água.",
    ...FORMATO,
    "- Nada de sangue, procedimentos invasivos, antes e depois ou promessa de resultado.",
  ].filter(x => x !== "").join("\n");
}
