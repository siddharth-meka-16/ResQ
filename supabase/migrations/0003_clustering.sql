-- ============================================================
-- ResQ — Phase 5: report clustering
-- Run in Supabase SQL Editor AFTER 0001 + 0002
-- ============================================================

-- Cluster head = the original incident; duplicates point at it
alter table public.incidents
  add column if not exists cluster_id uuid references public.incidents(id) on delete set null;

create index if not exists idx_incidents_cluster on public.incidents (cluster_id);

-- Corroborated reports badge helper: members per head
create or replace function public.cluster_member_count(head_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer from public.incidents where cluster_id = head_id;
$$;
