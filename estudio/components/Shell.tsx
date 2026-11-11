"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const isLogin = path === "/login";

  useEffect(() => {
    sb()
      .auth.getUser()
      .then(({ data }) => {
        if (!data.user && !isLogin) router.replace("/login");
        else if (data.user && isLogin) router.replace("/");
        setEmail(data.user?.email ?? null);
        setReady(true);
      });
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!ready || !email) return <div className="center-page" style={{ color: "var(--muted)" }}>Carregando…</div>;

  const link = (href: string, label: string) => (
    <Link href={href} className={path === href || (href !== "/" && path.startsWith(href)) ? "on" : ""}>
      {label}
    </Link>
  );

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          Estúdio <span>Avenir</span>
        </div>
        <nav className="nav">
          {link("/", "Clientes")}
          {link("/gerar", "Gerar imagens")}
          {link("/config", "Configurações")}
        </nav>
        <div className="grow" />
        <div style={{ fontSize: 12, color: "var(--muted)", padding: "0 10px 8px" }}>{email}</div>
        <button
          className="ghost small"
          onClick={async () => {
            await sb().auth.signOut();
            router.replace("/login");
          }}
        >
          Sair
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
