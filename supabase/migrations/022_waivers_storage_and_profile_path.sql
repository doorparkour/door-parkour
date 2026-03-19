-- Waivers bucket: private, server uploads only
insert into storage.buckets (id, name, public)
values ('waivers', 'waivers', false)
on conflict (id) do nothing;

-- Service role uploads (no RLS policy needed for service role)
-- Users can read their own waiver via app (signed URL or API)
-- No direct user access; download goes through API route

-- Add waiver PDF path to profiles
alter table public.profiles
  add column waiver_pdf_path text;
