-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user types enum
CREATE TYPE user_type AS ENUM ('client', 'freelancer');

-- Create booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'disputed');

-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded');

-- Create invoice status enum
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  hourly_rate DECIMAL(10, 2),
  location TEXT,
  availability JSONB,
  phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  service_radius INTEGER DEFAULT 10,
  formatted_address TEXT,
  wildcard_categories JSONB,
  wildcard_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job categories table
CREATE TABLE job_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job subcategories table
CREATE TABLE job_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Create freelancer job offerings table
CREATE TABLE freelancer_job_offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES job_subcategories(id) ON DELETE SET NULL,
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
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
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

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  payment_intent_id TEXT,
  payment_method TEXT DEFAULT 'platform',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);

-- Create indexes
CREATE INDEX idx_profiles_latitude ON public.profiles (latitude);
CREATE INDEX idx_profiles_longitude ON public.profiles (longitude);

-- Create function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION := 3959;
  dLat DOUBLE PRECISION;
  dLon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
  d DOUBLE PRECISION;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  lat1 := radians(lat1);
  lat2 := radians(lat2);
  a := sin(dLat/2) * sin(dLat/2) + sin(dLon/2) * sin(dLon/2) * cos(lat1) * cos(lat2);
  c := 2 * asin(sqrt(a));
  d := R * c;
  RETURN d;
END;
$$ LANGUAGE plpgsql;

-- Create function to find freelancers within radius
CREATE OR REPLACE FUNCTION find_freelancers_within_radius(
  search_lat DOUBLE PRECISION,
  search_lon DOUBLE PRECISION,
  search_radius DOUBLE PRECISION
) RETURNS TABLE (
  id TEXT,
  distance DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    calculate_distance(search_lat, search_lon, p.latitude, p.longitude) AS distance
  FROM 
    profiles p
  WHERE 
    p.user_type = 'freelancer'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND p.latitude BETWEEN (search_lat - search_radius/69) AND (search_lat + search_radius/69)
    AND p.longitude BETWEEN (search_lon - search_radius/69) AND (search_lon + search_radius/69)
    AND calculate_distance(search_lat, search_lon, p.latitude, p.longitude) <= search_radius;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, user_type)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'user_type'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_job_categories_updated_at
  BEFORE UPDATE ON job_categories
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_freelancer_job_offerings_updated_at
  BEFORE UPDATE ON freelancer_job_offerings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_availability_schedules_updated_at
  BEFORE UPDATE ON availability_schedules
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_job_subcategories_updated_at
  BEFORE UPDATE ON job_subcategories
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Set up Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_job_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_availability ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow handle_new_user to create profiles"
  ON profiles FOR INSERT
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" 
  ON bookings FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = freelancer_id
  );

CREATE POLICY "Clients can create bookings" 
  ON bookings FOR INSERT WITH CHECK (
    auth.uid() = client_id
  );

CREATE POLICY "Users can update their own bookings" 
  ON bookings FOR UPDATE USING (
    auth.uid() = client_id OR 
    auth.uid() = freelancer_id
  );

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" 
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" 
  ON reviews FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
  );

CREATE POLICY "Users can update their own reviews" 
  ON reviews FOR UPDATE USING (
    auth.uid() = reviewer_id
  );

-- Invoices policies
CREATE POLICY "Users can view their own invoices" 
  ON invoices FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = freelancer_id
  );

CREATE POLICY "Freelancers can create invoices" 
  ON invoices FOR INSERT WITH CHECK (
    auth.uid() = freelancer_id
  );

CREATE POLICY "Freelancers can update their invoices" 
  ON invoices FOR UPDATE USING (
    auth.uid() = freelancer_id
  );

-- Job categories policies
CREATE POLICY "Anyone can view job categories"
  ON job_categories FOR SELECT USING (true);

-- Job subcategories policies
CREATE POLICY "Anyone can view job subcategories"
  ON job_subcategories FOR SELECT USING (true);

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

-- Storage policies
CREATE POLICY "Allow uploads for authenticated users"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner);