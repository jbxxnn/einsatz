-- DBA System Tables for Einsatz Platform
-- This file adds the DBA (Declaration of Labor Relations) compliance system
-- Run this AFTER the main schema.sql file

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create DBA question categories enum (if not exists)
DO $$ BEGIN
    CREATE TYPE dba_category AS ENUM ('control', 'substitution', 'tools', 'risk', 'economic_independence');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create DBA risk levels enum (if not exists)
DO $$ BEGIN
    CREATE TYPE dba_risk_level AS ENUM ('safe', 'doubtful', 'high_risk');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create DBA questions table
CREATE TABLE IF NOT EXISTS dba_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category dba_category NOT NULL,
  question_text_en TEXT NOT NULL,
  question_text_nl TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'boolean', -- boolean, multiple_choice, text
  options JSONB, -- For multiple choice questions
  weight INTEGER DEFAULT 1, -- Scoring weight (1-3)
  is_freelancer_question BOOLEAN NOT NULL, -- true for freelancer, false for client
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create DBA freelancer answers table
CREATE TABLE IF NOT EXISTS dba_freelancer_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES dba_questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL, -- JSON string for complex answers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(freelancer_id, job_category_id, question_id)
);

-- Create DBA booking answers table (client answers per booking)
CREATE TABLE IF NOT EXISTS dba_booking_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES dba_questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, question_id)
);

-- Create DBA reports table
CREATE TABLE IF NOT EXISTS dba_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  risk_level dba_risk_level NOT NULL,
  answers_json JSONB NOT NULL, -- Complete Q&A data
  pdf_url TEXT, -- URL to generated PDF
  contract_pdf_url TEXT, -- URL to contract with DBA embedded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create DBA waivers table
CREATE TABLE IF NOT EXISTS dba_waivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  waiver_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create DBA audit logs table
CREATE TABLE IF NOT EXISTS dba_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'questionnaire_completed', 'report_generated', 'waiver_signed', etc.
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_dba_freelancer_answers_freelancer_category ON dba_freelancer_answers(freelancer_id, job_category_id);
CREATE INDEX IF NOT EXISTS idx_dba_booking_answers_booking ON dba_booking_answers(booking_id);
CREATE INDEX IF NOT EXISTS idx_dba_reports_booking ON dba_reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_dba_waivers_booking ON dba_waivers(booking_id);
CREATE INDEX IF NOT EXISTS idx_dba_audit_logs_booking ON dba_audit_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_dba_questions_category_type ON dba_questions(category, is_freelancer_question);

