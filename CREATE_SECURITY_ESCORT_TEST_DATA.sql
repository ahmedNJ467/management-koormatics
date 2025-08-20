-- Create test trips with security escort requirements
-- First, ensure we have test clients and vehicles

-- Insert test client if not exists
INSERT INTO clients (id, name, type, email, phone, address, contact_person)
VALUES (
  'test-client-security-001',
  'VIP Security Transport Ltd',
  'organization',
  'security@viptransport.com',
  '+1234567890',
  '123 Security Street, VIP City',
  'John Security'
) ON CONFLICT (id) DO NOTHING;

-- Insert test vehicles if not exist
INSERT INTO vehicles (id, make, model, year, registration, color, type, status, fuel_type)
VALUES 
  ('test-vehicle-main-001', 'Mercedes', 'S-Class', 2023, 'VIP-001', 'Black', 'armoured', 'available', 'petrol'),
  ('test-vehicle-escort-001', 'BMW', 'X5', 2023, 'ESC-001', 'Black', 'armoured', 'available', 'petrol'),
  ('test-vehicle-escort-002', 'Audi', 'Q7', 2023, 'ESC-002', 'Black', 'armoured', 'available', 'petrol')
ON CONFLICT (id) DO NOTHING;

-- Insert test drivers if not exist
INSERT INTO drivers (id, name, license_number, phone, email, status, vehicle_type_preference)
VALUES 
  ('test-driver-main-001', 'Michael Security', 'DL123456', '+1234567891', 'mike@security.com', 'available', 'armoured'),
  ('test-driver-escort-001', 'James Guard', 'DL123457', '+1234567892', 'james@security.com', 'available', 'armoured'),
  ('test-driver-escort-002', 'Robert Shield', 'DL123458', '+1234567893', 'robert@security.com', 'available', 'armoured')
ON CONFLICT (id) DO NOTHING;

-- Insert test trips with security escort requirements
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
  vehicle_type
) VALUES 
  (
    'test-trip-security-001',
    'test-client-security-001',
    'test-vehicle-main-001',
    'test-driver-main-001',
    CURRENT_DATE + INTERVAL '1 day',
    '09:00:00',
    'airport_pickup',
    'scheduled',
    500.00,
    'International Airport Terminal 1',
    'Downtown Hotel VIP',
    'High-profile client requiring security escort',
    true,
    2,
    'not_assigned',
    'armoured'
  ),
  (
    'test-trip-security-002',
    'test-client-security-001',
    NULL, -- Unassigned vehicle
    NULL, -- Unassigned driver
    CURRENT_DATE + INTERVAL '1 day',
    '14:00:00',
    'full_day',
    'scheduled',
    800.00,
    'Government Building',
    'Conference Center',
    'Government official transport with security requirement',
    true,
    1,
    'not_assigned',
    'armoured'
  ),
  (
    'test-trip-security-003',
    'test-client-security-001',
    'test-vehicle-main-001',
    'test-driver-main-001',
    CURRENT_DATE,
    '16:00:00',
    'one_way_transfer',
    'scheduled',
    300.00,
    'Corporate Headquarters',
    'Private Residence',
    'Executive transport requiring single escort',
    true,
    1,
    'partially_assigned',
    'armoured'
  )
ON CONFLICT (id) DO NOTHING;

-- Update one trip to have partially assigned escorts for testing
UPDATE trips 
SET 
  escort_vehicle_ids = ARRAY['test-vehicle-escort-001'],
  escort_status = 'partially_assigned',
  escort_assigned_at = NOW()
WHERE id = 'test-trip-security-003';

-- Display the created test data
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
  v.make || ' ' || v.model as vehicle_details,
  d.name as driver_name
FROM trips t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN drivers d ON t.driver_id = d.id
WHERE t.id LIKE 'test-trip-security-%'
ORDER BY t.date, t.time; 