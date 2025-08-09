-- Add display_order column to freelancer_job_offerings table
ALTER TABLE freelancer_job_offerings 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Create index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_freelancer_job_offerings_display_order 
ON freelancer_job_offerings(display_order);

-- Update existing records to have a display_order based on created_at
UPDATE freelancer_job_offerings 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY freelancer_id ORDER BY created_at ASC) as row_num
  FROM freelancer_job_offerings
) subquery
WHERE freelancer_job_offerings.id = subquery.id 
AND freelancer_job_offerings.display_order IS NULL;

