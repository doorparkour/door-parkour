-- Convert profile.role from text+check to proper enum
-- Must drop policies and is_admin() first (they reference role)

drop policy if exists "product_variants: admin all" on public.product_variants;
drop policy if exists "classes: admin all" on public.classes;
drop policy if exists "products: admin all" on public.products;
drop policy if exists "profiles: admin read" on public.profiles;
drop policy if exists "bookings: admin read" on public.bookings;
drop policy if exists "bookings: admin update" on public.bookings;

drop function if exists public.is_admin();

-- Drop the check constraint from 003 (compares role to text; would fail after type change)
alter table public.profiles drop constraint if exists profiles_role_check;

create type public.profile_role as enum ('user', 'admin');

alter table public.profiles
  alter column role drop default,
  alter column role type public.profile_role using role::public.profile_role,
  alter column role set default 'user'::public.profile_role;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text = 'admin'
  );
$$;

create policy "product_variants: admin all"
  on public.product_variants for all
  using (auth.uid() in (select id from public.profiles where role::text = 'admin'))
  with check (auth.uid() in (select id from public.profiles where role::text = 'admin'));

create policy "classes: admin all"
  on public.classes for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "products: admin all"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles: admin read"
  on public.profiles for select
  using (public.is_admin());

create policy "bookings: admin read"
  on public.bookings for select
  using (public.is_admin());

create policy "bookings: admin update"
  on public.bookings for update
  using (public.is_admin())
  with check (public.is_admin());
