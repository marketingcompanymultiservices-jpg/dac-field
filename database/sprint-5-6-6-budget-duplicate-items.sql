alter table public.project_budget_items
add column if not exists import_order integer;

with ordered_items as (
  select
    id,
    row_number() over (
      partition by project_id, item
      order by created_at, id
    ) as next_import_order
  from public.project_budget_items
)
update public.project_budget_items target
set import_order = ordered_items.next_import_order
from ordered_items
where target.id = ordered_items.id
  and target.import_order is null;

update public.project_budget_items
set import_order = 0
where import_order is null;

alter table public.project_budget_items
alter column import_order set default 0;

alter table public.project_budget_items
alter column import_order set not null;

alter table public.project_budget_items
drop constraint if exists project_budget_items_project_id_item_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_budget_items_project_id_item_import_order_key'
  ) then
    alter table public.project_budget_items
    add constraint project_budget_items_project_id_item_import_order_key
    unique(project_id, item, import_order);
  end if;
end $$;

create index if not exists project_budget_items_import_order_idx
on public.project_budget_items(import_order);
