-- Create interest points table for map markers
CREATE TABLE IF NOT EXISTS interest_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  icon VARCHAR(50) DEFAULT '📍',
  color VARCHAR(7) DEFAULT '#FF6B6B',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient coordinate-based queries
CREATE INDEX IF NOT EXISTS idx_interest_points_coordinates ON interest_points(latitude, longitude);

-- Create index for category-based filtering
CREATE INDEX IF NOT EXISTS idx_interest_points_category ON interest_points(category);

-- Create index for active status
CREATE INDEX IF NOT EXISTS idx_interest_points_active ON interest_points(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE interest_points ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all interest points
CREATE POLICY "Allow authenticated users to read interest points" ON interest_points
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert their own interest points
CREATE POLICY "Allow authenticated users to insert interest points" ON interest_points
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create policy for users to update their own interest points
CREATE POLICY "Allow users to update their own interest points" ON interest_points
  FOR UPDATE USING (auth.uid() = created_by);

-- Create policy for users to delete their own interest points
CREATE POLICY "Allow users to delete their own interest points" ON interest_points
  FOR DELETE USING (auth.uid() = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interest_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_interest_points_updated_at
  BEFORE UPDATE ON interest_points
  FOR EACH ROW
  EXECUTE FUNCTION update_interest_points_updated_at();

-- Insert some sample interest points for Mogadishu area
INSERT INTO interest_points (name, description, category, latitude, longitude, icon, color) VALUES
  ('Mogadishu International Airport', 'Main international airport serving Mogadishu', 'airport', 2.0142, 45.3047, '✈️', '#4ECDC4'),
  ('Port of Mogadishu', 'Main seaport of Somalia', 'port', 2.0469, 45.3182, '🚢', '#45B7D1'),
  ('Central Market', 'Main market area in Mogadishu', 'market', 2.0371, 45.3438, '🛒', '#FFA07A'),
  ('City Center', 'Downtown Mogadishu area', 'city', 2.0371, 45.3438, '🏙️', '#98D8C8'),
  ('Security Checkpoint Alpha', 'Primary security checkpoint', 'security', 2.0400, 45.3200, '🚨', '#FF6B6B'),
  ('Fuel Station Central', 'Main fuel station', 'fuel', 2.0350, 45.3250, '⛽', '#FFD93D'),
  ('Hospital Main', 'Central hospital facility', 'health', 2.0380, 45.3300, '🏥', '#6C5CE7'),
  ('Police Station', 'Main police station', 'security', 2.0420, 45.3150, '👮', '#A29BFE');
