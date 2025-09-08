-- Add pricing type support and job_offering_packages table for multi-package pricing system
-- This allows freelancers to choose between fixed hourly rate or multiple service packages for each job offering

-- First, add pricing_type column to freelancer_job_offerings table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'freelancer_job_offerings' 
        AND column_name = 'pricing_type'
    ) THEN
        ALTER TABLE public.freelancer_job_offerings 
        ADD COLUMN pricing_type text NOT NULL DEFAULT 'hourly' 
        CHECK (pricing_type IN ('hourly', 'packages'));
        
        -- Add comment explaining the pricing types
        COMMENT ON COLUMN public.freelancer_job_offerings.pricing_type IS 'Pricing model: hourly (fixed hourly rate) or packages (multiple service packages)';
    END IF;
END $$;

-- Create job_offering_packages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.job_offering_packages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_offering_id uuid NOT NULL,
  package_name text NOT NULL,
  short_description text,
  price numeric NOT NULL,
  display_order integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_offering_packages_pkey PRIMARY KEY (id),
  CONSTRAINT job_offering_packages_job_offering_id_fkey FOREIGN KEY (job_offering_id) REFERENCES public.freelancer_job_offerings(id) ON DELETE CASCADE
);

-- Add indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_job_offering_packages_job_offering_id ON public.job_offering_packages(job_offering_id);
CREATE INDEX IF NOT EXISTS idx_job_offering_packages_display_order ON public.job_offering_packages(job_offering_id, display_order);
CREATE INDEX IF NOT EXISTS idx_job_offering_packages_active ON public.job_offering_packages(is_active) WHERE is_active = true;

-- Add RLS policies
ALTER TABLE public.job_offering_packages ENABLE ROW LEVEL SECURITY;

-- Policy: Freelancers can manage their own packages (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_offering_packages' 
        AND policyname = 'Freelancers can manage their own packages'
    ) THEN
        CREATE POLICY "Freelancers can manage their own packages" ON public.job_offering_packages
          FOR ALL USING (
            job_offering_id IN (
              SELECT id FROM public.freelancer_job_offerings 
              WHERE freelancer_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Policy: Anyone can view active packages (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_offering_packages' 
        AND policyname = 'Anyone can view active packages'
    ) THEN
        CREATE POLICY "Anyone can view active packages" ON public.job_offering_packages
          FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_offering_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_job_offering_packages_updated_at'
    ) THEN
        CREATE TRIGGER update_job_offering_packages_updated_at
          BEFORE UPDATE ON public.job_offering_packages
          FOR EACH ROW
          EXECUTE FUNCTION update_job_offering_packages_updated_at();
    END IF;
END $$;

-- Add comment explaining the table
COMMENT ON TABLE public.job_offering_packages IS 'Stores multiple service packages for each job offering, allowing freelancers to offer different pricing tiers';
COMMENT ON COLUMN public.job_offering_packages.package_name IS 'Name of the service package (e.g., "Basic Logo Design", "Premium Brand Package")';
COMMENT ON COLUMN public.job_offering_packages.short_description IS 'Brief description of what the package includes';
COMMENT ON COLUMN public.job_offering_packages.price IS 'Price for this package (can be fixed price or hourly rate)';
COMMENT ON COLUMN public.job_offering_packages.display_order IS 'Order in which packages are displayed (for drag & drop)';
COMMENT ON COLUMN public.job_offering_packages.is_active IS 'Whether this package is currently available for booking';
