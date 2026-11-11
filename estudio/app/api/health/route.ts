import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";

// Diz só se as chaves existem — nunca devolve o valor.
export async function GET() {
  if (!(await requireUser())) return NextResponse.json({ error: "Faça login." }, { status: 401 });
  return NextResponse.json({
    higgsfield: !!(process.env.HIGGSFIELD_API_KEY_ID && process.env.HIGGSFIELD_API_KEY_SECRET),
    director: process.env.ANTHROPIC_API_KEY ? "Claude" : process.env.OPENAI_API_KEY ? "OpenAI" : null,
  });
}
