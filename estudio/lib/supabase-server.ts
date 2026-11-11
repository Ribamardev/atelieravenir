import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function serverClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            /* chamado de um contexto sem escrita de cookie */
          }
        },
      },
    }
  );
}

/** Retorna o cliente autenticado ou null se não houver sessão. */
export async function requireUser() {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return supabase;
}
