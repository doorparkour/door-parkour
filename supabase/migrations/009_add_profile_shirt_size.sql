alter table public.profiles
  add column shirt_size text check (shirt_size in ('XS', 'S', 'M', 'L', 'XL', 'XXL'));
