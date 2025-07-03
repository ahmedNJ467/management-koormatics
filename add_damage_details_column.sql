-- Add missing damage_details column to vehicle_incident_reports table
ALTER TABLE vehicle_incident_reports 
ADD COLUMN IF NOT EXISTS damage_details TEXT;

-- Add comment for the new column
COMMENT ON COLUMN vehicle_incident_reports.damage_details IS 'JSON data of damaged car parts with severity levels';
