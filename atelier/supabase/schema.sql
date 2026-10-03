-- =========================================================
-- ATELIER — estrutura do banco (rode uma vez no Supabase:
-- SQL Editor → New query → cole tudo → Run)
-- =========================================================

-- 0) Quem pode usar o Atelier (clientes da Avenir). Este projeto do Supabase
--    pode ser compartilhado com outros sistemas, então só entra quem estiver aqui.
--    Para liberar um cliente:  insert into public.atelier_members (email, nome) values ('cliente@clinica.com', 'Clínica X');
create table if not exists public.atelier_members (
  email      text primary key,
  nome       text,
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.atelier_members enable row level security;
drop policy if exists "atelier_members: ver o próprio" on public.atelier_members;
create policy "atelier_members: ver o próprio" on public.atelier_members for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- 1) Estado de cada cliente (respostas, marca, posts) — 1 linha por usuário
create table if not exists public.atelier_user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.atelier_user_state enable row level security;

drop policy if exists "atelier_user_state: ler o próprio"      on public.atelier_user_state;
drop policy if exists "atelier_user_state: criar o próprio"    on public.atelier_user_state;
drop policy if exists "atelier_user_state: alterar o próprio"  on public.atelier_user_state;
drop policy if exists "atelier_user_state: apagar o próprio"   on public.atelier_user_state;
create policy "atelier_user_state: ler o próprio"     on public.atelier_user_state for select using (auth.uid() = user_id);
create policy "atelier_user_state: criar o próprio"   on public.atelier_user_state for insert with check (auth.uid() = user_id);
create policy "atelier_user_state: alterar o próprio" on public.atelier_user_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "atelier_user_state: apagar o próprio"  on public.atelier_user_state for delete using (auth.uid() = user_id);

-- 2) Uso mensal (para limitar custo por cliente). Só a função abaixo escreve.
create table if not exists public.atelier_usage (
  user_id     uuid not null references auth.users(id) on delete cascade,
  month       text not null,               -- ex.: 2026-10
  text_calls  integer not null default 0,
  image_calls integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, month)
);
alter table public.atelier_usage enable row level security;
drop policy if exists "atelier_usage: ler o próprio" on public.atelier_usage;
create policy "atelier_usage: ler o próprio" on public.atelier_usage for select using (auth.uid() = user_id);

-- Soma 1 uso para o usuário logado. Só soma (nunca zera nem diminui).
create or replace function public.atelier_count_usage(p_kind text, p_month text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_kind not in ('text','image') then raise exception 'invalid kind'; end if;
  insert into public.atelier_usage (user_id, month, text_calls, image_calls, updated_at)
  values (auth.uid(), p_month, case when p_kind='text' then 1 else 0 end, case when p_kind='image' then 1 else 0 end, now())
  on conflict (user_id, month) do update set
    text_calls  = public.atelier_usage.text_calls  + case when p_kind='text'  then 1 else 0 end,
    image_calls = public.atelier_usage.image_calls + case when p_kind='image' then 1 else 0 end,
    updated_at  = now();
end;
$$;
revoke all on function public.atelier_count_usage(text, text) from public, anon;
grant execute on function public.atelier_count_usage(text, text) to authenticated;

-- 3) Arquivos (logo, fotos, imagens geradas) — bucket privado "atelier-assets"
--    Cada cliente só acessa a própria pasta: atelier-assets/<id-do-usuário>/...
insert into storage.buckets (id, name, public)
values ('atelier-assets', 'atelier-assets', false)
on conflict (id) do nothing;

drop policy if exists "atelier-assets: ler os próprios"    on storage.objects;
drop policy if exists "atelier-assets: enviar os próprios" on storage.objects;
drop policy if exists "atelier-assets: trocar os próprios" on storage.objects;
drop policy if exists "atelier-assets: apagar os próprios" on storage.objects;
create policy "atelier-assets: ler os próprios"    on storage.objects for select using (bucket_id = 'atelier-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "atelier-assets: enviar os próprios" on storage.objects for insert with check (bucket_id = 'atelier-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "atelier-assets: trocar os próprios" on storage.objects for update using (bucket_id = 'atelier-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "atelier-assets: apagar os próprios" on storage.objects for delete using (bucket_id = 'atelier-assets' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4) (Opcional) Ver o consumo de todos os clientes no mês:
-- select u.email, s.month, s.text_calls, s.image_calls
-- from public.atelier_usage s join auth.users u on u.id = s.user_id
-- order by s.month desc, s.image_calls desc;
