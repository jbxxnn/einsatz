-- Add profile completeness and verification status columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create an index for faster verification queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles (is_verified);

-- Update existing profiles with calculated completeness
UPDATE profiles
SET profile_completeness = (
  SELECT 
    CASE 
      WHEN user_type = 'freelancer' THEN
        CASE 
          WHEN (
            first_name IS NOT NULL AND first_name != '' AND
            last_name IS NOT NULL AND last_name != '' AND
            email IS NOT NULL AND email != '' AND
            phone IS NOT NULL AND phone != '' AND
            bio IS NOT NULL AND bio != '' AND
            location IS NOT NULL AND location != '' AND
            avatar_url IS NOT NULL AND avatar_url != '' AND
            hourly_rate IS NOT NULL AND
            latitude IS NOT NULL AND
            longitude IS NOT NULL
          ) THEN 100
          ELSE 0
        END
      ELSE
        CASE 
          WHEN (
            first_name IS NOT NULL AND first_name != '' AND
            last_name IS NOT NULL AND last_name != '' AND
            email IS NOT NULL AND email != '' AND
            phone IS NOT NULL AND phone != '' AND
            bio IS NOT NULL AND bio != '' AND
            location IS NOT NULL AND location != '' AND
            avatar_url IS NOT NULL AND avatar_url != ''
          ) THEN 100
          ELSE 0
        END
    END
);

-- Update verification status based on profile completeness and completed bookings
UPDATE profiles p
SET is_verified = (
  p.profile_completeness >= 90 OR
  EXISTS (
    SELECT 1 
    FROM bookings b 
    WHERE b.freelancer_id = p.id 
    AND b.status = 'completed'
  )
)
WHERE p.user_type = 'freelancer'; 