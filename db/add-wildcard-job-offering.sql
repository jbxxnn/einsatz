-- Add wildcard job offering support
-- This migration adds support for freelancers to have one additional job offering beyond the normal limit

-- Add wildcard_job_offering_enabled column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wildcard_job_offering_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add wildcard_job_offering_id column to freelancer_job_offerings table to track which offering is the wildcard
ALTER TABLE freelancer_job_offerings 
ADD COLUMN IF NOT EXISTS is_wildcard BOOLEAN NOT NULL DEFAULT false;

-- Create a special "Wildcard Services" category for wildcard offerings
INSERT INTO job_categories (id, name, description, icon) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Wildcard Services',
  'Flexible services that can adapt to various client needs',
  '🎯'
) ON CONFLICT (id) DO NOTHING;

-- Create index for better performance when querying wildcard offerings
CREATE INDEX IF NOT EXISTS idx_freelancer_job_offerings_wildcard 
ON freelancer_job_offerings(freelancer_id, is_wildcard);

-- Add constraint to ensure only one wildcard offering per freelancer
CREATE UNIQUE INDEX IF NOT EXISTS freelancer_job_offerings_unique_wildcard
ON freelancer_job_offerings(freelancer_id)
WHERE is_wildcard = true;
