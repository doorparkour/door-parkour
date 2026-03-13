alter table public.classes
  add column age_group text not null default 'adult'
  check (age_group in ('youth', 'adult'));
