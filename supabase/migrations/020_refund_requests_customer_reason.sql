-- Customer feedback when requesting a refund (for merch improvement, not policy accountability)
alter table public.refund_requests
  add column customer_reason text;
