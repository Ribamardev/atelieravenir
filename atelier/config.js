// GET /api/config — dados PÚBLICOS que o navegador precisa para entrar no Supabase.
// (A anon key é pública por natureza; a segurança vem das regras RLS do banco.)
import { env, send } from "./_lib/core.js";
import { textProvider } from "./_lib/text.js";

export default function handler(req, res) {
  send(res, 200, {
    supabaseUrl: env("SUPABASE_URL"),
    supabaseAnonKey: env("SUPABASE_ANON_KEY"),
    textProvider: textProvider(),
    imagesEnabled: !!env("OPENAI_API_KEY"),
    ready: !!(env("SUPABASE_URL") && env("SUPABASE_ANON_KEY") && (env("OPENAI_API_KEY") || env("ANTHROPIC_API_KEY"))),
  });
}
