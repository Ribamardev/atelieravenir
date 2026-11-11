"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import type { Model } from "@/lib/types";

type Health = { higgsfield: boolean; director: string | null };

export default function Config() {
  const [models, setModels] = useState<Model[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data } = await sb().from("sm_models").select("*").order("created_at");
    setModels(data || []);
  }

  useEffect(() => {
    load();
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => {});
  }, []);

  async function add() {
    await sb().from("sm_models").insert({ label: "Novo modelo", path: "/", active: false });
    load();
  }

  return (
    <>
      <h1>Configurações</h1>
      <p className="sub">Chaves e modelos do Higgsfield usados na geração.</p>

      <div className="card stack" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Conexões</h2>
        <div className="row">
          <span className={health?.higgsfield ? "pill ok" : "pill bad"}>
            Higgsfield {health?.higgsfield ? "configurado" : "sem chave"}
          </span>
          <span className={health?.director ? "pill ok" : "pill bad"}>
            Diretor de arte {health?.director ? `(${health.director})` : "sem chave"}
          </span>
        </div>
        <div className="note">
          As chaves ficam só nas variáveis de ambiente da Vercel: HIGGSFIELD_API_KEY e
          ANTHROPIC_API_KEY (ou OPENAI_API_KEY + OPENAI_MODEL).
        </div>
      </div>

      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Modelos</h2>
        <button className="ghost small" onClick={add}>+ Adicionar modelo</button>
      </div>
      <div className="note" style={{ marginBottom: 12 }}>
        Copie o caminho do endpoint e o nome do campo de imagens da página de cada modelo em console.higgsfield.ai.
        Deixe o “campo de referências” vazio para modelos só de texto: aí o diretor de arte descreve o estilo das
        referências dentro do prompt.
      </div>
      {msg && <div className="note" style={{ marginBottom: 12 }}>{msg}</div>}
      <div className="stack">
        {models.map((m) => (
          <ModelForm key={m.id} model={m} onSaved={(t) => { setMsg(t); load(); }} />
        ))}
      </div>
    </>
  );
}

function ModelForm({ model, onSaved }: { model: Model; onSaved: (msg: string) => void }) {
  const [f, setF] = useState({
    ...model,
    aspects: (model.aspect_ratios || []).join(", "),
    extraText: JSON.stringify(model.extra || {}),
  });

  async function save() {
    let extra = {};
    try {
      extra = JSON.parse(f.extraText || "{}");
    } catch {
      return onSaved("Parâmetros fixos precisam ser JSON válido, ex.: {\"resolution\":\"2K\"}");
    }
    if (f.is_default) await sb().from("sm_models").update({ is_default: false }).neq("id", model.id);
    const { error } = await sb()
      .from("sm_models")
      .update({
        label: f.label,
        path: f.path.trim(),
        image_field: f.image_field?.trim() || null,
        image_field_is_list: f.image_field_is_list,
        max_refs: Number(f.max_refs) || 0,
        aspect_ratios: f.aspects.split(",").map((s) => s.trim()).filter(Boolean),
        num_images_field: f.num_images_field?.trim() || null,
        extra,
        active: f.active,
        is_default: f.is_default,
      })
      .eq("id", model.id);
    onSaved(error ? error.message : `“${f.label}” salvo.`);
  }

  async function del() {
    if (!confirm(`Remover o modelo ${model.label}?`)) return;
    const { error } = await sb().from("sm_models").delete().eq("id", model.id);
    onSaved(error ? "Não dá para remover um modelo já usado em gerações. Desative-o." : "Modelo removido.");
  }

  return (
    <div className="card stack">
      <div className="grid g2">
        <div>
          <label>Nome</label>
          <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
        </div>
        <div>
          <label>Endpoint (caminho)</label>
          <input className="mono" value={f.path} onChange={(e) => setF({ ...f, path: e.target.value })} placeholder="/higgsfield-ai/soul/v2/standard" />
        </div>
        <div>
          <label>Campo de referências (vazio = só texto)</label>
          <input className="mono" value={f.image_field || ""} onChange={(e) => setF({ ...f, image_field: e.target.value })} placeholder="image_urls" />
        </div>
        <div className="grid g2">
          <div>
            <label>Máx. referências</label>
            <input type="number" min={0} max={14} value={f.max_refs} onChange={(e) => setF({ ...f, max_refs: +e.target.value })} />
          </div>
          <div>
            <label>Campo é lista?</label>
            <select value={f.image_field_is_list ? "1" : "0"} onChange={(e) => setF({ ...f, image_field_is_list: e.target.value === "1" })}>
              <option value="1">Sim (array)</option>
              <option value="0">Não (uma URL)</option>
            </select>
          </div>
        </div>
        <div>
          <label>Proporções aceitas</label>
          <input className="mono" value={f.aspects} onChange={(e) => setF({ ...f, aspects: e.target.value })} />
        </div>
        <div className="grid g2">
          <div>
            <label>Campo de quantidade</label>
            <input className="mono" value={f.num_images_field || ""} onChange={(e) => setF({ ...f, num_images_field: e.target.value })} placeholder="num_images" />
          </div>
          <div>
            <label>Parâmetros fixos (JSON)</label>
            <input className="mono" value={f.extraText} onChange={(e) => setF({ ...f, extraText: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="row between">
        <div className="row">
          <label className="row" style={{ margin: 0, color: "var(--text)" }}>
            <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Ativo
          </label>
          <label className="row" style={{ margin: 0, color: "var(--text)" }}>
            <input type="checkbox" checked={f.is_default} onChange={(e) => setF({ ...f, is_default: e.target.checked })} /> Padrão
          </label>
        </div>
        <div className="row">
          <button className="danger small" onClick={del}>Remover</button>
          <button className="small" onClick={save}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
