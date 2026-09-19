-- ============================================================
-- ResQ — Initial Schema (Phase 1)
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create extension if not exists postgis;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type public.user_role as enum ('CITIZEN', 'OPERATOR', 'FIELD_TEAM', 'SHELTER_MANAGER', 'ADMIN');

create type public.incident_severity as enum ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
create type public.incident_type as enum (
  'FLOOD', 'FIRE', 'LANDSLIDE', 'STRUCTURAL_COLLAPSE',
  'MEDICAL_EMERGENCY', 'EARTHQUAKE', 'CYCLONE', 'OTHER'
);
create type public.incident_status as enum (
  'REPORTED', 'VALIDATED', 'UNASSIGNED', 'ASSIGNED', 'EN_ROUTE',
  'ON_SCENE', 'RESOLVED', 'ESCALATED', 'CANCELLED'
);
create type public.verification_status as enum ('UNVERIFIED', 'CORROBORATED', 'CONFIRMED', 'REJECTED');
create type public.report_source as enum ('APP', 'SMS', 'IVR', 'OFFICIAL', 'MANUAL');
create type public.resource_status as enum (
  'AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'RETURNING', 'UNAVAILABLE'
);
create type public.shelter_status as enum ('OPEN', 'FILLING', 'NEAR_CAPACITY', 'FULL', 'CLOSED');
create type public.assignment_status as enum (
  'PENDING', 'ACKNOWLEDGED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED', 'INTERRUPTED', 'CANCELLED'
);
create type public.alert_severity as enum ('EXTREME', 'SEVERE', 'MODERATE', 'MINOR');
create type public.alert_type as enum (
  'RAINFALL', 'FLOOD', 'CYCLONE', 'THUNDERSTORM',
  'HEATWAVE', 'EARTHQUAKE', 'TSUNAMI', 'LANDSLIDE', 'OTHER'
);
create type public.alert_source as enum ('IMD', 'CWC', 'NDMA', 'MANUAL');
create type public.stock_item_type as enum (
  'FOOD', 'WATER', 'MEDICAL', 'BLANKETS', 'CLOTHING', 'SANITATION', 'TENTS', 'OTHER'
);
create type public.assignment_event_type as enum (
  'CREATED', 'ACKNOWLEDGED', 'STATUS_CHANGED', 'REASSIGNED',
  'COMPLETED', 'INTERRUPTED', 'CANCELLED', 'NOTE_ADDED'
);

-- ------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  role public.user_role not null default 'CITIZEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'Citizen'),
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'CITIZEN')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helper used by RLS policies
create or replace function public.has_role(roles public.user_role[])
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(roles)
  );
$$;

-- Privileged roles shorthand
create or replace function public.is_authority()
returns boolean
language sql
stable
as $$
  select public.has_role(array['OPERATOR', 'ADMIN']::public.user_role[]);
$$;

-- ------------------------------------------------------------
-- INCIDENTS
-- ------------------------------------------------------------
create sequence public.incident_number_seq start 1000;

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_number text not null unique default ('INC-' || nextval('public.incident_number_seq')::text),
  reporter_id uuid references public.profiles(id) on delete set null,
  severity public.incident_severity not null default 'MEDIUM',
  type public.incident_type not null default 'OTHER',
  status public.incident_status not null default 'REPORTED',
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  location_text text,
  people_affected integer not null default 1 check (people_affected > 0),
  required_capabilities text[] not null default '{}',
  confidence_score double precision not null default 0.5 check (confidence_score between 0 and 1),
  verification_status public.verification_status not null default 'UNVERIFIED',
  source public.report_source not null default 'APP',
  photo_url text,
  ai_classification jsonb,
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_incidents_severity on public.incidents (severity);
create index idx_incidents_status on public.incidents (status);
create index idx_incidents_reported_at on public.incidents (reported_at desc);

-- ------------------------------------------------------------
-- RESOURCE TEAMS
-- ------------------------------------------------------------
create table public.resource_teams (
  id uuid primary key default gen_random_uuid(),
  team_code text not null unique,
  name text not null,
  status public.resource_status not null default 'AVAILABLE',
  latitude double precision not null,
  longitude double precision not null,
  base_latitude double precision not null,
  base_longitude double precision not null,
  capacity integer not null default 5,
  capabilities text[] not null default '{}',
  current_assignment_id uuid,
  managed_by_id uuid references public.profiles(id) on delete set null,
  contact_phone text,
  vehicle_type text,
  last_status_update timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_teams_status on public.resource_teams (status);

-- ------------------------------------------------------------
-- SHELTERS + STOCKS
-- ------------------------------------------------------------
create table public.shelters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  total_capacity integer not null check (total_capacity > 0),
  current_occupancy integer not null default 0 check (current_occupancy >= 0),
  status public.shelter_status not null default 'OPEN',
  managed_by_id uuid references public.profiles(id) on delete set null,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shelters_status on public.shelters (status);

-- Auto-derive shelter status from occupancy ratio
create or replace function public.set_shelter_status()
returns trigger
language plpgsql
as $$
begin
  if new.current_occupancy > new.total_capacity then
    raise exception 'Occupancy cannot exceed capacity';
  end if;
  new.status := case
    when new.current_occupancy = 0 then 'OPEN'::public.shelter_status
    when new.current_occupancy::float / new.total_capacity < 0.5 then 'FILLING'::public.shelter_status
    when new.current_occupancy::float / new.total_capacity < 0.9 then 'NEAR_CAPACITY'::public.shelter_status
    else 'FULL'::public.shelter_status
  end;
  return new;
end;
$$;

create trigger trg_shelter_status
  before insert or update of total_capacity, current_occupancy
  on public.shelters
  for each row execute function public.set_shelter_status();

create table public.shelter_stocks (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  item_type public.stock_item_type not null,
  quantity integer not null default 0 check (quantity >= 0),
  max_quantity integer not null default 0 check (max_quantity >= 0),
  last_updated timestamptz not null default now(),
  unique (shelter_id, item_type)
);

-- ------------------------------------------------------------
-- ASSIGNMENTS
-- ------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  resource_id uuid not null references public.resource_teams(id) on delete cascade,
  assigned_by_id uuid references public.profiles(id) on delete set null,
  status public.assignment_status not null default 'PENDING',
  allocation_score double precision,
  score_breakdown jsonb,
  explanation text,
  distance_km double precision,
  eta_minutes integer,
  is_manual_override boolean not null default false,
  assigned_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assignments_incident on public.assignments (incident_id);
create index idx_assignments_resource on public.assignments (resource_id);
create index idx_assignments_status on public.assignments (status);

create table public.assignment_logs (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  event_type public.assignment_event_type not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_assignment_logs_assignment on public.assignment_logs (assignment_id);

-- Keep resource_team.current_assignment_id in sync
create or replace function public.sync_team_current_assignment()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('PENDING', 'ACKNOWLEDGED', 'EN_ROUTE', 'ON_SCENE') then
    update public.resource_teams
    set current_assignment_id = new.id,
        status = case
          when new.status = 'PENDING' then 'ASSIGNED'::public.resource_status
          when new.status = 'ACKNOWLEDGED' then 'ASSIGNED'::public.resource_status
          when new.status = 'EN_ROUTE' then 'EN_ROUTE'::public.resource_status
          else 'ON_SCENE'::public.resource_status
        end,
        last_status_update = now()
    where id = new.resource_id;
  elsif new.status in ('COMPLETED', 'CANCELLED', 'INTERRUPTED') then
    update public.resource_teams
    set current_assignment_id = null,
        status = case
          when new.status = 'COMPLETED' then 'RETURNING'::public.resource_status
          else 'AVAILABLE'::public.resource_status
        end,
        last_status_update = now()
    where id = new.resource_id and current_assignment_id = new.id;
  end if;

  -- Mirror assignment progress onto the incident
  if new.status in ('ACKNOWLEDGED', 'EN_ROUTE', 'ON_SCENE') then
    update public.incidents
    set status = case
        when new.status = 'ACKNOWLEDGED' then 'ASSIGNED'::public.incident_status
        when new.status = 'EN_ROUTE' then 'EN_ROUTE'::public.incident_status
        else 'ON_SCENE'::public.incident_status
      end,
      updated_at = now()
    where id = new.incident_id;
  elsif new.status = 'COMPLETED' then
    update public.incidents
    set status = 'RESOLVED'::public.incident_status,
        resolved_at = now(),
        updated_at = now()
    where id = new.incident_id;
  end if;

  return new;
end;
$$;

create trigger trg_sync_team_assignment
  after update of status on public.assignments
  for each row execute function public.sync_team_current_assignment();

-- ------------------------------------------------------------
-- ALERTS (IMD / CWC / NDMA feeds)
-- ------------------------------------------------------------
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  alert_id text not null unique,
  source public.alert_source not null,
  severity public.alert_severity not null,
  type public.alert_type not null,
  title text not null,
  description text,
  affected_area jsonb,
  effective_from timestamptz not null,
  effective_until timestamptz,
  raw_data jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_alerts_active on public.alerts (is_active) where is_active = true;

-- ------------------------------------------------------------
-- ALLOCATION WEIGHTS (configurable scoring profile)
-- ------------------------------------------------------------
create table public.allocation_weights (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  severity_weight double precision not null default 0.40,
  eta_weight double precision not null default 0.20,
  capability_weight double precision not null default 0.20,
  availability_weight double precision not null default 0.10,
  capacity_weight double precision not null default 0.10,
  is_active boolean not null default false,
  created_by_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weights_sum_to_one check (
    round((severity_weight + eta_weight + capability_weight +
           availability_weight + capacity_weight)::numeric, 2) = 1.00
  )
);

create or replace function public.ensure_single_active_weights()
returns trigger
language plpgsql
as $$
begin
  if new.is_active then
    update public.allocation_weights
    set is_active = false
    where id <> new.id and is_active;
  end if;
  return new;
end;
$$;

create trigger trg_single_active_weights
  before insert or update of is_active on public.allocation_weights
  for each row execute function public.ensure_single_active_weights();

-- ------------------------------------------------------------
-- Haversine distance (km) — used by the allocation engine
-- ------------------------------------------------------------
create or replace function public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- ------------------------------------------------------------
-- updated_at touch trigger
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_touch_incidents before update on public.incidents
  for each row execute function public.touch_updated_at();
create trigger trg_touch_teams before update on public.resource_teams
  for each row execute function public.touch_updated_at();
create trigger trg_touch_shelters before update on public.shelters
  for each row execute function public.touch_updated_at();
create trigger trg_touch_assignments before update on public.assignments
  for each row execute function public.touch_updated_at();
create trigger trg_touch_weights before update on public.allocation_weights
  for each row execute function public.touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.resource_teams enable row level security;
alter table public.shelters enable row level security;
alter table public.shelter_stocks enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_logs enable row level security;
alter table public.alerts enable row level security;
alter table public.allocation_weights enable row level security;

-- profiles: read own; authority reads all; users update own (not role)
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_authority());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- incidents: authenticated can read + create reports; authority manages
create policy "incidents_select_all" on public.incidents
  for select to authenticated using (true);
create policy "incidents_insert_authenticated" on public.incidents
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "incidents_update_authority" on public.incidents
  for update using (public.is_authority());

-- resources: everyone logged-in reads; authority manages
create policy "teams_select_all" on public.resource_teams
  for select to authenticated using (true);
create policy "teams_write_authority" on public.resource_teams
  for all using (public.is_authority());

create policy "shelters_select_all" on public.shelters
  for select to authenticated using (true);
create policy "shelters_insert_authority" on public.shelters
  for insert to authenticated with check (public.is_authority());
create policy "shelters_update_manager_or_authority" on public.shelters
  for update using (public.is_authority() or managed_by_id = auth.uid());

create policy "stocks_select_all" on public.shelter_stocks
  for select to authenticated using (true);
create policy "stocks_write_authority" on public.shelter_stocks
  for all using (public.is_authority() or exists (
    select 1 from public.shelters s
    where s.id = shelter_id and s.managed_by_id = auth.uid()
  ));

create policy "assignments_select_all" on public.assignments
  for select to authenticated using (true);
create policy "assignments_insert_authority" on public.assignments
  for insert to authenticated with check (public.is_authority());
create policy "assignments_update_field_or_authority" on public.assignments
  for update using (
    public.is_authority()
    or public.has_role(array['FIELD_TEAM']::public.user_role[])
    or exists (
      select 1 from public.resource_teams t
      where t.id = resource_id and t.managed_by_id = auth.uid()
    )
  );

create policy "logs_select_all" on public.assignment_logs
  for select to authenticated using (true);
create policy "logs_insert_authority" on public.assignment_logs
  for insert to authenticated with check (public.is_authority());

create policy "alerts_select_all" on public.alerts
  for select to authenticated using (true);
create policy "alerts_write_authority" on public.alerts
  for all using (public.is_authority());

create policy "weights_select_all" on public.allocation_weights
  for select to authenticated using (true);
create policy "weights_write_admin" on public.allocation_weights
  for all using (public.has_role(array['ADMIN']::public.user_role[]));

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.incidents;
alter publication supabase_realtime add table public.resource_teams;
alter publication supabase_realtime add table public.shelters;
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.alerts;
