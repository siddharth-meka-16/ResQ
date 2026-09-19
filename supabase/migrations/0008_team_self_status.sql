-- ============================================================
-- ResQ — Field team manages its own team row
-- Run in Supabase SQL Editor AFTER 0001..0007
-- ============================================================

-- FIELD_TEAM members may update the team they've claimed: duty status,
-- confirmed-return, and GPS position refreshes. Scope is limited to the
-- row where managed_by_id = auth.uid().
drop policy if exists "teams_field_own_row" on public.resource_teams;
create policy "teams_field_own_row"
on public.resource_teams for update to authenticated
using (
  managed_by_id = auth.uid()
  and public.has_role(array['FIELD_TEAM']::public.user_role[])
)
with check (managed_by_id = auth.uid());
