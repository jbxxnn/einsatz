-- Add metadata column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Add an index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_profiles_metadata ON profiles USING GIN (metadata);

-- Comment on the column
COMMENT ON COLUMN profiles.metadata IS 'JSON field for storing additional profile data like social links and role';

