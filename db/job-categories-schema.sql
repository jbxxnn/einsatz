-- Create job categories table
CREATE TABLE job_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create freelancer job offerings table
CREATE TABLE freelancer_job_offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10, 2),
  fixed_rate DECIMAL(10, 2),
  is_available_now BOOLEAN DEFAULT FALSE,
  description TEXT,
  experience_years DECIMAL(3, 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(freelancer_id, category_id)
);

-- Create availability schedules table
CREATE TABLE availability_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create real-time availability table
CREATE TABLE real_time_availability (
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  is_available_now BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (freelancer_id, category_id)
);

-- Add updated_at triggers
CREATE TRIGGER update_job_categories_updated_at
BEFORE UPDATE ON job_categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_freelancer_job_offerings_updated_at
BEFORE UPDATE ON freelancer_job_offerings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_availability_schedules_updated_at
BEFORE UPDATE ON availability_schedules
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert some default job categories
INSERT INTO job_categories (name, description, icon) VALUES
('Heavy Lifting', 'Moving furniture, equipment, or other heavy items', 'weight'),
('Driving', 'Transportation services with your own vehicle', 'car'),
('Delivery', 'Package and food delivery services', 'package'),
('Cleaning', 'Residential or commercial cleaning services', 'spray-can'),
('Handyman', 'General repairs and maintenance', 'tool'),
('Tech Support', 'Computer and technology assistance', 'laptop'),
('Event Staff', 'Assistance with events and gatherings', 'users'),
('Gardening', 'Lawn care and garden maintenance', 'flower'),
('Pet Care', 'Dog walking, pet sitting, and other animal care', 'paw');

-- Set up RLS policies
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_job_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_availability ENABLE ROW LEVEL SECURITY;

-- Job categories policies (anyone can view)
CREATE POLICY "Anyone can view job categories"
ON job_categories FOR SELECT USING (true);

-- Freelancer job offerings policies
CREATE POLICY "Anyone can view freelancer job offerings"
ON freelancer_job_offerings FOR SELECT USING (true);

CREATE POLICY "Freelancers can manage their own job offerings"
ON freelancer_job_offerings FOR ALL USING (
  freelancer_id = auth.uid()
);

-- Availability schedules policies
CREATE POLICY "Anyone can view availability schedules"
ON availability_schedules FOR SELECT USING (true);

CREATE POLICY "Freelancers can manage their own availability schedules"
ON availability_schedules FOR ALL USING (
  freelancer_id = auth.uid()
);

-- Real-time availability policies
CREATE POLICY "Anyone can view real-time availability"
ON real_time_availability FOR SELECT USING (true);

CREATE POLICY "Freelancers can manage their own real-time availability"
ON real_time_availability FOR ALL USING (
  freelancer_id = auth.uid()
);

