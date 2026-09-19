-- ============================================================
-- ResQ ??" Simulated-incident flag
-- Run in Supabase SQL Editor AFTER 0001..0009
-- ============================================================
-- Marks incidents injected by the simulation engine so the demo
-- Reset removes only simulation artifacts, preserving real
-- reports and the seed dataset.

alter table public.incidents
  add column if not exists is_simulated boolean not null default false;
