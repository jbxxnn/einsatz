-- Fix RLS policies for freelancer_dba_answers to allow clients to read them
-- This is needed for the dispute modal where clients need to view freelancer DBA answers
-- AND for the pre-booking modal where clients need to view freelancer DBA before making a booking

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Freelancers can manage their own DBA answers" ON freelancer_dba_answers;
DROP POLICY IF EXISTS "Admins can view all DBA data" ON freelancer_dba_answers;

-- Create new policies that allow both freelancers and clients to read answers
-- Freelancers can manage their own answers
CREATE POLICY "Freelancers can manage their own DBA answers" 
  ON freelancer_dba_answers FOR ALL 
  USING (auth.uid() = freelancer_id);

-- Clients can read freelancer DBA answers for any job category
-- This allows both the dispute modal and pre-booking modal to work properly
-- Freelancer DBA answers are considered public information that helps clients make decisions
CREATE POLICY "Clients can read freelancer DBA answers" 
  ON freelancer_dba_answers FOR SELECT 
  USING (true); -- Allow any authenticated user to read freelancer DBA answers

-- Admins can still see all data
CREATE POLICY "Admins can view all DBA data" 
  ON freelancer_dba_answers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Also fix freelancer_dba_completions table policies
DROP POLICY IF EXISTS "Freelancers can manage their own DBA completions" ON freelancer_dba_completions;
DROP POLICY IF EXISTS "Admins can view all DBA completions" ON freelancer_dba_completions;

-- Freelancers can manage their own completions
CREATE POLICY "Freelancers can manage their own DBA completions" 
  ON freelancer_dba_completions FOR ALL 
  USING (auth.uid() = freelancer_id);

-- Clients can read freelancer DBA completion status for any job category
-- This is needed for the pre-booking modal to check if freelancer has completed DBA
CREATE POLICY "Clients can read freelancer DBA completions" 
  ON freelancer_dba_completions FOR SELECT 
  USING (true); -- Allow any authenticated user to read freelancer DBA completion status

-- Admins can still see all completions
CREATE POLICY "Admins can view all DBA completions" 
  ON freelancer_dba_completions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Add comments explaining the policies
COMMENT ON POLICY "Clients can read freelancer DBA answers" ON freelancer_dba_answers 
  IS 'Allows clients to read freelancer DBA answers for any job category, enabling both dispute modal and pre-booking modal functionality';

COMMENT ON POLICY "Clients can read freelancer DBA completions" ON freelancer_dba_completions 
  IS 'Allows clients to read freelancer DBA completion status for any job category, needed for pre-booking modal';
