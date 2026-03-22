-- One-time written review per account (class + coaching); marketing consent flag

create table public.member_feedback (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references auth.users(id) on delete cascade,
  message              text not null,
  consent_testimonial  boolean not null default false,
  created_at           timestamptz not null default now(),

  constraint member_feedback_message_len check (char_length(message) <= 2000)
);

create index member_feedback_created_at_idx on public.member_feedback (created_at desc);
create index member_feedback_consent_idx on public.member_feedback (consent_testimonial) where consent_testimonial = true;

alter table public.member_feedback enable row level security;

create policy "member_feedback: own insert"
  on public.member_feedback for insert
  with check (auth.uid() = user_id);

create policy "member_feedback: own read"
  on public.member_feedback for select
  using (auth.uid() = user_id);

create policy "member_feedback: admin read"
  on public.member_feedback for select
  using (public.is_admin());
