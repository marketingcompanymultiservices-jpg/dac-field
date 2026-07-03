create table if not exists public.direction_inspections (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  project_name text not null,
  created_at timestamptz not null default now(),
  created_by text not null,
  director text not null,
  responsible text not null,
  status text not null check (status in ('Pendiente', 'En proceso', 'Atendida', 'Cerrada')),
  tower text,
  floor text,
  apartment text,
  work_front text,
  category text not null,
  priority text not null check (priority in ('Baja', 'Media', 'Alta', 'Critica')),
  description text not null,
  due_date date not null,
  commitment_notes text,
  observation_photo_ids text[] not null default '{}',
  response text,
  attended_at timestamptz,
  correction_photo_ids text[] not null default '{}',
  closed_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by text not null
);

create table if not exists public.direction_inspection_history (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.direction_inspections(id) on delete cascade,
  user_name text not null,
  action text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create index if not exists direction_inspections_project_idx on public.direction_inspections(project_id);
create index if not exists direction_inspections_responsible_idx on public.direction_inspections(responsible);
create index if not exists direction_inspections_status_idx on public.direction_inspections(status);
create index if not exists direction_inspections_priority_idx on public.direction_inspections(priority);
create index if not exists direction_inspections_category_idx on public.direction_inspections(category);
create index if not exists direction_inspections_due_date_idx on public.direction_inspections(due_date);

alter table public.direction_inspections enable row level security;
alter table public.direction_inspection_history enable row level security;

drop policy if exists "direction_inspections_select_policy" on public.direction_inspections;
create policy "direction_inspections_select_policy"
on public.direction_inspections
for select
to authenticated
using (true);

drop policy if exists "direction_inspections_write_policy" on public.direction_inspections;
create policy "direction_inspections_write_policy"
on public.direction_inspections
for all
to authenticated
using (
  public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra')
)
with check (
  public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra')
);

drop policy if exists "direction_inspection_history_select_policy" on public.direction_inspection_history;
create policy "direction_inspection_history_select_policy"
on public.direction_inspection_history
for select
to authenticated
using (true);

drop policy if exists "direction_inspection_history_write_policy" on public.direction_inspection_history;
create policy "direction_inspection_history_write_policy"
on public.direction_inspection_history
for insert
to authenticated
with check (
  public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra')
);
