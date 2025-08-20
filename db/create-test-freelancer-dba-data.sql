-- Create test freelancer DBA data for testing the client DBA flow
-- This will insert sample answers for the freelancer so we can test the combined scoring

-- First, let's see what categories exist
-- SELECT id, name FROM job_categories;

-- Insert sample freelancer DBA answers for the freelancer and category we're testing
-- Freelancer: 8dc55959-56af-4946-a096-c09db5cfcf68
-- Category: 2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e

-- Sample answers for freelancer questions (questions with respondent_type = 'freelancer')
INSERT INTO freelancer_dba_answers (
  freelancer_id,
  job_category_id,
  question_id,
  selected_option_index,
  answer_score
) VALUES
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 1, 0, 10),
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 2, 1, 5),
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 3, 0, 8),
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 6, 2, 3),
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 7, 1, 7),
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 8, 0, 6),
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 11, 1, 4),
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 12, 0, 9),
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 15, 2, 2),
  ('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 16, 1, 5)
ON CONFLICT (freelancer_id, job_category_id, question_id) 
DO UPDATE SET 
  selected_option_index = EXCLUDED.selected_option_index,
  answer_score = EXCLUDED.answer_score,
  answered_at = NOW();

-- Auto-answer preset questions
SELECT auto_answer_preset_questions('8dc55959-56af-4946-a096-c09db5cfcf68', '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e');

-- Calculate total score and create completion record
WITH freelancer_stats AS (
  SELECT 
    COUNT(*) as answered_questions,
    SUM(answer_score) as total_score,
    (SELECT COUNT(*) FROM dba_questions WHERE respondent_type IN ('freelancer', 'preset_yes', 'preset_no')) as total_questions,
    (SELECT SUM(
      CASE 
        WHEN respondent_type = 'freelancer' THEN 10 -- Max score per question
        WHEN respondent_type = 'preset_yes' THEN 0
        WHEN respondent_type = 'preset_no' THEN 10
        ELSE 0
      END
    ) FROM dba_questions WHERE respondent_type IN ('freelancer', 'preset_yes', 'preset_no')) as max_possible_score
  FROM freelancer_dba_answers 
  WHERE freelancer_id = '8dc55959-56af-4946-a096-c09db5cfcf68' 
    AND job_category_id = '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e'
)
INSERT INTO freelancer_dba_completions (
  freelancer_id,
  job_category_id,
  total_questions,
  answered_questions,
  total_score,
  max_possible_score,
  risk_percentage,
  risk_level,
  is_completed,
  completed_at
)
SELECT 
  '8dc55959-56af-4946-a096-c09db5cfcf68',
  '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e',
  total_questions,
  answered_questions,
  total_score,
  max_possible_score,
  ROUND((total_score::DECIMAL / NULLIF(max_possible_score, 0)) * 100, 2),
  CASE 
    WHEN total_score < 45 THEN 'safe'
    WHEN total_score <= 70 THEN 'doubtful'
    ELSE 'high_risk'
  END,
  true,
  NOW()
FROM freelancer_stats
ON CONFLICT (freelancer_id, job_category_id) 
DO UPDATE SET 
  answered_questions = EXCLUDED.answered_questions,
  total_score = EXCLUDED.total_score,
  max_possible_score = EXCLUDED.max_possible_score,
  risk_percentage = EXCLUDED.risk_percentage,
  risk_level = EXCLUDED.risk_level,
  is_completed = EXCLUDED.is_completed,
  completed_at = EXCLUDED.completed_at,
  updated_at = NOW();

-- Verify the data was created
SELECT 
  freelancer_id,
  job_category_id,
  total_score,
  risk_level,
  is_completed
FROM freelancer_dba_completions 
WHERE freelancer_id = '8dc55959-56af-4946-a096-c09db5cfcf68' 
  AND job_category_id = '2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e';



