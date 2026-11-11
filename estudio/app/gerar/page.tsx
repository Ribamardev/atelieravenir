"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sb, signedUrls } from "@/lib/supabase-browser";
import type { Client, Model, PlannedPiece, Reference } from "@/lib/types";
import { useJobPolling, statusClass, statusLabel } from "@/components/jobs";

export default function Page() {
  return (
    <Suspense fallback={<p className="sub">Carregando…</p>}>
      <Generate />
    </Suspense>
  );
}

function Generate() {
  const params = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [clientId, setClientId] = useState(params.get("cliente") || "");
  const [modelId, setModelId] = useState("");
  const [refs, setRefs] = useState<Reference[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [brief, setBrief] = useState("");
  const [feedCount, setFeedCount] = useState(2);
  const [storyCount, setStoryCount] = useState(2);
  const [variations, setVariations] = useState(1);
  const [withText, setWithText] = useState(true);
  const [pieces, setPieces] = useState<PlannedPiece[] | null>(null);
  const [busy, setBusy] = useState<"" | "plan" | "gen">("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string[]>>({}); // jobId -> urls

  const loadResults = useCallback(async (jobIds: string[]) => {
    if (!jobIds.length) return;
    const { data } = await sb().from("sm_images").select("job_id, storage_path").in("job_id", jobIds);
    const urls = await signedUrls((data || []).map((d) => d.storage_path));
    const map: Record<string, string[]> = {};
    (data || []).forEach((d) => (map[d.job_id] ||= []).push(urls[d.storage_path]));
    setResults(map);
  }, []);

  const { jobs, track, clear } = useJobPolling();

  useEffect(() => {
    const done = jobs.filter((j) => j.status === "completed").map((j) => j.id);
    loadResults(done);
  }, [jobs, loadResults]);

  useEffect(() => {
    sb().from("sm_clients").select("*").order("name").then(({ data }) => setClients(data || []));
    sb()
      .from("sm_models")
      .select("*")
      .eq("active", true)
      .order("label")
      .then(({ data }) => {
        setModels(data || []);
        const def = (data || []).find((m) => m.is_default) || (data || [])[0];
        if (def) setModelId(def.id);
      });
  }, []);

  useEffect(() => {
    setSelected([]);
    setRefs([]);
    if (!clientId) return;
    sb()
      .from("sm_references")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const list = data || [];
        const urls = await signedUrls(list.map((r) => r.storage_path));
        setRefs(list.map((r) => ({ ...r, url: urls[r.storage_path] })));
      });
  }, [clientId]);

  const model = models.find((m) => m.id === modelId);
  const refById = useMemo(() => Object.fromEntries(refs.map((r) => [r.id, r])), [refs]);
  const total = (pieces?.length || 0) * variations;

  async function plan() {
    setError(null);
    setBusy("plan");
    setPieces(null);
    clear();
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, referenceIds: selected, brief, feedCount, storyCount, modelId, withText }),
    });
    const body = await res.json();
    setBusy("");
    if (!res.ok) return setError(body.error);
    setPieces(body.pieces);
  }

  async function generate() {
    if (!pieces?.length) return;
    setError(null);
    setBusy("gen");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, modelId, numImages: variations, pieces }),
    });
    const body = await res.json();
    setBusy("");
    if (!res.ok) return setError(body.error);
    track(body.jobs);
  }

  function updatePiece(i: number, patch: Partial<PlannedPiece>) {
    setPieces((cur) => cur!.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  const listsPieces = /\n\s*\d+[.)]/.test("\n" + brief);
  const canPlan = clientId && modelId && brief.trim() && (feedCount + storyCount > 0 || listsPieces) && !busy;

  return (
    <>
      <h1>Gerar imagens</h1>
      <p className="sub">Briefing + referências → o diretor de arte escreve os prompts → o Higgsfield gera.</p>
      {error && <div className="err" style={{ marginBottom: 14 }}>{error}</div>}

      {/* 1. Briefing */}
      <div className="card stack">
        <h2>1. Briefing</h2>
        <div className="grid g2">
          <div>
            <label>Cliente</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Escolha…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Modelo no Higgsfield</label>
            <select value={modelId} onChange={(e) => setModelId(e.target.value)}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}{m.image_field ? "" : " · referências viram descrição"}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label>Tema e objetivo das peças</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={'Descreva a campanha ou liste as peças. Ex.:\n1. Abertura (post único)\nImagem: cadeira de barbeiro vazia, feixe de luz quente, fundo verde escuro.\nTexto da arte: "Uma cadeira vazia. Um barbeiro sem cadeira." + "Em breve"'}
            style={{ minHeight: 140 }}
          />
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className={withText ? "small" : "ghost small"} onClick={() => setWithText(true)}>Arte final com texto</button>
          <button className={!withText ? "small" : "ghost small"} onClick={() => setWithText(false)}>Só imagem base</button>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {withText
              ? "A IA escreve os textos do briefing na arte. O logo real entra no download."
              : "Imagem sem texto, para diagramar depois."}
          </span>
        </div>
        {listsPieces && (
          <div className="note">O briefing lista as peças: o diretor de arte vai criar exatamente essas, ignorando as quantidades abaixo.</div>
        )}
        <div className="grid g3">
          <div>
            <label>Peças de Feed (4:5)</label>
            <input type="number" min={0} max={8} value={feedCount} onChange={(e) => setFeedCount(+e.target.value)} />
          </div>
          <div>
            <label>Peças de Stories (9:16)</label>
            <input type="number" min={0} max={8} value={storyCount} onChange={(e) => setStoryCount(+e.target.value)} />
          </div>
          <div>
            <label>Variações por peça</label>
            <select value={variations} onChange={(e) => setVariations(+e.target.value)}>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label>
            Referências {selected.length ? `(${selected.length} selecionadas)` : ""}
            {model && model.image_field ? ` · este modelo usa até ${model.max_refs} por peça` : ""}
          </label>
          {!clientId ? (
            <div className="note">Escolha o cliente para ver as referências.</div>
          ) : refs.length === 0 ? (
            <div className="note">
              Este cliente não tem referências. <Link href={`/clientes/${clientId}`} style={{ color: "var(--accent)" }}>Subir agora</Link>
            </div>
          ) : (
            <div className="grid g4">
              {refs.map((r) => {
                const on = selected.includes(r.id);
                return (
                  <div
                    key={r.id}
                    className={`thumb ${on ? "sel" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected((s) => (on ? s.filter((x) => x !== r.id) : [...s, r.id]))}
                  >
                    {r.url && <img src={r.url} alt="" />}
                    {on && <span className="check">✓</span>}
                    {r.notes && <div className="meta" style={{ color: "var(--muted)" }}>{r.notes}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <button disabled={!canPlan} onClick={plan}>
            {busy === "plan" ? "O diretor de arte está analisando…" : "Planejar peças"}
          </button>
        </div>
      </div>

      {/* 2. Revisão dos prompts */}
      {pieces && (
        <div className="card stack" style={{ marginTop: 16 }}>
          <div className="row between">
            <h2 style={{ margin: 0 }}>2. Revise as peças</h2>
            <span className="pill">{pieces.length} peças × {variations} = {total} imagens</span>
          </div>
          {pieces.map((p, i) => (
            <div key={i} className="card" style={{ background: "var(--panel-2)" }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <div className="row">
                  <select value={p.format} onChange={(e) => updatePiece(i, { format: e.target.value as any })} style={{ width: 130 }}>
                    <option value="feed">Feed 4:5</option>
                    <option value="story">Stories 9:16</option>
                  </select>
                  <input value={p.title} onChange={(e) => updatePiece(i, { title: e.target.value })} style={{ width: 260 }} />
                </div>
                <button className="ghost small" onClick={() => setPieces(pieces.filter((_, j) => j !== i))}>Remover</button>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>{p.summary_pt}</div>
              <textarea className="mono" value={p.prompt} onChange={(e) => updatePiece(i, { prompt: e.target.value })} style={{ minHeight: 110 }} />
              {p.reference_ids.length > 0 && (
                <div className="row" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Referências:</span>
                  {p.reference_ids.map((id) =>
                    refById[id]?.url ? (
                      <img key={id} src={refById[id].url} alt="" style={{ width: 36, height: 45, objectFit: "cover", borderRadius: 4 }} />
                    ) : null
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="row">
            <button disabled={!!busy || !pieces.length} onClick={generate}>
              {busy === "gen" ? "Enviando ao Higgsfield…" : `Gerar ${total} ${total === 1 ? "imagem" : "imagens"}`}
            </button>
            <button className="ghost" disabled={!!busy} onClick={plan}>Replanejar</button>
            {model?.extra && (model.extra as any).quality && (
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                Qualidade de rascunho: {(model.extra as any).quality}. Gere a versão final em alta só da imagem aprovada, na galeria.
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Resultados */}
      {jobs.length > 0 && (
        <div className="card stack" style={{ marginTop: 16 }}>
          <div className="row between">
            <h2 style={{ margin: 0 }}>3. Resultados</h2>
            <Link className="btn ghost small" href={`/clientes/${clientId}`}>Abrir galeria para aprovar e baixar →</Link>
          </div>
          {jobs.map((j) => (
            <div key={j.id} className="stack" style={{ gap: 8 }}>
              <div className="row between">
                <span>
                  <span className="pill" style={{ marginRight: 8 }}>{j.format === "story" ? "Stories" : "Feed"}</span>
                  {j.title}
                </span>
                <span className={statusClass(j.status)}>{statusLabel(j.status)}</span>
              </div>
              {j.error && <div className="err">{j.error}</div>}
              {results[j.id]?.length ? (
                <div className="grid g4">
                  {results[j.id].map((u) => (
                    <div key={u} className={`thumb ${j.format === "story" ? "story" : ""}`}>
                      <img src={u} alt="" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
