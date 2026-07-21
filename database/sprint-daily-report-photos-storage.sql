-- Sprint Daily Report Photos Storage
-- Migracion no destructiva para fotografias centralizadas de Registro Diario.
-- NO ejecutada por Codex.

insert into storage.buckets (id, name, public)
values ('daily-report-photos', 'daily-report-photos', false)
on conflict (id) do update
set public = false;

alter table public.report_photos
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint;

create index if not exists idx_report_photos_daily_report_storage_path
on public.report_photos (daily_report_id, storage_path);

create index if not exists idx_report_photos_project_daily_report
on public.report_photos (project_id, daily_report_id);

create unique index if not exists uq_report_photos_storage_path
on public.report_photos (storage_path)
where storage_path is not null;

alter table public.report_photos
  drop constraint if exists report_photos_size_bytes_non_negative;

alter table public.report_photos
  add constraint report_photos_size_bytes_non_negative
  check (size_bytes is null or size_bytes >= 0);

alter table public.report_photos
  drop constraint if exists report_photos_storage_path_not_blank;

alter table public.report_photos
  add constraint report_photos_storage_path_not_blank
  check (storage_path is null or length(btrim(storage_path)) > 0);

create or replace function public.storage_daily_report_photo_project_id(p_object_name text)
returns text
language sql
stable
as $$
  select case
    when split_part(coalesce(p_object_name, ''), '/', 1) = 'daily-reports'
      and length(split_part(coalesce(p_object_name, ''), '/', 2)) > 0
    then split_part(p_object_name, '/', 2)
    else null
  end
$$;

create or replace function public.can_access_project(p_project_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.activo = true
        and p.rol in (
          'Administrador',
          'Director Administrativo',
          'Director',
          'Residente de Obra',
          'Interventoria',
          'Interventoria',
          'Supervisor Tecnico',
          'Gestion Documental',
          'Gestion Documental',
          'Consulta'
        )
    )
    and (
      exists (select 1 from public.daily_reports dr where dr.project_id = p_project_id)
      or exists (select 1 from public.project_budget_versions pbv where pbv.project_id = p_project_id)
      or exists (select 1 from public.project_budget_items pbi where pbi.project_id = p_project_id)
      or exists (select 1 from public.project_documents pd where pd.project_id = p_project_id)
      or exists (select 1 from public.direction_inspections di where di.project_id = p_project_id)
    )
$$;

create or replace function public.can_write_project_daily_report_photos(p_project_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.can_access_project(p_project_id)
    and public.current_profile_role() in (
      'Administrador',
      'Director Administrativo',
      'Director',
      'Residente de Obra'
    )
$$;

create or replace function public.can_delete_project_daily_report_photos(p_project_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.can_access_project(p_project_id)
    and public.current_profile_role() in (
      'Administrador',
      'Director Administrativo',
      'Director'
    )
$$;

drop policy if exists "daily_report_photos_storage_select_authorized" on storage.objects;
create policy "daily_report_photos_storage_select_authorized"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'daily-report-photos'
  and public.can_access_project(public.storage_daily_report_photo_project_id(name))
);

drop policy if exists "daily_report_photos_storage_insert_authorized" on storage.objects;
create policy "daily_report_photos_storage_insert_authorized"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'daily-report-photos'
  and split_part(name, '/', 1) = 'daily-reports'
  and length(split_part(name, '/', 2)) > 0
  and length(split_part(name, '/', 3)) > 0
  and length(split_part(name, '/', 4)) > 0
  and public.can_write_project_daily_report_photos(public.storage_daily_report_photo_project_id(name))
);

drop policy if exists "daily_report_photos_storage_update_authorized" on storage.objects;

drop policy if exists "daily_report_photos_storage_delete_authorized" on storage.objects;
create policy "daily_report_photos_storage_delete_authorized"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'daily-report-photos'
  and public.can_delete_project_daily_report_photos(public.storage_daily_report_photo_project_id(name))
);

