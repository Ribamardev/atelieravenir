"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await sb().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError("E-mail ou senha incorretos.");
    else router.replace("/");
  }

  return (
    <div className="center-page">
      <form className="card stack" style={{ width: 360 }} onSubmit={submit}>
        <div className="brand" style={{ padding: 0 }}>
          Estúdio <span style={{ color: "var(--accent)" }}>Avenir</span>
        </div>
        <div>
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="err">{error}</div>}
        <button disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}
