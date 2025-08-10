-- DBA System Redesign for Correct Dutch Methodology
-- This script updates the existing DBA system to match proper Dutch DBA requirements

-- First, let's backup existing data and update the schema

-- Add new columns to dba_questions table for proper methodology
ALTER TABLE dba_questions 
ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'freelancer' CHECK (audience IN ('freelancer', 'client', 'both')),
ADD COLUMN IF NOT EXISTS options_json JSONB,
ADD COLUMN IF NOT EXISTS score_mapping JSONB,
ADD COLUMN IF NOT EXISTS question_group_id UUID;

-- Update existing questions to have audience instead of is_freelancer_question
UPDATE dba_questions 
SET audience = CASE 
  WHEN is_freelancer_question = true THEN 'freelancer'
  WHEN is_freelancer_question = false THEN 'client'
  ELSE 'freelancer'
END;

-- Create question groups table for shared questions
CREATE TABLE IF NOT EXISTS dba_question_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_question_en TEXT NOT NULL,
  base_question_nl TEXT NOT NULL,
  category dba_category NOT NULL,
  weight INTEGER DEFAULT 1,
  audience TEXT NOT NULL CHECK (audience IN ('freelancer', 'client', 'both')),
  options_json JSONB NOT NULL,
  score_mapping JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dispute tracking table
CREATE TABLE IF NOT EXISTS dba_answer_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  question_group_id UUID NOT NULL REFERENCES dba_question_groups(id) ON DELETE CASCADE,
  freelancer_answer TEXT NOT NULL,
  client_answer TEXT NOT NULL,
  dispute_score INTEGER NOT NULL, -- Higher = more problematic
  resolution_status TEXT DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'acknowledged', 'resolved')),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update dba_reports to include dispute information
ALTER TABLE dba_reports 
ADD COLUMN IF NOT EXISTS dispute_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dispute_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS methodology_version TEXT DEFAULT 'v2_dutch_compliant';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dba_question_groups_audience ON dba_question_groups(audience);
CREATE INDEX IF NOT EXISTS idx_dba_question_groups_category ON dba_question_groups(category);
CREATE INDEX IF NOT EXISTS idx_dba_answer_disputes_booking ON dba_answer_disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_dba_answer_disputes_status ON dba_answer_disputes(resolution_status);

-- Insert the correct Dutch DBA questions based on the export file
-- We'll do this in a separate script to keep this one focused on schema