create or replace function public.save_daily_report_bundle(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p_project_id text := payload->>'project_id';
  p_report jsonb := payload->'report';
  p_report_id text := payload->'report'->>'id';
  p_role text := public.current_profile_role();
  p_activity jsonb;
  p_photo jsonb;
  p_commitment jsonb;
  p_activity_count integer := 0;
  p_photo_count integer := 0;
  p_commitment_count integer := 0;
begin
  if p_project_id is null or p_project_id = '' then
    raise exception 'project_id es obligatorio para guardar reporte diario';
  end if;

  if p_report_id is null or p_report_id = '' then
    raise exception 'report.id es obligatorio para guardar reporte diario';
  end if;

  if p_role not in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra') then
    raise exception 'Rol no autorizado para guardar reporte diario: %', p_role;
  end if;

  insert into public.daily_reports (
    id,
    project_id,
    report_date,
    report_time,
    weather,
    administrative_staff,
    operative_staff,
    contractors,
    equipment,
    material,
    observations,
    problems,
    actions,
    signature,
    status,
    created_by,
    updated_by,
    updated_at
  )
  values (
    p_report_id,
    p_project_id,
    (p_report->>'date')::date,
    coalesce(p_report->>'time', ''),
    p_report->>'weather',
    p_report->>'administrativeStaff',
    p_report->>'operativeStaff',
    p_report->>'contractors',
    p_report->>'equipment',
    p_report->>'material',
    p_report->>'observations',
    p_report->>'problems',
    p_report->>'actions',
    p_report->>'signature',
    coalesce(p_report->>'status', 'Borrador'),
    p_report->>'createdBy',
    p_report->>'updatedBy',
    now()
  )
  on conflict (id) do update
  set
    project_id = excluded.project_id,
    report_date = excluded.report_date,
    report_time = excluded.report_time,
    weather = excluded.weather,
    administrative_staff = excluded.administrative_staff,
    operative_staff = excluded.operative_staff,
    contractors = excluded.contractors,
    equipment = excluded.equipment,
    material = excluded.material,
    observations = excluded.observations,
    problems = excluded.problems,
    actions = excluded.actions,
    signature = excluded.signature,
    status = excluded.status,
    updated_by = excluded.updated_by,
    updated_at = now();

  delete from public.report_activities where daily_report_id = p_report_id;

  for p_activity in
    select value from jsonb_array_elements(coalesce(payload->'activities', '[]'::jsonb))
  loop
    insert into public.report_activities (
      id,
      daily_report_id,
      project_id,
      budget_item_id,
      activity,
      unit,
      quantity,
      observation,
      work_front,
      owner,
      start_time,
      end_time,
      photo_count,
      activity_date,
      activity_time,
      created_by,
      updated_by,
      updated_at
    )
    values (
      p_activity->>'id',
      p_report_id,
      p_project_id,
      p_activity->>'budgetItemId',
      coalesce(p_activity->>'activity', ''),
      p_activity->>'unit',
      coalesce(nullif(p_activity->>'quantity', '')::numeric, 0),
      p_activity->>'observation',
      p_activity->>'workFront',
      p_activity->>'owner',
      p_activity->>'startTime',
      p_activity->>'endTime',
      case when p_activity ? 'photoCount' then nullif(p_activity->>'photoCount', '')::integer else null end,
      (p_activity->>'date')::date,
      p_activity->>'time',
      p_activity->>'createdBy',
      p_activity->>'updatedBy',
      now()
    );
    p_activity_count := p_activity_count + 1;
  end loop;

  delete from public.report_photos where daily_report_id = p_report_id;

  for p_photo in
    select value from jsonb_array_elements(coalesce(payload->'photos', '[]'::jsonb))
  loop
    if coalesce(p_photo->>'storagePath', p_photo->>'storage_path') is not null
      and length(btrim(coalesce(p_photo->>'storagePath', p_photo->>'storage_path'))) = 0 then
      raise exception 'storage_path no puede estar vacio para fotografia %', p_photo->>'id';
    end if;

    insert into public.report_photos (
      id,
      daily_report_id,
      project_id,
      name,
      photo_date,
      photo_time,
      user_name,
      description,
      activity_id,
      storage,
      file_type,
      file_size,
      image_data,
      storage_path,
      mime_type,
      size_bytes,
      created_by,
      updated_by,
      updated_at
    )
    values (
      p_photo->>'id',
      p_report_id,
      p_project_id,
      coalesce(p_photo->>'name', 'fotografia'),
      (p_photo->>'date')::date,
      p_photo->>'time',
      p_photo->>'user',
      p_photo->>'description',
      p_photo->>'activityId',
      p_photo->>'storage',
      coalesce(p_photo->>'type', p_photo->>'mimeType', p_photo->>'mime_type'),
      case
        when p_photo ? 'size' then nullif(p_photo->>'size', '')::bigint
        when p_photo ? 'sizeBytes' then nullif(p_photo->>'sizeBytes', '')::bigint
        when p_photo ? 'size_bytes' then nullif(p_photo->>'size_bytes', '')::bigint
        else null
      end,
      p_photo->>'imageData',
      coalesce(p_photo->>'storagePath', p_photo->>'storage_path'),
      coalesce(p_photo->>'mimeType', p_photo->>'mime_type', p_photo->>'type'),
      case
        when p_photo ? 'sizeBytes' then nullif(p_photo->>'sizeBytes', '')::bigint
        when p_photo ? 'size_bytes' then nullif(p_photo->>'size_bytes', '')::bigint
        when p_photo ? 'size' then nullif(p_photo->>'size', '')::bigint
        else null
      end,
      p_photo->>'createdBy',
      p_photo->>'updatedBy',
      now()
    );
    p_photo_count := p_photo_count + 1;
  end loop;

  for p_commitment in
    select value from jsonb_array_elements(coalesce(payload->'commitments', '[]'::jsonb))
  loop
    insert into public.commitments (
      id,
      project_id,
      daily_report_id,
      budget_item_id,
      description,
      owner,
      due_date,
      priority,
      status,
      origin,
      created_at,
      updated_at,
      created_by,
      updated_by
    )
    values (
      p_commitment->>'id',
      p_project_id,
      p_report_id,
      p_commitment->>'budgetItemId',
      coalesce(p_commitment->>'description', ''),
      coalesce(p_commitment->>'owner', ''),
      (p_commitment->>'dueDate')::date,
      coalesce(p_commitment->>'priority', 'Media'),
      coalesce(p_commitment->>'status', 'Pendiente'),
      coalesce(p_commitment->>'origin', 'Registro Diario'),
      coalesce(nullif(p_commitment->>'createdAt', '')::timestamptz, now()),
      now(),
      p_commitment->>'createdBy',
      p_commitment->>'updatedBy'
    )
    on conflict (id) do update
    set
      project_id = excluded.project_id,
      daily_report_id = excluded.daily_report_id,
      budget_item_id = excluded.budget_item_id,
      description = excluded.description,
      owner = excluded.owner,
      due_date = excluded.due_date,
      priority = excluded.priority,
      status = excluded.status,
      origin = excluded.origin,
      updated_at = now(),
      updated_by = excluded.updated_by;
    p_commitment_count := p_commitment_count + 1;
  end loop;

  return jsonb_build_object(
    'project_id', p_project_id,
    'report_id', p_report_id,
    'activities_saved', p_activity_count,
    'photos_saved', p_photo_count,
    'commitments_saved', p_commitment_count
  );
end;
$$;

grant execute on function public.save_daily_report_bundle(jsonb) to authenticated;
