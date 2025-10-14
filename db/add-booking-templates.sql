-- Add booking templates table for clients to save and reuse booking information
CREATE TABLE IF NOT EXISTS booking_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  location text,
  description text,
  images jsonb DEFAULT '[]'::jsonb,
  preferred_start_time time,
  preferred_end_time time,
  payment_method text CHECK (payment_method IN ('online', 'offline')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_templates_client_id ON booking_templates(client_id);

-- Add RLS policies
ALTER TABLE booking_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own templates
CREATE POLICY "Clients can view own templates"
  ON booking_templates
  FOR SELECT
  USING (auth.uid() = client_id);

-- Policy: Clients can insert their own templates
CREATE POLICY "Clients can create own templates"
  ON booking_templates
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Policy: Clients can update their own templates
CREATE POLICY "Clients can update own templates"
  ON booking_templates
  FOR UPDATE
  USING (auth.uid() = client_id);

-- Policy: Clients can delete their own templates
CREATE POLICY "Clients can delete own templates"
  ON booking_templates
  FOR DELETE
  USING (auth.uid() = client_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_templates_updated_at
  BEFORE UPDATE ON booking_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_templates_updated_at();

