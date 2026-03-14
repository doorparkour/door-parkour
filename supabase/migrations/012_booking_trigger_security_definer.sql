-- Fix: Trigger runs in user's transaction; RLS blocks non-admin from updating classes.
-- SECURITY DEFINER lets the trigger update spots_remaining regardless of who cancelled.
create or replace function public.handle_booking_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
    update public.classes
    set spots_remaining = spots_remaining - 1
    where id = new.class_id and spots_remaining > 0;
  elsif old.status = 'confirmed' and new.status = 'cancelled' then
    update public.classes
    set spots_remaining = spots_remaining + 1
    where id = new.class_id;
  end if;
  return new;
end;
$$;
