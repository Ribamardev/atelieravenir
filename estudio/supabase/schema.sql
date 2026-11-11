-- Estúdio Avenir — social media com Higgsfield
-- Rodar uma vez no SQL Editor do Supabase. Tudo com prefixo sm_ para não misturar com o Atelier.

create table if not exists sm_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segment text,                         -- ex.: hospital, clínica odontológica
  palette text[] default '{}',          -- HEX da marca
  brand_notes text,                     -- tom, estilo, o que a marca é
  rules text,                           -- o que nunca pode aparecer
  created_at timestamptz default now()
);

create table if not exists sm_references (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references sm_clients(id) on delete cascade,
  storage_path text not null,
  notes text,                           -- o que aproveitar desta referência
  created_at timestamptz default now()
);

create table if not exists sm_models (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  path text not null,                   -- ex.: /higgsfield-ai/soul/v2/standard
  image_field text,                     -- campo de referências (ex.: image_urls). Vazio = só texto
  image_field_is_list boolean default true,
  max_refs int default 4,
  aspect_ratios text[] default '{9:16,4:5,3:4,1:1}',
  num_images_field text default 'num_images',
  extra jsonb default '{}',             -- parâmetros fixos (ex.: {"resolution":"2K"})
  active boolean default true,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table if not exists sm_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references sm_clients(id) on delete cascade,
  model_id uuid references sm_models(id),
  format text not null check (format in ('feed','story')),
  title text,
  summary_pt text,
  prompt text not null,
  reference_ids uuid[] default '{}',
  aspect_ratio text,
  hf_request_id text,
  status text default 'queued',         -- queued | in_progress | completed | failed | nsfw | canceled
  error text,
  created_at timestamptz default now()
);

create table if not exists sm_images (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references sm_jobs(id) on delete cascade,
  client_id uuid references sm_clients(id) on delete cascade,
  storage_path text not null,
  review text default 'pending' check (review in ('pending','approved','rejected')),
  feedback text,
  created_at timestamptz default now()
);

-- Kit de marca: logos, manual de marca (PDF), arquivos de fonte e outros
alter table sm_clients add column if not exists fonts text;   -- ex.: "Títulos: Montserrat Bold; Texto: Inter"

create table if not exists sm_brand_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references sm_clients(id) on delete cascade,
  kind text not null check (kind in ('logo','manual','font','other')),
  name text,
  storage_path text not null,
  mime text,
  is_primary boolean default false,     -- logo principal (usado no download com logo)
  created_at timestamptz default now()
);

create index if not exists sm_images_client_idx on sm_images(client_id, created_at desc);
create index if not exists sm_jobs_client_idx on sm_jobs(client_id, created_at desc);

-- Acesso: qualquer usuário logado (uso interno da Avenir)
alter table sm_clients enable row level security;
alter table sm_references enable row level security;
alter table sm_models enable row level security;
alter table sm_jobs enable row level security;
alter table sm_images enable row level security;
alter table sm_brand_assets enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sm_clients','sm_references','sm_models','sm_jobs','sm_images','sm_brand_assets'] loop
    execute format('drop policy if exists "auth_all" on %I', t);
    execute format('create policy "auth_all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Bucket privado para referências e imagens geradas
insert into storage.buckets (id, name, public) values ('sm-media','sm-media', false)
on conflict (id) do nothing;

drop policy if exists "sm_media_auth" on storage.objects;
create policy "sm_media_auth" on storage.objects for all to authenticated
  using (bucket_id = 'sm-media') with check (bucket_id = 'sm-media');

-- Modelos iniciais. Confira os caminhos no console.higgsfield.ai e ajuste na tela Configurações.
insert into sm_models (label, path, image_field, max_refs, aspect_ratios, extra, active, is_default)
select 'Soul 2 (só texto)', '/higgsfield-ai/soul/v2/standard', null, 0,
       '{9:16,4:5,3:4,1:1}', '{"resolution":"2K"}', true, true
where not exists (select 1 from sm_models);

insert into sm_models (label, path, image_field, max_refs, aspect_ratios, extra, active, is_default)
select 'Nano Banana Pro (com referências)', '/CONFIRMAR-NO-CONSOLE', 'image_urls', 8,
       '{9:16,4:5,3:4,1:1}', '{}', false, false
where not exists (select 1 from sm_models where label like 'Nano Banana%');
