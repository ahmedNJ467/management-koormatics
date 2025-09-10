-- Add icon_url field to interest_points table for custom uploaded icons
ALTER TABLE interest_points 
ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN interest_points.icon_url IS 'URL to custom uploaded icon image for the interest point';

-- Create index for icon_url queries if needed
CREATE INDEX IF NOT EXISTS idx_interest_points_icon_url ON interest_points(icon_url) WHERE icon_url IS NOT NULL;
