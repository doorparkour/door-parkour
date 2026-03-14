-- Bookings: admins can read and update all (for manual refunds, service recovery)
create policy "bookings: admin read"
  on public.bookings for select
  using (public.is_admin());

create policy "bookings: admin update"
  on public.bookings for update
  using (public.is_admin())
  with check (public.is_admin());
