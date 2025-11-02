-- Create booking_request_status enum
CREATE TYPE booking_request_status AS ENUM ('pending', 'under_review', 'counter_offered', 'accepted', 'rejected', 'expired', 'converted_to_booking');

-- Create booking_requests table
CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  
  -- Client's initial request details
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  preferred_date DATE,
  preferred_start_time TIME,
  preferred_end_time TIME,
  budget_amount DECIMAL(10, 2),
  budget_is_flexible BOOLEAN DEFAULT true,
  images JSONB DEFAULT '[]'::jsonb,
  additional_notes TEXT,
  
  -- Request status
  status booking_request_status NOT NULL DEFAULT 'pending',
  
  -- Freelancer's response (if counter-offered)
  freelancer_response_description TEXT,
  freelancer_proposed_date DATE,
  freelancer_proposed_start_time TIME,
  freelancer_proposed_end_time TIME,
  freelancer_proposed_rate DECIMAL(10, 2),
  freelancer_proposed_total DECIMAL(10, 2),
  freelancer_response_notes TEXT,
  
  -- Metadata
  viewed_by_freelancer BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE,
  freelancer_responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- If converted to booking, link to it
  converted_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_booking_requests_freelancer_id ON booking_requests(freelancer_id);
CREATE INDEX idx_booking_requests_client_id ON booking_requests(client_id);
CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_booking_requests_category_id ON booking_requests(category_id);
CREATE INDEX idx_booking_requests_created_at ON booking_requests(created_at DESC);

-- Add comment
COMMENT ON TABLE booking_requests IS 'Custom offer requests from clients for wildcard services. Allows negotiation before booking creation.';



