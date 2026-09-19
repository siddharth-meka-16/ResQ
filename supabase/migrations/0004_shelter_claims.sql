-- ============================================================
-- ResQ — Shelter Manager Claims
-- Run in Supabase SQL Editor AFTER 0001..0003
-- ============================================================

-- SHELTER_MANAGER profiles may claim a shelter that has no manager.
-- Mirrors "teams_claim_unmanaged" (0002) for resource teams.
drop policy if exists "shelters_claim_unmanaged" on public.shelters;
create policy "shelters_claim_unmanaged"
on public.shelters for update to authenticatedin
using (
  managed_by_id is null
  and public.has_role(array['SHELTER_MANAGER']::public.user_role[])
)
with check (
  managed_by_id = auth.uid()
  or public.has_role(array['OPERATOR', 'ADMIN']::public.user_role[])
);
