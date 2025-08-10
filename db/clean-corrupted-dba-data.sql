-- Clean up corrupted DBA data that might be causing UUID errors
-- This script removes any rows with NULL or invalid question_group_id values

-- First, let's see what corrupted data exists
SELECT 'Checking for corrupted data in dba_freelancer_answers...' as status;

SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN question_group_id IS NULL THEN 1 END) as null_question_group_id,
  COUNT(CASE WHEN question_group_id = 'null' THEN 1 END) as string_null_question_group_id,
  COUNT(CASE WHEN question_group_id = '' THEN 1 END) as empty_question_group_id
FROM dba_freelancer_answers;

SELECT 'Checking for corrupted data in dba_booking_answers...' as status;

SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN question_group_id IS NULL THEN 1 END) as null_question_group_id,
  COUNT(CASE WHEN question_group_id = 'null' THEN 1 END) as string_null_question_group_id,
  COUNT(CASE WHEN question_group_id = '' THEN 1 END) as empty_question_group_id
FROM dba_booking_answers;

-- Clean up corrupted data in dba_freelancer_answers
DELETE FROM dba_freelancer_answers 
WHERE question_group_id IS NULL 
   OR question_group_id = 'null' 
   OR question_group_id = '';

-- Clean up corrupted data in dba_booking_answers  
DELETE FROM dba_booking_answers 
WHERE question_group_id IS NULL 
   OR question_group_id = 'null' 
   OR question_group_id = '';

-- Verify the cleanup
SELECT 'Verifying cleanup of dba_freelancer_answers...' as status;

SELECT 
  COUNT(*) as remaining_rows,
  COUNT(CASE WHEN question_group_id IS NULL THEN 1 END) as remaining_null_question_group_id,
  COUNT(CASE WHEN question_group_id = 'null' THEN 1 END) as remaining_string_null_question_group_id,
  COUNT(CASE WHEN question_group_id = '' THEN 1 END) as remaining_empty_question_group_id
FROM dba_freelancer_answers;

SELECT 'Verifying cleanup of dba_booking_answers...' as status;

SELECT 
  COUNT(*) as remaining_rows,
  COUNT(CASE WHEN question_group_id IS NULL THEN 1 END) as remaining_null_question_group_id,
  COUNT(CASE WHEN question_group_id = 'null' THEN 1 END) as remaining_string_null_question_group_id,
  COUNT(CASE WHEN question_group_id = '' THEN 1 END) as remaining_empty_question_group_id
FROM dba_booking_answers;

-- Also check for any orphaned question groups
SELECT 'Checking for orphaned question groups...' as status;

SELECT 
  COUNT(*) as orphaned_freelancer_answers
FROM dba_freelancer_answers f
LEFT JOIN dba_question_groups qg ON f.question_group_id = qg.id
WHERE qg.id IS NULL;

SELECT 
  COUNT(*) as orphaned_booking_answers
FROM dba_booking_answers b
LEFT JOIN dba_question_groups qg ON b.question_group_id = qg.id
WHERE qg.id IS NULL;

-- Clean up orphaned answers
DELETE FROM dba_freelancer_answers 
WHERE question_group_id NOT IN (SELECT id FROM dba_question_groups);

DELETE FROM dba_booking_answers 
WHERE question_group_id NOT IN (SELECT id FROM dba_question_groups);

SELECT 'DBA data cleanup completed successfully!' as status;
