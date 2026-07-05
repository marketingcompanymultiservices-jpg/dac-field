create table if not exists public.project_budget_versions (
  project_id text primary key,
  version_number integer not null default 1,
  imported_at timestamptz not null default now(),
  imported_by text not null,
  file_name text not null,
  total_activities integer not null default 0,
  total_budget_value numeric(16,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.project_budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  item text not null,
  description text not null,
  unit text not null,
  quantity numeric(16,4) not null default 0,
  unit_value numeric(16,2) not null default 0,
  total_value numeric(16,2) not null default 0,
  chapter text not null default '',
  subchapter text not null default '',
  initial_progress numeric(6,2) not null default 0,
  executed_quantity numeric(16,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, item)
);

create index if not exists project_budget_items_project_idx on public.project_budget_items(project_id);
create index if not exists project_budget_items_item_idx on public.project_budget_items(item);
create index if not exists project_budget_items_chapter_idx on public.project_budget_items(chapter);
create index if not exists project_budget_items_subchapter_idx on public.project_budget_items(subchapter);

alter table public.project_budget_versions enable row level security;
alter table public.project_budget_items enable row level security;

drop policy if exists "project_budget_versions_select_policy" on public.project_budget_versions;
create policy "project_budget_versions_select_policy"
on public.project_budget_versions
for select
to authenticated
using (true);

drop policy if exists "project_budget_versions_write_policy" on public.project_budget_versions;
create policy "project_budget_versions_write_policy"
on public.project_budget_versions
for all
to authenticated
using (
  public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra', 'Interventoria')
)
with check (
  public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra', 'Interventoria')
);

drop policy if exists "project_budget_items_select_policy" on public.project_budget_items;
create policy "project_budget_items_select_policy"
on public.project_budget_items
for select
to authenticated
using (true);

drop policy if exists "project_budget_items_write_policy" on public.project_budget_items;
create policy "project_budget_items_write_policy"
on public.project_budget_items
for all
to authenticated
using (
  public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra', 'Interventoria')
)
with check (
  public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra', 'Interventoria')
);
