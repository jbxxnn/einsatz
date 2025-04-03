-- Add category_id to bookings table
ALTER TABLE bookings
ADD COLUMN category_id UUID REFERENCES job_categories(id);

-- Update existing bookings to use the first category of the freelancer if available
UPDATE bookings
SET category_id = (
  SELECT category_id
  FROM freelancer_job_offerings
  WHERE freelancer_id = bookings.freelancer_id
  LIMIT 1
);

