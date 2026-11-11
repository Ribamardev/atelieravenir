import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import { getStatus } from "@/lib/higgsfield";
import { BUCKET, TERMINAL } from "@/lib/types";

export const maxDuration = 60;

/** Consulta o Higgsfield e, quando pronto, copia as imagens para o Supabase (o Higgsfield apaga em 7 dias). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await requireUser();
  if (!supabase) return NextResponse.json({ error: "Faça login." }, { status: 401 });
  const { id } = await ctx.params;

  try {
    const { data: job } = await supabase.from("sm_jobs").select("*").eq("id", id).single();
    if (!job) throw new Error("Peça não encontrada.");
    if (TERMINAL.includes(job.status) || !job.hf_request_id) return NextResponse.json({ job });

    const st = await getStatus(job.hf_request_id);

    if (st.status === "completed") {
      const { count } = await supabase
        .from("sm_images")
        .select("id", { count: "exact", head: true })
        .eq("job_id", id);
      if (!count) {
        let n = 0;
        for (const img of st.images || []) {
          const res = await fetch(img.url);
          if (!res.ok) continue;
          const type = res.headers.get("content-type") || "image/png";
          const ext = type.includes("jpeg") || type.includes("jpg") ? "jpg" : type.includes("webp") ? "webp" : "png";
          const path = `${job.client_id}/gerados/${id}-${n++}.${ext}`;
          const up = await supabase.storage
            .from(BUCKET)
            .upload(path, await res.arrayBuffer(), { contentType: type, upsert: true });
          if (up.error) throw new Error(up.error.message);
          await supabase.from("sm_images").insert({ job_id: id, client_id: job.client_id, storage_path: path });
        }
        if (n === 0) throw new Error("A geração terminou, mas nenhuma imagem pôde ser baixada.");
      }
    }

    const error =
      st.status === "nsfw" ? "Bloqueada pela moderação do Higgsfield. Ajuste o prompt." : st.error || null;
    const { data: updated } = await supabase
      .from("sm_jobs")
      .update({ status: st.status, error })
      .eq("id", id)
      .select()
      .single();
    return NextResponse.json({ job: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}
