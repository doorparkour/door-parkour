alter type public.booking_status add value if not exists 'payment_failed';
alter type public.booking_status add value if not exists 'refunded';
alter type public.booking_status add value if not exists 'partially_refunded';

alter type public.order_status add value if not exists 'payment_failed';
alter type public.order_status add value if not exists 'refunded';
alter type public.order_status add value if not exists 'partially_refunded';
