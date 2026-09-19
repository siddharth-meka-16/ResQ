-- ============================================================
-- ResQ — Anonymous incident reports
-- Run in Supabase SQL Editor AFTER 0001..0005
-- ============================================================

-- Guests (no account) may report an emergency. reporter_id stays null,
-- so the report is unattributed; confidence scoring already accounts
-- for source, and duplicate clustering still applies.
create policy "incidents_insert_anonymous"
on public.incidents for insert to anon
with check (reporter_id is null);

-- Storage: allow guests to attach photos to their report too.
drop policy if exists "photos_insert_anonymous" on storage.objects;
create policy "photos_insert_anonymous"
on storage.objects for insert to anon
with check (bucket_id = 'incident-photos');
