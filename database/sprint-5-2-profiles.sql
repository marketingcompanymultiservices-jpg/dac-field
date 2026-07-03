create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  correo text not null unique,
  rol text not null default 'Consulta',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists profiles_correo_idx on public.profiles (correo);
create index if not exists profiles_rol_idx on public.profiles (rol);

alter table public.profiles enable row level security;

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select rol
  from public.profiles
  where id = auth.uid()
    and activo = true
  limit 1
$$;

create or replace function public.is_profile_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_profile_role() = 'Administrador', false)
$$;

create or replace function public.is_profile_director()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_profile_role() in ('Director', 'Director Administrativo'), false)
$$;

create or replace function public.is_profile_secretaria()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_profile_role() in ('Secretaria', 'Auxiliar Administrativa'), false)
$$;

drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_profile_admin()
  or public.is_profile_director()
  or public.is_profile_secretaria()
);

drop policy if exists "profiles_insert_self_policy" on public.profiles;
create policy "profiles_insert_self_policy"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  or public.is_profile_admin()
);

drop policy if exists "profiles_update_policy" on public.profiles;
create policy "profiles_update_policy"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_profile_admin()
  or public.is_profile_director()
)
with check (
  id = auth.uid()
  or public.is_profile_admin()
  or public.is_profile_director()
);

drop policy if exists "profiles_delete_admin_policy" on public.profiles;
create policy "profiles_delete_admin_policy"
on public.profiles
for delete
to authenticated
using (public.is_profile_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
