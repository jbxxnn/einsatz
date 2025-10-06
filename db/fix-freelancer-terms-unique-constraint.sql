-- Fix freelancer_terms unique constraint to allow multiple records per freelancer
-- but only one active record per freelancer

-- Drop the existing unique constraint
ALTER TABLE freelancer_terms DROP CONSTRAINT IF EXISTS freelancer_terms_freelancer_id_key;

-- Add a partial unique index that only applies to active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_freelancer_terms_active_unique 
ON freelancer_terms(freelancer_id) 
WHERE is_active = true;

-- This allows multiple records per freelancer (for history) but only one active record
