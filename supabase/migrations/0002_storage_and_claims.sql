-- ============================================================
-- ResQ — Phase 2/4 Additions
-- Run in Supabase SQL Editor AFTER 0001_init.sql
-- ============================================================

-- ------------------------------------------------------------
-- Storage: incident photo uploads
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('incident-photos', 'incident-photos', true)
on conflict (id) do nothing;

-- Any authenticated user can upload a photo
create policy "photos_insert_authenticated"
on storage.objects for insert to authenticated
with check (bucket_id = 'incident-photos');

-- Anyone can view photos (public bucket)
create policy "photos_public_read"
on storage.objects for select
using (bucket_id = 'incident-photos');

-- ------------------------------------------------------------
-- Field teams: allow FIELD_TEAM profiles to claim an unmanaged team
-- and to update their own claimed team's status/location
-- ------------------------------------------------------------
drop policy if exists "teams_claim_unmanaged" on public.resource_teams;
create policy "teams_claim_unmanaged"
on public.resource_teams for update to authenticated
using (managed_by_id is null and public.has_role(array['FIELD_TEAM']::public.user_role[]))
with check (
  managed_by_id = auth.uid()
  or (public.has_role(array['OPERATOR', 'ADMIN']::public.user_role[]))
);

-- Field team members may always see their own team row even when
-- the generic select policy is tightened later.

-- Field teams may only escalate an incident (nothing else)
create policy "incidents_escalate_field"
on public.incidents for update to authenticated
using (public.has_role(array['FIELD_TEAM']::public.user_role[]))
with check (status = 'ESCALATED'::public.incident_status);
