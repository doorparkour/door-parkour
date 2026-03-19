-- Add participant_name for Youth classes (parent books, child attends)
alter table public.bookings
  add column participant_name text;
