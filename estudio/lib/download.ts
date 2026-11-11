"use client";
import { loadImage } from "./palette";

// Recorta no navegador (centro, tipo "cover") e baixa no tamanho exato do Instagram,
// com a opção de aplicar o logo do cliente — em posição fixa ou automática.
export const SIZES = {
  feed: { w: 1080, h: 1350, label: "Feed 1080×1350" },
  story: { w: 1080, h: 1920, label: "Stories 1080×1920" },
} as const;
export type Fmt = keyof typeof SIZES;

export type FixedPos = "bottom-right" | "bottom-left" | "bottom-center" | "top-left" | "top-right" | "top-center";
export type LogoPos = "none" | "auto" | FixedPos;

export const FIXED_POSITIONS: FixedPos[] = ["bottom-right", "bottom-left", "bottom-center", "top-right", "top-left", "top-center"];

export const LOGO_POS_LABEL: Record<LogoPos, string> = {
  none: "Sem logo",
  auto: "Logo automático (lugar mais limpo)",
  "bottom-right": "Logo embaixo à direita",
  "bottom-left": "Logo embaixo à esquerda",
  "bottom-center": "Logo embaixo no centro",
  "top-left": "Logo em cima à esquerda",
  "top-right": "Logo em cima à direita",
  "top-center": "Logo em cima no centro",
};

/** Desenha a imagem recortada no tamanho final. */
async function renderBase(url: string, format: Fmt, scaleDown = 1) {
  const w = Math.round(SIZES[format].w * scaleDown);
  const h = Math.round(SIZES[format].h * scaleDown);
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob);
  const s = Math.max(w / bmp.width, h / bmp.height);
  const sw = w / s;
  const sh = h / s;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

/** Retângulo do logo, respeitando margens (Stories: fora das áreas da interface do Instagram). */
export function logoRect(format: Fmt, w: number, h: number, lw: number, lh: number, pos: FixedPos) {
  const margin = Math.round(w * 0.06);
  const top = format === "story" ? Math.round(h * 0.14) : margin;
  const bottom = format === "story" ? Math.round(h * 0.2) : margin;
  const x = pos.endsWith("left") ? margin : pos.endsWith("right") ? w - margin - lw : Math.round((w - lw) / 2);
  const y = pos.startsWith("top") ? top : h - bottom - lh;
  return { x, y, lw, lh };
}

const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Luminância média das partes visíveis do logo (0–255). */
const logoLumCache = new Map<string, { lum: number; ratio: number }>();
async function logoInfo(url: string) {
  const key = url.split("?")[0];
  if (logoLumCache.has(key)) return logoLumCache.get(key)!;
  const img = await loadImage(url);
  const ratio = (img.naturalHeight || 1) / (img.naturalWidth || 1);
  const c = document.createElement("canvas");
  c.width = 80;
  c.height = Math.max(1, Math.round(80 * ratio));
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    sum += lum(d[i], d[i + 1], d[i + 2]);
    n++;
  }
  const info = { lum: n ? sum / n : 128, ratio };
  logoLumCache.set(key, info);
  return info;
}

/** Mede uma região: luminância média e "poluição" (variação entre pixels vizinhos). */
function regionStats(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const pad = Math.round(w * 0.12);
  const rx = Math.max(0, x - pad);
  const ry = Math.max(0, y - pad);
  const rw = Math.min(ctx.canvas.width - rx, w + pad * 2);
  const rh = Math.min(ctx.canvas.height - ry, h + pad * 2);
  const d = ctx.getImageData(rx, ry, rw, rh).data;
  let sum = 0;
  let grad = 0;
  let n = 0;
  for (let j = 0; j < rh; j += 2) {
    for (let i = 0; i < rw; i += 2) {
      const k = (j * rw + i) * 4;
      const L = lum(d[k], d[k + 1], d[k + 2]);
      sum += L;
      if (i + 2 < rw) {
        const k2 = k + 8;
        grad += Math.abs(L - lum(d[k2], d[k2 + 1], d[k2 + 2]));
      }
      if (j + 2 < rh) {
        const k3 = k + rw * 8;
        grad += Math.abs(L - lum(d[k3], d[k3 + 1], d[k3 + 2]));
      }
      n++;
    }
  }
  return { mean: sum / n, busy: grad / n };
}

/**
 * Escolhe o lugar mais limpo e com melhor contraste para o logo,
 * e a versão do logo (entre as do cliente) que mais se destaca ali.
 */
export async function autoPlace(url: string, format: Fmt, logoUrls: string[], widthPct: number) {
  const scale = 0.3; // análise em resolução reduzida (rápido)
  const { ctx, w, h } = await renderBase(url, format, scale);
  const infos = await Promise.all(logoUrls.map(async (u) => ({ url: u, ...(await logoInfo(u)) })));
  let best = { pos: "bottom-right" as FixedPos, logoUrl: logoUrls[0], score: Infinity };
  for (const logo of infos) {
    const lw = Math.round(w * (widthPct / 100));
    const lh = Math.round(lw * logo.ratio);
    for (const pos of FIXED_POSITIONS) {
      const r = logoRect(format, w, h, lw, lh, pos);
      const st = regionStats(ctx, r.x, r.y, r.lw, r.lh);
      const contrast = Math.abs(st.mean - logo.lum); // 0–255
      // Menor é melhor: fundo poluído pesa muito; contraste baixo também.
      const score = st.busy * 3 - contrast;
      if (score < best.score) best = { pos, logoUrl: logo.url, score };
    }
  }
  return { pos: best.pos, logoUrl: best.logoUrl };
}

export async function downloadCropped(
  url: string,
  format: Fmt,
  filename: string,
  logo?: { url: string; pos: FixedPos; widthPct: number }
) {
  const { canvas, ctx, w, h } = await renderBase(url, format);
  if (logo) {
    const img = await loadImage(logo.url);
    const lw = Math.round(w * (logo.widthPct / 100));
    const lh = Math.round(lw * ((img.naturalHeight || 1) / (img.naturalWidth || 1)));
    const r = logoRect(format, w, h, lw, lh, logo.pos);
    ctx.drawImage(img, r.x, r.y, r.lw, r.lh);
  }
  // JPEG gerado do canvas sai sem metadados (EXIF/C2PA) da origem
  const out: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(out);
  a.download = filename.endsWith(".jpg") ? filename : `${filename}.jpg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
