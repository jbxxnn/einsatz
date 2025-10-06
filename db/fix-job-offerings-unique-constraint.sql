-- ==========================================
-- FIX JOB OFFERINGS UNIQUE CONSTRAINT
-- ==========================================
-- 
-- Problem: Current constraint only checks (freelancer_id, category_id)
-- This prevents adding multiple job offerings with the same category
-- but different subcategories.
--
-- Solution: Update constraint to include subcategory_id, allowing
-- multiple offerings per category as long as subcategories differ.
--
-- Run this script in a transaction for safety:
-- BEGIN;
-- \i db/fix-job-offerings-unique-constraint.sql
-- COMMIT; -- Only if everything looks good
-- ==========================================

-- Step 1: Drop the existing constraint
-- ==========================================
ALTER TABLE freelancer_job_offerings 
DROP CONSTRAINT IF EXISTS freelancer_job_offerings_freelancer_id_category_id_key;

-- Alternative constraint name that might exist in different versions
ALTER TABLE freelancer_job_offerings 
DROP CONSTRAINT IF EXISTS freelancer_job_offerings_freelancer_category_key;

-- Step 2: Create partial unique indexes
-- ==========================================

-- Index 1: When subcategory_id is NOT NULL, ensure unique combination of 
-- (freelancer_id, category_id, subcategory_id)
CREATE UNIQUE INDEX IF NOT EXISTS freelancer_job_offerings_unique_with_subcategory
ON freelancer_job_offerings (freelancer_id, category_id, subcategory_id)
WHERE subcategory_id IS NOT NULL;

-- Index 2: When subcategory_id IS NULL, ensure unique combination of
-- (freelancer_id, category_id) - allows only one offering per category without subcategory
CREATE UNIQUE INDEX IF NOT EXISTS freelancer_job_offerings_unique_without_subcategory
ON freelancer_job_offerings (freelancer_id, category_id)
WHERE subcategory_id IS NULL;

-- Step 3: Verify the changes
-- ==========================================
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'freelancer_job_offerings' 
AND indexname LIKE '%unique%';

-- Expected output should show both partial unique indexes


