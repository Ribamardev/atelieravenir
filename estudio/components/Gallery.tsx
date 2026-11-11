"use client";
import { useCallback, useEffect, useState } from "react";
import { sb, signedUrls } from "@/lib/supabase-browser";
import { downloadCropped, slug, LOGO_POS_LABEL, type LogoPos } from "@/lib/download";
import { useJobPolling, statusClass, statusLabel } from "./jobs";
import type { Format } from "@/lib/types";

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    sb()
      .from("sm_brand_assets")
      .select("storage_path, is_primary, mime")
      .eq("client_id", clientId)
      .eq("kind", "logo")
      .order("is_primary", { ascending: false })
      .limit(1)
      .then(async ({ data }) => {
        const p = data?.[0]?.storage_path;
        if (!p) return setLogoUrl(null);
        const u = await signedUrls([p]);
        setLogoUrl(u[p] || null);
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
    const prompt = extra.trim() ? `${r.sm_jobs.prompt} Adjustments: ${extra.trim()}` : r.sm_jobs.prompt;
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

  async function remove(r: Row) {
    if (!confirm("Apagar esta imagem?")) return;
    await sb().storage.from("sm-media").remove([r.storage_path]);
    await sb().from("sm_images").delete().eq("id", r.id);
    setOpen(null);
    load();
  }

  const shown = rows.filter((r) => filter === "all" || r.review === filter);
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
        {running.length > 0 && <span className="pill warn">{running.length} em andamento…</span>}
      </div>

      {shown.length === 0 ? (
        <div className="empty">Nenhuma imagem aqui ainda.</div>
      ) : (
        <div className="grid g4">
          {shown.map((r) => (
            <div key={r.id} className={`thumb ${r.sm_jobs?.format === "story" ? "story" : ""}`} onClick={() => setOpen(r)} style={{ cursor: "pointer" }}>
              {urls[r.storage_path] && <img src={urls[r.storage_path]} alt={r.sm_jobs?.title || ""} />}
              <span className="tag">{r.sm_jobs?.format === "story" ? "Stories" : "Feed"}</span>
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
          logoUrl={logoUrl}
          clientName={clientName}
          onClose={() => setOpen(null)}
          onReview={setReview}
          onRedo={redo}
          onRemove={remove}
        />
      )}
    </div>
  );
}

function Detail({
  row,
  url,
  logoUrl,
  clientName,
  onClose,
  onReview,
  onRedo,
  onRemove,
}: {
  row: Row;
  url?: string;
  logoUrl: string | null;
  clientName: string;
  onClose: () => void;
  onReview: (r: Row, review: Row["review"], feedback?: string) => void;
  onRedo: (r: Row, extra: string, override?: Record<string, unknown>) => Promise<void>;
  onRemove: (r: Row) => void;
}) {
  const [fb, setFb] = useState(row.feedback || "");
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState<LogoPos>(logoUrl ? "bottom-right" : "none");
  const [logoSize, setLogoSize] = useState(22);
  const [dl, setDl] = useState(false);
  const logo = logoUrl && pos !== "none" ? { url: logoUrl, pos, widthPct: logoSize } : undefined;
  async function download(format: "feed" | "story") {
    if (!url) return;
    setDl(true);
    try {
      await downloadCropped(url, format, `${name}-${format}${logo ? "-logo" : ""}`, logo);
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
          <div className={`thumb ${fmt === "story" ? "story" : ""}`}>
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
                  left: pos.endsWith("left") ? "6%" : pos.endsWith("center") ? `${(100 - logo.widthPct) / 2}%` : undefined,
                  right: pos.endsWith("right") ? "6%" : undefined,
                  top: pos.startsWith("top") ? (fmt === "story" ? "14%" : "4.8%") : undefined,
                  bottom: pos.startsWith("bottom") ? (fmt === "story" ? "20%" : "4.8%") : undefined,
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
              {logoUrl ? (
                <div className="row">
                  <select value={pos} onChange={(e) => setPos(e.target.value as LogoPos)} style={{ width: 230 }}>
                    {(Object.keys(LOGO_POS_LABEL) as LogoPos[]).map((k) => (
                      <option key={k} value={k}>{LOGO_POS_LABEL[k]}</option>
                    ))}
                  </select>
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
              <label>Ajuste para refazer (opcional)</label>
              <textarea value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Ex.: luz mais quente, médica mais jovem, fundo menos poluído" />
            </div>
            <div className="row">
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await onRedo(row, fb);
                  setBusy(false);
                }}
              >
                {busy ? "Enviando…" : "↻ Refazer com ajuste"}
              </button>
              <button
                className="ghost"
                disabled={busy}
                title="Refaz esta peça com o mesmo prompt em qualidade alta (custa mais). Use só na aprovada."
                onClick={async () => {
                  setBusy(true);
                  await onRedo(row, fb, { quality: "high" });
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
