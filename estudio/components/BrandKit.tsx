"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sb, signedUrls } from "@/lib/supabase-browser";
import { extractPalette } from "@/lib/palette";
import type { BrandAsset, Client } from "@/lib/types";

const CHECKER =
  "repeating-conic-gradient(#2a3654 0% 25%, #1c2640 0% 50%) 50% / 16px 16px";

export default function BrandKit({ client, onSaved }: { client: Client; onSaved: (c: Client) => void }) {
  const router = useRouter();
  const [form, setForm] = useState(client);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [hex, setHex] = useState("#0B3B6E");
  const [suggested, setSuggested] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb()
      .from("sm_brand_assets")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at");
    const list = (data || []) as BrandAsset[];
    const urls = await signedUrls(list.map((a) => a.storage_path));
    setAssets(list.map((a) => ({ ...a, url: urls[a.storage_path] })));
  }, [client.id]);

  useEffect(() => {
    load();
  }, [load]);

  const logos = assets.filter((a) => a.kind === "logo");
  const manuals = assets.filter((a) => a.kind === "manual");
  const fonts = assets.filter((a) => a.kind === "font");
  const photos = assets.filter((a) => a.kind === "other");

  async function upload(kind: BrandAsset["kind"], files: FileList | null) {
    if (!files?.length) return;
    setBusy(kind);
    setMsg(null);
    let first = kind === "logo" && logos.length === 0;
    for (const f of Array.from(files)) {
      const ext = (f.name.split(".").pop() || "bin").toLowerCase();
      const path = `${client.id}/marca/${kind}-${crypto.randomUUID()}.${ext}`;
      const type = f.type || (ext === "svg" ? "image/svg+xml" : ext === "pdf" ? "application/pdf" : "application/octet-stream");
      const up = await sb().storage.from("sm-media").upload(path, f, { contentType: type });
      if (up.error) {
        setMsg(up.error.message);
        continue;
      }
      await sb().from("sm_brand_assets").insert({
        client_id: client.id,
        kind,
        name: f.name,
        storage_path: path,
        mime: type,
        is_primary: first,
      });
      first = false;
    }
    setBusy(null);
    await load();
    if (kind === "logo") setMsg("Logo enviado. Use “Extrair cores” para montar a paleta a partir dele.");
  }

  async function remove(a: BrandAsset) {
    if (!confirm(`Apagar ${a.name || "arquivo"}?`)) return;
    await sb().storage.from("sm-media").remove([a.storage_path]);
    await sb().from("sm_brand_assets").delete().eq("id", a.id);
    load();
  }

  async function makePrimary(a: BrandAsset) {
    await sb().from("sm_brand_assets").update({ is_primary: false }).eq("client_id", client.id).eq("kind", "logo");
    await sb().from("sm_brand_assets").update({ is_primary: true }).eq("id", a.id);
    load();
  }

  async function extract(a: BrandAsset) {
    if (!a.url) return;
    setBusy("extract");
    try {
      const cols = await extractPalette(a.url);
      const fresh = cols.filter((c) => !(form.palette || []).includes(c));
      setSuggested(fresh);
      setMsg(fresh.length ? "Cores encontradas no logo. Clique nas que quiser adicionar à paleta." : "Nenhuma cor nova encontrada.");
    } catch (e: any) {
      setMsg(e.message);
    }
    setBusy(null);
  }

  function addColor(c: string) {
    const v = c.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(v)) return setMsg("Use o formato #RRGGBB.");
    if ((form.palette || []).includes(v)) return;
    setForm((f) => ({ ...f, palette: [...(f.palette || []), v] }));
    setSuggested((s) => s.filter((x) => x !== v));
  }

  async function save() {
    const { data, error } = await sb()
      .from("sm_clients")
      .update({
        name: form.name,
        segment: form.segment,
        palette: form.palette,
        brand_notes: form.brand_notes,
        rules: form.rules,
        fonts: form.fonts,
      })
      .eq("id", client.id)
      .select()
      .single();
    if (error) return setMsg(error.message);
    onSaved(data);
    setMsg("Identidade salva.");
  }

  async function delClient() {
    if (!confirm(`Apagar ${client.name} com todas as referências, arquivos de marca e imagens?`)) return;
    const paths: string[] = [];
    for (const dir of [client.id, `${client.id}/gerados`, `${client.id}/marca`]) {
      const { data } = await sb().storage.from("sm-media").list(dir, { limit: 1000 });
      (data || []).filter((f) => f.id).forEach((f) => paths.push(`${dir}/${f.name}`));
    }
    if (paths.length) await sb().storage.from("sm-media").remove(paths);
    await sb().from("sm_clients").delete().eq("id", client.id);
    router.replace("/");
  }

  const UploadBtn = ({ kind, accept, label }: { kind: BrandAsset["kind"]; accept: string; label: string }) => (
    <label className="btn ghost small" style={{ margin: 0, color: "var(--text)", padding: "6px 10px", fontSize: 13 }}>
      {busy === kind ? "Enviando…" : label}
      <input type="file" accept={accept} multiple hidden onChange={(e) => upload(kind, e.target.files)} />
    </label>
  );

  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      {msg && <div className="note">{msg}</div>}

      <div className="card grid g2">
        <div>
          <label>Nome</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label>Segmento</label>
          <input value={form.segment || ""} onChange={(e) => setForm({ ...form, segment: e.target.value })} />
        </div>
      </div>

      {/* Logos */}
      <div className="card stack">
        <div className="row between">
          <div>
            <h2 style={{ margin: 0 }}>Logos</h2>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              PNG com fundo transparente funciona melhor. O logo principal é o aplicado no download com logo.
            </div>
          </div>
          <UploadBtn kind="logo" accept="image/png,image/svg+xml,image/jpeg,image/webp" label="+ Subir logos" />
        </div>
        {logos.length === 0 ? (
          <div className="empty" style={{ padding: 18 }}>Nenhum logo ainda.</div>
        ) : (
          <div className="grid g4">
            {logos.map((a) => (
              <div key={a.id} className="card" style={{ padding: 10, background: "var(--panel-2)" }}>
                <div style={{ background: CHECKER, borderRadius: 8, height: 120, display: "grid", placeItems: "center", padding: 12 }}>
                  {a.url && <img src={a.url} alt={a.name || ""} style={{ maxWidth: "100%", maxHeight: 96, objectFit: "contain" }} />}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.name}
                </div>
                <div className="row" style={{ gap: 6 }}>
                  {a.is_primary ? (
                    <span className="pill ok">Principal</span>
                  ) : (
                    <button className="ghost small" onClick={() => makePrimary(a)}>Tornar principal</button>
                  )}
                  <button className="ghost small" disabled={busy === "extract"} onClick={() => extract(a)}>Extrair cores</button>
                  <button className="danger small" onClick={() => remove(a)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fotos reais */}
      <div className="card stack">
        <div className="row between">
          <div>
            <h2 style={{ margin: 0 }}>Fotos reais</h2>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Fotos de verdade do cliente (equipe, espaço, clientes) ou de banco de imagens. Na geração, a IA monta a arte em volta
              delas sem redesenhar as pessoas — é o jeito mais realista.
            </div>
          </div>
          <UploadBtn kind="other" accept="image/png,image/jpeg,image/webp" label="+ Subir fotos" />
        </div>
        {photos.length === 0 ? (
          <div className="empty" style={{ padding: 18 }}>Nenhuma foto real ainda.</div>
        ) : (
          <div className="grid g4">
            {photos.map((a) => (
              <div key={a.id} className="thumb">
                {a.url && <img src={a.url} alt={a.name || ""} />}
                <div className="meta row between">
                  <span style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                    {a.name}
                  </span>
                  <button className="danger small" onClick={() => remove(a)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cores */}
      <div className="card stack">
        <h2 style={{ margin: 0 }}>Cores da marca</h2>
        <div className="row">
          {(form.palette || []).length === 0 && <span style={{ color: "var(--muted)", fontSize: 13 }}>Nenhuma cor definida.</span>}
          {(form.palette || []).map((c, i) => (
            <span key={c + i} className="row" style={{ gap: 4, background: "var(--panel-2)", padding: "4px 6px 4px 4px", borderRadius: 8 }}>
              <span className="swatch" style={{ background: c }} />
              <span className="mono">{c}</span>
              <button className="ghost small" style={{ padding: "2px 6px" }} onClick={() => setForm({ ...form, palette: form.palette.filter((_, j) => j !== i) })}>
                ✕
              </button>
            </span>
          ))}
        </div>
        {suggested.length > 0 && (
          <div className="row">
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Do logo:</span>
            {suggested.map((c) => (
              <button key={c} className="ghost small" onClick={() => addColor(c)}>
                <span className="swatch" style={{ background: c, width: 16, height: 16 }} /> {c} +
              </button>
            ))}
            <button className="small" onClick={() => suggested.forEach(addColor)}>Adicionar todas</button>
          </div>
        )}
        <div className="row">
          <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000"} onChange={(e) => setHex(e.target.value.toUpperCase())}
            style={{ width: 44, height: 40, padding: 2 }} />
          <input className="mono" style={{ width: 130 }} value={hex} onChange={(e) => setHex(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addColor(hex)} />
          <button className="ghost small" onClick={() => addColor(hex)}>Adicionar cor</button>
        </div>
      </div>

      {/* Fontes */}
      <div className="card stack">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Tipografia</h2>
          <UploadBtn kind="font" accept=".ttf,.otf,.woff,.woff2" label="+ Subir arquivos de fonte" />
        </div>
        <div>
          <label>Fontes da marca</label>
          <input value={form.fonts || ""} onChange={(e) => setForm({ ...form, fonts: e.target.value })} placeholder="Ex.: Títulos: Montserrat Bold · Textos: Inter Regular" />
        </div>
        <FileList items={fonts} onRemove={remove} />
      </div>

      {/* Manual */}
      <div className="card stack">
        <div className="row between">
          <div>
            <h2 style={{ margin: 0 }}>Manual de marca</h2>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>PDF. O diretor de arte lê o manual principal antes de escrever os prompts.</div>
          </div>
          <UploadBtn kind="manual" accept="application/pdf" label="+ Subir PDF" />
        </div>
        <FileList items={manuals} onRemove={remove} />
      </div>

      {/* Tom e regras */}
      <div className="card stack">
        <div>
          <label>Sobre a marca: tom, estilo, público</label>
          <textarea value={form.brand_notes || ""} onChange={(e) => setForm({ ...form, brand_notes: e.target.value })}
            placeholder="Ex.: hospital premium, visual limpo e acolhedor, luz natural, pessoas reais e diversas" />
        </div>
        <div>
          <label>Nunca usar</label>
          <textarea value={form.rules || ""} onChange={(e) => setForm({ ...form, rules: e.target.value })}
            placeholder="Ex.: nada de vermelho forte, sem crianças, sem ambiente de UTI" />
        </div>
      </div>

      <div className="row between">
        <button onClick={save}>Salvar identidade</button>
        <button className="danger small" onClick={delClient}>Apagar cliente</button>
      </div>
    </div>
  );
}

function FileList({ items, onRemove }: { items: BrandAsset[]; onRemove: (a: BrandAsset) => void }) {
  if (!items.length) return null;
  return (
    <div className="stack" style={{ gap: 6 }}>
      {items.map((a) => (
        <div key={a.id} className="row between" style={{ background: "var(--panel-2)", padding: "8px 10px", borderRadius: 8 }}>
          <span style={{ fontSize: 14 }}>{a.name}</span>
          <div className="row" style={{ gap: 6 }}>
            {a.url && (
              <a className="btn ghost small" href={a.url} target="_blank" rel="noreferrer" style={{ padding: "6px 10px", fontSize: 13 }}>
                Abrir
              </a>
            )}
            <button className="danger small" onClick={() => onRemove(a)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
