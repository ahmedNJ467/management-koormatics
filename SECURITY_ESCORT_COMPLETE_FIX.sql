-- SECURITY ESCORT COMPLETE FIX AND TEST DATA
-- This script ensures all security escort fields exist and creates test data

-- 1. First, ensure all security escort fields exist in trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS has_security_escort BOOLEAN DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS escort_count INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS escort_vehicle_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS escort_status TEXT DEFAULT 'not_assigned';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS escort_assigned_at TIMESTAMP WITH TIME ZONE;

-- Add constraints
DO $$ BEGIN
    ALTER TABLE trips ADD CONSTRAINT check_escort_count_limit CHECK (escort_count >= 0 AND escort_count <= 2);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE trips ADD CONSTRAINT check_escort_status CHECK (escort_status IN ('not_assigned', 'partially_assigned', 'fully_assigned'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_trips_security_escort ON trips(has_security_escort);
CREATE INDEX IF NOT EXISTS idx_trips_escort_status ON trips(escort_status);
CREATE INDEX IF NOT EXISTS idx_trips_escort_vehicle_ids ON trips USING GIN(escort_vehicle_ids);

-- 2. Ensure vehicle escort tracking fields exist
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_escort_assigned BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS escort_trip_id TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS escort_assigned_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_escort_assigned ON vehicles(is_escort_assigned);
CREATE INDEX IF NOT EXISTS idx_vehicles_escort_trip_id ON vehicles(escort_trip_id);

-- 3. Clean up any existing test data
DELETE FROM trips WHERE id LIKE 'test-security-trip-%';
DELETE FROM vehicles WHERE id LIKE 'test-escort-vehicle-%' OR id LIKE 'test-main-vehicle-%';
DELETE FROM drivers WHERE id LIKE 'test-security-driver-%';
DELETE FROM clients WHERE id LIKE 'test-security-client-%';

-- 4. Create test data
-- Insert test client
INSERT INTO clients (id, name, type, email, phone, address, contact_person, created_at, updated_at)
VALUES (
  'test-security-client-001',
  'VIP Security Transport Ltd',
  'organization',
  'security@viptransport.com',
  '+1234567890',
  '123 Security Street, VIP City',
  'John Security',
  NOW(),
  NOW()
);

-- Insert test vehicles
INSERT INTO vehicles (id, make, model, year, registration, color, type, status, fuel_type, created_at, updated_at)
VALUES 
  ('test-main-vehicle-001', 'Mercedes', 'S-Class', 2023, 'VIP-001', 'Black', 'armoured', 'available', 'petrol', NOW(), NOW()),
  ('test-escort-vehicle-001', 'BMW', 'X5', 2023, 'ESC-001', 'Black', 'armoured', 'available', 'petrol', NOW(), NOW()),
  ('test-escort-vehicle-002', 'Audi', 'Q7', 2023, 'ESC-002', 'Black', 'armoured', 'available', 'petrol', NOW(), NOW()),
  ('test-escort-vehicle-003', 'Range Rover', 'Vogue', 2023, 'ESC-003', 'Black', 'armoured', 'available', 'petrol', NOW(), NOW());

-- Insert test drivers
INSERT INTO drivers (id, name, license_number, phone, email, status, vehicle_type_preference, created_at, updated_at)
VALUES 
  ('test-security-driver-001', 'Michael Security', 'DL123456', '+1234567891', 'mike@security.com', 'active', 'armoured', NOW(), NOW()),
  ('test-security-driver-002', 'James Guard', 'DL123457', '+1234567892', 'james@security.com', 'active', 'armoured', NOW(), NOW()),
  ('test-security-driver-003', 'Robert Shield', 'DL123458', '+1234567893', 'robert@security.com', 'active', 'armoured', NOW(), NOW());

-- Insert test trips with different security escort scenarios
INSERT INTO trips (
  id, 
  client_id, 
  vehicle_id, 
  driver_id, 
  date, 
  time, 
  service_type, 
  status, 
  amount, 
  pickup_location, 
  dropoff_location, 
  notes,
  has_security_escort,
  escort_count,
  escort_status,
  vehicle_type,
  created_at,
  updated_at
) VALUES 
  -- Trip 1: Not assigned escorts (2 escorts needed)
  (
    'test-security-trip-001',
    'test-security-client-001',
    'test-main-vehicle-001',
    'test-security-driver-001',
    CURRENT_DATE + INTERVAL '1 day',
    '09:00:00',
    'airport_pickup',
    'scheduled',
    500.00,
    'International Airport Terminal 1',
    'Downtown Hotel VIP',
    'High-profile client requiring 2 security escorts',
    true,
    2,
    'not_assigned',
    'armoured',
    NOW(),
    NOW()
  ),
  -- Trip 2: Unassigned vehicle and driver but needs escort
  (
    'test-security-trip-002',
    'test-security-client-001',
    NULL,
    NULL,
    CURRENT_DATE + INTERVAL '1 day',
    '14:00:00',
    'full_day',
    'scheduled',
    800.00,
    'Government Building',
    'Conference Center',
    'Government official transport with 1 security escort',
    true,
    1,
    'not_assigned',
    'armoured',
    NOW(),
    NOW()
  ),
  -- Trip 3: Partially assigned escorts
  (
    'test-security-trip-003',
    'test-security-client-001',
    'test-main-vehicle-001',
    'test-security-driver-001',
    CURRENT_DATE,
    '16:00:00',
    'one_way_transfer',
    'scheduled',
    300.00,
    'Corporate Headquarters',
    'Private Residence',
    'Executive transport with 1 escort partially assigned',
    true,
    2,
    'partially_assigned',
    'armoured',
    NOW(),
    NOW()
  ),
  -- Trip 4: Fully assigned escorts
  (
    'test-security-trip-004',
    'test-security-client-001',
    'test-main-vehicle-001',
    'test-security-driver-002',
    CURRENT_DATE,
    '18:00:00',
    'round_trip',
    'scheduled',
    600.00,
    'Embassy',
    'Airport VIP Lounge',
    'Diplomatic transport with full escort detail',
    true,
    2,
    'fully_assigned',
    'armoured',
    NOW(),
    NOW()
  );

-- Update trips with specific escort vehicle assignments
UPDATE trips 
SET 
  escort_vehicle_ids = '["test-escort-vehicle-001"]'::jsonb,
  escort_assigned_at = NOW()
WHERE id = 'test-security-trip-003';

UPDATE trips 
SET 
  escort_vehicle_ids = '["test-escort-vehicle-001", "test-escort-vehicle-002"]'::jsonb,
  escort_assigned_at = NOW()
WHERE id = 'test-security-trip-004';

-- Update vehicle escort assignments
UPDATE vehicles 
SET 
  is_escort_assigned = true,
  escort_trip_id = 'test-security-trip-003',
  escort_assigned_at = NOW()
WHERE id = 'test-escort-vehicle-001';

UPDATE vehicles 
SET 
  is_escort_assigned = true,
  escort_trip_id = 'test-security-trip-004',
  escort_assigned_at = NOW()
WHERE id = 'test-escort-vehicle-002';

-- 5. Verify the data was created correctly
SELECT 
  '=== SECURITY ESCORT TRIPS CREATED ===' as status;

SELECT 
  t.id,
  t.date,
  t.time,
  t.pickup_location,
  t.dropoff_location,
  t.has_security_escort,
  t.escort_count,
  t.escort_status,
  t.escort_vehicle_ids,
  c.name as client_name,
  COALESCE(v.make || ' ' || v.model, 'No Vehicle') as vehicle_details,
  COALESCE(d.name, 'No Driver') as driver_name
FROM trips t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN drivers d ON t.driver_id = d.id
WHERE t.id LIKE 'test-security-trip-%'
ORDER BY t.date, t.time;

SELECT 
  '=== AVAILABLE VEHICLES FOR ESCORT ===' as status;

SELECT 
  v.id,
  v.make,
  v.model,
  v.registration,
  v.type,
  v.status,
  v.is_escort_assigned,
  v.escort_trip_id
FROM vehicles v
WHERE v.id LIKE 'test-%'
ORDER BY v.make, v.model;

SELECT 
  '=== SUMMARY ===' as status;

SELECT 
  COUNT(*) as total_security_trips,
  COUNT(CASE WHEN escort_status = 'not_assigned' THEN 1 END) as not_assigned,
  COUNT(CASE WHEN escort_status = 'partially_assigned' THEN 1 END) as partially_assigned,
  COUNT(CASE WHEN escort_status = 'fully_assigned' THEN 1 END) as fully_assigned
FROM trips 
WHERE has_security_escort = true; 