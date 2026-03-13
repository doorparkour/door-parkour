alter table public.products
  add column size text check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL'));
