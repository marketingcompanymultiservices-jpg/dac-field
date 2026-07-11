insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  name text not null,
  folder text not null,
  version integer not null default 1,
  status text not null default 'Vigente',
  upload_date date not null default current_date,
  expiration_date date,
  uploaded_by text not null,
  uploaded_by_email text,
  observation text not null default '',
  file_name text not null,
  file_type text,
  file_size bigint,
  storage_path text not null,
  public_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_documents_status_check check (
    status in ('Vigente', 'Proxima a vencer', 'Reemplazado', 'Archivado')
  )
);

create index if not exists project_documents_project_idx
on public.project_documents(project_id);

create index if not exists project_documents_folder_idx
on public.project_documents(folder);

create index if not exists project_documents_uploaded_by_email_idx
on public.project_documents(uploaded_by_email);

alter table public.project_documents enable row level security;

drop policy if exists "project_documents_select_policy" on public.project_documents;
create policy "project_documents_select_policy"
on public.project_documents
for select
to authenticated
using (
  public.current_profile_role() in (
    'Administrador',
    'Director Administrativo',
    'Director',
    'Residente de Obra',
    'Interventoria',
    'Gestion Documental',
    'Auxiliar Administrativa',
    'Consulta'
  )
);

drop policy if exists "project_documents_insert_policy" on public.project_documents;
create policy "project_documents_insert_policy"
on public.project_documents
for insert
to authenticated
with check (
  public.current_profile_role() in (
    'Administrador',
    'Director Administrativo',
    'Director',
    'Gestion Documental',
    'Auxiliar Administrativa'
  )
);

drop policy if exists "project_documents_update_policy" on public.project_documents;
create policy "project_documents_update_policy"
on public.project_documents
for update
to authenticated
using (
  public.current_profile_role() in (
    'Administrador',
    'Director Administrativo',
    'Director',
    'Gestion Documental',
    'Auxiliar Administrativa'
  )
)
with check (
  public.current_profile_role() in (
    'Administrador',
    'Director Administrativo',
    'Director',
    'Gestion Documental',
    'Auxiliar Administrativa'
  )
);

drop policy if exists "project_documents_delete_policy" on public.project_documents;
create policy "project_documents_delete_policy"
on public.project_documents
for delete
to authenticated
using (
  public.current_profile_role() in ('Administrador', 'Director Administrativo')
);

drop policy if exists "project_documents_storage_select_policy" on storage.objects;
create policy "project_documents_storage_select_policy"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and public.current_profile_role() in (
    'Administrador',
    'Director Administrativo',
    'Director',
    'Residente de Obra',
    'Interventoria',
    'Gestion Documental',
    'Auxiliar Administrativa',
    'Consulta'
  )
);

drop policy if exists "project_documents_storage_insert_policy" on storage.objects;
create policy "project_documents_storage_insert_policy"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.current_profile_role() in (
    'Administrador',
    'Director Administrativo',
    'Director',
    'Gestion Documental',
    'Auxiliar Administrativa'
  )
);

drop policy if exists "project_documents_storage_update_policy" on storage.objects;
create policy "project_documents_storage_update_policy"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and public.current_profile_role() in (
    'Administrador',
    'Director Administrativo',
    'Director',
    'Gestion Documental',
    'Auxiliar Administrativa'
  )
)
with check (
  bucket_id = 'documents'
  and public.current_profile_role() in (
    'Administrador',
    'Director Administrativo',
    'Director',
    'Gestion Documental',
    'Auxiliar Administrativa'
  )
);

drop policy if exists "project_documents_storage_delete_policy" on storage.objects;
create policy "project_documents_storage_delete_policy"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and public.current_profile_role() in ('Administrador', 'Director Administrativo')
);
