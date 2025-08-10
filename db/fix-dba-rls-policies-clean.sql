-- Fix RLS policies for DBA V2 system
-- The issue is that the existing policies don't account for both V1 and V2 usage patterns

-- First, let's check what RLS policies currently exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('dba_freelancer_answers', 'dba_booking_answers')
ORDER BY tablename, policyname;

-- Drop existing problematic policies and recreate them
DROP POLICY IF EXISTS "dba_freelancer_answers_own_policy" ON dba_freelancer_answers;
DROP POLICY IF EXISTS "dba_booking_answers_booking_participants_policy" ON dba_booking_answers;

-- Create comprehensive RLS policy for dba_freelancer_answers
-- Allow freelancers to manage their own answers
CREATE POLICY "dba_freelancer_answers_comprehensive_policy" ON dba_freelancer_answers
  FOR ALL USING (
    auth.uid() = freelancer_id
  )
  WITH CHECK (
    auth.uid() = freelancer_id
  );

-- Create comprehensive RLS policy for dba_booking_answers  
-- Allow clients and freelancers involved in the booking to access answers
CREATE POLICY "dba_booking_answers_comprehensive_policy" ON dba_booking_answers
  FOR ALL USING (
    auth.uid() = client_id OR 
    auth.uid() = freelancer_id OR
    auth.uid() IN (
      SELECT client_id FROM bookings WHERE id = booking_id
      UNION
      SELECT freelancer_id FROM bookings WHERE id = booking_id
    )
  )
  WITH CHECK (
    auth.uid() = client_id OR 
    auth.uid() = freelancer_id OR
    auth.uid() IN (
      SELECT client_id FROM bookings WHERE id = booking_id
      UNION
      SELECT freelancer_id FROM bookings WHERE id = booking_id
    )
  );

-- Also create a policy for admins to access all DBA data
CREATE POLICY "dba_freelancer_answers_admin_policy" ON dba_freelancer_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "dba_booking_answers_admin_policy" ON dba_booking_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Verify the new policies are in place
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('dba_freelancer_answers', 'dba_booking_answers')
ORDER BY tablename, policyname;

SELECT 'RLS policies updated for DBA V2 system' as status;
