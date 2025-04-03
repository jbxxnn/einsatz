-- Add geocoding fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS service_radius INTEGER DEFAULT 10, -- Default radius in miles
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Create regular indexes on latitude and longitude
CREATE INDEX IF NOT EXISTS idx_profiles_latitude ON public.profiles (latitude);
CREATE INDEX IF NOT EXISTS idx_profiles_longitude ON public.profiles (longitude);

-- Function to calculate distance between two points in miles using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION := 3959; -- Earth radius in miles
  dLat DOUBLE PRECISION;
  dLon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
  d DOUBLE PRECISION;
BEGIN
  -- Convert degrees to radians
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  lat1 := radians(lat1);
  lat2 := radians(lat2);

  -- Haversine formula
  a := sin(dLat/2) * sin(dLat/2) + sin(dLon/2) * sin(dLon/2) * cos(lat1) * cos(lat2);
  c := 2 * asin(sqrt(a));
  d := R * c;
  
  RETURN d;
END;
$$ LANGUAGE plpgsql;

-- Function to find freelancers within a radius
CREATE OR REPLACE FUNCTION find_freelancers_within_radius(
  search_lat DOUBLE PRECISION,
  search_lon DOUBLE PRECISION,
  search_radius DOUBLE PRECISION
) RETURNS TABLE (
  id TEXT,
  distance DOUBLE PRECISION
) AS $$
BEGIN
  -- First, use a bounding box filter to reduce the number of distance calculations
  -- 1 degree of latitude is approximately 69 miles, 1 degree of longitude varies but max is also ~69 miles
  -- So we use search_radius/69 as a rough approximation for the bounding box
  RETURN QUERY
  SELECT 
    p.id,
    calculate_distance(search_lat, search_lon, p.latitude, p.longitude) AS distance
  FROM 
    profiles p
  WHERE 
    p.user_type = 'freelancer'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    -- Bounding box filter (rough approximation)
    AND p.latitude BETWEEN (search_lat - search_radius/69) AND (search_lat + search_radius/69)
    AND p.longitude BETWEEN (search_lon - search_radius/69) AND (search_lon + search_radius/69)
    -- Precise distance filter
    AND calculate_distance(search_lat, search_lon, p.latitude, p.longitude) <= search_radius;
END;
$$ LANGUAGE plpgsql;

