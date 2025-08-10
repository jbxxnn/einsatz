-- DBA V2 Migration Strategy - Parallel System Approach
-- This script implements a safe migration that preserves existing data

-- Step 1: Add version tracking to existing data
ALTER TABLE dba_reports 
ADD COLUMN IF NOT EXISTS methodology_version TEXT DEFAULT 'v1_legacy';

-- Mark all existing reports as v1
UPDATE dba_reports 
SET methodology_version = 'v1_legacy' 
WHERE methodology_version IS NULL;

-- Step 2: Add backup suffix to existing tables (optional safety measure)
-- This creates a backup while keeping the original tables functional
-- Only run these if you want explicit backups:

-- CREATE TABLE dba_questions_v1_backup AS SELECT * FROM dba_questions;
-- CREATE TABLE dba_freelancer_answers_v1_backup AS SELECT * FROM dba_freelancer_answers;
-- CREATE TABLE dba_booking_answers_v1_backup AS SELECT * FROM dba_booking_answers;
-- CREATE TABLE dba_reports_v1_backup AS SELECT * FROM dba_reports;

-- Step 3: Create new V2 schema alongside existing tables
-- Run the new schema creation (from dba-system-redesign.sql)

-- Add new columns to existing tables for V2 compatibility
ALTER TABLE dba_freelancer_answers 
ADD COLUMN IF NOT EXISTS question_group_id UUID REFERENCES dba_question_groups(id);

ALTER TABLE dba_booking_answers 
ADD COLUMN IF NOT EXISTS question_group_id UUID REFERENCES dba_question_groups(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dba_freelancer_answers_v2 ON dba_freelancer_answers(question_group_id);
CREATE INDEX IF NOT EXISTS idx_dba_booking_answers_v2 ON dba_booking_answers(question_group_id);

-- Step 4: Add feature flag for gradual rollout
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert DBA V2 feature flag
INSERT INTO feature_flags (flag_name, is_enabled, description)
VALUES ('dba_v2_enabled', FALSE, 'Enable DBA V2 methodology with dispute detection')
ON CONFLICT (flag_name) DO NOTHING;

-- Step 5: Migration status tracking
CREATE TABLE IF NOT EXISTS dba_migration_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  freelancer_id UUID REFERENCES profiles(id),
  migration_status TEXT CHECK (migration_status IN ('pending', 'migrated', 'failed')),
  migration_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create migration status view
CREATE OR REPLACE VIEW dba_migration_status AS
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN methodology_version = 'v1_legacy' THEN 1 END) as v1_reports,
  COUNT(CASE WHEN methodology_version = 'v2_dutch_compliant' THEN 1 END) as v2_reports,
  ROUND(
    (COUNT(CASE WHEN methodology_version = 'v2_dutch_compliant' THEN 1 END) * 100.0) / 
    NULLIF(COUNT(*), 0), 2
  ) as migration_percentage
FROM dba_reports;

