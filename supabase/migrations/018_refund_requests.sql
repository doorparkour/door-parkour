-- Refund requests for merch orders
-- Return policy agreement on profiles
-- Admin read access to orders

create type public.refund_request_status as enum ('pending', 'approved', 'rejected');

create table public.refund_requests (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      public.refund_request_status not null default 'pending',
  requested_at timestamptz default now() not null,
  decided_at  timestamptz,
  decided_by  uuid references auth.users(id) on delete set null,
  reason      text
);

create unique index refund_requests_order_pending_idx
  on public.refund_requests (order_id)
  where status = 'pending';

create index refund_requests_order_idx on public.refund_requests (order_id);
create index refund_requests_user_idx on public.refund_requests (user_id);
create index refund_requests_status_idx on public.refund_requests (status);

alter table public.refund_requests enable row level security;

create policy "refund_requests: own insert"
  on public.refund_requests for insert
  with check (auth.uid() = user_id);

create policy "refund_requests: own read"
  on public.refund_requests for select
  using (auth.uid() = user_id);

create policy "refund_requests: admin read"
  on public.refund_requests for select
  using (public.is_admin());

create policy "refund_requests: admin update"
  on public.refund_requests for update
  using (public.is_admin())
  with check (public.is_admin());

-- Orders: admin read for refund requests page
create policy "orders: admin read"
  on public.orders for select
  using (public.is_admin());

-- Order items: admin read for refund requests page
create policy "order_items: admin read"
  on public.order_items for select
  using (public.is_admin());

-- Return policy agreement on profiles
alter table public.profiles
  add column return_policy_agreed_at timestamptz;
