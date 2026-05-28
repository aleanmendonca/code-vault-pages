-- Tags reutilizaveis: cria uma lista de tags por usuario (selecionavel) e o
-- vinculo projeto <-> tag, com RLS e backfill das tags que ja existem nos
-- arrays projects.tags.
--
-- Como aplicar:
--   Supabase Dashboard -> SQL Editor -> cole e rode este arquivo.
--   (idempotente: pode rodar mais de uma vez sem erro)

-- 1. Tabelas -----------------------------------------------------------------

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.project_tags (
  project_id uuid not null references public.projects (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, tag_id)
);

create index if not exists tags_user_id_idx on public.tags (user_id);
create index if not exists project_tags_tag_id_idx on public.project_tags (tag_id);

-- 2. RLS ---------------------------------------------------------------------

alter table public.tags enable row level security;
alter table public.project_tags enable row level security;

drop policy if exists "tags_select_own" on public.tags;
drop policy if exists "tags_insert_own" on public.tags;
drop policy if exists "tags_update_own" on public.tags;
drop policy if exists "tags_delete_own" on public.tags;

create policy "tags_select_own" on public.tags
  for select using (auth.uid() = user_id);
create policy "tags_insert_own" on public.tags
  for insert with check (auth.uid() = user_id);
create policy "tags_update_own" on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tags_delete_own" on public.tags
  for delete using (auth.uid() = user_id);

drop policy if exists "project_tags_select_own" on public.project_tags;
drop policy if exists "project_tags_insert_own" on public.project_tags;
drop policy if exists "project_tags_delete_own" on public.project_tags;

-- o dono da tag (== dono do projeto) gerencia os vinculos
create policy "project_tags_select_own" on public.project_tags
  for select using (
    exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );
create policy "project_tags_insert_own" on public.project_tags
  for insert with check (
    exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );
create policy "project_tags_delete_own" on public.project_tags
  for delete using (
    exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );

-- 3. Backfill a partir dos arrays projects.tags ------------------------------

insert into public.tags (user_id, name)
select distinct p.user_id, trim(t.name)
from public.projects p
cross join lateral unnest(p.tags) as t (name)
where t.name is not null and length(trim(t.name)) > 0
on conflict (user_id, name) do nothing;

insert into public.project_tags (project_id, tag_id)
select distinct p.id, tg.id
from public.projects p
cross join lateral unnest(p.tags) as t (name)
join public.tags tg on tg.user_id = p.user_id and tg.name = trim(t.name)
on conflict do nothing;
