-- Create a table for global availability settings
CREATE TABLE IF NOT EXISTS public.freelancer_global_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('weekly', 'biweekly', 'monthly')),
  recurrence_end_date TIMESTAMPTZ,
  certainty_level TEXT DEFAULT 'guaranteed' CHECK (certainty_level IN ('guaranteed', 'tentative')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a table to track which job types use global availability
CREATE TABLE IF NOT EXISTS public.job_offering_availability_settings (
  freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_offering_id UUID NOT NULL REFERENCES public.freelancer_job_offerings(id) ON DELETE CASCADE,
  use_global_availability BOOLEAN DEFAULT true,
  PRIMARY KEY (freelancer_id, job_offering_id)
);

-- Add RLS policies
ALTER TABLE public.freelancer_global_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offering_availability_settings ENABLE ROW LEVEL SECURITY;

-- Policies for freelancer_global_availability
CREATE POLICY "Freelancers can manage their own global availability"
  ON public.freelancer_global_availability
  FOR ALL
  USING (auth.uid() = freelancer_id);

-- Policies for job_offering_availability_settings
CREATE POLICY "Freelancers can manage their own job offering settings"
  ON public.job_offering_availability_settings
  FOR ALL
  USING (auth.uid() = freelancer_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_global_availability_freelancer_id ON public.freelancer_global_availability(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_job_offering_settings_freelancer_id ON public.job_offering_availability_settings(freelancer_id);
