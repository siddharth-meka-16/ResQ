-- ============================================================
-- ResQ ??" Reset/delete policies
-- Run in Supabase SQL Editor AFTER 0001..0008
-- ============================================================
-- The demo-reset endpoint deletes simulated incidents and their
-- assignments. No FOR DELETE policy existed, so RLS silently
-- denied every delete and the Reset button did nothing while
-- reporting success.
-- Idempotent: safe to run multiple times.

drop policy if exists "incidents_delete_authority"
  on public.incidents;
create policy "incidents_delete_authority"
  on public.incidents
  for delete using (public.is_authority());

drop policy if exists "assignments_delete_authority"
  on public.assignments;
create policy "assignments_delete_authority"
  on public.assignments
  for delete using (public.is_authority());
