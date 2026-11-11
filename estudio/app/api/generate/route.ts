import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import { pickAspect, submitGeneration, uploadToHiggsfield } from "@/lib/higgsfield";
import { BUCKET, type Model, type PlannedPiece } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await requireUser();
  if (!supabase) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  try {
    const { clientId, modelId, numImages = 1, pieces } = (await req.json()) as {
      clientId: string;
      modelId: string;
      numImages: number;
      pieces: PlannedPiece[];
    };
    if (!pieces?.length) throw new Error("Nenhuma peça para gerar.");

    const { data: model, error: me } = await supabase.from("sm_models").select("*").eq("id", modelId).single();
    if (me || !model) throw new Error("Modelo não encontrado.");
    const m = model as Model;
    if (!m.active) throw new Error(`O modelo "${m.label}" está desativado. Ative em Configurações.`);

    // Sobe cada referência ao Higgsfield uma única vez por requisição
    const hfUrlByRef = new Map<string, string>();
    async function hfUrl(refId: string) {
      if (hfUrlByRef.has(refId)) return hfUrlByRef.get(refId)!;
      const { data: ref } = await supabase!.from("sm_references").select("*").eq("id", refId).single();
      if (!ref) return null;
      const { data: file, error } = await supabase!.storage.from(BUCKET).download(ref.storage_path);
      if (error || !file) return null;
      const type = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
      const url = await uploadToHiggsfield(await file.arrayBuffer(), type);
      hfUrlByRef.set(refId, url);
      return url;
    }

    const results = [];
    for (const p of pieces) {
      const aspect = pickAspect(m, p.format);
      const { data: job, error: je } = await supabase
        .from("sm_jobs")
        .insert({
          client_id: clientId,
          model_id: m.id,
          format: p.format,
          title: p.title,
          summary_pt: p.summary_pt,
          prompt: p.prompt,
          reference_ids: p.reference_ids || [],
          aspect_ratio: aspect,
          status: "queued",
        })
        .select()
        .single();
      if (je || !job) throw new Error(je?.message || "Falha ao criar a peça.");

      try {
        const imageUrls: string[] = [];
        if (m.image_field && m.max_refs > 0) {
          for (const id of (p.reference_ids || []).slice(0, m.max_refs)) {
            const u = await hfUrl(id);
            if (u) imageUrls.push(u);
          }
        }
        const sub = await submitGeneration({
          model: m,
          prompt: p.prompt,
          aspect,
          imageUrls,
          numImages: Math.min(Math.max(1, numImages), 4),
          idempotencyKey: job.id,
        });
        await supabase
          .from("sm_jobs")
          .update({ hf_request_id: sub.request_id, status: sub.status || "queued" })
          .eq("id", job.id);
        results.push({ ...job, hf_request_id: sub.request_id, status: sub.status || "queued" });
      } catch (err: any) {
        await supabase.from("sm_jobs").update({ status: "failed", error: err.message }).eq("id", job.id);
        results.push({ ...job, status: "failed", error: err.message });
      }
    }
    return NextResponse.json({ jobs: results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}
