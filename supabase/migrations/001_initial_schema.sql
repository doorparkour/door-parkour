-- ============================================================
-- Door Parkour — Initial Schema
-- ============================================================

-- ── Profiles (extends auth.users) ──────────────────────────
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  full_name               text,
  phone                   text,
  avatar_url              text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  date_of_birth           date,
  created_at              timestamptz default now() not null,
  updated_at              timestamptz default now() not null
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();


-- ── Classes ─────────────────────────────────────────────────
create table public.classes (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  location        text not null,
  starts_at       timestamptz not null,
  duration_mins   integer not null default 60,
  capacity        integer not null default 10,
  spots_remaining integer not null default 10,
  price_cents     integer not null default 0,
  image_url       text,
  is_published    boolean not null default false,
  created_at      timestamptz default now() not null,

  constraint spots_non_negative check (spots_remaining >= 0),
  constraint capacity_positive  check (capacity > 0)
);

create index classes_starts_at_idx on public.classes (starts_at);
create index classes_published_idx on public.classes (is_published, starts_at);


-- ── Bookings ─────────────────────────────────────────────────
create type public.booking_status as enum ('confirmed', 'cancelled', 'waitlist');

create table public.bookings (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  class_id                  uuid not null references public.classes(id) on delete cascade,
  status                    public.booking_status not null default 'confirmed',
  stripe_payment_intent_id  text,
  created_at                timestamptz default now() not null,

  unique (user_id, class_id)
);

create index bookings_user_idx  on public.bookings (user_id);
create index bookings_class_idx on public.bookings (class_id);

-- Decrement spots_remaining when a booking is confirmed
create or replace function public.handle_booking_confirmed()
returns trigger
language plpgsql
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

create trigger bookings_manage_spots
  after insert or update of status on public.bookings
  for each row execute procedure public.handle_booking_confirmed();


-- ── Products ─────────────────────────────────────────────────
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price_cents integer not null,
  image_url   text,
  inventory   integer not null default 0,
  slug        text not null unique,
  is_active   boolean not null default true,
  created_at  timestamptz default now() not null,

  constraint price_non_negative check (price_cents >= 0),
  constraint inventory_non_negative check (inventory >= 0)
);

create index products_slug_idx on public.products (slug);
create index products_active_idx on public.products (is_active);


-- ── Orders ───────────────────────────────────────────────────
create type public.order_status as enum ('pending', 'paid', 'fulfilled', 'cancelled');

create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id  text unique,
  status                      public.order_status not null default 'pending',
  total_cents                 integer not null,
  created_at                  timestamptz default now() not null
);

create index orders_user_idx    on public.orders (user_id);
create index orders_session_idx on public.orders (stripe_checkout_session_id);


-- ── Order Items ───────────────────────────────────────────────
create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid not null references public.products(id),
  quantity         integer not null,
  unit_price_cents integer not null,
  created_at       timestamptz default now() not null,

  constraint quantity_positive check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);


-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.profiles   enable row level security;
alter table public.classes     enable row level security;
alter table public.bookings    enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;


-- Profiles: users can read/update only their own row
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);


-- Classes: anyone can read published classes
create policy "classes: public read"
  on public.classes for select
  using (is_published = true);


-- Bookings: users manage their own
create policy "bookings: own read"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "bookings: own insert"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "bookings: own update"
  on public.bookings for update
  using (auth.uid() = user_id);


-- Products: anyone can read active products
create policy "products: public read"
  on public.products for select
  using (is_active = true);


-- Orders: users see/manage their own
create policy "orders: own read"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "orders: own insert"
  on public.orders for insert
  with check (auth.uid() = user_id);


-- Order items: users see items belonging to their orders
create policy "order_items: own read"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );


-- ============================================================
-- Seed: sample data for local development
-- ============================================================
-- (Uncomment and customise as needed)
--
-- insert into public.classes (title, description, location, starts_at, duration_mins, capacity, spots_remaining, price_cents, is_published)
-- values
--   ('Intro to Parkour', 'Perfect first class. Learn safe falling, basic vaults, and balance.', 'Sunset Park, Sturgeon Bay', '2026-06-06 10:00:00-05', 90, 8, 8, 4500, true),
--   ('Intermediate Flow', 'Building on the basics — linking movements and exploring environment.', 'Third Ave Park, Sturgeon Bay', '2026-06-13 10:00:00-05', 90, 8, 8, 4500, true);
