"use client";
import { loadImage } from "./palette";

// Recorta no navegador (centro, tipo "cover") e baixa no tamanho exato do Instagram,
// com a opção de aplicar o logo do cliente.
export const SIZES = {
  feed: { w: 1080, h: 1350, label: "Feed 1080×1350" },
  story: { w: 1080, h: 1920, label: "Stories 1080×1920" },
} as const;

export type LogoPos = "none" | "bottom-right" | "bottom-left" | "bottom-center" | "top-left" | "top-right";

export const LOGO_POS_LABEL: Record<LogoPos, string> = {
  none: "Sem logo",
  "bottom-right": "Logo embaixo à direita",
  "bottom-left": "Logo embaixo à esquerda",
  "bottom-center": "Logo embaixo no centro",
  "top-left": "Logo em cima à esquerda",
  "top-right": "Logo em cima à direita",
};

export async function downloadCropped(
  url: string,
  format: keyof typeof SIZES,
  filename: string,
  logo?: { url: string; pos: LogoPos; widthPct: number }
) {
  const { w, h } = SIZES[format];
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob);
  const scale = Math.max(w / bmp.width, h / bmp.height);
  const sw = w / scale;
  const sh = h / scale;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, w, h);

  if (logo && logo.pos !== "none") {
    const img = await loadImage(logo.url);
    const lw = Math.round(w * (logo.widthPct / 100));
    const ratio = (img.naturalHeight || 1) / (img.naturalWidth || 1);
    const lh = Math.round(lw * ratio);
    const margin = Math.round(w * 0.06);
    // Stories: respeita as áreas da interface do Instagram (topo ~14%, base ~20%)
    const top = format === "story" ? Math.round(h * 0.14) : margin;
    const bottom = format === "story" ? Math.round(h * 0.2) : margin;
    const x = logo.pos.endsWith("left") ? margin : logo.pos.endsWith("right") ? w - margin - lw : (w - lw) / 2;
    const y = logo.pos.startsWith("top") ? top : h - bottom - lh;
    ctx.drawImage(img, x, y, lw, lh);
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
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
