-- ── Admin Role ───────────────────────────────────────────────

alter table public.profiles
  add column role text not null default 'user'
  check (role in ('user', 'admin'));

-- Helper used in RLS policies — avoids repeating the subquery
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Classes: admins can do everything, including unpublished classes
create policy "classes: admin all"
  on public.classes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Products: admins can do everything, including inactive products
create policy "products: admin all"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- Profiles: admins can read all profiles (e.g. for selecting users when managing bookings)
create policy "profiles: admin read"
  on public.profiles for select
  using (public.is_admin());
