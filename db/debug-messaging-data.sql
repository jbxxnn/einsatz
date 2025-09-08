-- Debug Messaging Data Issues
-- Run this to see what data exists and identify the problem

-- Check if profiles table exists and has data
SELECT 
  'profiles' as table_name,
  COUNT(*) as row_count,
  'Check if profiles table exists and has data' as description
FROM information_schema.tables 
WHERE table_name = 'profiles';

-- Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if profiles table has actual data
SELECT 
  'profiles_data' as table_name,
  COUNT(*) as row_count
FROM profiles;

-- Check conversation_participants data
SELECT 
  'conversation_participants' as table_name,
  COUNT(*) as row_count
FROM conversation_participants;

-- Check a specific conversation's participants
SELECT 
  cp.conversation_id,
  cp.profile_id,
  p.first_name,
  p.last_name,
  p.user_type
FROM conversation_participants cp
LEFT JOIN profiles p ON cp.profile_id = p.id
LIMIT 10;

-- Check if the foreign key relationship is working
SELECT 
  'foreign_key_check' as check_type,
  COUNT(*) as valid_relationships
FROM conversation_participants cp
INNER JOIN profiles p ON cp.profile_id = p.id;

-- Check for orphaned conversation_participants (no matching profile)
SELECT 
  'orphaned_participants' as check_type,
  COUNT(*) as orphaned_count
FROM conversation_participants cp
LEFT JOIN profiles p ON cp.profile_id = p.id
WHERE p.id IS NULL;






























