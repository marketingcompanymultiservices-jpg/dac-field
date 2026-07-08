-- Sprint 5.7 - Registro Diario y Reportes Diarios compartidos por proyecto
-- Ejecutar en Supabase SQL Editor antes de usar el guardado real de reportes diarios.

create table if not exists public.daily_reports (
  id text primary key,
  project_id text not null,
  report_date date not null,
  report_time text not null,
  weather text,
  administrative_staff text,
  operative_staff text,
  contractors text,
  equipment text,
  material text,
  observations text,
  problems text,
  actions text,
  signature text,
  status text not null default 'Borrador' check (status in ('Borrador', 'Enviado')),
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_activities (
  id text primary key,
  daily_report_id text not null references public.daily_reports(id) on delete cascade,
  project_id text not null,
  budget_item_id text,
  activity text not null,
  unit text,
  quantity numeric not null default 0,
  observation text,
  work_front text,
  owner text,
  start_time text,
  end_time text,
  photo_count integer,
  activity_date date not null,
  activity_time text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_photos (
  id text primary key,
  daily_report_id text not null references public.daily_reports(id) on delete cascade,
  project_id text not null,
  name text not null,
  photo_date date not null,
  photo_time text,
  user_name text,
  description text,
  activity_id text,
  storage text,
  file_type text,
  file_size bigint,
  image_data text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commitments (
  id text primary key,
  project_id text,
  daily_report_id text references public.daily_reports(id) on delete set null,
  budget_item_id text,
  description text not null,
  owner text not null,
  due_date date not null,
  priority text not null default 'Media' check (priority in ('Baja', 'Media', 'Alta', 'Critica')),
  status text not null default 'Pendiente' check (status in ('Pendiente', 'En proceso', 'Vencido', 'Cumplido')),
  origin text not null default 'Registro Diario',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create index if not exists idx_daily_reports_project_date on public.daily_reports(project_id, report_date desc);
create index if not exists idx_report_activities_project_report on public.report_activities(project_id, daily_report_id);
create index if not exists idx_report_photos_project_report on public.report_photos(project_id, daily_report_id);
create index if not exists idx_commitments_project_report on public.commitments(project_id, daily_report_id);

alter table public.daily_reports enable row level security;
alter table public.report_activities enable row level security;
alter table public.report_photos enable row level security;
alter table public.commitments enable row level security;

drop policy if exists "daily_reports_select_authorized" on public.daily_reports;
drop policy if exists "daily_reports_write_authorized" on public.daily_reports;
drop policy if exists "report_activities_select_authorized" on public.report_activities;
drop policy if exists "report_activities_write_authorized" on public.report_activities;
drop policy if exists "report_photos_select_authorized" on public.report_photos;
drop policy if exists "report_photos_write_authorized" on public.report_photos;
drop policy if exists "commitments_select_authorized" on public.commitments;
drop policy if exists "commitments_write_authorized" on public.commitments;

create policy "daily_reports_select_authorized"
on public.daily_reports
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
    'Gestion Documental',
    'Gestión Documental',
    'Consulta'
  )
);

create policy "daily_reports_write_authorized"
on public.daily_reports
for all
to authenticated
using (public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra'))
with check (public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra'));

create policy "report_activities_select_authorized"
on public.report_activities
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
    'Gestion Documental',
    'Gestión Documental',
    'Consulta'
  )
);

create policy "report_activities_write_authorized"
on public.report_activities
for all
to authenticated
using (public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra'))
with check (public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra'));

create policy "report_photos_select_authorized"
on public.report_photos
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
    'Gestion Documental',
    'Gestión Documental',
    'Consulta'
  )
);

create policy "report_photos_write_authorized"
on public.report_photos
for all
to authenticated
using (public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra'))
with check (public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra'));

create policy "commitments_select_authorized"
on public.commitments
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
    'Gestion Documental',
    'Gestión Documental',
    'Consulta'
  )
);

create policy "commitments_write_authorized"
on public.commitments
for all
to authenticated
using (public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra'))
with check (public.current_profile_role() in ('Administrador', 'Director Administrativo', 'Director', 'Residente de Obra'));

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
      p_photo->>'type',
      case when p_photo ? 'size' then nullif(p_photo->>'size', '')::bigint else null end,
      p_photo->>'imageData',
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
