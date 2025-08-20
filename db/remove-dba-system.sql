-- ==========================================
-- DBA SYSTEM REMOVAL SCRIPT
-- ==========================================
-- 
-- ⚠️  CRITICAL: BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT!
-- 
-- This script removes the entire DBA (Declaration of Labor Relations) system
-- from the Einsatz platform database. It removes tables, columns, and related
-- constraints in the correct order to avoid foreign key violations.
--
-- Run this script in a transaction for safety:
-- BEGIN;
-- \i db/remove-dba-system.sql
-- COMMIT; -- Only if everything looks good
-- ==========================================

-- Step 1: Remove DBA-related columns from existing tables
-- ==========================================

-- Remove DBA fields from bookings table
ALTER TABLE public.bookings 
DROP COLUMN IF EXISTS has_dba_disputes,
DROP COLUMN IF EXISTS dba_disputes_resolved,
DROP COLUMN IF EXISTS dispute_resolution_deadline;

-- Step 2: Drop dependent tables first (in dependency order)
-- ==========================================

-- Drop dispute message table (depends on dba_question_disputes)
DROP TABLE IF EXISTS public.dba_dispute_messages CASCADE;

-- Drop dispute summary table (depends on bookings)
DROP TABLE IF EXISTS public.dba_booking_dispute_summary CASCADE;

-- Drop answer dispute tables (depend on question groups and bookings)
DROP TABLE IF EXISTS public.dba_answer_disputes CASCADE;
DROP TABLE IF EXISTS public.dba_question_disputes CASCADE;

-- Drop answer tables (depend on questions and question groups)
DROP TABLE IF EXISTS public.dba_freelancer_answers CASCADE;
DROP TABLE IF EXISTS public.dba_booking_answers CASCADE;

-- Drop report and waiver tables (depend on bookings)
DROP TABLE IF EXISTS public.dba_reports CASCADE;
DROP TABLE IF EXISTS public.dba_waivers CASCADE;

-- Drop audit and migration tables
DROP TABLE IF EXISTS public.dba_audit_logs CASCADE;
DROP TABLE IF EXISTS public.dba_migration_log CASCADE;

-- Step 3: Drop core DBA question tables
-- ==========================================

-- Drop question groups table (V2 questions)
DROP TABLE IF EXISTS public.dba_question_groups CASCADE;

-- Drop questions table (V1 questions)
DROP TABLE IF EXISTS public.dba_questions CASCADE;

-- Step 4: Clean up any DBA-related enums and types
-- ==========================================

-- Drop DBA-related enum types if they exist
-- Note: We need to check if these enums are used elsewhere first
-- These commands will fail safely if the types don't exist or are still in use

-- Check and drop dba_category enum if it exists and is not used elsewhere
DO $$ 
BEGIN
    -- Try to drop the enum, will fail if it doesn't exist or is in use
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dba_category') THEN
        -- Check if it's used by any tables other than the ones we just dropped
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE data_type = 'USER-DEFINED' 
            AND udt_name = 'dba_category'
            AND table_name NOT LIKE 'dba_%'
        ) THEN
            DROP TYPE IF EXISTS dba_category CASCADE;
            RAISE NOTICE 'Dropped enum type: dba_category';
        ELSE
            RAISE NOTICE 'Cannot drop dba_category enum - still in use by other tables';
        END IF;
    END IF;
END $$;

-- Step 5: Remove any remaining DBA-related indexes
-- ==========================================

-- Drop any remaining DBA-related indexes (these should be dropped automatically with tables)
-- This is just to be thorough

DO $$
DECLARE
    index_name text;
BEGIN
    FOR index_name IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname LIKE '%dba_%' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS public.' || index_name || ' CASCADE';
        RAISE NOTICE 'Dropped index: %', index_name;
    END LOOP;
END $$;

-- Step 6: Clean up any DBA-related functions or triggers
-- ==========================================

-- Drop any DBA-related functions
DO $$
DECLARE
    func_name text;
BEGIN
    FOR func_name IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%dba_%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_name || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_name;
    END LOOP;
END $$;

-- Step 7: Verification queries
-- ==========================================

-- Verify all DBA tables have been removed
SELECT 'DBA Tables Remaining:' as check_type, count(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%dba_%';

-- Verify all DBA columns have been removed from existing tables
SELECT 'DBA Columns Remaining:' as check_type, count(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE '%dba_%';

-- Verify all DBA functions have been removed
SELECT 'DBA Functions Remaining:' as check_type, count(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%dba_%';

-- Verify all DBA indexes have been removed
SELECT 'DBA Indexes Remaining:' as check_type, count(*) as count
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%dba_%';

-- Step 8: Final summary
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DBA SYSTEM REMOVAL COMPLETED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'The following components have been removed:';
    RAISE NOTICE '✓ All DBA tables (11 tables)';
    RAISE NOTICE '✓ DBA columns from bookings table';
    RAISE NOTICE '✓ DBA-related indexes';
    RAISE NOTICE '✓ DBA-related functions';
    RAISE NOTICE '✓ DBA-related enum types (if unused elsewhere)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Remember to also remove:';
    RAISE NOTICE '  - DBA translation keys from messages/en.json and messages/nl.json';
    RAISE NOTICE '  - DBA documentation files';
    RAISE NOTICE '  - DBA migration files in db/ directory';
    RAISE NOTICE '';
    RAISE NOTICE 'Database cleanup is complete!';
    RAISE NOTICE '==========================================';
END $$;
