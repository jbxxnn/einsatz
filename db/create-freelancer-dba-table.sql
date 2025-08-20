-- ==========================================
-- FREELANCER DBA SYSTEM - TABLE DESIGN
-- ==========================================
-- This creates the new simplified DBA system for freelancers only
-- Based on the 35-question Dutch DBA compliance structure
-- 
-- Key Features:
-- - Auto-answer preset questions (not shown to users)
-- - Group questions by categories for better UX
-- - Optional completion (not mandatory)
-- - Per job category DBA completion

-- Create enum for respondent types (for validation)
CREATE TYPE dba_respondent_type AS ENUM (
  'freelancer',
  'client', 
  'preset_yes',
  'preset_no'
);

-- Main DBA questions table
CREATE TABLE dba_questions (
  id INTEGER PRIMARY KEY, -- Use the ID from JSON (1-35)
  question_text TEXT NOT NULL,
  respondent_type dba_respondent_type NOT NULL,
  options_json JSONB NOT NULL, -- Array of answer options
  score_mapping JSONB NOT NULL, -- Maps option index to points
  category TEXT, -- For grouping questions (e.g., 'control', 'independence', 'risk')
  display_order INTEGER DEFAULT 0, -- For ordering within categories
  is_visible BOOLEAN DEFAULT TRUE, -- Hide preset questions from UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Freelancer DBA answers table
CREATE TABLE freelancer_dba_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES dba_questions(id) ON DELETE CASCADE,
  selected_option_index INTEGER NOT NULL, -- Which option they selected (0-based index)
  answer_score INTEGER NOT NULL, -- The points for their selected answer
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one answer per freelancer per job category per question
  UNIQUE(freelancer_id, job_category_id, question_id)
);

-- DBA completion tracking table
CREATE TABLE freelancer_dba_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answered_questions INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_possible_score INTEGER NOT NULL DEFAULT 0,
  risk_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0.00 to 100.00
  risk_level TEXT CHECK (risk_level IN ('safe', 'doubtful', 'high_risk')),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One completion record per freelancer per job category
  UNIQUE(freelancer_id, job_category_id)
);

-- Create indexes for performance
CREATE INDEX idx_freelancer_dba_answers_freelancer_category 
  ON freelancer_dba_answers(freelancer_id, job_category_id);

CREATE INDEX idx_freelancer_dba_answers_question 
  ON freelancer_dba_answers(question_id);

CREATE INDEX idx_freelancer_dba_completions_freelancer 
  ON freelancer_dba_completions(freelancer_id);

CREATE INDEX idx_freelancer_dba_completions_category 
  ON freelancer_dba_completions(job_category_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE dba_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_dba_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_dba_completions ENABLE ROW LEVEL SECURITY;

-- DBA questions are readable by everyone (public data)
CREATE POLICY "DBA questions are publicly readable" 
  ON dba_questions FOR SELECT 
  USING (true);

-- Freelancers can only see/modify their own answers
CREATE POLICY "Freelancers can manage their own DBA answers" 
  ON freelancer_dba_answers FOR ALL 
  USING (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can manage their own DBA completions" 
  ON freelancer_dba_completions FOR ALL 
  USING (auth.uid() = freelancer_id);

-- Admins can see all DBA data (optional)
CREATE POLICY "Admins can view all DBA data" 
  ON freelancer_dba_answers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can view all DBA completions" 
  ON freelancer_dba_completions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );
