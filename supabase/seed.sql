-- ============================================================
-- ResQ — Seed Data: ROURKELA, ODISHA
-- Idempotent: clears old demo data, then inserts Rourkela set.
-- Run in Supabase SQL Editor. Re-runnable anytime.
--
-- Geography notes: Rourkela sits at the confluence of the Koel
-- and Sankh rivers (they merge at Vedvyas to form the Brahmani).
-- Low-lying riverside areas (Vedvyas, Panposh, Koel Nagar,
-- Jalda) are the flood-prone zones used in this dataset.
-- ============================================================

-- ---- Clear previous demo data -------------------------------
delete from public.assignments;
delete from public.assignment_logs;
delete from public.incidents;
delete from public.shelter_stocks;
delete from public.shelters;
delete from public.resource_teams;
delete from public.alerts where alert_id like 'IMD-DEMO-%' or alert_id like 'OM-%';

-- ---- Allocation weight profiles -----------------------------
delete from public.allocation_weights;
insert into public.allocation_weights
  (name, severity_weight, eta_weight, capability_weight, availability_weight, capacity_weight, is_active)
values
  ('Balanced', 0.40, 0.20, 0.20, 0.10, 0.10, true),
  ('Severity-First', 0.60, 0.15, 0.15, 0.05, 0.05, false),
  ('Speed-First', 0.20, 0.40, 0.20, 0.10, 0.10, false);

-- ---- Rescue teams -------------------------------------------
insert into public.resource_teams
  (team_code, name, status, latitude, longitude, base_latitude, base_longitude, capacity, capabilities, contact_phone, vehicle_type)
values
  ('RT-001', 'Rescue Team 01 - Sector 3 Fire Station',   'AVAILABLE',   22.2570, 84.8490, 22.2570, 84.8490, 6, '{BOAT,GENERAL}',            '+91-90000-00001', 'Rescue Truck'),
  ('RT-002', 'Rescue Team 02 - Panposh Riverside',       'AVAILABLE',   22.2350, 84.8540, 22.2350, 84.8540, 5, '{BOAT,MEDICAL}',            '+91-90000-00002', 'Ambulance Boat'),
  ('RT-003', 'Heavy Rescue 03 - Kalunga Industrial',     'AVAILABLE',   22.2190, 84.8790, 22.2190, 84.8790, 8, '{HEAVY_EQUIPMENT,GENERAL}', '+91-90000-00003', 'Crane Truck'),
  ('RT-004', 'Medical Unit 01 - IGH Campus',             'AVAILABLE',   22.2545, 84.8505, 22.2545, 84.8505, 4, '{MEDICAL,GENERAL}',         '+91-90000-00004', 'Ambulance'),
  ('RT-005', 'Rescue Team 05 - Bondamunda',              'AVAILABLE',   22.2440, 84.9090, 22.2440, 84.9090, 5, '{BOAT,GENERAL}',            '+91-90000-00005', 'Rescue Truck'),
  ('RT-006', 'Rescue Team 06 - Vedvyas Ghat Post',       'UNAVAILABLE', 22.2840, 84.8260, 22.2840, 84.8260, 6, '{BOAT,GENERAL}',            '+91-90000-00006', 'Rescue Truck');

-- ---- Shelters + stocks --------------------------------------
insert into public.shelters (name, address, latitude, longitude, total_capacity, current_occupancy, contact_phone)
values
  ('Govt High School - Sector 2',        'Sector 2, Rourkela, Sundargarh',     22.2560, 84.8470, 200, 45,  '+91-80000-00001'),
  ('Community Hall - Chhend Colony',     'Chhend Colony, Rourkela',            22.2790, 84.8460, 150, 130, '+91-80000-00002'),
  ('Saraswati Vidya Mandir - Koel Nagar','Koel Nagar, Rourkela',               22.2395, 84.8420, 300, 90,  '+91-80000-00003');

insert into public.shelter_stocks (shelter_id, item_type, quantity, max_quantity)
select s.id, v.item_type::public.stock_item_type, v.qty, s.total_capacity / 2
from public.shelters s
cross join (values
  ('FOOD', 120), ('WATER', 200), ('MEDICAL', 60), ('BLANKETS', 80)
) as v(item_type, qty);

-- ---- Active incidents (Koel river flood situation) ----------
insert into public.incidents
  (incident_number, severity, type, status, description, latitude, longitude, location_text,
   people_affected, required_capabilities, confidence_score, source)
values
  ('INC-1001', 'CRITICAL', 'FLOOD', 'REPORTED',
   'River water entered riverside homes near Vedvyas ghat, elderly couple and child trapped on upper floor',
   22.2830, 84.8290, 'Vedvyas', 18, '{BOAT,MEDICAL}', 0.85, 'APP'),
  ('INC-1002', 'HIGH', 'FLOOD', 'REPORTED',
   'Koel Nagar lane fully waterlogged, six families requesting evacuation from ground floors',
   22.2400, 84.8410, 'Koel Nagar', 12, '{BOAT}', 0.65, 'APP'),
  ('INC-1003', 'MEDIUM', 'STRUCTURAL_COLLAPSE', 'REPORTED',
   'Boundary wall collapsed in Civil Township due to waterlogging, road partially blocked',
   22.2505, 84.8640, 'Civil Township', 5, '{HEAVY_EQUIPMENT}', 0.55, 'APP'),
  ('INC-1004', 'LOW', 'FLOOD', 'REPORTED',
   'Minor waterlogging near Sector 6 market, traffic moving slowly',
   22.2620, 84.8520, 'Sector 6', 2, '{}', 0.50, 'APP');

-- ---- Weather warning -----------------------------------------
insert into public.alerts (alert_id, source, severity, type, title, description, effective_from, effective_until)
values (
  'IMD-DEMO-001', 'IMD', 'SEVERE', 'RAINFALL',
  'Heavy to very heavy rainfall warning - Sundargarh District',
  'Isolated heavy to very heavy rainfall very likely over Rourkela and surrounding areas during next 24 hours. Koel river level expected to rise.',
  now(), now() + interval '24 hours'
);
