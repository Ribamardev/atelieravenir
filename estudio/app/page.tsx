"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase-browser";
import type { Client } from "@/lib/types";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [counts, setCounts] = useState<Record<string, { refs: number; imgs: number }>>({});
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error } = await sb().from("sm_clients").select("*").order("name");
    if (error) return setError(error.message);
    setClients(data || []);
    const [refs, imgs] = await Promise.all([
      sb().from("sm_references").select("client_id"),
      sb().from("sm_images").select("client_id"),
    ]);
    const c: Record<string, { refs: number; imgs: number }> = {};
    (refs.data || []).forEach((r: any) => ((c[r.client_id] ||= { refs: 0, imgs: 0 }).refs += 1));
    (imgs.data || []).forEach((r: any) => ((c[r.client_id] ||= { refs: 0, imgs: 0 }).imgs += 1));
    setCounts(c);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await sb().from("sm_clients").insert({ name: name.trim(), segment: segment.trim() || null });
    if (error) return setError(error.message);
    setName("");
    setSegment("");
    load();
  }

  return (
    <>
      <h1>Clientes</h1>
      <p className="sub">Cada cliente guarda a identidade visual, as referências e as imagens geradas.</p>
      {error && <div className="err" style={{ marginBottom: 14 }}>{error}</div>}

      <form className="card row" style={{ marginBottom: 20 }} onSubmit={create}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <label>Nome do cliente</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Hospital São Lucas" />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label>Segmento</label>
          <input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Ex.: hospital" />
        </div>
        <button style={{ alignSelf: "flex-end" }}>Adicionar</button>
      </form>

      {clients.length === 0 ? (
        <div className="empty">Nenhum cliente ainda. Adicione o primeiro acima.</div>
      ) : (
        <div className="grid g3">
          {clients.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`} className="card stack" style={{ gap: 8 }}>
              <div className="row between">
                <strong>{c.name}</strong>
                {c.segment && <span className="pill">{c.segment}</span>}
              </div>
              <div className="row" style={{ gap: 4 }}>
                {(c.palette || []).slice(0, 6).map((hex) => (
                  <span key={hex} className="swatch" style={{ background: hex, width: 18, height: 18 }} />
                ))}
                {!c.palette?.length && <span style={{ color: "var(--muted)", fontSize: 13 }}>Sem paleta</span>}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                {counts[c.id]?.refs || 0} referências · {counts[c.id]?.imgs || 0} imagens
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
