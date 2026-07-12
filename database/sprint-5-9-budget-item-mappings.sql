create extension if not exists pgcrypto;

create table if not exists public.project_budget_item_mappings (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  source_budget_version_id uuid not null references public.project_budget_versions(id) on delete restrict,
  source_budget_item_id uuid not null references public.project_budget_items(id) on delete restrict,
  source_item text not null,
  source_import_order integer,
  target_budget_version_id uuid not null references public.project_budget_versions(id) on delete restrict,
  target_budget_item_id uuid references public.project_budget_items(id) on delete restrict,
  target_item text,
  target_import_order integer,
  match_type text not null,
  confidence numeric,
  observation text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now(),
  constraint project_budget_item_mappings_distinct_versions_check
    check (source_budget_version_id <> target_budget_version_id),
  constraint project_budget_item_mappings_match_type_check
    check (match_type in ('Exacto', 'Sugerido', 'Manual', 'Sin equivalencia')),
  constraint project_budget_item_mappings_target_required_check
    check (
      (
        match_type = 'Sin equivalencia'
        and target_budget_item_id is null
        and target_item is null
      )
      or
      (
        match_type in ('Exacto', 'Sugerido', 'Manual')
        and target_budget_item_id is not null
        and target_item is not null
      )
    )
);

create index if not exists project_budget_item_mappings_project_idx
on public.project_budget_item_mappings(project_id);

create index if not exists project_budget_item_mappings_source_version_idx
on public.project_budget_item_mappings(source_budget_version_id);

create index if not exists project_budget_item_mappings_target_version_idx
on public.project_budget_item_mappings(target_budget_version_id);

create index if not exists project_budget_item_mappings_source_item_idx
on public.project_budget_item_mappings(source_budget_item_id);

create index if not exists project_budget_item_mappings_target_item_idx
on public.project_budget_item_mappings(target_budget_item_id);

create unique index if not exists project_budget_item_mappings_unique_pair_idx
on public.project_budget_item_mappings(project_id, source_budget_item_id, target_budget_item_id)
where target_budget_item_id is not null;

create unique index if not exists project_budget_item_mappings_unique_no_match_idx
on public.project_budget_item_mappings(project_id, source_budget_item_id, target_budget_version_id)
where match_type = 'Sin equivalencia' and target_budget_item_id is null;

create or replace function public.set_project_budget_item_mappings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'project_budget_item_mappings_set_updated_at'
      and tgrelid = 'public.project_budget_item_mappings'::regclass
  ) then
    create trigger project_budget_item_mappings_set_updated_at
    before update on public.project_budget_item_mappings
    for each row
    execute function public.set_project_budget_item_mappings_updated_at();
  end if;
end;
$$;

alter table public.project_budget_item_mappings enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'project_budget_item_mappings'
      and policyname = 'project_budget_item_mappings_select_policy'
  ) then
    create policy "project_budget_item_mappings_select_policy"
    on public.project_budget_item_mappings
    for select
    to authenticated
    using (
      public.current_profile_role() in (
        'Administrador',
        'Director Administrativo',
        'Director',
        'Residente de Obra',
        'Interventoria',
        'Interventoría',
        'Supervisor Técnico',
        'Supervisor Tecnico',
        'Gestion Documental',
        'Auxiliar Administrativa',
        'Consulta'
      )
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'project_budget_item_mappings'
      and policyname = 'project_budget_item_mappings_insert_policy'
  ) then
    create policy "project_budget_item_mappings_insert_policy"
    on public.project_budget_item_mappings
    for insert
    to authenticated
    with check (
      public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director')
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'project_budget_item_mappings'
      and policyname = 'project_budget_item_mappings_update_policy'
  ) then
    create policy "project_budget_item_mappings_update_policy"
    on public.project_budget_item_mappings
    for update
    to authenticated
    using (
      public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director')
    )
    with check (
      public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director')
    );
  end if;
end;
$$;

grant select, insert, update on public.project_budget_item_mappings to authenticated;
