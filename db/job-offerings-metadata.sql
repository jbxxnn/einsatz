-- Add metadata column to freelancer_job_offerings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'freelancer_job_offerings' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.freelancer_job_offerings ADD COLUMN metadata JSONB DEFAULT NULL;
    END IF;
END
$$;

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Freelancers can update their own job offerings" ON "public"."freelancer_job_offerings";

-- Create a new policy with the correct syntax
CREATE POLICY "Freelancers can update their own job offerings" 
ON "public"."freelancer_job_offerings" 
FOR UPDATE 
USING (auth.uid() = freelancer_id)
WITH CHECK (auth.uid() = freelancer_id);

COMMENT ON COLUMN public.freelancer_job_offerings.metadata IS 'Additional metadata for job offerings';

