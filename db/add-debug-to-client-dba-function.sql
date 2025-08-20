-- Add debug logging to the client DBA function
-- This will help us see what's happening with the freelancer score lookup

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
  debug_info JSON;
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
  
  -- DEBUG: Log freelancer lookup parameters
  RAISE NOTICE 'DEBUG: Looking up freelancer DBA for freelancer_id=%, job_category_id=%', p_freelancer_id, p_job_category_id;
  
  -- Get freelancer DBA score (if exists)
  SELECT id, total_score, is_completed
  INTO freelancer_completion_id, freelancer_total_score, has_freelancer_dba
  FROM freelancer_dba_completions
  WHERE freelancer_id = p_freelancer_id 
    AND job_category_id = p_job_category_id 
    AND is_completed = true;
  
  -- DEBUG: Log freelancer lookup results
  RAISE NOTICE 'DEBUG: Freelancer DBA lookup results - completion_id=%, score=%, completed=%', 
    freelancer_completion_id, freelancer_total_score, has_freelancer_dba;
  
  -- If freelancer has no DBA, set their score to 0
  IF NOT has_freelancer_dba THEN
    freelancer_total_score := 0;
    freelancer_completion_id := NULL;
    RAISE NOTICE 'DEBUG: No freelancer DBA found, setting score to 0';
  END IF;
  
  -- Calculate combined score and risk level
  combined_score := client_total_score + freelancer_total_score;
  risk_level := calculate_dba_risk_level(combined_score);
  
  -- DEBUG: Log final calculations
  RAISE NOTICE 'DEBUG: Final scores - client=%, freelancer=%, combined=%, risk=%', 
    client_total_score, freelancer_total_score, combined_score, risk_level;
  
  -- Create or update booking DBA assessment
  INSERT INTO booking_dba_assessments (
    booking_id,
    client_total_score,
    freelancer_total_score,
    combined_score,
    risk_level,
    has_freelancer_dba,
    freelancer_dba_completion_id,
    client_decision
  ) VALUES (
    p_booking_id,
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
  
  -- Build debug info
  debug_info := json_build_object(
    'freelancer_id', p_freelancer_id,
    'job_category_id', p_job_category_id,
    'freelancer_completion_id', freelancer_completion_id,
    'has_freelancer_dba', has_freelancer_dba,
    'client_score', client_total_score,
    'freelancer_score', freelancer_total_score,
    'combined_score', combined_score,
    'risk_level', risk_level
  );
  
  -- Return assessment results with debug info
  RETURN json_build_object(
    'success', true,
    'debug', debug_info,
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
    'detail', 'Failed to process client DBA submission',
    'debug', json_build_object(
      'freelancer_id', p_freelancer_id,
      'job_category_id', p_job_category_id,
      'client_score', client_total_score
    )
  );
END;
$$ LANGUAGE plpgsql;




