-- Create a debug RPC function with SECURITY DEFINER to test freelancer DBA access
CREATE OR REPLACE FUNCTION get_freelancer_dba_debug(
  p_freelancer_id UUID DEFAULT NULL,
  p_job_category_id UUID DEFAULT NULL
) RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  all_completions_count INTEGER;
  all_answers_count INTEGER;
  specific_freelancer_data JSON;
  category_specific_data JSON;
BEGIN
  -- Count all completions
  SELECT COUNT(*) INTO all_completions_count FROM freelancer_dba_completions;
  
  -- Count all answers  
  SELECT COUNT(*) INTO all_answers_count FROM freelancer_dba_answers;
  
  -- Get specific freelancer data if provided
  IF p_freelancer_id IS NOT NULL THEN
    SELECT json_agg(
      json_build_object(
        'id', id,
        'freelancer_id', freelancer_id,
        'job_category_id', job_category_id,
        'total_score', total_score,
        'is_completed', is_completed,
        'risk_level', risk_level
      )
    ) INTO specific_freelancer_data
    FROM freelancer_dba_completions
    WHERE freelancer_id = p_freelancer_id;
    
    -- Get category-specific data if both IDs provided
    IF p_job_category_id IS NOT NULL THEN
      SELECT json_agg(
        json_build_object(
          'id', id,
          'freelancer_id', freelancer_id,
          'job_category_id', job_category_id,
          'total_score', total_score,
          'is_completed', is_completed,
          'risk_level', risk_level,
          'completed_at', completed_at
        )
      ) INTO category_specific_data
      FROM freelancer_dba_completions
      WHERE freelancer_id = p_freelancer_id 
        AND job_category_id = p_job_category_id;
    END IF;
  END IF;
  
  -- Build result
  result := json_build_object(
    'all_completions_count', all_completions_count,
    'all_answers_count', all_answers_count,
    'specific_freelancer_data', COALESCE(specific_freelancer_data, '[]'::json),
    'category_specific_data', COALESCE(category_specific_data, '[]'::json),
    'parameters', json_build_object(
      'freelancer_id', p_freelancer_id,
      'job_category_id', p_job_category_id
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;



