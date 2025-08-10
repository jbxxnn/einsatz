-- DBA Post-Booking Dispute Resolution System
-- This script adds the necessary tables and updates for post-booking dispute resolution

-- Add booking status enum for dispute handling
DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM (
        'pending_payment',           -- Default existing status
        'payment_completed',         -- Payment done, waiting for freelancer
        'pending_freelancer_review', -- Freelancer needs to see booking/disputes
        'dispute_resolution',        -- Active dispute resolution in progress
        'pending_acceptance',        -- Disputes resolved, waiting acceptance
        'active',                   -- Accepted and work can begin
        'completed',                -- Work finished
        'cancelled'                 -- Booking cancelled
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add dispute resolution status to existing bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_status booking_status_enum DEFAULT 'pending_payment',
ADD COLUMN IF NOT EXISTS has_dba_disputes BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dba_disputes_resolved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dispute_resolution_deadline TIMESTAMP WITH TIME ZONE;

-- Table for storing individual question disputes
CREATE TABLE IF NOT EXISTS dba_question_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    question_group_id UUID NOT NULL REFERENCES dba_question_groups(id),
    freelancer_answer TEXT NOT NULL,
    client_answer TEXT NOT NULL,
    dispute_severity TEXT NOT NULL CHECK (dispute_severity IN ('minor', 'moderate', 'critical')),
    resolution_status TEXT NOT NULL DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'negotiating', 'resolved', 'accepted_difference')),
    resolved_answer TEXT, -- Final agreed answer
    resolution_method TEXT CHECK (resolution_method IN ('freelancer_accepted', 'client_accepted', 'negotiated', 'agreed_difference')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for dispute resolution messages/communication
CREATE TABLE IF NOT EXISTS dba_dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES dba_question_disputes(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'freelancer')),
    sender_id UUID NOT NULL, -- client_id or freelancer_id
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'answer_proposal', 'acceptance', 'rejection')),
    message_content TEXT NOT NULL,
    proposed_answer TEXT, -- If message_type is 'answer_proposal'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for overall dispute resolution summary
CREATE TABLE IF NOT EXISTS dba_booking_dispute_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    total_disputes INTEGER NOT NULL DEFAULT 0,
    critical_disputes INTEGER NOT NULL DEFAULT 0,
    moderate_disputes INTEGER NOT NULL DEFAULT 0,
    minor_disputes INTEGER NOT NULL DEFAULT 0,
    resolved_disputes INTEGER NOT NULL DEFAULT 0,
    resolution_progress DECIMAL(3,2) DEFAULT 0.00, -- Percentage 0.00-1.00
    all_disputes_resolved BOOLEAN DEFAULT FALSE,
    client_acknowledged BOOLEAN DEFAULT FALSE,
    freelancer_acknowledged BOOLEAN DEFAULT FALSE,
    resolution_started_at TIMESTAMP WITH TIME ZONE,
    resolution_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dba_question_disputes_booking ON dba_question_disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_dba_question_disputes_status ON dba_question_disputes(resolution_status);
CREATE INDEX IF NOT EXISTS idx_dba_dispute_messages_booking ON dba_dispute_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_dba_dispute_messages_dispute ON dba_dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_disputes ON bookings(has_dba_disputes, dba_disputes_resolved);

-- Function to update dispute summary when individual disputes change
CREATE OR REPLACE FUNCTION update_dispute_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the summary for this booking
    INSERT INTO dba_booking_dispute_summary (
        booking_id, total_disputes, critical_disputes, moderate_disputes, minor_disputes, resolved_disputes
    )
    SELECT 
        NEW.booking_id,
        COUNT(*) as total_disputes,
        COUNT(*) FILTER (WHERE dispute_severity = 'critical') as critical_disputes,
        COUNT(*) FILTER (WHERE dispute_severity = 'moderate') as moderate_disputes,
        COUNT(*) FILTER (WHERE dispute_severity = 'minor') as minor_disputes,
        COUNT(*) FILTER (WHERE resolution_status = 'resolved') as resolved_disputes
    FROM dba_question_disputes 
    WHERE booking_id = NEW.booking_id
    GROUP BY booking_id
    ON CONFLICT (booking_id) 
    DO UPDATE SET
        total_disputes = EXCLUDED.total_disputes,
        critical_disputes = EXCLUDED.critical_disputes,
        moderate_disputes = EXCLUDED.moderate_disputes,
        minor_disputes = EXCLUDED.minor_disputes,
        resolved_disputes = EXCLUDED.resolved_disputes,
        resolution_progress = CASE 
            WHEN EXCLUDED.total_disputes = 0 THEN 1.00
            ELSE EXCLUDED.resolved_disputes::DECIMAL / EXCLUDED.total_disputes
        END,
        all_disputes_resolved = (EXCLUDED.resolved_disputes = EXCLUDED.total_disputes),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update summary
DROP TRIGGER IF EXISTS trigger_update_dispute_summary ON dba_question_disputes;
CREATE TRIGGER trigger_update_dispute_summary
    AFTER INSERT OR UPDATE OR DELETE ON dba_question_disputes
    FOR EACH ROW EXECUTE FUNCTION update_dispute_summary();

-- Add RLS policies for security
ALTER TABLE dba_question_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dba_dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dba_booking_dispute_summary ENABLE ROW LEVEL SECURITY;

-- Policies for dba_question_disputes
CREATE POLICY "Users can view disputes for their bookings" ON dba_question_disputes
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM bookings 
            WHERE client_id = auth.uid() OR freelancer_id = auth.uid()
        )
    );

CREATE POLICY "Users can update disputes for their bookings" ON dba_question_disputes
    FOR UPDATE USING (
        booking_id IN (
            SELECT id FROM bookings 
            WHERE client_id = auth.uid() OR freelancer_id = auth.uid()
        )
    );

-- Policies for dba_dispute_messages
CREATE POLICY "Users can view messages for their bookings" ON dba_dispute_messages
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM bookings 
            WHERE client_id = auth.uid() OR freelancer_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages for their bookings" ON dba_dispute_messages
    FOR INSERT WITH CHECK (
        booking_id IN (
            SELECT id FROM bookings 
            WHERE client_id = auth.uid() OR freelancer_id = auth.uid()
        )
    );

-- Policies for dba_booking_dispute_summary
CREATE POLICY "Users can view dispute summary for their bookings" ON dba_booking_dispute_summary
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM bookings 
            WHERE client_id = auth.uid() OR freelancer_id = auth.uid()
        )
    );

-- Show current state
SELECT 'Database schema updated for post-booking dispute resolution' as status;

