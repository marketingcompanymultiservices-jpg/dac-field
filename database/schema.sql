create extension if not exists "pgcrypto";

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  status text not null default 'En ejecución',
  progress numeric(5,2) not null default 0,
  director_id uuid references users(id),
  resident_id uuid references users(id),
  auditor_name text,
  technical_supervisor_name text,
  address text,
  city text,
  start_date date,
  contractual_end_date date,
  created_at timestamptz not null default now()
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  code text,
  name text not null,
  planned_amount numeric(14,2) not null default 0,
  executed_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table daily_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  report_date date not null,
  report_time time,
  weather text,
  administrative_staff text,
  operative_staff text,
  contractors_present text,
  equipment_used text,
  material_received text,
  observations text,
  problems text,
  actions_taken text,
  commitments text,
  resident_signature text,
  status text not null default 'draft',
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table daily_report_activities (
  id uuid primary key default gen_random_uuid(),
  daily_report_id uuid not null references daily_reports(id) on delete cascade,
  activity text not null,
  executed_quantity text,
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  daily_report_id uuid references daily_reports(id) on delete set null,
  url text not null,
  caption text,
  taken_at timestamptz,
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid references users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table commitments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  daily_report_id uuid references daily_reports(id) on delete set null,
  title text not null,
  owner_id uuid references users(id),
  due_date date,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  document_type text,
  url text not null,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  event_time timestamptz not null default now(),
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
