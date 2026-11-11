import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import { submitGeneration, uploadToHiggsfield } from "@/lib/higgsfield";
import { BUCKET, type Model } from "@/lib/types";

export const maxDuration = 60;

type Area = { x: number; y: number; w: number; h: number }; // em % da imagem

function describeArea(a: Area) {
  const cx = a.x + a.w / 2;
  const cy = a.y + a.h / 2;
  const horiz = cx < 33 ? "left" : cx > 67 ? "right" : "center";
  const vert = cy < 33 ? "top" : cy > 67 ? "bottom" : "middle";
  const r = (n: number) => Math.round(n);
  return `${vert}-${horiz} region (from ${r(a.x)}% to ${r(a.x + a.w)}% of the width and from ${r(a.y)}% to ${r(a.y + a.h)}% of the height, measured from the top-left corner)`;
}

/** Edita uma imagem já gerada: manda a própria imagem ao modelo e pede só a mudança. */
export async function POST(req: Request) {
  const supabase = await requireUser();
  if (!supabase) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  try {
    const { imageId, instruction = "", area, mode = "edit" } = (await req.json()) as {
      imageId: string;
      instruction?: string;
      area?: Area | null;
      mode?: "edit" | "enhance";
    };
    if (mode === "edit" && !instruction.trim()) throw new Error("Escreva o que deve mudar na imagem.");

    const { data: img } = await supabase.from("sm_images").select("*, sm_jobs(*)").eq("id", imageId).single();
    if (!img) throw new Error("Imagem não encontrada.");
    const job = img.sm_jobs;

    // Precisa de um modelo que aceite imagem de entrada: o da peça, ou o padrão com referências
    let { data: model } = await supabase.from("sm_models").select("*").eq("id", job.model_id).single();
    if (!model?.image_field) {
      const { data: alt } = await supabase
        .from("sm_models")
        .select("*")
        .eq("active", true)
        .not("image_field", "is", null)
        .order("is_default", { ascending: false })
        .limit(1);
      model = alt?.[0];
    }
    if (!model) throw new Error("Ative um modelo que aceite imagens (ex.: Marketing Studio Image) em Configurações.");
    const m = { ...(model as Model) };
    // Pedido de qualidade/realismo (ou versão final) roda em qualidade alta, se o modelo tiver esse ajuste
    const wantsQuality =
      mode === "enhance" || /alta|resolu|qualidade|n[ií]tid|defini|realis|\bia\b|artificial|fake|pl[aá]stic|borrad/i.test(instruction);
    if (wantsQuality && m.extra && "quality" in m.extra) m.extra = { ...m.extra, quality: "high" };

    const { data: file, error: de } = await supabase.storage.from(BUCKET).download(img.storage_path);
    if (de || !file) throw new Error("Não foi possível ler a imagem original.");
    const imageUrl = await uploadToHiggsfield(await file.arrayBuffer(), file.type || "image/png");

    const extraAsk = instruction.trim() ? `Also apply this request: "${instruction.trim()}".` : "";
    const prompt =
      mode === "enhance"
        ? [
            "Re-render this exact design at maximum quality.",
            "Keep the same layout, the same texts letter by letter (Portuguese, correct accents), the same colors, graphic shapes and composition.",
            "Make the photo sharper and truly photorealistic: real camera lens detail, natural skin texture, realistic faces, hands and hair, correct anatomy, no AI artifacts, no plastic or waxy look, no warped faces.",
            extraAsk,
            "Do not add any new elements, icons, arrows, buttons, logos or text.",
          ]
            .filter(Boolean)
            .join(" ")
        : [
            "Edit the provided image. Apply this change:",
            `"${instruction.trim()}".`,
            area
              ? `The change applies only to the ${describeArea(area)}; blend it seamlessly with its surroundings and keep everything outside that area unchanged.`
              : "Change whatever is needed to fulfil the request (including re-rendering the photo if the request is about it).",
            wantsQuality
              ? "Render in high definition and truly photorealistic: real camera lens detail, natural skin, realistic faces and hands, no AI artifacts, no plastic look."
              : "",
            "Keep the layout, all texts letter by letter, colors and graphic shapes the same unless the request says otherwise.",
            "Do not add any new elements, icons, arrows, buttons, logos or text.",
          ]
            .filter(Boolean)
            .join(" ");

    const { data: newJob, error: je } = await supabase
      .from("sm_jobs")
      .insert({
        client_id: img.client_id,
        model_id: m.id,
        format: job.format,
        title: `${(job.title || "Peça").replace(/ \((refeita|editada|final em alta)\)$/, "")} (${mode === "enhance" ? "final em alta" : "editada"})`,
        summary_pt: mode === "enhance" ? `Versão final em alta${instruction.trim() ? `: ${instruction.trim()}` : ""}` : `Edição: ${instruction.trim()}`,
        prompt,
        reference_ids: [],
        aspect_ratio: job.aspect_ratio,
        status: "queued",
      })
      .select()
      .single();
    if (je || !newJob) throw new Error(je?.message || "Falha ao criar a edição.");

    try {
      const sub = await submitGeneration({
        model: m,
        prompt,
        aspect: job.aspect_ratio || (job.format === "story" ? "9:16" : "3:4"),
        imageUrls: [imageUrl],
        numImages: 1,
        idempotencyKey: newJob.id,
      });
      await supabase.from("sm_jobs").update({ hf_request_id: sub.request_id, status: sub.status || "queued" }).eq("id", newJob.id);
      return NextResponse.json({ job: { ...newJob, hf_request_id: sub.request_id, status: sub.status || "queued" } });
    } catch (err: any) {
      await supabase.from("sm_jobs").update({ status: "failed", error: err.message }).eq("id", newJob.id);
      throw err;
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}
