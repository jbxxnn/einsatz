-- Add wildcard categories to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wildcard_categories JSONB DEFAULT '{
  "physical_work": false,
  "customer_facing": false,
  "outdoor_work": false,
  "odd_hours": false,
  "repetitive_work": false,
  "analytical_work": false,
  "creative_work": false
}'::jsonb;

-- Create an index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_profiles_wildcard_categories ON profiles USING gin (wildcard_categories);

-- Update existing profiles with default values
UPDATE profiles
SET wildcard_categories = '{
  "physical_work": false,
  "customer_facing": false,
  "outdoor_work": false,
  "odd_hours": false,
  "repetitive_work": false,
  "analytical_work": false,
  "creative_work": false
}'::jsonb
WHERE wildcard_categories IS NULL;

-- Add RLS policy for wildcard categories
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist for reading profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Allow read access to all profiles'
    ) THEN
        CREATE POLICY "Allow read access to all profiles" 
        ON profiles FOR SELECT 
        USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Allow users to update their own profile'
    ) THEN
        CREATE POLICY "Allow users to update their own profile" 
        ON profiles FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END
$$;
