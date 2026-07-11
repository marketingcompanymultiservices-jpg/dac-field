insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update
set public = false;

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
  and public.current_profile_role() in (
    'Administrador',
    'Director Administrativo'
  )
);
