-- Client DBA Processing Functions
-- Run this after creating the client DBA tables

-- Function to process client DBA submission and calculate risk
CREATE OR REPLACE FUNCTION process_client_dba_submission(
  p_booking_id UUID,
  p_client_id UUID,
  p_freelancer_id UUID,
  p_job_category_id UUID,
  p_answers JSON
) RETURNS JSON AS $$
DECLARE
  client_total_score INTEGER := 0;
  freelancer_total_score INTEGER := 0;
  combined_score INTEGER := 0;
  risk_level TEXT;
  has_freelancer_dba BOOLEAN := FALSE;
  freelancer_completion_id UUID;
  assessment_record RECORD;
  answer_record JSON;
BEGIN
  -- Clear existing client answers for this booking
  DELETE FROM client_dba_answers WHERE booking_id = p_booking_id;
  
  -- Insert new client answers and calculate total score
  FOR answer_record IN SELECT * FROM json_array_elements(p_answers)
  LOOP
    INSERT INTO client_dba_answers (
      booking_id,
      question_id,
      selected_option_index,
      answer_score
    ) VALUES (
      p_booking_id,
      (answer_record->>'question_id')::INTEGER,
      (answer_record->>'selected_option_index')::INTEGER,
      (answer_record->>'answer_score')::INTEGER
    );
    
    client_total_score := client_total_score + (answer_record->>'answer_score')::INTEGER;
  END LOOP;
  
  -- Get freelancer DBA score (if exists)
  SELECT id, total_score, is_completed
  INTO freelancer_completion_id, freelancer_total_score, has_freelancer_dba
  FROM freelancer_dba_completions
  WHERE freelancer_id = p_freelancer_id 
    AND job_category_id = p_job_category_id 
    AND is_completed = true;
  
  -- If freelancer has no DBA, set their score to 0
  IF NOT has_freelancer_dba THEN
    freelancer_total_score := 0;
    freelancer_completion_id := NULL;
  END IF;
  
  -- Calculate combined score and risk level
  combined_score := client_total_score + freelancer_total_score;
  risk_level := calculate_dba_risk_level(combined_score);
  
  -- Insert or update assessment record
  INSERT INTO booking_dba_assessments (
    booking_id,
    job_category_id,
    freelancer_id,
    client_id,
    client_total_score,
    freelancer_total_score,
    combined_score,
    risk_level,
    has_freelancer_dba,
    freelancer_dba_completion_id,
    client_decision
  ) VALUES (
    p_booking_id,
    p_job_category_id,
    p_freelancer_id,
    p_client_id,
    client_total_score,
    freelancer_total_score,
    combined_score,
    risk_level,
    has_freelancer_dba,
    freelancer_completion_id,
    CASE WHEN risk_level = 'safe' THEN 'proceed' ELSE 'pending' END
  )
  ON CONFLICT (booking_id) 
  DO UPDATE SET
    client_total_score = EXCLUDED.client_total_score,
    freelancer_total_score = EXCLUDED.freelancer_total_score,
    combined_score = EXCLUDED.combined_score,
    risk_level = EXCLUDED.risk_level,
    has_freelancer_dba = EXCLUDED.has_freelancer_dba,
    freelancer_dba_completion_id = EXCLUDED.freelancer_dba_completion_id,
    client_decision = EXCLUDED.client_decision,
    updated_at = NOW()
  RETURNING * INTO assessment_record;
  
  -- Return assessment results
  RETURN json_build_object(
    'success', true,
    'assessment', json_build_object(
      'id', assessment_record.id,
      'booking_id', assessment_record.booking_id,
      'client_total_score', assessment_record.client_total_score,
      'freelancer_total_score', assessment_record.freelancer_total_score,
      'combined_score', assessment_record.combined_score,
      'risk_level', assessment_record.risk_level,
      'has_freelancer_dba', assessment_record.has_freelancer_dba,
      'client_decision', assessment_record.client_decision,
      'dispute_opened', assessment_record.dispute_opened
    ),
    'risk_thresholds', json_build_object(
      'safe', '< 45 punten - Waarschijnlijk zelfstandige (veilig gebied)',
      'doubtful', '45-70 punten - Twijfelachtig – geen duidelijk oordeel (grijs)',
      'high_risk', '> 70 punten - Waarschijnlijk dienstverband (risicogebied)'
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', 'Failed to process client DBA submission'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if freelancer has DBA for job category
CREATE OR REPLACE FUNCTION check_freelancer_dba_status(
  p_freelancer_id UUID,
  p_job_category_id UUID
) RETURNS JSON AS $$
DECLARE
  completion_record RECORD;
BEGIN
  SELECT *
  INTO completion_record
  FROM freelancer_dba_completions
  WHERE freelancer_id = p_freelancer_id 
    AND job_category_id = p_job_category_id 
    AND is_completed = true;
  
  IF FOUND THEN
    RETURN json_build_object(
      'has_dba', true,
      'completion_id', completion_record.id,
      'total_score', completion_record.total_score,
      'risk_level', completion_record.risk_level,
      'completed_at', completion_record.completed_at
    );
  ELSE
    RETURN json_build_object(
      'has_dba', false,
      'message', 'Freelancer has not completed DBA for this job category'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate DBA assessment after freelancer updates
CREATE OR REPLACE FUNCTION recalculate_booking_dba_assessment(
  p_booking_id UUID
) RETURNS JSON AS $$
DECLARE
  assessment_record RECORD;
  new_freelancer_score INTEGER;
  new_combined_score INTEGER;
  new_risk_level TEXT;
BEGIN
  -- Get current assessment
  SELECT *
  INTO assessment_record
  FROM booking_dba_assessments
  WHERE booking_id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Assessment not found for booking'
    );
  END IF;
  
  -- Get updated freelancer score
  SELECT COALESCE(total_score, 0)
  INTO new_freelancer_score
  FROM freelancer_dba_completions
  WHERE freelancer_id = assessment_record.freelancer_id 
    AND job_category_id = assessment_record.job_category_id
    AND is_completed = true;
  
  -- Recalculate
  new_combined_score := assessment_record.client_total_score + COALESCE(new_freelancer_score, 0);
  new_risk_level := calculate_dba_risk_level(new_combined_score);
  
  -- Update assessment
  UPDATE booking_dba_assessments
  SET 
    freelancer_total_score = COALESCE(new_freelancer_score, 0),
    combined_score = new_combined_score,
    risk_level = new_risk_level,
    has_freelancer_dba = (new_freelancer_score IS NOT NULL),
    updated_at = NOW()
  WHERE booking_id = p_booking_id
  RETURNING * INTO assessment_record;
  
  RETURN json_build_object(
    'success', true,
    'assessment', json_build_object(
      'booking_id', assessment_record.booking_id,
      'client_total_score', assessment_record.client_total_score,
      'freelancer_total_score', assessment_record.freelancer_total_score,
      'combined_score', assessment_record.combined_score,
      'risk_level', assessment_record.risk_level,
      'has_freelancer_dba', assessment_record.has_freelancer_dba
    )
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_client_dba_submission IS 'Processes client DBA answers and calculates risk assessment';
COMMENT ON FUNCTION check_freelancer_dba_status IS 'Checks if freelancer has completed DBA for a job category';
COMMENT ON FUNCTION recalculate_booking_dba_assessment IS 'Recalculates DBA assessment after freelancer updates their answers';






