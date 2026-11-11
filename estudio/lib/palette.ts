"use client";
// Extrai as cores dominantes de uma imagem (logo) no navegador.

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
    img.src = url;
  });
}

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

function dist(a: number[], b: number[]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/** Até `max` cores, ignorando transparência e fundo branco quase puro. */
export async function extractPalette(url: string, max = 6): Promise<string[]> {
  const img = await loadImage(url);
  const size = 120;
  const scale = Math.min(1, size / Math.max(img.naturalWidth || size, img.naturalHeight || size));
  const w = Math.max(1, Math.round((img.naturalWidth || size) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || size) * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Agrupa em "baldes" de 16 níveis por canal e soma as médias
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  let opaque = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 128) continue;
    opaque++;
    if (r > 245 && g > 245 && b > 245) continue; // fundo branco
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bk = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    bk.n++;
    bk.r += r;
    bk.g += g;
    bk.b += b;
    buckets.set(key, bk);
  }
  const minShare = Math.max(3, opaque * 0.01);
  const sorted = [...buckets.values()]
    .filter((b) => b.n >= minShare)
    .sort((a, b) => b.n - a.n)
    .map((b) => [b.r / b.n, b.g / b.n, b.b / b.n]);

  // Junta tons muito parecidos (antialiasing do logo)
  const picked: number[][] = [];
  for (const col of sorted) {
    if (picked.every((p) => dist(p, col) > 48)) picked.push(col);
    if (picked.length >= max) break;
  }
  return picked.map((p) => toHex(p[0], p[1], p[2]));
}
