-- Create function to calculate combined DBA score (for use in modal before booking)
CREATE OR REPLACE FUNCTION calculate_combined_dba_score(
  p_freelancer_id UUID,
  p_job_category_id UUID,
  p_client_total_score INTEGER
) RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  freelancer_total_score INTEGER := 0;
  combined_score INTEGER := 0;
  risk_level TEXT;
  has_freelancer_dba BOOLEAN := FALSE;
  freelancer_completion_id UUID;
  max_possible_score INTEGER := 0;
BEGIN
  -- Log input parameters
  RAISE NOTICE '🎯 [CALCULATE FUNCTION] Input - freelancer_id: %, job_category_id: %, client_score: %', 
    p_freelancer_id, p_job_category_id, p_client_total_score;
  
  -- Get freelancer DBA score (if exists)
  SELECT id, total_score, is_completed, max_possible_score
  INTO freelancer_completion_id, freelancer_total_score, has_freelancer_dba, max_possible_score
  FROM freelancer_dba_completions
  WHERE freelancer_id = p_freelancer_id 
    AND job_category_id = p_job_category_id 
    AND is_completed = true;
  
  -- Log freelancer lookup results
  RAISE NOTICE '🎯 [CALCULATE FUNCTION] Freelancer DBA - completion_id: %, score: %, completed: %, max_score: %', 
    freelancer_completion_id, freelancer_total_score, has_freelancer_dba, max_possible_score;
  
  -- If freelancer has no DBA, set their score to 0
  IF NOT has_freelancer_dba THEN
    freelancer_total_score := 0;
    freelancer_completion_id := NULL;
    RAISE NOTICE '🎯 [CALCULATE FUNCTION] No freelancer DBA found, setting score to 0';
  END IF;
  
  -- Calculate combined score and risk level
  combined_score := p_client_total_score + freelancer_total_score;
  risk_level := calculate_dba_risk_level(combined_score);
  
  -- Log final calculations
  RAISE NOTICE '🎯 [CALCULATE FUNCTION] Final scores - client: %, freelancer: %, combined: %, risk: %', 
    p_client_total_score, freelancer_total_score, combined_score, risk_level;
  
  -- Return results
  RETURN json_build_object(
    'success', true,
    'client_score', p_client_total_score,
    'freelancer_score', freelancer_total_score,
    'combined_score', combined_score,
    'risk_level', risk_level,
    'has_freelancer_dba', has_freelancer_dba,
    'freelancer_completion_id', freelancer_completion_id,
    'max_possible_score', GREATEST(max_possible_score, 0),
    'calculation_details', json_build_object(
      'freelancer_id', p_freelancer_id,
      'job_category_id', p_job_category_id,
      'freelancer_found', has_freelancer_dba
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RAISE NOTICE '🎯 [CALCULATE FUNCTION] ERROR: %', SQLERRM;
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', 'Failed to calculate combined DBA score',
    'client_score', p_client_total_score,
    'freelancer_score', 0,
    'combined_score', p_client_total_score,
    'risk_level', 'high_risk',
    'has_freelancer_dba', false
  );
END;
$$ LANGUAGE plpgsql;



