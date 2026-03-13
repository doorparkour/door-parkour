create type public.product_status as enum ('active', 'draft', 'archived');

alter table public.products
  add column status public.product_status not null default 'active';

update public.products set status = 'active' where is_active = true;
update public.products set status = 'draft'  where is_active = false;

drop policy "products: public read" on public.products;
create policy "products: public read"
  on public.products for select
  using (status = 'active');

alter table public.products drop column is_active;
