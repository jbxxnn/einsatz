-- Fix unique constraints for DBA V2 tables
-- The error indicates missing unique constraints for ON CONFLICT operations

-- Check current table structure
\d dba_booking_answers;
\d dba_freelancer_answers;

-- Add unique constraints for dba_booking_answers
-- This will allow ON CONFLICT with booking_id,question_group_id
ALTER TABLE dba_booking_answers 
ADD CONSTRAINT dba_booking_answers_unique_booking_question 
UNIQUE (booking_id, question_group_id);

-- Add unique constraints for dba_freelancer_answers
-- This will allow ON CONFLICT with freelancer_id,job_category_id,question_group_id
ALTER TABLE dba_freelancer_answers 
ADD CONSTRAINT dba_freelancer_answers_unique_freelancer_category_question 
UNIQUE (freelancer_id, job_category_id, question_group_id);

-- Verify constraints were added
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