-- Additional performance indexes for DBA system
CREATE INDEX IF NOT EXISTS idx_dba_freelancer_answers_question ON dba_freelancer_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_dba_freelancer_answers_updated ON dba_freelancer_answers(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_dba_questions_order ON dba_questions(order_index, is_freelancer_question);
CREATE INDEX IF NOT EXISTS idx_dba_audit_logs_user_action ON dba_audit_logs(user_id, action, created_at DESC);

-- Create function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_dba_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (if not exist)
DO $$ BEGIN
    CREATE TRIGGER update_dba_questions_updated_at
      BEFORE UPDATE ON dba_questions
      FOR EACH ROW EXECUTE PROCEDURE update_dba_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_dba_freelancer_answers_updated_at
      BEFORE UPDATE ON dba_freelancer_answers
      FOR EACH ROW EXECUTE PROCEDURE update_dba_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_dba_reports_updated_at
      BEFORE UPDATE ON dba_reports
      FOR EACH ROW EXECUTE PROCEDURE update_dba_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert sample questions (only if table is empty)
INSERT INTO dba_questions (category, question_text_en, question_text_nl, question_type, is_freelancer_question, order_index)
SELECT * FROM (VALUES
-- Control questions (Freelancer)
('control'::dba_category, 'Do you have the freedom to determine how to perform your work?', 'Heb je de vrijheid om te bepalen hoe je je werk uitvoert?', 'boolean', true, 1),
('control'::dba_category, 'Can you set your own working hours?', 'Kun je je eigen werktijden bepalen?', 'boolean', true, 2),
('control'::dba_category, 'Do you receive detailed instructions on how to perform your work?', 'Krijg je gedetailleerde instructies over hoe je je werk moet uitvoeren?', 'boolean', true, 3),

-- Substitution questions (Freelancer)
('substitution'::dba_category, 'Can you send someone else to do the work in your place?', 'Kun je iemand anders sturen om het werk in jouw plaats te doen?', 'boolean', true, 4),
('substitution'::dba_category, 'Do you have the right to hire assistants?', 'Heb je het recht om assistenten in te huren?', 'boolean', true, 5),

-- Tools questions (Freelancer)
('tools'::dba_category, 'Do you provide your own tools and equipment?', 'Stel je je eigen gereedschap en apparatuur beschikbaar?', 'boolean', true, 6),
('tools'::dba_category, 'Do you use your own vehicle for work?', 'Gebruik je je eigen voertuig voor werk?', 'boolean', true, 7),

-- Risk questions (Freelancer)
('risk'::dba_category, 'Do you bear financial risk for the work performed?', 'Loop je financieel risico voor het uitgevoerde werk?', 'boolean', true, 8),
('risk'::dba_category, 'Do you have your own business insurance?', 'Heb je je eigen bedrijfsverzekering?', 'boolean', true, 9),

-- Economic Independence questions (Freelancer)
('economic_independence'::dba_category, 'Do you work for multiple clients?', 'Werk je voor meerdere opdrachtgevers?', 'boolean', true, 10),
('economic_independence'::dba_category, 'Do you have your own business registration?', 'Heb je je eigen bedrijfsregistratie?', 'boolean', true, 11),

-- Control questions (Client)
('control'::dba_category, 'Do you supervise the work being performed?', 'Begeleid je het werk dat wordt uitgevoerd?', 'boolean', false, 12),
('control'::dba_category, 'Do you provide detailed instructions on how to perform the work?', 'Geef je gedetailleerde instructies over hoe het werk moet worden uitgevoerd?', 'boolean', false, 13),

-- Substitution questions (Client)
('substitution'::dba_category, 'Do you require the specific person to perform the work?', 'Eis je dat de specifieke persoon het werk uitvoert?', 'boolean', false, 14),

-- Tools questions (Client)
('tools'::dba_category, 'Do you provide tools and equipment for the work?', 'Stel je gereedschap en apparatuur beschikbaar voor het werk?', 'boolean', false, 15),

-- Risk questions (Client)
('risk'::dba_category, 'Do you bear the financial risk for the work outcome?', 'Loop je het financiële risico voor het werkresultaat?', 'boolean', false, 16),

-- Economic Independence questions (Client)
('economic_independence'::dba_category, 'Is this work core to your business operations?', 'Is dit werk kern van je bedrijfsactiviteiten?', 'boolean', false, 17)
) AS v(category, question_text_en, question_text_nl, question_type, is_freelancer_question, order_index)
WHERE NOT EXISTS (SELECT 1 FROM dba_questions LIMIT 1);

-- Add RLS policies for security (if not exist)
ALTER TABLE dba_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dba_freelancer_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dba_booking_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dba_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dba_waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dba_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dba_questions (read-only for authenticated users)
DO $$ BEGIN
    CREATE POLICY "dba_questions_read_policy" ON dba_questions
      FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for dba_freelancer_answers
DO $$ BEGIN
    CREATE POLICY "dba_freelancer_answers_own_policy" ON dba_freelancer_answers
      FOR ALL USING (auth.uid() = freelancer_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for dba_booking_answers
DO $$ BEGIN
    CREATE POLICY "dba_booking_answers_booking_participants_policy" ON dba_booking_answers
      FOR ALL USING (
        auth.uid() = client_id OR 
        auth.uid() = freelancer_id
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for dba_reports
DO $$ BEGIN
    CREATE POLICY "dba_reports_booking_participants_policy" ON dba_reports
      FOR ALL USING (
        auth.uid() = client_id OR 
        auth.uid() = freelancer_id
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for dba_waivers
DO $$ BEGIN
    CREATE POLICY "dba_waivers_client_policy" ON dba_waivers
      FOR ALL USING (auth.uid() = client_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for dba_audit_logs (read-only for users who created the audit log)
DO $$ BEGIN
    CREATE POLICY "dba_audit_logs_read_policy" ON dba_audit_logs
      FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 