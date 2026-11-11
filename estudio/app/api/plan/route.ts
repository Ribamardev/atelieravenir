import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import { planPieces } from "@/lib/director";
import { BUCKET } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await requireUser();
  if (!supabase) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  try {
    const { clientId, referenceIds = [], brief, feedCount = 0, storyCount = 0, modelId, withText = true, logoArea = "bottom-right" } = await req.json();
    if (!clientId || !brief) throw new Error("Escolha o cliente e escreva o briefing.");
    if (feedCount + storyCount < 1 && !/\n\s*\d+[.)]/.test("\n" + brief)) throw new Error("Peça pelo menos uma imagem.");
    if (feedCount + storyCount > 12) throw new Error("Máximo de 12 peças por vez.");

    const { data: client, error: ce } = await supabase.from("sm_clients").select("*").eq("id", clientId).single();
    if (ce || !client) throw new Error("Cliente não encontrado.");

    const { data: model } = await supabase.from("sm_models").select("*").eq("id", modelId).single();

    const { data: refRows } = referenceIds.length
      ? await supabase.from("sm_references").select("*").in("id", referenceIds)
      : { data: [] as any[] };
    const rows = refRows || [];
    const { data: signed } = rows.length
      ? await supabase.storage.from(BUCKET).createSignedUrls(rows.map((r: any) => r.storage_path), 900)
      : { data: [] as any[] };
    const urlByPath = new Map((signed || []).map((s: any) => [s.path, s.signedUrl]));
    const refs = rows
      .map((r: any) => ({ id: r.id, url: urlByPath.get(r.storage_path) as string, notes: r.notes }))
      .filter((r) => r.url);

    // Kit de marca: manual principal (PDF) e logo principal
    const { data: assets } = await supabase
      .from("sm_brand_assets")
      .select("kind, storage_path, is_primary, mime, created_at")
      .eq("client_id", clientId)
      .in("kind", ["logo", "manual"])
      .order("is_primary", { ascending: false })
      .order("created_at");
    const logo = (assets || []).find((a: any) => a.kind === "logo" && !(a.mime || "").includes("svg"));
    const manual = (assets || []).find((a: any) => a.kind === "manual");
    const sign = async (p?: string) =>
      p ? (await supabase.storage.from(BUCKET).createSignedUrl(p, 900)).data?.signedUrl ?? null : null;

    const pieces = await planPieces({
      logoUrl: await sign(logo?.storage_path),
      manualUrl: await sign(manual?.storage_path),
      client,
      refs,
      brief,
      feedCount,
      storyCount,
      modelSeesImages: !!model?.image_field,
      withText: !!withText,
      logoArea: String(logoArea),
    });
    return NextResponse.json({ pieces });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}
