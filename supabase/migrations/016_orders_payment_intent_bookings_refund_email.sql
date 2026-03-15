-- Add stripe_payment_intent_id to orders for reliable refund webhook lookup
alter table public.orders
  add column stripe_payment_intent_id text;

-- Add refund_email_sent_at to bookings for idempotent refund email sending
alter table public.bookings
  add column refund_email_sent_at timestamptz;
