"use client";
import { useEffect, useRef, useState } from "react";
import { TERMINAL, type Job } from "@/lib/types";

/** Acompanha peças em andamento: consulta /api/jobs/:id a cada 5s até todas terminarem. */
export function useJobPolling(onChange?: () => void) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const pending = jobs.filter((j) => !TERMINAL.includes(j.status));
    if (!pending.length) return;
    timer.current = setTimeout(async () => {
      let changed = false;
      const next = [...jobs];
      // uma de cada vez para não duplicar cópias
      for (const j of pending) {
        try {
          const r = await fetch(`/api/jobs/${j.id}`, { method: "POST" });
          const body = await r.json();
          const upd: Job | undefined = body.job;
          const i = next.findIndex((x) => x.id === j.id);
          if (upd && i >= 0) {
            if (upd.status !== next[i].status) changed = true;
            next[i] = upd;
          } else if (body.error && i >= 0) {
            next[i] = { ...next[i], error: body.error };
          }
        } catch {
          /* tenta de novo no próximo ciclo */
        }
      }
      setJobs(next);
      if (changed) cb.current?.();
    }, 5000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [jobs]);

  return { jobs, track: (js: Job[]) => setJobs((cur) => [...js, ...cur]), clear: () => setJobs([]) };
}

export function statusLabel(s: string) {
  return (
    {
      queued: "Na fila",
      in_progress: "Gerando",
      completed: "Pronta",
      failed: "Falhou",
      nsfw: "Bloqueada",
      canceled: "Cancelada",
    } as Record<string, string>
  )[s] || s;
}

export function statusClass(s: string) {
  if (s === "completed") return "pill ok";
  if (["failed", "nsfw", "canceled"].includes(s)) return "pill bad";
  return "pill warn";
}
