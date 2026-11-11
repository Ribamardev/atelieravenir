"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { sb, signedUrls } from "@/lib/supabase-browser";
import { autoPlace, downloadCropped, slug, LOGO_POS_LABEL, type FixedPos, type LogoPos } from "@/lib/download";
import { useJobPolling, statusClass, statusLabel } from "./jobs";
import type { Format } from "@/lib/types";

type Area = { x: number; y: number; w: number; h: number }; // % da imagem

type Row = {
  id: string;
  job_id: string;
  storage_path: string;
  review: "pending" | "approved" | "rejected";
  feedback: string | null;
  created_at: string;
  sm_jobs: { format: Format; title: string | null; summary_pt: string | null; prompt: string; model_id: string; reference_ids: string[] } | null;
};

export default function Gallery({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [open, setOpen] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logos, setLogos] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    // Todas as versões do logo (principal primeiro): o modo automático escolhe a que mais se destaca
    sb()
      .from("sm_brand_assets")
      .select("storage_path, is_primary, name")
      .eq("client_id", clientId)
      .eq("kind", "logo")
      .order("is_primary", { ascending: false })
      .then(async ({ data }) => {
        const list = data || [];
        const u = await signedUrls(list.map((d) => d.storage_path));
        setLogos(list.filter((d) => u[d.storage_path]).map((d) => ({ url: u[d.storage_path], name: d.name || "logo" })));
      });
  }, [clientId]);

  const load = useCallback(async () => {
    const { data, error } = await sb()
      .from("sm_images")
      .select("*, sm_jobs(format,title,summary_pt,prompt,model_id,reference_ids)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return setError(error.message);
    setRows((data as Row[]) || []);
    setUrls(await signedUrls((data || []).map((r: any) => r.storage_path)));
  }, [clientId]);

  const { jobs, track } = useJobPolling(load);

  useEffect(() => {
    load();
    // Retoma peças que ficaram em andamento (ex.: a tela de geração foi fechada antes de terminar)
    sb()
      .from("sm_jobs")
      .select("*")
      .eq("client_id", clientId)
      .in("status", ["queued", "in_progress"])
      .not("hf_request_id", "is", null)
      .then(({ data }) => {
        if (data?.length) track(data as any);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, clientId]);

  async function setReview(r: Row, review: Row["review"], feedback?: string) {
    await sb().from("sm_images").update({ review, feedback: feedback ?? r.feedback }).eq("id", r.id);
    setRows((cur) => cur.map((x) => (x.id === r.id ? { ...x, review, feedback: feedback ?? x.feedback } : x)));
    setOpen((o) => (o && o.id === r.id ? { ...o, review, feedback: feedback ?? o.feedback } : o));
  }

  async function redo(r: Row, extra: string, override?: Record<string, unknown>) {
    if (!r.sm_jobs) return;
    setError(null);
    // Peça que já veio de uma edição: o prompt dela é uma instrução de edição e não serve para gerar do zero.
    // Nesses casos refazemos a partir da própria imagem.
    if (/^(Edit the provided image|Re-render this exact design)/.test(r.sm_jobs.prompt)) {
      return edit(r, extra.trim() || "Generate a new variation of this same design", null, override ? "enhance" : "edit");
    }
    const prompt = extra.trim()
      ? `${r.sm_jobs.prompt} MANDATORY CHANGES (these override anything above): ${extra.trim()}`
      : r.sm_jobs.prompt;
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientId,
        modelId: r.sm_jobs.model_id,
        numImages: 1,
        override,
        pieces: [{ ...r.sm_jobs, title: `${r.sm_jobs.title || "Peça"} ${override ? "(final em alta)" : "(refeita)"}`, prompt }],
      }),
    });
    const body = await res.json();
    if (!res.ok) return setError(body.error);
    track(body.jobs);
    setOpen(null);
  }

  async function edit(r: Row, instruction: string, area: Area | null, mode: "edit" | "enhance" = "edit") {
    setError(null);
    const res = await fetch("/api/edit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageId: r.id, instruction, area, mode }),
    });
    const body = await res.json();
    if (!res.ok) return setError(body.error);
    track([body.job]);
    setOpen(null);
  }

  async function remove(r: Row) {
    if (!confirm("Apagar esta imagem?")) return;
    await sb().storage.from("sm-media").remove([r.storage_path]);
    await sb().from("sm_images").delete().eq("id", r.id);
    setOpen(null);
    load();
  }

  const [downloading, setDownloading] = useState<string | null>(null);

  // Download rápido: formato da peça, logo automático (lugar mais limpo + versão de maior contraste)
  async function quickDownload(r: Row) {
    const url = urls[r.storage_path];
    if (!url) return;
    const fmt = (r.sm_jobs?.format || "feed") as "feed" | "story";
    let logo;
    if (logos.length) {
      const best = await autoPlace(url, fmt, logos.map((l) => l.url), 18);
      logo = { url: best.logoUrl, pos: best.pos, widthPct: 18 };
    }
    const name = `${slug(clientName)}-${slug(r.sm_jobs?.title || "peca")}-${r.id.slice(0, 6)}-${fmt}`;
    await downloadCropped(url, fmt, name, logo);
  }

  async function downloadMany(list: Row[]) {
    for (const r of list) {
      setDownloading(r.id);
      try {
        await quickDownload(r);
      } catch (e: any) {
        setError(`Não foi possível baixar "${r.sm_jobs?.title}": ${e.message || e}`);
      }
      await new Promise((res) => setTimeout(res, 600)); // o navegador aceita downloads em sequência
    }
    setDownloading(null);
  }

  const shown = rows.filter((r) => filter === "all" || r.review === filter);
  const approved = rows.filter((r) => r.review === "approved");
  const running = jobs.filter((j) => !["completed", "failed", "nsfw", "canceled"].includes(j.status));

  return (
    <div className="stack">
      {error && <div className="err">{error}</div>}
      <div className="row between">
        <div className="row">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button key={f} className={filter === f ? "small" : "ghost small"} onClick={() => setFilter(f)}>
              {{ all: "Todas", pending: "A revisar", approved: "Aprovadas", rejected: "Reprovadas" }[f]}
            </button>
          ))}
        </div>
        <div className="row">
          {running.length > 0 && <span className="pill warn">{running.length} em andamento…</span>}
          <button className="small" disabled={!approved.length || !!downloading} onClick={() => downloadMany(approved)}>
            {downloading ? "Baixando…" : `↓ Baixar aprovadas (${approved.length})`}
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="empty">Nenhuma imagem aqui ainda.</div>
      ) : (
        <div className="grid g4">
          {shown.map((r) => (
            <div key={r.id} className={`thumb ${r.sm_jobs?.format === "story" ? "story" : ""}`} onClick={() => setOpen(r)} style={{ cursor: "pointer" }}>
              {urls[r.storage_path] && <img src={urls[r.storage_path]} alt={r.sm_jobs?.title || ""} />}
              <span className="tag">{r.sm_jobs?.format === "story" ? "Stories" : "Feed"}</span>
              <button
                className="small"
                title="Baixar no tamanho do Instagram, com o logo"
                disabled={!!downloading}
                onClick={(e) => {
                  e.stopPropagation();
                  downloadMany([r]);
                }}
                style={{ position: "absolute", top: 8, right: 8, padding: "5px 9px", fontSize: 12 }}
              >
                {downloading === r.id ? "…" : "↓ Baixar"}
              </button>
              <div className="meta">
                <div className="row between">
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                    {r.sm_jobs?.title || "Sem título"}
                  </span>
                  <span className={r.review === "approved" ? "pill ok" : r.review === "rejected" ? "pill bad" : "pill"}>
                    {{ pending: "revisar", approved: "ok", rejected: "não" }[r.review]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <div className="card stack" style={{ gap: 6 }}>
          {jobs.map((j) => (
            <div key={j.id} className="row between">
              <span>{j.title}</span>
              <span className={statusClass(j.status)}>{statusLabel(j.status)}</span>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Detail
          row={open}
          url={urls[open.storage_path]}
          logos={logos}
          clientName={clientName}
          onClose={() => setOpen(null)}
          onReview={setReview}
          onRedo={redo}
          onRemove={remove}
          onEdit={edit}
        />
      )}
    </div>
  );
}

function Detail({
  row,
  url,
  logos,
  clientName,
  onClose,
  onReview,
  onRedo,
  onRemove,
  onEdit,
}: {
  row: Row;
  url?: string;
  logos: { url: string; name: string }[];
  clientName: string;
  onClose: () => void;
  onReview: (r: Row, review: Row["review"], feedback?: string) => void;
  onRedo: (r: Row, extra: string, override?: Record<string, unknown>) => Promise<void>;
  onRemove: (r: Row) => void;
  onEdit: (r: Row, instruction: string, area: Area | null, mode?: "edit" | "enhance") => Promise<void>;
}) {
  const [fb, setFb] = useState(row.feedback || "");
  const [marking, setMarking] = useState(false);
  const [area, setArea] = useState<Area | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  function pct(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
    };
  }
  const [busy, setBusy] = useState(false);
  const hasLogo = logos.length > 0;
  const [pos, setPos] = useState<LogoPos>(hasLogo ? "auto" : "none");
  const [logoPick, setLogoPick] = useState<string>("auto"); // "auto" ou a URL de uma versão
  const [logoSize, setLogoSize] = useState(18);
  const [dl, setDl] = useState(false);
  const [resolved, setResolved] = useState<{ pos: FixedPos; logoUrl: string } | null>(null);
  const fmtJob = (row.sm_jobs?.format || "feed") as "feed" | "story";

  // Resolve posição/versão para um formato (automático analisa a imagem)
  async function resolve(format: "feed" | "story") {
    if (!url || !hasLogo || pos === "none") return null;
    const candidates = logoPick === "auto" ? logos.map((l) => l.url) : [logoPick];
    if (pos === "auto") return autoPlace(url, format, candidates, logoSize);
    if (candidates.length === 1) return { pos: pos as FixedPos, logoUrl: candidates[0] };
    const best = await autoPlace(url, format, candidates, logoSize); // escolhe só a versão
    return { pos: pos as FixedPos, logoUrl: best.logoUrl };
  }

  useEffect(() => {
    let alive = true;
    resolve(fmtJob).then((r) => alive && setResolved(r)).catch(() => alive && setResolved(null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, pos, logoPick, logoSize, logos.length]);

  const logo = resolved ? { url: resolved.logoUrl, pos: resolved.pos, widthPct: logoSize } : undefined;
  async function download(format: "feed" | "story") {
    if (!url) return;
    setDl(true);
    try {
      const r = format === fmtJob ? resolved : await resolve(format);
      const l = r ? { url: r.logoUrl, pos: r.pos, widthPct: logoSize } : undefined;
      await downloadCropped(url, format, `${name}-${format}${l ? "-logo" : ""}`, l);
    } catch (e: any) {
      alert("Não foi possível baixar: " + (e.message || e));
    }
    setDl(false);
  }
  const fmt = row.sm_jobs?.format || "feed";
  const name = `${slug(clientName)}-${slug(row.sm_jobs?.title || "peca")}-${row.id.slice(0, 6)}`;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
    >
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 980, width: "100%", maxHeight: "92vh", overflow: "auto" }}>
        <div className="grid g2" style={{ alignItems: "start" }}>
          <div
            className={`thumb ${fmt === "story" ? "story" : ""}`}
            style={{ cursor: marking ? "crosshair" : "default", touchAction: marking ? "none" : "auto", userSelect: "none" }}
            onDragStart={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              if (!marking) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              const p = pct(e);
              dragStart.current = p;
              setArea({ x: p.x, y: p.y, w: 0, h: 0 });
            }}
            onPointerMove={(e) => {
              if (!marking || !dragStart.current) return;
              const p = pct(e);
              const s0 = dragStart.current;
              setArea({ x: Math.min(s0.x, p.x), y: Math.min(s0.y, p.y), w: Math.abs(p.x - s0.x), h: Math.abs(p.y - s0.y) });
            }}
            onPointerUp={() => {
              if (!marking) return;
              dragStart.current = null;
              setMarking(false);
              setArea((a) => (a && a.w > 1 && a.h > 1 ? a : null));
            }}
          >
            {area && (
              <div
                style={{
                  position: "absolute",
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  width: `${area.w}%`,
                  height: `${area.h}%`,
                  border: "2px dashed #ff4d4f",
                  background: "rgba(255,77,79,.15)",
                  zIndex: 3,
                  pointerEvents: "none",
                }}
              />
            )}
            {url && <img src={url} alt="" />}
            {logo && (
              <img
                src={logo.url}
                alt="logo"
                style={{
                  position: "absolute",
                  width: `${logo.widthPct}%`,
                  height: "auto",
                  aspectRatio: "auto",
                  objectFit: "contain",
                  left: logo.pos.endsWith("left") ? "6%" : logo.pos.endsWith("center") ? `${(100 - logo.widthPct) / 2}%` : undefined,
                  right: logo.pos.endsWith("right") ? "6%" : undefined,
                  top: logo.pos.startsWith("top") ? (fmt === "story" ? "14%" : "4.8%") : undefined,
                  bottom: logo.pos.startsWith("bottom") ? (fmt === "story" ? "20%" : "4.8%") : undefined,
                }}
              />
            )}
          </div>
          <div className="stack">
            <div className="row between">
              <h2 style={{ margin: 0 }}>{row.sm_jobs?.title}</h2>
              <button className="ghost small" onClick={onClose}>Fechar</button>
            </div>
            {row.sm_jobs?.summary_pt && <div style={{ color: "var(--muted)" }}>{row.sm_jobs.summary_pt}</div>}
            <div className="row">
              <button className={row.review === "approved" ? "" : "ghost"} onClick={() => onReview(row, "approved", fb)}>✓ Aprovar</button>
              <button className={row.review === "rejected" ? "danger" : "ghost"} onClick={() => onReview(row, "rejected", fb)}>✕ Reprovar</button>
            </div>
            <div className="card stack" style={{ background: "var(--panel-2)", padding: 12, gap: 10 }}>
              <strong style={{ fontSize: 14 }}>Baixar</strong>
              {hasLogo ? (
                <div className="row">
                  <select value={pos} onChange={(e) => setPos(e.target.value as LogoPos)} style={{ width: 260 }}>
                    {(Object.keys(LOGO_POS_LABEL) as LogoPos[]).map((k) => (
                      <option key={k} value={k}>{LOGO_POS_LABEL[k]}</option>
                    ))}
                  </select>
                  {pos !== "none" && logos.length > 1 && (
                    <select value={logoPick} onChange={(e) => setLogoPick(e.target.value)} style={{ width: 200 }}>
                      <option value="auto">Versão: melhor contraste</option>
                      {logos.map((l) => (
                        <option key={l.url} value={l.url}>{l.name}</option>
                      ))}
                    </select>
                  )}
                  {pos !== "none" && (
                    <label className="row" style={{ margin: 0, gap: 6 }}>
                      Tamanho
                      <input type="range" min={10} max={45} value={logoSize} onChange={(e) => setLogoSize(+e.target.value)} style={{ width: 110 }} />
                      <span className="mono">{logoSize}%</span>
                    </label>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Suba o logo do cliente em Identidade visual para aplicar no download.</div>
              )}
              {hasLogo && pos !== "none" && logos.length === 1 && (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Dica: suba também uma versão clara e uma escura do logo — o automático escolhe a que aparece melhor em cada imagem.
                </div>
              )}
              <div className="row">
                <button className="ghost small" disabled={!url || dl} onClick={() => download("feed")}>↓ Feed 1080×1350</button>
                <button className="ghost small" disabled={!url || dl} onClick={() => download("story")}>↓ Stories 1080×1920</button>
                {url && (
                  <a className="btn ghost small" href={url} target="_blank" rel="noreferrer" style={{ padding: "6px 10px", fontSize: 13 }}>
                    Original
                  </a>
                )}
              </div>
            </div>
            <div>
              <label>O que mudar nesta peça</label>
              <textarea
                value={fb}
                onChange={(e) => setFb(e.target.value)}
                placeholder="Ex.: remover a seta branca com fundo laranja. Ou: trocar o texto por “Em breve”."
              />
              <div className="row" style={{ marginTop: 6 }}>
                <button className={marking ? "small" : "ghost small"} onClick={() => { setMarking((m) => !m); }}>
                  {marking ? "Arraste sobre a imagem…" : area ? "✎ Marcar outra área" : "✎ Marcar área na imagem"}
                </button>
                {area && (
                  <button className="ghost small" onClick={() => setArea(null)}>Limpar área</button>
                )}
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {area ? "Área marcada: a mudança fica só ali." : "Opcional: aponte onde está o que deve mudar."}
                </span>
              </div>
            </div>
            <div className="row">
              <button
                disabled={busy || !fb.trim()}
                title="Mantém a arte e muda só o que você pediu"
                onClick={async () => {
                  setBusy(true);
                  await onEdit(row, fb, area);
                  setBusy(false);
                }}
              >
                {busy ? "Enviando…" : "✎ Editar só isso"}
              </button>
              <button
                className="ghost"
                disabled={busy}
                title="Gera a peça de novo do zero, com o ajuste como regra obrigatória"
                onClick={async () => {
                  setBusy(true);
                  await onRedo(row, fb);
                  setBusy(false);
                }}
              >
                ↻ Gerar de novo
              </button>
              <button
                className="ghost"
                disabled={busy}
                title="Refaz ESTA MESMA arte em qualidade alta, com foto mais nítida e realista (custa mais). Use na aprovada."
                onClick={async () => {
                  setBusy(true);
                  await onEdit(row, fb, null, "enhance");
                  setBusy(false);
                }}
              >
                ★ Versão final em alta
              </button>
              <button className="danger small" onClick={() => onRemove(row)}>Apagar</button>
            </div>
            <details>
              <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 13 }}>Prompt usado</summary>
              <p className="mono" style={{ whiteSpace: "pre-wrap" }}>{row.sm_jobs?.prompt}</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
