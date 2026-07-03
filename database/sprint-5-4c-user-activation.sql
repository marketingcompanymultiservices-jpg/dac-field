alter table public.profiles
add column if not exists must_change_password boolean not null default false;

create index if not exists profiles_must_change_password_idx
on public.profiles (must_change_password);

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
