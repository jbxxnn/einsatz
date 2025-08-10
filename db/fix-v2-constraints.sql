-- Fix V2 Database Constraints
-- Make old question_id columns nullable since V2 uses question_group_id instead

-- Fix dba_booking_answers table
ALTER TABLE dba_booking_answers 
ALTER COLUMN question_id DROP NOT NULL;

-- Fix dba_freelancer_answers table  
ALTER TABLE dba_freelancer_answers 
ALTER COLUMN question_id DROP NOT NULL;

-- Add unique constraints for V2 upsert operations
-- (These might already exist from previous fix attempt)
DO $$ 
BEGIN
    -- Add unique constraint for booking answers if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'dba_booking_answers_unique_booking_question'
    ) THEN
        ALTER TABLE dba_booking_answers 
        ADD CONSTRAINT dba_booking_answers_unique_booking_question 
        UNIQUE (booking_id, question_group_id);
    END IF;
    
    -- Add unique constraint for freelancer answers if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'dba_freelancer_answers_unique_freelancer_category_question'
    ) THEN
        ALTER TABLE dba_freelancer_answers 
        ADD CONSTRAINT dba_freelancer_answers_unique_freelancer_category_question 
        UNIQUE (freelancer_id, job_category_id, question_group_id);
    END IF;
END $$;

-- Verify the changes
SELECT 
    table_name,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('dba_booking_answers', 'dba_freelancer_answers')
    AND column_name IN ('question_id', 'question_group_id')
ORDER BY table_name, column_name;

-- Check constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid IN (
    'dba_booking_answers'::regclass,
    'dba_freelancer_answers'::regclass
)
AND contype = 'u';

