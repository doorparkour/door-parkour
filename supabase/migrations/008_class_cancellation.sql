alter table public.classes
  add column is_cancelled boolean not null default false,
  add column cancelled_at timestamptz;
