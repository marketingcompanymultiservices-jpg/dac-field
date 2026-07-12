alter table public.project_budget_items
add column if not exists pending_quantity numeric(16,4);

create index if not exists project_budget_versions_project_status_idx
on public.project_budget_versions(project_id, status);

create index if not exists project_budget_items_project_version_order_idx
on public.project_budget_items(project_id, budget_version_id, import_order);

create index if not exists project_budget_items_budget_version_idx
on public.project_budget_items(budget_version_id);
