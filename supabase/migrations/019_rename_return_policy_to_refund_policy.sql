-- Rename return policy to refund policy
alter table public.profiles
  rename column return_policy_agreed_at to refund_policy_agreed_at;
