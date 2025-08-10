-- Fix V2 Table Structure
-- This script ensures the existing tables have the question_group_id column needed for V2

-- Check if question_group_id exists in dba_freelancer_answers, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dba_freelancer_answers' 
        AND column_name = 'question_group_id'
    ) THEN
        ALTER TABLE dba_freelancer_answers 
        ADD COLUMN question_group_id UUID REFERENCES dba_question_groups(id);
        
        CREATE INDEX idx_dba_freelancer_answers_v2 ON dba_freelancer_answers(question_group_id);
    END IF;
END $$;

-- Check if question_group_id exists in dba_booking_answers, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dba_booking_answers' 
        AND column_name = 'question_group_id'
    ) THEN
        ALTER TABLE dba_booking_answers 
        ADD COLUMN question_group_id UUID REFERENCES dba_question_groups(id);
        
        CREATE INDEX idx_dba_booking_answers_v2 ON dba_booking_answers(question_group_id);
    END IF;
END $$;

-- Verify the tables have the new column
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('dba_freelancer_answers', 'dba_booking_answers')
  AND column_name = 'question_group_id';

-- Check if question groups table exists and has data
SELECT COUNT(*) as question_groups_count FROM dba_question_groups;

-- Check if feature flag is properly set
SELECT flag_name, is_enabled FROM feature_flags WHERE flag_name = 'dba_v2_enabled';

