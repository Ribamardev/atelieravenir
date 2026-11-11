"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { sb, signedUrls } from "@/lib/supabase-browser";
import type { Client, Reference } from "@/lib/types";
import Gallery from "@/components/Gallery";
import BrandKit from "@/components/BrandKit";

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [tab, setTab] = useState<"identidade" | "referencias" | "galeria">("galeria");

  useEffect(() => {
    sb().from("sm_clients").select("*").eq("id", id).single().then(({ data }) => setClient(data));
  }, [id]);

  if (!client) return <p className="sub">Carregando…</p>;

  return (
    <>
      <div className="row between">
        <div>
          <Link href="/" style={{ color: "var(--muted)", fontSize: 13 }}>← Clientes</Link>
          <h1>{client.name}</h1>
        </div>
        <Link className="btn" href={`/gerar?cliente=${client.id}`}>Gerar imagens</Link>
      </div>
      <div className="tabs">
        {(["galeria", "referencias", "identidade"] as const).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {{ galeria: "Galeria", referencias: "Referências", identidade: "Identidade visual" }[t]}
          </button>
        ))}
      </div>
      {tab === "galeria" && <Gallery clientId={client.id} clientName={client.name} />}
      {tab === "referencias" && <References clientId={client.id} />}
      {tab === "identidade" && <BrandKit client={client} onSaved={setClient} />}
    </>
  );
}

function References({ clientId }: { clientId: string }) {
  const [refs, setRefs] = useState<Reference[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb().from("sm_references").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    const list = data || [];
    const urls = await signedUrls(list.map((r) => r.storage_path));
    setRefs(list.map((r) => ({ ...r, url: urls[r.storage_path] })));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const ext = f.name.split(".").pop() || "jpg";
      const path = `${clientId}/ref-${crypto.randomUUID()}.${ext}`;
      const up = await sb().storage.from("sm-media").upload(path, f, { contentType: f.type });
      if (up.error) {
        setError(up.error.message);
        continue;
      }
      await sb().from("sm_references").insert({ client_id: clientId, storage_path: path });
    }
    setBusy(false);
    load();
  }

  async function saveNotes(r: Reference, notes: string) {
    await sb().from("sm_references").update({ notes }).eq("id", r.id);
  }

  async function remove(r: Reference) {
    if (!confirm("Apagar esta referência?")) return;
    await sb().storage.from("sm-media").remove([r.storage_path]);
    await sb().from("sm_references").delete().eq("id", r.id);
    load();
  }

  return (
    <div className="stack">
      <div className="card row between">
        <div>
          <strong>Biblioteca de referências</strong>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Suba imagens que inspiram o visual. Na nota, diga o que aproveitar (luz, cor, enquadramento…).
          </div>
        </div>
        <label className="btn" style={{ margin: 0, color: "#fff" }}>
          {busy ? "Enviando…" : "+ Subir imagens"}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
      {error && <div className="err">{error}</div>}
      {refs.length === 0 ? (
        <div className="empty">Nenhuma referência ainda.</div>
      ) : (
        <div className="grid g4">
          {refs.map((r) => (
            <div key={r.id} className="thumb">
              {r.url && <img src={r.url} alt="" />}
              <div className="meta stack" style={{ gap: 6 }}>
                <input
                  defaultValue={r.notes || ""}
                  placeholder="O que aproveitar?"
                  onBlur={(e) => saveNotes(r, e.target.value)}
                  style={{ padding: "6px 8px", fontSize: 13 }}
                />
                <button className="danger small" onClick={() => remove(r)}>Apagar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
