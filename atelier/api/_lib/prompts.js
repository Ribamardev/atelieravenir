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
