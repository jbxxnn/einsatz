-- Client DBA System Database Schema
-- Run this to create tables for client DBA functionality

-- Client DBA answers table (per booking)
CREATE TABLE client_dba_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES dba_questions(id) ON DELETE CASCADE,
  selected_option_index INTEGER NOT NULL, -- Which option they selected (0-based index)
  answer_score INTEGER NOT NULL, -- The points for their selected answer
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one answer per question per booking
  UNIQUE(booking_id, question_id)
);

-- DBA assessment results table (per booking)
CREATE TABLE booking_dba_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  job_category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Score breakdown
  client_total_score INTEGER NOT NULL DEFAULT 0,
  freelancer_total_score INTEGER NOT NULL DEFAULT 0,
  combined_score INTEGER NOT NULL DEFAULT 0,
  
  -- Risk assessment
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'doubtful', 'high_risk')),
  risk_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- For future use
  
  -- Freelancer DBA status
  has_freelancer_dba BOOLEAN NOT NULL DEFAULT FALSE,
  freelancer_dba_completion_id UUID REFERENCES freelancer_dba_completions(id),
  
  -- Client decision tracking
  client_decision TEXT NOT NULL DEFAULT 'pending' CHECK (client_decision IN ('pending', 'proceed', 'cancelled', 'disputed')),
  
  -- Dispute tracking
  dispute_opened BOOLEAN NOT NULL DEFAULT FALSE,
  dispute_opened_at TIMESTAMP WITH TIME ZONE,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  dispute_resolution_type TEXT CHECK (dispute_resolution_type IN ('freelancer_updated', 'client_proceeded', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one assessment per booking
  UNIQUE(booking_id)
);

-- DBA disputes table (extends messaging system)
CREATE TABLE dba_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES booking_dba_assessments(id) ON DELETE CASCADE,
  
  -- Participants
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'cancelled')),
  resolution_type TEXT CHECK (resolution_type IN ('freelancer_updated', 'client_proceeded', 'cancelled')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure one dispute per booking
  UNIQUE(booking_id)
);

-- Create indexes for performance
CREATE INDEX idx_client_dba_answers_booking_id ON client_dba_answers(booking_id);
CREATE INDEX idx_client_dba_answers_question_id ON client_dba_answers(question_id);
CREATE INDEX idx_booking_dba_assessments_booking_id ON booking_dba_assessments(booking_id);
CREATE INDEX idx_booking_dba_assessments_client_id ON booking_dba_assessments(client_id);
CREATE INDEX idx_booking_dba_assessments_freelancer_id ON booking_dba_assessments(freelancer_id);
CREATE INDEX idx_booking_dba_assessments_risk_level ON booking_dba_assessments(risk_level);
CREATE INDEX idx_dba_disputes_booking_id ON dba_disputes(booking_id);
CREATE INDEX idx_dba_disputes_status ON dba_disputes(status);

-- RLS (Row Level Security) Policies

-- Client DBA Answers: Users can only access their own booking answers
ALTER TABLE client_dba_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client DBA answers" ON client_dba_answers
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE client_id = auth.uid() OR freelancer_id = auth.uid()
    )
  );

CREATE POLICY "Clients can insert their own DBA answers" ON client_dba_answers
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their own DBA answers" ON client_dba_answers
  FOR UPDATE USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id = auth.uid()
    )
  );

-- Booking DBA Assessments: Viewable by both client and freelancer
ALTER TABLE booking_dba_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view DBA assessments for their bookings" ON booking_dba_assessments
  FOR SELECT USING (
    client_id = auth.uid() OR freelancer_id = auth.uid()
  );

CREATE POLICY "System can insert DBA assessments" ON booking_dba_assessments
  FOR INSERT WITH CHECK (true); -- Will be handled by API validation

CREATE POLICY "Users can update assessments for their bookings" ON booking_dba_assessments
  FOR UPDATE USING (
    client_id = auth.uid() OR freelancer_id = auth.uid()
  );

-- DBA Disputes: Viewable by participants
ALTER TABLE dba_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their disputes" ON dba_disputes
  FOR SELECT USING (
    client_id = auth.uid() OR freelancer_id = auth.uid()
  );

CREATE POLICY "Clients can create disputes" ON dba_disputes
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Participants can update disputes" ON dba_disputes
  FOR UPDATE USING (
    client_id = auth.uid() OR freelancer_id = auth.uid()
  );

-- Function to calculate risk level from combined score
CREATE OR REPLACE FUNCTION calculate_dba_risk_level(combined_score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF combined_score < 45 THEN
    RETURN 'safe';
  ELSIF combined_score <= 70 THEN
    RETURN 'doubtful';
  ELSE
    RETURN 'high_risk';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get freelancer DBA score for a job category
CREATE OR REPLACE FUNCTION get_freelancer_dba_score(
  p_freelancer_id UUID,
  p_job_category_id UUID
) RETURNS INTEGER AS $$
DECLARE
  freelancer_score INTEGER := 0;
BEGIN
  SELECT COALESCE(total_score, 0)
  INTO freelancer_score
  FROM freelancer_dba_completions
  WHERE freelancer_id = p_freelancer_id 
    AND job_category_id = p_job_category_id
    AND is_completed = true;
    
  RETURN freelancer_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update assessment timestamps
CREATE OR REPLACE FUNCTION update_assessment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assessment_timestamp
  BEFORE UPDATE ON booking_dba_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_timestamp();

COMMENT ON TABLE client_dba_answers IS 'Stores client answers to DBA questions for each booking';
COMMENT ON TABLE booking_dba_assessments IS 'Stores combined DBA risk assessments for bookings';
COMMENT ON TABLE dba_disputes IS 'Tracks DBA-related disputes between clients and freelancers';






