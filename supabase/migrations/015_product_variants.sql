-- Product variants: one product (base) has multiple size variants.
-- Slug is per product; accessories have one variant with size=null.

-- 1. Create product_variants
create table public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size       text check (size is null or size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  inventory  integer not null default 0,
  created_at timestamptz default now() not null,

  constraint inventory_non_negative check (inventory >= 0),
  unique (product_id, size)
);

create index product_variants_product_idx on public.product_variants (product_id);

-- 2. Add variant_id to order_items (nullable until backfilled)
alter table public.order_items
  add column variant_id uuid references public.product_variants(id);

-- 3. Migrate existing data: group by base slug, create base products + variants
do $$
declare
  base_slug text;
  base_id uuid;
  prod record;
  v_id uuid;
  old_to_variant uuid[];
begin
  -- Products with size: group by base slug (strip -xs, -s, -m, -l, -xl, -xxl)
  for base_slug in
    select distinct regexp_replace(p.slug, '-(xs|s|m|l|xl|xxl)$', '', 'i')
    from public.products p
    where p.size is not null
  loop
    -- Pick first product as base (by created_at)
    select id into base_id
    from public.products
    where size is not null
      and regexp_replace(slug, '-(xs|s|m|l|xl|xxl)$', '', 'i') = base_slug
    order by created_at
    limit 1;

    -- Create variants for all products in this group
    for prod in
      select id, size, inventory
      from public.products
      where size is not null
        and regexp_replace(slug, '-(xs|s|m|l|xl|xxl)$', '', 'i') = base_slug
    loop
      insert into public.product_variants (product_id, size, inventory)
      values (base_id, prod.size, prod.inventory)
      returning id into v_id;

      -- Update order_items that referenced this old product
      update public.order_items
      set variant_id = v_id, product_id = base_id
      where product_id = prod.id;

      -- Delete non-base products
      if prod.id != base_id then
        delete from public.products where id = prod.id;
      end if;
    end loop;

    -- Update base product slug (remove size suffix)
    update public.products
    set slug = base_slug
    where id = base_id;
  end loop;

  -- Products without size (accessories): create single variant
  for prod in
    select id, inventory from public.products where size is null
  loop
    insert into public.product_variants (product_id, size, inventory)
    values (prod.id, null, prod.inventory)
    returning id into v_id;

    update public.order_items
    set variant_id = v_id
    where product_id = prod.id and variant_id is null;
  end loop;
end $$;

-- 4. Drop size and inventory from products
alter table public.products drop column if exists size;
alter table public.products drop column if exists inventory;

-- 5. Add on_demand to product_variants for accessories (inherited from product)
--    Actually on_demand stays on products - all variants of a product share it.
--    So we're good.

-- 6. RLS for product_variants (read with product)
alter table public.product_variants enable row level security;

create policy "product_variants: read with product"
  on public.product_variants for select
  using (
    exists (
      select 1 from public.products
      where products.id = product_variants.product_id
        and products.status = 'active'
    )
  );

create policy "product_variants: admin all"
  on public.product_variants for all
  using (
    auth.uid() in (select id from public.profiles where role = 'admin')
  )
  with check (
    auth.uid() in (select id from public.profiles where role = 'admin')
  );
