# Sprint 5.2 - Integracion Supabase

## Objetivo

Conectar DAC con el proyecto Supabase existente, preparando autenticacion, clientes Supabase, tabla `profiles`, RLS y politicas iniciales.

## Cambios realizados

### Clientes Supabase

Se crearon clientes separados:

- `lib/supabase/browser.ts`
- `lib/supabase/server.ts`

Se mantiene compatibilidad con:

- `lib/supabaseClient.ts`

### Profiles

Se creo helper:

- `lib/supabase/profiles.ts`

Funciones:

- `ensureUserProfile(user, localUsers)`
- `mapProfileToAdminUser(profile)`

Al iniciar sesion, DAC busca el perfil en `public.profiles`. Si no existe, lo crea automaticamente usando:

- `auth.users.id`
- nombre local si existe
- correo autenticado
- rol local si existe
- estado activo

### AuthProvider

Se actualizo:

- `components/AuthProvider.tsx`

Ahora, despues de obtener sesion o iniciar sesion:

- Sincroniza el usuario con `profiles`.
- Usa el perfil remoto para mostrar nombre y rol.
- Mantiene el login actual funcionando con Supabase Auth.

## Variables de entorno necesarias

En Vercel y en local:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Tambien quedan preparadas:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## Migracion realizada

Archivo generado:

- `database/sprint-5-2-profiles.sql`

Esta migracion crea:

- Tabla `public.profiles`.
- Indices por correo y rol.
- RLS.
- Funciones auxiliares para rol actual.
- Politicas para Administrador, Director y Secretaria/Auxiliar Administrativa.

## SQL generado

```sql
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
```

## Politicas

- Administrador: acceso total.
- Director / Director Administrativo: lectura y escritura.
- Secretaria / Auxiliar Administrativa: lectura.
- Usuario autenticado: puede crear y leer/actualizar su propio perfil.

## No modificado

Se mantienen mocks temporales para:

- Proyectos.
- Presupuesto.
- Avance.
- Reportes.
- Documentos.

La interfaz existente no fue modificada.

## Validacion

`next build` compila correctamente.

## Correccion minima de login - diagnostico produccion

Se confirma que el cliente lee:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

El login usa:

- `supabase.auth.signInWithPassword`

Correccion aplicada:

- El correo se normaliza con `trim().toLowerCase()` antes de enviarlo a Supabase.
- La contrasena se limpia con `trim()` antes de enviarla.
- Se imprime en consola el estado real de configuracion Supabase:
  - `isConfigured`
  - `url`
  - `hasAnonKey`
- Se imprime en consola el error real devuelto por Supabase durante `signInWithPassword`.

No se modificaron:

- Diseno.
- Modulos.
- Tablas.
- Permisos.
- RLS.
